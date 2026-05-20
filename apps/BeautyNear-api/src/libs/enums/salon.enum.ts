import { registerEnumType } from '@nestjs/graphql';

export enum SalonType {
    HAIR = 'HAIR',
    NAIL = 'NAIL',
    SKIN = 'SKIN',
    CLINIC = 'CLINIC',
    MASSAGE = 'MASSAGE',
}
registerEnumType(SalonType, {
    name: 'SalonType',
});

export enum SalonStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE', // tasdiqlash kutilmoqda yoki vaqtincha yopiq
    PAUSE = 'PAUSE',       // agent o'zi to'xtatgan
    DELETE = 'DELETE',
}
registerEnumType(SalonStatus, {
    name: 'SalonStatus',
});

export enum SalonLocation {
    SEOUL = 'SEOUL',
    BUSAN = 'BUSAN',
    DAEGU = 'DAEGU',
    INCHEON = 'INCHEON',
    JEJU = 'JEJU',
    GANGWON = 'GANGWON',
}
registerEnumType(SalonLocation, {
    name: 'SalonLocation',
});