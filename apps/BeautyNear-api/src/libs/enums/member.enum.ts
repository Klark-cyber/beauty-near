import { registerEnumType } from '@nestjs/graphql';

export enum MemberType {
  USER = 'USER',
  AGENT = 'AGENT',
  ADMIN = 'ADMIN',
}
registerEnumType(MemberType, {
  name: 'MemberType',
});

export enum MemberStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE', // BLOCK o'rniga — platformaga kirmagan yoki tasdiqlash kutayotgan
  PAUSE = 'PAUSE',       // vaqtincha to'xtatilgan (agent o'zi yoki admin tomonidan)
  DELETE = 'DELETE',
}
registerEnumType(MemberStatus, {
  name: 'MemberStatus',
});

export enum MemberAuthType {
  PHONE = 'PHONE',
  EMAIL = 'EMAIL',
  KAKAO = 'KAKAO',  // TELEGRAM o'rniga — Koreya bozori uchun
  NAVER = 'NAVER',  // yangi — Koreya bozori uchun
}
registerEnumType(MemberAuthType, {
  name: 'MemberAuthType',
});