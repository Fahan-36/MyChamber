import { Bell, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import notificationService from '../../services/notificationService';
import { formatRelativeTime } from '../../utils/date';

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const containerRef = useRef(null);

  const loadUnreadCount = async () => {
    try {
      const res = await notificationService.getUnreadCount();
      setUnreadCount(res?.data?.unreadCount || 0);
    } catch {
      setUnreadCount(0);
    }
  };

  const loadNotifications = async () => {
    try {
      const res = await notificationService.getAll(25);
      setItems(res.data || []);
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    loadUnreadCount();
    const timer = setInterval(loadUnreadCount, 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (open) {
      loadNotifications();
      loadUnreadCount();
    }
  }, [open]);

  useEffect(() => {
    const onClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', onClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', onClickOutside);
    };
  }, [open]);

  const handleMarkOneAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, is_read: 1 } : item)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setItems((prev) => prev.map((item) => ({ ...item, is_read: 1 })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id, isRead) => {
    try {
      await notificationService.delete(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
      if (!isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
      toast.success('Notification deleted');
    } catch (error) {
      toast.error(error.message || 'Failed to delete notification');
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="relative rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 transition hover:border-brand-200 hover:text-brand-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 min-w-[18px] rounded-full bg-rose-500 px-1.5 text-center text-[10px] font-semibold leading-[18px] text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-[20rem] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Notifications</p>
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-300"
            >
              Mark all read
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-5 text-sm text-slate-500 dark:text-slate-400">No notifications yet.</p>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className={`group flex items-start gap-2 border-b border-slate-100 px-4 py-3 transition last:border-b-0 dark:border-slate-800 ${
                    item.is_read ? 'bg-transparent' : 'bg-brand-50/60 dark:bg-brand-500/10'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      if (!item.is_read) {
                        handleMarkOneAsRead(item.id);
                      }
                    }}
                    className="flex-1 text-left"
                  >
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.title}</p>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{item.message}</p>
                    <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">{formatRelativeTime(item.created_at)}</p>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(item.id, item.is_read);
                    }}
                    className="mt-0.5 rounded-lg p-1.5 text-slate-400 opacity-0 transition hover:bg-slate-100 hover:text-rose-600 group-hover:opacity-100 dark:hover:bg-slate-800 dark:hover:text-rose-400"
                    aria-label="Delete notification"
                    title="Delete notification"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
