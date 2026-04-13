import { CalendarDays, Star, Stethoscope, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import SectionHeader from '../../components/common/SectionHeader';
import StatsCard from '../../components/dashboard/StatsCard';
import adminService from '../../services/adminService';

const CHART_COLORS = ['#06b6d4', '#14b8a6', '#0ea5e9', '#38bdf8'];

function AdminDashboard() {
  const [stats, setStats] = useState({
    totalDoctors: 0,
    totalPatients: 0,
    totalAppointments: 0,
    totalReviews: 0,
  });

  useEffect(() => {
    const loadStats = async () => {
      try {
        const res = await adminService.getStats();
        setStats(res.data || {
          totalDoctors: 0,
          totalPatients: 0,
          totalAppointments: 0,
          totalReviews: 0,
        });
      } catch {
        setStats({
          totalDoctors: 0,
          totalPatients: 0,
          totalAppointments: 0,
          totalReviews: 0,
        });
      }
    };

    loadStats();
  }, []);

  const chartData = useMemo(
    () => [
      { name: 'Doctors', value: Number(stats.totalDoctors) || 0 },
      { name: 'Patients', value: Number(stats.totalPatients) || 0 },
      { name: 'Appointments', value: Number(stats.totalAppointments) || 0 },
      { name: 'Reviews', value: Number(stats.totalReviews) || 0 },
    ],
    [stats]
  );

  const hasChartData = chartData.some((item) => item.value > 0);

  return (
    <section className="space-y-4">
      <SectionHeader title="Admin Dashboard" subtitle="Monitor the entire MyChamber platform at a glance." />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatsCard title="Total Doctors" value={stats.totalDoctors} icon={Stethoscope} />
        <StatsCard title="Total Patients" value={stats.totalPatients} icon={Users} />
        <StatsCard title="Total Appointments" value={stats.totalAppointments} icon={CalendarDays} />
        <StatsCard title="Total Reviews" value={stats.totalReviews} icon={Star} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="glass-card h-80 rounded-3xl p-5">
          <div className="mb-3">
            <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white">Platform Totals</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Doctors, patients, appointments, and reviews</p>
          </div>

          {hasChartData ? (
            <ResponsiveContainer width="100%" height="82%">
              <BarChart data={chartData} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                <XAxis dataKey="name" stroke="#64748b" tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  formatter={(value) => [value, 'Count']}
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
                  }}
                />
                <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="grid h-[82%] place-items-center rounded-2xl border border-dashed border-slate-200 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
              No admin metrics available yet.
            </div>
          )}
        </div>

        <div className="glass-card h-80 rounded-3xl p-5">
          <div className="mb-3">
            <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white">Entity Distribution</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Relative share across platform entities</p>
          </div>

          {hasChartData ? (
            <ResponsiveContainer width="100%" height="82%">
              <PieChart>
                <Tooltip
                  formatter={(value, name) => [`${value}`, name]}
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
                  }}
                />
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={58}
                  outerRadius={92}
                  paddingAngle={2}
                  isAnimationActive
                  animationDuration={700}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="grid h-[82%] place-items-center rounded-2xl border border-dashed border-slate-200 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
              Not enough data to render distribution.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default AdminDashboard;
