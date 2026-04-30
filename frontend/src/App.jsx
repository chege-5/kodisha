import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';

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
import Layout from './components/Layout';

function PrivateRoute({ children, roles }) {
  const { user, role, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(role)) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Landlord portal */}
          <Route path="/" element={<PrivateRoute roles={['LANDLORD', 'ADMIN']}><Layout /></PrivateRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="properties" element={<Properties />} />
            <Route path="tenants" element={<Tenants />} />
            <Route path="tenants/:id" element={<TenantDetail />} />
            <Route path="payments" element={<Payments />} />
            <Route path="maintenance" element={<Maintenance />} />
            <Route path="broadcast" element={<Broadcast />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* Caretaker portal */}
          <Route path="/caretaker" element={<PrivateRoute roles={['CARETAKER']}><Layout caretakerMode /></PrivateRoute>}>
            <Route index element={<CaretakerPortal />} />
            <Route path="maintenance" element={<Maintenance />} />
          </Route>

          {/* Tenant portal */}
          <Route path="/tenant" element={<PrivateRoute roles={['TENANT']}><TenantPortal /></PrivateRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
