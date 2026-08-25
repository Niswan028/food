import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Leaf, MapPin, IndianRupee, Calendar, Award, Package, ArrowLeft,
  Shield, Sprout, CheckCircle2, ShoppingCart, Star,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import { LoadingSpinner, EmptyState, Badge, FullPageLoader } from '@/components/ui';
import { formatINR, formatDate } from '@/lib/utils';
import { BatchWithFarmer, Review } from '@/types';

export function BatchDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [batch, setBatch] = useState<BatchWithFarmer | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('produce_batches')
        .select(`
          *,
          farmer_profiles!farmer_id (*),
          profiles!farmer_id (*)
        `)
        .eq('id', id)
        .maybeSingle();
      if (error) console.error(error.message);
      setBatch(data as BatchWithFarmer | null);

      const { data: revData } = await supabase
        .from('reviews')
        .select('*, buyer:profiles!buyer_id(full_name)')
        .eq('batch_id', id);
      setReviews((revData as (Review & { buyer: { full_name: string } })[]) ?? []);
      setLoading(false);
    })();
  }, [id]);

  const addToCart = () => {
    if (!user || profile?.role !== 'buyer') {
      toast('Please sign in as a buyer to add to cart', 'warning');
      navigate('/login');
      return;
    }
    if (!batch) return;
    const cart = JSON.parse(localStorage.getItem('farmtrace_cart') ?? '[]');
    const existing = cart.find((c: { batchId: string }) => c.batchId === batch.id);
    if (existing) {
      existing.qty += qty;
    } else {
      cart.push({
        batchId: batch.id,
        cropName: batch.crop_name,
        pricePerUnit: batch.price_per_unit,
        unit: batch.unit,
        qty,
        farmerName: batch.profiles?.full_name ?? '',
        batchCode: batch.batch_code,
        photoUrl: batch.photo_urls?.[0] ?? '',
        maxQty: batch.quantity,
      });
    }
    localStorage.setItem('farmtrace_cart', JSON.stringify(cart));
    toast(`${qty} ${batch.unit} of ${batch.crop_name} added to cart`, 'success');
    navigate('/cart');
  };

  if (loading) return <FullPageLoader message="Loading batch details..." />;

  if (!batch) {
    return (
      <div className="py-16">
        <EmptyState icon={<Package className="h-8 w-8" />} title="Batch not found" description="This batch may have been removed." action={<Link to="/marketplace" className="btn-primary">Back to Marketplace</Link>} />
      </div>
    );
  }

  const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  return (
    <div className="min-h-screen bg-earth-50">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <Link to="/marketplace" className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-earth-600 hover:text-primary-600">
          <ArrowLeft className="h-4 w-4" /> Back to Marketplace
        </Link>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Image */}
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
            {batch.photo_urls?.[0] ? (
              <img src={batch.photo_urls[0]} alt={batch.crop_name} className="w-full rounded-2xl object-cover shadow-sm" style={{ maxHeight: '400px' }} />
            ) : (
              <div className="flex h-80 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-100 to-primary-200">
                <Leaf className="h-20 w-20 text-primary-400" />
              </div>
            )}
            {batch.photo_urls.length > 1 && (
              <div className="mt-2 flex gap-2">
                {batch.photo_urls.slice(1, 4).map((url, i) => (
                  <img key={i} src={url} alt="" className="h-20 w-20 rounded-lg object-cover" />
                ))}
              </div>
            )}
          </motion.div>

          {/* Details */}
          <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-2xl font-bold text-earth-950">{batch.crop_name}</h1>
                <Badge variant="primary">Grade {batch.quality_grade}</Badge>
              </div>
              <p className="mt-1 text-sm text-earth-500">{batch.batch_code}</p>
            </div>

            <div className="card">
              <div className="flex items-baseline gap-2">
                <span className="font-display text-3xl font-bold text-primary-700">{formatINR(batch.price_per_unit)}</span>
                <span className="text-sm text-earth-500">per {batch.unit}</span>
              </div>
              <p className="mt-1 text-sm text-earth-600">{batch.quantity} {batch.unit} available</p>

              <div className="mt-4 flex items-center gap-3">
                <label className="text-sm font-medium text-earth-700">Quantity:</label>
                <div className="flex items-center gap-2">
                  <button onClick={() => setQty(Math.max(1, qty - 1))} className="flex h-8 w-8 items-center justify-center rounded-lg border border-earth-200 text-earth-600 hover:bg-earth-50">-</button>
                  <span className="w-12 text-center font-medium">{qty}</span>
                  <button onClick={() => setQty(Math.min(batch.quantity, qty + 1))} className="flex h-8 w-8 items-center justify-center rounded-lg border border-earth-200 text-earth-600 hover:bg-earth-50">+</button>
                </div>
                <span className="text-sm text-earth-500">{batch.unit}</span>
              </div>

              <div className="mt-4 flex gap-3">
                <button onClick={addToCart} disabled={batch.status !== 'available'} className="btn-primary flex-1">
                  <ShoppingCart className="h-4 w-4" /> Add to Cart
                </button>
                <Link to={`/trace/${batch.batch_code}`} className="btn-secondary">
                  <Shield className="h-4 w-4" /> Trace
                </Link>
              </div>
              {batch.status !== 'available' && (
                <p className="mt-2 text-xs text-warning-600">This batch is currently {batch.status} and not available for purchase.</p>
              )}
            </div>

            {/* Product details */}
            <div className="card">
              <h3 className="mb-3 font-semibold text-earth-950">Product Details</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-earth-400" />
                  <span className="text-earth-600">Harvested:</span>
                  <span className="font-medium text-earth-900">{formatDate(batch.harvest_date)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Package className="h-4 w-4 text-earth-400" />
                  <span className="text-earth-600">Available:</span>
                  <span className="font-medium text-earth-900">{batch.quantity} {batch.unit}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Award className="h-4 w-4 text-earth-400" />
                  <span className="text-earth-600">Grade:</span>
                  <span className="font-medium text-earth-900">{batch.quality_grade}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Leaf className="h-4 w-4 text-earth-400" />
                  <span className="text-earth-600">Category:</span>
                  <span className="font-medium text-earth-900">{batch.category}</span>
                </div>
              </div>
              {batch.certifications.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {batch.certifications.map(c => <Badge key={c} variant="success"><CheckCircle2 className="h-3 w-3" /> {c}</Badge>)}
                </div>
              )}
              {batch.description && (
                <p className="mt-4 border-t border-earth-100 pt-4 text-sm leading-relaxed text-earth-700">{batch.description}</p>
              )}
            </div>
          </motion.div>
        </div>

        {/* Farmer card */}
        {batch.farmer_profiles && (
          <div className="mt-6 card">
            <h3 className="mb-4 font-semibold text-earth-950">About the Farmer</h3>
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-100 text-primary-700">
                <Sprout className="h-7 w-7" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-earth-950">{batch.farmer_profiles.farm_name}</p>
                  {batch.farmer_profiles.verification_status === 'approved' && (
                    <Badge variant="success"><CheckCircle2 className="h-3 w-3" /> Verified</Badge>
                  )}
                </div>
                <p className="text-sm text-earth-600">{batch.profiles?.full_name}</p>
                <div className="mt-2 flex flex-wrap gap-4 text-sm text-earth-600">
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {batch.farmer_profiles.location}</span>
                  <span className="flex items-center gap-1"><Package className="h-3 w-3" /> {batch.farmer_profiles.farm_size_acres} acres</span>
                </div>
                {batch.farmer_profiles.bio && <p className="mt-2 text-sm text-earth-700">{batch.farmer_profiles.bio}</p>}
                {batch.farmer_profiles.crops_grown.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {batch.farmer_profiles.crops_grown.map(c => <Badge key={c}>{c}</Badge>)}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Reviews */}
        {reviews.length > 0 && (
          <div className="mt-6 card">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-earth-950">Buyer Reviews</h3>
              <div className="flex items-center gap-2">
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`h-4 w-4 ${i < Math.round(avgRating) ? 'fill-warning-400 text-warning-400' : 'text-earth-200'}`} />
                  ))}
                </div>
                <span className="text-sm font-medium text-earth-700">{avgRating.toFixed(1)} ({reviews.length})</span>
              </div>
            </div>
            <div className="space-y-4">
              {reviews.map(r => (
                <div key={r.id} className="border-b border-earth-100 pb-4 last:border-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-earth-900">{(r as Review & { buyer?: { full_name: string } }).buyer?.full_name ?? 'Buyer'}</p>
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`h-3 w-3 ${i < r.rating ? 'fill-warning-400 text-warning-400' : 'text-earth-200'}`} />
                      ))}
                    </div>
                  </div>
                  {r.comment && <p className="mt-1 text-sm text-earth-600">{r.comment}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
