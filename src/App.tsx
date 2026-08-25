import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Layout } from '@/components/Layout';
import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/LoginPage';
import { SignupPage } from '@/pages/SignupPage';
import { MarketplacePage } from '@/pages/MarketplacePage';
import { BatchDetailPage } from '@/pages/BatchDetailPage';
import { CartPage } from '@/pages/CartPage';
import { OrderHistoryPage } from '@/pages/OrderHistoryPage';
import { FarmerDashboard } from '@/pages/FarmerDashboard';
import { AdminDashboard } from '@/pages/AdminDashboard';
import { TracePage } from '@/pages/TracePage';
import { FullPageLoader } from '@/components/ui';

function ProtectedRoute({ children, roles }: { children: ReactNode; roles?: string[] }) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();
  if (loading) return <FullPageLoader />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (roles && profile && !roles.includes(profile.role)) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/trace/:batchId" element={<TracePage />} />
      <Route path="/*" element={
        <Layout>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/marketplace" element={<MarketplacePage />} />
            <Route path="/batch/:id" element={<BatchDetailPage />} />
            <Route path="/trace/:batchId" element={<TracePage />} />
            <Route path="/cart" element={
              <ProtectedRoute><CartPage /></ProtectedRoute>
            } />
            <Route path="/orders" element={
              <ProtectedRoute roles={['buyer']}><OrderHistoryPage /></ProtectedRoute>
            } />
            <Route path="/farmer" element={
              <ProtectedRoute roles={['farmer']}><FarmerDashboard /></ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      } />
    </Routes>
  );
}
