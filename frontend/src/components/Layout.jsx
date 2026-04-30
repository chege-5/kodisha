import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  HomeIcon, BuildingOfficeIcon, UsersIcon, CreditCardIcon,
  WrenchScrewdriverIcon, MegaphoneIcon, ChartBarIcon, Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';

const landlordNav = [
  { to: '/', label: 'Dashboard', icon: HomeIcon, exact: true },
  { to: '/properties', label: 'Properties', icon: BuildingOfficeIcon },
  { to: '/tenants', label: 'Tenants', icon: UsersIcon },
  { to: '/payments', label: 'Payments', icon: CreditCardIcon },
  { to: '/maintenance', label: 'Maintenance', icon: WrenchScrewdriverIcon },
  { to: '/broadcast', label: 'Broadcast', icon: MegaphoneIcon },
  { to: '/reports', label: 'Reports', icon: ChartBarIcon },
  { to: '/settings', label: 'Settings', icon: Cog6ToothIcon },
];

const caretakerNav = [
  { to: '/caretaker', label: 'Overview', icon: HomeIcon, exact: true },
  { to: '/caretaker/maintenance', label: 'Maintenance', icon: WrenchScrewdriverIcon },
];

export default function Layout({ caretakerMode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const nav = caretakerMode ? caretakerNav : landlordNav;

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-kodi-navy flex flex-col flex-shrink-0">
        <div className="px-6 py-5 border-b border-white/10">
          <h1 className="text-2xl font-bold text-white tracking-tight">KODI</h1>
          <p className="text-xs text-blue-200 mt-0.5">Rental Management</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {nav.map(({ to, label, icon: Icon, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-white/10 text-white'
                    : 'text-blue-100 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-blue-400 flex items-center justify-center text-white text-sm font-bold">
              {user?.name?.[0] || 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-blue-300 truncate">{user?.email || user?.phone}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm text-blue-100 hover:bg-white/5 hover:text-white transition-colors"
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
