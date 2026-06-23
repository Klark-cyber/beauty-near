/**
 * BeautyNear — Bitta salonga test review (comment) qo'shish
 *
 * ISHGA TUSHIRISH:
 *   beautynear (backend) papkasida:
 *   npx ts-node add-comments.ts
 *
 * Faqat ko'rsatilgan salonga 4 ta review qo'shadi (boshqasiga tegmaydi).
 */

import mongoose, { Schema } from 'mongoose';
import * as dotenv from 'dotenv';

dotenv.config();

const MONGO_URL =
    process.env.MONGO_PRODUCTION ||
    process.env.MONGO_DEV ||
    process.env.MONGO ||
    'mongodb://localhost:27017/beautynear';

// ─── Shu salonga comment qo'shamiz ───
const SALON_ID = '6a31f6ce4dcf93cdb5609d47';

const MemberSchema = new Schema({}, { strict: false, collection: 'members', timestamps: true });
const SalonSchema = new Schema({}, { strict: false, collection: 'salons', timestamps: true });
const CommentSchema = new Schema({}, { strict: false, collection: 'comments', timestamps: true });

const Member = mongoose.model('Member', MemberSchema);
const Salon = mongoose.model('Salon', SalonSchema);
const Comment = mongoose.model('Comment', CommentSchema);

const REVIEWERS = [
    { nick: 'Jisoo Park', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80', phone: '010-9000-1000' },
    { nick: 'Minji Kim', img: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80', phone: '010-9000-1001' },
    { nick: 'Soojin Lee', img: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&q=80', phone: '010-9000-1002' },
    { nick: 'Hana Choi', img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80', phone: '010-9000-1003' },
];

const REVIEW_TEXTS = [
    'Amazing experience! My skin feels so much better after the treatment. The staff is very professional and kind.',
    'Best salon in Gangnam! The design was perfect and lasted long. Will definitely come back!',
    'Great service and clean environment. Highly recommend this place!',
    'Loved the result. The specialist really knows what they are doing. Worth every won.',
];

async function run() {
    console.log('🌸 Comment qo\'shish boshlandi...');
    await mongoose.connect(MONGO_URL);
    console.log('✅ MongoDB ulandi');

    // Salon mavjudligini tekshirish
    const salon: any = await Salon.findById(SALON_ID);
    if (!salon) {
        console.error(`❌ Salon topilmadi: ${SALON_ID}`);
        await mongoose.disconnect();
        process.exit(1);
    }
    console.log(`✅ Salon: ${salon.salonTitle}`);

    // Zarur non-nullable maydonlar (yo'q bo'lsa qo'shiladi)
    const REQUIRED_COUNTS = {
        memberSalons: 0, memberProperties: 0, memberArticles: 0,
        memberFollowers: 0, memberFollowings: 0, memberPoints: 0,
        memberLikes: 0, memberViews: 0, memberComments: 0,
        memberRank: 0, memberWarnings: 0, memberBlocks: 0,
    };

    // Reviewer memberlarni topish yoki yaratish
    const reviewerMembers: any[] = [];
    for (const r of REVIEWERS) {
        let m: any = await Member.findOne({ memberNick: r.nick });
        if (m) {
            // Mavjud reviewerда yetishmayotgan sanoq maydonlarini to'ldirish
            const setFields: any = {};
            for (const [key, val] of Object.entries(REQUIRED_COUNTS)) {
                if (m[key] === undefined || m[key] === null) setFields[key] = val;
            }
            if (Object.keys(setFields).length > 0) {
                await Member.updateOne({ _id: m._id }, { $set: setFields });
                console.log(`  ~ ${r.nick} yangilandi (memberSalons va h.k. qo'shildi)`);
            }
        }
        if (!m) {
            m = await Member.create({
                memberType: 'USER',
                memberStatus: 'ACTIVE',
                memberAuthType: 'EMAIL',
                memberNick: r.nick,
                memberPassword: '$2b$10$seedPlaceholderHashForTestUserAccount000000000000000',
                memberImage: r.img,
                memberPhone: r.phone,
                // Non-nullable sanoq maydonlari (GraphQL Member type talab qiladi)
                memberSalons: 0,
                memberProperties: 0,
                memberArticles: 0,
                memberFollowers: 0,
                memberFollowings: 0,
                memberPoints: 0,
                memberLikes: 0,
                memberViews: 0,
                memberComments: 0,
                memberRank: 0,
                memberWarnings: 0,
                memberBlocks: 0,
            });
            console.log(`  + Reviewer yaratildi: ${r.nick}`);
        }
        reviewerMembers.push(m);
    }

    // Shu salonning eski test commentlarini tozalash
    await Comment.deleteMany({ commentGroup: 'SALON', commentRefId: new mongoose.Types.ObjectId(SALON_ID) });

    // 4 ta review qo'shish
    let count = 0;
    for (let k = 0; k < REVIEW_TEXTS.length; k++) {
        const reviewer = reviewerMembers[k % reviewerMembers.length];
        await Comment.create({
            commentGroup: 'SALON',
            commentStatus: 'ACTIVE',
            commentContent: REVIEW_TEXTS[k],
            commentRefId: new mongoose.Types.ObjectId(SALON_ID),
            memberId: reviewer._id,
        });
        count++;
    }

    // salonComments sonini yangilash
    await Salon.updateOne({ _id: SALON_ID }, { $set: { salonComments: count } });

    console.log(`\n🎉 ${count} ta review qo'shildi → ${salon.salonTitle}`);
    await mongoose.disconnect();
    process.exit(0);
}

run().catch((err) => {
    console.error('❌ Xato:', err);
    process.exit(1);
});