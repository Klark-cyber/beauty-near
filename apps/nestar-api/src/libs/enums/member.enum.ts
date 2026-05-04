import { registerEnumType } from '@nestjs/graphql'; //pasdagi enumlarni graphqlda togridan togri ishlatib bolmaydi shu sababli ushbu packagedan foydalanib enumlarni royxatdan otqazamiz

export enum MemberType {
  USER = 'USER',
  AGENT = 'AGENT',
  ADMIN = 'ADMIN',
}

registerEnumType(MemberType, { //bu qator orqali graphql ichida istalgan yerda ushbu typedan foydalanishimiz mumkin boladi
  name: 'MemberType', 
});

export enum MemberStatus {
  ACTIVE = 'ACTIVE',
  BLOCK = 'BLOCK',
  DELETE = 'DELETE',
}

registerEnumType(MemberStatus, {
  name: 'MemberStatus',
});

export enum MemberAuthType {
  PHONE = 'PHONE',
  EMAIL = 'EMAIL',
  TELEGRAM = 'TELEGRAM',
}

registerEnumType(MemberAuthType, {
  name: 'MemberAuthType',
});