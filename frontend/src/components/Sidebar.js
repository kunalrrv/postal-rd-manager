import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LayoutDashboard, Users, CreditCard, Calculator, FileText, LogOut, Shield, Download } from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/customers', icon: Users, label: 'Customers' },
  { to: '/payments', icon: CreditCard, label: 'Payments' },
  { to: '/calculator', icon: Calculator, label: 'Calculator' },
  { to: '/reports', icon: FileText, label: 'Reports' },
];

export default function Sidebar({ mobile, onNavigate }) {
  const { user, logout } = useAuth();
  const [installPrompt, setInstallPrompt] = useState(null);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const result = await installPrompt.userChoice;
    if (result.outcome === 'accepted') {
      setInstallPrompt(null);
    }
  };

  const handleNavClick = () => {
    if (mobile && onNavigate) onNavigate();
  };

  const handleLogout = () => {
    logout();
    if (mobile && onNavigate) onNavigate();
  };

  return (
    <aside className={`${mobile ? 'w-full' : 'w-64'} bg-official-blue flex flex-col h-screen shrink-0`} data-testid="sidebar">
      <div className={`px-6 ${mobile ? 'pt-5 pb-4' : 'py-6'} border-b border-white/10`}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-postal-red flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-white font-heading font-bold text-base leading-tight">PostalRD Pro</h1>
            <p className="text-blue-300 text-xs">RD Management</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={handleNavClick}
            data-testid={`nav-${item.label.toLowerCase()}`}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active text-white' : 'text-blue-200'}`
            }
          >
            <item.icon className="w-[18px] h-[18px]" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-white/10">
        {installPrompt && (
          <button
            onClick={handleInstall}
            data-testid="install-app-btn"
            className="sidebar-link text-emerald-300 hover:text-emerald-200 w-full mb-2 bg-white/5 rounded-lg"
          >
            <Download className="w-[18px] h-[18px]" />
            <span>Install App</span>
          </button>
        )}
        <div className="flex items-center gap-3 mb-3 px-2">
          <div className="w-8 h-8 rounded-full bg-blue-700 flex items-center justify-center text-white text-xs font-semibold uppercase">
            {user?.username?.charAt(0) || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.username || 'Admin'}</p>
            <p className="text-xs text-blue-300">Agent</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          data-testid="logout-btn"
          className="sidebar-link text-blue-200 hover:text-white w-full"
        >
          <LogOut className="w-[18px] h-[18px]" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
