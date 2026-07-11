/**
 * BeautyNear Community — Recommendation, News, Humor kategoriyalari
 * uchun maqolalar yaratuvchi seed skripti (Free Board allaqachon
 * to'ldirilgan edi, bu skript qolgan 3 kategoriyani to'ldiradi)
 *
 * ISHGA TUSHIRISH (loyihaning BOSH papkasidan):
 *   npx ts-node seed-community-articles.ts
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
const BoardArticleSchema = new Schema({}, { strict: false, collection: 'boardArticles', timestamps: true });

const Member = mongoose.model('Member', MemberSchema);
const BoardArticle = mongoose.model('BoardArticle', BoardArticleSchema);

const ARTICLE_IMAGES = [
    'https://images.unsplash.com/photo-1522337ec660-6ee0e4d7a4f6?w=800',
    'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800',
    'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=800',
    'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=800',
    'https://images.unsplash.com/photo-1519415510236-718bdfcd89c1?w=800',
    'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=800',
];

const ARTICLES = [
    // ── RECOMMEND ──────────────────────────────────────────────────
    {
        articleCategory: 'RECOMMEND',
        articleTitle: 'Best hidden-gem nail salon in Hongdae',
        articleContent: 'Just discovered this tiny nail studio near Hongik University station and honestly the detail work is incredible. Prices are very reasonable too — highly recommend booking through the app before they get more popular!',
    },
    {
        articleCategory: 'RECOMMEND',
        articleTitle: 'My top 3 skin clinics for acne treatment',
        articleContent: "After trying multiple clinics over the past year, I've narrowed it down to my top 3 for acne-prone skin. All three use gentle, dermatologist-approved methods and the staff are super knowledgeable. Happy to answer questions in the comments!",
    },
    {
        articleCategory: 'RECOMMEND',
        articleTitle: 'Affordable massage spots that don\'t skimp on quality',
        articleContent: "You don't need to spend a fortune for a great massage. Here are a few budget-friendly places in Seoul that consistently deliver excellent service without the premium price tag.",
    },
    {
        articleCategory: 'RECOMMEND',
        articleTitle: 'If you want the glass-skin look, try this facial combo',
        articleContent: 'Combining a hydrating facial with a light chemical peel every 3 weeks completely changed my skin texture. Sharing the exact routine and salon I go to for anyone curious!',
    },
    {
        articleCategory: 'RECOMMEND',
        articleTitle: 'Best hair salons for color correction in Gangnam',
        articleContent: 'If your last dye job went wrong, don\'t panic. These salons specialize in color correction and know exactly how to fix over-processed or uneven color without frying your hair further.',
    },
    // ── NEWS ───────────────────────────────────────────────────────
    {
        articleCategory: 'NEWS',
        articleTitle: 'K-Beauty trends taking over 2026',
        articleContent: 'Glass skin is out, "glow skin" with a more natural dewy finish is in. Industry experts are also seeing a huge rise in demand for scalp treatments and minimalist 3-step routines this year.',
    },
    {
        articleCategory: 'NEWS',
        articleTitle: 'New regulations for cosmetic clinics announced',
        articleContent: 'The health ministry has introduced updated safety standards for cosmetic procedures starting next quarter. All licensed clinics will need to comply with stricter sterilization and equipment certification requirements.',
    },
    {
        articleCategory: 'NEWS',
        articleTitle: 'Sustainable beauty: salons switching to eco-friendly products',
        articleContent: 'More salons across the city are transitioning to cruelty-free, low-waste product lines in response to growing customer demand for sustainable beauty options.',
    },
    {
        articleCategory: 'NEWS',
        articleTitle: 'BeautyNear reaches 10,000 bookings milestone!',
        articleContent: "We're thrilled to announce that our community has completed over 10,000 successful bookings! Thank you to every member, salon owner, and specialist who made this possible.",
    },
    // ── HUMOR ──────────────────────────────────────────────────────
    {
        articleCategory: 'HUMOR',
        articleTitle: 'When you ask for "just a trim" and leave with bangs',
        articleContent: "We've all been there. Told the stylist 'just a little off the ends' and somehow walked out with a completely new hairstyle. At least it looked great? 😅",
    },
    {
        articleCategory: 'HUMOR',
        articleTitle: 'My cat judged my sheet mask so hard',
        articleContent: 'Put on a sheet mask for the first time and my cat looked at me like I had personally betrayed the entire feline species. 10/10 would still do it again for the hydration though.',
    },
    {
        articleCategory: 'HUMOR',
        articleTitle: 'The eternal struggle of picking a nail color',
        articleContent: 'Spent 45 minutes at the salon trying to choose between two nearly identical shades of pink. The nail technician has the patience of a saint, honestly.',
    },
    {
        articleCategory: 'HUMOR',
        articleTitle: 'POV: you booked a 2pm appointment and it\'s already 2:15',
        articleContent: "Currently sitting in the waiting room refreshing the booking app every 30 seconds like it's going to make time move faster. Worth it for the results though!",
    },
];

async function run() {
    console.log('Community maqolalari seed boshlandi...');
    await mongoose.connect(MONGO_URL);
    console.log('MongoDB ulandi');

    const members: any[] = await Member.find({ memberStatus: { $ne: 'DELETE' } }).limit(10);
    if (members.length === 0) {
        console.log('Ogohlantirish: hech qanday member topilmadi, maqola yaratilmadi.');
        await mongoose.disconnect();
        process.exit(0);
    }

    let count = 0;
    for (const item of ARTICLES) {
        const member = members[count % members.length];
        const image = ARTICLE_IMAGES[count % ARTICLE_IMAGES.length];
        await BoardArticle.create({
            articleCategory: item.articleCategory,
            articleStatus: 'ACTIVE',
            articleTitle: item.articleTitle,
            articleContent: item.articleContent,
            articleImage: image,
            articleViews: Math.floor(Math.random() * 500) + 20,
            articleLikes: Math.floor(Math.random() * 80),
            articleComments: 0,
            memberId: member._id,
        });
        console.log(`  [${item.articleCategory}] ${item.articleTitle} (${member.memberNick})`);
        // ⚠️ memberArticles hisoblagichini ham yangilaymiz — aks holda
        // avvalgi seed skriptlaridagi kabi keyinroq alohida tuzatish kerak bo'ladi
        await Member.updateOne({ _id: member._id }, { $inc: { memberArticles: 1 } });
        count++;
    }

    console.log(`Done: ${count} ta maqola yaratildi.`);
    await mongoose.disconnect();
    process.exit(0);
}

run().catch((err) => {
    console.error('Xato:', err);
    process.exit(1);
});