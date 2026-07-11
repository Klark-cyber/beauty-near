/**
 * BeautyNear — BARCHA memberlar uchun keshlangan hisoblagichlarni
 * (memberFollowers, memberFollowings, memberArticles, memberSalons)
 * haqiqiy ma'lumotlar asosida qayta hisoblash.
 *
 * Sabab: bu maydonlar increment/decrement orqali saqlanadi, vaqt o'tishi
 * bilan haqiqiy sondan farq qilib qoladi (ba'zan manfiy songacha —
 * "Followers (-1)" kabi). Bu skript ularni HAQIQIY hujjatlar sonidan
 * qayta hisoblab, to'g'ri qiymatga tenglashtiradi.
 *
 * Ishga tushirish:
 *   npx ts-node fix-all-member-counters.ts
 */

import mongoose, { Schema } from 'mongoose';
import * as dotenv from 'dotenv';

dotenv.config();

const MONGO_URL =
    process.env.MONGO_PRODUCTION ||
    process.env.MONGO_DEV ||
    process.env.MONGO ||
    'mongodb://localhost:27017/beautynear';

const MemberSchema = new Schema({}, { strict: false, collection: 'members', timestamps: true });
const FollowSchema = new Schema({}, { strict: false, collection: 'follows', timestamps: true });
const BoardArticleSchema = new Schema({}, { strict: false, collection: 'boardarticles', timestamps: true });
const SalonSchema = new Schema({}, { strict: false, collection: 'salons', timestamps: true });

const Member = mongoose.model('Member', MemberSchema);
const Follow = mongoose.model('Follow', FollowSchema);
const BoardArticle = mongoose.model('BoardArticle', BoardArticleSchema);
const Salon = mongoose.model('Salon', SalonSchema);

async function run() {
    console.log("Barcha memberlar uchun hisoblagichlarni qayta hisoblash boshlandi...");
    await mongoose.connect(MONGO_URL);
    console.log('MongoDB ulandi:', MONGO_URL);

    const allMembers: any[] = await Member.find({ memberStatus: { $ne: 'DELETE' } });
    console.log(`${allMembers.length} ta member topildi`);

    let fixedCount = 0;

    for (const member of allMembers) {
        const memberId = member._id;

        const followersCount = await Follow.countDocuments({ followingId: memberId });

        const followingsCount = await Follow.countDocuments({
            followerId: memberId,
            followingId: { $exists: true, $ne: null },
        });

        const articlesCount = await BoardArticle.countDocuments({
            memberId: memberId,
            articleStatus: { $ne: 'DELETE' },
        });

        const salonsCount = await Salon.countDocuments({
            memberId: memberId,
            salonStatus: { $ne: 'DELETE' },
        });

        const needsUpdate =
            member.memberFollowers !== followersCount ||
            member.memberFollowings !== followingsCount ||
            member.memberArticles !== articlesCount ||
            member.memberSalons !== salonsCount;

        if (needsUpdate) {
            await Member.updateOne(
                { _id: memberId },
                {
                    $set: {
                        memberFollowers: followersCount,
                        memberFollowings: followingsCount,
                        memberArticles: articlesCount,
                        memberSalons: salonsCount,
                    },
                },
            );
            console.log(
                `  fixed ${member.memberNick}: Followers ${member.memberFollowers}->${followersCount}, ` +
                `Followings ${member.memberFollowings}->${followingsCount}, ` +
                `Articles ${member.memberArticles}->${articlesCount}, ` +
                `Salons ${member.memberSalons}->${salonsCount}`,
            );
            fixedCount++;
        }
    }

    if (fixedCount === 0) {
        console.log('  All counters were already correct.');
    }

    console.log(`\nDone: ${fixedCount} member(s) counters fixed.`);
    console.log('   Refresh the page and check again.');

    await mongoose.disconnect();
    process.exit(0);
}

run().catch((err) => {
    console.error('Error:', err);
    process.exit(1);
});