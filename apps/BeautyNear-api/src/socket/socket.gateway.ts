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
import { AuthService } from '../components/auth/auth.service';
import { Member } from '../libs/dto/member/member';
import { NotificationGroup, NotificationStatus, NotificationType } from '../libs/enums/notification.enum';

interface AuthenticatedClient extends WebSocket {
  memberId?: string;
}

// ── CHAT (Nestar asl mantig'i) ──────────────────────────────────────────────
interface MessagePayload {
  event: string;
  text: string;
  memberData: Member | null;
}

interface InfoPayload {
  event: string;
  totalClients: number;
  memberData: Member | null;
  action: string;
}

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

  // ── CHAT uchun holat (Nestar'dagi kabi) ──
  private clientsAuthMap = new Map<WebSocket, Member | null>();
  private messagesList: MessagePayload[] = [];

  // ── NOTIFICATION uchun holat (BeautyNear'da qo'shilgan) ──
  private connectedClients: Map<string, AuthenticatedClient> = new Map();

  constructor(
    private readonly authService: AuthService,
    @InjectModel('Notification') private readonly notificationModel: Model<any>,
    @InjectModel('Follow') private readonly followModel: Model<any>,
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

    // ⚠️ TUZATILDI: BeautyNear'ning notification tizimi uchun ham
    // memberId → client bog'lanishi saqlanadi (Nestar'da bu yo'q edi,
    // lekin bizga follow/like/booking bildirishnomalari uchun kerak)
    if (authMember?._id) {
      client.memberId = authMember._id.toString();
      this.connectedClients.set(client.memberId, client);
    }

    this.logger.log(`Connection [${clientNick}] & total: ${this.summaryClient} ==`);

    const infoMsg: InfoPayload = {
      event: 'info',
      totalClients: this.summaryClient,
      memberData: authMember,
      action: 'joined',
    };
    this.emitMessage(infoMsg);

    // Yangi ulangan clientga oxirgi 5 ta xabarni yuboramiz
    client.send(JSON.stringify({ event: 'getMessages', list: this.messagesList }));
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

    const infoMsg: InfoPayload = {
      event: 'info',
      totalClients: this.summaryClient,
      memberData: authMember,
      action: 'left',
    };
    this.broadcastMessage(client, infoMsg);
  }

  // Ommaviy jonli chat xabari (Nestar asl mantig'i)
  @SubscribeMessage('message')
  public async handleMessage(client: AuthenticatedClient, payload: string): Promise<void> {
    const authMember = this.clientsAuthMap.get(client) ?? null;
    const newMessage: MessagePayload = {
      event: 'message',
      text: payload,
      memberData: authMember,
    };
    const clientNick: string = authMember?.memberNick ?? 'Guest';

    this.logger.log(`NEW MESSAGE [${clientNick}]: ${payload}`);

    this.messagesList.push(newMessage);
    if (this.messagesList.length > 5) this.messagesList.splice(0, this.messagesList.length - 5);

    this.emitMessage(newMessage);
  }

  private broadcastMessage(sender: WebSocket, message: InfoPayload | MessagePayload) {
    this.server.clients.forEach((client) => {
      if (client !== sender && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }

  private emitMessage(message: InfoPayload | MessagePayload) {
    this.server.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
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
    await this.emitNotification(
      followingId,
      NotificationType.FOLLOW,
      NotificationGroup.MEMBER,
      'You have a new follower',
      undefined,
      followerId,
    );
  }

  public async notifyLike(
    authorId: ObjectId,
    receiverId: ObjectId,
    group: NotificationGroup,
    title: string,
  ): Promise<void> {
    await this.emitNotification(
      receiverId,
      NotificationType.LIKE,
      group,
      title,
      undefined,
      authorId,
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
}