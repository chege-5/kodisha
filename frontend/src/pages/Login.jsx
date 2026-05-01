import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import { ArrowRight, Building2, Eye, EyeOff, ShieldCheck, Sparkles, CreditCard, Wrench } from 'lucide-react';

export default function Login() {
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
      const data = await login(identifier, password);
      if (data.role === 'TENANT') navigate('/tenant');
      else if (data.role === 'CARETAKER') navigate('/caretaker');
      else navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen overflow-hidden bg-kodi-navy text-kodi-text-primary">
      <div className="relative mx-auto grid min-h-screen max-w-7xl items-center gap-10 px-4 py-8 md:grid-cols-[1.05fr_0.95fr] md:px-8">
        <div className="space-y-8 text-center md:text-left">
          <div className="inline-flex items-center gap-2 rounded-full border border-kodi-border bg-white px-4 py-2 text-sm text-kodi-text-secondary shadow-sm">
            <Sparkles className="h-4 w-4 text-kodi-accent-light" />
            Automatic role detection for landlords, caretakers, and tenants
          </div>

          <div className="space-y-4">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-kodi-accent to-kodi-emerald shadow-2xl shadow-kodi-accent/25">
              <Building2 className="h-8 w-8 text-white" />
            </div>
            <h1 className="max-w-3xl text-4xl font-black tracking-tight text-kodi-dark md:text-6xl">
              Sign in to Kodishaa and go straight to the right workspace.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-kodi-text-muted md:text-lg">
              Use email or phone number. Kodishaa identifies the account, creates the secure session, and opens the correct workspace with no manual role selection.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { icon: CreditCard, title: 'Rent certainty', text: 'Collections, arrears, receipts, and partial payments stay visible.' },
              { icon: Wrench, title: 'Field control', text: 'Caretakers, tickets, meter readings, and tenant follow-up stay organized.' },
              { icon: ShieldCheck, title: 'Secure sessions', text: 'JWT auth with token rotation and automatic refresh keeps roles separated.' },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="glass-card text-left">
                <Icon className="mb-4 h-5 w-5 text-kodi-accent-light" />
                <h2 className="mb-2 text-sm font-semibold text-kodi-dark">{title}</h2>
                <p className="text-sm leading-6 text-kodi-text-muted">{text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-md">
          <div className="absolute inset-0 -z-10 rounded-[2rem] bg-kodi-accent/10 blur-2xl" />
          <div className="glass-card border-kodi-border shadow-2xl shadow-slate-300/50">
            <div className="mb-8">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-kodi-text-muted">Secure access</p>
              <h2 className="mt-3 text-2xl font-bold text-kodi-dark">Welcome back</h2>
              <p className="mt-2 text-sm leading-6 text-kodi-text-muted">Enter your email or phone number and password to continue.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Email or phone number</label>
                <input
                  type="text"
                  className="input"
                  placeholder="name@example.com or +254712000001"
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
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-kodi-text-muted transition-colors hover:text-kodi-text-primary"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 text-base">
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Signing in
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Continue
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                )}
              </button>
            </form>

            <div className="mt-5 grid grid-cols-3 gap-2 rounded-2xl border border-kodi-border bg-kodi-navy p-2 text-center text-[11px] font-semibold text-kodi-text-muted">
              <span>Landlord / Admin</span>
              <span>Caretaker</span>
              <span>Tenant</span>
            </div>

            <div className="mt-6 rounded-2xl border border-kodi-border bg-kodi-navy p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-kodi-text-muted">Demo accounts</p>
              <div className="space-y-2 text-sm text-kodi-text-secondary">
                <p><span className="font-semibold text-kodi-dark">Admin:</span> admin@kodisha.ke / admin123</p>
                <p><span className="font-semibold text-kodi-dark">Landlord:</span> john.kamau@gmail.com / password123</p>
                <p><span className="font-semibold text-kodi-dark">Caretaker:</span> +254712000002 / caretaker123</p>
                <p><span className="font-semibold text-kodi-dark">Tenant:</span> +254712000010 / tenant123</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
