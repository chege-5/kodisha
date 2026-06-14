import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import api from '../utils/apiClient';
import { useEffect, useState } from 'react';
import SiteFooter from './SiteFooter';
import {
  LayoutDashboard, Building2, Users, CreditCard, Wrench, Megaphone, BarChart3,
  Settings, LogOut, Bell, ChevronLeft, ChevronRight, Receipt,
  Droplets, Shield, Menu, X, SunMedium, MoonStar, KeyRound, Home, Brain,
} from 'lucide-react';

const landlordNav = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard, exact: true },
  { to: '/dashboard/properties', label: 'Properties', icon: Building2 },
  { to: '/dashboard/units', label: 'Units', icon: Home },
  { to: '/dashboard/tenants', label: 'Tenants', icon: Users },
  { to: '/dashboard/payments', label: 'Payments', icon: CreditCard },
  { to: '/dashboard/billing', label: 'Bills', icon: Receipt },
  { to: '/dashboard/maintenance', label: 'Maintenance', icon: Wrench },
  { to: '/dashboard/broadcast', label: 'Broadcasts', icon: Megaphone },
  { to: '/dashboard/reports', label: 'Reports', icon: BarChart3 },
  { to: '/dashboard/trust-passport', label: 'Trust Passport', icon: KeyRound },
  { to: '/dashboard/notifications', label: 'Notifications', icon: Bell },
  { to: '/dashboard/settings', label: 'Settings', icon: Settings },
  { to: '/dashboard/insights', label: 'Insights', icon: Brain },
];

const caretakerNav = [
  { to: '/caretaker', label: 'Overview', icon: LayoutDashboard, exact: true },
  { to: '/caretaker/properties', label: 'Assigned Properties', icon: Building2 },
  { to: '/caretaker/units', label: 'Units', icon: Home },
  { to: '/caretaker/tenants', label: 'Tenants', icon: Users },
  { to: '/caretaker/meter-readings', label: 'Meter Readings', icon: Droplets },
  { to: '/caretaker/maintenance', label: 'Maintenance Tickets', icon: Wrench },
  { to: '/caretaker/payments', label: 'Payments Logged', icon: CreditCard },
  { to: '/caretaker/notifications', label: 'Notifications', icon: Bell },
];

const adminNav = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard, exact: true },
  { to: '/dashboard/admin', label: 'Admin Panel', icon: Shield },
  { to: '/dashboard/properties', label: 'Properties', icon: Building2 },
  { to: '/dashboard/units', label: 'Units', icon: Home },
  { to: '/dashboard/tenants', label: 'Tenants', icon: Users },
  { to: '/dashboard/payments', label: 'Payments', icon: CreditCard },
  { to: '/dashboard/billing', label: 'Bills', icon: Receipt },
  { to: '/dashboard/maintenance', label: 'Maintenance', icon: Wrench },
  { to: '/dashboard/trust-passport', label: 'Trust Passport', icon: KeyRound },
  { to: '/dashboard/notifications', label: 'Notifications', icon: Bell },
  { to: '/dashboard/reports', label: 'Reports', icon: BarChart3 },
  { to: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export default function Layout({ caretakerMode }) {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('kodisha-theme') || 'light');

  const nav = caretakerMode ? caretakerNav : role === 'ADMIN' ? adminNav : landlordNav;

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    localStorage.setItem('kodisha-theme', theme);
  }, [theme]);

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
      <div className={`px-5 py-6 border-b border-white/10 ${collapsed ? 'px-3' : ''}`}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-white/10">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          {!collapsed && (
            <div className="animate-fade-in">
              <h1 className="text-lg font-bold tracking-tight text-white">Kodishaa</h1>
              <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-blue-100">Rent OS</p>
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
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-white/12 text-white border border-white/15'
                  : 'text-slate-200/80 hover:bg-white/10 hover:text-white'
              } ${collapsed ? 'justify-center' : ''}`
            }
          >
            <Icon className="w-[18px] h-[18px] flex-shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>
      {/* User */}
      <div className="px-3 py-4 border-t border-white/10">
        {!collapsed && (
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-white/10 text-sm font-bold text-white">
              {user?.name?.[0] || 'U'}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">{user?.name}</p>
              <p className="truncate text-xs text-blue-100/75">{role}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-200/75 transition-colors hover:bg-white/10 hover:text-white ${collapsed ? 'justify-center' : ''}`}
        >
          <LogOut className="w-[18px] h-[18px]" />
          {!collapsed && 'Sign out'}
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-kodi-navy overflow-hidden text-kodi-text-primary relative isolate">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-kodi-dark border-r border-white/10 flex flex-col transform transition-transform duration-300 lg:hidden ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <button onClick={() => setMobileOpen(false)} className="absolute right-4 top-4 text-slate-300 transition-colors hover:text-white">
          <X className="w-5 h-5" />
        </button>
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className={`hidden lg:flex flex-col bg-kodi-dark border-r border-white/10 flex-shrink-0 transition-all duration-300 ${collapsed ? 'w-[76px]' : 'w-72'}`}>
        {sidebarContent}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="btn-soft-hover absolute bottom-20 -right-3 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-kodi-border bg-white text-kodi-text-muted transition-colors"
          style={{ left: collapsed ? '58px' : '264px' }}
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </aside>

      {/* Main content */}
      <div className="relative z-10 flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-18 flex-shrink-0 items-center justify-between border-b border-kodi-border bg-kodi-card px-4 lg:px-8 z-30 sticky top-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setMobileOpen(true)} className="btn-soft-hover flex h-10 w-10 items-center justify-center rounded-lg border border-transparent bg-kodi-navy text-kodi-text-muted lg:hidden">
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden items-center gap-2 rounded-lg border border-kodi-border bg-kodi-navy px-4 py-2 text-xs font-semibold tracking-wide text-kodi-text-muted lg:flex">
              <div className="h-1.5 w-1.5 rounded-full bg-kodi-emerald" />
              {new Date().toLocaleDateString('en-KE', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center rounded-lg border border-kodi-border bg-kodi-navy p-1">
              <button
                onClick={() => setTheme('light')}
                className={`rounded-md p-2 transition-colors ${theme === 'light' ? 'btn-subtle-active' : 'btn-soft-hover border border-transparent text-kodi-text-muted'}`}
                title="Light Mode"
              >
                <SunMedium className="h-4 w-4" />
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`rounded-md p-2 transition-colors ${theme === 'dark' ? 'btn-subtle-active' : 'btn-soft-hover border border-transparent text-kodi-text-muted'}`}
                title="Dark Mode"
              >
                <MoonStar className="h-4 w-4" />
              </button>
            </div>
            <button
              onClick={() => navigate(caretakerMode ? '/caretaker/notifications' : '/dashboard/notifications')}
              className="btn-soft-hover relative rounded-lg border border-transparent p-2.5 text-kodi-text-muted transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-kodi-rose text-[10px] font-bold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="relative flex-1 overflow-y-auto">
          <div key={location.pathname} className="page-stage min-h-full animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
