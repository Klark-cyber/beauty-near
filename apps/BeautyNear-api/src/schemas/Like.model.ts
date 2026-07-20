import { Schema } from 'mongoose';
import { LikeGroup } from '../libs/enums/like.enum';

const LikeSchema = new Schema(
	{
		likeGroup: {
			type: String,
			enum: LikeGroup, // BUG TUZATILDI: Nestar da ViewGroup ishlatilgan edi
			required: true,
		},

		likeRefId: {
			type: Schema.Types.ObjectId,
			required: true,
		},

		memberId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Member',
		},
	},
	{ timestamps: true, collection: 'likes' },
);

// ⚠️ TUZATILDI: avval faqat {memberId, likeRefId} noyob edi — bu
// "SALON" guruhidagi eski like yozuvi bilan "MEMBER" guruhidagi yangi
// like o'rtasida DUPLICATE KEY xatosiga olib kelardi (litsenziya bir
// xil _id'ga ega bo'lgani uchun), garchi ular semantik jihatdan
// BOSHQA-BOSHQA narsa (masalan salon like'i va member like'i) bo'lsa
// ham. Endi likeGroup ham noyoblik shartiga kiritildi.
LikeSchema.index({ memberId: 1, likeRefId: 1, likeGroup: 1 }, { unique: true });

export default LikeSchema;