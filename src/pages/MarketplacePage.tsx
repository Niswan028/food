import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Leaf, MapPin, IndianRupee, Calendar, Award, Filter, Package, SlidersHorizontal } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { LoadingSpinner, EmptyState, Badge, CardSkeleton } from '@/components/ui';
import { formatINR, formatDate, CATEGORIES, INDIAN_STATES } from '@/lib/utils';
import { BatchWithFarmer } from '@/types';

export function MarketplacePage() {
  const [loading, setLoading] = useState(true);
  const [batches, setBatches] = useState<BatchWithFarmer[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [state, setState] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [certFilter, setCertFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('produce_batches')
        .select(`
          *,
          farmer_profiles!farmer_id (*),
          profiles!farmer_id (*)
        `)
        .eq('status', 'available')
        .order('created_at', { ascending: false });
      if (error) console.error(error.message);
      setBatches((data as BatchWithFarmer[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    return batches.filter(b => {
      if (search && !b.crop_name.toLowerCase().includes(search.toLowerCase())) return false;
      if (category && b.category !== category) return false;
      if (state && b.farmer_profiles?.state !== state) return false;
      if (maxPrice && b.price_per_unit > parseFloat(maxPrice)) return false;
      if (certFilter && !b.certifications.includes(certFilter)) return false;
      return true;
    });
  }, [batches, search, category, state, maxPrice, certFilter]);

  const clearFilters = () => {
    setCategory(''); setState(''); setMaxPrice(''); setCertFilter(''); setSearch('');
  };

  return (
    <div className="min-h-screen bg-earth-50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold text-earth-950">Marketplace</h1>
          <p className="text-sm text-earth-600">Browse fresh produce directly from verified farms across India</p>
        </div>

        {/* Search bar */}
        <div className="mb-4 flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-earth-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-10" placeholder="Search for tomatoes, mangoes, rice..." />
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className="btn-secondary">
            <SlidersHorizontal className="h-4 w-4" /> Filters
          </button>
        </div>

        <div className="mb-5 flex flex-wrap items-center gap-2 text-xs text-earth-600">
          <span className="badge bg-primary-100 text-primary-700">Verified farms</span>
          <span className="badge bg-success-100 text-success-700">Traceable batches</span>
          <span className="badge bg-warning-100 text-warning-700">Fresh harvests</span>
        </div>

        {/* Filters */}
        {showFilters && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-6 overflow-hidden">
            <div className="card grid gap-4 sm:grid-cols-4">
              <div>
                <label className="label">Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="input">
                  <option value="">All</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="label">State</label>
                <select value={state} onChange={(e) => setState(e.target.value)} className="input">
                  <option value="">All States</option>
                  {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Max Price/kg (₹)</label>
                <input type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="input" placeholder="Any" />
              </div>
              <div>
                <label className="label">Certification</label>
                <select value={certFilter} onChange={(e) => setCertFilter(e.target.value)} className="input">
                  <option value="">Any</option>
                  <option value="Organic">Organic</option>
                  <option value="FSSAI">FSSAI</option>
                  <option value="APEDA">APEDA</option>
                  <option value="Spice Board">Spice Board</option>
                </select>
              </div>
              <div className="sm:col-span-4">
                <button onClick={clearFilters} className="btn-ghost text-xs">Clear all filters</button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Results count */}
        <p className="mb-4 text-sm text-earth-600">{filtered.length} batches available</p>

        {/* Grid */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Package className="h-8 w-8" />}
            title="No batches found"
            description="Try adjusting your filters or search terms."
            action={<button onClick={clearFilters} className="btn-primary">Clear Filters</button>}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {filtered.map((batch, i) => (
              <motion.div key={batch.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Link to={`/batch/${batch.id}`} className="card block overflow-hidden p-0 transition-all hover:shadow-md">
                  {batch.photo_urls?.[0] ? (
                    <img src={batch.photo_urls[0]} alt={batch.crop_name} className="h-40 w-full object-cover" />
                  ) : (
                    <div className="flex h-40 items-center justify-center bg-gradient-to-br from-primary-100 to-primary-200">
                      <Leaf className="h-12 w-12 text-primary-400" />
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-earth-950">{batch.crop_name}</h3>
                      <Badge variant="primary">Grade {batch.quality_grade}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-earth-500">{batch.batch_code}</p>
                    <div className="mt-3 space-y-1 text-sm text-earth-600">
                      <p className="flex items-center gap-2"><MapPin className="h-3 w-3" /> {batch.farmer_profiles?.location ?? 'India'}</p>
                      <p className="flex items-center gap-2"><Calendar className="h-3 w-3" /> {formatDate(batch.harvest_date)}</p>
                      <p className="flex items-center gap-2"><Package className="h-3 w-3" /> {batch.quantity} {batch.unit} available</p>
                    </div>
                    {batch.certifications.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {batch.certifications.slice(0, 2).map(c => <Badge key={c} variant="success">{c}</Badge>)}
                      </div>
                    )}
                    <div className="mt-3 border-t border-earth-100 pt-3">
                      <p className="font-display text-lg font-bold text-primary-700">{formatINR(batch.price_per_unit)}<span className="text-xs font-normal text-earth-500">/{batch.unit}</span></p>
                      <p className="text-xs text-earth-500">by {batch.profiles?.full_name ?? batch.farmer_profiles?.farm_name}</p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
