/**
 * BeautyNear — bitta aniq member (David) uchun maqsadli FOLLOW tarmog'i
 *
 * Ishga tushirish:
 *   npx ts-node seed-follow-david.ts
 *
 * ⚠️ Oldin drop-follow-indexes.ts ishlatilgan va backend qayta ishga tushirilgan
 *    bo'lishi shart (partialFilterExpression indexlar to'g'ri o'rnatilishi uchun).
 *
 * Nima qiladi:
 *   - David boshqa N ta memberni follow qiladi        → Followings'da ko'rinadi
 *   - Boshqa N ta member Davidni follow qiladi         → Followers'da ko'rinadi
 *   - David 3 ta tasodifiy salonni follow qiladi
 *   - David 3 ta tasodifiy service'ni follow qiladi
 *   - Ta'sirlangan HAMMA memberlarning (David + boshqalar)
 *     memberFollowers/memberFollowings sonlari qayta hisoblanadi
 */

import mongoose, { Schema } from 'mongoose';
import * as dotenv from 'dotenv';

dotenv.config();

const MONGO_URL =
    process.env.MONGO_PRODUCTION ||
    process.env.MONGO_DEV ||
    process.env.MONGO ||
    'mongodb://localhost:27017/beautynear';

const TARGET_MEMBER_ID = '6a0f6b7bda0b781baee8a35f'; // David

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
    console.log('🌸 David uchun maqsadli follow seed boshlandi...');
    await mongoose.connect(MONGO_URL);
    console.log('✅ MongoDB ulandi:', MONGO_URL);

    const david: any = await Member.findById(TARGET_MEMBER_ID);
    if (!david) {
        console.error('❌ David topilmadi:', TARGET_MEMBER_ID);
        await mongoose.disconnect();
        process.exit(1);
    }
    console.log(`✅ Target member topildi: ${david.memberNick} (${david._id})`);

    // David'dan boshqa hamma AGENT/USER memberlarni olamiz
    const others: any[] = await Member.find({
        _id: { $ne: david._id },
        memberType: { $in: ['AGENT', 'USER'] },
        memberStatus: { $ne: 'DELETE' },
    }).limit(16);

    if (others.length < 2) {
        console.error('❌ Kamida 2 ta boshqa member kerak. Avval seed.ts ni ishga tushiring.');
        await mongoose.disconnect();
        process.exit(1);
    }
    console.log(`✅ ${others.length} ta boshqa member topildi`);

    // Ro'yxatni ikkiga bo'lamiz: yarmi Davidni follow qiladi (Followers),
    // qolgan yarmini David follow qiladi (Followings)
    const shuffled = [...others].sort(() => Math.random() - 0.5);
    const half = Math.ceil(shuffled.length / 2);
    const willFollowDavid = shuffled.slice(0, half); // → David'ning followerlari
    const davidWillFollow = shuffled.slice(half); // → David'ning followinglari

    const salons: any[] = await Salon.find({ salonStatus: 'ACTIVE' }).limit(20);
    const services: any[] = await Service.find({ serviceStatus: 'ACTIVE' }).limit(30);
    console.log(`✅ ${salons.length} salon, ${services.length} service topildi`);

    // Eski test follow'larni tozalash (faqat David ishtirok etganlarini)
    await Follow.deleteMany({
        $or: [{ followerId: david._id }, { followingId: david._id }],
    });
    console.log("🧹 David bilan bog'liq eski follow'lar tozalandi");

    let followCount = 0;
    const affectedMemberIds = new Set<string>([String(david._id)]);

    // dublikat (unique index) xatosini yutuvchi xavfsiz create
    const safeFollow = async (doc: any) => {
        try {
            await Follow.create(doc);
            followCount++;
        } catch (e: any) {
            if (e?.code !== 11000) throw e;
            console.log('  ⏭️  duplikat, otkazib yuborildi:', doc);
        }
    };

    // 1) Boshqalar → David (David'ning followerlari)
    for (const member of willFollowDavid) {
        await safeFollow({ followerId: member._id, followingId: david._id });
        affectedMemberIds.add(String(member._id));
    }
    console.log(`  ✓ ${willFollowDavid.length} ta member Davidni follow qildi`);

    // 2) David → boshqalar (David'ning followinglari)
    for (const member of davidWillFollow) {
        await safeFollow({ followerId: david._id, followingId: member._id });
        affectedMemberIds.add(String(member._id));
    }
    console.log(`  ✓ David ${davidWillFollow.length} ta memberni follow qildi`);

    // 3) David → 3 ta tasodifiy salon
    if (salons.length > 0) {
        const pickedSalons = [...salons].sort(() => Math.random() - 0.5).slice(0, Math.min(3, salons.length));
        for (const salon of pickedSalons) {
            await safeFollow({ followerId: david._id, salonId: salon._id });
            await Salon.updateOne({ _id: salon._id }, { $inc: { salonFollowers: 1 } });
        }
        console.log(`  ✓ David ${pickedSalons.length} ta salonni follow qildi`);
    }

    // 4) David → 3 ta tasodifiy service
    if (services.length > 0) {
        const pickedServices = [...services].sort(() => Math.random() - 0.5).slice(0, Math.min(3, services.length));
        for (const svc of pickedServices) {
            await safeFollow({ followerId: david._id, serviceId: svc._id });
            await Service.updateOne({ _id: svc._id }, { $inc: { serviceFollowers: 1 } });
        }
        console.log(`  ✓ David ${pickedServices.length} ta service'ni follow qildi`);
    }

    // 5) Ta'sirlangan HAMMA memberlar uchun memberFollowers/memberFollowings qayta hisoblash
    for (const idStr of affectedMemberIds) {
        const followersNum = await Follow.countDocuments({ followingId: idStr });
        const followingsNum = await Follow.countDocuments({
            followerId: idStr,
            followingId: { $exists: true, $ne: null },
        });
        await Member.updateOne(
            { _id: idStr },
            { $set: { memberFollowers: followersNum, memberFollowings: followingsNum } },
        );
    }
    console.log(`  ✓ ${affectedMemberIds.size} ta memberning follow sonlari yangilandi`);

    console.log(`\n🎉 Tugadi: ${followCount} ta yangi follow yaratildi`);
    console.log(`   David → Followers: ${willFollowDavid.length}, Followings: ${davidWillFollow.length + 3 + 3}`);
    console.log('   Endi David bilan login qilib MyPage → Followings/Followers ko\'ring');

    await mongoose.disconnect();
    process.exit(0);
}

run().catch((err) => {
    console.error('❌ Follow seed xatosi:', err);
    process.exit(1);
});
