import { Schema } from 'mongoose';

const FollowSchema = new Schema(
	{
		followingId: {
			type: Schema.Types.ObjectId,
		},

		followerId: {
			type: Schema.Types.ObjectId,
			required: true,
		},

		salonId: {
			type: Schema.Types.ObjectId,
			ref: 'Salon',
		},

		serviceId: {
			type: Schema.Types.ObjectId,
			ref: 'Service',
		},
	},
	{ timestamps: true, collection: 'follows' },
);

FollowSchema.index({ followingId: 1, followerId: 1 }, { unique: true, sparse: true });
FollowSchema.index({ salonId: 1, followerId: 1 }, { unique: true, sparse: true });
FollowSchema.index({ serviceId: 1, followerId: 1 }, { unique: true, sparse: true });

export default FollowSchema;