import { CalendarCheck2, Clock3, UserRoundSearch } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import AppointmentCard from '../components/appointments/AppointmentCard';
import EmptyState from '../components/common/EmptyState';
import SectionHeader from '../components/common/SectionHeader';
import AppointmentActivityChart from '../components/dashboard/AppointmentActivityChart';
import StatsCard from '../components/dashboard/StatsCard';
import useAuth from '../hooks/useAuth';
import appointmentService from '../services/appointmentService';
import { isUpcomingAppointmentByStatus } from '../utils/date';

const STATUS_COLORS = {
  pending: '#f59e0b',
  confirmed: '#0ea5e9',
  completed: '#10b981',
};

const buildDefaultActivityData = (days = 7) => {
  const today = new Date();
  const endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const formatter = new Intl.DateTimeFormat('en-US', { weekday: 'short' });

  return Array.from({ length: days }, (_, index) => {
    const date = new Date(endDate);
    date.setDate(endDate.getDate() - (days - 1 - index));
    return { day: formatter.format(date), count: 0 };
  });
};

function PatientDashboardPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [activityData, setActivityData] = useState(() => buildDefaultActivityData(7));

  const normalizeStatus = (status) => String(status || '').trim().toLowerCase();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [allRes, activityRes] = await Promise.all([
          appointmentService.getPatientAppointments(),
          appointmentService.getPatientActivity(7),
        ]);

        const appointmentsData = allRes.data || [];
        const graphData = Array.isArray(activityRes?.data) && activityRes.data.length
          ? activityRes.data
          : buildDefaultActivityData(7);

        setAppointments(appointmentsData);
        setActivityData(graphData);
      } catch {
        setAppointments([]);
        setActivityData(buildDefaultActivityData(7));
      }
    };

    loadData();
  }, []);

  const completedAppointments = useMemo(
    () => appointments.filter((item) => normalizeStatus(item.status) === 'completed'),
    [appointments]
  );

  const upcomingAppointments = useMemo(
    () => appointments.filter(isUpcomingAppointmentByStatus),
    [appointments]
  );

  const doctorsConsulted = useMemo(() => {
    const completedDoctorIds = completedAppointments
      .map((item) => item.doctor_id)
      .filter((doctorId) => doctorId !== undefined && doctorId !== null);

    return new Set(completedDoctorIds).size;
  }, [completedAppointments]);

  const displayedUpcomingAppointments = useMemo(
    () => upcomingAppointments.slice(0, 4),
    [upcomingAppointments]
  );

  const statusBreakdownData = useMemo(() => {
    const statusCount = { pending: 0, confirmed: 0, completed: 0 };

    appointments.forEach((appointment) => {
      const status = normalizeStatus(appointment.status);
      if (status === 'pending' || status === 'confirmed' || status === 'completed') {
        statusCount[status] += 1;
      }
    });

    return [
      { name: 'Pending', value: statusCount.pending, key: 'pending' },
      { name: 'Confirmed', value: statusCount.confirmed, key: 'confirmed' },
      { name: 'Completed', value: statusCount.completed, key: 'completed' },
    ];
  }, [appointments]);

  const hasStatusData = statusBreakdownData.some((item) => item.value > 0);

  return (
    <section className="space-y-4">
      <SectionHeader title={`Welcome back, ${user?.name?.split(' ')[0] || 'Patient'}`} subtitle="Track upcoming visits, manage history, and discover specialists." />

      <div className="grid gap-4 md:grid-cols-3">
        <StatsCard title="Total Appointments" value={completedAppointments.length} icon={CalendarCheck2} />
        <StatsCard title="Upcoming" value={upcomingAppointments.length} icon={Clock3} />
        <StatsCard title="Doctors Consulted" value={doctorsConsulted} icon={UserRoundSearch} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
        <div className="glass-card h-80 rounded-3xl p-5">
          <div className="mb-3">
            <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white">Appointment Activity</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Last 7 Days</p>
          </div>
          <AppointmentActivityChart data={activityData} />
        </div>

        <div className="glass-card rounded-3xl p-5">
          <div className="mb-3">
            <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white">Appointment Status Breakdown</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Pending, Confirmed, Completed</p>
          </div>

          {hasStatusData ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    formatter={(value, name) => [`${value}`, name]}
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
                    }}
                  />
                  <Legend verticalAlign="bottom" height={24} />
                  <Pie
                    data={statusBreakdownData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={58}
                    outerRadius={88}
                    paddingAngle={2}
                    isAnimationActive
                    animationDuration={700}
                  >
                    {statusBreakdownData.map((entry) => (
                      <Cell key={entry.key} fill={STATUS_COLORS[entry.key]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="grid h-64 place-items-center rounded-2xl border border-dashed border-slate-200 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
              No appointment status data to visualize yet.
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white">Upcoming Appointments</h3>
            <Link to="/patient/appointments/upcoming" className="secondary-button">View All</Link>
          </div>
          {upcomingAppointments.length > displayedUpcomingAppointments.length && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Showing {displayedUpcomingAppointments.length} of {upcomingAppointments.length} upcoming appointments
            </p>
          )}
          {upcomingAppointments.length ? (
            <div className="grid gap-3 md:grid-cols-2">
              {displayedUpcomingAppointments.map((item) => (
                <AppointmentCard key={item.appointment_id} appointment={item} role="patient" />
              ))}
            </div>
          ) : (
            <EmptyState title="No upcoming appointments" description="Book your next consultation with a specialist." action={<Link to="/doctors" className="primary-button">Find Doctors</Link>} />
          )}
        </section>

        <div className="glass-card rounded-3xl p-5">
          <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white">Quick Actions</h3>
          <div className="mt-4 space-y-2">
            <Link to="/doctors" className="primary-button w-full">Search Doctors</Link>
            <Link to="/patient/appointments/upcoming" className="secondary-button w-full">View All</Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default PatientDashboardPage;
