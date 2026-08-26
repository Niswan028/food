import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Sprout, Package, IndianRupee, TrendingUp, Plus, QrCode,
  CheckCircle2, Truck, MapPin, Calendar, Award, Leaf,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import { LoadingSpinner, EmptyState, Badge, FullPageLoader } from '@/components/ui';
import { AddBatchModal } from '@/components/AddBatchModal';
import { QrCodeDisplay } from '@/components/QrCodeDisplay';
import { formatINR, formatDate, formatDateTime } from '@/lib/utils';
import { ProduceBatch, FarmerProfile, OrderWithItems, SupplyChainEvent } from '@/types';

type Tab = 'overview' | 'batches' | 'orders' | 'analytics';

export function FarmerDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('overview');
  const [farmerProfile, setFarmerProfile] = useState<FarmerProfile | null>(null);
  const [batches, setBatches] = useState<ProduceBatch[]>([]);
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showQrBatch, setShowQrBatch] = useState<ProduceBatch | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: fp }, { data: b }, { data: o }] = await Promise.all([
      supabase.from('farmer_profiles').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('produce_batches').select('*').eq('farmer_id', user.id).order('created_at', { ascending: false }),
      supabase.from('orders').select(`
        *,
        order_items (
          *,
          produce_batches (*)
        )
      `).order('created_at', { ascending: false }),
    ]);

    const normalizedOrders = ((o as OrderWithItems[]) ?? []).map((order) => ({
      ...order,
      order_items: Array.isArray(order.order_items) ? order.order_items : [],
    }));

    setFarmerProfile(fp as FarmerProfile | null);
    setBatches((b as ProduceBatch[]) ?? []);
    setOrders(normalizedOrders);
    setLoading(false);
  }, [user]);

  useEffect(() => { loadData(); }, [loadData, refreshKey]);

  if (loading) return <FullPageLoader message="Loading your farm dashboard..." />;

  const activeBatches = batches.filter(b => b.status === 'available');
  const soldBatches = batches.filter(b => ['sold', 'packed', 'shipped', 'delivered'].includes(b.status));
  const totalRevenue = soldBatches.reduce((sum, b) => {
    const orderItems = orders.flatMap((o) => Array.isArray(o.order_items) ? o.order_items : []);
    const item = orderItems.find((oi) => oi?.batch_id === b.id);
    return sum + (item?.line_total ?? 0);
  }, 0);

  const farmerIndex = 1; // simplified for batch code generation
  const farmerName = farmerProfile?.farm_name ?? user?.email ?? 'Farmer';

  return (
    <div className="min-h-screen bg-earth-50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-earth-950">{farmerProfile?.farm_name ?? 'My Farm'}</h1>
            <p className="text-sm text-earth-600">
              {farmerProfile ? `${farmerProfile.location} · ${farmerProfile.farm_size_acres} acres` : 'Set up your farm profile to get started'}
            </p>
          </div>
          <button onClick={() => setShowAddModal(true)} className="btn-primary">
            <Plus className="h-4 w-4" /> Add Produce Batch
          </button>
        </div>

        {/* Verification status */}
        {farmerProfile?.verification_status === 'pending' && (
          <div className="mb-6 flex items-center gap-3 rounded-xl bg-warning-50 border border-warning-200 px-4 py-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-warning-100 text-warning-700">
              <Award className="h-4 w-4" />
            </div>
            <p className="text-sm text-warning-800">Your farm is pending verification. You can list batches while we review your profile.</p>
          </div>
        )}
        {farmerProfile?.verification_status === 'approved' && (
          <div className="mb-6 flex items-center gap-3 rounded-xl bg-success-50 border border-success-200 px-4 py-3">
            <CheckCircle2 className="h-5 w-5 text-success-600" />
            <p className="text-sm text-success-800">Your farm is verified. Buyers can see your verification badge.</p>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 flex gap-1 rounded-xl bg-white p-1 shadow-sm">
          {(['overview', 'batches', 'orders', 'analytics'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium capitalize transition-all ${tab === t ? 'bg-primary-600 text-white' : 'text-earth-600 hover:bg-earth-50'}`}>
              {t}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <OverviewTab batches={batches} activeBatches={activeBatches.length} soldBatches={soldBatches.length} totalRevenue={totalRevenue} orders={orders} farmerProfile={farmerProfile} />
        )}
        {tab === 'batches' && (
          <BatchesTab batches={batches} onShowQr={(b) => setShowQrBatch(b)} onRefresh={() => setRefreshKey(k => k + 1)} />
        )}
        {tab === 'orders' && (
          <OrdersTab orders={orders} onRefresh={() => setRefreshKey(k => k + 1)} />
        )}
        {tab === 'analytics' && (
          <AnalyticsTab batches={batches} orders={orders} totalRevenue={totalRevenue} />
        )}
      </div>

      {showAddModal && (
        <AddBatchModal
          onClose={() => setShowAddModal(false)}
          onCreated={() => { setShowAddModal(false); setRefreshKey(k => k + 1); }}
          farmerBatchCount={batches.length}
          farmerIndex={farmerIndex}
        />
      )}

      {showQrBatch && (
        <QrModal batch={showQrBatch} onClose={() => setShowQrBatch(null)} />
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="card">
      <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>{icon}</div>
      <p className="text-sm text-earth-600">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold text-earth-950">{value}</p>
    </div>
  );
}

function OverviewTab({ batches, activeBatches, soldBatches, totalRevenue, orders, farmerProfile }: {
  batches: ProduceBatch[]; activeBatches: number; soldBatches: number; totalRevenue: number;
  orders: OrderWithItems[]; farmerProfile: FarmerProfile | null;
}) {
  const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'confirmed');
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<Package className="h-5 w-5 text-white" />} label="Active Batches" value={String(activeBatches)} color="bg-primary-600" />
        <StatCard icon={<CheckCircle2 className="h-5 w-5 text-white" />} label="Sold Batches" value={String(soldBatches)} color="bg-success-600" />
        <StatCard icon={<IndianRupee className="h-5 w-5 text-white" />} label="Total Revenue" value={formatINR(totalRevenue)} color="bg-accent-600" />
        <StatCard icon={<TrendingUp className="h-5 w-5 text-white" />} label="Pending Orders" value={String(pendingOrders.length)} color="bg-warning-600" />
      </div>

      {farmerProfile && (
        <div className="card">
          <h3 className="mb-4 font-semibold text-earth-950">Farm Profile</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs text-earth-500">Farm Name</p>
              <p className="font-medium text-earth-900">{farmerProfile.farm_name}</p>
            </div>
            <div>
              <p className="text-xs text-earth-500">Location</p>
              <p className="font-medium text-earth-900">{farmerProfile.location}</p>
            </div>
            <div>
              <p className="text-xs text-earth-500">Farm Size</p>
              <p className="font-medium text-earth-900">{farmerProfile.farm_size_acres} acres</p>
            </div>
            <div>
              <p className="text-xs text-earth-500">Certifications</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {farmerProfile.certifications.map(c => <Badge key={c} variant="success">{c}</Badge>)}
              </div>
            </div>
          </div>
          {farmerProfile.bio && <p className="mt-4 border-t border-earth-100 pt-4 text-sm text-earth-600">{farmerProfile.bio}</p>}
        </div>
      )}

      <div className="card">
        <h3 className="mb-4 font-semibold text-earth-950">Recent Batches</h3>
        {batches.length === 0 ? (
          <EmptyState icon={<Sprout className="h-8 w-8" />} title="No batches yet" description="Create your first produce batch to start selling." />
        ) : (
          <div className="space-y-2">
            {batches.slice(0, 5).map(b => (
              <div key={b.id} className="flex items-center justify-between rounded-xl border border-earth-100 px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-primary-700">
                    <Leaf className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-earth-900">{b.crop_name}</p>
                    <p className="text-xs text-earth-500">{b.batch_code} · {formatDate(b.harvest_date)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-earth-900">{formatINR(b.price_per_unit)}/{b.unit}</span>
                  <BatchStatusBadge status={b.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function BatchStatusBadge({ status }: { status: string }) {
  const map: Record<string, { variant: 'success' | 'warning' | 'info' | 'primary' | 'error' | 'default'; label: string }> = {
    available: { variant: 'success', label: 'Available' },
    reserved: { variant: 'warning', label: 'Reserved' },
    sold: { variant: 'info', label: 'Sold' },
    packed: { variant: 'primary', label: 'Packed' },
    shipped: { variant: 'info', label: 'Shipped' },
    delivered: { variant: 'success', label: 'Delivered' },
    cancelled: { variant: 'error', label: 'Cancelled' },
  };
  const { variant, label } = map[status] ?? { variant: 'default' as const, label: status };
  return <Badge variant={variant}>{label}</Badge>;
}

function BatchesTab({ batches, onShowQr, onRefresh }: {
  batches: ProduceBatch[]; onShowQr: (b: ProduceBatch) => void; onRefresh: () => void;
}) {
  const { toast } = useToast();
  const { user } = useAuth();

  const advanceStatus = async (batch: ProduceBatch) => {
    const flow: Record<string, string> = { sold: 'packed', packed: 'shipped', shipped: 'delivered' };
    const next = flow[batch.status];
    if (!next || !user) return;
    const farmerName = (await supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle()).data?.full_name ?? 'Farmer';
    const { data: fp } = await supabase.from('farmer_profiles').select('location').eq('user_id', user.id).maybeSingle();
    const { error } = await supabase.from('produce_batches').update({ status: next }).eq('id', batch.id);
    if (error) { toast(`Failed: ${error.message}`, 'error'); return; }
    await supabase.from('supply_chain_events').insert({
      batch_id: batch.id,
      event_type: next as SupplyChainEvent['event_type'],
      actor: farmerName,
      location: fp?.location ?? 'India',
      notes: `Status updated to ${next}.`,
    });
    toast(`Batch marked as ${next}`, 'success');
    onRefresh();
  };

  if (batches.length === 0) {
    return <EmptyState icon={<Sprout className="h-8 w-8" />} title="No batches yet" description="Create your first produce batch to start selling on the marketplace." />;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {batches.map(batch => (
        <div key={batch.id} className="card overflow-hidden p-0">
          {batch.photo_urls?.[0] ? (
            <img src={batch.photo_urls[0]} alt={batch.crop_name} className="h-40 w-full object-cover" />
          ) : (
            <div className="flex h-40 items-center justify-center bg-gradient-to-br from-primary-100 to-primary-200">
              <Leaf className="h-12 w-12 text-primary-400" />
            </div>
          )}
          <div className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-earth-950">{batch.crop_name}</h3>
                <p className="text-xs text-earth-500">{batch.batch_code}</p>
              </div>
              <BatchStatusBadge status={batch.status} />
            </div>
            <div className="mt-3 space-y-1 text-sm text-earth-600">
              <p className="flex items-center gap-2"><Package className="h-3 w-3" /> {batch.quantity} {batch.unit}</p>
              <p className="flex items-center gap-2"><IndianRupee className="h-3 w-3" /> {formatINR(batch.price_per_unit)}/{batch.unit}</p>
              <p className="flex items-center gap-2"><Calendar className="h-3 w-3" /> {formatDate(batch.harvest_date)}</p>
              <p className="flex items-center gap-2"><Award className="h-3 w-3" /> Grade {batch.quality_grade}</p>
            </div>
            {batch.certifications.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {batch.certifications.map(c => <Badge key={c} variant="success">{c}</Badge>)}
              </div>
            )}
            <div className="mt-4 flex gap-2">
              <button onClick={() => onShowQr(batch)} className="btn-ghost flex-1 text-xs">
                <QrCode className="h-3 w-3" /> QR Code
              </button>
              <Link to={`/trace/${batch.batch_code}`} className="btn-ghost flex-1 text-xs">
                View Trace
              </Link>
              {['sold', 'packed', 'shipped'].includes(batch.status) && (
                <button onClick={() => advanceStatus(batch)} className="btn-primary flex-1 text-xs">
                  {batch.status === 'sold' ? 'Pack' : batch.status === 'packed' ? 'Ship' : 'Deliver'}
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </motion.div>
  );
}

function OrdersTab({ orders, onRefresh }: { orders: OrderWithItems[]; onRefresh: () => void }) {
  const { toast } = useToast();
  const { user } = useAuth();

  const myOrders = orders.filter((o) => Array.isArray(o.order_items) && o.order_items.some((oi) => oi.produce_batches?.farmer_id === user?.id));

  const updateOrderStatus = async (orderId: string, status: string) => {
    const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);
    if (error) { toast(`Failed: ${error.message}`, 'error'); return; }
    toast(`Order ${status}`, 'success');
    onRefresh();
  };

  if (myOrders.length === 0) {
    return <EmptyState icon={<Package className="h-8 w-8" />} title="No orders yet" description="When buyers purchase your produce, orders will appear here." />;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      {myOrders.map(order => {
        const myItems = (Array.isArray(order.order_items) ? order.order_items : []).filter((oi) => oi.produce_batches?.farmer_id === user?.id);
        const myTotal = myItems.reduce((sum, oi) => sum + oi.line_total, 0);
        return (
          <div key={order.id} className="card">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-earth-950">Order #{order.id.slice(0, 8)}</p>
                <p className="text-xs text-earth-500">{formatDateTime(order.created_at)} · {order.shipping_address}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-display text-lg font-bold text-earth-950">{formatINR(myTotal)}</span>
                <OrderStatusBadge status={order.status} />
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {myItems.map(oi => (
                <div key={oi.id} className="flex items-center justify-between rounded-lg bg-earth-50 px-3 py-2 text-sm">
                  <span className="text-earth-900">{oi.quantity} {oi.produce_batches?.unit} {oi.produce_batches?.crop_name}</span>
                  <span className="font-medium text-earth-700">{formatINR(oi.line_total)}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              {order.status === 'pending' && (
                <>
                  <button onClick={() => updateOrderStatus(order.id, 'confirmed')} className="btn-primary text-xs">
                    <CheckCircle2 className="h-3 w-3" /> Accept
                  </button>
                  <button onClick={() => updateOrderStatus(order.id, 'cancelled')} className="btn-danger text-xs">
                    Reject
                  </button>
                </>
              )}
              {order.status === 'confirmed' && (
                <button onClick={() => updateOrderStatus(order.id, 'packed')} className="btn-primary text-xs">
                  <Package className="h-3 w-3" /> Mark Packed
                </button>
              )}
              {order.status === 'packed' && (
                <button onClick={() => updateOrderStatus(order.id, 'shipped')} className="btn-primary text-xs">
                  <Truck className="h-3 w-3" /> Mark Shipped
                </button>
              )}
              {order.status === 'shipped' && (
                <button onClick={() => updateOrderStatus(order.id, 'delivered')} className="btn-primary text-xs">
                  <CheckCircle2 className="h-3 w-3" /> Mark Delivered
                </button>
              )}
            </div>
          </div>
        );
      })}
    </motion.div>
  );
}

function OrderStatusBadge({ status }: { status: string }) {
  const map: Record<string, { variant: 'success' | 'warning' | 'info' | 'primary' | 'error' | 'default'; label: string }> = {
    pending: { variant: 'warning', label: 'Pending' },
    confirmed: { variant: 'primary', label: 'Confirmed' },
    packed: { variant: 'info', label: 'Packed' },
    shipped: { variant: 'info', label: 'Shipped' },
    delivered: { variant: 'success', label: 'Delivered' },
    cancelled: { variant: 'error', label: 'Cancelled' },
  };
  const { variant, label } = map[status] ?? { variant: 'default' as const, label: status };
  return <Badge variant={variant}>{label}</Badge>;
}

function AnalyticsTab({ batches, orders, totalRevenue }: {
  batches: ProduceBatch[]; orders: OrderWithItems[]; totalRevenue: number;
}) {
  const { user } = useAuth();
  const myOrders = orders.filter((o) => Array.isArray(o.order_items) && o.order_items.some((oi) => oi.produce_batches?.farmer_id === user?.id));

  // Monthly revenue
  const monthlyRev: Record<string, number> = {};
  myOrders.forEach((o) => {
    const month = new Date(o.created_at).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
    const myTotal = (Array.isArray(o.order_items) ? o.order_items : []).filter((oi) => oi.produce_batches?.farmer_id === user?.id).reduce((s, oi) => s + (oi.line_total ?? 0), 0);
    monthlyRev[month] = (monthlyRev[month] ?? 0) + myTotal;
  });
  const monthlyData = Object.entries(monthlyRev).map(([month, revenue]) => ({ month, revenue }));

  // Top crops
  const cropRev: Record<string, number> = {};
  myOrders.forEach((o) => {
    (Array.isArray(o.order_items) ? o.order_items : []).filter((oi) => oi.produce_batches?.farmer_id === user?.id).forEach((oi) => {
      const crop = oi.produce_batches?.crop_name ?? 'Unknown';
      cropRev[crop] = (cropRev[crop] ?? 0) + (oi.line_total ?? 0);
    });
  });
  const cropData = Object.entries(cropRev).map(([crop, revenue]) => ({ crop, revenue })).sort((a, b) => b.revenue - a.revenue).slice(0, 6);
  const colors = ['#16a34a', '#f97316', '#eab308', '#0ea5e9', '#a855f7', '#ec4899'];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={<IndianRupee className="h-5 w-5 text-white" />} label="Total Revenue" value={formatINR(totalRevenue)} color="bg-accent-600" />
        <StatCard icon={<Package className="h-5 w-5 text-white" />} label="Total Batches" value={String(batches.length)} color="bg-primary-600" />
        <StatCard icon={<TrendingUp className="h-5 w-5 text-white" />} label="Total Orders" value={String(myOrders.length)} color="bg-success-600" />
      </div>

      <div className="card">
        <h3 className="mb-4 font-semibold text-earth-950">Monthly Revenue</h3>
        {monthlyData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8ddc8" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={(v) => `₹${v/1000}k`} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => formatINR(Number(v))} contentStyle={{ borderRadius: '12px', border: '1px solid #e8ddc8' }} />
              <Bar dataKey="revenue" fill="#16a34a" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState icon={<TrendingUp className="h-8 w-8" />} title="No revenue data yet" description="Revenue charts will appear once you have sales." />
        )}
      </div>

      <div className="card">
        <h3 className="mb-4 font-semibold text-earth-950">Top Selling Crops</h3>
        {cropData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={cropData} dataKey="revenue" nameKey="crop" cx="50%" cy="50%" outerRadius={100} label={(e: any) => e.crop}>
                {cropData.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
              </Pie>
              <Tooltip formatter={(v) => formatINR(Number(v))} contentStyle={{ borderRadius: '12px', border: '1px solid #e8ddc8' }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState icon={<Leaf className="h-8 w-8" />} title="No crop data yet" description="Top crops will appear here after sales." />
        )}
      </div>
    </motion.div>
  );
}

function QrModal({ batch, onClose }: { batch: ProduceBatch; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-earth-950/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }} animate={{ scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="rounded-2xl bg-white p-6 shadow-2xl"
      >
        <h3 className="mb-4 text-center font-display text-lg font-bold text-earth-950">{batch.crop_name}</h3>
        <QrCodeDisplay batchCode={batch.batch_code} size={200} />
        <div className="mt-4 text-center">
          <p className="text-sm text-earth-600">{batch.quantity} {batch.unit} · Grade {batch.quality_grade}</p>
          <p className="text-xs text-earth-400">{batch.batch_code}</p>
        </div>
        <button onClick={onClose} className="btn-secondary mt-4 w-full">Close</button>
      </motion.div>
    </motion.div>
  );
}
