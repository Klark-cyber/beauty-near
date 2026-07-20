/**
 * Specialists sahifasini boyitish uchun seed skripti:
 *  - 5 ta yangi AGENT (specialist) + har biriga 1 ta Salon + 2-3 ta Service
 *  - Har bir salonga 3-5 ta sharh (Comment, commentRating bilan) — mavjud
 *    USER'lardan (yoki ular yo'q bo'lsa, avtomatik yaratiladi)
 *  - Har bir salonning salonRating'i haqiqiy o'rtacha asosida yangilanadi
 *
 * ISHGA TUSHIRISH (loyihaning BOSH papkasidan):
 *   npx ts-node seed-specialists-reviews.ts
 */

import mongoose, { Schema } from 'mongoose';
import * as dotenv from 'dotenv';
import * as bcrypt from 'bcryptjs';

dotenv.config();

const MONGO_URL =
    process.env.MONGO_PRODUCTION ||
    process.env.MONGO_DEV ||
    process.env.MONGO ||
    'mongodb://localhost:27017/beautynear';

const MemberSchema = new Schema({}, { strict: false, collection: 'members', timestamps: true });
const SalonSchema = new Schema({}, { strict: false, collection: 'salons', timestamps: true });
const ServiceSchema = new Schema({}, { strict: false, collection: 'services', timestamps: true });
const CommentSchema = new Schema({}, { strict: false, collection: 'comments', timestamps: true });

const Member = mongoose.model('Member', MemberSchema);
const Salon = mongoose.model('Salon', SalonSchema);
const Service = mongoose.model('Service', ServiceSchema);
const Comment = mongoose.model('Comment', CommentSchema);

/* ─── Yangi specialistlar ma'lumotlari ─────────────────────────────────── */

const SPECIALISTS = [
    {
        memberNick: 'Sora',
        memberFullName: 'Sora Lee',
        memberPhone: '01055501001',
        memberSpecialty: ['NAIL'],
        memberExperience: 5,
        memberDesc: 'Nail artist specializing in gel art and creative designs. 5 years of experience making hands beautiful.',
        memberImage: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&q=80',
        memberPortfolio: [
            'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400&q=70',
            'https://images.unsplash.com/photo-1610992015732-2449b76344bc?w=400&q=70',
            'https://images.unsplash.com/photo-1607779097040-26e80aa78e66?w=400&q=70',
        ],
        salonTitle: 'Sora Nail Studio',
        salonType: 'NAIL',
        salonAddress: 'Mapo-gu, Seoul',
        salonImages: ['https://images.unsplash.com/photo-1607779097040-26e80aa78e66?w=600&q=75'],
        services: [
            { serviceTitle: 'Gel Manicure', servicePrice: 45000, serviceDuration: 60 },
            { serviceTitle: 'Nail Art Design', servicePrice: 65000, serviceDuration: 90 },
        ],
    },
    {
        memberNick: 'Minjun',
        memberFullName: 'Minjun Park',
        memberPhone: '01055501002',
        memberSpecialty: ['HAIR'],
        memberExperience: 10,
        memberDesc: 'Hair designer & perm expert with 10 years of experience. Specializing in modern Korean hairstyles.',
        memberImage: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&q=80',
        memberPortfolio: [
            'https://images.unsplash.com/photo-1560869713-7d0a29430803?w=400&q=70',
            'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=400&q=70',
        ],
        salonTitle: 'The Hair Room',
        salonType: 'HAIR',
        salonAddress: 'Seocho-gu, Seoul',
        salonImages: ['https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=600&q=75'],
        services: [
            { serviceTitle: 'Perm', servicePrice: 90000, serviceDuration: 120 },
            { serviceTitle: 'Hair Cut & Style', servicePrice: 40000, serviceDuration: 45 },
        ],
    },
    {
        memberNick: 'Hana',
        memberFullName: 'Hana Choi',
        memberPhone: '01055501003',
        memberSpecialty: ['SKIN'],
        memberExperience: 9,
        memberDesc: 'Skin therapist focused on acne care and anti-aging treatments. Certified aesthetician with 9 years experience.',
        memberImage: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&q=80',
        memberPortfolio: [
            'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&q=70',
        ],
        salonTitle: 'Pure Skin Clinic',
        salonType: 'SKIN',
        salonAddress: 'Gangnam-gu, Seoul',
        salonImages: ['https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&q=75'],
        services: [
            { serviceTitle: 'Acne Care Program', servicePrice: 90000, serviceDuration: 50 },
            { serviceTitle: 'Anti-Aging Facial', servicePrice: 120000, serviceDuration: 70 },
        ],
    },
    {
        memberNick: 'Jaehoon',
        memberFullName: 'Jaehoon Kim',
        memberPhone: '01055501004',
        memberSpecialty: ['HAIR'],
        memberExperience: 6,
        memberDesc: 'Scalp specialist and hair loss care expert. Helping clients regain confidence with healthy scalp treatments.',
        memberImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&q=80',
        memberPortfolio: [],
        salonTitle: 'Root Scalp Center',
        salonType: 'HAIR',
        salonAddress: 'Yeoksam-dong, Seoul',
        salonImages: ['https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=600&q=75'],
        services: [
            { serviceTitle: 'Scalp Treatment', servicePrice: 70000, serviceDuration: 60 },
        ],
    },
    {
        memberNick: 'Yuna',
        memberFullName: 'Yuna Kang',
        memberPhone: '01055501005',
        memberSpecialty: ['CLINIC'],
        memberExperience: 8,
        memberDesc: 'Dermatology clinic specialist. Focused on laser treatments and pigmentation correction.',
        memberImage: 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=300&q=80',
        memberPortfolio: [
            'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=400&q=70',
        ],
        salonTitle: 'Glow Derma Clinic',
        salonType: 'CLINIC',
        salonAddress: 'Cheongdam-dong, Seoul',
        salonImages: ['https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=600&q=75'],
        services: [
            { serviceTitle: 'Laser Skin Resurfacing', servicePrice: 150000, serviceDuration: 60 },
            { serviceTitle: 'Pigmentation Treatment', servicePrice: 110000, serviceDuration: 50 },
        ],
    },
];

