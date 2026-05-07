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
  { to: '/dashboard/admin', label: 'Super Admin', icon: Shield },
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
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-kodi-accent to-kodi-emerald shadow-kodi-accent-20">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          {!collapsed && (
            <div className="animate-fade-in">
              <h1 className="text-lg font-bold tracking-tight text-white">Kodishaa</h1>
              <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-blue-100">Rent OS</p>
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
              `flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-white/12 text-white border border-white/15 shadow-lg shadow-black/10'
                  : 'text-blue-100/80 hover:bg-white/10 hover:text-white'
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
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-kodi-purple to-kodi-accent text-sm font-bold text-white">
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
          className={`flex w-full items-center gap-3 px-3 py-2.5 rounded-2xl text-sm text-blue-100/75 hover:bg-white/10 hover:text-white transition-all ${collapsed ? 'justify-center' : ''}`}
        >
          <LogOut className="w-[18px] h-[18px]" />
          {!collapsed && 'Sign out'}
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-kodi-navy overflow-hidden text-kodi-text-primary relative isolate">
      {/* Decorative Background Blobs */}
      <div className="pointer-events-none absolute -left-20 top-40 h-96 w-96 rounded-full bg-kodi-accent/10 blur-[120px] animate-pulse" />
      <div className="pointer-events-none absolute -right-20 bottom-20 h-80 w-80 rounded-full bg-kodi-emerald/10 blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
      
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-kodi-dark border-r border-white/10 flex flex-col transform transition-transform duration-300 lg:hidden ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <button onClick={() => setMobileOpen(false)} className="absolute right-4 top-4 text-kodi-text-muted hover:text-white">
          <X className="w-5 h-5" />
        </button>
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className={`hidden lg:flex flex-col bg-kodi-dark border-r border-white/10 flex-shrink-0 transition-all duration-300 ${collapsed ? 'w-[76px]' : 'w-72'}`}>
        {sidebarContent}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute bottom-20 -right-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white border border-kodi-border text-kodi-text-muted hover:text-kodi-accent hover:border-kodi-accent/50 transition-all"
          style={{ left: collapsed ? '58px' : '264px' }}
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </aside>

      {/* Main content */}
      <div className="relative z-10 flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-18 flex-shrink-0 items-center justify-between border-b border-kodi-border/50 bg-kodi-card/40 px-4 shadow-sm backdrop-blur-2xl lg:px-8 z-30 sticky top-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setMobileOpen(true)} className="flex h-10 w-10 items-center justify-center rounded-xl bg-kodi-navy text-kodi-text-muted hover:text-white lg:hidden">
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden items-center gap-2 rounded-2xl border border-kodi-border/60 bg-kodi-card/50 px-4 py-2 text-xs font-semibold tracking-wide text-kodi-text-muted shadow-sm lg:flex">
              <div className="h-1.5 w-1.5 rounded-full bg-kodi-emerald animate-pulse" />
              {new Date().toLocaleDateString('en-KE', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center p-1 rounded-2xl bg-kodi-navy/50 border border-kodi-border/40 backdrop-blur-md">
              <button
                onClick={() => setTheme('light')}
                className={`p-2 rounded-xl transition-all ${theme === 'light' ? 'bg-white text-kodi-accent shadow-md scale-110' : 'text-kodi-text-muted hover:text-white'}`}
                title="Light Mode"
              >
                <SunMedium className="h-4 w-4" />
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`p-2 rounded-xl transition-all ${theme === 'dark' ? 'bg-kodi-card text-kodi-emerald shadow-md scale-110' : 'text-kodi-text-muted hover:text-white'}`}
                title="Dark Mode"
              >
                <MoonStar className="h-4 w-4" />
              </button>
            </div>
            <button
              onClick={() => navigate(caretakerMode ? '/caretaker/notifications' : '/dashboard/notifications')}
              className="relative rounded-xl p-2.5 text-kodi-text-muted hover:bg-kodi-navy hover:text-kodi-accent transition-all"
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
        <main className="relative flex-1 overflow-y-auto">
          <div key={location.pathname} className="page-stage min-h-full animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
