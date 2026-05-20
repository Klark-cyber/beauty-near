import { Schema } from 'mongoose';
import { BookingStatus, PaymentStatus } from '../libs/enums/booking.enum';

const BookingSchema = new Schema(
    {
        bookingStatus: {
            type: String,
            enum: BookingStatus,
            default: BookingStatus.PENDING,
        },

        // Tashrif sanasi
        bookingDate: {
            type: Date,
            required: true,
        },

        // Tashrif vaqti (masalan: "14:00")
        bookingTime: {
            type: String,
            required: true,
        },

        // User ixtiyoriy izoh qoldirishi mumkin
        bookingNote: {
            type: String,
        },

        // Xizmatning to'liq narxi
        totalAmount: {
            type: Number,
            required: true,
        },

        // TossPayments orqali oldindan to'langan zaklad (default: ₩10,000)
        depositAmount: {
            type: Number,
            default: 10000,
        },

        // Salondan to'lanadigan qolgan summa (totalAmount - depositAmount)
        remainAmount: {
            type: Number,
            required: true,
        },

        // TossPayments payment key — refund uchun kerak
        paymentKey: {
            type: String,
        },

        paymentStatus: {
            type: String,
            enum: PaymentStatus,
            default: PaymentStatus.PENDING,
        },

        serviceId: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: 'Service',
        },

        salonId: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: 'Salon',
        },

        memberId: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: 'Member',
        },

        deletedAt: {
            type: Date,
        },
    },
    { timestamps: true, collection: 'bookings' },
);

// Bir user bir salon, bir xizmat, bir sana va bir vaqtda faqat bitta booking qila oladi
BookingSchema.index({ memberId: 1, salonId: 1, serviceId: 1, bookingDate: 1, bookingTime: 1 }, { unique: true });

export default BookingSchema;