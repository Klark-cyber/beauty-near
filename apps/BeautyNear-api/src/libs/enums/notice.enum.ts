import { registerEnumType } from '@nestjs/graphql';

export enum NoticeType {
	EVENT = 'EVENT',
	NOTICE = 'NOTICE',
	WARNING = 'WARNING',
}
registerEnumType(NoticeType, { name: 'NoticeType' });

export enum NoticeStatus {
	ACTIVE = 'ACTIVE',
	DELETE = 'DELETE',
}
registerEnumType(NoticeStatus, { name: 'NoticeStatus' });
