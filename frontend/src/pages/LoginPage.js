import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Shield, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error('Please enter username and password');
      return;
    }
    setLoading(true);
    try {
      await login(username, password);
      toast.success('Login successful');
      navigate('/', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" data-testid="login-page">
      {/* Left side - Login Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-slate-50">
        <div className="w-full max-w-sm animate-fade-in-up">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-postal-red flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-heading font-bold text-xl text-slate-900">PostalRD Pro</h1>
              <p className="text-xs text-slate-500">Indian Postal Service RD Agent</p>
            </div>
          </div>

          <Card className="border-slate-200 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="font-heading text-2xl text-slate-900">Sign in</CardTitle>
              <CardDescription className="text-slate-500">Enter your credentials to access the dashboard</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-medium text-slate-700">Username</Label>
                  <Input
                    id="username"
                    data-testid="login-username"
                    placeholder="Enter username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="h-11"
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-slate-700">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      data-testid="login-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-11 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      data-testid="toggle-password"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <Button
                  type="submit"
                  data-testid="login-submit"
                  disabled={loading}
                  className="w-full h-11 bg-postal-red hover:bg-postal-red-600 text-white font-medium"
                >
                  {loading ? 'Signing in...' : 'Sign in'}
                </Button>
              </form>
              <p className="mt-4 text-xs text-center text-slate-400">
                Default: admin / admin123
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right side - Hero Image */}
      <div className="hidden lg:flex flex-1 bg-official-blue relative items-center justify-center overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>
        <div className="relative z-10 text-center px-12">
          <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center mx-auto mb-8">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h2 className="font-heading font-bold text-3xl text-white mb-4">
            RD Management System
          </h2>
          <p className="text-blue-200 text-base max-w-md mx-auto leading-relaxed">
            Manage your Recurring Deposit customers, track monthly payments,
            and monitor maturity with a secure, modern dashboard.
          </p>
          <div className="flex gap-6 justify-center mt-10 text-sm text-blue-300">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">100%</div>
              <div>Secure</div>
            </div>
            <div className="w-px bg-blue-600" />
            <div className="text-center">
              <div className="text-2xl font-bold text-white">Real-time</div>
              <div>Tracking</div>
            </div>
            <div className="w-px bg-blue-600" />
            <div className="text-center">
              <div className="text-2xl font-bold text-white">PDF</div>
              <div>Reports</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
