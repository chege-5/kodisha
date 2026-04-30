import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import { Bot, Eye, EyeOff, ArrowRight } from 'lucide-react';

const ROLES = [
  { id: 'LANDLORD', label: 'Landlord', hint: 'Email', icon: '🏠' },
  { id: 'CARETAKER', label: 'Caretaker', hint: 'Phone', icon: '🔧' },
  { id: 'TENANT', label: 'Tenant', hint: 'Phone', icon: '🏡' },
];

export default function Login() {
  const [role, setRole] = useState('LANDLORD');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await login(identifier, password, role);
      if (data.role === 'TENANT') navigate('/tenant');
      else if (data.role === 'CARETAKER') navigate('/caretaker');
      else navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-kodi-navy relative overflow-hidden flex items-center justify-center p-4">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-kodi-accent/10 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-kodi-cyan/8 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-kodi-purple/5 rounded-full blur-3xl" />
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />
      </div>

      <div className="w-full max-w-md relative z-10 animate-slide-up">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-kodi-accent to-kodi-cyan shadow-2xl shadow-kodi-accent/30 mb-4 animate-float">
            <Bot className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold gradient-text">Kodisha</h1>
          <p className="text-kodi-text-muted mt-2 text-sm">AI-Powered Rental Management</p>
        </div>

        {/* Login Card */}
        <div className="glass-card">
          <h2 className="text-xl font-semibold text-kodi-text-primary mb-6">Sign in to your account</h2>

          {/* Role selector */}
          <div className="grid grid-cols-3 gap-2 mb-6 p-1 bg-kodi-navy/50 rounded-xl">
            {ROLES.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRole(r.id)}
                className={`py-2.5 px-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
                  role === r.id
                    ? 'bg-kodi-accent text-white shadow-lg shadow-kodi-accent/30'
                    : 'text-kodi-text-muted hover:text-kodi-text-primary hover:bg-kodi-border/20'
                }`}
              >
                <span className="block text-base mb-0.5">{r.icon}</span>
                {r.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">{role === 'LANDLORD' ? 'Email Address' : 'Phone Number'}</label>
              <input
                type={role === 'LANDLORD' ? 'email' : 'tel'}
                className="input"
                placeholder={role === 'LANDLORD' ? 'john@example.com' : '+254712000001'}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                autoComplete="username"
              />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input pr-11"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-kodi-text-muted hover:text-kodi-text-primary transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base group">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in…
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Sign In
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 p-4 rounded-xl bg-kodi-accent/5 border border-kodi-accent/10">
            <p className="text-xs text-kodi-accent font-semibold mb-2">🔑 Demo Credentials</p>
            <div className="space-y-1 text-xs text-kodi-text-muted">
              <p><span className="text-kodi-text-secondary">Admin:</span> admin@Kodisha.ke / admin123</p>
              <p><span className="text-kodi-text-secondary">Landlord:</span> john.kamau@gmail.com / password123</p>
              <p><span className="text-kodi-text-secondary">Caretaker:</span> +254712000002 / caretaker123</p>
              <p><span className="text-kodi-text-secondary">Tenant:</span> +254712000010 / tenant123</p>
            </div>
          </div>
        </div>

        <p className="text-center text-kodi-text-muted text-xs mt-6">
          Multi-channel: Web · USSD · SMS · Voice · M-Pesa
        </p>
      </div>
    </div>
  );
}
