/**
 * BeautyNear — Test ma'lumotlar seed scripti
 *
 * ISHGA TUSHIRISH:
 *   1. Loyiha root papkasiga joylang yoki apps/BeautyNear-api/src/ ichiga
 *   2. .env dagi MONGO ulanish stringini tekshiring
 *   3. Terminalda:  npx ts-node seed.ts
 *      (yoki:        ts-node seed.ts)
 *
 * Script o'zi AGENT member topadi, bo'lmasa yaratadi.
 * Keyin 8 salon + har biriga 2-3 service qo'shadi (Unsplash rasmlar bilan).
 */

import mongoose, { Schema } from 'mongoose';
import * as dotenv from 'dotenv';

dotenv.config();

const MONGO_URL =
    process.env.MONGO_PRODUCTION ||
    process.env.MONGO_DEV ||
    process.env.MONGO ||
    'mongodb://localhost:27017/beautynear';

// ─── Minimal schemalar (faqat seed uchun, strict: false bilan moslashuvchan) ───
const MemberSchema = new Schema({}, { strict: false, collection: 'members', timestamps: true });
const SalonSchema = new Schema({}, { strict: false, collection: 'salons', timestamps: true });
const ServiceSchema = new Schema({}, { strict: false, collection: 'services', timestamps: true });

const BoardArticleSchema = new Schema({}, { strict: false, collection: 'boardArticles', timestamps: true });

const Member = mongoose.model('Member', MemberSchema);
const Salon = mongoose.model('Salon', SalonSchema);
const Service = mongoose.model('Service', ServiceSchema);
const BoardArticle = mongoose.model('BoardArticle', BoardArticleSchema);
const CommentSchema = new Schema({}, { strict: false, collection: 'comments', timestamps: true });
const Comment = mongoose.model('Comment', CommentSchema);

// ─── Unsplash rasmlar ──────────────────────────────────────────────────────
const SALON_IMAGES = [
    'https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=800&q=80',
    'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&q=80',
    'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=800&q=80',
    'https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?w=800&q=80',
    'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800&q=80',
    'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&q=80',
    'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=800&q=80',
    'https://images.unsplash.com/photo-1559599101-f09722fb4948?w=800&q=80',
];

const SERVICE_IMAGES = [
    'https://images.unsplash.com/photo-1596178065887-1198b6148b2b?w=800&q=80',
    'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=800&q=80',
    'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=800&q=80',
    'https://images.unsplash.com/photo-1457972729786-0411a3b2b626?w=800&q=80',
    'https://images.unsplash.com/photo-1522337660859-02fbefca4702?w=800&q=80',
    'https://images.unsplash.com/photo-1620331317160-5a6c4d18b7c5?w=800&q=80',
];

const ARTICLE_IMAGES = [
    'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=800&q=80',
    'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=800&q=80',
    'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&q=80',
    'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&q=80',
    'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=800&q=80',
    'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80',
];

// FREE kategoriyali community postlar
const ARTICLES = [
    { title: 'My glass skin journey', content: 'After 3 months of treatments at a K-clinic, my skin has completely transformed! Sharing my honest experience and the products that actually worked for me.' },
    { title: 'Best nail art in Gangnam?', content: 'Just got the most gorgeous chrome nails done at Pink Nail Lab. The detail and care was amazing. Highly recommend booking ahead — they get busy!' },
    { title: 'Hair color review', content: 'Tried the rose-gold balayage at Glow Hair Studio and I am obsessed. The stylist really listened to what I wanted. Worth every won.' },
    { title: 'Botox first-timer tips', content: 'Was so nervous about my first botox session but the team at Seoul Aesthetic made me feel comfortable. Here are 5 things I wish I knew before going.' },
    { title: 'Relaxing spa day ✨', content: 'Treated myself to an aroma massage at Serenity Spa after a stressful week. Absolute bliss. The ambiance alone is worth visiting for.' },
    { title: 'Acne treatment that works', content: 'Struggled with adult acne for years. Derma Belle’s renewal program finally cleared my skin. Posting before/after in comments. Don’t lose hope!' },
];

// Seoul koordinatalari atrofida (geo discovery uchun)
const SEOUL = { lat: 37.5665, lng: 126.978 };
const jitter = () => (Math.random() - 0.5) * 0.06; // ~3km radius

