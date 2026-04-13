import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import AuthShell from '../components/auth/AuthShell';
import PasswordInput from '../components/auth/PasswordInput';
import useAuth from '../hooks/useAuth';

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const user = await login(form);
      const from = location.state?.from?.pathname;
      const roleLandingPath = user.role === 'admin' ? '/admin' : user.role === 'doctor' ? '/doctor' : '/patient';
      navigate(from || roleLandingPath);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Welcome Back" subtitle="Sign in to continue managing your appointments.">
      <form onSubmit={onSubmit} className="space-y-3">
        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
          className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900"
          required
        />
        <PasswordInput value={form.password} onChange={(value) => setForm((prev) => ({ ...prev, password: value }))} />

        <button disabled={loading} className="primary-button w-full" type="submit">
          {loading ? 'Signing in...' : 'Login'}
        </button>
      </form>

      <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
        New here?{' '}
        <Link to="/register" className="font-semibold text-brand-600">Create account</Link>
      </p>
    </AuthShell>
  );
}

export default LoginPage;
