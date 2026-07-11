import { registerEnumType } from '@nestjs/graphql';

export enum FaqCategory {
	BOOKING = 'BOOKING',
	PAYMENT = 'PAYMENT',
	ACCOUNT = 'ACCOUNT',
	SALONS = 'SALONS',
	OTHER = 'OTHER',
}
registerEnumType(FaqCategory, { name: 'FaqCategory' });

export enum FaqStatus {
	ACTIVE = 'ACTIVE',
	INACTIVE = 'INACTIVE',
	DELETE = 'DELETE',
}
registerEnumType(FaqStatus, { name: 'FaqStatus' });
