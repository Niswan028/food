import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Package, Truck, CheckCircle2, MapPin, IndianRupee, Calendar, Star, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import { EmptyState, FullPageLoader, Badge } from '@/components/ui';
import { formatINR, formatDate, formatDateTime } from '@/lib/utils';
import { OrderWithItems, Review } from '@/types';

export function OrderHistoryPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [reviewingOrder, setReviewingOrder] = useState<OrderWithItems | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  useEffect(() => {
    (async () => {
      if (!user) return;

      const { data: rawOrders, error } = await supabase
        .from('orders')
        .select('*')
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        toast(error.message, 'error');
        setLoading(false);
        return;
      }

      const ordersData = (rawOrders as any[]) ?? [];
      const orderIds = ordersData.map(order => order.id);

      const itemResults = orderIds.length
        ? await Promise.all(
            orderIds.map(async (orderId) => (
              await supabase.from('order_items').select('*').eq('order_id', orderId)
            ))
          )
        : [];

      const itemsByOrder = new Map<string, any[]>();
      itemResults.forEach((result) => {
        const rowItems = result.data ?? [];
        rowItems.forEach((item) => {
          const list = itemsByOrder.get(item.order_id) ?? [];
          list.push(item);
          itemsByOrder.set(item.order_id, list);
        });
      });

      const batchIds = [...new Set((itemResults.flatMap((result) => (result.data ?? []).map((item) => item.batch_id))))];
      let batchesById = new Map<string, any>();

      if (batchIds.length) {
        const batchResults = await Promise.all(
          batchIds.map(async (batchId) => await supabase.from('produce_batches').select('*').eq('id', batchId).maybeSingle())
        );

        batchResults.forEach((result) => {
          if (result.data) batchesById.set(result.data.id, result.data);
        });
      }

      const enrichedOrders = ordersData.map((order) => {
        const items = (itemsByOrder.get(order.id) ?? []).map((item) => ({
          ...item,
          produce_batches: batchesById.get(item.batch_id) ?? null,
        }));

        return {
          ...order,
          order_items: items,
        } as OrderWithItems;
      });

      setOrders(enrichedOrders);
      setLoading(false);
    })();
  }, [user, toast]);

  const submitReview = async (order: OrderWithItems) => {
    if (!user) return;
    for (const item of order.order_items) {
      const { error } = await supabase.from('reviews').insert({
        order_id: order.id,
        batch_id: item.batch_id,
        farmer_id: item.produce_batches?.farmer_id,
        buyer_id: user.id,
        rating,
        comment,
      });
      if (error && !error.message.includes('duplicate')) {
        toast(`Review failed: ${error.message}`, 'error');
        return;
      }
    }
    toast('Review submitted!', 'success');
    setReviewingOrder(null);
    setComment('');
    setRating(5);
  };

  if (loading) return <FullPageLoader message="Loading your orders..." />;

  if (orders.length === 0) {
    return (
      <div className="py-16">
        <EmptyState
          icon={<Package className="h-8 w-8" />}
          title="No orders yet"
          description="When you place orders, they'll appear here with full tracking."
          action={<Link to="/marketplace" className="btn-primary">Browse Marketplace</Link>}
        />
      </div>
    );
  }

  const statusSteps = ['confirmed', 'packed', 'shipped', 'delivered'];

  return (
    <div className="min-h-screen bg-earth-50">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <h1 className="mb-6 font-display text-2xl font-bold text-earth-950">Order History</h1>

        <div className="space-y-4">
          {orders.map((order, i) => {
            const statusIdx = statusSteps.indexOf(order.status);
            const isDelivered = order.status === 'delivered';
            return (
              <motion.div key={order.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-earth-950">Order #{order.id.slice(0, 8)}</p>
                    <p className="text-xs text-earth-500">{formatDateTime(order.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-display text-lg font-bold text-earth-950">{formatINR(order.total_amount)}</span>
                    <Badge variant={order.payment_status === 'paid' ? 'success' : 'warning'}>
                      {order.payment_status === 'paid' ? 'Paid' : 'Pending'}
                    </Badge>
                  </div>
                </div>

                {/* Status tracker */}
                {order.status !== 'cancelled' && (
                  <div className="mt-4 flex items-center gap-2">
                    {statusSteps.map((step, idx) => (
                      <div key={step} className="flex flex-1 items-center gap-2">
                        <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs ${idx <= statusIdx ? 'bg-primary-600 text-white' : 'bg-earth-100 text-earth-400'}`}>
                          {idx < statusIdx ? <CheckCircle2 className="h-4 w-4" /> : idx === 0 ? <Package className="h-3 w-3" /> : idx === 1 ? <Package className="h-3 w-3" /> : idx === 2 ? <Truck className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
                        </div>
                        <span className={`text-xs capitalize ${idx <= statusIdx ? 'font-medium text-earth-900' : 'text-earth-400'}`}>{step}</span>
                        {idx < statusSteps.length - 1 && <div className={`h-0.5 flex-1 ${idx < statusIdx ? 'bg-primary-600' : 'bg-earth-200'}`} />}
                      </div>
                    ))}
                  </div>
                )}

                {/* Items */}
                <div className="mt-4 space-y-2">
                  {order.order_items.map(oi => (
                    <div key={oi.id} className="flex items-center justify-between rounded-lg bg-earth-50 px-3 py-2 text-sm">
                      <div className="flex items-center gap-3">
                        {oi.produce_batches?.photo_urls?.[0] ? (
                          <img src={oi.produce_batches.photo_urls[0]} alt="" className="h-10 w-10 rounded-lg object-cover" />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-primary-700">
                            <Package className="h-4 w-4" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-earth-900">{oi.produce_batches?.crop_name}</p>
                          <Link to={`/trace/${oi.produce_batches?.batch_code}`} className="text-xs text-primary-600 hover:underline">Trace this product</Link>
                        </div>
                      </div>
                      <span className="font-medium text-earth-700">{oi.quantity} {oi.produce_batches?.unit} · {formatINR(oi.line_total)}</span>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                {isDelivered && (
                  <div className="mt-4 flex gap-2 border-t border-earth-100 pt-4">
                    <button onClick={() => setReviewingOrder(order)} className="btn-ghost text-xs">
                      <Star className="h-3 w-3" /> Leave a Review
                    </button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Review modal */}
      {reviewingOrder && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-earth-950/50 p-4 backdrop-blur-sm"
          onClick={() => setReviewingOrder(null)}>
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-earth-100 px-6 py-4">
              <h2 className="font-display text-lg font-bold text-earth-950">Rate Your Order</h2>
              <button onClick={() => setReviewingOrder(null)} className="text-earth-400"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="mb-2 text-sm font-medium text-earth-700">Your rating</p>
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <button key={i} onClick={() => setRating(i + 1)}>
                      <Star className={`h-8 w-8 ${i < rating ? 'fill-warning-400 text-warning-400' : 'text-earth-200'}`} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">Comment (optional)</label>
                <textarea value={comment} onChange={(e) => setComment(e.target.value)} className="input min-h-[80px]" placeholder="Share your experience with this produce..." />
              </div>
              <button onClick={() => submitReview(reviewingOrder)} className="btn-primary w-full">Submit Review</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
