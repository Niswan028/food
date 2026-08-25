import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Leaf, Sprout, MapPin, Calendar, Award, Package, Shield, ExternalLink,
  CheckCircle2, Truck, Search, ArrowRight, QrCode,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '@/lib/supabase';
import { LoadingSpinner, EmptyState, Badge, FullPageLoader } from '@/components/ui';
import { formatDate, formatDateTime, getTraceUrl } from '@/lib/utils';
import { getPolygonScanUrl } from '@/services/blockchainService';
import { ProduceBatch, FarmerProfile, Profile, SupplyChainEvent, BlockchainAnchor } from '@/types';

const EVENT_CONFIG: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  created: { icon: <Leaf className="h-5 w-5" />, color: 'bg-primary-600', label: 'Batch Created' },
  harvested: { icon: <Sprout className="h-5 w-5" />, color: 'bg-primary-600', label: 'Harvested' },
  quality_checked: { icon: <Award className="h-5 w-5" />, color: 'bg-accent-600', label: 'Quality Checked' },
  packed: { icon: <Package className="h-5 w-5" />, color: 'bg-warning-600', label: 'Packed' },
  shipped: { icon: <Truck className="h-5 w-5" />, color: 'bg-blue-600', label: 'Shipped' },
  delivered: { icon: <CheckCircle2 className="h-5 w-5" />, color: 'bg-success-600', label: 'Delivered' },
  cancelled: { icon: <Search className="h-5 w-5" />, color: 'bg-error-600', label: 'Cancelled' },
};

