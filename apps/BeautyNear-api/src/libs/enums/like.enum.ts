import { registerEnumType } from '@nestjs/graphql';

export enum LikeGroup {
	SALON = 'SALON',     // PROPERTY o'rniga
	SERVICE = 'SERVICE', // yangi — xizmatga like
	COMMENT = 'COMMENT', // yangi — izohga like
	ARTICLE = 'ARTICLE',
}
registerEnumType(LikeGroup, {
	name: 'LikeGroup',
});