import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Users, Sprout, IndianRupee, Package, Shield, CheckCircle2, XCircle,
  Award, AlertCircle, TrendingUp, Activity,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import { FullPageLoader, EmptyState, Badge } from '@/components/ui';
import { formatINR, formatDate, formatDateTime, timeAgo } from '@/lib/utils';
import { FarmerProfile, Profile, OrderWithItems } from '@/types';

type Tab = 'overview' | 'verification' | 'activity';

export function AdminDashboard() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('overview');
  const [farmers, setFarmers] = useState<(FarmerProfile & { profiles: Profile })[]>([]);
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);

  const loadData = useCallback(async () => {
    const [{ data: fp }, { data: o }, { data: p }] = await Promise.all([
      supabase.from('farmer_profiles').select('*, profiles!user_id(*)').order('created_at', { ascending: false }),
      supabase.from('orders').select(`*, order_items (*, produce_batches(*))`).order('created_at', { ascending: false }).limit(20),
      supabase.from('profiles').select('*'),
    ]);

    const normalizedOrders = ((o as OrderWithItems[]) ?? []).map((order) => ({
      ...order,
      order_items: Array.isArray(order.order_items) ? order.order_items : [],
    }));

    setFarmers((fp as (FarmerProfile & { profiles: Profile })[]) ?? []);
    setOrders(normalizedOrders);
    setProfiles((p as Profile[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const verifyFarmer = async (id: string, status: 'approved' | 'rejected') => {
    const { error } = await supabase.from('farmer_profiles').update({ verification_status: status }).eq('id', id);
    if (error) { toast(`Failed: ${error.message}`, 'error'); return; }
    toast(`Farmer ${status}`, 'success');
    loadData();
  };

  if (loading) return <FullPageLoader message="Loading admin dashboard..." />;

  const totalFarmers = farmers.length;
  const totalBuyers = profiles.filter(p => p.role === 'buyer').length;
  const totalOrders = orders.length;
  const gmv = orders.reduce((s, o) => s + o.total_amount, 0);
  const pendingFarmers = farmers.filter(f => f.verification_status === 'pending');

  // GMV trend (mock from orders)
  const gmvTrend: Record<string, number> = {};
  orders.forEach(o => {
    const day = new Date(o.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    gmvTrend[day] = (gmvTrend[day] ?? 0) + o.total_amount;
  });
  const gmvData = Object.entries(gmvTrend).map(([day, value]) => ({ day, value }));

  return (
    <div className="min-h-screen bg-earth-50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="mb-6 overflow-hidden rounded-3xl bg-gradient-to-r from-earth-900 via-earth-800 to-primary-900 p-6 text-white shadow-lg">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-earth-300">Operations control</p>
          <h1 className="mt-2 font-display text-3xl font-bold">Admin Dashboard</h1>
          <p className="mt-2 text-sm text-earth-200">Platform overview, verification status, and supply-chain health</p>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex flex-wrap gap-1 rounded-xl bg-white p-1 shadow-sm">
          {(['overview', 'verification', 'activity'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`min-w-[120px] flex-1 rounded-lg px-3 py-2 text-sm font-medium capitalize transition-all ${tab === t ? 'bg-primary-600 text-white' : 'text-earth-600 hover:bg-earth-50'}`}>
              {t === 'verification' ? `Verification${pendingFarmers.length ? ` (${pendingFarmers.length})` : ''}` : t}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard icon={<Sprout className="h-5 w-5 text-white" />} label="Total farmers" value={String(totalFarmers)} color="bg-primary-600" />
              <StatCard icon={<Users className="h-5 w-5 text-white" />} label="Total buyers" value={String(totalBuyers)} color="bg-accent-600" />
              <StatCard icon={<Package className="h-5 w-5 text-white" />} label="Orders" value={String(totalOrders)} color="bg-success-600" />
              <StatCard icon={<IndianRupee className="h-5 w-5 text-white" />} label="GMV" value={formatINR(gmv)} color="bg-warning-600" />
            </div>

            <div className="grid gap-6 grid-cols-1 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="card">
                <h3 className="mb-4 font-semibold text-earth-950">Platform health</h3>
                <div className="space-y-4">
                  <div className="rounded-2xl bg-primary-50 p-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-earth-700">Verified farms</span>
                      <span className="font-semibold text-primary-700">{farmers.filter(f => f.verification_status === 'approved').length}</span>
                    </div>
                  </div>
                  <div className="rounded-2xl bg-success-50 p-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-earth-700">Approved batches</span>
                      <span className="font-semibold text-success-700">{orders.length}</span>
                    </div>
                  </div>
                  <div className="rounded-2xl bg-warning-50 p-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-earth-700">Pending verification</span>
                      <span className="font-semibold text-warning-700">{pendingFarmers.length}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card">
                <h3 className="mb-4 font-semibold text-earth-950">Blockchain status</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-earth-700">Smart contract</span>
                      <span className="text-sm font-semibold text-success-600">Designed ✓</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-earth-700">Trace interface</span>
                      <span className="text-sm font-semibold text-success-600">Live ✓</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-earth-700">Testnet deployment</span>
                      <span className="text-sm font-semibold text-warning-600">In progress</span>
                    </div>
                    <div className="h-2 rounded-full bg-earth-200 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-warning-500 to-warning-600 rounded-full" style={{ width: '80%' }} />
                    </div>
                    <p className="text-xs text-earth-500 mt-1">80% complete</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="mb-4 font-semibold text-earth-950">GMV trend</h3>
              {gmvData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={gmvData}>
                    <defs>
                      <linearGradient id="gmvGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e8ddc8" />
                    <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={(v) => `₹${v/1000}k`} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(v) => formatINR(Number(v))} contentStyle={{ borderRadius: '12px', border: '1px solid #e8ddc8' }} />
                    <Area type="monotone" dataKey="value" stroke="#16a34a" strokeWidth={2} fill="url(#gmvGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState icon={<TrendingUp className="h-8 w-8" />} title="No transaction data yet" description="GMV charts will appear once orders are placed." />
              )}
            </div>

            <div className="card">
              <h3 className="mb-4 font-semibold text-earth-950">Recent Activity</h3>
              <div className="space-y-2">
                {orders.slice(0, 8).map(o => (
                  <div key={o.id} className="flex flex-col gap-3 rounded-lg border border-earth-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100 text-primary-700">
                        <Activity className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-earth-900">Order #{o.id.slice(0, 8)}</p>
                        <p className="text-xs text-earth-500">{timeAgo(o.created_at)} · {o.order_items.length} items</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2 sm:justify-end">
                      <span className="text-sm font-semibold text-earth-900">{formatINR(o.total_amount)}</span>
                      <Badge variant={o.status === 'delivered' ? 'success' : o.status === 'cancelled' ? 'error' : 'info'}>{o.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {tab === 'verification' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {farmers.length === 0 ? (
              <EmptyState icon={<Shield className="h-8 w-8" />} title="No farmers registered" description="Farmer verification requests will appear here." />
            ) : (
              <div className="space-y-3">
                {farmers.map(f => (
                  <div key={f.id} className="card">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 text-primary-700">
                          <Sprout className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="font-semibold text-earth-950">{f.farm_name}</p>
                          <p className="text-sm text-earth-600">{f.profiles?.full_name} · {f.profiles?.email}</p>
                          <div className="mt-1 flex flex-wrap gap-3 text-xs text-earth-500">
                            <span>{f.location}</span>
                            <span>{f.farm_size_acres} acres</span>
                            <span>Joined {formatDate(f.created_at)}</span>
                          </div>
                          {f.certifications.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {f.certifications.map(c => <Badge key={c} variant="success">{c}</Badge>)}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <VerifyBadge status={f.verification_status} />
                        {f.verification_status === 'pending' && (
                          <div className="flex gap-2">
                            <button onClick={() => verifyFarmer(f.id, 'approved')} className="btn-primary text-xs">
                              <CheckCircle2 className="h-3 w-3" /> Approve
                            </button>
                            <button onClick={() => verifyFarmer(f.id, 'rejected')} className="btn-danger text-xs">
                              <XCircle className="h-3 w-3" /> Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    {f.bio && <p className="mt-3 border-t border-earth-100 pt-3 text-sm text-earth-600">{f.bio}</p>}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {tab === 'activity' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="card">
              <h3 className="mb-4 font-semibold text-earth-950">All Transactions</h3>
              {orders.length === 0 ? (
                <EmptyState icon={<Package className="h-8 w-8" />} title="No transactions yet" description="Platform transactions will appear here." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-earth-200 text-left text-earth-600">
                        <th className="pb-2 pr-4 font-medium">Order ID</th>
                        <th className="pb-2 pr-4 font-medium">Date</th>
                        <th className="pb-2 pr-4 font-medium">Items</th>
                        <th className="pb-2 pr-4 font-medium">Amount</th>
                        <th className="pb-2 pr-4 font-medium">Status</th>
                        <th className="pb-2 font-medium">Payment</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map(o => (
                        <tr key={o.id} className="border-b border-earth-100">
                          <td className="py-3 pr-4 font-medium text-earth-900">#{o.id.slice(0, 8)}</td>
                          <td className="py-3 pr-4 text-earth-600">{formatDate(o.created_at)}</td>
                          <td className="py-3 pr-4 text-earth-600">{Array.isArray(o.order_items) ? o.order_items.length : 0}</td>
                          <td className="py-3 pr-4 font-semibold text-earth-900">{formatINR(o.total_amount)}</td>
                          <td className="py-3 pr-4"><Badge variant={o.status === 'delivered' ? 'success' : o.status === 'cancelled' ? 'error' : 'info'}>{o.status}</Badge></td>
                          <td className="py-3"><Badge variant={o.payment_status === 'paid' ? 'success' : 'warning'}>{o.payment_status}</Badge></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
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

function VerifyBadge({ status }: { status: string }) {
  const map: Record<string, { variant: 'success' | 'warning' | 'error'; label: string }> = {
    approved: { variant: 'success', label: 'Approved' },
    pending: { variant: 'warning', label: 'Pending' },
    rejected: { variant: 'error', label: 'Rejected' },
  };
  const { variant, label } = map[status] ?? { variant: 'warning' as const, label: status };
  return <Badge variant={variant}>{label}</Badge>;
}
