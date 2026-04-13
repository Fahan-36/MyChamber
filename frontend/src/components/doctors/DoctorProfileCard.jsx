import { Award, MapPin, Phone, Wallet } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const UPLOADS_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '');

const getDoctorImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (/^https?:\/\//i.test(imagePath)) return imagePath;
  return imagePath.startsWith('/') ? `${UPLOADS_BASE_URL}${imagePath}` : `${UPLOADS_BASE_URL}/${imagePath}`;
};

function DoctorProfileCard({ doctor }) {
  const doctorImageUrl = getDoctorImageUrl(doctor.profile_image);
  const doctorInitial = (doctor.name?.trim()?.charAt(0) || 'D').toUpperCase();

  return (
    <section className="glass-card rounded-3xl p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-slate-100 text-4xl font-bold text-slate-600 shadow-lg dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300">
          {doctorImageUrl ? (
            <img src={doctorImageUrl} alt={`Dr. ${doctor.name}`} className="h-full w-full object-cover object-[center_20%]" />
          ) : (
            <span>{doctorInitial}</span>
          )}
        </div>

        <div>
          <h1 className="font-display text-4xl font-bold text-slate-900 dark:text-white">Dr. {doctor.name}</h1>
          <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">Doctor ID: {doctor.doctor_code || 'N/A'}</p>
          <div className="mt-2 inline-flex rounded-2xl border border-brand-200 bg-brand-50 px-4 py-1.5 text-sm font-semibold uppercase tracking-[0.1em] text-brand-700 dark:border-brand-700/50 dark:bg-brand-900/30 dark:text-brand-300">
            {doctor.specialization}
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 text-sm text-slate-600 dark:text-slate-300 md:grid-cols-2">
        <div>
          <p className="flex items-start gap-2"><Award size={16} className="mt-0.5" /> {doctor.qualification}</p>
          {doctor.bmdcRegistrationNumber && (
            <p className="mt-1 pl-6 text-xs text-slate-500 dark:text-slate-400">BMDC Reg No: {doctor.bmdcRegistrationNumber}</p>
          )}
        </div>
        <p className="flex items-start gap-2"><Wallet size={16} className="mt-0.5" /> BDT {doctor.consultation_fee} consultation fee</p>
        <p className="flex items-start gap-2"><MapPin size={16} className="mt-0.5" /> {doctor.chamber_address}</p>
        <p className="flex items-start gap-2"><Phone size={16} className="mt-0.5" /> {doctor.phone || 'N/A'}</p>
      </div>
    </section>
  );
}

export default DoctorProfileCard;