// ─── Salon test datasi ─────────────────────────────────────────────────────
const SALONS = [
    { type: 'CLINIC', title: 'Lumière Clinic', addr: 'Gangnam-gu, Apgujeong-ro 412', desc: 'Premium skin & laser clinic in the heart of Gangnam.', phone: '02-512-1001', hours: '10:00-20:00', rank: 5, views: 520, likes: 88 },
    { type: 'CLINIC', title: 'Seoul Aesthetic', addr: 'Gangnam-gu, Cheongdam-dong 88', desc: 'Botox, filler & facial contouring experts.', phone: '02-512-1002', hours: '11:00-21:00', rank: 4, views: 320, likes: 64 },
    { type: 'CLINIC', title: 'Derma Belle', addr: 'Seocho-gu, Seocho-daero 250', desc: 'Acne, scar and skin renewal specialists.', phone: '02-512-1003', hours: '09:00-19:00', rank: 4, views: 410, likes: 72 },
    { type: 'HAIR', title: 'Glow Hair Studio', addr: 'Mapo-gu, Hongik-ro 32', desc: 'Trendy K-style cuts, color and treatments.', phone: '02-512-1004', hours: '10:00-22:00', rank: 3, views: 280, likes: 51 },
    { type: 'NAIL', title: 'Pink Nail Lab', addr: 'Gangnam-gu, Yeoksam-dong 14', desc: 'Korean gel nail art & care.', phone: '02-512-1005', hours: '11:00-20:00', rank: 3, views: 240, likes: 47 },
    { type: 'SKIN', title: 'Pure Skin Care', addr: 'Jongno-gu, Insadong-gil 5', desc: 'Hydration facials and glass-skin treatments.', phone: '02-512-1006', hours: '10:00-20:00', rank: 4, views: 365, likes: 69 },
    { type: 'MASSAGE', title: 'Serenity Spa', addr: 'Yongsan-gu, Itaewon-ro 120', desc: 'Relaxing aroma & body massage.', phone: '02-512-1007', hours: '12:00-23:00', rank: 3, views: 198, likes: 38 },
    { type: 'HAIR', title: 'Chic Salon Apgujeong', addr: 'Gangnam-gu, Apgujeong-ro 88', desc: 'Luxury hair styling for special days.', phone: '02-512-1008', hours: '10:00-21:00', rank: 4, views: 305, likes: 58 },
    // ⚠️ YANGI — Featured Clinics bo'limida 5 ta karta to'liq ko'rinishi uchun qo'shildi (avval 4 ta edi)
    { type: 'SKIN', title: 'Glow Medical Aesthetics', addr: 'Gangnam-gu, Nonhyeon-ro 175', desc: 'Peeling, hydration & brightening glow treatments.', phone: '02-512-1009', hours: '10:00-20:00', rank: 4, views: 355, likes: 66 },
];

// Salon turiga qarab service shablonlari
const SERVICE_TEMPLATES: Record<string, Array<{ title: string; price: number; dur: number; desc: string }>> = {
    CLINIC: [
        { title: 'Laser Skin Resurfacing', price: 150000, dur: 60, desc: 'Advanced laser treatment for smooth, radiant skin.' },
        { title: 'Botox Forehead', price: 120000, dur: 30, desc: 'Quick anti-wrinkle botox session.' },
        { title: 'Acne Care Program', price: 90000, dur: 50, desc: 'Deep-cleansing acne treatment.' },
    ],
    HAIR: [
        { title: 'Premium Cut & Style', price: 45000, dur: 60, desc: 'Personalized K-style haircut and styling.' },
        { title: 'Full Color', price: 80000, dur: 120, desc: 'Vibrant, long-lasting hair color.' },
        { title: 'Keratin Treatment', price: 110000, dur: 90, desc: 'Smooth, frizz-free shiny hair.' },
    ],
    NAIL: [
        { title: 'Gel Nail Art', price: 50000, dur: 70, desc: 'Custom Korean gel nail design.' },
        { title: 'Classic Manicure', price: 30000, dur: 45, desc: 'Clean, elegant manicure.' },
    ],
    SKIN: [
        { title: 'Glass Skin Facial', price: 70000, dur: 60, desc: 'Signature glass-skin glow facial.' },
        { title: 'Hydration Boost', price: 60000, dur: 50, desc: 'Intensive moisture treatment.' },
    ],
    MASSAGE: [
        { title: 'Aroma Body Massage', price: 80000, dur: 90, desc: 'Full-body relaxing aroma massage.' },
        { title: 'Korean Scalp Spa', price: 55000, dur: 60, desc: 'Soothing scalp & shoulder therapy.' },
    ],
};

