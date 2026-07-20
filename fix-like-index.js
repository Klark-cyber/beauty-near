// Bir martalik tuzatish skripti — eski unique indeksni yangisiga almashtiradi
// Ishga tushirish: node fix-like-index.js
// (avval "mongoose" o'rnatilganini tekshiring — u allaqachon backend'da bor)

const mongoose = require('mongoose');

// ⚠️ MUHIM: quyidagi manzilni o'zingizning .env faylingizdagi
// MONGO_URI (yoki shunga o'xshash) qiymati bilan ALMASHTIRING
const MONGO_URI = 'mongodb+srv://jamshidshukuraliyev8066_db_user:hgUP31iSjZvDJYV8@cluster0.udz7uhh.mongodb.net/BeautyNear';

async function fix() {
    await mongoose.connect(MONGO_URI);
    const db = mongoose.connection.db;
    const collection = db.collection('likes');

    console.log('Joriy indekslar:');
    const indexes = await collection.indexes();
    console.log(indexes);

    // Eski notogri indeksni ochirish (agar mavjud bolsa)
    try {
        await collection.dropIndex('memberId_1_likeRefId_1');
        console.log('✅ Eski indeks ochirildi: memberId_1_likeRefId_1');
    } catch (err) {
        console.log('⚠️ Eski indeksni ochirishda xato (ehtimol allaqachon yoq):', err.message);
    }

    // Yangi, togri indeksni yaratish
    try {
        await collection.createIndex(
            { memberId: 1, likeRefId: 1, likeGroup: 1 },
            { unique: true },
        );
        console.log('✅ Yangi indeks yaratildi: memberId_1_likeRefId_1_likeGroup_1');
    } catch (err) {
        console.log('❌ Yangi indeksni yaratishda xato:', err.message);
    }

    console.log('\nYangilangan indekslar:');
    const newIndexes = await collection.indexes();
    console.log(newIndexes);

    await mongoose.disconnect();
    console.log('\n✅ Tugadi.');
}

fix().catch((err) => {
    console.error('XATO:', err);
    process.exit(1);
});