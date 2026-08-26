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

const dataModel = Object.freeze({
  profiles: { id: 'string', email: 'string', full_name: 'string', role: 'farmer|buyer|admin', phone: 'string|null', avatar_url: 'string|null', created_at: 'datetime' },
  farmer_profiles: { id: 'string', user_id: 'string', farm_name: 'string', location: 'string', state: 'string', farm_size_acres: 'number', crops_grown: 'string[]', certifications: 'string[]', verification_status: 'pending|approved|rejected', document_url: 'string|null', bio: 'string|null', created_at: 'datetime' },
  produce_batches: { id: 'string', batch_code: 'string', farmer_id: 'string', crop_name: 'string', category: 'string', quantity: 'number', unit: 'string', harvest_date: 'date', price_per_unit: 'number', quality_grade: 'string', certifications: 'string[]', photo_urls: 'string[]', description: 'string|null', status: 'available|reserved|sold|packed|shipped|delivered|cancelled', created_at: 'datetime', updated_at: 'datetime' },
  orders: { id: 'string', buyer_id: 'string', total_amount: 'number', status: 'pending|confirmed|packed|shipped|delivered|cancelled', payment_status: 'pending|paid|failed|refunded', shipping_address: 'string', shipping_state: 'string|null', buyer_phone: 'string|null', created_at: 'datetime', updated_at: 'datetime' },
  order_items: { id: 'string', order_id: 'string', batch_id: 'string', quantity: 'number', unit_price: 'number', line_total: 'number', buyer_id: 'string' },
  payments: { id: 'string', order_id: 'string', amount: 'number', status: 'pending|paid|failed|refunded', method: 'string|null', razorpay_order_id: 'string|null', razorpay_payment_id: 'string|null', razorpay_signature: 'string|null', created_at: 'datetime' },
  blockchain_anchor: { id: 'string', batch_id: 'string', tx_hash: 'string', block_number: 'number', network: 'string', anchored_at: 'datetime' },
  reviews: { id: 'string', order_id: 'string', batch_id: 'string', farmer_id: 'string', buyer_id: 'string', rating: 'number', comment: 'string|null', created_at: 'datetime' },
});

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
      certifications: ['Organic', 'FSSAI'],
      photo_urls: ['https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=80'],
      description: 'Fresh organic tomatoes harvested from controlled drip-irrigated plots in Nashik.',
      status: 'available',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'batch-2',
      batch_code: 'FT-01-002',
      farmer_id: 'user-farmer-1',
      crop_name: 'Onion',
      category: 'Vegetables',
      quantity: 680,
      unit: 'kg',
      harvest_date: '2025-08-14',
      price_per_unit: 26,
      quality_grade: 'A+',
      certifications: ['Organic', 'Traceable'],
      photo_urls: ['https://images.unsplash.com/photo-1502741338009-cac2772e18bc?auto=format&fit=crop&w=900&q=80'],
      description: 'Premium red onions cultivated in a residue-free, low-moisture region.',
      status: 'packed',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'batch-3',
      batch_code: 'FT-01-003',
      farmer_id: 'user-farmer-1',
      crop_name: 'Wheat',
      category: 'Grains',
      quantity: 840,
      unit: 'kg',
      harvest_date: '2025-08-18',
      price_per_unit: 22,
      quality_grade: 'A',
      certifications: ['Chemical-Free'],
      photo_urls: ['https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=80'],
      description: 'High-protein wheat sourced from verified paddy-free fields and sorted for export quality.',
      status: 'shipped',
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
      notes: 'Batch FT-01-001 listed on FarmTrace and registered for buyer verification.',
      created_at: new Date().toISOString(),
    },
    {
      id: 'event-2',
      batch_id: 'batch-1',
      event_type: 'harvested',
      actor: 'Raghav Patil',
      location: 'Nashik, Maharashtra',
      notes: 'Harvested 520 kg of tomatoes using soil-safe irrigation and quality-controlled handling.',
      created_at: new Date().toISOString(),
    },
    {
      id: 'event-3',
      batch_id: 'batch-1',
      event_type: 'quality_checked',
      actor: 'FarmTrace Quality Desk',
      location: 'Nashik, Maharashtra',
      notes: 'Quality grade A assigned. Organic certification and residue testing completed.',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    },
    {
      id: 'event-4',
      batch_id: 'batch-2',
      event_type: 'created',
      actor: 'Raghav Patil',
      location: 'Nashik, Maharashtra',
      notes: 'Batch FT-01-002 entered the marketplace with origin and certification metadata.',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
    },
    {
      id: 'event-5',
      batch_id: 'batch-3',
      event_type: 'shipped',
      actor: 'Logistics Partner',
      location: 'Ahmednagar, Maharashtra',
      notes: 'Cold-chain transfer initiated for warehouse dispatch and retail tracking.',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 9).toISOString(),
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
    {
      id: 'order-2',
      buyer_id: 'user-buyer-1',
      total_amount: 234,
      status: 'shipped',
      payment_status: 'paid',
      shipping_address: '44 Residency Lane, Hyderabad',
      shipping_state: 'Telangana',
      buyer_phone: '+91 98111 22334',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
      updated_at: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
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
    {
      id: 'order-item-2',
      order_id: 'order-2',
      batch_id: 'batch-2',
      quantity: 3,
      unit_price: 26,
      line_total: 78,
      buyer_id: 'user-buyer-1',
    },
    {
      id: 'order-item-3',
      order_id: 'order-2',
      batch_id: 'batch-3',
      quantity: 4,
      unit_price: 22,
      line_total: 88,
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
    {
      id: 'payment-2',
      order_id: 'order-2',
      razorpay_order_id: 'order_demo_002',
      razorpay_payment_id: 'pay_demo_002',
      razorpay_signature: 'demo_signature_2',
      amount: 234,
      status: 'paid',
      method: 'card',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
    },
  ],
  reviews: [],
  blockchain_anchor: [
    {
      id: 'anchor-1',
      batch_id: 'batch-1',
      tx_hash: '0x7b4d2a3f6d87fd5f9d2a7d3b0c4a5f22cb8a9710d284c3a1bbd1f2145d31d67',
      block_number: 42189023,
      network: 'polygon-amoy',
      anchored_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    },
    {
      id: 'anchor-2',
      batch_id: 'batch-2',
      tx_hash: '0x4d4e90e1d476d12ab2a25cf10f0a3dbff9c7380ef32cc1f6b7d6ba39fc54ff33',
      block_number: 42189071,
      network: 'polygon-amoy',
      anchored_at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    },
  ],
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
  res.json({
    ok: true,
    message: 'FarmTrace backend is running',
    database: mongoDb ? mongoDb.databaseName : 'demo-mode',
    dataModel,
    blockchain: { mode: process.env.VITE_BLOCKCHAIN_RPC_URL || process.env.BLOCKCHAIN_RPC_URL ? 'live' : 'simulated' },
  });
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
