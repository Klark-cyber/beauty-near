import { Module } from '@nestjs/common';
import { SocketGateway } from './socket.gateway';
import { MongooseModule } from '@nestjs/mongoose';
import NotificationSchema from '../schemas/Notification.model';
import FollowSchema from '../schemas/Follow.model';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Notification', schema: NotificationSchema },
      { name: 'Follow', schema: FollowSchema },
    ]),
  ],
  providers: [SocketGateway],
  exports: [SocketGateway], // boshqa modulelar inject qilishi uchun
})
export class SocketModule { }