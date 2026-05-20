import { registerEnumType } from '@nestjs/graphql';

export enum BookingStatus {
    PENDING = 'PENDING',       // zaklad to'landi, agent hali tasdiqlamadi
    CONFIRMED = 'CONFIRMED',   // agent tasdiqladi
    CANCELLED = 'CANCELLED',   // bekor qilindi (user yoki agent tomonidan)
    COMPLETED = 'COMPLETED',   // xizmat tugadi → review yozish mumkin
}
registerEnumType(BookingStatus, {
    name: 'BookingStatus',
});

export enum PaymentStatus {
    PENDING = 'PENDING',   // to'lov jarayonida
    PAID = 'PAID',         // zaklad muvaffaqiyatli to'landi
    REFUNDED = 'REFUNDED', // zaklad qaytarildi (24 soat oldin bekor qilinsa)
}
registerEnumType(PaymentStatus, {
    name: 'PaymentStatus',
});