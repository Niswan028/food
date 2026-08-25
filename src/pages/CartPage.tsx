import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, ShoppingCart, ArrowLeft, IndianRupee, MapPin, Phone, CreditCard, CheckCircle2, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import { EmptyState, LoadingSpinner } from '@/components/ui';
import { formatINR, INDIAN_STATES } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

interface CartItem {
  batchId: string;
  cropName: string;
  pricePerUnit: number;
  unit: string;
  qty: number;
  farmerName: string;
  batchCode: string;
  photoUrl: string;
  maxQty: number;
}

export function CartPage() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [checkout, setCheckout] = useState(false);
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState('');
  const [state, setState] = useState('');
  const [phone, setPhone] = useState('');
  const [orderComplete, setOrderComplete] = useState(false);

  useEffect(() => {
    setCart(JSON.parse(localStorage.getItem('farmtrace_cart') ?? '[]'));
    if (profile?.phone) setPhone(profile.phone);
  }, [profile]);

  const total = cart.reduce((s, c) => s + c.pricePerUnit * c.qty, 0);

  const updateQty = (batchId: string, qty: number) => {
    const updated = cart.map(c => c.batchId === batchId ? { ...c, qty } : c);
    setCart(updated);
    localStorage.setItem('farmtrace_cart', JSON.stringify(updated));
  };

  const removeItem = (batchId: string) => {
    const updated = cart.filter(c => c.batchId !== batchId);
    setCart(updated);
    localStorage.setItem('farmtrace_cart', JSON.stringify(updated));
    toast('Item removed from cart', 'info');
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast('Please sign in', 'warning'); navigate('/login'); return; }
    if (!address || !state || !phone) { toast('Please fill in all fields', 'warning'); return; }
    setLoading(true);

    // Create order
    const { data: order, error: orderErr } = await supabase.from('orders').insert({
      buyer_id: user.id,
      total_amount: total,
      status: 'confirmed',
      payment_status: 'paid',
      shipping_address: address,
      shipping_state: state,
      buyer_phone: phone,
    }).select().single();

    if (orderErr) {
      setLoading(false);
      toast(`Order failed: ${orderErr.message}`, 'error');
      return;
    }

    // Create order items
    const items = cart.map(c => ({
      order_id: order.id,
      batch_id: c.batchId,
      quantity: c.qty,
      unit_price: c.pricePerUnit,
      line_total: c.pricePerUnit * c.qty,
      buyer_id: user.id,
    }));
    const { error: itemsErr } = await supabase.from('order_items').insert(items);
    if (itemsErr) { toast(`Items failed: ${itemsErr.message}`, 'error'); setLoading(false); return; }

    // Create payment record (mock Razorpay)
    await supabase.from('payments').insert({
      order_id: order.id,
      amount: total,
      status: 'paid',
      method: 'upi',
      razorpay_order_id: `order_${order.id.slice(0, 12)}`,
      razorpay_payment_id: `pay_${Date.now()}`,
    });

    // Update batch statuses to 'sold'
    for (const c of cart) {
      await supabase.from('produce_batches').update({ status: 'sold' }).eq('id', c.batchId);
    }

    setLoading(false);
    setOrderComplete(true);
    localStorage.removeItem('farmtrace_cart');
    toast('Order placed successfully!', 'success');
  };

  if (orderComplete) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="card max-w-md text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success-100 text-success-600">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h2 className="font-display text-xl font-bold text-earth-950">Order Placed!</h2>
          <p className="mt-2 text-sm text-earth-600">Your order has been confirmed and payment received. The farmer has been notified.</p>
          <div className="mt-6 flex gap-3">
            <Link to="/orders" className="btn-primary flex-1">View Orders</Link>
            <Link to="/marketplace" className="btn-secondary flex-1">Continue Shopping</Link>
          </div>
        </motion.div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="py-16">
        <EmptyState
          icon={<ShoppingCart className="h-8 w-8" />}
          title="Your cart is empty"
          description="Browse the marketplace to add fresh produce to your cart."
          action={<Link to="/marketplace" className="btn-primary">Browse Marketplace</Link>}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-earth-50">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <Link to="/marketplace" className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-earth-600 hover:text-primary-600">
          <ArrowLeft className="h-4 w-4" /> Continue Shopping
        </Link>
        <h1 className="mb-6 font-display text-2xl font-bold text-earth-950">Your Cart</h1>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Cart items */}
          <div className="lg:col-span-2 space-y-3">
            <AnimatePresence>
              {cart.map(item => (
                <motion.div key={item.batchId} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -20 }}
                  className="card flex items-center gap-4">
                  {item.photoUrl ? (
                    <img src={item.photoUrl} alt={item.cropName} className="h-16 w-16 rounded-lg object-cover" />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-primary-100 text-primary-700">🥬</div>
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-earth-900">{item.cropName}</p>
                    <p className="text-xs text-earth-500">{item.batchCode} · by {item.farmerName}</p>
                    <p className="mt-1 text-sm font-semibold text-primary-700">{formatINR(item.pricePerUnit)}/{item.unit}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQty(item.batchId, Math.max(1, item.qty - 1))} className="flex h-7 w-7 items-center justify-center rounded-lg border border-earth-200 text-earth-600">-</button>
                    <span className="w-10 text-center text-sm font-medium">{item.qty}</span>
                    <button onClick={() => updateQty(item.batchId, Math.min(item.maxQty, item.qty + 1))} className="flex h-7 w-7 items-center justify-center rounded-lg border border-earth-200 text-earth-600">+</button>
                  </div>
                  <p className="w-20 text-right font-semibold text-earth-900">{formatINR(item.pricePerUnit * item.qty)}</p>
                  <button onClick={() => removeItem(item.batchId)} className="text-earth-400 hover:text-error-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Summary */}
          <div className="space-y-4">
            <div className="card">
              <h3 className="mb-4 font-semibold text-earth-950">Order Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-earth-600">
                  <span>Items ({cart.length})</span>
                  <span>{formatINR(total)}</span>
                </div>
                <div className="flex justify-between text-earth-600">
                  <span>Delivery</span>
                  <span className="text-success-600">Free</span>
                </div>
                <div className="border-t border-earth-100 pt-2 flex justify-between font-semibold text-earth-950">
                  <span>Total</span>
                  <span className="font-display text-lg">{formatINR(total)}</span>
                </div>
              </div>
              <button onClick={() => setCheckout(true)} className="btn-primary mt-4 w-full">
                <CreditCard className="h-4 w-4" /> Proceed to Checkout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Checkout modal */}
      {checkout && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-earth-950/50 p-4 backdrop-blur-sm"
          onClick={() => setCheckout(false)}>
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-earth-100 px-6 py-4">
              <h2 className="font-display text-lg font-bold text-earth-950">Checkout</h2>
              <button onClick={() => setCheckout(false)} className="text-earth-400"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleCheckout} className="space-y-4 p-6">
              <div>
                <label className="label">Delivery Address</label>
                <textarea value={address} onChange={(e) => setAddress(e.target.value)} className="input min-h-[70px]" placeholder="House number, street, city" />
              </div>
              <div>
                <label className="label">State</label>
                <select value={state} onChange={(e) => setState(e.target.value)} className="input">
                  <option value="">Select state</option>
                  {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Phone Number</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} className="input" placeholder="+91 98765 43210" />
              </div>
              <div className="rounded-xl bg-primary-50 p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-primary-800">Total Amount</span>
                  <span className="font-display text-lg font-bold text-primary-700">{formatINR(total)}</span>
                </div>
                <p className="mt-1 text-xs text-primary-600">Payment via Razorpay (test mode)</p>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? <LoadingSpinner size="sm" /> : <><CreditCard className="h-4 w-4" /> Pay {formatINR(total)}</>}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
