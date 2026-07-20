import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { BookingService } from './booking.service';
import { Booking, Bookings } from '../../libs/dto/booking/booking';
import { AgentBookingsInquiry, BookingInput, BookingsInquiry } from '../../libs/dto/booking/booking.input';
import { BookingUpdate } from '../../libs/dto/booking/booking.update';
import { Roles } from '../auth/decorators/roles.decorator';
import { UseGuards } from '@nestjs/common';
import { MemberType } from '../../libs/enums/member.enum';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import * as mongoose from 'mongoose';
import { AuthGuard } from '../auth/guards/auth.guard';
import { shapeIntoMongoObjectId } from '../../libs/config';

@Resolver()
export class BookingResolver {
    constructor(private readonly bookingService: BookingService) { }

    @UseGuards(AuthGuard)
    @Mutation(() => Booking)
    public async createBooking(
        @Args('input') input: BookingInput,
        @AuthMember('_id') memberId: mongoose.ObjectId,
    ): Promise<Booking> {
        console.log('Mutation: createBooking');
        input.memberId = memberId;
        return await this.bookingService.createBooking(input);
    }

    @UseGuards(AuthGuard)
    @Query(() => Booking)
    public async getBooking(
        @Args('bookingId') input: string,
        @AuthMember('_id') memberId: mongoose.ObjectId,
    ): Promise<Booking> {
        console.log('Query: getBooking');
        const bookingId = shapeIntoMongoObjectId(input);
        return await this.bookingService.getBooking(memberId, bookingId);
    }

    // ⚠️ YANGI — login talab qilinmaydi (mavjudlikni tekshirish uchun ochiq)
    @Query(() => [String])
    public async getBookedSlots(
        @Args('salonId') salonId: string,
        @Args('date') date: string,
    ): Promise<string[]> {
        return await this.bookingService.getBookedSlots(shapeIntoMongoObjectId(salonId), new Date(date));
    }

    @UseGuards(AuthGuard)
    @Query(() => Bookings)
    public async getMyBookings(
        @Args('input') input: BookingsInquiry,
        @AuthMember('_id') memberId: mongoose.ObjectId,
    ): Promise<Bookings> {
        console.log('Query: getMyBookings');
        return await this.bookingService.getMyBookings(memberId, input);
    }

    @UseGuards(AuthGuard)
    @Mutation(() => Booking)
    public async cancelBooking(
        @Args('bookingId') input: string,
        @AuthMember('_id') memberId: mongoose.ObjectId,
    ): Promise<Booking> {
        console.log('Mutation: cancelBooking');
        const bookingId = shapeIntoMongoObjectId(input);
        return await this.bookingService.cancelBooking(memberId, bookingId);
    }

    @Roles(MemberType.AGENT)
    @UseGuards(RolesGuard)
    @Mutation(() => Booking)
    public async updateBookingByAgent(
        @Args('input') input: BookingUpdate,
        @AuthMember('_id') memberId: mongoose.ObjectId,
    ): Promise<Booking> {
        console.log('Mutation: updateBookingByAgent');
        input._id = shapeIntoMongoObjectId(input._id);
        return await this.bookingService.updateBookingByAgent(memberId, input);
    }

    @Roles(MemberType.AGENT)
    @UseGuards(RolesGuard)
    @Query(() => Bookings)
    public async getAgentBookings(
        @Args('input') input: AgentBookingsInquiry,
        @AuthMember('_id') memberId: mongoose.ObjectId,
    ): Promise<Bookings> {
        console.log('Query: getAgentBookings');
        return await this.bookingService.getAgentBookings(memberId, input);
    }

    /* ADMIN */

    @Roles(MemberType.ADMIN)
    @UseGuards(RolesGuard)
    @Query(() => Bookings)
    public async getAllBookingsByAdmin(
        @Args('input') input: BookingsInquiry,
        @AuthMember('_id') memberId: mongoose.ObjectId,
    ): Promise<Bookings> {
        console.log('Query: getAllBookingsByAdmin');
        return await this.bookingService.getAllBookingsByAdmin(input);
    }

    @Roles(MemberType.ADMIN)
    @UseGuards(RolesGuard)
    @Mutation(() => Booking)
    public async updateBookingByAdmin(@Args('input') input: BookingUpdate): Promise<Booking> {
        console.log('Mutation: updateBookingByAdmin');
        input._id = shapeIntoMongoObjectId(input._id);
        return await this.bookingService.updateBookingByAdmin(input);
    }

    @Roles(MemberType.ADMIN)
    @UseGuards(RolesGuard)
    @Mutation(() => Booking)
    public async cancelBookingByAdmin(@Args('bookingId') input: string): Promise<Booking> {
        console.log('Mutation: cancelBookingByAdmin');
        const bookingId = shapeIntoMongoObjectId(input);
        return await this.bookingService.cancelBookingByAdmin(bookingId);
    }
}