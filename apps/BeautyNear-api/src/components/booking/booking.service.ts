import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Booking, Bookings } from '../../libs/dto/booking/booking';
import { Direction } from '../../libs/enums/common.enum';
import { Message } from '../../libs/enums/common.enum';
import { AgentBookingsInquiry, BookingInput, BookingsInquiry } from '../../libs/dto/booking/booking.input';
import { BookingUpdate } from '../../libs/dto/booking/booking.update';
import { BookingStatus, PaymentStatus } from '../../libs/enums/booking.enum';
import { ServiceService } from '../service/service.service';
import { T } from '../../libs/types/common';
import { lookupMember, lookupSalon, lookupService, shapeIntoMongoObjectId } from '../../libs/config';
import { SocketGateway } from '../../socket/socket.gateway';

const TOSS_SECRET_KEY = 'test_sk_D5GePWvyJnrK0W0k6q8gLzN97Emo';
const TOSS_API_URL = 'https://api.tosspayments.com/v1/payments';

@Injectable()
export class BookingService {
    constructor(
        @InjectModel('Booking') private readonly bookingModel: Model<Booking>,
        @InjectModel('Salon') private readonly salonModel: Model<any>,
        private readonly serviceService: ServiceService,
        private readonly socketGateway: SocketGateway,
    ) { }

    // ── TOSS PAYMENTS ─────────────────────────────────────────────────────────

