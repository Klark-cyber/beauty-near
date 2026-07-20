import { Field, InputType, Int } from '@nestjs/graphql';
import { IsIn, IsNotEmpty, IsOptional, Length, Min } from 'class-validator';
import * as mongoose from 'mongoose';
import { BookingStatus, PaymentStatus } from '../../enums/booking.enum';
import { Direction } from '../../enums/common.enum';
import { availableBookingSorts } from '../../config';

@InputType()
export class BookingInput {
    @IsNotEmpty()
    @Field(() => Date)
    bookingDate: Date;

    @IsNotEmpty()
    @Field(() => String)
    bookingTime: string; // "14:00"

    @IsOptional()
    @Length(0, 200)
    @Field(() => String, { nullable: true })
    bookingNote?: string;

    @IsNotEmpty()
    @Field(() => String)
    serviceId: mongoose.ObjectId;

    @IsNotEmpty()
    @Field(() => String)
    salonId: mongoose.ObjectId;

    // paymentKey TossPayments dan keladi, frontenddan qo'shiladi
    @IsNotEmpty()
    @Field(() => String)
    paymentKey: string;

    memberId?: mongoose.ObjectId; // AuthMember dekorator orqali qo'shiladi
}

// User o'z bookinglarini ko'rish uchun
@InputType()
class BISearch {
    @IsOptional()
    @Field(() => BookingStatus, { nullable: true })
    bookingStatus?: BookingStatus;

    // ⚠️ YANGI — mijozning shu salondagi bronlarini olish uchun
    @IsOptional()
    @Field(() => String, { nullable: true })
    salonId?: string;

    // ⚠️ YANGI — mijozning shu xizmatga tegishli bronlarini olish uchun
    @IsOptional()
    @Field(() => String, { nullable: true })
    serviceId?: string;
}

@InputType()
export class BookingsInquiry {
    @IsNotEmpty()
    @Min(1)
    @Field(() => Int)
    page: number;

    @IsNotEmpty()
    @Min(1)
    @Field(() => Int)
    limit: number;

    @IsOptional()
    @IsIn(availableBookingSorts)
    @Field(() => String, { nullable: true })
    sort?: string;

    @IsOptional()
    @Field(() => Direction, { nullable: true })
    direction?: Direction;

    @IsNotEmpty()
    @Field(() => BISearch)
    search: BISearch;
}

// Agent o'z saloniga kelgan bookinglarni boshqarish uchun
@InputType()
class ABISearch {
    @IsOptional()
    @Field(() => BookingStatus, { nullable: true })
    bookingStatus?: BookingStatus;

    @IsOptional()
    @Field(() => String, { nullable: true })
    salonId?: mongoose.ObjectId;
}

@InputType()
export class AgentBookingsInquiry {
    @IsNotEmpty()
    @Min(1)
    @Field(() => Int)
    page: number;

    @IsNotEmpty()
    @Min(1)
    @Field(() => Int)
    limit: number;

    @IsOptional()
    @IsIn(availableBookingSorts)
    @Field(() => String, { nullable: true })
    sort?: string;

    @IsOptional()
    @Field(() => Direction, { nullable: true })
    direction?: Direction;

    @IsNotEmpty()
    @Field(() => ABISearch)
    search: ABISearch;
}