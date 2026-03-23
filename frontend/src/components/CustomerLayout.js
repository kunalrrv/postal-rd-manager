import { Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Shield, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CustomerLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="flex flex-col min-h-screen bg-slate-50" data-testid="customer-layout">
      {/* Header */}
      <header className="bg-official-blue text-white shrink-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-postal-red flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="font-heading font-bold text-sm sm:text-base leading-tight">PostalRD Pro</h1>
                <p className="text-blue-300 text-[10px] sm:text-xs">My RD Account</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-blue-700 flex items-center justify-center text-white text-xs font-semibold uppercase">
                  {user?.username?.charAt(0) || 'C'}
                </div>
                <span className="text-sm text-blue-200">{user?.username}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                data-testid="customer-logout-btn"
                className="text-blue-200 hover:text-white hover:bg-white/10 h-8"
              >
                <LogOut className="w-4 h-4 mr-1" /> Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1" data-testid="customer-main-content">
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center shrink-0">
        <p className="text-xs text-slate-400">PostalRD Pro - Indian Postal Service RD Management</p>
      </footer>
    </div>
  );
}
