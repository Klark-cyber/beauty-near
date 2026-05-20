import { Schema } from 'mongoose';
import { MemberAuthType, MemberStatus, MemberType } from '../libs/enums/member.enum';

const MemberSchema = new Schema(
    {
        memberType: {
            type: String,
            enum: MemberType,
            default: MemberType.USER,
        },

        memberStatus: {
            type: String,
            enum: MemberStatus,
            default: MemberStatus.ACTIVE,
        },

        memberAuthType: {
            type: String,
            enum: MemberAuthType,
            default: MemberAuthType.PHONE,
        },

        memberPhone: {
            type: String,
            index: { unique: true, sparse: true },
            required: true,
        },

        memberNick: {
            type: String,
            index: { unique: true },
            required: true,
        },

        memberPassword: {
            type: String,
            select: false,
            required: true,
        },

        memberFullName: {
            type: String,
        },

        memberImage: {
            type: String,
            default: '',
        },

        // Agent (Master) uchun qo'shimcha rasmlar
        memberPortfolio: {
            type: [String],
            default: [],
        },

        memberAddress: {
            type: String,
        },

        memberDesc: {
            type: String,
        },

        // Agent uchun: yillik tajriba (masalan: 5)
        memberExperience: {
            type: Number,
            default: 0,
        },

        // Agent uchun: mutaxassislik sohalari (masalan: ['Perm', 'Coloring'])
        memberSpecialty: {
            type: [String],
            default: [],
        },

        // Nestar: memberProperties → BeautyNear: memberSalons
        memberSalons: {
            type: Number,
            default: 0,
        },

        memberArticles: {
            type: Number,
            default: 0,
        },

        memberFollowers: {
            type: Number,
            default: 0,
        },

        memberFollowings: {
            type: Number,
            default: 0,
        },

        memberPoints: {
            type: Number,
            default: 0,
        },

        memberLikes: {
            type: Number,
            default: 0,
        },

        memberViews: {
            type: Number,
            default: 0,
        },

        memberComments: {
            type: Number,
            default: 0,
        },

        memberRank: {
            type: Number,
            default: 0,
        },

        memberWarnings: {
            type: Number,
            default: 0,
        },

        memberBlocks: {
            type: Number,
            default: 0,
        },

        // Geo lokatsiya — user yaqin salonlarni topishi uchun
        memberLatitude: {
            type: Number,
        },

        memberLongitude: {
            type: Number,
        },

        deletedAt: {
            type: Date,
            // TYPO TUZATILDI: Nestar da "deleatedAt" deb yozilgan edi
        },
    },
    { timestamps: true, collection: 'members' },
);

export default MemberSchema;