/*
# FarmTrace RLS Policies

Adds role-based row-level security policies to all FarmTrace tables.
All tables already exist from migration 001.

## Policy summary
- profiles: self read/update/insert; admin read all
- farmer_profiles: public read; farmer insert/update own; admin update any
- produce_batches: public read; farmer insert/update/delete own
- supply_chain_events: public read; farmer insert/delete own (via batch ownership)
- orders: buyer read/insert/update own; farmer read/update orders containing their batches; admin read all
- order_items: buyer/farmer/admin read (scoped); buyer insert own
- payments: buyer read/insert/update own (via order ownership); admin read all
- reviews: public read; buyer insert/delete own; admin delete any
- blockchain_anchor: public read; farmer insert own (via batch ownership)
*/

-- PROFILES
DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);
DROP POLICY IF EXISTS "select_all_profiles_for_admin" ON profiles;
CREATE POLICY "select_all_profiles_for_admin" ON profiles FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );
DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

-- FARMER_PROFILES
DROP POLICY IF EXISTS "public_read_farmer_profiles" ON farmer_profiles;
CREATE POLICY "public_read_farmer_profiles" ON farmer_profiles FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "insert_own_farmer_profile" ON farmer_profiles;
CREATE POLICY "insert_own_farmer_profile" ON farmer_profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_farmer_profile" ON farmer_profiles;
CREATE POLICY "update_own_farmer_profile" ON farmer_profiles FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "admin_update_farmer_profile" ON farmer_profiles;
CREATE POLICY "admin_update_farmer_profile" ON farmer_profiles FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- PRODUCE_BATCHES
DROP POLICY IF EXISTS "public_read_batches" ON produce_batches;
CREATE POLICY "public_read_batches" ON produce_batches FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "insert_own_batch" ON produce_batches;
CREATE POLICY "insert_own_batch" ON produce_batches FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = farmer_id);
DROP POLICY IF EXISTS "update_own_batch" ON produce_batches;
CREATE POLICY "update_own_batch" ON produce_batches FOR UPDATE
  TO authenticated USING (auth.uid() = farmer_id) WITH CHECK (auth.uid() = farmer_id);
DROP POLICY IF EXISTS "delete_own_batch" ON produce_batches;
CREATE POLICY "delete_own_batch" ON produce_batches FOR DELETE
  TO authenticated USING (auth.uid() = farmer_id);

-- SUPPLY_CHAIN_EVENTS
DROP POLICY IF EXISTS "public_read_events" ON supply_chain_events;
CREATE POLICY "public_read_events" ON supply_chain_events FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "insert_own_events" ON supply_chain_events;
CREATE POLICY "insert_own_events" ON supply_chain_events FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM produce_batches b WHERE b.id = batch_id AND b.farmer_id = auth.uid())
  );
DROP POLICY IF EXISTS "delete_own_events" ON supply_chain_events;
CREATE POLICY "delete_own_events" ON supply_chain_events FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM produce_batches b WHERE b.id = batch_id AND b.farmer_id = auth.uid())
  );

-- ORDERS
DROP POLICY IF EXISTS "buyer_read_own_orders" ON orders;
CREATE POLICY "buyer_read_own_orders" ON orders FOR SELECT
  TO authenticated USING (auth.uid() = buyer_id);
DROP POLICY IF EXISTS "farmer_read_orders_for_batches" ON orders;
CREATE POLICY "farmer_read_orders_for_batches" ON orders FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM order_items oi
      JOIN produce_batches b ON b.id = oi.batch_id
      WHERE oi.order_id = orders.id AND b.farmer_id = auth.uid()
    )
  );
DROP POLICY IF EXISTS "admin_read_orders" ON orders;
CREATE POLICY "admin_read_orders" ON orders FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );
DROP POLICY IF EXISTS "buyer_insert_own_order" ON orders;
CREATE POLICY "buyer_insert_own_order" ON orders FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = buyer_id);
DROP POLICY IF EXISTS "buyer_update_own_order" ON orders;
CREATE POLICY "buyer_update_own_order" ON orders FOR UPDATE
  TO authenticated USING (auth.uid() = buyer_id) WITH CHECK (auth.uid() = buyer_id);
DROP POLICY IF EXISTS "farmer_update_orders_for_batches" ON orders;
CREATE POLICY "farmer_update_orders_for_batches" ON orders FOR UPDATE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM order_items oi
      JOIN produce_batches b ON b.id = oi.batch_id
      WHERE oi.order_id = orders.id AND b.farmer_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM order_items oi
      JOIN produce_batches b ON b.id = oi.batch_id
      WHERE oi.order_id = orders.id AND b.farmer_id = auth.uid()
    )
  );

-- ORDER_ITEMS
DROP POLICY IF EXISTS "buyer_read_own_order_items" ON order_items;
CREATE POLICY "buyer_read_own_order_items" ON order_items FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM orders o WHERE o.id = order_id AND o.buyer_id = auth.uid())
  );
DROP POLICY IF EXISTS "farmer_read_order_items" ON order_items;
CREATE POLICY "farmer_read_order_items" ON order_items FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM produce_batches b WHERE b.id = batch_id AND b.farmer_id = auth.uid())
  );
DROP POLICY IF EXISTS "admin_read_order_items" ON order_items;
CREATE POLICY "admin_read_order_items" ON order_items FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );
DROP POLICY IF EXISTS "buyer_insert_own_order_items" ON order_items;
CREATE POLICY "buyer_insert_own_order_items" ON order_items FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM orders o WHERE o.id = order_id AND o.buyer_id = auth.uid())
  );

-- PAYMENTS
DROP POLICY IF EXISTS "buyer_read_own_payments" ON payments;
CREATE POLICY "buyer_read_own_payments" ON payments FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM orders o WHERE o.id = order_id AND o.buyer_id = auth.uid())
  );
DROP POLICY IF EXISTS "admin_read_payments" ON payments;
CREATE POLICY "admin_read_payments" ON payments FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );
DROP POLICY IF EXISTS "buyer_insert_own_payment" ON payments;
CREATE POLICY "buyer_insert_own_payment" ON payments FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM orders o WHERE o.id = order_id AND o.buyer_id = auth.uid())
  );
DROP POLICY IF EXISTS "buyer_update_own_payment" ON payments;
CREATE POLICY "buyer_update_own_payment" ON payments FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM orders o WHERE o.id = order_id AND o.buyer_id = auth.uid())
  );

-- REVIEWS
DROP POLICY IF EXISTS "public_read_reviews" ON reviews;
CREATE POLICY "public_read_reviews" ON reviews FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "buyer_insert_own_review" ON reviews;
CREATE POLICY "buyer_insert_own_review" ON reviews FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = buyer_id);
DROP POLICY IF EXISTS "buyer_delete_own_review" ON reviews;
CREATE POLICY "buyer_delete_own_review" ON reviews FOR DELETE
  TO authenticated USING (auth.uid() = buyer_id);
DROP POLICY IF EXISTS "admin_delete_review" ON reviews;
CREATE POLICY "admin_delete_review" ON reviews FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- BLOCKCHAIN_ANCHOR
DROP POLICY IF EXISTS "public_read_anchor" ON blockchain_anchor;
CREATE POLICY "public_read_anchor" ON blockchain_anchor FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "insert_own_anchor" ON blockchain_anchor;
CREATE POLICY "insert_own_anchor" ON blockchain_anchor FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM produce_batches b WHERE b.id = batch_id AND b.farmer_id = auth.uid())
  );
