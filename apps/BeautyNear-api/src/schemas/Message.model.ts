import { Schema } from 'mongoose';

// ⚠️ YANGI — avval xabarlar faqat serverning operativ xotirasida
// (in-memory) saqlanardi, backend qayta ishga tushganda BUTUNLAY
// yo'qolardi. Endi Telegram kabi doimiy saqlanadi.
const MessageSchema = new Schema(
    {
        senderId: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: 'Member',
        },

        receiverId: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: 'Member',
        },

        messageText: {
            type: String,
            required: true,
        },

        isRead: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true, collection: 'messages' },
);

// Ikki kishi orasidagi suhbatni tez topish uchun indeks
MessageSchema.index({ senderId: 1, receiverId: 1, createdAt: 1 });
MessageSchema.index({ receiverId: 1, senderId: 1, createdAt: 1 });

export default MessageSchema;