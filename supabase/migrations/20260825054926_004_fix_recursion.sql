/*
# Fix infinite recursion in RLS policies

The admin-check policies (EXISTS SELECT FROM profiles ...) caused infinite recursion
when querying profiles itself or any table that triggers a profile lookup.
Replace all admin checks with auth.jwt() ->> 'role' = 'admin' which reads the role
directly from the JWT claim without a recursive table lookup.

Also fixes the profiles SELECT policy for admin.
*/

-- PROFILES: admin read uses JWT claim, not recursive query
DROP POLICY IF EXISTS "select_all_profiles_for_admin" ON profiles;
CREATE POLICY "select_all_profiles_for_admin" ON profiles FOR SELECT
  TO authenticated USING (auth.jwt() ->> 'role' = 'admin');

-- FARMER_PROFILES: admin update uses JWT claim
DROP POLICY IF EXISTS "admin_update_farmer_profile" ON farmer_profiles;
CREATE POLICY "admin_update_farmer_profile" ON farmer_profiles FOR UPDATE
  TO authenticated USING (auth.jwt() ->> 'role' = 'admin');

-- ORDERS: admin read uses JWT claim
DROP POLICY IF EXISTS "admin_read_orders" ON orders;
CREATE POLICY "admin_read_orders" ON orders FOR SELECT
  TO authenticated USING (auth.jwt() ->> 'role' = 'admin');

-- ORDER_ITEMS: admin read uses JWT claim
DROP POLICY IF EXISTS "admin_read_order_items" ON order_items;
CREATE POLICY "admin_read_order_items" ON order_items FOR SELECT
  TO authenticated USING (auth.jwt() ->> 'role' = 'admin');

-- PAYMENTS: admin read uses JWT claim
DROP POLICY IF EXISTS "admin_read_payments" ON payments;
CREATE POLICY "admin_read_payments" ON payments FOR SELECT
  TO authenticated USING (auth.jwt() ->> 'role' = 'admin');

-- REVIEWS: admin delete uses JWT claim
DROP POLICY IF EXISTS "admin_delete_review" ON reviews;
CREATE POLICY "admin_delete_review" ON reviews FOR DELETE
  TO authenticated USING (auth.jwt() ->> 'role' = 'admin');
