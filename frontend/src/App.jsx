import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { Toaster } from 'react-hot-toast';

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
import Layout from './components/Layout';
import AIAssistant from './components/AIAssistant';

function PrivateRoute({ children, roles }) {
  const { user, role, loading } = useAuth();
  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-kodi-navy">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-3 border-kodi-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-kodi-text-muted text-sm">Loading…</p>
      </div>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(role)) return <Navigate to="/" replace />;
  return children;
}

function AppContent() {
  const { user, role } = useAuth();
  const showAI = user && (role === 'LANDLORD' || role === 'ADMIN');

  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Landlord / Admin portal */}
        <Route path="/" element={<PrivateRoute roles={['LANDLORD', 'ADMIN']}><Layout /></PrivateRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="properties" element={<Properties />} />
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
          <Route path="admin" element={<AdminDashboard />} />
        </Route>

        {/* Caretaker portal */}
        <Route path="/caretaker" element={<PrivateRoute roles={['CARETAKER']}><Layout caretakerMode /></PrivateRoute>}>
          <Route index element={<CaretakerPortal />} />
          <Route path="maintenance" element={<Maintenance />} />
          <Route path="meter-readings" element={<CaretakerPortal />} />
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
            background: '#161b3d',
            color: '#f1f5f9',
            border: '1px solid #1e2452',
            borderRadius: '12px',
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
