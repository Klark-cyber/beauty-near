import { Logger } from '@nestjs/common';
import { OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'ws';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { NotificationGroup, NotificationStatus, NotificationType } from '../libs/enums/notification.enum';

interface AuthenticatedClient extends WebSocket {
  memberId?: string; // login qilgan userning id si
}

@WebSocketGateway({ transports: ['websocket'], secure: false })
export class SocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  private server: Server;

  private logger: Logger = new Logger('SocketGateway');
  private summaryClient: number = 0;

  // memberId → client mapping (bir user bir socket)
  private connectedClients: Map<string, AuthenticatedClient> = new Map();

  constructor(
    @InjectModel('Notification') private readonly notificationModel: Model<any>,
    @InjectModel('Follow') private readonly followModel: Model<any>,
  ) { }

  public afterInit(server: Server) {
    this.logger.log(`WebSocket Server Initialized`);
  }

  public handleConnection(client: AuthenticatedClient, ...args: any[]) {
    this.summaryClient++;
    this.logger.log(`== Client connected total: ${this.summaryClient} ==`);
  }

  public handleDisconnect(client: AuthenticatedClient) {
    this.summaryClient--;

    // Map dan o'chiramiz
    if (client.memberId) {
      this.connectedClients.delete(client.memberId);
      this.logger.log(`== Client disconnected: ${client.memberId}, left: ${this.summaryClient} ==`);
    }
  }

  // Frontend ulanib, o'zini tanitadi
  @SubscribeMessage('identify')
  public handleIdentify(client: AuthenticatedClient, memberId: string): void {
    client.memberId = memberId;
    this.connectedClients.set(memberId, client);
    this.logger.log(`Client identified: ${memberId}`);
  }

  @SubscribeMessage('message')
  public handleMessage(client: AuthenticatedClient, payload: any): string {
    return 'Hello from BeautyNear!';
  }

  // ── NOTIFICATION YUBORISH ─────────────────────────────────────────────────

  // Bitta userga notification yuborish
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
    // DB ga saqlaymiz
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

    // Real-time yuboramiz — agar online bo'lsa
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

  // Salon followchilariga ommaviy notification (NEW_POST, DISCOUNT, FREE_SLOT)
  public async emitToFollowers(
    salonMemberId: ObjectId,
    notificationType: NotificationType,
    notificationTitle: string,
    notificationDesc?: string,
    salonId?: ObjectId,
  ): Promise<void> {
    // Salon egasining barcha followchilarini topamiz
    const follows = await this.followModel
      .find({ followingId: salonMemberId })
      .select('followerId')
      .exec();

    if (!follows.length) return;

    this.logger.log(`Emitting [${notificationType}] to ${follows.length} followers`);

    // Har bir followchiga notification yuboramiz
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

  // ── TAYYOR METODLAR (boshqa servicelar chaqiradi) ────────────────────────

  // Follow bosilganda
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

  // Like bosilganda
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

  // Booking tasdiqlanganda
  public async notifyBookingConfirmed(memberId: ObjectId, salonTitle: string): Promise<void> {
    await this.emitNotification(
      memberId,
      NotificationType.BOOKING_CONFIRMED,
      NotificationGroup.BOOKING,
      `Your booking at "${salonTitle}" has been confirmed!`,
    );
  }

  // Booking bekor qilinganda
  public async notifyBookingCancelled(memberId: ObjectId, salonTitle: string): Promise<void> {
    await this.emitNotification(
      memberId,
      NotificationType.BOOKING_CANCELLED,
      NotificationGroup.BOOKING,
      `Your booking at "${salonTitle}" has been cancelled`,
    );
  }

  // Agent yangi xizmat qo'shganda → followchilarga
  public async notifyNewPost(salonMemberId: ObjectId, salonTitle: string, salonId: any): Promise<void> {
    await this.emitToFollowers(
      salonMemberId,
      NotificationType.NEW_POST,
      `${salonTitle} added a new service!`,
      'Check out the latest service from your favorite salon',
      salonId,
    );
  }

  // Agent aksiya e'lon qilganda → followchilarga
  public async notifyDiscount(salonMemberId: ObjectId, salonTitle: string, salonId: any): Promise<void> {
    await this.emitToFollowers(
      salonMemberId,
      NotificationType.DISCOUNT,
      `${salonTitle} has a special offer!`,
      'Limited time discount available',
      salonId,
    );
  }

  // Bo'sh vaqt ochilganda → followchilarga
  public async notifyFreeSlot(salonMemberId: ObjectId, salonTitle: string, salonId: any): Promise<void> {
    await this.emitToFollowers(
      salonMemberId,
      NotificationType.FREE_SLOT,
      `${salonTitle} has available slots today!`,
      'Book now before they fill up',
      salonId,
    );
  }

  // Yangi review yozilganda → agent ga
  public async notifyNewReview(agentId: ObjectId, serviceTitle: string): Promise<void> {
    await this.emitNotification(
      agentId,
      NotificationType.NEW_REVIEW,
      NotificationGroup.SERVICE,
      `New review on "${serviceTitle}"`,
    );
  }
}