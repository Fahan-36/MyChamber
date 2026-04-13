import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import AppointmentCard from '../components/appointments/AppointmentCard';
import EmptyState from '../components/common/EmptyState';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import SectionHeader from '../components/common/SectionHeader';
import appointmentService from '../services/appointmentService';
import { isUpcomingAppointmentByStatus } from '../utils/date';

function PatientUpcomingAppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadUpcomingAppointments = async () => {
    setLoading(true);
    try {
      const res = await appointmentService.getPatientAppointments();
      const upcomingOnly = (res.data || []).filter(isUpcomingAppointmentByStatus);
      setAppointments(upcomingOnly);
    } catch (error) {
      toast.error(error.message);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUpcomingAppointments();
  }, []);

  const onCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) {
      return;
    }

    try {
      await appointmentService.cancel(id);
      toast.success('Appointment cancelled');
      loadUpcomingAppointments();
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <section className="space-y-4">
      <SectionHeader
        title="Upcoming Appointments"
        subtitle="View and manage your upcoming consultations in one place."
      />

      {loading ? (
        <LoadingSkeleton count={4} />
      ) : appointments.length ? (
        <div className="grid gap-3 md:grid-cols-2">
          {appointments.map((item) => (
            <AppointmentCard
              key={item.appointment_id}
              appointment={item}
              role="patient"
              actions={
                isUpcomingAppointmentByStatus(item) ? (
                  <button
                    type="button"
                    onClick={() => onCancel(item.appointment_id)}
                    className="secondary-button text-rose-600"
                  >
                    Cancel
                  </button>
                ) : null
              }
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No upcoming appointments"
          description="Book your next consultation with a specialist."
          action={<Link to="/doctors" className="primary-button">Find Doctors</Link>}
        />
      )}
    </section>
  );
}

export default PatientUpcomingAppointmentsPage;
