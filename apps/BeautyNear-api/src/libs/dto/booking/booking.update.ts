import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, Length } from 'class-validator';
import * as mongoose from 'mongoose';
import { BookingStatus } from '../../enums/booking.enum';

@InputType()
export class BookingUpdate {
    @IsNotEmpty()
    @Field(() => String)
    _id: mongoose.ObjectId;

    // Agent: CONFIRMED yoki CANCELLED qila oladi
    // Agent: COMPLETED qila oladi (xizmat tugagandan keyin)
    // User: CANCELLED qila oladi (24 soat qoidasiga binoan)
    @IsOptional()
    @Field(() => BookingStatus, { nullable: true })
    bookingStatus?: BookingStatus;

    @IsOptional()
    @Length(0, 200)
    @Field(() => String, { nullable: true })
    bookingNote?: string;

    deletedAt?: Date; // frontenddan kelmaydi
}