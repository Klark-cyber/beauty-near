/**
 * Parol xatosi tufayli bloklanib qolgan hisobni tiklovchi skript.
 *
 * Muammo: parol yangilash bug'i tuzatilishidan OLDIN o'zgartirilgan
 * parollar hash qilinmasdan, oddiy matn holida saqlanib qolgan edi.
 * Endi kod tuzatildi, lekin ESKI (buzuq) yozuvni bu tuzatish
 * o'zi ANIQLAY olmaydi — shuning uchun qo'lda tiklaymiz.
 *
 * ISHGA TUSHIRISH (loyihaning BOSH papkasidan):
 *   npx ts-node fix-broken-password.ts <memberNick> <yangiParol>
 *
 * MISOL:
 *   npx ts-node fix-broken-password.ts David Test1234!
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

const MemberSchema = new Schema({}, { strict: false, collection: 'members' });
const Member = mongoose.model('Member', MemberSchema);

async function run() {
    const memberNick = process.argv[2];
    const newPassword = process.argv[3];

    if (!memberNick || !newPassword) {
        console.error('Foydalanish: npx ts-node fix-broken-password.ts <memberNick> <yangiParol>');
        process.exit(1);
    }

    console.log(`"${memberNick}" hisobini tiklash boshlandi...`);
    await mongoose.connect(MONGO_URL);
    console.log('MongoDB ulandi');

    const member = await Member.findOne({ memberNick });
    if (!member) {
        console.error(`XATO: "${memberNick}" nomli foydalanuvchi topilmadi.`);
        await mongoose.disconnect();
        process.exit(1);
    }

    const hashed = await bcrypt.hash(newPassword, await bcrypt.genSalt());
    await Member.findByIdAndUpdate(member._id, { memberPassword: hashed });

    console.log(`✅ "${memberNick}" hisobi tiklandi. Yangi parol: ${newPassword}`);
    console.log('Endi shu parol bilan login qilishga urinib ko\'ring.');

    await mongoose.disconnect();
}

run().catch((err) => {
    console.error('XATO:', err);
    process.exit(1);
});