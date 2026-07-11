import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
    await mongoose.connect(process.env.MONGO_PRODUCTION || process.env.MONGO_DEV || process.env.MONGO || 'mongodb://localhost:27017/beautynear');
    const collection = mongoose.connection.collection('follows');
    const indexes = await collection.indexes();
    console.log('Mavjud indexlar:', indexes.map((i) => i.name));

    for (const name of ['followingId_1_followerId_1', 'salonId_1_followerId_1', 'serviceId_1_followerId_1']) {
        try {
            await collection.dropIndex(name);
            console.log(`✅ o'chirildi: ${name}`);
        } catch (e: any) {
            console.log(`⏭️  o'tkazib yuborildi (${name}):`, e.message);
        }
    }

    console.log("Backend serverni qayta ishga tushiring — Mongoose to'g'ri indexlarni avtomatik yaratadi.");
    await mongoose.disconnect();
    process.exit(0);
}
run();