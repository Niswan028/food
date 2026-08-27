import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Leaf, Mail, Lock, ArrowRight, ShieldCheck, Sprout, Store } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import { LoadingSpinner } from '@/components/ui';

export function LoginPage() {
  const { signIn } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast('Please fill in all fields', 'warning');
      return;
    }
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      toast(error, 'error');
      return;
    }

    const normalizedEmail = email.toLowerCase();
    const nextPath = normalizedEmail.includes('admin')
      ? '/admin'
      : normalizedEmail.includes('farmer')
        ? '/farmer'
        : '/orders';

    toast('Welcome back!', 'success');
    navigate(nextPath);
  };

  const fillDemo = (role: 'farmer' | 'buyer' | 'admin') => {
    const creds = {
      farmer: { email: 'raghav.farmer@farmtrace.in', password: 'FarmTrace123!' },
      buyer: { email: 'rahul.buyer@farmtrace.in', password: 'FarmTrace123!' },
      admin: { email: 'admin@farmtrace.in', password: 'FarmTrace123!' },
    };
    setEmail(creds[role].email);
    setPassword(creds[role].password);
  };

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-gradient-to-b from-primary-50 via-white to-earth-50 px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-5xl"
      >
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="card flex flex-col justify-between bg-gradient-to-br from-primary-700 via-primary-600 to-success-600 text-white">
            <div>
              <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
                <Leaf className="h-6 w-6" />
              </div>
              <h1 className="font-display text-3xl font-bold leading-tight sm:text-4xl">Trace every harvest with confidence.</h1>
              <p className="mt-4 max-w-md text-sm text-primary-50">
                Secure farm-to-retail visibility for farmers, buyers, and admins. Verified origin, transparent movement, and trust built into every batch.
              </p>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10">
                <ShieldCheck className="h-5 w-5 text-success-200" />
                <div className="mt-3 text-xl font-bold">24/7</div>
                <div className="text-xs text-primary-50">Verification</div>
              </div>
              <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10">
                <Sprout className="h-5 w-5 text-success-200" />
                <div className="mt-3 text-xl font-bold">1,200+</div>
                <div className="text-xs text-primary-50">Farmers</div>
              </div>
              <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10">
                <Store className="h-5 w-5 text-success-200" />
                <div className="mt-3 text-xl font-bold">180K+</div>
                <div className="text-xs text-primary-50">Orders</div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-100 text-primary-700">
                <Leaf className="h-6 w-6" />
              </div>
              <h2 className="font-display text-2xl font-bold text-earth-950">Welcome back</h2>
              <p className="mt-1 text-sm text-earth-600">Sign in to your FarmTrace account</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Email</label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-earth-400" />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input pl-10" placeholder="you@example.com" />
                </div>
              </div>
              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-earth-400" />
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input pl-10" placeholder="Your password" />
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? <LoadingSpinner size="sm" /> : <>Sign In <ArrowRight className="h-4 w-4" /></>}
              </button>
            </form>

            <div className="mt-6 rounded-xl bg-earth-50 p-4">
              <p className="mb-2 text-xs font-medium text-earth-600">Try a demo account:</p>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => fillDemo('farmer')} className="rounded-lg bg-primary-100 px-3 py-1.5 text-xs font-medium text-primary-700 hover:bg-primary-200">Farmer</button>
                <button onClick={() => fillDemo('buyer')} className="rounded-lg bg-accent-100 px-3 py-1.5 text-xs font-medium text-accent-700 hover:bg-accent-200">Buyer</button>
                <button onClick={() => fillDemo('admin')} className="rounded-lg bg-earth-200 px-3 py-1.5 text-xs font-medium text-earth-700 hover:bg-earth-300">Admin</button>
              </div>
            </div>

            <p className="mt-6 text-center text-sm text-earth-600">
              Don't have an account? <Link to="/signup" className="font-semibold text-primary-600 hover:text-primary-700">Sign up</Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
