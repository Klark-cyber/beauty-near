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

	// ⚠️ YANGI — Agent uchun
	NEW_BOOKING = 'NEW_BOOKING',           // Mijoz agentning xizmatini bron qildi
	ACCOUNT_SUSPENDED = 'ACCOUNT_SUSPENDED', // Admin hisobni to'xtatdi/bloklad
	AGENT_APPROVED = 'AGENT_APPROVED',     // Admin USER'ni AGENT'ga o'tkazdi

	// ⚠️ YANGI — Admin uchun
	NEW_INQUIRY = 'NEW_INQUIRY',           // User muammo/savol yubordi
	NEW_AGENT_REQUEST = 'NEW_AGENT_REQUEST', // User Agent bo'lishni so'radi

	// ⚠️ YANGI — 1-ga-1 chat
	NEW_MESSAGE = 'NEW_MESSAGE',           // User↔Agent yangi shaxsiy xabar
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