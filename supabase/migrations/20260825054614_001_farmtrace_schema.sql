/*
# FarmTrace Core Schema — Tables & Enums

Creates all tables and enums for FarmTrace.
Policies are added in a follow-up migration (002) to avoid cross-table reference errors.

1. New Tables
   - profiles, farmer_profiles, produce_batches, supply_chain_events,
     orders, order_items, payments, reviews, blockchain_anchor
2. Enums
   - user_role, batch_status, event_type, order_status, payment_status, verification_status
3. RLS enabled on all tables (policies added in 002).
*/

-- ENUMS
DO $$ BEGIN CREATE TYPE user_role AS ENUM ('farmer', 'buyer', 'admin'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE batch_status AS ENUM ('available','reserved','sold','packed','shipped','delivered','cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE event_type AS ENUM ('created','harvested','quality_checked','packed','shipped','delivered','cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE order_status AS ENUM ('pending','confirmed','packed','shipped','delivered','cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE payment_status AS ENUM ('pending','paid','failed','refunded'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE verification_status AS ENUM ('pending','approved','rejected'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- PROFILES
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL,
  role user_role NOT NULL DEFAULT 'buyer',
  phone text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- FARMER_PROFILES
CREATE TABLE IF NOT EXISTS farmer_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  farm_name text NOT NULL,
  location text NOT NULL,
  state text NOT NULL,
  farm_size_acres numeric(10,2),
  crops_grown text[] DEFAULT '{}',
  certifications text[] DEFAULT '{}',
  verification_status verification_status NOT NULL DEFAULT 'pending',
  document_url text,
  bio text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE farmer_profiles ENABLE ROW LEVEL SECURITY;

-- PRODUCE_BATCHES
CREATE TABLE IF NOT EXISTS produce_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_code text UNIQUE NOT NULL,
  farmer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  crop_name text NOT NULL,
  category text NOT NULL,
  quantity numeric(10,2) NOT NULL,
  unit text NOT NULL DEFAULT 'kg',
  harvest_date date NOT NULL,
  price_per_unit numeric(10,2) NOT NULL,
  quality_grade text NOT NULL DEFAULT 'A',
  certifications text[] DEFAULT '{}',
  photo_urls text[] DEFAULT '{}',
  description text,
  status batch_status NOT NULL DEFAULT 'available',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE produce_batches ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_batches_farmer_id ON produce_batches(farmer_id);
CREATE INDEX IF NOT EXISTS idx_batches_status ON produce_batches(status);
CREATE INDEX IF NOT EXISTS idx_batches_category ON produce_batches(category);

-- SUPPLY_CHAIN_EVENTS
CREATE TABLE IF NOT EXISTS supply_chain_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL REFERENCES produce_batches(id) ON DELETE CASCADE,
  event_type event_type NOT NULL,
  actor text NOT NULL,
  location text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE supply_chain_events ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_events_batch_id ON supply_chain_events(batch_id);

-- ORDERS
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_amount numeric(12,2) NOT NULL,
  status order_status NOT NULL DEFAULT 'pending',
  payment_status payment_status NOT NULL DEFAULT 'pending',
  shipping_address text NOT NULL,
  shipping_state text,
  buyer_phone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON orders(buyer_id);

-- ORDER_ITEMS
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  batch_id uuid NOT NULL REFERENCES produce_batches(id) ON DELETE RESTRICT,
  quantity numeric(10,2) NOT NULL,
  unit_price numeric(10,2) NOT NULL,
  line_total numeric(12,2) NOT NULL
);
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_batch_id ON order_items(batch_id);

-- PAYMENTS
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  razorpay_order_id text,
  razorpay_payment_id text,
  razorpay_signature text,
  amount numeric(12,2) NOT NULL,
  status payment_status NOT NULL DEFAULT 'pending',
  method text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);

-- REVIEWS
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  batch_id uuid NOT NULL REFERENCES produce_batches(id) ON DELETE CASCADE,
  farmer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_reviews_batch_id ON reviews(batch_id);
CREATE INDEX IF NOT EXISTS idx_reviews_farmer_id ON reviews(farmer_id);

-- BLOCKCHAIN_ANCHOR
CREATE TABLE IF NOT EXISTS blockchain_anchor (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL REFERENCES produce_batches(id) ON DELETE CASCADE,
  tx_hash text NOT NULL,
  block_number bigint NOT NULL,
  network text NOT NULL DEFAULT 'polygon-mumbai',
  anchored_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE blockchain_anchor ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_anchor_batch_id ON blockchain_anchor(batch_id);

-- UPDATED_AT TRIGGER
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_batches_updated_at ON produce_batches;
CREATE TRIGGER trigger_batches_updated_at
  BEFORE UPDATE ON produce_batches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trigger_orders_updated_at ON orders;
CREATE TRIGGER trigger_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
