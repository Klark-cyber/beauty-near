/**
 * BeautyNear — Help Center uchun 10 ta FAQ yaratuvchi seed skripti
 *
 * ISHGA TUSHIRISH (loyihaning BOSH papkasidan):
 *   npx ts-node seed-faq.ts
 */

import mongoose, { Schema } from 'mongoose';
import * as dotenv from 'dotenv';

dotenv.config();

const MONGO_URL =
    process.env.MONGO_PRODUCTION ||
    process.env.MONGO_DEV ||
    process.env.MONGO ||
    'mongodb://localhost:27017/beautynear';

const FaqSchema = new Schema({}, { strict: false, collection: 'faqs', timestamps: true });
const Faq = mongoose.model('Faq', FaqSchema);

const FAQS = [
    {
        faqCategory: 'BOOKING',
        faqQuestion: 'How do I book an appointment?',
        faqAnswer: "You can book an appointment by selecting a salon, choosing your preferred service, date, and time. Once confirmed, you'll receive a booking confirmation via email and in-app notification.",
    },
    {
        faqCategory: 'BOOKING',
        faqQuestion: 'Can I cancel or reschedule my booking?',
        faqAnswer: 'Yes, you can cancel or reschedule your booking from the "My Bookings" page up to 24 hours before your appointment for a full deposit refund. Cancellations made later may not be eligible for a refund.',
    },
    {
        faqCategory: 'PAYMENT',
        faqQuestion: 'What payment methods do you accept?',
        faqAnswer: 'We accept all major credit and debit cards, as well as popular local payment methods through our secure payment partner, TossPayments. A small deposit is required to confirm your booking.',
    },
    {
        faqCategory: 'PAYMENT',
        faqQuestion: 'Are there any fees for using the service?',
        faqAnswer: 'Browsing salons and booking appointments on BeautyNear is completely free. You only pay for the services you book directly, plus a small refundable deposit to secure your reservation.',
    },
    {
        faqCategory: 'ACCOUNT',
        faqQuestion: 'How do I update my profile information?',
        faqAnswer: 'Go to "My Page" → "Edit Profile" to update your name, phone number, profile photo, and other personal details at any time.',
    },
    {
        faqCategory: 'ACCOUNT',
        faqQuestion: 'How do I change my password?',
        faqAnswer: 'You can change your password from "My Page" → "Edit Profile" → "Change Password". You will need to enter your current password before setting a new one.',
    },
    {
        faqCategory: 'SALONS',
        faqQuestion: 'How do I find a salon near me?',
        faqAnswer: 'Use the "Salons" page and allow location access, or search by region. You can also filter by service type, price range, and rating to find the perfect match nearby.',
    },
    {
        faqCategory: 'SALONS',
        faqQuestion: 'How can I contact a salon?',
        faqAnswer: 'Each salon page displays a phone number and address. You can also send a message through the booking confirmation once your appointment is set.',
    },
    {
        faqCategory: 'OTHER',
        faqQuestion: "I didn't receive a booking confirmation.",
        faqAnswer: 'Please check your spam/junk folder first. If you still cannot find it, visit "My Bookings" in the app to confirm your reservation status, or contact our support team through the Inquiry tab.',
    },
    {
        faqCategory: 'OTHER',
        faqQuestion: 'Is my personal information secure?',
        faqAnswer: 'Yes. We use industry-standard encryption to protect your personal and payment information, and we never share your data with third parties without your consent.',
    },
];

async function run() {
    console.log('FAQ seed boshlandi...');
    await mongoose.connect(MONGO_URL);
    console.log('MongoDB ulandi');

    await Faq.deleteMany({});
    console.log('Eski FAQ yozuvlari tozalandi');

    let count = 0;
    for (const item of FAQS) {
        await Faq.create({
            faqCategory: item.faqCategory,
            faqStatus: 'ACTIVE',
            faqQuestion: item.faqQuestion,
            faqAnswer: item.faqAnswer,
        });
        count++;
        console.log('  fixed: ' + item.faqQuestion);
    }

    console.log('Done: ' + count + ' ta FAQ yaratildi.');
    await mongoose.disconnect();
    process.exit(0);
}

run().catch((err) => {
    console.error('Xato:', err);
    process.exit(1);
});