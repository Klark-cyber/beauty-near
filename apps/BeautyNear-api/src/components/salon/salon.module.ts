import { Module } from '@nestjs/common';
import { SalonResolver } from './salon.resolver';
import { SalonService } from './salon.service';
import { MongooseModule } from '@nestjs/mongoose';
import SalonSchema from '../../schemas/Salon.model';
import { AuthModule } from '../auth/auth.module';
import { ViewModule } from '../view/view.module';
import { MemberModule } from '../member/member.module';
import { LikeModule } from '../like/like.module';
import { SocketModule } from '../../socket/socket.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Salon', schema: SalonSchema }]),
    AuthModule,
    ViewModule,
    MemberModule,
    LikeModule,
    SocketModule,
  ],
  providers: [SalonResolver, SalonService],
  exports: [SalonService],
})
export class SalonModule { }