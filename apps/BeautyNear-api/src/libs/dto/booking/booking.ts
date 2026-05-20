import { Field, Int, ObjectType } from '@nestjs/graphql';
import * as mongoose from 'mongoose';
import { BookingStatus, PaymentStatus } from '../../enums/booking.enum';
import { Member, TotalCounter } from '../member/member';
import { Salon } from '../salon/salon';
import { Service } from '../service/service';

@ObjectType()
export class Booking {
    @Field(() => String)
    _id: mongoose.Types.ObjectId;

    @Field(() => BookingStatus)
    bookingStatus: BookingStatus;

    @Field(() => Date)
    bookingDate: Date;

    @Field(() => String)
    bookingTime: string;

    @Field(() => String, { nullable: true })
    bookingNote?: string;

    @Field(() => Int)
    totalAmount: number;

    @Field(() => Int)
    depositAmount: number;

    @Field(() => Int)
    remainAmount: number;

    @Field(() => String, { nullable: true })
    paymentKey?: string;

    @Field(() => PaymentStatus)
    paymentStatus: PaymentStatus;

    @Field(() => String)
    serviceId: mongoose.ObjectId;

    @Field(() => String)
    salonId: mongoose.ObjectId;

    @Field(() => String)
    memberId: mongoose.ObjectId;

    @Field(() => Date, { nullable: true })
    deletedAt?: Date;

    @Field(() => Date)
    createdAt: Date;

    @Field(() => Date)
    updatedAt: Date;

    /** from aggregation **/
    @Field(() => Member, { nullable: true })
    memberData?: Member;

    @Field(() => Salon, { nullable: true })
    salonData?: Salon;

    @Field(() => Service, { nullable: true })
    serviceData?: Service;
}

@ObjectType()
export class Bookings {
    @Field(() => [Booking])
    list: Booking[];

    @Field(() => [TotalCounter], { nullable: true })
    metaCounter: TotalCounter[];
}