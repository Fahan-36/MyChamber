import { FileText, Pill, Search, Stethoscope } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import EmptyState from '../components/common/EmptyState';
import SectionHeader from '../components/common/SectionHeader';
import ClinicalDataEditor from '../components/doctors/ClinicalDataEditor';
import appointmentService from '../services/appointmentService';
import { formatDate, formatAppointmentTime } from '../utils/date';

function DoctorPatientHistoryPage() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState(null);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const res = await appointmentService.getDoctorPatientHistory();
      setAppointments(res.data || []);
    } catch (error) {
      toast.error(error.message);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const completedAppointments = useMemo(
    () =>
      appointments.filter(
        (item) => String(item.status || '').trim().toLowerCase() === 'completed'
      ),
    [appointments]
  );

  const patientHistory = useMemo(() => {
    const grouped = new Map();

    completedAppointments.forEach((item) => {
      const key = item.patient_id;
      if (!grouped.has(key)) {
        grouped.set(key, {
          patient_id: item.patient_id,
          patient_name: item.patient_name,
          patient_phone: item.patient_phone,
          age: item.age,
          gender: item.gender,
          appointments: [],
        });
      }
      grouped.get(key).appointments.push(item);
    });

    return Array.from(grouped.values()).map((patient) => ({
      ...patient,
      appointments: patient.appointments.sort((a, b) => {
        const aTime = new Date(`${a.appointment_date}T${a.time_slot}`);
        const bTime = new Date(`${b.appointment_date}T${b.time_slot}`);
        return bTime - aTime;
      }),
    }));
  }, [completedAppointments]);

  const filteredPatients = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return patientHistory;

    return patientHistory.filter((patient) => {
      const haystack = `${patient.patient_name} ${patient.patient_phone || ''} ${patient.gender || ''}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [patientHistory, query]);

  useEffect(() => {
    if (!filteredPatients.length) {
      setSelectedPatientId(null);
      return;
    }

    const exists = filteredPatients.some((patient) => patient.patient_id === selectedPatientId);
    if (!exists) {
      setSelectedPatientId(filteredPatients[0].patient_id);
    }
  }, [filteredPatients, selectedPatientId]);

  const selectedPatient = filteredPatients.find((patient) => patient.patient_id === selectedPatientId);

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  return (
    <section className="space-y-4">
      <SectionHeader
        title="Patient History"
        subtitle="Review patient records, appointment history, and treatment context in one place."
      />

      <div className="grid gap-4 xl:grid-cols-[360px_1fr]">
        <aside className="glass-card rounded-3xl p-5">
          <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white">Patient List</h3>

          <label className="relative mt-4 block w-full">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search patient by name, phone, or gender"
              className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </label>

          <div className="mt-4 max-h-[480px] space-y-2 overflow-y-auto pr-1">
            {loading ? (
              <p className="text-sm text-slate-500">Loading patient history...</p>
            ) : filteredPatients.length ? (
              filteredPatients.map((patient) => {
                const isActive = patient.patient_id === selectedPatientId;
                return (
                  <button
                    key={patient.patient_id}
                    type="button"
                    onClick={() => setSelectedPatientId(patient.patient_id)}
                    className={`w-full rounded-2xl border px-3 py-2.5 text-left transition ${
                      isActive
                        ? 'border-brand-400 bg-brand-50 dark:border-brand-500 dark:bg-brand-500/20'
                        : 'border-slate-200 bg-white/70 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800'
                    }`}
                  >
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{patient.patient_name}</p>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      {patient.gender || 'N/A'} {patient.age ? `• ${patient.age} yrs` : ''}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{patient.patient_phone || 'No phone provided'}</p>
                  </button>
                );
              })
            ) : (
              <EmptyState
                title={query.trim() ? 'No patients found' : 'No completed appointment history found.'}
                description={query.trim() ? 'Try a different keyword.' : 'Completed appointments will appear here after visits are finished.'}
              />
            )}
          </div>
        </aside>

        <div className="glass-card rounded-3xl p-5">
          {!selectedPatient ? (
            <EmptyState
              title="No patient selected"
              description="Choose a patient from the list to review appointment and treatment history."
            />
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 dark:border-slate-700 dark:bg-slate-900">
                <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white">{selectedPatient.patient_name}</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {selectedPatient.gender || 'N/A'} {selectedPatient.age ? `• ${selectedPatient.age} years old` : ''} • {selectedPatient.patient_phone || 'No phone'}
                </p>
              </div>

              <section className="space-y-2">
                <h4 className="flex items-center gap-2 font-display text-lg font-semibold text-slate-900 dark:text-white">
                  <Stethoscope size={18} /> Previous Appointments
                </h4>

                {selectedPatient.appointments.length ? (
                  <div className="space-y-2">
                    {selectedPatient.appointments.map((appointment) => (
                      <article
                        key={appointment.appointment_id}
                        className="rounded-2xl border border-slate-200 bg-white/70 p-4 dark:border-slate-700 dark:bg-slate-900"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">
                            {formatDate(appointment.appointment_date)} at {formatAppointmentTime(appointment.time_slot)}
                          </p>
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                            {appointment.status}
                          </span>
                        </div>

                        {/* Interactive Clinical Data Editor */}
                        <ClinicalDataEditor appointment={appointment} onUpdate={loadHistory} />
                      </article>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="No completed appointment history found."
                    description="Completed appointments will appear here after visits are finished."
                  />
                )}
              </section>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default DoctorPatientHistoryPage;
