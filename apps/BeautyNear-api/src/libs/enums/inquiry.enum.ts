import { registerEnumType } from '@nestjs/graphql';

export enum InquiryStatus {
	WAITING = 'WAITING',
	ANSWERED = 'ANSWERED',
	CLOSED = 'CLOSED',
}
registerEnumType(InquiryStatus, { name: 'InquiryStatus' });
