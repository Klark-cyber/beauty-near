import { Module } from '@nestjs/common';
import { BookingResolver } from './booking.resolver';
import { BookingService } from './booking.service';
import { MongooseModule } from '@nestjs/mongoose';
import BookingSchema from '../../schemas/Booking.model';
import SalonSchema from '../../schemas/Salon.model';
import { AuthModule } from '../auth/auth.module';
import { MemberModule } from '../member/member.module';
import { ServiceModule } from '../service/service.module';
import { SocketModule } from '../../socket/socket.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: 'Booking', schema: BookingSchema },
            { name: 'Salon', schema: SalonSchema },
        ]),
        AuthModule,
        MemberModule,
        ServiceModule,
        SocketModule,
    ],
    providers: [BookingResolver, BookingService],
    exports: [BookingService],
})
export class BookingModule { }