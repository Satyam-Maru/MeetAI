import { MongoClient } from 'mongodb';
import pkg from 'bloom-filters';
const { BloomFilter } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const client = new MongoClient(process.env.MONGO_ATLAS_URI);
const dbName = process.env.MONGO_DB_NAME;
const collectionName = process.env.MONGO_COLLECTION_NAME;

async function loadFilter(key) {
  await client.connect();
  const db = client.db(dbName);
  const col = db.collection(collectionName);

  const doc = await col.findOne({ _id: key });

  if (doc?.filterJSON) {
    try {
      const filter = BloomFilter.fromJSON(doc.filterJSON);
      console.log('✅ Loaded Bloom filter from MongoDB');
      return filter;
    } catch (err) {
      console.warn('⚠️ Failed to load Bloom filter from JSON:', err.message);
    }
  }

  // fallback
  console.warn(`⚠️ Creating new Bloom filter for key: ${key}`);
  return BloomFilter.create(1000, 0.01); // expected items, FPR
}

async function saveFilter(key, filter) {
  await client.connect();
  const db = client.db(dbName);
  const col = db.collection(collectionName);

  const json = filter.saveAsJSON(); // v3 handles all metadata internally
  await col.updateOne(
    { _id: key },
    { $set: { filterJSON: json, updatedAt: new Date() } },
    { upsert: true }
  );
}

async function resetFilter(key) {
  console.log('resetting the filter')
  const filter = BloomFilter.create(1000, 0.01); // reset with same settings
  await saveFilter(key, filter);
  console.log(`🔁 Bloom filter reset for key: ${key}`);
}

// await resetFilter('livekit:room_bloom')

export { loadFilter, saveFilter };