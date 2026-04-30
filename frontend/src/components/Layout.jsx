import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import api from '../utils/apiClient';
import { useState } from 'react';
import {
  LayoutDashboard, Building2, Users, CreditCard, Wrench, Megaphone, BarChart3,
  Settings, LogOut, Bell, ChevronLeft, ChevronRight, Bot, Receipt,
  Droplets, Shield, Menu, X,
} from 'lucide-react';

const landlordNav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/properties', label: 'Properties', icon: Building2 },
  { to: '/tenants', label: 'Tenants', icon: Users },
  { to: '/billing', label: 'Billing', icon: Receipt },
  { to: '/payments', label: 'Payments', icon: CreditCard },
  { to: '/meter-readings', label: 'Water Meters', icon: Droplets },
  { to: '/maintenance', label: 'Maintenance', icon: Wrench },
  { to: '/broadcast', label: 'Broadcast', icon: Megaphone },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
];

const caretakerNav = [
  { to: '/caretaker', label: 'Overview', icon: LayoutDashboard, exact: true },
  { to: '/caretaker/meter-readings', label: 'Water Meters', icon: Droplets },
  { to: '/caretaker/maintenance', label: 'Maintenance', icon: Wrench },
];

const adminNav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/admin', label: 'Admin Panel', icon: Shield },
  { to: '/properties', label: 'Properties', icon: Building2 },
  { to: '/tenants', label: 'Tenants', icon: Users },
  { to: '/billing', label: 'Billing', icon: Receipt },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function Layout({ caretakerMode }) {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const nav = caretakerMode ? caretakerNav : role === 'ADMIN' ? adminNav : landlordNav;

  const { data: notifData } = useQuery({
    queryKey: ['unread-count'],
    queryFn: () => api.get('/notifications/unread-count').then((r) => r.data),
    refetchInterval: 30000,
  });
  const unreadCount = notifData?.unreadCount || 0;

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className={`px-5 py-6 border-b border-kodi-border/30 ${collapsed ? 'px-3' : ''}`}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-kodi-accent to-kodi-cyan flex items-center justify-center flex-shrink-0">
            <Bot className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="animate-fade-in">
              <h1 className="text-lg font-bold text-white tracking-tight">Kodisha</h1>
              <p className="text-[10px] text-kodi-text-muted font-medium uppercase tracking-widest">AI Rental OS</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {nav.map(({ to, label, icon: Icon, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-kodi-accent/15 text-kodi-accent-light border border-kodi-accent/20 shadow-lg shadow-kodi-accent/5'
                  : 'text-kodi-text-secondary hover:bg-kodi-border/20 hover:text-kodi-text-primary'
              } ${collapsed ? 'justify-center' : ''}`
            }
          >
            <Icon className="w-[18px] h-[18px] flex-shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-kodi-border/30">
        {!collapsed && (
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-kodi-purple to-kodi-accent flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {user?.name?.[0] || 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-kodi-text-primary truncate">{user?.name}</p>
              <p className="text-xs text-kodi-text-muted truncate">{role}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={`flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-kodi-text-muted hover:bg-kodi-rose/10 hover:text-kodi-rose transition-all ${collapsed ? 'justify-center' : ''}`}
        >
          <LogOut className="w-[18px] h-[18px]" />
          {!collapsed && 'Sign out'}
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-kodi-navy overflow-hidden">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-kodi-dark border-r border-kodi-border/30 flex flex-col transform transition-transform duration-300 lg:hidden ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 text-kodi-text-muted hover:text-white">
          <X className="w-5 h-5" />
        </button>
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className={`hidden lg:flex flex-col bg-kodi-dark border-r border-kodi-border/30 flex-shrink-0 transition-all duration-300 ${collapsed ? 'w-[72px]' : 'w-64'}`}>
        {sidebarContent}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute bottom-20 -right-3 w-6 h-6 rounded-full bg-kodi-card border border-kodi-border flex items-center justify-center text-kodi-text-muted hover:text-kodi-accent hover:border-kodi-accent/50 transition-all z-10"
          style={{ left: collapsed ? '60px' : '248px' }}
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-16 border-b border-kodi-border/30 bg-kodi-dark/50 backdrop-blur-xl flex items-center justify-between px-4 lg:px-8 flex-shrink-0">
          <button onClick={() => setMobileOpen(true)} className="lg:hidden text-kodi-text-muted hover:text-white">
            <Menu className="w-5 h-5" />
          </button>

          <div className="hidden lg:block">
            <p className="text-sm text-kodi-text-muted">
              {new Date().toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/notifications')}
              className="relative p-2.5 rounded-xl hover:bg-kodi-card text-kodi-text-muted hover:text-kodi-text-primary transition-all"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-kodi-rose text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
