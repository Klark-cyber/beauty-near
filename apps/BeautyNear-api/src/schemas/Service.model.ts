import { Schema } from 'mongoose';
import { ServiceStatus, ServiceType } from '../libs/enums/service.enum';

const ServiceSchema = new Schema(
	{
		serviceType: {
			type: String,
			enum: ServiceType,
			required: true,
		},

		serviceStatus: {
			type: String,
			enum: ServiceStatus,
			default: ServiceStatus.ACTIVE,
		},

		serviceTitle: {
			type: String,
			required: true,
		},

		serviceDesc: {
			type: String,
		},

		servicePrice: {
			type: Number,
			required: true,
		},

		// Xizmat davomiyligi (daqiqada, masalan: 60)
		serviceDuration: {
			type: Number,
			required: true,
		},

		// Before/After rasmlar (serviceImages[0] = before, serviceImages[1] = after)
		serviceImages: {
			type: [String],
			default: [],
		},

		serviceViews: {
			type: Number,
			default: 0,
		},

		serviceLikes: {
			type: Number,
			default: 0,
		},

		serviceComments: {
			type: Number,
			default: 0,
		},

		serviceRank: {
			type: Number,
			default: 0,
		},

		// O'rtacha reyting — COMPLETED bookingdan keyin yangilanadi
		serviceRating: {
			type: Number,
			default: 0,
		},

		salonId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Salon',
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
	{ timestamps: true, collection: 'services' },
);

// Bir salon ichida bir xil nomli xizmat bir marta qo'shiladi
ServiceSchema.index({ salonId: 1, serviceTitle: 1 }, { unique: true });

export default ServiceSchema;