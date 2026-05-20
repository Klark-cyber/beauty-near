import { registerEnumType } from '@nestjs/graphql';

export enum ServiceType {
	HAIR = 'HAIR',
	NAIL = 'NAIL',
	SKIN = 'SKIN',
	CLINIC = 'CLINIC',
	MASSAGE = 'MASSAGE',
}
registerEnumType(ServiceType, {
	name: 'ServiceType',
});

export enum ServiceStatus {
	ACTIVE = 'ACTIVE',
	INACTIVE = 'INACTIVE', // agent vaqtincha yashirgan
	DELETE = 'DELETE',
}
registerEnumType(ServiceStatus, {
	name: 'ServiceStatus',
});