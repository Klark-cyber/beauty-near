import { registerEnumType } from '@nestjs/graphql';

export enum NotificationType {
	// Ijtimoiy
	FOLLOW = 'FOLLOW',
	LIKE = 'LIKE',
	COMMENT = 'COMMENT',

	// Booking jarayoni
	BOOKING_CONFIRMED = 'BOOKING_CONFIRMED',   // Agent buyurtmani tasdiqladi
	BOOKING_CANCELLED = 'BOOKING_CANCELLED',   // Agent yoki user bekor qildi

	// Agent → Followerlar
	NEW_POST = 'NEW_POST',       // Agent yangi xizmat qo'shdi
	DISCOUNT = 'DISCOUNT',       // Agent aksiya e'lon qildi
	FREE_SLOT = 'FREE_SLOT',     // Bugun bo'sh vaqt ochildi

	// Review
	NEW_REVIEW = 'NEW_REVIEW',   // Foydalanuvchi review yozdi (agentga)
}
registerEnumType(NotificationType, {
	name: 'NotificationType',
});

export enum NotificationStatus {
	WAIT = 'WAIT',
	READ = 'READ',
}
registerEnumType(NotificationStatus, {
	name: 'NotificationStatus',
});

export enum NotificationGroup {
	MEMBER = 'MEMBER',
	SALON = 'SALON',     // PROPERTY o'rniga
	SERVICE = 'SERVICE', // yangi
	BOOKING = 'BOOKING', // yangi
	ARTICLE = 'ARTICLE',
}
registerEnumType(NotificationGroup, {
	name: 'NotificationGroup',
});