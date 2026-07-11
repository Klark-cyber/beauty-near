import mongoose, { Schema } from 'mongoose';
import * as dotenv from 'dotenv';

dotenv.config();

const MONGO_URL =
    process.env.MONGO_PRODUCTION ||
    process.env.MONGO_DEV ||
    process.env.MONGO ||
    'mongodb://localhost:27017/beautynear';

const MemberSchema = new Schema({}, { strict: false, collection: 'members', timestamps: true });
// to'g'ri nom: 'boardArticles' (katta A bilan)
const BoardArticleSchema = new Schema({}, { strict: false, collection: 'boardArticles', timestamps: true });

const Member = mongoose.model('Member', MemberSchema);
const BoardArticle = mongoose.model('BoardArticle', BoardArticleSchema);

async function run() {
    console.log('Articles hisoblagichini tuzatish boshlandi...');
    await mongoose.connect(MONGO_URL);
    console.log('MongoDB ulandi');

    const allMembers: any[] = await Member.find({ memberStatus: { $ne: 'DELETE' } });
    console.log(allMembers.length + ' ta member topildi');

    let fixedCount = 0;

    for (const member of allMembers) {
        const memberId = member._id;

        const articlesCount = await BoardArticle.countDocuments({
            memberId: memberId,
            articleStatus: { $ne: 'DELETE' },
        });

        if (member.memberArticles !== articlesCount) {
            await Member.updateOne({ _id: memberId }, { $set: { memberArticles: articlesCount } });
            console.log('fixed ' + member.memberNick + ': Articles ' + member.memberArticles + ' -> ' + articlesCount);
            fixedCount++;
        }
    }

    console.log('Done: ' + fixedCount + ' member(s) article counters fixed.');

    await mongoose.disconnect();
    process.exit(0);
}

run().catch((err) => {
    console.error('Error:', err);
    process.exit(1);
});
