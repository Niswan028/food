/*
# Fix circular RLS recursion by adding buyer_id to order_items

The mutual RLS recursion between orders and order_items is caused by:
  order_items buyer policy → checks orders → orders farmer policy → checks order_items → ...

Fix: add a buyer_id column to order_items so its buyer-scoped policies
can check ownership directly without joining orders. This breaks the cycle.

Also make order_items farmer-scoped policies check produce_batches only
(which they already do, no change needed there).
*/

ALTER TABLE order_items ADD COLUMN IF NOT EXISTS buyer_id uuid;

-- Backfill from orders
UPDATE order_items oi SET buyer_id = o.buyer_id FROM orders o WHERE oi.order_id = o.id AND oi.buyer_id IS NULL;

-- Make buyer_id non-nullable after backfill
ALTER TABLE order_items ALTER COLUMN buyer_id SET NOT NULL;

-- Add index
CREATE INDEX IF NOT EXISTS idx_order_items_buyer_id ON order_items(buyer_id);

-- Replace order_items buyer policies to use buyer_id directly (no orders join)
DROP POLICY IF EXISTS "buyer_read_own_order_items" ON order_items;
CREATE POLICY "buyer_read_own_order_items" ON order_items FOR SELECT
  TO authenticated USING (auth.uid() = buyer_id);

DROP POLICY IF EXISTS "buyer_insert_own_order_items" ON order_items;
CREATE POLICY "buyer_insert_own_order_items" ON order_items FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = buyer_id);
