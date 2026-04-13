import PasswordInput from './PasswordInput';

function ChangePasswordModal({
  isOpen,
  form,
  isSubmitting,
  onChange,
  onClose,
  onSubmit,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900">
        <h4 className="font-display text-lg font-bold text-slate-900 dark:text-white">Change Password</h4>

        <form onSubmit={onSubmit} className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
              Current Password
            </label>
            <PasswordInput
              name="currentPassword"
              value={form.currentPassword}
              onChange={(value) => onChange('currentPassword', value)}
              placeholder="Current Password"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
              New Password
            </label>
            <PasswordInput
              name="newPassword"
              value={form.newPassword}
              onChange={(value) => onChange('newPassword', value)}
              placeholder="New Password"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
              Confirm New Password
            </label>
            <PasswordInput
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={(value) => onChange('confirmPassword', value)}
              placeholder="Confirm New Password"
            />
          </div>

          <div className="mt-5 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="secondary-button flex-1 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="primary-button flex-1 disabled:opacity-60"
            >
              {isSubmitting ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ChangePasswordModal;
