import { CalendarDays, CheckCheck, Clock3, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import AppointmentCard from '../components/appointments/AppointmentCard';
import ReportModal from '../components/appointments/ReportModal';
import EmptyState from '../components/common/EmptyState';
import SectionHeader from '../components/common/SectionHeader';
import DashboardChart from '../components/dashboard/DashboardChart';
import StatsCard from '../components/dashboard/StatsCard';
import useAuth from '../hooks/useAuth';
import appointmentService from '../services/appointmentService';

function DoctorDashboardPage() {
  const { user } = useAuth();
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [reportingAppointment, setReportingAppointment] = useState(null);
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [dashboardStats, setDashboardStats] = useState({
    cards: {
      totalAppointments: 0,
      today: 0,
      pending: 0,
      confirmed: 0,
      uniquePatients: 0,
    },
    chart: [
      { name: 'pending', value: 0 },
      { name: 'confirmed', value: 0 },
      { name: 'completed', value: 0 },
    ],
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [statsRes, todayRes] = await Promise.all([
          appointmentService.getDoctorDashboardStats(),
          appointmentService.getDoctorToday(),
        ]);
        setDashboardStats(statsRes.data || dashboardStats);
        setTodayAppointments(todayRes.data || []);
      } catch {
        setDashboardStats({
          cards: { totalAppointments: 0, today: 0, pending: 0, confirmed: 0, uniquePatients: 0 },
          chart: [
            { name: 'pending', value: 0 },
            { name: 'confirmed', value: 0 },
            { name: 'completed', value: 0 },
          ],
        });
        setTodayAppointments([]);
      }
    };

    loadData();
  }, []);

  const handleOpenReport = (appointment) => {
    setReportingAppointment(appointment);
    setReportReason('');
    setReportDescription('');
  };

  const handleCloseReport = () => {
    setReportingAppointment(null);
    setReportReason('');
    setReportDescription('');
  };

  const onReportToAdmin = async ({ appointmentId, patientId, doctorId, reason, description }) => {
    await appointmentService.reportIssueToAdmin({ appointmentId, patientId, doctorId, reason, description });
  };

  const handleSubmitIssue = async () => {
    if (!reportingAppointment || !reportReason) {
      return;
    }

    try {
      setIsSubmittingReport(true);
      await onReportToAdmin({
        appointmentId: reportingAppointment.appointment_id,
        patientId: reportingAppointment.patient_id,
        doctorId: reportingAppointment.doctor_id || user?.id,
        reason: reportReason,
        description: reportDescription.trim(),
      });
      setTodayAppointments((prev) =>
        prev.map((appointment) =>
          appointment.appointment_id === reportingAppointment.appointment_id
            ? { ...appointment, issue_report_id: appointment.issue_report_id || 'reported' }
            : appointment
        )
      );
      toast.success('Issue reported successfully');
      handleCloseReport();
    } catch (error) {
      toast.error(error?.message || 'Failed to report issue');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  return (
    <section className="space-y-4">
      <SectionHeader title={`Doctor Dashboard, Dr. ${user?.name?.split(' ')[0] || ''}`} subtitle="Manage daily consultations, statuses, and schedules with clarity." />

      <div className="grid gap-4 md:grid-cols-4">
        <StatsCard title="Total Appointments" value={dashboardStats.cards.totalAppointments} icon={CalendarDays} />
        <StatsCard title="Today" value={dashboardStats.cards.today} icon={Clock3} />
        <StatsCard title="Pending" value={dashboardStats.cards.pending} icon={CheckCheck} />
        <StatsCard title="Unique Patients" value={dashboardStats.cards.uniquePatients} icon={UserRound} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
        <DashboardChart type="bar" data={dashboardStats.chart} />
        <div className="glass-card rounded-3xl p-5">
          <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white">Quick Actions</h3>
          <div className="mt-4 space-y-2">
            <Link to="/doctor/schedule" className="primary-button w-full">Manage Schedule</Link>
            <Link to="/doctor/appointments" className="secondary-button w-full">Manage Appointments</Link>
            <Link to="/doctor/patient-history" className="secondary-button w-full">View Patient History</Link>
          </div>
        </div>
      </div>

      <section className="space-y-3">
        <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white">Today's Appointments</h3>
        {todayAppointments.length ? (
          <div className="grid gap-3 md:grid-cols-2">
            {todayAppointments.map((item) => (
              <AppointmentCard
                key={item.appointment_id}
                appointment={item}
                role="doctor"
                actions={(
                  ['completed', 'cancelled', 'canceled'].includes(item.status) && (
                    <button
                      type="button"
                      onClick={() => handleOpenReport(item)}
                      disabled={Boolean(item.issue_report_id)}
                      className="rounded-2xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-brand-700"
                    >
                      {item.issue_report_id ? 'Reported' : 'Report'}
                    </button>
                  )
                )}
              />
            ))}
          </div>
        ) : (
          <EmptyState title="No appointments for today" description="Your confirmed patient visits for today will appear here." />
        )}
      </section>

      <ReportModal
        open={Boolean(reportingAppointment)}
        appointment={reportingAppointment}
        reason={reportReason}
        description={reportDescription}
        submitting={isSubmittingReport}
        onReasonChange={setReportReason}
        onDescriptionChange={setReportDescription}
        onClose={handleCloseReport}
        onSubmit={handleSubmitIssue}
      />
    </section>
  );
}

export default DoctorDashboardPage;
