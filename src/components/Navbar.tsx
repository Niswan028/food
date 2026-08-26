import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Leaf, Menu, X, LogOut, LayoutDashboard, Store, Sprout, Shield, ShoppingCart } from 'lucide-react';

export function Navbar() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    setMenuOpen(false);
  };

  const dashboardLink = () => {
    if (!profile) return '/login';
    if (profile.role === 'farmer') return '/farmer';
    if (profile.role === 'buyer') return '/orders';
    if (profile.role === 'admin') return '/admin';
    return '/marketplace';
  };

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <header className="sticky top-0 z-50 border-b border-earth-200/60 bg-white/90 backdrop-blur-md">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600 text-white">
            <Leaf className="h-5 w-5" />
          </div>
          <span className="font-display text-lg font-bold text-earth-950">FarmTrace</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-1 md:flex">
          <Link to="/" className={`btn-ghost ${location.pathname === '/' ? 'text-primary-700' : ''}`}>Home</Link>
          <Link to="/marketplace" className={`btn-ghost ${isActive('/marketplace') ? 'text-primary-700' : ''}`}>Marketplace</Link>
          {user && profile?.role === 'farmer' && (
            <Link to="/farmer" className={`btn-ghost ${isActive('/farmer') ? 'text-primary-700' : ''}`}>My Farm</Link>
          )}
          {user && profile?.role === 'buyer' && (
            <>
              <Link to="/orders" className={`btn-ghost ${isActive('/orders') ? 'text-primary-700' : ''}`}>Orders</Link>
              <Link to="/cart" className={`btn-ghost ${isActive('/cart') ? 'text-primary-700' : ''}`}>
                <ShoppingCart className="h-4 w-4" /> Cart
              </Link>
            </>
          )}
          {user && profile?.role === 'admin' && (
            <Link to="/admin" className={`btn-ghost ${isActive('/admin') ? 'text-primary-700' : ''}`}>Admin</Link>
          )}
        </div>

        {/* Auth buttons */}
        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <>
              <Link to={dashboardLink()} className="btn-secondary">
                <LayoutDashboard className="h-4 w-4" /> Dashboard
              </Link>
              <button onClick={handleSignOut} className="btn-ghost">
                <LogOut className="h-4 w-4" /> Sign Out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-ghost">Sign In</Link>
              <Link to="/signup" className="btn-primary">Get Started</Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button onClick={() => setMenuOpen(!menuOpen)} className="btn-ghost md:hidden">
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="border-t border-earth-200 bg-white px-4 py-4 md:hidden">
          <div className="flex flex-col gap-2">
            <Link to="/" onClick={() => setMenuOpen(false)} className="btn-ghost justify-start">Home</Link>
            <Link to="/marketplace" onClick={() => setMenuOpen(false)} className="btn-ghost justify-start">
              <Store className="h-4 w-4" /> Marketplace
            </Link>
            {user && profile?.role === 'farmer' && (
              <Link to="/farmer" onClick={() => setMenuOpen(false)} className="btn-ghost justify-start">
                <Sprout className="h-4 w-4" /> My Farm
              </Link>
            )}
            {user && profile?.role === 'buyer' && (
              <>
                <Link to="/orders" onClick={() => setMenuOpen(false)} className="btn-ghost justify-start">Orders</Link>
                <Link to="/cart" onClick={() => setMenuOpen(false)} className="btn-ghost justify-start">
                  <ShoppingCart className="h-4 w-4" /> Cart
                </Link>
              </>
            )}
            {user && profile?.role === 'admin' && (
              <Link to="/admin" onClick={() => setMenuOpen(false)} className="btn-ghost justify-start">
                <Shield className="h-4 w-4" /> Admin
              </Link>
            )}
            <div className="my-2 border-t border-earth-100" />
            {user ? (
              <>
                <Link to={dashboardLink()} onClick={() => setMenuOpen(false)} className="btn-secondary">Dashboard</Link>
                <button onClick={handleSignOut} className="btn-ghost justify-start text-error-600">
                  <LogOut className="h-4 w-4" /> Sign Out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMenuOpen(false)} className="btn-secondary">Sign In</Link>
                <Link to="/signup" onClick={() => setMenuOpen(false)} className="btn-primary">Get Started</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
