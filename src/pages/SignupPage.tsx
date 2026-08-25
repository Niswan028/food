import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Leaf, Mail, Lock, User, Phone, Sprout, Store, ArrowRight, Check } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import { LoadingSpinner } from '@/components/ui';
import { UserRole } from '@/types';

export function SignupPage() {
  const { signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('farmer');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !phone || !password) {
      toast('Please fill in all fields', 'warning');
      return;
    }
    if (password.length < 8) {
      toast('Password must be at least 8 characters', 'warning');
      return;
    }
    if (!/^\+91\s?\d{5}\s?\d{5}$/.test(phone) && !/^\+91\d{10}$/.test(phone.replace(/\s/g, ''))) {
      toast('Phone should be in +91 format (e.g. +91 98765 43210)', 'warning');
      return;
    }
    setLoading(true);
    const { error } = await signUp(email, password, fullName, role, phone);
    setLoading(false);
    if (error) {
      toast(error, 'error');
      return;
    }
    toast('Account created! Please sign in.', 'success');
    navigate('/login');
  };

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-gradient-to-b from-primary-50 to-white px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="card">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-600 text-white">
              <Leaf className="h-6 w-6" />
            </div>
            <h1 className="font-display text-2xl font-bold text-earth-950">Create your account</h1>
            <p className="mt-1 text-sm text-earth-600">Join FarmTrace as a farmer or buyer</p>
          </div>

          {/* Role selector */}
          <div className="mb-4">
            <label className="label">I am a...</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('farmer')}
                className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${role === 'farmer' ? 'border-primary-500 bg-primary-50' : 'border-earth-200 hover:border-earth-300'}`}
              >
                <Sprout className={`h-6 w-6 ${role === 'farmer' ? 'text-primary-600' : 'text-earth-400'}`} />
                <span className={`text-sm font-semibold ${role === 'farmer' ? 'text-primary-700' : 'text-earth-600'}`}>Farmer</span>
                {role === 'farmer' && <Check className="h-4 w-4 text-primary-600" />}
              </button>
              <button
                type="button"
                onClick={() => setRole('buyer')}
                className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${role === 'buyer' ? 'border-accent-500 bg-accent-50' : 'border-earth-200 hover:border-earth-300'}`}
              >
                <Store className={`h-6 w-6 ${role === 'buyer' ? 'text-accent-600' : 'text-earth-400'}`} />
                <span className={`text-sm font-semibold ${role === 'buyer' ? 'text-accent-700' : 'text-earth-600'}`}>Buyer</span>
                {role === 'buyer' && <Check className="h-4 w-4 text-accent-600" />}
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-earth-400" />
                <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="input pl-10" placeholder="Your name" />
              </div>
            </div>
            <div>
              <label className="label">Email</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-earth-400" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input pl-10" placeholder="you@example.com" />
              </div>
            </div>
            <div>
              <label className="label">Phone</label>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-earth-400" />
                <input value={phone} onChange={(e) => setPhone(e.target.value)} className="input pl-10" placeholder="+91 98765 43210" />
              </div>
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-earth-400" />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input pl-10" placeholder="Min 8 characters" />
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? <LoadingSpinner size="sm" /> : <>Create Account <ArrowRight className="h-4 w-4" /></>}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-earth-600">
            Already have an account? <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-700">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
