export const formatDate = (dateInput) => {
  if (!dateInput) return 'N/A';
  const date = new Date(dateInput);
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

export const formatAppointmentDate = (dateInput) => {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
};

export const formatAppointmentTime = (timeString) => {
  if (!timeString) return '';
  // timeString is in format HH:MM:SS
  const [hours, minutes] = timeString.split(':').map(Number);
  const displayHours = hours % 12 || 12;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
};

export const formatDateTime = (dateTimeInput) => {
  if (!dateTimeInput) return 'N/A';

  if (dateTimeInput instanceof Date) {
    const year = dateTimeInput.getFullYear();
    const month = String(dateTimeInput.getMonth() + 1).padStart(2, '0');
    const day = String(dateTimeInput.getDate()).padStart(2, '0');
    const hours = dateTimeInput.getHours();
    const minutes = String(dateTimeInput.getMinutes()).padStart(2, '0');
    const displayHours = hours % 12 || 12;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    return `${year}-${month}-${day} ${displayHours}:${minutes} ${ampm}`;
  }

  const raw = String(dateTimeInput).trim();
  const [datePart, timePart = '00:00:00'] = raw.split(/[T ]/);
  const [year, month, day] = datePart.split('-').map(Number);
  const [hours, minutes, seconds = 0] = timePart.split(':').map(Number);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    !Number.isInteger(seconds)
  ) {
    return raw;
  }

  const date = new Date(year, month - 1, day, hours, minutes, seconds, 0);

  const displayHours = date.getHours() % 12 || 12;
  const ampm = date.getHours() >= 12 ? 'PM' : 'AM';
  const dayLabel = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);

  return `${dayLabel} ${displayHours}:${String(date.getMinutes()).padStart(2, '0')} ${ampm}`;
};

export const formatRelativeTime = (dateInput) => {
  if (!dateInput) return '';
  
  const date = new Date(dateInput);
  const now = new Date();
  const diffMs = now - date;
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  // Just now (less than 1 minute)
  if (diffSeconds < 60) {
    return 'Just now';
  }

  // Minutes ago
  if (diffMinutes < 60) {
    return `${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'} ago`;
  }

  // Hours ago
  if (diffHours < 24) {
    return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  }

  // Yesterday
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
  ) {
    return 'Yesterday';
  }

  // Within this week (2-6 days ago) - show day name
  if (diffDays < 7) {
    return new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date);
  }

  // Older - show abbreviated date
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(date);
};

export const todayISO = () => new Date().toISOString().slice(0, 10);

export const toDbTime = (label) => {
  if (!label) return '';
  const [time, ampm] = label.split(' ');
  let [hours, minutes] = time.split(':').map(Number);

  if (ampm?.toUpperCase() === 'PM' && hours < 12) hours += 12;
  if (ampm?.toUpperCase() === 'AM' && hours === 12) hours = 0;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
};

export const statusColor = (status) => {
  const map = {
    pending: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
    confirmed: 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300',
    completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
    cancelled: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300',
  };

  return map[status] || 'bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300';
};

export const isUpcomingAppointmentByStatus = (appointment) => {
  const status = String(appointment?.status || '').trim().toLowerCase();
  return status === 'pending' || status === 'confirmed';
};

export const canPatientCancelAppointment = (appointment) => {
  if (!appointment) {
    return false;
  }

  const status = String(appointment.status || '').trim().toLowerCase();
  
  // Cannot cancel completed or cancelled appointments
  if (status === 'completed' || status === 'cancelled') {
    return false;
  }

  // Only pending and confirmed can be cancelled (backend validates time rules)
  return status === 'pending' || status === 'confirmed';
};

export const getCancellationBlockReason = (appointment) => {
  // Backend validates all business rules - just return empty
  return '';
};
