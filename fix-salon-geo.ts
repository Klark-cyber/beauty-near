/**
 * Mavjud barcha salonlarning salonLocation2d maydonini
 * ularning salonLatitude/salonLongitude asosida to'g'irlaydi.
 * (Nearby Salons — $geoNear — ishlashi uchun zarur)
 *
 * ISHGA TUSHIRISH (loyihaning BOSH papkasidan):
 *   npx ts-node fix-salon-geo.ts
 */

import mongoose, { Schema } from 'mongoose';
import * as dotenv from 'dotenv';

dotenv.config();

const MONGO_URL =
    process.env.MONGO_PRODUCTION ||
    process.env.MONGO_DEV ||
    process.env.MONGO ||
    'mongodb://localhost:27017/beautynear';

const SalonSchema = new Schema({}, { strict: false, collection: 'salons' });
const Salon = mongoose.model('Salon', SalonSchema);

async function run() {
    console.log('Salon geo-koordinata tuzatish boshlandi...');
    await mongoose.connect(MONGO_URL);
    console.log('MongoDB ulandi');

    const salons: any[] = await Salon.find({
        salonLatitude: { $exists: true, $ne: null },
        salonLongitude: { $exists: true, $ne: null },
    });

    console.log(`${salons.length} ta salon topildi, tuzatilmoqda...`);

    let count = 0;
    for (const salon of salons) {
        await Salon.updateOne(
            { _id: salon._id },
            {
                $set: {
                    salonLocation2d: {
                        type: 'Point',
                        coordinates: [salon.salonLongitude, salon.salonLatitude],
                    },
                },
            },
        );
        console.log(`  tuzatildi: ${salon.salonTitle} → [${salon.salonLongitude}, ${salon.salonLatitude}]`);
        count++;
    }

    console.log(`Done: ${count} ta salon tuzatildi.`);
    await mongoose.disconnect();
    process.exit(0);
}

run().catch((err) => {
    console.error('Xato:', err);
    process.exit(1);
});