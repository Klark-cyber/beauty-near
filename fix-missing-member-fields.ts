/**
 * BeautyNear — eski memberlardagi YO'Q (missing) raqamli maydonlarni tuzatish
 *
 * Sabab: Member GraphQL type'idagi ba'zi maydonlar (memberSalons va h.k.)
 * NON-NULLABLE, lekin Nestar → BeautyNear migratsiyasidan oldin yaratilgan
 * ba'zi member hujjatlarida bu maydonlar umuman yo'q. Natijada shu memberlar
 * ishtirok etgan istalgan GraphQL so'rov (masalan getMemberFollowers)
 * "Cannot return null for non-nullable field Member.X" xatosi bilan butunlay
 * buziladi.
 *
 * Ishga tushirish:
 *   npx ts-node fix-missing-member-fields.ts
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
const Member = mongoose.model('Member', MemberSchema);

// Member GraphQL type'idagi barcha NON-NULLABLE raqamli/array maydonlar
// (Salon.ts'dagi Member turidan olindi — memberSalons, memberArticles va h.k.)
const NUMERIC_DEFAULTS: Record<string, number> = {
    memberSalons: 0,
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
    memberExperience: 0,
};

const ARRAY_DEFAULTS: Record<string, any[]> = {
    memberPortfolio: [],
    memberSpecialty: [],
};

async function run() {
    console.log("🌸 Eski memberlardagi yo'q maydonlarni tekshirish boshlandi...");
    await mongoose.connect(MONGO_URL);
    console.log('✅ MongoDB ulandi:', MONGO_URL);

    let totalFixed = 0;

    for (const [field, defaultValue] of Object.entries(NUMERIC_DEFAULTS)) {
        const result = await Member.updateMany(
            { $or: [{ [field]: { $exists: false } }, { [field]: null }] },
            { $set: { [field]: defaultValue } },
        );
        if (result.modifiedCount > 0) {
            console.log(`  ✓ ${field}: ${result.modifiedCount} ta member tuzatildi`);
            totalFixed += result.modifiedCount;
        }
    }

    for (const [field, defaultValue] of Object.entries(ARRAY_DEFAULTS)) {
        const result = await Member.updateMany(
            { $or: [{ [field]: { $exists: false } }, { [field]: null }] },
            { $set: { [field]: defaultValue } },
        );
        if (result.modifiedCount > 0) {
            console.log(`  ✓ ${field}: ${result.modifiedCount} ta member tuzatildi`);
            totalFixed += result.modifiedCount;
        }
    }

    if (totalFixed === 0) {
        console.log('  ℹ️  Hech qanday yo\'q maydon topilmadi — barcha memberlar allaqachon to\'liq.');
    }

    console.log(`\n🎉 Tugadi: jami ${totalFixed} ta maydon-hujjat tuzatildi.`);
    console.log('   Endi backendni qayta ishga tushirib, MyPage → Followers/Followings\'ni qayta tekshiring.');

    await mongoose.disconnect();
    process.exit(0);
}

run().catch((err) => {
    console.error('❌ Fix xatosi:', err);
    process.exit(1);
});