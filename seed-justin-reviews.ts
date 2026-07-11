/**
 * Justin (specialist) uchun mijozlardan sharhlar (review) yaratuvchi
 * seed skripti — CommentGroup.MEMBER orqali
 *
 * ISHGA TUSHIRISH (loyihaning BOSH papkasidan):
 *   npx ts-node seed-justin-reviews.ts
 */

import mongoose, { Schema } from 'mongoose';
import * as dotenv from 'dotenv';

dotenv.config();

const MONGO_URL =
    process.env.MONGO_PRODUCTION ||
    process.env.MONGO_DEV ||
    process.env.MONGO ||
    'mongodb://localhost:27017/beautynear';

const MemberSchema = new Schema({}, { strict: false, collection: 'members' });
const CommentSchema = new Schema({}, { strict: false, collection: 'comments', timestamps: true });

const Member = mongoose.model('Member', MemberSchema);
const Comment = mongoose.model('Comment', CommentSchema);

const REVIEWS = [
    'Justin did an amazing job with my hair color! Super professional and really listened to what I wanted.',
    "Best experience I've had at a salon in years. Justin is incredibly skilled and friendly.",
    'Highly recommend booking with Justin. The attention to detail was outstanding.',
    'Great service, very punctual and the results exceeded my expectations!',
    'Justin made me feel comfortable throughout the whole appointment. Will definitely book again.',
];

async function run() {
    console.log("Justin uchun sharhlar seed boshlandi...");
    await mongoose.connect(MONGO_URL);
    console.log('MongoDB ulandi');

    const justin: any = await Member.findOne({ memberNick: 'Justin' });
    if (!justin) {
        console.log('Ogohlantirish: "Justin" nomli member topilmadi.');
        await mongoose.disconnect();
        process.exit(0);
    }

    const reviewers: any[] = await Member.find({
        memberNick: { $ne: 'Justin' },
        memberStatus: { $ne: 'DELETE' },
    }).limit(5);

    if (reviewers.length === 0) {
        console.log('Ogohlantirish: sharh qoldiradigan boshqa member topilmadi.');
        await mongoose.disconnect();
        process.exit(0);
    }

    await Comment.deleteMany({ commentRefId: justin._id, commentGroup: 'MEMBER' });

    let count = 0;
    for (const text of REVIEWS) {
        const reviewer = reviewers[count % reviewers.length];
        await Comment.create({
            commentStatus: 'ACTIVE',
            commentGroup: 'MEMBER',
            commentContent: text,
            commentRefId: justin._id,
            memberId: reviewer._id,
        });
        console.log(`  [${reviewer.memberNick}]: ${text.slice(0, 40)}...`);
        count++;
    }

    // memberComments hisoblagichini ham yangilaymiz
    await Member.updateOne({ _id: justin._id }, { $set: { memberComments: count } });

    console.log(`Done: Justin uchun ${count} ta sharh yaratildi.`);
    await mongoose.disconnect();
    process.exit(0);
}

run().catch((err) => {
    console.error('Xato:', err);
    process.exit(1);
});