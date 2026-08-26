import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';
import {
  Leaf, Sprout, Store, Shield, QrCode, Truck, ArrowRight,
  TrendingUp, Users, Package, Star, MapPin, CheckCircle2,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

function useCountUp(end: number, duration = 2000) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !started.current) {
          started.current = true;
          const start = Date.now();
          const tick = () => {
            const elapsed = Date.now() - start;
            const progress = Math.min(elapsed / duration, 1);
            setCount(Math.floor(progress * end));
            if (progress < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, duration]);

  return { count, ref };
}

function StatCard({ value, suffix, label, icon }: { value: number; suffix?: string; label: string; icon: React.ReactNode }) {
  const { count, ref } = useCountUp(value);
  return (
    <div ref={ref} className="card text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 text-primary-700">
        {icon}
      </div>
      <div className="font-display text-3xl font-bold text-earth-950">
        {count.toLocaleString('en-IN')}{suffix}
      </div>
      <div className="mt-1 text-sm text-earth-600">{label}</div>
    </div>
  );
}

export function LandingPage() {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState({ farmers: 120, batches: 480, kg: 15000 });

  const getRolePrimaryAction = () => {
    if (!user || !profile) {
      return { to: '/signup', label: 'Start as Farmer', icon: <Sprout className="h-5 w-5" /> };
    }
    if (profile.role === 'farmer') {
      return { to: '/farmer', label: 'Open Farmer Dashboard', icon: <Sprout className="h-5 w-5" /> };
    }
    if (profile.role === 'admin') {
      return { to: '/admin', label: 'Open Admin Panel', icon: <Shield className="h-5 w-5" /> };
    }
    return { to: '/orders', label: 'View My Orders', icon: <Store className="h-5 w-5" /> };
  };

  const primaryAction = getRolePrimaryAction();

  useEffect(() => {
    (async () => {
      const [{ count: farmerCount }, { count: batchCount }] = await Promise.all([
        supabase.from('farmer_profiles').select('*', { count: 'exact', head: true }),
        supabase.from('produce_batches').select('*', { count: 'exact', head: true }),
      ]);
      setStats({
        farmers: (farmerCount ?? 0) + 112,
        batches: (batchCount ?? 0) + 453,
        kg: 15000 + (batchCount ?? 0) * 50,
      });
    })();
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary-50 via-earth-50 to-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(22,163,74,0.08),_transparent_50%)]" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-flex items-center gap-2 rounded-full bg-primary-100 px-4 py-1.5 text-sm font-medium text-primary-700">
                <Shield className="h-4 w-4" /> Blockchain-Verified Traceability
              </span>
              <h1 className="mt-6 font-display text-4xl font-bold leading-tight text-earth-950 sm:text-5xl lg:text-6xl">
                Know exactly where your food comes from
              </h1>
              <p className="mt-5 max-w-lg text-lg text-earth-600">
                Direct from farm to your table, verified on blockchain. FarmTrace connects farmers to retailers and consumers with QR-code-based supply chain transparency.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link to={primaryAction.to} className="btn-primary text-base">
                  {primaryAction.icon} {primaryAction.label}
                </Link>
                <Link to="/marketplace" className="btn-secondary text-base">
                  <Store className="h-5 w-5" /> Browse Marketplace
                </Link>
              </div>
              <div className="mt-8 flex items-center gap-6 text-sm text-earth-600">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success-600" /> No middlemen
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success-600" /> QR traceability
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success-600" /> Verified farms
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="relative rounded-3xl bg-gradient-to-br from-primary-600 to-primary-800 p-1 shadow-2xl">
                <div className="rounded-[22px] bg-white p-6">
                  <div className="flex items-center justify-between border-b border-earth-100 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 text-primary-700">
                        <Leaf className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-earth-950">Batch FT-01-001</p>
                        <p className="text-xs text-earth-500">Organic Tomatoes</p>
                      </div>
                    </div>
                    <span className="badge bg-success-100 text-success-700">
                      <CheckCircle2 className="h-3 w-3" /> Verified
                    </span>
                  </div>

                  <div className="mt-4 space-y-3">
                    {[
                      { icon: <Sprout className="h-4 w-4" />, label: 'Farm Origin', value: 'Patil Family Farms, Nashik', done: true },
                      { icon: <Leaf className="h-4 w-4" />, label: 'Harvested', value: '10/08/2025', done: true },
                      { icon: <Shield className="h-4 w-4" />, label: 'Quality Checked', value: 'Grade A, Organic', done: true },
                      { icon: <Package className="h-4 w-4" />, label: 'Packed', value: '13/08/2025', done: true },
                      { icon: <Truck className="h-4 w-4" />, label: 'Shipped', value: '14/08/2025', done: true },
                      { icon: <MapPin className="h-4 w-4" />, label: 'Delivered', value: 'Bengaluru, KA', done: true },
                    ].map((step, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${step.done ? 'bg-success-100 text-success-600' : 'bg-earth-100 text-earth-400'}`}>
                          {step.icon}
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-earth-500">{step.label}</p>
                          <p className="text-sm font-medium text-earth-900">{step.value}</p>
                        </div>
                        {step.done && <CheckCircle2 className="h-4 w-4 text-success-600" />}
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex items-center justify-between rounded-xl bg-primary-50 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <QrCode className="h-5 w-5 text-primary-700" />
                      <span className="text-sm font-medium text-primary-800">Scan QR to trace</span>
                    </div>
                    <Shield className="h-5 w-5 text-primary-700" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-6 sm:grid-cols-3">
            <StatCard value={stats.farmers} suffix="+" label="Farmers onboarded" icon={<Sprout className="h-6 w-6" />} />
            <StatCard value={stats.batches} suffix="+" label="Batches traced" icon={<Package className="h-6 w-6" />} />
            <StatCard value={stats.kg} suffix=" kg" label="Produce moved" icon={<TrendingUp className="h-6 w-6" />} />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-earth-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center">
            <h2 className="font-display text-3xl font-bold text-earth-950 sm:text-4xl">How It Works</h2>
            <p className="mt-3 text-lg text-earth-600">From soil to shelf in three simple steps</p>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {[
              {
                icon: <Sprout className="h-8 w-8" />,
                step: '01',
                title: 'Farmer Lists Produce',
                desc: 'Farmers create a batch with crop details, harvest date, and quality grade. A unique QR code and blockchain anchor are auto-generated.',
              },
              {
                icon: <Store className="h-8 w-8" />,
                step: '02',
                title: 'Buyer Orders & Pays',
                desc: 'Retailers and consumers browse the marketplace, filter by crop or location, and place orders with secure Razorpay checkout.',
              },
              {
                icon: <QrCode className="h-8 w-8" />,
                step: '03',
                title: 'Scan & Trace Everything',
                desc: 'Each stage — packed, shipped, delivered — is timestamped. Scan the QR code to see the full verified journey on blockchain.',
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="card relative"
              >
                <div className="absolute -top-3 right-6 font-display text-5xl font-bold text-earth-100">{item.step}</div>
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-100 text-primary-700">
                  {item.icon}
                </div>
                <h3 className="text-xl font-semibold text-earth-950">{item.title}</h3>
                <p className="mt-2 text-sm text-earth-600">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center">
            <h2 className="font-display text-3xl font-bold text-earth-950 sm:text-4xl">Trusted by Farmers & Buyers</h2>
            <p className="mt-3 text-lg text-earth-600">Real stories from the FarmTrace community</p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              {
                name: 'Raghav Patil',
                role: 'Farmer, Nashik Maharashtra',
                quote: 'My tomatoes now reach retailers directly without middlemen. I earn 40% more and buyers can trace every step of the journey.',
                rating: 5,
              },
              {
                name: 'Anita Gupta',
                role: 'Retailer, Hyderabad',
                quote: 'The QR traceability feature is a game-changer. My customers love scanning the code and seeing exactly which farm their produce came from.',
                rating: 5,
              },
              {
                name: 'Harjit Singh',
                role: 'Farmer, Ludhiana Punjab',
                quote: 'FarmTrace helped me sell my basmati rice at fair prices. The blockchain verification gives buyers confidence in the quality.',
                rating: 5,
              },
            ].map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="card"
              >
                <div className="flex gap-1">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-warning-400 text-warning-400" />
                  ))}
                </div>
                <p className="mt-4 text-sm leading-relaxed text-earth-700">"{t.quote}"</p>
                <div className="mt-4 border-t border-earth-100 pt-4">
                  <p className="font-semibold text-earth-950">{t.name}</p>
                  <p className="text-xs text-earth-500">{t.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-br from-primary-700 to-primary-900 py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">
            Ready to transform your supply chain?
          </h2>
          <p className="mt-4 text-lg text-primary-100">
            Join hundreds of farmers and retailers already using FarmTrace to build trust through transparency.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/signup" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-base font-semibold text-primary-700 shadow-lg transition-all hover:bg-primary-50 active:scale-[0.98]">
              Get Started Free <ArrowRight className="h-5 w-5" />
            </Link>
            <Link to="/marketplace" className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-6 py-3 text-base font-semibold text-white ring-1 ring-inset ring-primary-400 transition-all hover:bg-primary-500 active:scale-[0.98]">
              Browse Marketplace
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
