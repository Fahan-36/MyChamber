import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import SectionHeader from '../components/common/SectionHeader';
import ScheduleCard from '../components/doctors/ScheduleCard';
import doctorService from '../services/doctorService';

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const durationOptions = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60];

const getDefaultDateRange = () => {
  const today = new Date();
  const end = new Date(today);
  end.setMonth(end.getMonth() + 1);

  const toInputDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return {
    start_date: toInputDate(today),
    end_date: toInputDate(end),
  };
};

const defaultDateRange = getDefaultDateRange();
const toDateInputValue = (value) => String(value || '').slice(0, 10);

const initialForm = {
  weekdays: ['Monday'],
  start_time: '09:00:00',
  end_time: '17:00:00',
  slot_duration: 30,
  start_date: defaultDateRange.start_date,
  end_date: defaultDateRange.end_date,
};

function DoctorSchedulePage() {
  const [schedule, setSchedule] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [errors, setErrors] = useState({});

  const loadSchedule = async () => {
    const res = await doctorService.getMySchedule();
    const nextSchedule = res.data || [];
    setSchedule(nextSchedule);
    return nextSchedule;
  };

  useEffect(() => {
    const init = async () => {
      try {
        await loadSchedule();
      } catch (error) {
        toast.error(error.message);
      }
    };

    init();
  }, []);

  const validateForm = () => {
    const newErrors = {};

    // Check at least one weekday
    if (form.weekdays.length === 0) {
      newErrors.weekdays = 'Please select at least one weekday.';
    }

    // Check duration
    if (!form.slot_duration) {
      newErrors.duration = 'Please select an appointment duration.';
    } else {
      const duration = Number(form.slot_duration);
      if (duration < 5 || duration > 60) {
        newErrors.duration = 'Appointment duration must be between 5 and 60 minutes.';
      }
    }

    if (!form.start_date || !form.end_date) {
      newErrors.date = 'Start date and end date are required.';
    } else if (form.end_date < form.start_date) {
      newErrors.date = 'End date cannot be before start date.';
    }

    // Check end time > start time
    if (form.end_time <= form.start_time) {
      newErrors.time = 'End time must be later than start time.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getDuplicateWeekdays = (weekdays) =>
    weekdays.filter((day) =>
      schedule.some((item) => item.schedule_id !== editingId && item.day_of_week === day)
    );

  const onSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSaving(true);
    try {
      if (editingId) {
        // Update existing schedule
        await doctorService.updateSchedule(editingId, {
          day_of_week: form.weekdays[0],
          start_time: form.start_time,
          end_time: form.end_time,
          slot_duration: Number(form.slot_duration),
          start_date: form.start_date,
          end_date: form.end_date,
        });
        await loadSchedule();
        setEditingId(null);
        setForm(initialForm);
        setErrors({});
        toast.success('✓ Availability updated successfully');
      } else {
        const duplicateDays = getDuplicateWeekdays(form.weekdays);
        const uniqueDays = form.weekdays.filter((day) => !duplicateDays.includes(day));

        if (!uniqueDays.length) {
          setErrors((prev) => ({
            ...prev,
            duplicate: 'All selected weekdays already exist. Please edit existing entries.',
          }));
          toast.error('No new weekday was saved.');
          return;
        }

        let savedCount = 0;
        const failedDays = [];

        for (const day of uniqueDays) {
          await doctorService.addSchedule({
            day_of_week: day,
            start_time: form.start_time,
            end_time: form.end_time,
            slot_duration: Number(form.slot_duration),
            start_date: form.start_date,
            end_date: form.end_date,
          }).then(() => {
            savedCount += 1;
          }).catch((err) => {
            console.error(`Failed to save ${day}:`, err.response?.data || err.message);
            failedDays.push(`${day} (${err.response?.data?.message || err.message})`);
          });
        }

        if (savedCount > 0) {
          await loadSchedule();
          setForm(initialForm);
          setErrors({});
          toast.success(`✓ Availability saved for ${savedCount} day(s)`);
        }

        if (duplicateDays.length > 0) {
          toast.error(`Skipped existing weekday(s): ${duplicateDays.join(', ')}`);
        }

        if (failedDays.length > 0) {
          toast.error(`Failed to save: ${failedDays.join(', ')}`);
        }
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEditSchedule = (scheduleItem) => {
    setEditingId(scheduleItem.schedule_id);
    setForm({
      weekdays: [scheduleItem.day_of_week],
      start_time: scheduleItem.start_time,
      end_time: scheduleItem.end_time,
      slot_duration: scheduleItem.slot_duration,
      start_date: toDateInputValue(scheduleItem.start_date),
      end_date: toDateInputValue(scheduleItem.end_date),
    });
    setErrors({});
  };

  const handleDeleteSchedule = async (scheduleId) => {
    if (window.confirm('Delete this availability?')) {
      try {
        await doctorService.deleteSchedule(scheduleId);
        toast.success('✓ Availability deleted');
        if (editingId === scheduleId) {
          setEditingId(null);
          setForm(initialForm);
          setErrors({});
        }
        await loadSchedule();
      } catch (error) {
        toast.error('Failed to delete: ' + error.message);
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm(initialForm);
    setErrors({});
  };

  const toggleWeekday = (day) => {
    setForm((p) => ({
      ...p,
      weekdays: p.weekdays.includes(day)
        ? p.weekdays.filter((d) => d !== day)
        : [...p.weekdays, day],
    }));
  };

  return (
    <section className="space-y-4">
      <SectionHeader title="Schedule Management" subtitle="Add your weekly availability and slot duration for patient booking." />

      <div className="grid gap-4 lg:grid-cols-2">
        <form onSubmit={onSubmit} className="glass-card rounded-3xl p-6">
          <div className="mb-4">
            <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white">Availability Settings</h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Choose the days and times when patients can schedule appointments.</p>
          </div>

          <div className="space-y-3">
            <fieldset>
              <legend className="mb-2 flex items-center justify-between">
                <span className="block text-sm font-medium text-slate-700 dark:text-slate-300">Weekdays</span>
                {errors.weekdays && <span className="text-xs text-red-500">{errors.weekdays}</span>}
              </legend>
              <div className="flex flex-wrap gap-2">
                {days.map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleWeekday(day)}
                    className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                      form.weekdays.includes(day)
                        ? 'bg-brand-500 text-white shadow-md'
                        : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="grid grid-cols-2 gap-2">
              <label className="block text-sm">
                <div className="flex items-center justify-between">
                  <span>Available From</span>
                  {errors.time && <span className="text-xs text-red-500">{errors.time}</span>}
                </div>
                <input type="time" value={form.start_time.slice(0, 5)} onChange={(e) => setForm((p) => ({ ...p, start_time: `${e.target.value}:00` }))} className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900" required />
              </label>
              <label className="block text-sm">
                Available Until
                <input type="time" value={form.end_time.slice(0, 5)} onChange={(e) => setForm((p) => ({ ...p, end_time: `${e.target.value}:00` }))} className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900" required />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <label className="block text-sm">
                <div className="flex items-center justify-between">
                  <span>Start Date</span>
                  {errors.date && <span className="text-xs text-red-500">{errors.date}</span>}
                </div>
                <input type="date" value={form.start_date} onChange={(e) => setForm((p) => ({ ...p, start_date: e.target.value }))} className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900" required />
              </label>
              <label className="block text-sm">
                End Date
                <input type="date" value={form.end_date} onChange={(e) => setForm((p) => ({ ...p, end_date: e.target.value }))} className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900" required />
              </label>
            </div>

            <label className="block text-sm">
              <div className="flex items-center justify-between">
                <span>Appointment Duration</span>
                {errors.duration && <span className="text-xs text-red-500">{errors.duration}</span>}
              </div>
              <select value={form.slot_duration} onChange={(e) => setForm((p) => ({ ...p, slot_duration: e.target.value }))} className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900" required>
                <option value="">Select duration</option>
                {durationOptions.map((duration) => (
                  <option key={duration} value={duration}>
                    {duration} minutes
                  </option>
                ))}
              </select>
            </label>

            {errors.duplicate && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
                {errors.duplicate}
              </div>
            )}

            <div className="flex gap-2">
              <button disabled={saving} type="submit" className="primary-button flex-1">
                {saving ? 'Saving...' : editingId ? 'Update Availability' : 'Save Availability'}
              </button>
              {editingId && (
                <button type="button" onClick={handleCancelEdit} className="flex-1 rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">
                  Cancel
                </button>
              )}
            </div>
          </div>
        </form>

        <ScheduleCard schedule={schedule} onDelete={handleDeleteSchedule} onEdit={handleEditSchedule} title="Your Availability Schedule" />
      </div>
    </section>
  );
}

export default DoctorSchedulePage;
