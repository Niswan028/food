/*
# Fix circular recursion between orders and order_items policies

The farmer_read_orders_for_batches policy joins order_items, whose own policies
query orders — causing mutual recursion. Fix by having the orders policy check
batch ownership via a subquery on order_items → produce_batches WITHOUT going
through orders again (order_items.farmer_read_order_items only queries
produce_batches, not orders, so no cycle).

The actual recursion is: orders SELECT policy → order_items SELECT policy →
orders SELECT policy. Fix by making order_items farmer-read policy check
produce_batches only (already does), and making the orders farmer-read policy
use a direct subquery that doesn't trigger order_items' orders-scoped policy.

Replace the farmer orders SELECT/UPDATE policies with versions that query
order_items + produce_batches in a single EXISTS without RLS recursion.
*/

-- Drop the problematic policies
DROP POLICY IF EXISTS "farmer_read_orders_for_batches" ON orders;
DROP POLICY IF EXISTS "farmer_update_orders_for_batches" ON orders;

-- Re-create using a direct subquery. The inner SELECT on order_items will
-- evaluate its own RLS, but farmer_read_order_items checks produce_batches
-- (not orders), breaking the cycle.
CREATE POLICY "farmer_read_orders_for_batches" ON orders FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM order_items oi
      JOIN produce_batches b ON b.id = oi.batch_id
      WHERE oi.order_id = orders.id AND b.farmer_id = auth.uid()
    )
  );

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
