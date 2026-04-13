import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import SectionHeader from '../../components/common/SectionHeader';
import adminService from '../../services/adminService';
import { formatDate } from '../../utils/date';

function AdminAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [issueReports, setIssueReports] = useState([]);

  useEffect(() => {
    const loadAppointments = async () => {
      try {
        const [appointmentRes, issueRes] = await Promise.all([
          adminService.getAppointments(),
          adminService.getAppointmentIssues(),
        ]);
        setAppointments(appointmentRes.data || []);
        setIssueReports(issueRes.data || []);
      } catch (error) {
        toast.error(error.message);
        setAppointments([]);
        setIssueReports([]);
      }
    };

    loadAppointments();
  }, []);

  return (
    <section className="space-y-4">
      <SectionHeader title="Appointment Monitoring" subtitle="Track every appointment across doctors and patients." />

      <div className="glass-card rounded-3xl p-5">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-300">
                <th className="px-3 py-3 font-semibold">Patient ID</th>
                <th className="px-3 py-3 font-semibold">Patient</th>
                <th className="px-3 py-3 font-semibold">Doctor ID</th>
                <th className="px-3 py-3 font-semibold">Doctor</th>
                <th className="px-3 py-3 font-semibold">Date</th>
                <th className="px-3 py-3 font-semibold">Time</th>
                <th className="px-3 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((appointment) => (
                <tr key={appointment.appointment_id} className="border-b border-slate-100 last:border-b-0 dark:border-slate-800">
                  <td className="px-3 py-3 font-semibold text-slate-700 dark:text-slate-200">{appointment.patient_code || 'N/A'}</td>
                  <td className="px-3 py-3 text-slate-800 dark:text-slate-100">{appointment.patient_name}</td>
                  <td className="px-3 py-3 font-semibold text-slate-700 dark:text-slate-200">{appointment.doctor_code || 'N/A'}</td>
                  <td className="px-3 py-3 text-slate-600 dark:text-slate-300">{appointment.doctor_name}</td>
                  <td className="px-3 py-3 text-slate-600 dark:text-slate-300">{formatDate(appointment.appointment_date)}</td>
                  <td className="px-3 py-3 text-slate-600 dark:text-slate-300">{appointment.time_slot}</td>
                  <td className="px-3 py-3">
                    <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold capitalize text-brand-700 dark:bg-brand-500/20 dark:text-brand-200">
                      {appointment.status}
                    </span>
                  </td>
                </tr>
              ))}
              {!appointments.length && (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-slate-500 dark:text-slate-400">
                    No appointments found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="glass-card rounded-3xl p-5">
        <div className="mb-3">
          <h3 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">Reported Appointment Issues</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Doctor-reported issues for admin review.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-300">
                <th className="px-3 py-3 font-semibold">Patient ID</th>
                <th className="px-3 py-3 font-semibold">Patient</th>
                <th className="px-3 py-3 font-semibold">Doctor ID</th>
                <th className="px-3 py-3 font-semibold">Doctor</th>
                <th className="px-3 py-3 font-semibold">Appointment</th>
                <th className="px-3 py-3 font-semibold">Reason</th>
                <th className="px-3 py-3 font-semibold">Description</th>
                <th className="px-3 py-3 font-semibold">Reported At</th>
              </tr>
            </thead>
            <tbody>
              {issueReports.map((report) => (
                <tr key={report.issue_id} className="border-b border-slate-100 last:border-b-0 dark:border-slate-800">
                  <td className="px-3 py-3 font-semibold text-slate-700 dark:text-slate-200">{report.patient_code || 'N/A'}</td>
                  <td className="px-3 py-3 text-slate-800 dark:text-slate-100">{report.patient_name}</td>
                  <td className="px-3 py-3 font-semibold text-slate-700 dark:text-slate-200">{report.doctor_code || 'N/A'}</td>
                  <td className="px-3 py-3 text-slate-600 dark:text-slate-300">{report.doctor_name}</td>
                  <td className="px-3 py-3 text-slate-600 dark:text-slate-300">
                    {formatDate(report.appointment_date)} at {report.time_slot}
                  </td>
                  <td className="px-3 py-3 text-slate-700 dark:text-slate-200">{report.reason}</td>
                  <td className="px-3 py-3 text-slate-600 dark:text-slate-300">{report.description || 'N/A'}</td>
                  <td className="px-3 py-3 text-slate-600 dark:text-slate-300">{formatDate(report.created_at)}</td>
                </tr>
              ))}
              {!issueReports.length && (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-slate-500 dark:text-slate-400">
                    No issue reports found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

export default AdminAppointments;
