import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 4000);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://Natesh:Natesh@cluster0.wwp3oig.mongodb.net/';
const MONGODB_DB = process.env.MONGODB_DB || 'farmtrace';

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const demoStore = {
  profiles: [
    {
      id: 'user-farmer-1',
      email: 'raghav.farmer@farmtrace.in',
      full_name: 'Raghav Patil',
      role: 'farmer',
      phone: '+91 98765 43210',
      avatar_url: null,
      created_at: new Date().toISOString(),
    },
    {
      id: 'user-buyer-1',
      email: 'rahul.buyer@farmtrace.in',
      full_name: 'Rahul Mehta',
      role: 'buyer',
      phone: '+91 98111 22334',
      avatar_url: null,
      created_at: new Date().toISOString(),
    },
    {
      id: 'user-admin-1',
      email: 'admin@farmtrace.in',
      full_name: 'FarmTrace Admin',
      role: 'admin',
      phone: '+91 90000 00001',
      avatar_url: null,
      created_at: new Date().toISOString(),
    },
  ],
  farmer_profiles: [
    {
      id: 'fp-1',
      user_id: 'user-farmer-1',
      farm_name: 'Patil Family Farms',
      location: 'Nashik, Maharashtra',
      state: 'Maharashtra',
      farm_size_acres: 18,
      crops_grown: ['Tomato', 'Onion', 'Wheat'],
      certifications: ['Organic', 'FSSAI'],
      verification_status: 'approved',
      document_url: null,
      bio: 'Sustainable farming with direct-to-market produce.',
      created_at: new Date().toISOString(),
    },
  ],
  produce_batches: [
    {
      id: 'batch-1',
      batch_code: 'FT-01-001',
      farmer_id: 'user-farmer-1',
      crop_name: 'Tomato',
      category: 'Vegetables',
      quantity: 520,
      unit: 'kg',
      harvest_date: '2025-08-10',
      price_per_unit: 38,
      quality_grade: 'A',
      certifications: ['Organic'],
      photo_urls: [],
      description: 'Fresh organic tomatoes from Nashik.',
      status: 'available',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  supply_chain_events: [
    {
      id: 'event-1',
      batch_id: 'batch-1',
      event_type: 'created',
      actor: 'Raghav Patil',
      location: 'Nashik, Maharashtra',
      notes: 'Batch FT-01-001 listed on FarmTrace.',
      created_at: new Date().toISOString(),
    },
    {
      id: 'event-2',
      batch_id: 'batch-1',
      event_type: 'harvested',
      actor: 'Raghav Patil',
      location: 'Nashik, Maharashtra',
      notes: 'Harvested 520 kg of Tomatoes.',
      created_at: new Date().toISOString(),
    },
    {
      id: 'event-3',
      batch_id: 'batch-1',
      event_type: 'quality_checked',
      actor: 'Raghav Patil',
      location: 'Nashik, Maharashtra',
      notes: 'Quality grade A assigned. Organic certification verified.',
      created_at: new Date().toISOString(),
    },
  ],
  orders: [
    {
      id: 'order-1',
      buyer_id: 'user-buyer-1',
      total_amount: 152,
      status: 'confirmed',
      payment_status: 'paid',
      shipping_address: '12 Market Road, Bengaluru',
      shipping_state: 'Karnataka',
      buyer_phone: '+91 98111 22334',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  order_items: [
    {
      id: 'order-item-1',
      order_id: 'order-1',
      batch_id: 'batch-1',
      quantity: 2,
      unit_price: 38,
      line_total: 76,
      buyer_id: 'user-buyer-1',
    },
  ],
  payments: [
    {
      id: 'payment-1',
      order_id: 'order-1',
      razorpay_order_id: 'order_demo_001',
      razorpay_payment_id: 'pay_demo_001',
      razorpay_signature: 'demo_signature',
      amount: 152,
      status: 'paid',
      method: 'upi',
      created_at: new Date().toISOString(),
    },
  ],
  reviews: [],
  blockchain_anchor: [],
  storage: [],
};

let mongoClient = null;
let mongoDb = null;

async function connectMongo() {
  try {
    mongoClient = new MongoClient(MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
    await mongoClient.connect();
    mongoDb = mongoClient.db(MONGODB_DB);
    console.log(`Connected to MongoDB database: ${mongoDb.databaseName}`);
    await ensureCollections();
  } catch (error) {
    console.warn('MongoDB unavailable, using demo data fallback.');
    console.warn(error.message);
    mongoDb = null;
  }
}

async function ensureCollections() {
  if (!mongoDb) return;
  const collections = Object.keys(demoStore);
  for (const name of collections) {
    const exists = await mongoDb.listCollections({ name }).hasNext();
    if (!exists) {
      await mongoDb.createCollection(name);
      await mongoDb.collection(name).insertMany(demoStore[name]);
    } else {
      const count = await mongoDb.collection(name).countDocuments();
      if (count === 0) {
        await mongoDb.collection(name).insertMany(demoStore[name]);
      }
    }
  }
}

function sendCollectionResult(res, data, error = null, count = null) {
  res.json({ data, error, count });
}

function applyFilters(items, filters) {
  return items.filter((item) => {
    return Object.entries(filters).every(([key, value]) => {
      if (value === undefined || value === null || value === '') return true;
      const itemValue = item[key];
      if (Array.isArray(itemValue)) return itemValue.includes(value);
      if (typeof value === 'string') return String(itemValue ?? '') === value;
      return itemValue === value;
    });
  });
}

function getCollectionData(collectionName) {
  return demoStore[collectionName] || [];
}

async function listRecords(collectionName, filters = {}, sort = {}, limitValue = null) {
  if (!mongoDb) {
    const items = applyFilters(getCollectionData(collectionName), filters);
    const sorted = Object.keys(sort).length
      ? [...items].sort((a, b) => {
          const key = Object.keys(sort)[0];
          const dir = sort[key] >= 0 ? 1 : -1;
          return String(a[key] ?? '').localeCompare(String(b[key] ?? '')) * dir;
        })
      : items;
    return limitValue ? sorted.slice(0, Number(limitValue)) : sorted;
  }

  const collection = mongoDb.collection(collectionName);
  let query = collection.find(filters);
  const sortKeys = Object.keys(sort);
  if (sortKeys.length) {
    const mongoSort = {};
    sortKeys.forEach((key) => {
      mongoSort[key] = sort[key] >= 0 ? 1 : -1;
    });
    query = query.sort(mongoSort);
  }
  if (limitValue) {
    query = query.limit(Number(limitValue));
  }
  return query.toArray();
}

async function saveRecord(collectionName, payload) {
  if (!mongoDb) {
    const items = getCollectionData(collectionName);
    const next = { ...payload, id: payload.id || `${collectionName}-${Date.now()}` };
    items.push(next);
    return next;
  }

  const collection = mongoDb.collection(collectionName);
  const result = await collection.insertOne(payload);
  return await collection.findOne({ _id: result.insertedId });
}

async function updateRecord(collectionName, id, payload) {
  if (!mongoDb) {
    const items = getCollectionData(collectionName);
    const index = items.findIndex((item) => item.id === id);
    if (index === -1) return null;
    const updated = { ...items[index], ...payload };
    items[index] = updated;
    return updated;
  }

  const collection = mongoDb.collection(collectionName);
  const result = await collection.findOneAndUpdate(
    { id },
    { $set: payload },
    { returnDocument: 'after' }
  );
  return result.value;
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, message: 'FarmTrace backend is running', database: mongoDb ? mongoDb.databaseName : 'demo-mode' });
});

app.post('/api/auth/signin', (req, res) => {
  const { email, password } = req.body || {};
  const profile = demoStore.profiles.find((p) => p.email === email);

  if (!profile || password !== 'FarmTrace123!') {
    return sendCollectionResult(res, null, 'Invalid email or password');
  }

  sendCollectionResult(res, { user: profile, session: { user: profile } });
});

app.post('/api/auth/signup', (req, res) => {
  const { email, password, full_name, role, phone } = req.body || {};

  if (!email || !password || !full_name || !role) {
    return sendCollectionResult(res, null, 'Missing required fields');
  }

  const existing = demoStore.profiles.find((p) => p.email === email);
  if (existing) return sendCollectionResult(res, null, 'User already exists');

  const user = {
    id: `user-${Date.now()}`,
    email,
    full_name,
    role,
    phone: phone || null,
    avatar_url: null,
    created_at: new Date().toISOString(),
  };

  demoStore.profiles.push(user);
  sendCollectionResult(res, { user, session: { user } });
});

app.get('/api/:collection', async (req, res) => {
  const { collection } = req.params;
  const filters = { ...req.query };
  const sort = {};
  const limitValue = req.query.limit || null;

  if (req.query.order_by) {
    const orderDir = req.query.order_dir === 'desc' ? -1 : 1;
    sort[req.query.order_by] = orderDir;
  }

  const normalizedFilters = {};
  Object.entries(filters).forEach(([key, value]) => {
    if (['limit', 'order_by', 'order_dir', 'count', 'head'].includes(key)) return;
    normalizedFilters[key] = value;
  });

  try {
    const data = await listRecords(collection, normalizedFilters, sort, limitValue);
    sendCollectionResult(res, data, null, data.length);
  } catch (error) {
    sendCollectionResult(res, null, error.message);
  }
});

app.post('/api/:collection', async (req, res) => {
  const { collection } = req.params;
  try {
    const item = await saveRecord(collection, req.body);
    sendCollectionResult(res, item, null);
  } catch (error) {
    sendCollectionResult(res, null, error.message);
  }
});

app.put('/api/:collection/:id', async (req, res) => {
  const { collection, id } = req.params;
  try {
    const item = await updateRecord(collection, id, req.body);
    sendCollectionResult(res, item, null);
  } catch (error) {
    sendCollectionResult(res, null, error.message);
  }
});

app.post('/api/storage/upload', (req, res) => {
  const { fileName, file } = req.body || {};
  const path = fileName || `uploads/${Date.now()}`;
  demoStore.storage.push({ path, file });
  res.json({ data: { path }, error: null });
});

connectMongo().then(() => {
  app.listen(PORT, () => {
    console.log(`FarmTrace backend listening on http://localhost:${PORT}`);
  });
});

export { app, demoStore };
