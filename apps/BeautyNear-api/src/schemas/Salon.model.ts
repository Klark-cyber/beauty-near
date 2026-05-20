import { Schema } from 'mongoose';
import { SalonLocation, SalonStatus, SalonType } from '../libs/enums/salon.enum';

const SalonSchema = new Schema(
    {
        salonType: {
            type: String,
            enum: SalonType,
            required: true,
        },

        salonStatus: {
            type: String,
            enum: SalonStatus,
            default: SalonStatus.ACTIVE,
        },

        salonLocation: {
            type: String,
            enum: SalonLocation,
            required: true,
        },

        salonAddress: {
            type: String,
            required: true,
        },

        salonTitle: {
            type: String,
            required: true,
        },

        salonDesc: {
            type: String,
        },

        salonImages: {
            type: [String],
            required: true,
        },

        salonPhone: {
            type: String,
            required: true,
        },

        // Ish vaqti (masalan: "09:00-21:00")
        salonWorkHours: {
            type: String,
            required: true,
        },

        salonInstagram: {
            type: String,
        },

        salonViews: {
            type: Number,
            default: 0,
        },

        salonLikes: {
            type: Number,
            default: 0,
        },

        salonComments: {
            type: Number,
            default: 0,
        },

        salonRank: {
            type: Number,
            default: 0,
        },

        salonFollowers: {
            type: Number,
            default: 0,
        },

        depositAmount: {
            type: Number,
            default: 10000,
        },

        // Geo lokatsiya — oddiy coordinate fieldlar
        salonLatitude: {
            type: Number,
        },

        salonLongitude: {
            type: Number,
        },

        // MongoDB $geoNear uchun GeoJSON Point format
        // coordinates: [longitude, latitude] — MongoDB standarti shu tartibda
        salonLocation2d: {
            type: {
                type: String,
                enum: ['Point'],
                default: 'Point',
            },
            coordinates: {
                type: [Number],
                default: [0, 0],
            },
        },

        memberId: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: 'Member',
        },

        deletedAt: {
            type: Date,
        },
    },
    { timestamps: true, collection: 'salons' },
);

// Bir agent bir xil nom va manzilda ikki salon qo'sha olmaydi
SalonSchema.index({ memberId: 1, salonTitle: 1, salonAddress: 1 }, { unique: true });

// Geo filter uchun 2dsphere index
SalonSchema.index({ salonLocation2d: '2dsphere' });

export default SalonSchema;