import { Schema } from 'mongoose';
import { InquiryStatus } from '../libs/enums/inquiry.enum';

const InquirySchema = new Schema(
	{
		inquiryStatus: {
			type: String,
			enum: InquiryStatus,
			default: InquiryStatus.WAITING,
		},

		inquirySubject: {
			type: String,
			required: true,
		},

		inquiryMessage: {
			type: String,
			required: true,
		},

		inquiryReply: {
			type: String,
		},

		memberId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Member',
		},
	},
	{ timestamps: true, collection: 'inquiries' },
);

export default InquirySchema;
