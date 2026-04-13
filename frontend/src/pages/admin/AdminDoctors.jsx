import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import SectionHeader from '../../components/common/SectionHeader';
import adminService from '../../services/adminService';
import { formatDate } from '../../utils/date';

const statusBadgeClass = {
  pending: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
  approved: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
  rejected: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300',
};

function AdminDoctors() {
  const [doctors, setDoctors] = useState([]);
  const [loadingId, setLoadingId] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const loadDoctors = async () => {
    try {
      const res = await adminService.getDoctors();
      setDoctors(res.data || []);
    } catch (error) {
      toast.error(error.message);
      setDoctors([]);
    }
  };

  useEffect(() => {
    loadDoctors();
  }, []);

  const handleStatusUpdate = async (doctorId, status) => {
    try {
      setLoadingId(doctorId);
      await adminService.updateDoctorStatus(doctorId, status);
      toast.success(`Doctor ${status}`);
      await loadDoctors();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoadingId(null);
    }
  };

  const handleDelete = async (doctorId) => {
    try {
      setLoadingId(doctorId);
      await adminService.deleteDoctor(doctorId);
      toast.success('Doctor deleted successfully');
      await loadDoctors();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoadingId(null);
    }
  };

  const openDoctorDetails = (doctor) => {
    setSelectedDoctor(doctor);
  };

  const closeDoctorDetails = () => {
    setSelectedDoctor(null);
  };

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredDoctors = doctors.filter((doctor) => {
    if (!normalizedSearch) return true;

    const haystack = [
      doctor.doctor_code,
      doctor.name,
      doctor.email,
      doctor.phone,
      doctor.specialization,
      doctor.status,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return haystack.includes(normalizedSearch);
  });

  return (
    <section className="space-y-4">
      <SectionHeader title="Doctor Management" subtitle="Review, approve, reject, and remove doctor accounts." />

      <div className="glass-card rounded-3xl p-5">
        <div className="mb-4">
          <label htmlFor="doctor-search" className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">
            Search doctors
          </label>
          <input
            id="doctor-search"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by doctor ID, name, email, phone, or specialization"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-300">
                <th className="px-3 py-3 font-semibold">Doctor ID</th>
                <th className="px-3 py-3 font-semibold">Doctor Name</th>
                <th className="px-3 py-3 font-semibold">Email</th>
                <th className="px-3 py-3 font-semibold">Specialization</th>
                <th className="px-3 py-3 font-semibold">Status</th>
                <th className="px-3 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDoctors.map((doctor) => (
                <tr key={doctor.doctor_id} className="border-b border-slate-100 last:border-b-0 dark:border-slate-800">
                  <td className="px-3 py-3 font-semibold text-slate-700 dark:text-slate-200">{doctor.doctor_code || 'N/A'}</td>
                  <td className="px-3 py-3 text-slate-800 dark:text-slate-100">
                    <button
                      type="button"
                      onClick={() => openDoctorDetails(doctor)}
                      className="inline-flex items-center font-semibold text-brand-700 transition hover:text-brand-800 hover:underline focus:outline-none dark:text-brand-300 dark:hover:text-brand-200"
                    >
                      {doctor.name}
                    </button>
                  </td>
                  <td className="px-3 py-3 text-slate-600 dark:text-slate-300">{doctor.email}</td>
                  <td className="px-3 py-3 text-slate-600 dark:text-slate-300">{doctor.specialization || 'N/A'}</td>
                  <td className="px-3 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadgeClass[doctor.status] || statusBadgeClass.pending}`}>
                      {doctor.status || 'pending'}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleStatusUpdate(doctor.doctor_id, 'approved')}
                        disabled={loadingId === doctor.doctor_id}
                        className="rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-60 dark:border-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStatusUpdate(doctor.doctor_id, 'rejected')}
                        disabled={loadingId === doctor.doctor_id}
                        className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-100 disabled:opacity-60 dark:border-amber-700 dark:bg-amber-500/10 dark:text-amber-300"
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(doctor.doctor_id)}
                        disabled={loadingId === doctor.doctor_id}
                        className="rounded-xl border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-60 dark:border-rose-700 dark:bg-rose-500/10 dark:text-rose-300"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!filteredDoctors.length && (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-slate-500 dark:text-slate-400">
                    {searchTerm.trim() ? 'No doctors match your search.' : 'No doctors found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedDoctor && (
        <div className="fixed inset-0 z-50 flex items-end bg-slate-900/50 p-0 sm:items-center sm:p-4">
          <div className="w-full rounded-t-3xl border border-slate-200 bg-white p-5 shadow-2xl sm:mx-auto sm:max-w-2xl sm:rounded-3xl dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Doctor Details</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Full profile information for this doctor.</p>
              </div>
              <button
                type="button"
                onClick={closeDoctorDetails}
                className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Close
              </button>
            </div>

            <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 sm:grid-cols-2 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-200">
              <p><span className="font-medium">Doctor ID:</span> {selectedDoctor.doctor_code || selectedDoctor.doctor_id || 'N/A'}</p>
              <p><span className="font-medium">Name:</span> {selectedDoctor.name || 'N/A'}</p>
              <p><span className="font-medium">Email:</span> {selectedDoctor.email || 'N/A'}</p>
              <p><span className="font-medium">Phone:</span> {selectedDoctor.phone || 'N/A'}</p>
              <p><span className="font-medium">Specialization:</span> {selectedDoctor.specialization || 'N/A'}</p>
              <p><span className="font-medium">Status:</span> {selectedDoctor.status || 'N/A'}</p>
              <p><span className="font-medium">Qualification:</span> {selectedDoctor.qualification || 'N/A'}</p>
              <p><span className="font-medium">BMDC Reg No:</span> {selectedDoctor.bmdc_registration_number || 'N/A'}</p>
              <p className="sm:col-span-2"><span className="font-medium">Consultation Fee:</span> {selectedDoctor.consultation_fee || 'N/A'}</p>
              <p className="sm:col-span-2"><span className="font-medium">Chamber Address:</span> {selectedDoctor.chamber_address || 'N/A'}</p>
              <p><span className="font-medium">Latitude:</span> {selectedDoctor.chamber_latitude ?? 'N/A'}</p>
              <p><span className="font-medium">Longitude:</span> {selectedDoctor.chamber_longitude ?? 'N/A'}</p>
              <p className="sm:col-span-2"><span className="font-medium">Registered:</span> {formatDate(selectedDoctor.created_at)}</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default AdminDoctors;
