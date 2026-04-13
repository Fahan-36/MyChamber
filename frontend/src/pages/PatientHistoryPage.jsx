import { Clock3, Pill, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import EmptyState from '../components/common/EmptyState';
import SectionHeader from '../components/common/SectionHeader';
import appointmentService from '../services/appointmentService';
import { formatAppointmentTime, formatDate } from '../utils/date';

const BACKEND_URL = 'http://localhost:5000';

function PatientHistoryPage() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState(null);
  const [clinicalDataByAppointment, setClinicalDataByAppointment] = useState({});
  const [loadingClinicalForDoctor, setLoadingClinicalForDoctor] = useState(null);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const res = await appointmentService.getPatientAppointments();
      setAppointments(res.data || []);
    } catch (error) {
      toast.error(error.message || 'Failed to load history');
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const completedHistory = useMemo(
    () => appointments.filter((item) => String(item.status || '').trim().toLowerCase() === 'completed'),
    [appointments]
  );

  const doctorHistory = useMemo(() => {
    const grouped = new Map();

    completedHistory.forEach((item) => {
      const key = item.doctor_id;
      if (!grouped.has(key)) {
        grouped.set(key, {
          doctor_id: item.doctor_id,
          doctor_code: item.doctor_code,
          doctor_name: item.doctor_name,
          specialization: item.specialization,
          chamber_address: item.chamber_address,
          appointments: [],
        });
      }

      grouped.get(key).appointments.push(item);
    });

    return Array.from(grouped.values())
      .map((doctor) => ({
        ...doctor,
        appointments: doctor.appointments.sort((a, b) => {
          const aTime = new Date(`${a.appointment_date}T${a.time_slot}`);
          const bTime = new Date(`${b.appointment_date}T${b.time_slot}`);
          return bTime - aTime;
        }),
      }))
      .sort((a, b) => {
        const aLatest = a.appointments[0];
        const bLatest = b.appointments[0];
        const aTime = aLatest ? new Date(`${aLatest.appointment_date}T${aLatest.time_slot}`) : 0;
        const bTime = bLatest ? new Date(`${bLatest.appointment_date}T${bLatest.time_slot}`) : 0;
        return bTime - aTime;
      });
  }, [completedHistory]);

  const filteredDoctors = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return doctorHistory;

    return doctorHistory.filter((item) => {
      const haystack = `${item.doctor_name || ''} ${item.specialization || ''} ${item.chamber_address || ''}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [doctorHistory, query]);

  useEffect(() => {
    if (!filteredDoctors.length) {
      setSelectedDoctorId(null);
      return;
    }

    const exists = filteredDoctors.some((item) => item.doctor_id === selectedDoctorId);
    if (!exists) {
      setSelectedDoctorId(filteredDoctors[0].doctor_id);
    }
  }, [filteredDoctors, selectedDoctorId]);

  const selectedDoctor = filteredDoctors.find((item) => item.doctor_id === selectedDoctorId);
  const selectedDoctorAppointments = selectedDoctor?.appointments || [];

  useEffect(() => {
    if (!selectedDoctorAppointments.length) {
      return;
    }

    const missingAppointmentIds = selectedDoctorAppointments
      .map((item) => item.appointment_id)
      .filter((appointmentId) => !clinicalDataByAppointment[appointmentId]);

    if (!missingAppointmentIds.length) {
      return;
    }

    const loadDoctorClinicalData = async () => {
      setLoadingClinicalForDoctor(selectedDoctorId);
      try {
        const settled = await Promise.allSettled(
          missingAppointmentIds.map(async (appointmentId) => {
            const res = await appointmentService.getPatientClinicalData(appointmentId);
            return [appointmentId, res.data || {}];
          })
        );

        const entries = settled
          .filter((result) => result.status === 'fulfilled')
          .map((result) => result.value);

        setClinicalDataByAppointment((prev) => ({
          ...prev,
          ...Object.fromEntries(entries),
        }));
      } catch {
        toast.error('Failed to load clinical history');
      } finally {
        setLoadingClinicalForDoctor(null);
      }
    };

    loadDoctorClinicalData();
  }, [selectedDoctorAppointments, selectedDoctorId, clinicalDataByAppointment]);

  return (
    <section className="space-y-4">
      <SectionHeader
        title="My History"
        subtitle="See your doctors on the left and each selected doctor's prescription history by date on the right."
      />

      <div className="grid gap-4 xl:grid-cols-[360px_1fr]">
        <aside className="glass-card rounded-3xl p-5">
          <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white">Doctors</h3>

          <label className="relative mt-4 block w-full">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by doctor, specialization, or chamber"
              className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </label>

          <div className="mt-4 max-h-[520px] space-y-2 overflow-y-auto pr-1">
            {loading ? (
              <p className="text-sm text-slate-500">Loading doctors...</p>
            ) : filteredDoctors.length ? (
              filteredDoctors.map((item) => {
                const isActive = item.doctor_id === selectedDoctorId;

                return (
                  <button
                    key={item.doctor_id}
                    type="button"
                    onClick={() => setSelectedDoctorId(item.doctor_id)}
                    className={`w-full rounded-2xl border px-3 py-2.5 text-left transition ${
                      isActive
                        ? 'border-brand-400 bg-brand-50 dark:border-brand-500 dark:bg-brand-500/20'
                        : 'border-slate-200 bg-white/70 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800'
                    }`}
                  >
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">Dr. {item.doctor_name}</p>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Doctor ID: {item.doctor_code || 'N/A'}</p>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{item.specialization || 'General'}</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{item.chamber_address || 'No chamber address'}</p>
                    <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">Visits: {item.appointments.length}</p>
                  </button>
                );
              })
            ) : (
              <EmptyState
                title={query.trim() ? 'No doctor matches your search' : 'No completed history yet'}
                description={query.trim() ? 'Try a different search keyword.' : 'Doctors will appear here after completed consultations.'}
              />
            )}
          </div>
        </aside>

        <div className="glass-card rounded-3xl p-5">
          {!selectedDoctor ? (
            <EmptyState
              title="No doctor selected"
              description="Select a doctor from the left panel to view prescription history by date."
            />
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 dark:border-slate-700 dark:bg-slate-900">
                <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white">Dr. {selectedDoctor.doctor_name}</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {selectedDoctor.specialization || 'General'} • {selectedDoctor.chamber_address || 'No chamber address'}
                </p>
              </div>

              {loadingClinicalForDoctor === selectedDoctorId ? (
                <p className="text-sm text-slate-500">Loading prescription history...</p>
              ) : (
                <div className="space-y-3">
                  <h4 className="font-display text-lg font-semibold text-slate-900 dark:text-white">Prescription History by Date</h4>

                  {selectedDoctorAppointments.map((appointment) => {
                    const clinical = clinicalDataByAppointment[appointment.appointment_id] || {};
                    const prescriptionFiles = Array.isArray(clinical.reports)
                      ? clinical.reports.filter((report) => (report.file_category || 'report') === 'prescription')
                      : [];
                    const reportFiles = Array.isArray(clinical.reports)
                      ? clinical.reports.filter((report) => (report.file_category || 'report') !== 'prescription')
                      : [];

                    return (
                      <article
                        key={appointment.appointment_id}
                        className="rounded-2xl border border-slate-200 bg-white/70 p-4 dark:border-slate-700 dark:bg-slate-900"
                      >
                        <p className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                          <Clock3 size={14} /> {formatDate(appointment.appointment_date)} at {formatAppointmentTime(appointment.time_slot)}
                        </p>

                        <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-700 dark:bg-slate-950/50">
                          <h5 className="mb-1 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                            <Pill size={15} /> Notes
                          </h5>
                          <p className="text-sm text-slate-600 dark:text-slate-300">
                            {clinical.diagnosis_notes || appointment.diagnosis_notes || 'No diagnosis/notes added for this date.'}
                          </p>
                        </div>

                        <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-700 dark:bg-slate-950/50">
                          <h5 className="mb-1 text-sm font-semibold text-slate-900 dark:text-white">Follow-up</h5>
                          <p className="text-sm text-slate-600 dark:text-slate-300">
                            {clinical.followup_notes || appointment.followup_notes || 'No follow-up notes added for this date.'}
                          </p>
                          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                            Follow-up date: {clinical.followup_date || appointment.followup_date ? formatDate(clinical.followup_date || appointment.followup_date) : 'Not scheduled'}
                          </p>
                        </div>

                        <div className="mt-3">
                          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                            Prescription Files
                          </p>
                          {prescriptionFiles.length ? (
                            <ul className="space-y-1.5 text-sm">
                              {prescriptionFiles.map((report) => (
                                <li key={report.report_id}>
                                  <a
                                    href={`${BACKEND_URL}${report.file_path}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-brand-600 hover:underline dark:text-brand-400"
                                  >
                                    {report.file_name}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-slate-600 dark:text-slate-300">No prescription files uploaded for this date.</p>
                          )}
                        </div>

                        <div className="mt-3">
                          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                            Reports
                          </p>
                          {reportFiles.length ? (
                            <ul className="space-y-1.5 text-sm">
                              {reportFiles.map((report) => (
                                <li key={report.report_id}>
                                  <a
                                    href={`${BACKEND_URL}${report.file_path}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-brand-600 hover:underline dark:text-brand-400"
                                  >
                                    {report.file_name}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-slate-600 dark:text-slate-300">No reports uploaded for this date.</p>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default PatientHistoryPage;
