import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import AuthShell from '../components/auth/AuthShell';
import PasswordInput from '../components/auth/PasswordInput';
import useAuth from '../hooks/useAuth';

const initialForm = {
  name: '',
  email: '',
  phone: '',
  password: '',
  role: 'patient',
  age: '',
  gender: '',
  specialization: '',
  qualification: '',
  bmdc_registration_number: '',
  consultation_fee: '',
  chamber_address: '',
};

function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);

  const onChange = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const onSubmit = async (e) => {
    e.preventDefault();

    if (form.role === 'doctor') {
      const requiredDoctorFields = [
        'specialization',
        'qualification',
        'consultation_fee',
        'chamber_address',
      ];
      const missingDoctorField = requiredDoctorFields.find((key) => !String(form[key] || '').trim());
      if (missingDoctorField) {
        toast.error('Please complete all doctor fields');
        return;
      }
      if (!String(form.bmdc_registration_number || '').trim()) {
        toast.error('BMDC Registration Number is required.');
        return;
      }
    }

    setLoading(true);

    try {
      const payload = { ...form };
      if (form.role === 'patient') {
        delete payload.specialization;
        delete payload.qualification;
        delete payload.bmdc_registration_number;
        delete payload.consultation_fee;
        delete payload.chamber_address;
      } else {
        delete payload.age;
        delete payload.gender;
      }

      const user = await register(payload);
      navigate(user.role === 'doctor' ? '/doctor' : '/patient');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Create Account" subtitle="Join as a patient or doctor in less than a minute.">
      <form onSubmit={onSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onChange('role', 'patient')}
            className={`rounded-2xl border px-3 py-2 text-sm font-semibold ${
              form.role === 'patient' ? 'border-brand-500 bg-brand-500 text-white' : 'border-slate-200'
            }`}
          >
            Patient
          </button>
          <button
            type="button"
            onClick={() => onChange('role', 'doctor')}
            className={`rounded-2xl border px-3 py-2 text-sm font-semibold ${
              form.role === 'doctor' ? 'border-brand-500 bg-brand-500 text-white' : 'border-slate-200'
            }`}
          >
            Doctor
          </button>
        </div>

        <input placeholder="Full Name" value={form.name} onChange={(e) => onChange('name', e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900" required />
        <input type="email" placeholder="Email" value={form.email} onChange={(e) => onChange('email', e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900" required />
        <input placeholder="Phone" value={form.phone} onChange={(e) => onChange('phone', e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900" />
        <PasswordInput value={form.password} onChange={(value) => onChange('password', value)} />

        {form.role === 'patient' ? (
          <div className="grid grid-cols-2 gap-2">
            <input type="number" min="0" placeholder="Age" value={form.age} onChange={(e) => onChange('age', e.target.value)} className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900" />
            <select value={form.gender} onChange={(e) => onChange('gender', e.target.value)} className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900">
              <option value="">Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
        ) : (
          <>
            <input placeholder="Specialization" value={form.specialization} onChange={(e) => onChange('specialization', e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900" required />
            <input placeholder="Qualification" value={form.qualification} onChange={(e) => onChange('qualification', e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900" required />
            <input placeholder="BMDC Registration Number" value={form.bmdc_registration_number} onChange={(e) => onChange('bmdc_registration_number', e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900" required />
            <div className="space-y-1">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Consultation Fee (Tk)"
                value={form.consultation_fee}
                onChange={(e) => onChange('consultation_fee', e.target.value.replace(/\D/g, ''))}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900"
                required
              />
            </div>
            <input placeholder="Chamber Address" value={form.chamber_address} onChange={(e) => onChange('chamber_address', e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900" required />
          </>
        )}

        <button disabled={loading} className="primary-button w-full" type="submit">
          {loading ? 'Creating account...' : 'Register'}
        </button>
      </form>

      <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-brand-600">Login</Link>
      </p>
    </AuthShell>
  );
}

export default RegisterPage;
