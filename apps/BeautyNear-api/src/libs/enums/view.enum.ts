import { registerEnumType } from '@nestjs/graphql';

export enum ViewGroup {
	SALON = 'SALON',     // PROPERTY o'rniga
	SERVICE = 'SERVICE', // yangi — xizmat ko'rilgan
}
registerEnumType(ViewGroup, {
	name: 'ViewGroup',
});