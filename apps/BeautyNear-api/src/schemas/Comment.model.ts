import { Schema } from 'mongoose';
import { CommentGroup, CommentStatus } from '../libs/enums/comment.enum';

const CommentSchema = new Schema(
	{
		commentStatus: {
			type: String,
			enum: CommentStatus,
			default: CommentStatus.ACTIVE,
		},

		commentGroup: {
			type: String,
			enum: CommentGroup,
			required: true,
		},

		commentContent: {
			type: String,
			required: true,
		},

		// Foydalanuvchi tugallangan bron asosida qoldiradigan baho (1-5)
		commentRating: {
			type: Number,
			min: 1,
			max: 5,
			default: 5,
		},

		// Izohga like sonini saqlash
		commentLikes: {
			type: Number,
			default: 0,
		},

		commentRefId: {
			type: Schema.Types.ObjectId,
			required: true,
		},

		memberId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Member',
		},
	},
	{ timestamps: true, collection: 'comments' },
);

export default CommentSchema;