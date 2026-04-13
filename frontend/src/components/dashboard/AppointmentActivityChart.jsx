import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

function AppointmentActivityChart({ data = [] }) {
  return (
    <ResponsiveContainer width="100%" height="82%">
      <LineChart data={data} margin={{ top: 10, right: 12, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" strokeOpacity={0.5} />
        <XAxis dataKey="day" stroke="#64748b" tickLine={false} axisLine={false} />
        <YAxis allowDecimals={false} stroke="#64748b" tickLine={false} axisLine={false} width={26} />
        <Tooltip
          formatter={(value) => [`${value}`, 'Appointments']}
          contentStyle={{
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
          }}
          labelStyle={{ color: '#0f172a', fontWeight: 600 }}
        />
        <Line
          type="monotone"
          dataKey="count"
          name="Appointments"
          stroke="#14b8a6"
          strokeWidth={3}
          dot={{ r: 3 }}
          activeDot={{ r: 6 }}
          isAnimationActive
          animationDuration={800}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export default AppointmentActivityChart;
