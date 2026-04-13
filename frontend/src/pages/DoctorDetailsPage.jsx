import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import '../styles/datepicker.css';
import EmptyState from '../components/common/EmptyState';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import BookingModal from '../components/appointments/BookingModal';
import ConfirmedSlotsCard from '../components/appointments/ConfirmedSlotsCard';
import DoctorProfileCard from '../components/doctors/DoctorProfileCard';
import ScheduleCard from '../components/doctors/ScheduleCard';
import SlotPicker from '../components/doctors/SlotPicker';
import useAuth from '../hooks/useAuth';
import appointmentService from '../services/appointmentService';
import doctorService from '../services/doctorService';
import { formatAppointmentTime, todayISO } from '../utils/date';

const toLocalISODate = (value) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getWeekdayName = (value) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[value.getDay()];
};

const startOfToday = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
};

const parseSlotDateTime = (isoDate, timeValue) => {
  if (!isoDate || !timeValue) return null;
  const [year, month, day] = isoDate.split('-').map(Number);
  const [hours, minutes, seconds = 0] = timeValue.split(':').map(Number);
  const dateTime = new Date(year, month - 1, day, hours, minutes, seconds, 0);
  return Number.isNaN(dateTime.getTime()) ? null : dateTime;
};

const isFutureSlot = (isoDate, timeValue, now = new Date()) => {
  const slotDateTime = parseSlotDateTime(isoDate, timeValue);
  if (!slotDateTime) return false;
  return slotDateTime.getTime() > now.getTime();
};

function DoctorDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const calendarWrapRef = useRef(null);

  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(todayISO());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [slots, setSlots] = useState([]);
  const [slotLoading, setSlotLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [slotMessage, setSlotMessage] = useState('No slots available on this date.');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmedSlots, setConfirmedSlots] = useState([]);
  const [confirmedLoading, setConfirmedLoading] = useState(false);

  useEffect(() => {
    const loadDoctor = async () => {
      setLoading(true);
      try {
        const res = await doctorService.getById(id);
        setDoctor(res.data);
      } catch (error) {
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    };

    loadDoctor();
  }, [id]);

  useEffect(() => {
    let active = true;

    const loadSlots = async () => {
      if (!id || !date) return;

      setSlots([]);
      setSelectedSlot('');
      setSlotLoading(true);
      try {
        const res = await appointmentService.getAvailableSlots(id, date);
        if (!active) return;

        const now = new Date();
        const nextSlots = (res.data || []).filter((slot) => isFutureSlot(date, slot.timeValue, now));
        setSlots(nextSlots);

        if (!nextSlots.length) {
          setSelectedSlot('');
          const isToday = date === toLocalISODate(new Date());
          setSlotMessage(
            res.message ||
              (isToday
                ? 'No future slots available for the rest of today.'
                : `Doctor is not available on ${getWeekdayName(selectedDate)}.`)
          );
        } else {
          setSlotMessage('No slots available on this date.');
        }
      } catch (error) {
        if (!active) return;
        setSlots([]);
        setSelectedSlot('');
        setSlotMessage('No slots available on this date.');
        toast.error(error.message);
      } finally {
        if (active) setSlotLoading(false);
      }
    };

    loadSlots();

    return () => {
      active = false;
    };
  }, [id, date]);

  useEffect(() => {
    const loadConfirmedSlots = async () => {
      if (!id) return;
      setConfirmedLoading(true);
      try {
        const res = await appointmentService.getConfirmedAppointments(id);
        setConfirmedSlots(res.data || []);
      } catch (error) {
        // Silently fail - confirmed slots are optional information
        console.error('Failed to load confirmed slots:', error);
      } finally {
        setConfirmedLoading(false);
      }
    };

    loadConfirmedSlots();
  }, [id]);

  const handleBookClick = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: `/doctors/${id}` } } });
      return;
    }

    if (user.role !== 'patient') {
      toast.error('Only patients can book appointments.');
      return;
    }

    if (!selectedSlot) {
      toast.error('Please choose a time slot first.');
      return;
    }

    setModalOpen(true);
  };

  const handleDateChange = (date) => {
    if (date) {
      if (date < startOfToday()) {
        toast.error('Past dates cannot be selected.');
        return;
      }
      setSlots([]);
      setSelectedSlot('');
      setSelectedDate(date);
      const isoDate = toLocalISODate(date);
      setDate(isoDate);
      setIsCalendarOpen(false);
    }
  };

  const handleCalendarClick = () => {
    setIsCalendarOpen((prev) => !prev);
  };

  useEffect(() => {
    const onOutsideClick = (event) => {
      if (calendarWrapRef.current && !calendarWrapRef.current.contains(event.target)) {
        setIsCalendarOpen(false);
      }
    };

    document.addEventListener('mousedown', onOutsideClick);
    return () => document.removeEventListener('mousedown', onOutsideClick);
  }, []);

  const confirmBooking = async () => {
    try {
      if (!isFutureSlot(date, selectedSlot)) {
        toast.error('Selected slot has already passed. Please choose a future slot.');
        return;
      }

      await appointmentService.book({
        doctor_id: Number(id),
        appointment_date: date,
        time_slot: selectedSlot,
      });
      toast.success('Appointment booked successfully');
      setModalOpen(false);
      setSelectedSlot('');
      const slotRes = await appointmentService.getAvailableSlots(id, date);
      setSlots(slotRes.data || []);
      // Reload confirmed slots after booking
      const confirmedRes = await appointmentService.getConfirmedAppointments(id);
      setConfirmedSlots(confirmedRes.data || []);
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (loading) return <LoadingSkeleton type="page" />;
  if (!doctor) return <EmptyState title="Doctor not found" description="Please check another profile." />;

  return (
    <section className="mx-auto max-w-6xl space-y-4 px-4 py-10">
      <DoctorProfileCard doctor={doctor} />
      <div className="grid gap-4 lg:grid-cols-2 overflow-visible">
        <ScheduleCard schedule={doctor.schedule || []} />

        <section className="glass-card relative z-20 rounded-3xl p-6 overflow-visible">
          <h2 className="mb-4 font-display text-xl font-bold text-slate-900 dark:text-white">Book Appointment</h2>
          <label className="mb-4 block text-sm text-slate-600 dark:text-slate-300">
            Select Date
            <div className="relative mt-1 z-50" ref={calendarWrapRef}>
              <input
                type="text"
                value={date}
                readOnly
                onClick={() => setIsCalendarOpen(true)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 pr-10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
              <button
                type="button"
                onClick={handleCalendarClick}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-brand-600 dark:text-slate-500 dark:hover:text-brand-400"
                aria-label="Open calendar"
              >
                <motion.span
                  animate={{ rotate: isCalendarOpen ? 180 : 0 }}
                  transition={{ type: 'spring', stiffness: 280, damping: 24, mass: 0.9 }}
                  className="inline-flex"
                >
                  <Calendar size={18} />
                </motion.span>
              </button>

              <AnimatePresence>
                {isCalendarOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.98 }}
                    transition={{ type: 'spring', stiffness: 340, damping: 28, mass: 0.9 }}
                    className="absolute right-0 top-full mt-2 z-[9999] w-[min(20rem,calc(100vw-2rem))] origin-top-right"
                  >
                    <DatePicker
                      selected={selectedDate}
                      onChange={handleDateChange}
                      minDate={startOfToday()}
                      filterDate={(candidateDate) => candidateDate >= startOfToday()}
                      inline
                      calendarClassName="mychamber-datepicker !font-sans"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </label>

          <AnimatePresence mode="wait">
            {slotLoading ? (
              <motion.div
                key="slot-loading"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              >
                <LoadingSkeleton count={3} />
              </motion.div>
            ) : slots.length ? (
              <motion.div
                key="slot-list"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                <SlotPicker slots={slots} selectedSlot={selectedSlot} onSelect={setSelectedSlot} />
              </motion.div>
            ) : (
              <motion.p
                key="slot-empty"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className="text-sm text-slate-500"
              >
                {slotMessage}
              </motion.p>
            )}
          </AnimatePresence>

          <button type="button" onClick={handleBookClick} className="primary-button mt-5 w-full">
            Confirm Booking
          </button>
        </section>
      </div>

      {confirmedLoading ? (
        <div className="glass-card relative z-0 rounded-3xl p-6">
          <LoadingSkeleton count={3} />
        </div>
      ) : (
        <ConfirmedSlotsCard slots={confirmedSlots} />
      )}

      <BookingModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={confirmBooking}
        doctorName={doctor.name}
        date={date}
        slot={selectedSlot}
      />
    </section>
  );
}

export default DoctorDetailsPage;
