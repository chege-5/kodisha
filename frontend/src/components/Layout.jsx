import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import api from '../utils/apiClient';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard, Building2, Users, CreditCard, Wrench, Megaphone, BarChart3,
  Settings, LogOut, Bell, ChevronLeft, ChevronRight, Bot, Receipt,
  Droplets, Shield, Menu, X, SunMedium, MoonStar,
} from 'lucide-react';

const landlordNav = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/dashboard/properties', label: 'Properties', icon: Building2 },
  { to: '/dashboard/tenants', label: 'Tenants', icon: Users },
  { to: '/dashboard/billing', label: 'Billing', icon: Receipt },
  { to: '/dashboard/payments', label: 'Payments', icon: CreditCard },
  { to: '/dashboard/meter-readings', label: 'Water Meters', icon: Droplets },
  { to: '/dashboard/maintenance', label: 'Maintenance', icon: Wrench },
  { to: '/dashboard/broadcast', label: 'Broadcast', icon: Megaphone },
  { to: '/dashboard/reports', label: 'Reports', icon: BarChart3 },
  { to: '/dashboard/settings', label: 'Settings', icon: Settings },
];

const caretakerNav = [
  { to: '/caretaker', label: 'Overview', icon: LayoutDashboard, exact: true },
  { to: '/caretaker/meter-readings', label: 'Water Meters', icon: Droplets },
  { to: '/caretaker/maintenance', label: 'Maintenance', icon: Wrench },
];

const adminNav = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/dashboard/admin', label: 'Admin Panel', icon: Shield },
  { to: '/dashboard/properties', label: 'Properties', icon: Building2 },
  { to: '/dashboard/tenants', label: 'Tenants', icon: Users },
  { to: '/dashboard/billing', label: 'Billing', icon: Receipt },
  { to: '/dashboard/reports', label: 'Reports', icon: BarChart3 },
  { to: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export default function Layout({ caretakerMode }) {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
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
      <div className={`px-5 py-6 border-b border-kodi-border/30 ${collapsed ? 'px-3' : ''}`}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-kodi-accent to-kodi-cyan shadow-lg shadow-kodi-accent/20">
            <Bot className="h-5 w-5 text-white" />
          </div>
          {!collapsed && (
            <div className="animate-fade-in">
              <h1 className="text-lg font-semibold tracking-tight text-white">Kodisha</h1>
              <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-kodi-text-muted">AI Rental OS</p>
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
              `group flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium transition-all duration-200 ${
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
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-kodi-purple to-kodi-accent text-sm font-bold text-white">
              {user?.name?.[0] || 'U'}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-kodi-text-primary">{user?.name}</p>
              <p className="truncate text-xs text-kodi-text-muted">{role}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={`flex w-full items-center gap-3 px-3 py-2.5 rounded-2xl text-sm text-kodi-text-muted hover:bg-kodi-rose/10 hover:text-kodi-rose transition-all ${collapsed ? 'justify-center' : ''}`}
        >
          <LogOut className="w-[18px] h-[18px]" />
          {!collapsed && 'Sign out'}
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-kodi-navy overflow-hidden text-kodi-text-primary">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-kodi-dark border-r border-kodi-border/30 flex flex-col transform transition-transform duration-300 lg:hidden ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <button onClick={() => setMobileOpen(false)} className="absolute right-4 top-4 text-kodi-text-muted hover:text-white">
          <X className="w-5 h-5" />
        </button>
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className={`hidden lg:flex flex-col bg-kodi-dark border-r border-kodi-border/30 flex-shrink-0 transition-all duration-300 ${collapsed ? 'w-[76px]' : 'w-72'}`}>
        {sidebarContent}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute bottom-20 -right-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-kodi-card border border-kodi-border text-kodi-text-muted hover:text-kodi-accent hover:border-kodi-accent/50 transition-all"
          style={{ left: collapsed ? '58px' : '264px' }}
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-16 flex-shrink-0 items-center justify-between border-b border-kodi-border/30 bg-kodi-dark/70 px-4 backdrop-blur-xl lg:px-8">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="text-kodi-text-muted hover:text-white lg:hidden">
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden rounded-full border border-kodi-border/60 bg-kodi-card/70 px-4 py-2 text-xs font-medium uppercase tracking-[0.22em] text-kodi-text-muted lg:block">
              {new Date().toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
              className="inline-flex items-center gap-2 rounded-xl border border-kodi-border/60 bg-kodi-card/70 px-3 py-2 text-sm text-kodi-text-secondary transition-colors hover:text-white"
            >
              {theme === 'dark' ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
              <span className="hidden sm:inline">{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
            </button>
            <button
              onClick={() => navigate('/notifications')}
              className="relative rounded-xl p-2.5 text-kodi-text-muted hover:bg-kodi-card hover:text-kodi-text-primary transition-all"
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
