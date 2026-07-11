import { Module } from '@nestjs/common';
import { ServiceResolver } from './service.resolver';
import { ServiceService } from './service.service';
import { MongooseModule } from '@nestjs/mongoose';
import ServiceSchema from '../../schemas/Service.model';
import SalonSchema from '../../schemas/Salon.model';
import { AuthModule } from '../auth/auth.module';
import { ViewModule } from '../view/view.module';
import { MemberModule } from '../member/member.module';
import { LikeModule } from '../like/like.module';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: 'Service', schema: ServiceSchema }]),
        MongooseModule.forFeature([{ name: 'Salon', schema: SalonSchema }]),
        AuthModule,
        ViewModule,
        MemberModule,
        LikeModule,
    ],
    providers: [ServiceResolver, ServiceService],
    exports: [ServiceService],
})
export class ServiceModule { }