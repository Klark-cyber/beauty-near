import { Module } from '@nestjs/common';
import { CommentResolver } from './comment.resolver';
import { CommentService } from './comment.service';
import CommentSchema from '../../schemas/Comment.model';
import BookingSchema from '../../schemas/Booking.model';
import ServiceSchema from '../../schemas/Service.model';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { MemberModule } from '../member/member.module';
import { SalonModule } from '../salon/salon.module';
import { BoardArticleModule } from '../board-article/board-article.module';
import { LikeModule } from '../like/like.module'; // ⚠️ YANGI — commentga like uchun
import { SocketModule } from '../../socket/socket.module'; // ⚠️ YANGI — like notification uchun

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Comment', schema: CommentSchema },
      { name: 'Booking', schema: BookingSchema }, // checkCompletedBooking uchun
      { name: 'Service', schema: ServiceSchema },  // serviceComments/rating uchun
    ]),
    AuthModule,
    MemberModule,
    SalonModule,
    BoardArticleModule,
    LikeModule,
    SocketModule,
  ],
  providers: [CommentResolver, CommentService],
})
export class CommentModule { }