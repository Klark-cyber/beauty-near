import { Module } from '@nestjs/common';
import { SocketGateway } from './socket.gateway';
import { MongooseModule } from '@nestjs/mongoose';
import NotificationSchema from '../schemas/Notification.model';
import FollowSchema from '../schemas/Follow.model';
import MemberSchema from '../schemas/Member.model'; // ⚠️ YANGI — barcha adminlarni topish uchun
import MessageSchema from '../schemas/Message.model'; // ⚠️ YANGI — chat xabarlari doimiy saqlanishi uchun
import { AuthModule } from '../components/auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Notification', schema: NotificationSchema },
      { name: 'Follow', schema: FollowSchema },
      { name: 'Member', schema: MemberSchema },
      { name: 'Message', schema: MessageSchema },
    ]),
    AuthModule,
  ],
  providers: [SocketGateway],
  exports: [SocketGateway], // boshqa modulelar inject qilishi uchun
})
export class SocketModule { }