export function TracePage() {
  const { batchId } = useParams();
  const [loading, setLoading] = useState(true);
  const [batch, setBatch] = useState<ProduceBatch | null>(null);
  const [farmer, setFarmer] = useState<FarmerProfile | null>(null);
  const [farmerProfile, setFarmerProfile] = useState<Profile | null>(null);
  const [events, setEvents] = useState<SupplyChainEvent[]>([]);
  const [anchor, setAnchor] = useState<BlockchainAnchor | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    (async () => {
      // batchId param is the batch_code
      const { data: b } = await supabase
        .from('produce_batches')
        .select('*')
        .eq('batch_code', batchId)
        .maybeSingle();
      if (!b) { setNotFound(true); setLoading(false); return; }
      setBatch(b as ProduceBatch);

      const [fpRes, pRes, evRes, anRes] = await Promise.all([
        supabase.from('farmer_profiles').select('*').eq('user_id', b.farmer_id).maybeSingle(),
        supabase.from('profiles').select('*').eq('id', b.farmer_id).maybeSingle(),
        supabase.from('supply_chain_events').select('*').eq('batch_id', b.id).order('created_at', { ascending: true }),
        supabase.from('blockchain_anchor').select('*').eq('batch_id', b.id).maybeSingle(),
      ]);
      setFarmer(fpRes.data as FarmerProfile | null);
      setFarmerProfile(pRes.data as Profile | null);
      setEvents((evRes.data as SupplyChainEvent[]) ?? []);
      setAnchor(anRes.data as BlockchainAnchor | null);
      setLoading(false);
    })();
  }, [batchId]);

  if (loading) return <FullPageLoader message="Tracing your product..." />;

  if (notFound || !batch) {
    return (
      <div className="py-16">
        <EmptyState
          icon={<Search className="h-8 w-8" />}
          title="Batch not found"
          description="The QR code may be invalid or the batch may have been removed."
          action={<Link to="/marketplace" className="btn-primary">Go to Marketplace</Link>}
        />
      </div>
    );
  }

  const traceUrl = getTraceUrl(batch.batch_code);

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 via-earth-50 to-white">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-600 text-white">
            <Leaf className="h-7 w-7" />
          </div>
          <h1 className="font-display text-2xl font-bold text-earth-950 sm:text-3xl">Product Traceability</h1>
          <p className="mt-1 text-sm text-earth-600">Follow the journey of your food from farm to table</p>
          <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 shadow-sm">
            <span className="text-xs font-medium text-earth-500">Batch Code:</span>
            <span className="font-mono text-sm font-semibold text-primary-700">{batch.batch_code}</span>
          </div>
        </motion.div>

        {/* Product details */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-8 card">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            {batch.photo_urls?.[0] ? (
              <img src={batch.photo_urls[0]} alt={batch.crop_name} className="h-24 w-24 rounded-xl object-cover" />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-xl bg-primary-100 text-primary-700">
                <Leaf className="h-10 w-10" />
              </div>
            )}
            <div className="flex-1">
              <h2 className="font-display text-xl font-bold text-earth-950">{batch.crop_name}</h2>
              <div className="mt-2 flex flex-wrap gap-3 text-sm text-earth-600">
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Harvested {formatDate(batch.harvest_date)}</span>
                <span className="flex items-center gap-1"><Package className="h-3 w-3" /> {batch.quantity} {batch.unit}</span>
                <span className="flex items-center gap-1"><Award className="h-3 w-3" /> Grade {batch.quality_grade}</span>
              </div>
              {batch.certifications.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {batch.certifications.map(c => <Badge key={c} variant="success"><CheckCircle2 className="h-3 w-3" /> {c}</Badge>)}
                </div>
              )}
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="rounded-xl border-2 border-earth-200 bg-white p-2">
                <QRCodeSVG value={traceUrl} size={80} level="M" />
              </div>
              <span className="text-xs text-earth-400">Scan to trace</span>
            </div>
          </div>
        </motion.div>

        {/* Timeline */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-6">
          <h3 className="mb-4 font-display text-lg font-bold text-earth-950">Supply Chain Journey</h3>
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-earth-200" />

            {events.map((event, i) => {
              const config = EVENT_CONFIG[event.event_type] ?? EVENT_CONFIG.created;
              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="relative flex gap-4 pb-8 last:pb-0"
                >
                  <div className={`relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${config.color} text-white shadow-sm`}>
                    {config.icon}
                  </div>
                  <div className="flex-1 rounded-xl bg-white p-4 shadow-sm ring-1 ring-earth-200/60">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-earth-950">{config.label}</p>
                      <span className="text-xs text-earth-500">{formatDateTime(event.created_at)}</span>
                    </div>
                    {event.location && (
                      <p className="mt-1 flex items-center gap-1 text-sm text-earth-600">
                        <MapPin className="h-3 w-3" /> {event.location}
                      </p>
                    )}
                    {event.notes && <p className="mt-1 text-sm text-earth-700">{event.notes}</p>}
                    <p className="mt-1 text-xs text-earth-400">by {event.actor}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Blockchain verification */}
        {anchor && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mt-6">
            <div className="rounded-2xl bg-gradient-to-br from-primary-700 to-primary-900 p-6 text-white shadow-lg">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
                  <Shield className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold">Blockchain Verified</h3>
                  <p className="text-sm text-primary-100">This batch is permanently anchored on the Polygon blockchain</p>
                </div>
              </div>

              <div className="mt-4 space-y-3 rounded-xl bg-white/10 p-4">
                <div>
                  <p className="text-xs text-primary-200">Transaction Hash</p>
                  <p className="mt-1 break-all font-mono text-xs text-white">{anchor.tx_hash}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-primary-200">Block Number</p>
                    <p className="mt-1 font-mono text-sm font-medium text-white">#{anchor.block_number.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-primary-200">Network</p>
                    <p className="mt-1 text-sm font-medium text-white capitalize">{anchor.network.replace('-', ' ')}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-primary-200">Anchored At</p>
                  <p className="mt-1 text-sm font-medium text-white">{formatDateTime(anchor.anchored_at)}</p>
                </div>
              </div>

              <a href={getPolygonScanUrl(anchor.tx_hash)} target="_blank" rel="noopener noreferrer"
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-primary-700 transition-all hover:bg-primary-50 active:scale-[0.98]">
                View on PolygonScan <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </motion.div>
        )}

        {/* Farmer card */}
        {farmer && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mt-6 card">
            <h3 className="mb-4 font-semibold text-earth-950">Farm Origin</h3>
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-100 text-primary-700">
                <Sprout className="h-7 w-7" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-earth-950">{farmer.farm_name}</p>
                  {farmer.verification_status === 'approved' && (
                    <Badge variant="success"><CheckCircle2 className="h-3 w-3" /> Verified Farm</Badge>
                  )}
                </div>
                <p className="text-sm text-earth-600">{farmerProfile?.full_name}</p>
                <div className="mt-2 flex flex-wrap gap-3 text-sm text-earth-600">
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {farmer.location}</span>
                  <span className="flex items-center gap-1"><Package className="h-3 w-3" /> {farmer.farm_size_acres} acres</span>
                </div>
                {farmer.bio && <p className="mt-2 text-sm text-earth-700">{farmer.bio}</p>}
                {farmer.crops_grown.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {farmer.crops_grown.map(c => <Badge key={c}>{c}</Badge>)}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* CTA */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="mt-8 text-center">
          <Link to="/marketplace" className="btn-primary">
            Explore More Produce <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
