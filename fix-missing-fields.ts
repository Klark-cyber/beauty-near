/**
 * Mavjud Member/Salon/Service yozuvlarida yetishmayotgan (undefined)
 * maydonlarni 0 bilan to'ldiruvchi "tuzatuvchi" skript.
 *
 * Bu — oldingi seed urinishidan qolgan, yetishmayotgan maydonli
 * yozuvlarni TO'LIQ o'chirmasdan, joyida tuzatadi.
 *
 * ISHGA TUSHIRISH (loyihaning BOSH papkasidan):
 *   npx ts-node fix-missing-fields.ts
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
const SalonSchema = new Schema({}, { strict: false, collection: 'salons' });
const ServiceSchema = new Schema({}, { strict: false, collection: 'services' });

const Member = mongoose.model('Member', MemberSchema);
const Salon = mongoose.model('Salon', SalonSchema);
const Service = mongoose.model('Service', ServiceSchema);

async function run() {
    console.log('Yetishmayotgan maydonlarni tuzatish boshlandi...');
    await mongoose.connect(MONGO_URL);
    console.log('MongoDB ulandi');

    // ── MEMBER ──────────────────────────────────────────────────────────────
    const memberFields = [
        'memberArticles', 'memberFollowers', 'memberFollowings', 'memberLikes',
        'memberViews', 'memberComments', 'memberRank', 'memberWarnings',
        'memberBlocks', 'memberSalons',
    ];
    for (const field of memberFields) {
        const res = await Member.updateMany(
            { [field]: { $exists: false } },
            { $set: { [field]: 0 } },
        );
        if (res.modifiedCount > 0) console.log(`  Member.${field}: ${res.modifiedCount} ta yozuv tuzatildi`);
    }
    // null bo'lganlarini ham tuzatamiz (exists:true lekin null)
    for (const field of memberFields) {
        const res = await Member.updateMany(
            { [field]: null },
            { $set: { [field]: 0 } },
        );
        if (res.modifiedCount > 0) console.log(`  Member.${field} (null): ${res.modifiedCount} ta yozuv tuzatildi`);
    }

    // ── SALON ───────────────────────────────────────────────────────────────
    const salonFields = ['salonViews', 'salonLikes', 'salonComments', 'salonRank', 'salonFollowers', 'salonRating'];
    for (const field of salonFields) {
        const res = await Salon.updateMany(
            { $or: [{ [field]: { $exists: false } }, { [field]: null }] },
            { $set: { [field]: 0 } },
        );
        if (res.modifiedCount > 0) console.log(`  Salon.${field}: ${res.modifiedCount} ta yozuv tuzatildi`);
    }
    // depositAmount — 0 emas, standart qiymat (₩10,000)
    {
        const res = await Salon.updateMany(
            { $or: [{ depositAmount: { $exists: false } }, { depositAmount: null }] },
            { $set: { depositAmount: 10000 } },
        );
        if (res.modifiedCount > 0) console.log(`  Salon.depositAmount: ${res.modifiedCount} ta yozuv tuzatildi (₩10,000)`);
    }

    // ── SERVICE ─────────────────────────────────────────────────────────────
    const serviceFields = ['serviceViews', 'serviceLikes', 'serviceComments', 'serviceRank', 'serviceRating'];
    for (const field of serviceFields) {
        const res = await Service.updateMany(
            { $or: [{ [field]: { $exists: false } }, { [field]: null }] },
            { $set: { [field]: 0 } },
        );
        if (res.modifiedCount > 0) console.log(`  Service.${field}: ${res.modifiedCount} ta yozuv tuzatildi`);
    }

    console.log('\n🎉 Tuzatish yakunlandi!');
    await mongoose.disconnect();
}

run().catch((err) => {
    console.error('XATO:', err);
    process.exit(1);
});