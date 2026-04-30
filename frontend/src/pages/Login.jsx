import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

const ROLES = [
  { id: 'LANDLORD', label: 'Landlord', hint: 'Email & password' },
  { id: 'CARETAKER', label: 'Caretaker', hint: 'Phone & password' },
  { id: 'TENANT', label: 'Tenant', hint: 'Phone & password' },
];

export default function Login() {
  const [role, setRole] = useState('LANDLORD');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
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
    <div className="min-h-screen bg-gradient-to-br from-kodi-navy via-kodi-blue to-blue-400 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white">KODI</h1>
          <p className="text-blue-200 mt-2">Rental Management Platform</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Sign in to your account</h2>

          {/* Role selector */}
          <div className="flex rounded-lg border border-gray-200 mb-6 overflow-hidden">
            {ROLES.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRole(r.id)}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  role === r.id ? 'bg-kodi-navy text-white' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
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
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                type="password"
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5">
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-700 font-medium">Demo credentials</p>
            <p className="text-xs text-blue-600 mt-1">Landlord: john.kamau@gmail.com / password123</p>
            <p className="text-xs text-blue-600">Tenant phone: +254712000010 / tenant123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
