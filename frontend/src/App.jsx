import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { applyTheme, getInitialTheme } from './utils/theme';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Properties from './pages/Properties';
import Tenants from './pages/Tenants';
import TenantDetail from './pages/TenantDetail';
import Payments from './pages/Payments';
import Maintenance from './pages/Maintenance';
import Broadcast from './pages/Broadcast';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import TenantPortal from './pages/TenantPortal';
import CaretakerPortal from './pages/CaretakerPortal';
import AdminDashboard from './pages/AdminDashboard';
import Billing from './pages/Billing';
import Notifications from './pages/Notifications';
import Units from './pages/Units';
import TrustPassport from './pages/TrustPassport';
import Layout from './components/Layout';
import AIAssistant from './components/AIAssistant';
import Loading from './components/Loading';

function getHomePath(role) {
  if (role === 'TENANT') return '/tenant';
  if (role === 'CARETAKER') return '/caretaker';
  if (role === 'ADMIN') return '/dashboard/admin';
  return '/dashboard';
}

function ThemeBootstrap() {
  useEffect(() => {
    applyTheme(getInitialTheme());
  }, []);

  return null;
}

function PrivateRoute({ children, roles }) {
  const { user, role, loading } = useAuth();
  if (loading) {
    return <Loading message="Authenticating secure session..." />;
  }
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(role)) return <Navigate to={getHomePath(role)} replace />;
  return children;
}

function AppContent() {
  const { user, role } = useAuth();
  const showAI = user && (role === 'LANDLORD' || role === 'ADMIN');

  return (
    <>
      <ThemeBootstrap />
      <Routes>
        <Route path="/" element={user ? <Navigate to={getHomePath(role)} replace /> : <Landing />} />
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />

        {/* Landlord / Admin portal */}
        <Route path="/dashboard" element={<PrivateRoute roles={['LANDLORD', 'ADMIN']}><Layout /></PrivateRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="properties" element={<Properties />} />
          <Route path="units" element={<Units />} />
          <Route path="tenants" element={<Tenants />} />
          <Route path="tenants/:id" element={<TenantDetail />} />
          <Route path="payments" element={<Payments />} />
          <Route path="billing" element={<Billing />} />
          <Route path="maintenance" element={<Maintenance />} />
          <Route path="broadcast" element={<Broadcast />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="meter-readings" element={<Billing />} />
          <Route path="insights" element={<Dashboard />} />
          <Route path="trust-passport" element={<TrustPassport />} />
          <Route path="admin" element={<PrivateRoute roles={['ADMIN']}><AdminDashboard /></PrivateRoute>} />
        </Route>

        {/* Caretaker portal */}
        <Route path="/caretaker" element={<PrivateRoute roles={['CARETAKER']}><Layout caretakerMode /></PrivateRoute>}>
          <Route index element={<CaretakerPortal />} />
          <Route path="properties" element={<CaretakerPortal />} />
          <Route path="units" element={<CaretakerPortal />} />
          <Route path="tenants" element={<CaretakerPortal />} />
          <Route path="maintenance" element={<Maintenance />} />
          <Route path="meter-readings" element={<CaretakerPortal />} />
          <Route path="payments" element={<CaretakerPortal />} />
          <Route path="notifications" element={<Notifications />} />
        </Route>

        {/* Tenant portal */}
        <Route path="/tenant" element={<PrivateRoute roles={['TENANT']}><TenantPortal /></PrivateRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* AI Assistant (only for Landlord/Admin) */}
      {showAI && <AIAssistant />}

      {/* Toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'rgb(var(--kodi-card))',
            color: 'rgb(var(--kodi-text-primary))',
            border: '1px solid rgb(var(--kodi-border))',
            borderRadius: '14px',
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#f1f5f9' } },
          error: { iconTheme: { primary: '#f43f5e', secondary: '#f1f5f9' } },
        }}
      />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}