const REVIEW_TEXTS = [
    { text: 'Absolutely loved the results! Very professional and clean space.', rating: 5 },
    { text: 'Great service overall, will come back again.', rating: 5 },
    { text: 'Good experience, staff was friendly and attentive.', rating: 4 },
    { text: 'Solid work, a bit pricey but worth it.', rating: 4 },
    { text: 'Amazing attention to detail, highly recommend!', rating: 5 },
];

async function run() {
    console.log('Specialists + Reviews seed boshlandi...');
    await mongoose.connect(MONGO_URL);
    console.log('MongoDB ulandi');

    // Sharh yozish uchun mavjud USER'larni topamiz (bo'lmasa — yaratamiz)
    let reviewers: any[] = await Member.find({ memberType: 'USER' }).limit(5).exec();
    if (reviewers.length === 0) {
        console.log('USER topilmadi — 3 ta demo reviewer yaratiladi...');
        const hashed = await bcrypt.hash('Test1234!', await bcrypt.genSalt());
        for (let i = 1; i <= 3; i++) {
            const r = await Member.create({
                memberType: 'USER',
                memberStatus: 'ACTIVE',
                memberAuthType: 'PHONE',
                memberPhone: `0105550${9000 + i}`,
                memberNick: `Reviewer${i}`,
                memberFullName: `Demo Reviewer ${i}`,
                memberPassword: hashed,
                memberImage: '',
                memberSalons: 0,
                memberArticles: 0,
                memberFollowers: 0,
                memberFollowings: 0,
                memberLikes: 0,
                memberViews: 0,
                memberComments: 0,
                memberRank: 0,
                memberWarnings: 0,
                memberBlocks: 0,
                memberAddress: '',
                memberDesc: '',
            });
            reviewers.push(r);
        }
    }

    for (const spec of SPECIALISTS) {
        const existing = await Member.findOne({ memberNick: spec.memberNick });
        if (existing) {
            console.log(`⏭  ${spec.memberNick} allaqachon mavjud, o'tkazib yuborildi`);
            continue;
        }

        const hashedPw = await bcrypt.hash('Specialist1234!', await bcrypt.genSalt());

        const agent: any = await Member.create({
            memberType: 'AGENT',
            memberStatus: 'ACTIVE',
            memberAuthType: 'PHONE',
            memberPhone: spec.memberPhone,
            memberNick: spec.memberNick,
            memberFullName: spec.memberFullName,
            memberPassword: hashedPw,
            memberImage: spec.memberImage,
            memberDesc: spec.memberDesc,
            memberExperience: spec.memberExperience,
            memberSpecialty: spec.memberSpecialty,
            memberPortfolio: spec.memberPortfolio,
            // ⚠️ TUZATILDI: bu maydonlar GraphQL sxemasida MAJBURIY (non-nullable)
            // deb belgilangan — { strict: false } sxema standart qiymat
            // bermaydi, shuning uchun ANIQ ko'rsatilishi shart
            memberSalons: 1,
            memberArticles: 0,
            memberFollowers: Math.floor(Math.random() * 8000) + 1000,
            memberFollowings: 0,
            memberLikes: 0,
            memberViews: Math.floor(Math.random() * 500) + 50,
            memberComments: 0,
            memberRank: 0,
            memberWarnings: 0,
            memberBlocks: 0,
            memberAddress: '',
            memberLatitude: 0,
            memberLongitude: 0,
        });
        console.log(`✅ Specialist yaratildi: ${spec.memberNick}`);

        // Salon — salonLocation2d to'g'ri (Seul koordinatalari atrofida, tasodifiy siljish bilan)
        const baseLat = 37.5665 + (Math.random() - 0.5) * 0.05;
        const baseLng = 126.978 + (Math.random() - 0.5) * 0.05;

        const salon: any = await Salon.create({
            memberId: agent._id,
            salonStatus: 'ACTIVE',
            salonType: spec.salonType,
            salonTitle: spec.salonTitle,
            salonAddress: spec.salonAddress,
            salonDesc: spec.memberDesc,
            salonImages: spec.salonImages,
            salonWorkHours: '09:00-21:00',
            salonPhone: spec.memberPhone,
            salonLocation: 'SEOUL',
            salonLocation2d: { type: 'Point', coordinates: [baseLng, baseLat] },
            salonViews: Math.floor(Math.random() * 300) + 20,
            salonLikes: Math.floor(Math.random() * 100),
            salonComments: 0,
            salonRank: 0,
            salonFollowers: Math.floor(Math.random() * 500),
            salonRating: 0,
            depositAmount: 10000,
        });
        console.log(`   └─ Salon yaratildi: ${spec.salonTitle}`);

        // Services
        for (const svc of spec.services) {
            await Service.create({
                salonId: salon._id,
                memberId: agent._id,
                serviceStatus: 'ACTIVE',
                serviceType: spec.salonType,
                serviceTitle: svc.serviceTitle,
                serviceDesc: `${svc.serviceTitle} — professional service at ${spec.salonTitle}.`,
                servicePrice: svc.servicePrice,
                serviceDuration: svc.serviceDuration,
                serviceImages: spec.salonImages,
                serviceViews: Math.floor(Math.random() * 150),
                serviceLikes: Math.floor(Math.random() * 40),
                serviceComments: 0,
                serviceRank: 0,
                serviceRating: 0,
            });
        }
        console.log(`   └─ ${spec.services.length} ta xizmat qo'shildi`);

        // Reviews — 3-5 ta, turli reviewer'lardan
        const reviewCount = Math.floor(Math.random() * 3) + 3; // 3-5
        let ratingSum = 0;
        for (let i = 0; i < reviewCount; i++) {
            const reviewer = reviewers[i % reviewers.length];
            const review = REVIEW_TEXTS[i % REVIEW_TEXTS.length];
            await Comment.create({
                commentStatus: 'ACTIVE',
                commentGroup: 'SALON',
                commentRefId: salon._id,
                memberId: reviewer._id,
                commentContent: review.text,
                commentRating: review.rating,
            });
            ratingSum += review.rating;
        }

        const avgRating = Math.round((ratingSum / reviewCount) * 10) / 10;
        await Salon.findByIdAndUpdate(salon._id, { salonComments: reviewCount, salonRating: avgRating });
        console.log(`   └─ ${reviewCount} ta sharh qo'shildi (o'rtacha: ${avgRating}⭐)`);
    }

    console.log('\n🎉 Seed muvaffaqiyatli yakunlandi!');
    await mongoose.disconnect();
}

run().catch((err) => {
    console.error('XATO:', err);
    process.exit(1);
});