    private async confirmPayment(paymentKey: string, orderId: string, amount: number): Promise<void> {
        const encodedKey = Buffer.from(`${TOSS_SECRET_KEY}:`).toString('base64');

        const response = await fetch(`${TOSS_API_URL}/confirm`, {
            method: 'POST',
            headers: {
                Authorization: `Basic ${encodedKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ paymentKey, orderId, amount }),
        });

        if (!response.ok) {
            const error = await response.json();
            console.log('TossPayments confirm error:', error);
            throw new BadRequestException(`Payment failed: ${error.message}`);
        }

        const data = await response.json();
        console.log('TossPayments confirm success:', data.paymentKey, data.status);
    }

    private async refundPayment(paymentKey: string, cancelReason: string): Promise<void> {
        // ⚠️ TUZATILDI: bu — demo/portfolio loyihasi, barcha bookinglar
        // SOXTA (test_pay_...) paymentKey bilan yaratiladi. Haqiqiy
        // TossPayments API'siga so'rov yuborilsa, bu kalit tizimda mavjud
        // bo'lmagani uchun HAR DOIM Koreys tilidagi xato qaytarardi.
        // Shuning uchun bu yerda haqiqiy API chaqirilmaydi — faqat
        // "muvaffaqiyatli qaytarilgandek" jurnalga yoziladi (mock).
        console.log(`[MOCK REFUND] paymentKey=${paymentKey}, reason=${cancelReason} — haqiqiy TossPayments so'rovi YUBORILMADI (demo loyiha).`);
        return;
    }

    // ── BOOKING CRUD ──────────────────────────────────────────────────────────

    public async createBooking(input: BookingInput): Promise<Booking> {
        const targetService = await this.serviceService.getService(null, input.serviceId as any);
        if (!targetService) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

        const depositAmount = 10000;
        const totalAmount = targetService.servicePrice;
        const remainAmount = totalAmount - depositAmount;

        // const orderId = `BEAUTYNEAR_${Date.now()}_${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

        // await this.confirmPayment(input.paymentKey, orderId, depositAmount);

        try {
            const result = await this.bookingModel.create({
                ...input,
                totalAmount,
                depositAmount,
                remainAmount,
                bookingStatus: BookingStatus.PENDING,
                paymentStatus: PaymentStatus.PAID,
            });

            // ⚠️ YANGI — Agentga (salon egasiga) yangi bron haqida xabar
            const salon: any = await this.salonModel.findById(input.salonId).select('memberId salonTitle').lean().exec();
            if (salon?.memberId) {
                await this.socketGateway.notifyNewBooking(salon.memberId, input.memberId as any, salon.salonTitle, input.salonId as any);
            }

            return result;
        } catch (err) {
            console.log('Error, Booking.model:', err.message);
            throw new BadRequestException(Message.CREATE_FAILED);
        }
    }

    public async getBooking(memberId: ObjectId, bookingId: ObjectId): Promise<Booking> {
        const search: T = { _id: bookingId, memberId: memberId };

        const result = await this.bookingModel
            .aggregate([
                { $match: search },
                ...lookupMember,
                { $unwind: { path: '$memberData', preserveNullAndEmptyArrays: true } },
                ...lookupSalon,
                { $unwind: { path: '$salonData', preserveNullAndEmptyArrays: true } },
                ...lookupService,
                { $unwind: { path: '$serviceData', preserveNullAndEmptyArrays: true } },
            ])
            .exec();

        if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
        return result[0];
    }

    // ⚠️ YANGI — xavfsiz, ochiq so'rov: berilgan salon+sana uchun BAND
    // qilingan vaqtlarni qaytaradi (HAMMA mijozlar bo'yicha, faqat
    // vaqt qatorlari — hech qanday shaxsiy ma'lumot oshkor qilinmaydi)
    public async getBookedSlots(salonId: ObjectId, date: Date): Promise<string[]> {
        const dayStart = new Date(date);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(date);
        dayEnd.setHours(23, 59, 59, 999);

        const bookings = await this.bookingModel
            .find({
                salonId: shapeIntoMongoObjectId(salonId),
                bookingDate: { $gte: dayStart, $lte: dayEnd },
                bookingStatus: { $ne: BookingStatus.CANCELLED },
            })
            .select('bookingTime')
            .exec();

        return bookings.map((b) => b.bookingTime);
    }

    public async getMyBookings(memberId: ObjectId, input: BookingsInquiry): Promise<Bookings> {
        const { bookingStatus, salonId, serviceId } = input.search;
        const match: T = { memberId: memberId };
        const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

        if (bookingStatus) match.bookingStatus = bookingStatus;
        if (salonId) match.salonId = shapeIntoMongoObjectId(salonId);
        if (serviceId) match.serviceId = shapeIntoMongoObjectId(serviceId);

        const result = await this.bookingModel
            .aggregate([
                { $match: match },
                { $sort: sort },
                {
                    $facet: {
                        list: [
                            { $skip: (input.page - 1) * input.limit },
                            { $limit: input.limit },
                            ...lookupSalon,
                            { $unwind: { path: '$salonData', preserveNullAndEmptyArrays: true } },
                            ...lookupService,
                            { $unwind: { path: '$serviceData', preserveNullAndEmptyArrays: true } },
                        ],
                        metaCounter: [{ $count: 'total' }],
                    },
                },
            ])
            .exec();

        if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
        return result[0];
    }

    public async cancelBooking(memberId: ObjectId, bookingId: ObjectId): Promise<Booking> {
        const booking = await this.bookingModel
            .findOne({ _id: bookingId, memberId: memberId, bookingStatus: BookingStatus.PENDING })
            .exec();

        if (!booking) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

        const bookingDateTime = new Date(booking.bookingDate);
        const [hours, minutes] = booking.bookingTime.split(':').map(Number);
        bookingDateTime.setHours(hours, minutes, 0, 0);

        const now = new Date();
        const hoursUntilBooking = (bookingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
        const shouldRefund = hoursUntilBooking > 24;

        if (shouldRefund && booking.paymentKey) {
            await this.refundPayment(booking.paymentKey, 'User cancelled booking 24 hours before appointment');
        }

        const result = await this.bookingModel
            .findByIdAndUpdate(
                bookingId,
                {
                    bookingStatus: BookingStatus.CANCELLED,
                    paymentStatus: shouldRefund ? PaymentStatus.REFUNDED : PaymentStatus.PAID,
                    deletedAt: new Date(),
                },
                { new: true },
            )
            .exec();

        if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

        // Notification: user ga bekor qilinganligini bildirish
        const salon = await this.salonModel.findById(booking.salonId).select('salonTitle').exec();
        await this.socketGateway.notifyBookingCancelled(memberId, salon?.salonTitle ?? 'salon');

        return result;
    }

    public async updateBookingByAgent(memberId: ObjectId, input: BookingUpdate): Promise<Booking> {
        const booking = await this.bookingModel
            .findOne({ _id: input._id })
            .populate('salonId')
            .exec() as any;

        if (!booking) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

        if (booking.salonId.memberId.toString() !== memberId.toString()) {
            throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);
        }

        const result = await this.bookingModel
            .findByIdAndUpdate(input._id, input, { new: true })
            .exec();

        if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

        // Notification: booking tasdiqlanganda yoki bekor qilinganda user ga xabar
        if (input.bookingStatus === BookingStatus.CONFIRMED) {
            await this.socketGateway.notifyBookingConfirmed(
                booking.memberId,
                booking.salonId.salonTitle ?? 'salon',
            );
        } else if (input.bookingStatus === BookingStatus.CANCELLED) {
            // Agent bekor qilganda → refund
            if (booking.paymentKey) {
                await this.refundPayment(booking.paymentKey, 'Cancelled by agent');
            }
            await this.bookingModel.findByIdAndUpdate(input._id, { paymentStatus: PaymentStatus.REFUNDED }).exec();
            await this.socketGateway.notifyBookingCancelled(
                booking.memberId,
                booking.salonId.salonTitle ?? 'salon',
            );
        }

        return result;
    }

    public async getAgentBookings(memberId: ObjectId, input: AgentBookingsInquiry): Promise<Bookings> {
        const { bookingStatus, salonId } = input.search;
        const match: T = {};
        const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

        if (bookingStatus) match.bookingStatus = bookingStatus;
        // ⚠️ TUZATILDI: salonId GraphQL'dan STRING sifatida keladi, lekin
        // bazada ObjectId sifatida saqlanadi — bu ikkisi hech qachon mos
        // kelmasdi, shuning uchun BIRON BIR salon tanlanganda "No bookings
        // found" chiqardi (faqat "All Salons" holatida, filtr yo'qligida,
        // to'g'ri natija chiqardi).
        if (salonId) match.salonId = shapeIntoMongoObjectId(salonId);

        const result = await this.bookingModel
            .aggregate([
                { $match: match },
                {
                    $lookup: {
                        from: 'salons',
                        localField: 'salonId',
                        foreignField: '_id',
                        as: 'salonData',
                    },
                },
                { $unwind: { path: '$salonData', preserveNullAndEmptyArrays: true } },
                { $match: { 'salonData.memberId': memberId } },
                { $sort: sort },
                {
                    $facet: {
                        list: [
                            { $skip: (input.page - 1) * input.limit },
                            { $limit: input.limit },
                            ...lookupMember,
                            { $unwind: { path: '$memberData', preserveNullAndEmptyArrays: true } },
                            ...lookupService,
                            { $unwind: { path: '$serviceData', preserveNullAndEmptyArrays: true } },
                        ],
                        metaCounter: [{ $count: 'total' }],
                    },
                },
            ])
            .exec();

        if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
        return result[0];
    }

    public async cancelBookingByAdmin(bookingId: ObjectId): Promise<Booking> {
        const booking = await this.bookingModel.findById(bookingId).exec();
        if (!booking) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

        if (booking.paymentKey && booking.paymentStatus === PaymentStatus.PAID) {
            await this.refundPayment(booking.paymentKey, 'Cancelled by admin');
        }

        const result = await this.bookingModel
            .findByIdAndUpdate(
                bookingId,
                {
                    bookingStatus: BookingStatus.CANCELLED,
                    paymentStatus: PaymentStatus.REFUNDED,
                    deletedAt: new Date(),
                },
                { new: true },
            )
            .exec();

        if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

        // Notification: user ga admin bekor qilganini bildirish
        const salon = await this.salonModel.findById(booking.salonId).select('salonTitle').exec();
        await this.socketGateway.notifyBookingCancelled(booking.memberId, salon?.salonTitle ?? 'salon');

        return result;
    }

    /* ADMIN */

    public async getAllBookingsByAdmin(input: BookingsInquiry): Promise<Bookings> {
        const { bookingStatus } = input.search;
        const match: T = {};
        const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

        if (bookingStatus) match.bookingStatus = bookingStatus;

        const result = await this.bookingModel
            .aggregate([
                { $match: match },
                { $sort: sort },
                {
                    $facet: {
                        list: [
                            { $skip: (input.page - 1) * input.limit },
                            { $limit: input.limit },
                            ...lookupMember,
                            { $unwind: { path: '$memberData', preserveNullAndEmptyArrays: true } },
                            ...lookupSalon,
                            { $unwind: { path: '$salonData', preserveNullAndEmptyArrays: true } },
                            ...lookupService,
                            { $unwind: { path: '$serviceData', preserveNullAndEmptyArrays: true } },
                            // ⚠️ YANGI — ba'zi eski bronlarda salonId to'g'ridan-to'g'ri
                            // topilmasligi mumkin edi (masalan salon keyinchalik
                            // o'chirilgan yoki eski ID formatida saqlangan bo'lsa).
                            // Bunday holatda, xizmat (service) orqali BOG'LIQ
                            // salonni zaxira sifatida qidiramiz.
                            {
                                $lookup: {
                                    from: 'salons',
                                    localField: 'serviceData.salonId',
                                    foreignField: '_id',
                                    as: 'fallbackSalonData',
                                },
                            },
                            { $unwind: { path: '$fallbackSalonData', preserveNullAndEmptyArrays: true } },
                            {
                                $addFields: {
                                    salonData: { $ifNull: ['$salonData', '$fallbackSalonData'] },
                                },
                            },
                        ],
                        metaCounter: [{ $count: 'total' }],
                    },
                },
            ])
            .exec();

        if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
        return result[0];
    }

    public async updateBookingByAdmin(input: BookingUpdate): Promise<Booking> {
        const result = await this.bookingModel
            .findByIdAndUpdate(input._id, input, { new: true })
            .exec();
        if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);
        return result;
    }
}