async function run() {
    console.log('🌸 BeautyNear seed boshlandi...');
    await mongoose.connect(MONGO_URL);
    console.log('✅ MongoDB ulandi:', MONGO_URL);

    // 1. AGENT topish yoki yaratish
    let agent: any = await Member.findOne({ memberType: 'AGENT' });
    if (!agent) {
        console.log('⚠️  AGENT topilmadi — yangi yaratilyapti...');
        agent = await Member.create({
            memberType: 'AGENT',
            memberStatus: 'ACTIVE',
            memberAuthType: 'PHONE',
            memberPhone: '01012345678',
            memberNick: 'TestAgent',
            memberPassword: '$2b$10$abcdefghijklmnopqrstuv', // placeholder hash
            memberFullName: 'Test Agent',
            memberImage: '',
            memberAddress: 'Seoul',
            memberDesc: 'Seed test agent',
            memberSalons: 0,
            memberArticles: 0,
            memberFollowers: 0,
            memberFollowings: 0,
            memberPoints: 0,
            memberLikes: 0,
            memberViews: 0,
            memberRank: 0,
            memberWarnings: 0,
            memberBlocks: 0,
        });
        console.log('✅ AGENT yaratildi:', agent._id.toString());
    } else {
        console.log('✅ Mavjud AGENT ishlatiladi:', agent._id.toString());
    }

    // 2. Eski test salonlarni tozalash (faqat shu agentniki)
    await Service.deleteMany({ memberId: agent._id });
    await Salon.deleteMany({ memberId: agent._id });
    console.log('🧹 Eski test salon/service tozalandi');

    // 3. Salon + service yaratish
    let salonCount = 0;
    let serviceCount = 0;
    const salonsCreated: any[] = [];

    for (let i = 0; i < SALONS.length; i++) {
        const s = SALONS[i];
        const lat = SEOUL.lat + jitter();
        const lng = SEOUL.lng + jitter();

        const salon: any = await Salon.create({
            salonType: s.type,
            salonStatus: 'ACTIVE',
            salonLocation: 'SEOUL',
            salonAddress: s.addr,
            salonTitle: s.title,
            salonDesc: s.desc,
            salonImages: [SALON_IMAGES[i % SALON_IMAGES.length], SALON_IMAGES[(i + 1) % SALON_IMAGES.length]],
            salonPhone: s.phone,
            salonWorkHours: s.hours,
            salonInstagram: '@' + s.title.toLowerCase().replace(/\s+/g, '_'),
            salonViews: s.views,
            salonLikes: s.likes,
            salonComments: 0,
            salonRank: s.rank,
            salonFollowers: Math.floor(s.likes / 2),
            depositAmount: 10000,
            salonLatitude: lat,
            salonLongitude: lng,
            salonLocation2d: { type: 'Point', coordinates: [lng, lat] },
            memberId: agent._id,
        });
        salonCount++;
        salonsCreated.push(salon);

        // Service qo'shish
        const templates = SERVICE_TEMPLATES[s.type] || [];
        for (let j = 0; j < templates.length; j++) {
            const tmpl = templates[j];
            await Service.create({
                serviceType: s.type,
                serviceStatus: 'ACTIVE',
                serviceTitle: tmpl.title,
                serviceDesc: tmpl.desc,
                servicePrice: tmpl.price,
                serviceDuration: tmpl.dur,
                serviceImages: [
                    SERVICE_IMAGES[(i + j) % SERVICE_IMAGES.length],
                    SERVICE_IMAGES[(i + j + 1) % SERVICE_IMAGES.length],
                ],
                serviceViews: Math.floor(Math.random() * 500) + 50,
                serviceLikes: Math.floor(Math.random() * 100) + 10,
                serviceComments: 0,
                serviceRank: Math.floor(Math.random() * 5),
                serviceRating: 4.5 + Math.random() * 0.4,
                salonId: salon._id,
                memberId: agent._id,
                serviceFollowers: Math.floor(Math.random() * 30),
            });
            serviceCount++;
        }
        console.log(`  ✓ ${s.title} (${templates.length} service)`);
    }

    // ─── 3.5. TEST REVIEWS (comments) ──────────────────────────────────────
    // Reviewer memberlar (USER tipida) — comment muallifi sifatida
    const REVIEWERS = [
        { nick: 'Jisoo Park', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80' },
        { nick: 'Minji Kim', img: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80' },
        { nick: 'Soojin Lee', img: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&q=80' },
        { nick: 'Hana Choi', img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80' },
        { nick: 'Yuna Jung', img: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&q=80' },
    ];

    const REVIEW_TEXTS = [
        'Amazing experience! My skin feels so much better after the treatment. The staff is very professional and kind.',
        'Best salon in Gangnam! The design was perfect and lasted long. Will definitely come back!',
        'Great service and clean environment. Highly recommend this place!',
        'Loved the result. The specialist really knows what they are doing. Worth every won.',
        'Friendly staff and cozy atmosphere. Booking was super easy too.',
        'Exceeded my expectations. Already booked my next appointment!',
    ];

    // Reviewer memberlarni topish yoki yaratish (unikal telefon bilan)
    const reviewerMembers: any[] = [];
    for (let ri = 0; ri < REVIEWERS.length; ri++) {
        const r = REVIEWERS[ri];
        let m: any = await Member.findOne({ memberNick: r.nick });
        if (!m) {
            m = await Member.create({
                memberType: 'USER',
                memberStatus: 'ACTIVE',
                memberAuthType: 'EMAIL',
                memberNick: r.nick,
                memberPassword: '$2b$10$seedPlaceholderHashForTestUserAccount000000000000000',
                memberImage: r.img,
                memberPhone: `010-9000-${String(1000 + ri).padStart(4, '0')}`,
            });
        }
        reviewerMembers.push(m);
    }

    // Eski test commentlarni tozalash
    await Comment.deleteMany({ commentGroup: 'SALON', commentRefId: { $in: salonsCreated.map((s) => s._id) } });

    let commentCount = 0;
    for (const salon of salonsCreated) {
        // Har salonga 3-4 ta review
        const reviewQty = 3 + Math.floor(Math.random() * 2);
        for (let k = 0; k < reviewQty; k++) {
            const reviewer = reviewerMembers[(commentCount + k) % reviewerMembers.length];
            await Comment.create({
                commentGroup: 'SALON',
                commentStatus: 'ACTIVE',
                commentContent: REVIEW_TEXTS[(commentCount + k) % REVIEW_TEXTS.length],
                commentRefId: salon._id,
                memberId: reviewer._id,
            });
            commentCount++;
        }
        // Salon commentlar sonini yangilash
        await Salon.updateOne({ _id: salon._id }, { $set: { salonComments: reviewQty } });
    }
    console.log(`  ✓ ${commentCount} test review (comment) yaratildi`);

    // 4. Board articles (community posts)
    await BoardArticle.deleteMany({ memberId: agent._id });
    let articleCount = 0;
    for (let i = 0; i < ARTICLES.length; i++) {
        const a = ARTICLES[i];
        await BoardArticle.create({
            articleCategory: 'FREE',
            articleStatus: 'ACTIVE',
            articleTitle: a.title,
            articleContent: a.content,
            articleImage: ARTICLE_IMAGES[i % ARTICLE_IMAGES.length],
            articleLikes: Math.floor(Math.random() * 120) + 15,
            articleViews: Math.floor(Math.random() * 800) + 100,
            articleComments: Math.floor(Math.random() * 40) + 3,
            memberId: agent._id,
        });
        articleCount++;
        console.log(`  ✓ Article: ${a.title}`);
    }

    console.log(`\n🎉 Tugadi: ${salonCount} salon, ${serviceCount} service, ${commentCount} review, ${articleCount} article yaratildi`);
    await mongoose.disconnect();
    process.exit(0);
}

run().catch((err) => {
    console.error('❌ Seed xatosi:', err);
    process.exit(1);
});