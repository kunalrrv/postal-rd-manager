import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Shield, Eye, EyeOff, ArrowRight, ArrowLeft, Check, X, Mail } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

function getPasswordStrength(pw) {
  if (!pw) return { score: 0, label: '', color: '', criteria: [] };
  const criteria = [
    { label: 'At least 6 characters', met: pw.length >= 6 },
    { label: '8+ characters', met: pw.length >= 8 },
    { label: 'Uppercase letter', met: /[A-Z]/.test(pw) },
    { label: 'Lowercase letter', met: /[a-z]/.test(pw) },
    { label: 'Number', met: /\d/.test(pw) },
    { label: 'Special character', met: /[^A-Za-z0-9]/.test(pw) },
  ];
  const score = criteria.filter(c => c.met).length;
  let label, color;
  if (score <= 2) { label = 'Weak'; color = '#DC2626'; }
  else if (score <= 3) { label = 'Fair'; color = '#D97706'; }
  else if (score <= 4) { label = 'Good'; color = '#2563EB'; }
  else { label = 'Strong'; color = '#059669'; }
  return { score, label, color, criteria };
}

function PasswordStrength({ password }) {
  const { score, label, color, criteria } = useMemo(() => getPasswordStrength(password), [password]);
  if (!password) return null;
  const pct = Math.min((score / 6) * 100, 100);

  return (
    <div className="space-y-2 mt-2" data-testid="password-strength">
      <div className="flex items-center justify-between">
        <div className="flex gap-1 flex-1 mr-3">
          {[1, 2, 3, 4].map(i => (
            <div
              key={i}
              className="h-1.5 flex-1 rounded-full transition-all duration-300"
              style={{
                backgroundColor: score >= i * 1.5 ? color : '#E2E8F0',
              }}
            />
          ))}
        </div>
        <span className="text-xs font-medium" style={{ color }} data-testid="strength-label">{label}</span>
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1">
        {criteria.map((c, i) => (
          <div key={i} className="flex items-center gap-1.5">
            {c.met ? (
              <Check className="w-3 h-3 text-emerald-500 shrink-0" />
            ) : (
              <X className="w-3 h-3 text-slate-300 shrink-0" />
            )}
            <span className={`text-[11px] ${c.met ? 'text-slate-600' : 'text-slate-400'}`}>{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LoginPage() {
  const [mode, setMode] = useState('login'); // login | register | forgot
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const resetForm = () => {
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    setEmail('');
    setNewPassword('');
    setShowPassword(false);
  };

  const switchMode = (newMode) => {
    resetForm();
    setMode(newMode);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username || !password) { toast.error('Please enter username and password'); return; }
    setLoading(true);
    try {
      await login(username, password);
      toast.success('Login successful');
      navigate('/', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Login failed');
    } finally { setLoading(false); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!username || !password || !confirmPassword) { toast.error('Please fill in all required fields'); return; }
    if (username.length < 3) { toast.error('Username must be at least 3 characters'); return; }
    if (password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    if (password !== confirmPassword) { toast.error('Passwords do not match'); return; }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast.error('Please enter a valid email address'); return; }
    setLoading(true);
    try {
      await api.post('/auth/register', { username, password, email: email || null });
      toast.success('Account created! Please sign in.');
      switchMode('login');
      setUsername(username);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Registration failed');
    } finally { setLoading(false); }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!username || !email || !newPassword) { toast.error('Please fill in all fields'); return; }
    if (newPassword.length < 6) { toast.error('New password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      const res = await api.post('/auth/reset-password', { username, email, new_password: newPassword });
      toast.success(res.data.message);
      switchMode('login');
      setUsername(username);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Password reset failed');
    } finally { setLoading(false); }
  };

  const formTitle = mode === 'login' ? 'Sign in' : mode === 'register' ? 'Create account' : 'Reset password';
  const formDesc = mode === 'login'
    ? 'Enter your credentials to access the dashboard'
    : mode === 'register'
    ? 'Set up your agent account to get started'
    : 'Verify your identity to set a new password';

  return (
    <div className="min-h-screen flex" data-testid="login-page">
      {/* Left side - Form */}
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
              <CardTitle className="font-heading text-2xl text-slate-900">{formTitle}</CardTitle>
              <CardDescription className="text-slate-500">{formDesc}</CardDescription>
            </CardHeader>
            <CardContent>
              {/* ===== LOGIN FORM ===== */}
              {mode === 'login' && (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-sm font-medium text-slate-700">Username</Label>
                    <Input id="username" data-testid="login-username" placeholder="Enter username" value={username} onChange={(e) => setUsername(e.target.value)} className="h-11" autoFocus />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-sm font-medium text-slate-700">Password</Label>
                      <button type="button" onClick={() => switchMode('forgot')} data-testid="forgot-password-link" className="text-xs text-postal-red hover:underline">
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <Input id="password" data-testid="login-password" type={showPassword ? 'text' : 'password'} placeholder="Enter password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-11 pr-10" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" data-testid="toggle-password">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" data-testid="login-submit" disabled={loading} className="w-full h-11 bg-postal-red hover:bg-postal-red-600 text-white font-medium">
                    {loading ? 'Signing in...' : 'Sign in'}
                  </Button>
                </form>
              )}

              {/* ===== REGISTER FORM ===== */}
              {mode === 'register' && (
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">Username *</Label>
                    <Input data-testid="register-username" placeholder="Choose a username (min 3 chars)" value={username} onChange={(e) => setUsername(e.target.value)} className="h-11" autoFocus />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">Email <span className="text-slate-400 font-normal">(for password recovery)</span></Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input data-testid="register-email" type="email" placeholder="agent@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 pl-9" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">Password *</Label>
                    <div className="relative">
                      <Input data-testid="register-password" type={showPassword ? 'text' : 'password'} placeholder="Create a password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-11 pr-10" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" data-testid="toggle-password-register">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <PasswordStrength password={password} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">Confirm Password *</Label>
                    <Input data-testid="register-confirm-password" type="password" placeholder="Re-enter your password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="h-11" />
                    {confirmPassword && password !== confirmPassword && (
                      <p className="text-xs text-red-500 flex items-center gap-1" data-testid="password-mismatch"><X className="w-3 h-3" /> Passwords do not match</p>
                    )}
                    {confirmPassword && password === confirmPassword && (
                      <p className="text-xs text-emerald-600 flex items-center gap-1" data-testid="password-match"><Check className="w-3 h-3" /> Passwords match</p>
                    )}
                  </div>
                  <Button type="submit" data-testid="register-submit" disabled={loading || (password && password.length >= 1 && getPasswordStrength(password).score < 2)} className="w-full h-11 bg-postal-red hover:bg-postal-red-600 text-white font-medium">
                    {loading ? 'Creating account...' : 'Create Account'}
                  </Button>
                </form>
              )}

              {/* ===== FORGOT PASSWORD FORM ===== */}
              {mode === 'forgot' && (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">Username</Label>
                    <Input data-testid="reset-username" placeholder="Enter your username" value={username} onChange={(e) => setUsername(e.target.value)} className="h-11" autoFocus />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">Registered Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input data-testid="reset-email" type="email" placeholder="Enter your registered email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 pl-9" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">New Password</Label>
                    <div className="relative">
                      <Input data-testid="reset-new-password" type={showPassword ? 'text' : 'password'} placeholder="Enter new password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="h-11 pr-10" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" data-testid="toggle-password-reset">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <PasswordStrength password={newPassword} />
                  </div>
                  <Button type="submit" data-testid="reset-submit" disabled={loading} className="w-full h-11 bg-postal-red hover:bg-postal-red-600 text-white font-medium">
                    {loading ? 'Resetting...' : 'Reset Password'}
                  </Button>
                </form>
              )}

              {/* ===== MODE SWITCHER ===== */}
              <div className="mt-5 pt-4 border-t border-slate-100 text-center">
                {mode === 'login' && (
                  <p className="text-sm text-slate-500">
                    Don't have an account?{' '}
                    <button onClick={() => switchMode('register')} data-testid="go-to-signup" className="text-postal-red font-medium hover:underline inline-flex items-center gap-1">
                      Sign up <ArrowRight className="w-3 h-3" />
                    </button>
                  </p>
                )}
                {mode === 'register' && (
                  <p className="text-sm text-slate-500">
                    Already have an account?{' '}
                    <button onClick={() => switchMode('login')} data-testid="go-to-login" className="text-postal-red font-medium hover:underline inline-flex items-center gap-1">
                      Sign in <ArrowRight className="w-3 h-3" />
                    </button>
                  </p>
                )}
                {mode === 'forgot' && (
                  <p className="text-sm text-slate-500">
                    <button onClick={() => switchMode('login')} data-testid="back-to-login" className="text-postal-red font-medium hover:underline inline-flex items-center gap-1">
                      <ArrowLeft className="w-3 h-3" /> Back to Sign in
                    </button>
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right side - Hero */}
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
          <h2 className="font-heading font-bold text-3xl text-white mb-4">RD Management System</h2>
          <p className="text-blue-200 text-base max-w-md mx-auto leading-relaxed">
            Manage your Recurring Deposit customers, track monthly payments,
            and monitor maturity with a secure, modern dashboard.
          </p>
          <div className="flex gap-6 justify-center mt-10 text-sm text-blue-300">
            <div className="text-center"><div className="text-2xl font-bold text-white">100%</div><div>Secure</div></div>
            <div className="w-px bg-blue-600" />
            <div className="text-center"><div className="text-2xl font-bold text-white">Real-time</div><div>Tracking</div></div>
            <div className="w-px bg-blue-600" />
            <div className="text-center"><div className="text-2xl font-bold text-white">PDF</div><div>Reports</div></div>
          </div>
        </div>
      </div>
    </div>
  );
}
