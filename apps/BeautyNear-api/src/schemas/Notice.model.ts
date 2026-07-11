import { Schema } from 'mongoose';
import { NoticeType, NoticeStatus } from '../libs/enums/notice.enum';

const NoticeSchema = new Schema(
	{
		noticeType: {
			type: String,
			enum: NoticeType,
			required: true,
		},

		noticeStatus: {
			type: String,
			enum: NoticeStatus,
			default: NoticeStatus.ACTIVE,
		},

		noticeTitle: {
			type: String,
			required: true,
		},

		noticeContent: {
			type: String,
			required: true,
		},

		noticeViews: {
			type: Number,
			default: 0,
		},

		noticePinned: {
			type: Boolean,
			default: false,
		},
	},
	{ timestamps: true, collection: 'notices' },
);

export default NoticeSchema;