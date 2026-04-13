import { Trash2, Edit2 } from 'lucide-react';
import { formatAppointmentTime } from '../../utils/date';
import emptyScheduleImage from '../../assets/no-schedule-illustration.svg';

const formatDateOnly = (value) => String(value || '').slice(0, 10);

function ScheduleCard({ schedule = [], onDelete, onEdit, title = 'Availability Schedule' }) {
  const isEditable = onEdit || onDelete;

  return (
    <section className="glass-card rounded-3xl p-6">
      <h2 className="mb-4 font-display text-xl font-bold text-slate-900 dark:text-white">{title}</h2>
      <div className="space-y-2">
        {schedule.length ? (
          schedule.map((item) => (
            <div
              key={item.schedule_id}
              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white/70 px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900"
            >
              <div className="flex-1">
                <span className="font-medium text-slate-700 dark:text-slate-200">{item.day_of_week}</span>
                <span className="ml-3 text-slate-500 dark:text-slate-400">
                  {formatAppointmentTime(item.start_time)} - {formatAppointmentTime(item.end_time)} ({item.slot_duration} min)
                </span>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Active: {formatDateOnly(item.start_date)} to {formatDateOnly(item.end_date)}
                </div>
              </div>
              {isEditable && (
                <div className="ml-2 flex gap-1">
                  {onEdit && (
                    <button
                      onClick={() => onEdit(item)}
                      className="rounded-lg p-1.5 text-slate-400 transition hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-slate-700"
                      title="Edit this availability"
                    >
                      <Edit2 size={16} />
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => onDelete(item.schedule_id)}
                      className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-slate-700"
                      title="Delete this availability"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="flex min-h-[260px] flex-col items-center justify-center px-4 py-8 text-center">
            <img
              src={emptyScheduleImage}
              alt="No availability schedule"
              className="w-44 max-w-full object-contain sm:w-52 md:w-56"
            />
            <p className="mt-3 text-sm font-medium text-slate-500 dark:text-slate-400">No schedule added yet.</p>
          </div>
        )}
      </div>
    </section>
  );
}

export default ScheduleCard;
