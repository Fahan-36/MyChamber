import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import SectionHeader from '../../components/common/SectionHeader';
import adminService from '../../services/adminService';
import { formatDate } from '../../utils/date';

function AdminPatients() {
  const [patients, setPatients] = useState([]);
  const [loadingId, setLoadingId] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const loadPatients = async () => {
    try {
      const res = await adminService.getPatients();
      setPatients(res.data || []);
    } catch (error) {
      toast.error(error.message);
      setPatients([]);
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  const handleDelete = async (patientId) => {
    try {
      setLoadingId(patientId);
      await adminService.deletePatient(patientId);
      toast.success('Patient deleted successfully');
      await loadPatients();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoadingId(null);
    }
  };

  const openPatientDetails = (patient) => {
    setSelectedPatient(patient);
  };

  const closePatientDetails = () => {
    setSelectedPatient(null);
  };

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredPatients = patients.filter((patient) => {
    if (!normalizedSearch) return true;

    const haystack = [
      patient.patient_code,
      patient.name,
      patient.email,
      patient.phone,
      patient.gender,
      patient.age,
    ]
      .filter((value) => value !== null && value !== undefined && value !== '')
      .join(' ')
      .toLowerCase();

    return haystack.includes(normalizedSearch);
  });

  return (
    <section className="space-y-4">
      <SectionHeader title="Patient Management" subtitle="Monitor and manage all registered patient accounts." />

      <div className="glass-card rounded-3xl p-5">
        <div className="mb-4">
          <label htmlFor="patient-search" className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">
            Search patients
          </label>
          <input
            id="patient-search"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by patient ID, name, email, phone, age, or gender"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-300">
                <th className="px-3 py-3 font-semibold">Patient ID</th>
                <th className="px-3 py-3 font-semibold">Patient Name</th>
                <th className="px-3 py-3 font-semibold">Email</th>
                <th className="px-3 py-3 font-semibold">Phone</th>
                <th className="px-3 py-3 font-semibold">Registered Date</th>
                <th className="px-3 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.map((patient) => (
                <tr key={patient.patient_id} className="border-b border-slate-100 last:border-b-0 dark:border-slate-800">
                  <td className="px-3 py-3 font-semibold text-slate-700 dark:text-slate-200">{patient.patient_code || 'N/A'}</td>
                  <td className="px-3 py-3 text-slate-800 dark:text-slate-100">
                    <button
                      type="button"
                      onClick={() => openPatientDetails(patient)}
                      className="inline-flex items-center font-semibold text-brand-700 transition hover:text-brand-800 hover:underline focus:outline-none dark:text-brand-300 dark:hover:text-brand-200"
                    >
                      {patient.name}
                    </button>
                  </td>
                  <td className="px-3 py-3 text-slate-600 dark:text-slate-300">{patient.email}</td>
                  <td className="px-3 py-3 text-slate-600 dark:text-slate-300">{patient.phone || 'N/A'}</td>
                  <td className="px-3 py-3 text-slate-600 dark:text-slate-300">{formatDate(patient.created_at)}</td>
                  <td className="px-3 py-3">
                    <button
                      type="button"
                      onClick={() => handleDelete(patient.patient_id)}
                      disabled={loadingId === patient.patient_id}
                      className="rounded-xl border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-60 dark:border-rose-700 dark:bg-rose-500/10 dark:text-rose-300"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {!filteredPatients.length && (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-slate-500 dark:text-slate-400">
                    {searchTerm.trim() ? 'No patients match your search.' : 'No patients found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-end bg-slate-900/50 p-0 sm:items-center sm:p-4">
          <div className="w-full rounded-t-3xl border border-slate-200 bg-white p-5 shadow-2xl sm:mx-auto sm:max-w-2xl sm:rounded-3xl dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Patient Details</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Full profile information for this patient.</p>
              </div>
              <button
                type="button"
                onClick={closePatientDetails}
                className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Close
              </button>
            </div>

            <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 sm:grid-cols-2 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-200">
              <p><span className="font-medium">Patient ID:</span> {selectedPatient.patient_code || selectedPatient.patient_id || 'N/A'}</p>
              <p><span className="font-medium">Name:</span> {selectedPatient.name || 'N/A'}</p>
              <p><span className="font-medium">Email:</span> {selectedPatient.email || 'N/A'}</p>
              <p><span className="font-medium">Phone:</span> {selectedPatient.phone || 'N/A'}</p>
              <p><span className="font-medium">Age:</span> {selectedPatient.age ?? 'N/A'}</p>
              <p><span className="font-medium">Gender:</span> {selectedPatient.gender || 'N/A'}</p>
              <p className="sm:col-span-2"><span className="font-medium">Registered:</span> {formatDate(selectedPatient.created_at)}</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default AdminPatients;
