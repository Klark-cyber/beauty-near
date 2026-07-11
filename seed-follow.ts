/**
 * BeautyNear — FOLLOW test ma'lumotlari (mustaqil script)
 *
 * Bu ALOHIDA script — mavjud seed.ts ni o'zgartirmaydi.
 * seed.ts ni ishga tushirgandan KEYIN buni ishga tushiring
 * (chunki agent, reviewer memberlar, salonlar, servicelar mavjud bo'lishi kerak).
 *
 * ISHGA TUSHIRISH:
 *   npx ts-node seed-follows.ts
 *
 * Nima qiladi:
 *   - agent + barcha USER memberlarni oladi (follow qatnashchilari)
 *   - member ↔ member follow (bir-birini kuzatadi)
 *   - member → salon follow
 *   - member → service follow
 *   - memberFollowers / memberFollowings sonlarini yangilaydi
 *
 * Kim login qilsa ham MyPage'da Followings/Followers ko'radi.
 */

import mongoose, { Schema } from 'mongoose';
import * as dotenv from 'dotenv';

dotenv.config();

const MONGO_URL =
    process.env.MONGO_PRODUCTION ||
    process.env.MONGO_DEV ||
    process.env.MONGO ||
    'mongodb://localhost:27017/beautynear';

// ─── Minimal schemalar (strict: false) ────────────────────────────────────
const MemberSchema = new Schema({}, { strict: false, collection: 'members', timestamps: true });
const SalonSchema = new Schema({}, { strict: false, collection: 'salons', timestamps: true });
const ServiceSchema = new Schema({}, { strict: false, collection: 'services', timestamps: true });
const FollowSchema = new Schema({}, { strict: false, collection: 'follows', timestamps: true });

const Member = mongoose.model('Member', MemberSchema);
const Salon = mongoose.model('Salon', SalonSchema);
const Service = mongoose.model('Service', ServiceSchema);
const Follow = mongoose.model('Follow', FollowSchema);

async function run() {
    console.log('🌸 BeautyNear FOLLOW seed boshlandi...');
    await mongoose.connect(MONGO_URL);
    console.log('✅ MongoDB ulandi:', MONGO_URL);

    // 1. Follow qatnashchilarini olish: barcha AGENT + USER memberlar
    const members: any[] = await Member.find({
        memberType: { $in: ['AGENT', 'USER'] },
        memberStatus: { $ne: 'DELETE' },
    }).limit(10);

    if (members.length < 2) {
        console.error('❌ Kamida 2 member kerak. Avval seed.ts ni ishga tushiring.');
        await mongoose.disconnect();
        process.exit(1);
    }
    console.log(`✅ ${members.length} member topildi (follow qatnashchilari)`);

    // 2. Salon va service'larni olish
    const salons: any[] = await Salon.find({ salonStatus: 'ACTIVE' }).limit(20);
    const services: any[] = await Service.find({ serviceStatus: 'ACTIVE' }).limit(30);
    console.log(`✅ ${salons.length} salon, ${services.length} service topildi`);

    // 3. Eski test follow'larni tozalash (shu memberlar orasidagi)
    const memberIds = members.map((m) => m._id);
    await Follow.deleteMany({
        $or: [{ followerId: { $in: memberIds } }, { followingId: { $in: memberIds } }],
    });
    console.log('🧹 Eski test follow tozalandi');

    let followCount = 0;

    // dublikat (unique index) xatosini yutuvchi xavfsiz create
    const safeFollow = async (doc: any) => {
        try {
            await Follow.create(doc);
            followCount++;
        } catch (e: any) {
            if (e?.code !== 11000) throw e;
        }
    };

    // 3a. MEMBER ↔ MEMBER — har kim boshqa hammani follow qiladi
    for (const follower of members) {
        for (const following of members) {
            if (String(follower._id) === String(following._id)) continue;
            await safeFollow({ followerId: follower._id, followingId: following._id });
        }
    }
    console.log('  ✓ member ↔ member follow');

    // 3b. MEMBER → SALON — har member 3 ta tasodifiy salonni follow qiladi
    if (salons.length > 0) {
        for (const member of members) {
            const picked = [...salons].sort(() => Math.random() - 0.5).slice(0, Math.min(3, salons.length));
            for (const salon of picked) {
                await safeFollow({ followerId: member._id, salonId: salon._id });
            }
        }
        console.log('  ✓ member → salon follow');
    }

    // 3c. MEMBER → SERVICE — har member 3 ta tasodifiy service'ni follow qiladi
    if (services.length > 0) {
        for (const member of members) {
            const picked = [...services].sort(() => Math.random() - 0.5).slice(0, Math.min(3, services.length));
            for (const svc of picked) {
                await safeFollow({ followerId: member._id, serviceId: svc._id });
            }
        }
        console.log('  ✓ member → service follow');
    }

    // 4. memberFollowers / memberFollowings sonlarini yangilash
    for (const member of members) {
        const followersNum = await Follow.countDocuments({ followingId: member._id });
        const followingsNum = await Follow.countDocuments({
            followerId: member._id,
            followingId: { $exists: true, $ne: null },
        });
        await Member.updateOne(
            { _id: member._id },
            { $set: { memberFollowers: followersNum, memberFollowings: followingsNum } },
        );
    }
    console.log('  ✓ member follow sonlari yangilandi');

    console.log(`\n🎉 Tugadi: ${followCount} follow yaratildi (member + salon + service)`);
    console.log('   Endi istalgan member bilan login qilib MyPage → Followings/Followers ko\'ring');
    await mongoose.disconnect();
    process.exit(0);
}

run().catch((err) => {
    console.error('❌ Follow seed xatosi:', err);
    process.exit(1);
});