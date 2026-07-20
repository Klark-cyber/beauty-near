import { Logger } from '@nestjs/common';
import {
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'ws';
import * as WebSocket from 'ws';
import * as url from 'url';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import * as mongoose from 'mongoose';
import { AuthService } from '../components/auth/auth.service';
import { Member } from '../libs/dto/member/member';
import { NotificationGroup, NotificationStatus, NotificationType } from '../libs/enums/notification.enum';

interface AuthenticatedClient extends WebSocket {
  memberId?: string;
}

// ── CHAT — 1-ga-1 SHAXSIY xabarlashish (avval umumiy ochiq chat edi,
// endi User↔Agent orasida shaxsiy suhbatlarga o'tkazildi, MongoDB'da
// doimiy saqlanadi) ──────────────────────────────────────────────────

// ⚠️ TUZATILDI: avval bu gateway asosiy server bilan BIR XIL portda
// ishlar edi — bu esa Apollo'ning GraphQL subscription WebSocket'i
// (ws://127.0.0.1:3007) bilan to'qnashib, "Invalid message type!"
// xatosiga sabab bo'lardi (chunki chat xabarlari Apollo'ning
// subscription clientiga ham yuborilib qolardi). Endi CHAT uchun
// alohida, mustaqil port ishlatiladi.
const CHAT_PORT = Number(process.env.PORT_CHAT ?? 3008);

@WebSocketGateway(CHAT_PORT, { transports: ['websocket'], secure: false })
export class SocketGateway implements OnGatewayInit {
  @WebSocketServer()
  private server: Server;

  private logger: Logger = new Logger('SocketGateway');
  private summaryClient: number = 0;

  // ── CHAT uchun holat — endi HAR BIR JUFTLIK (User↔Agent) uchun
  // ALOHIDA, faqat ikkalasiga tegishli xabar tarixi (kalit: saralangan
  // "id1_id2" juftligi) ──
  private clientsAuthMap = new Map<WebSocket, Member | null>();
  // ⚠️ TUZATILDI: avval "private conversations = new Map(...)" — bu
  // OPERATIV XOTIRA edi, server qayta ishga tushganda BUTUNLAY
  // yo'qolardi. Endi xabarlar MongoDB'da (messageModel) doimiy saqlanadi.

  // ── NOTIFICATION uchun holat (BeautyNear'da qo'shilgan) ──
  private connectedClients: Map<string, AuthenticatedClient> = new Map();

  constructor(
    private readonly authService: AuthService,
    @InjectModel('Notification') private readonly notificationModel: Model<any>,
    @InjectModel('Follow') private readonly followModel: Model<any>,
    @InjectModel('Member') private readonly memberModel: Model<any>, // ⚠️ YANGI — barcha adminlarni topish uchun
    @InjectModel('Message') private readonly messageModel: Model<any>, // ⚠️ YANGI — chat xabarlari MongoDB'da
  ) { }

  public afterInit(server: Server) {
    this.logger.log(`WebSocket Server Initialized`);
  }

  // Token orqali kim ulanayotganini aniqlash (Nestar asl mantig'i)
  private async retrieveAuth(req: any): Promise<Member | null> {
    try {
      const parseUrl = url.parse(req.url, true);
      const { token } = parseUrl.query;
      return await this.authService.verifyToken(token as string);
    } catch (err) {
      return null;
    }
  }

  public async handleConnection(client: AuthenticatedClient, req: any) {
    const authMember = await this.retrieveAuth(req);
    this.summaryClient++;

    const clientNick: string = authMember?.memberNick ?? 'Guest';
    this.clientsAuthMap.set(client, authMember);

    if (authMember?._id) {
      client.memberId = authMember._id.toString();
      this.connectedClients.set(client.memberId, client);
    }

    this.logger.log(`Connection [${clientNick}] & total: ${this.summaryClient} ==`);
  }

  public handleDisconnect(client: AuthenticatedClient) {
    const authMember = this.clientsAuthMap.get(client) ?? null;
    this.summaryClient--;

    this.clientsAuthMap.delete(client);
    if (client.memberId) {
      this.connectedClients.delete(client.memberId);
    }

    const clientNick: string = authMember?.memberNick ?? 'Guest';
    this.logger.log(`Disconnected [${clientNick}] & total: ${this.summaryClient} ==`);
  }

  // ⚠️ YANGI — foydalanuvchining BARCHA suhbatlari ro'yxati (Messages
  // sahifasi uchun). Endi MongoDB'dan olinadi — server qayta ishga
  // tushsa ham, foydalanuvchi qayta kirsa ham, HAR DOIM saqlanadi
  // (Telegram kabi).
  @SubscribeMessage('getMyConversations')
  public async handleGetMyConversations(client: AuthenticatedClient): Promise<void> {
    if (!client.memberId) return;
    const myObjectId = new mongoose.Types.ObjectId(client.memberId);

    const grouped = await this.messageModel.aggregate([
      { $match: { $or: [{ senderId: myObjectId }, { receiverId: myObjectId }] } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            $cond: [{ $eq: ['$senderId', myObjectId] }, '$receiverId', '$senderId'],
          },
          lastText: { $first: '$messageText' },
          lastAt: { $first: '$createdAt' },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$receiverId', myObjectId] }, { $eq: ['$isRead', false] }] },
                1,
                0,
              ],
            },
          },
        },
      },
      { $sort: { lastAt: -1 } },
    ]);

    const results: any[] = [];
    for (const g of grouped) {
      const otherMember: any = await this.memberModel.findById(g._id).select('memberNick memberImage memberType').lean().exec();
      results.push({
        memberId: g._id.toString(),
        nick: otherMember?.memberNick ?? 'Unknown',
        image: otherMember?.memberImage ?? '',
        memberType: otherMember?.memberType ?? 'USER',
        lastText: g.lastText,
        lastAt: g.lastAt,
        unreadCount: g.unreadCount,
      });
    }

    client.send(JSON.stringify({ event: 'myConversations', data: results }));
  }

  // Ikki kishi orasidagi mavjud xabar tarixini olish (chat oynasi ochilganda)
  @SubscribeMessage('getConversation')
  public async handleGetConversation(client: AuthenticatedClient, payload: { withMemberId: string }): Promise<void> {
    if (!client.memberId || !payload?.withMemberId) return;
    const myId = new mongoose.Types.ObjectId(client.memberId);
    const otherId = new mongoose.Types.ObjectId(payload.withMemberId);

    const list = await this.messageModel
      .find({
        $or: [
          { senderId: myId, receiverId: otherId },
          { senderId: otherId, receiverId: myId },
        ],
      })
      .sort({ createdAt: 1 })
      .limit(200)
      .lean()
      .exec();

    // Frontend kutgan shaklga moslash (_id, senderId, receiverId, text, createdAt)
    const shaped = list.map((m: any) => ({
      _id: m._id.toString(),
      senderId: m.senderId.toString(),
      receiverId: m.receiverId.toString(),
      text: m.messageText,
      createdAt: m.createdAt,
      isRead: m.isRead,
    }));
    client.send(JSON.stringify({ event: 'conversationHistory', data: shaped, withMemberId: payload.withMemberId }));

    // ⚠️ suhbat ochilganda, o'sha odamdan kelgan barcha xabarlar
    // "o'qildi" deb belgilanadi va mos bildirishnoma o'chadi
    const unreadFromThisPerson = await this.messageModel.countDocuments({ senderId: otherId, receiverId: myId, isRead: false });
    await this.messageModel.updateMany({ senderId: otherId, receiverId: myId, isRead: false }, { isRead: true });
    await this.notificationModel.deleteMany({
      notificationType: NotificationType.NEW_MESSAGE,
      authorId: payload.withMemberId,
      receiverId: client.memberId,
    });

    // ⚠️ Message ikonkasi ustidagi belgi ham DARHOL kamayadi
    if (unreadFromThisPerson > 0) {
      client.send(JSON.stringify({ event: 'notification_removed', data: { count: unreadFromThisPerson, notificationType: NotificationType.NEW_MESSAGE } }));
    }
  }

  // Shaxsiy xabar yuborish — FAQAT jo'natuvchi va qabul qiluvchiga boradi
  // (avval HAMMAGA translatsiya qilinardi — bu endi TUZATILDI)
  // ⚠️ YANGI — foydalanuvchi/agent suhbatni butunlay o'chirishni
  // xohlasa (Messages sahifasidan) — ikkala tomon uchun ham o'chadi
  @SubscribeMessage('deleteConversation')
  public async handleDeleteConversation(client: AuthenticatedClient, payload: { withMemberId: string }): Promise<void> {
    if (!client.memberId || !payload?.withMemberId) return;
    const myId = new mongoose.Types.ObjectId(client.memberId);
    const otherId = new mongoose.Types.ObjectId(payload.withMemberId);

    await this.messageModel.deleteMany({
      $or: [
        { senderId: myId, receiverId: otherId },
        { senderId: otherId, receiverId: myId },
      ],
    });

    client.send(JSON.stringify({ event: 'conversationDeleted', data: { withMemberId: payload.withMemberId } }));
  }

  @SubscribeMessage('message')
  public async handleMessage(client: AuthenticatedClient, payload: { receiverId: string; text: string }): Promise<void> {
    if (!client.memberId || !payload?.receiverId || !payload?.text?.trim()) return;
    const authMember = this.clientsAuthMap.get(client) ?? null;

    // ⚠️ TUZATILDI: endi MongoDB'ga DOIMIY saqlanadi (avval faqat
    // operativ xotirada edi, server qayta ishga tushsa yo'qolardi)
    const savedMessage = await this.messageModel.create({
      senderId: new mongoose.Types.ObjectId(client.memberId),
      receiverId: new mongoose.Types.ObjectId(payload.receiverId),
      messageText: payload.text.trim(),
      isRead: false,
    });

    const newMessage = {
      _id: savedMessage._id.toString(),
      senderId: client.memberId,
      receiverId: payload.receiverId,
      text: savedMessage.messageText,
      createdAt: savedMessage.createdAt,
      isRead: false,
    };

    this.logger.log(`DM [${authMember?.memberNick ?? 'Guest'} -> ${payload.receiverId}]: ${payload.text}`);

    // Qabul qiluvchiga (agar hozir online bo'lsa)
    const receiverClient = this.connectedClients.get(payload.receiverId);
    if (receiverClient) {
      receiverClient.send(JSON.stringify({ event: 'message', data: newMessage }));
    }
    // Jo'natuvchining o'ziga ham tasdiq sifatida qaytariladi
    client.send(JSON.stringify({ event: 'message', data: newMessage }));

    // ⚠️ YANGI — qabul qiluvchiga bildirishnoma (User↔Agent ikkalasi ham
    // olishi mumkin). Ketma-ket bir nechta xabar bitta "yangi xabar"
    // bildirishnomasiga birlashishi uchun, avvalgisi almashtiriladi.
    await this.notificationModel.deleteMany({
      notificationType: NotificationType.NEW_MESSAGE,
      authorId: client.memberId,
      receiverId: payload.receiverId,
    });
    await this.emitNotification(
      payload.receiverId as any,
      NotificationType.NEW_MESSAGE,
      NotificationGroup.MEMBER,
      'sent you a message',
      newMessage.text.length > 60 ? `${newMessage.text.slice(0, 60)}...` : newMessage.text,
      client.memberId as any,
    );
  }

  // ── NOTIFICATION TIZIMI (BeautyNear'da qo'shilgan, o'zgarishsiz qoladi) ────

  public async emitNotification(
    receiverId: ObjectId,
    notificationType: NotificationType,
    notificationGroup: NotificationGroup,
    notificationTitle: string,
    notificationDesc?: string,
    authorId?: ObjectId,
    salonId?: ObjectId,
    articleId?: ObjectId,
  ): Promise<void> {
    const notification = await this.notificationModel.create({
      notificationType,
      notificationStatus: NotificationStatus.WAIT,
      notificationGroup,
      notificationTitle,
      notificationDesc: notificationDesc ?? '',
      authorId: authorId ?? null,
      receiverId,
      salonId: salonId ?? null,
      articleId: articleId ?? null,
    });
    console.log(`[emitNotification] YARATILDI: _id=${notification._id}, type=${notificationType}, group=${notificationGroup}, receiverId=${receiverId}`);

    const receiverClient = this.connectedClients.get(receiverId.toString());
    if (receiverClient) {
      receiverClient.send(JSON.stringify({
        event: 'notification',
        data: {
          _id: notification._id,
          notificationType,
          notificationGroup,
          notificationTitle,
          notificationDesc,
          createdAt: notification.createdAt,
        },
      }));
      this.logger.log(`Notification sent to: ${receiverId} [${notificationType}]`);
    }
  }

  public async emitToFollowers(
    salonMemberId: ObjectId,
    notificationType: NotificationType,
    notificationTitle: string,
    notificationDesc?: string,
    salonId?: ObjectId,
  ): Promise<void> {
    const follows = await this.followModel
      .find({ followingId: salonMemberId })
      .select('followerId')
      .exec();

    if (!follows.length) return;

    this.logger.log(`Emitting [${notificationType}] to ${follows.length} followers`);

    await Promise.all(
      follows.map((follow) =>
        this.emitNotification(
          follow.followerId,
          notificationType,
          NotificationGroup.SALON,
          notificationTitle,
          notificationDesc,
          salonMemberId,
          salonId,
        ),
      ),
    );
  }

  public async notifyFollow(followerId: ObjectId, followingId: ObjectId): Promise<void> {
    // ⚠️ YANGI — agar shu ikkalasi orasida AVVAL yaratilgan (masalan
    // follow→unfollow→follow tez-tez takrorlanganda o'chirilmay qolgan)
    // eski FOLLOW bildirishnomasi bo'lsa, YANGISINI yaratishdan OLDIN
    // avval tozalanadi — bu bir xil odamdan bir nechta "yangi follower"
    // xabari yig'ilib qolishining oldini oladi.
    await this.notificationModel.deleteMany({
      notificationType: NotificationType.FOLLOW,
      authorId: followerId,
      receiverId: followingId,
    });

    await this.emitNotification(
      followingId,
      NotificationType.FOLLOW,
      NotificationGroup.MEMBER,
      'started following you',
      undefined,
      followerId,
    );
  }

  // ⚠️ YANGI — agar follower o'z follow'ini bekor qilsa (unfollow),
  // avvalgi "You have a new follower" bildirishnomasi ham o'chiriladi
  public async deleteFollowNotification(followerId: ObjectId, followingId: ObjectId): Promise<void> {
    // ⚠️ TUZATILDI: avval o'chirilgan yozuv "o'qilgan" (READ) yoki
    // "o'qilmagan" (WAIT) ekanligidan qat'iy nazar qo'ng'iroqcha sonini
    // kamaytirar edi — bu, agar foydalanuvchi ALLAQACHON ko'rib chiqqan
    // bo'lsa, sonni NOTO'G'RI kamaytirib yuborardi. Endi faqat hali
    // O'QILMAGAN (WAIT) holatdagi yozuvlar hisobga olinadi.
    const existing = await this.notificationModel.find({
      notificationType: NotificationType.FOLLOW,
      authorId: followerId,
      receiverId: followingId,
    });
    const unreadCount = existing.filter((n) => n.notificationStatus === NotificationStatus.WAIT).length;

    const result = await this.notificationModel.deleteMany({
      notificationType: NotificationType.FOLLOW,
      authorId: followerId,
      receiverId: followingId,
    });
    console.log(`[deleteFollowNotification] authorId=${followerId}, receiverId=${followingId}, deletedCount=${result.deletedCount}, unreadAmongDeleted=${unreadCount}`);

    if (unreadCount > 0) {
      const receiverClient = this.connectedClients.get(followingId.toString());
      if (receiverClient) {
        receiverClient.send(JSON.stringify({ event: 'notification_removed', data: { count: unreadCount } }));
      }
    }
  }

  public async notifyLike(
    authorId: ObjectId,
    receiverId: ObjectId,
    group: NotificationGroup,
    title: string,
    refId?: ObjectId, // ⚠️ YANGI — SALON yoki ARTICLE guruhida, bosilganda qaysi sahifaga borishni bilish uchun
  ): Promise<void> {
    await this.emitNotification(
      receiverId,
      NotificationType.LIKE,
      group,
      title,
      undefined,
      authorId,
      group === NotificationGroup.SALON ? refId : undefined,
      group === NotificationGroup.ARTICLE ? refId : undefined,
    );
  }

  // ⚠️ YANGI — like bosgan odam UNLIKE qilsa, avvalgi "Someone liked..."
  // bildirishnomasi ham o'chadi (Follow bilan bir xil mantiq)
  public async deleteLikeNotification(authorId: ObjectId, receiverId: ObjectId): Promise<void> {
    const existing = await this.notificationModel.find({
      notificationType: NotificationType.LIKE,
      authorId,
      receiverId,
    });
    const unreadCount = existing.filter((n) => n.notificationStatus === NotificationStatus.WAIT).length;

    const result = await this.notificationModel.deleteOne({
      notificationType: NotificationType.LIKE,
      authorId,
      receiverId,
    });
    console.log(`[deleteLikeNotification] authorId=${authorId}, receiverId=${receiverId}, deletedCount=${result.deletedCount}, unreadAmongDeleted=${unreadCount}`);

    if (unreadCount > 0) {
      const receiverClient = this.connectedClients.get(receiverId.toString());
      if (receiverClient) {
        receiverClient.send(JSON.stringify({ event: 'notification_removed', data: { count: unreadCount } }));
      }
    }
  }

  // ⚠️ YANGI — kimdir sizning salon/articlengizga izoh qoldirganda
  // (bu — LIKE emas, alohida COMMENT turi, notifyLike bilan aralashtirmaslik kerak)
  public async notifyComment(
    authorId: ObjectId,
    receiverId: ObjectId,
    group: NotificationGroup,
    title: string,
    refId?: ObjectId,
  ): Promise<void> {
    await this.emitNotification(
      receiverId,
      NotificationType.COMMENT,
      group,
      title,
      undefined,
      authorId,
      group === NotificationGroup.SALON ? refId : undefined,
      group === NotificationGroup.ARTICLE ? refId : undefined,
    );
  }

  public async notifyBookingConfirmed(memberId: ObjectId, salonTitle: string): Promise<void> {
    await this.emitNotification(
      memberId,
      NotificationType.BOOKING_CONFIRMED,
      NotificationGroup.BOOKING,
      `Your booking at "${salonTitle}" has been confirmed!`,
    );
  }

  public async notifyBookingCancelled(memberId: ObjectId, salonTitle: string): Promise<void> {
    await this.emitNotification(
      memberId,
      NotificationType.BOOKING_CANCELLED,
      NotificationGroup.BOOKING,
      `Your booking at "${salonTitle}" has been cancelled`,
    );
  }

  public async notifyNewPost(salonMemberId: ObjectId, salonTitle: string, salonId: any): Promise<void> {
    await this.emitToFollowers(
      salonMemberId,
      NotificationType.NEW_POST,
      `${salonTitle} added a new service!`,
      'Check out the latest service from your favorite salon',
      salonId,
    );
  }

  public async notifyDiscount(salonMemberId: ObjectId, salonTitle: string, salonId: any): Promise<void> {
    await this.emitToFollowers(
      salonMemberId,
      NotificationType.DISCOUNT,
      `${salonTitle} has a special offer!`,
      'Limited time discount available',
      salonId,
    );
  }

  public async notifyFreeSlot(salonMemberId: ObjectId, salonTitle: string, salonId: any): Promise<void> {
    await this.emitToFollowers(
      salonMemberId,
      NotificationType.FREE_SLOT,
      `${salonTitle} has available slots today!`,
      'Book now before they fill up',
      salonId,
    );
  }

  public async notifyNewReview(agentId: ObjectId, serviceTitle: string): Promise<void> {
    await this.emitNotification(
      agentId,
      NotificationType.NEW_REVIEW,
      NotificationGroup.SERVICE,
      `New review on "${serviceTitle}"`,
    );
  }

  // ═══ AGENT uchun yangi bildirishnomalar ═══

  // Mijoz agentning xizmatini bron qilganda — agentning o'ziga (salon egasiga)
  public async notifyNewBooking(agentId: ObjectId, customerId: ObjectId, salonTitle: string, salonId?: ObjectId): Promise<void> {
    await this.emitNotification(
      agentId,
      NotificationType.NEW_BOOKING,
      NotificationGroup.BOOKING,
      `New booking at "${salonTitle}"`,
      'A customer just booked one of your services',
      customerId,
      salonId,
    );
  }

  // Admin hisobni to'xtatganda/bloklaganda — o'sha a'zoning o'ziga
  public async notifyAccountSuspended(memberId: ObjectId): Promise<void> {
    await this.emitNotification(
      memberId,
      NotificationType.ACCOUNT_SUSPENDED,
      NotificationGroup.MEMBER,
      'Your account has been suspended',
      'Please contact support if you believe this is a mistake',
    );
  }

  // Admin USER'ni AGENT'ga o'tkazganda (so'rovni tasdiqlaganda)
  public async notifyAgentApproved(memberId: ObjectId): Promise<void> {
    await this.emitNotification(
      memberId,
      NotificationType.AGENT_APPROVED,
      NotificationGroup.MEMBER,
      'Congratulations! You are now an Agent',
      'You can now add salons and manage your business',
    );
  }

  // ═══ ADMIN uchun yangi bildirishnomalar (barcha adminlarga) ═══

  private async getAllAdminIds(): Promise<ObjectId[]> {
    const admins = await this.memberModel.find({ memberType: 'ADMIN' }).select('_id').exec();
    console.log(`[getAllAdminIds] topilgan adminlar soni: ${admins.length}`, admins.map((a: any) => a._id.toString()));
    return admins.map((a: any) => a._id);
  }

  // User muammo/savol yuborganda — barcha adminlarga
  public async notifyNewInquiry(authorId: ObjectId, inquiryTitle: string): Promise<void> {
    const adminIds = await this.getAllAdminIds();
    await Promise.all(
      adminIds.map((adminId) =>
        this.emitNotification(
          adminId,
          NotificationType.NEW_INQUIRY,
          NotificationGroup.MEMBER,
          'New support inquiry received',
          inquiryTitle,
          authorId,
        ),
      ),
    );
  }

  // User Agent bo'lishni so'raganda — barcha adminlarga
  public async notifyNewAgentRequest(authorId: ObjectId, memberNick: string): Promise<void> {
    const adminIds = await this.getAllAdminIds();
    await Promise.all(
      adminIds.map((adminId) =>
        this.emitNotification(
          adminId,
          NotificationType.NEW_AGENT_REQUEST,
          NotificationGroup.MEMBER,
          'New agent application',
          `${memberNick} has requested to become an agent`,
          authorId,
        ),
      ),
    );
  }
}