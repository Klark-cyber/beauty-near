/**
 * BeautyNear — Help Center uchun Notice (10 ta) va Inquiry (10 ta,
 * mavjud memberlarga bog'langan) yozuvlarini yaratuvchi seed skripti
 *
 * ISHGA TUSHIRISH (loyihaning BOSH papkasidan):
 *   npx ts-node seed-notice-inquiry.ts
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
const NoticeSchema = new Schema({}, { strict: false, collection: 'notices', timestamps: true });
const InquirySchema = new Schema({}, { strict: false, collection: 'inquiries', timestamps: true });

const Member = mongoose.model('Member', MemberSchema);
const Notice = mongoose.model('Notice', NoticeSchema);
const Inquiry = mongoose.model('Inquiry', InquirySchema);

const NOTICES = [
    { noticeType: 'EVENT', noticeTitle: 'BeautyNear Summer Event 2026', noticeContent: 'Join our special summer event and enjoy exclusive discounts on popular services! Valid until August 31st at participating salons.', noticePinned: true, noticeViews: 1200 },
    { noticeType: 'NOTICE', noticeTitle: 'System Maintenance Notice', noticeContent: 'We will be performing system maintenance on May 15, 2026 from 02:00 AM to 06:00 AM. The app may be temporarily unavailable during this time.', noticePinned: true, noticeViews: 856 },
    { noticeType: 'WARNING', noticeTitle: 'Beware of Scams and Unauthorized Calls', noticeContent: 'BeautyNear will never ask for your password or personal information via phone or email. Please report any suspicious activity to our support team.', noticePinned: true, noticeViews: 643 },
    { noticeType: 'NOTICE', noticeTitle: 'New Salon Partner Program Launched', noticeContent: "We're excited to welcome 50+ new verified salons to the BeautyNear platform this month across Seoul and Busan.", noticePinned: false, noticeViews: 642 },
    { noticeType: 'EVENT', noticeTitle: 'BeautyNear 2nd Anniversary Event', noticeContent: 'Celebrate two years with us! Enjoy special anniversary discounts and giveaways throughout the month.', noticePinned: false, noticeViews: 4100 },
    { noticeType: 'NOTICE', noticeTitle: 'Updated Cancellation Policy', noticeContent: 'Starting next month, cancellations made less than 12 hours before your appointment may incur a small fee. Please review the updated policy.', noticePinned: false, noticeViews: 512 },
    { noticeType: 'EVENT', noticeTitle: 'Refer a Friend, Get ₩10,000 Off', noticeContent: 'Invite your friends to BeautyNear and you both receive a ₩10,000 discount on your next booking once they complete their first appointment.', noticePinned: false, noticeViews: 2300 },
    { noticeType: 'WARNING', noticeTitle: 'Temporary Payment Delay Notice', noticeContent: 'Some users may experience delays in deposit refunds due to a temporary issue with our payment partner. We are working to resolve this quickly.', noticePinned: false, noticeViews: 389 },
    { noticeType: 'NOTICE', noticeTitle: 'Mobile App Update Available', noticeContent: 'Version 2.4 is now available with improved booking speed, bug fixes, and a redesigned salon detail page. Update now for the best experience.', noticePinned: false, noticeViews: 978 },
    { noticeType: 'NOTICE', noticeTitle: 'Holiday Business Hours', noticeContent: 'Please note that many salons will have adjusted hours during the upcoming national holiday. Check individual salon pages for details.', noticePinned: false, noticeViews: 421 },
];

const INQUIRIES = [
    { inquirySubject: 'Issue with booking confirmation', inquiryMessage: "I didn't receive the booking confirmation email after paying the deposit. Can you check my reservation status?", inquiryStatus: 'WAITING' },
    { inquirySubject: 'Refund not received', inquiryMessage: 'I requested a refund but haven\'t received it yet. It has been 5 business days since my cancellation.', inquiryStatus: 'ANSWERED', inquiryReply: "Hi! We've checked your refund request and it has been processed. Please allow 1-2 more business days for it to reflect in your account. Thank you for your patience!" },
    { inquirySubject: 'Change appointment time', inquiryMessage: 'I need to change my appointment to a different time. Is this possible without cancelling?', inquiryStatus: 'CLOSED', inquiryReply: 'Yes, you can reschedule directly from "My Bookings" up to 24 hours in advance. Your request has been resolved. Let us know if you need anything else!' },
    { inquirySubject: 'Payment failed but amount deducted', inquiryMessage: 'My payment failed but the amount was deducted from my card. Please help resolve this.', inquiryStatus: 'ANSWERED', inquiryReply: "We're sorry for the inconvenience. This was a temporary issue with our payment gateway and the amount has been automatically refunded to your original payment method." },
    { inquirySubject: 'Cannot upload profile photo', inquiryMessage: "I keep getting an error when trying to upload a new profile photo. It just says 'upload failed'.", inquiryStatus: 'WAITING' },
    { inquirySubject: 'Salon location incorrect on map', inquiryMessage: 'The map pin for "Glow Skin Lab" shows the wrong location. Could you please fix this?', inquiryStatus: 'WAITING' },
    { inquirySubject: 'Request to delete my account', inquiryMessage: 'I would like to permanently delete my BeautyNear account and all associated data.', inquiryStatus: 'CLOSED', inquiryReply: 'Your account deletion request has been processed. All your personal data has been removed in accordance with our privacy policy. We hope to see you again in the future!' },
    { inquirySubject: 'Double charged for one booking', inquiryMessage: 'I was charged twice for the same booking at Chic Salon Apgujeong. Please refund the duplicate charge.', inquiryStatus: 'ANSWERED', inquiryReply: 'We found the duplicate transaction and have refunded the extra charge to your card. It should appear within 3-5 business days. Apologies for the inconvenience!' },
    { inquirySubject: 'How to become a verified salon partner?', inquiryMessage: 'I own a nail salon in Gangnam and would like to list it on BeautyNear. What is the process?', inquiryStatus: 'WAITING' },
    { inquirySubject: 'App crashes on checkout page', inquiryMessage: 'The app crashes every time I try to complete a booking on the payment step. I am using an iPhone 14.', inquiryStatus: 'WAITING' },
];

async function run() {
    console.log('Notice va Inquiry seed boshlandi...');
    await mongoose.connect(MONGO_URL);
    console.log('MongoDB ulandi');

    /* ── NOTICE ── */
    await Notice.deleteMany({});
    for (const item of NOTICES) {
        await Notice.create({
            noticeType: item.noticeType,
            noticeStatus: 'ACTIVE',
            noticeTitle: item.noticeTitle,
            noticeContent: item.noticeContent,
            noticePinned: item.noticePinned,
            noticeViews: item.noticeViews,
        });
        console.log('  notice: ' + item.noticeTitle);
    }
    console.log(NOTICES.length + ' ta Notice yaratildi.');

    /* ── INQUIRY — barchasi "Martin" hisobiga biriktiriladi (test uchun) ── */
    const martin: any = await Member.findOne({ memberNick: 'Martin' });
    if (!martin) {
        console.log('  Ogohlantirish: "Martin" nomli member topilmadi, Inquiry yaratilmadi.');
    } else {
        await Inquiry.deleteMany({});
        for (const item of INQUIRIES) {
            await Inquiry.create({
                inquiryStatus: item.inquiryStatus,
                inquirySubject: item.inquirySubject,
                inquiryMessage: item.inquiryMessage,
                inquiryReply: item.inquiryReply,
                memberId: martin._id,
            });
            console.log('  inquiry: ' + item.inquirySubject);
        }
        console.log(INQUIRIES.length + ' ta Inquiry "Martin" hisobiga yaratildi.');
    }

    await mongoose.disconnect();
    process.exit(0);
}

run().catch((err) => {
    console.error('Xato:', err);
    process.exit(1);
});