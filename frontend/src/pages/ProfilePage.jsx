import { Camera, Stethoscope } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import ChangePasswordModal from '../components/auth/ChangePasswordModal';
import SectionHeader from '../components/common/SectionHeader';
import DoctorLocationMap from '../components/doctors/DoctorLocationMap';

import useAuth from '../hooks/useAuth';
import doctorService from '../services/doctorService';
import authService from '../services/authService';

const toNumberOrNull = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const UPLOADS_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '');

const getProfileImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (/^https?:\/\//i.test(imagePath)) return imagePath;
  return imagePath.startsWith('/') ? `${UPLOADS_BASE_URL}${imagePath}` : `${UPLOADS_BASE_URL}/${imagePath}`;
};



const getDoctorFormState = (doctorProfile, user) => ({
  phone: user?.phone || '',
  specialization: doctorProfile?.specialization || '',
  qualification: doctorProfile?.qualification || '',
  bmdc_registration_number: doctorProfile?.bmdcRegistrationNumber || doctorProfile?.bmdc_registration_number || '',
  consultation_fee: doctorProfile?.consultation_fee || '',
  chamber_address: doctorProfile?.chamber_address || '',
  chamber_latitude: doctorProfile?.chamber_latitude || null,
  chamber_longitude: doctorProfile?.chamber_longitude || null,
});

function ProfilePage() {
  const { user, profile, fetchProfile, logout } = useAuth();
  const navigate = useNavigate();

  const doctorProfile = useMemo(() => profile?.doctorProfile || null, [profile]);
  const patientProfile = useMemo(() => profile?.patientProfile || null, [profile]);

  const [isEditingDoctor, setIsEditingDoctor] = useState(false);
  const [doctorForm, setDoctorForm] = useState({
    phone: '',
    specialization: '',
    qualification: '',
    bmdc_registration_number: '',
    consultation_fee: '',
    chamber_address: '',
    chamber_latitude: null,
    chamber_longitude: null,
  });

  const [isEditingPatient, setIsEditingPatient] = useState(false);
  const [patientForm, setPatientForm] = useState({
    name: '',
    phone: '',
    age: '',
    gender: '',
  });
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isUploadingDoctorImage, setIsUploadingDoctorImage] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const doctorInitial = (user?.name?.trim()?.charAt(0) || 'D').toUpperCase();
  const doctorImageUrl = useMemo(() => getProfileImageUrl(user?.profile_image), [user?.profile_image]);

  useEffect(() => {
    fetchProfile().catch(() => {
      // Silently handle profile fetch errors - page still shows basic details
    });
  }, []);

  useEffect(() => {
    if (doctorProfile) {
      setDoctorForm(getDoctorFormState(doctorProfile, user));
    }
  }, [doctorProfile, user]);

  useEffect(() => {
    if (user && patientProfile) {
      setPatientForm({
        name: user.name || '',
        phone: user.phone || '',
        age: patientProfile.age || '',
        gender: patientProfile.gender || '',
      });
    }
  }, [user, patientProfile]);

  const saveDoctorProfile = async (e) => {
    e.preventDefault();
    try {
      // Validate all required fields are present
      if (!doctorForm.specialization?.trim() || !doctorForm.qualification?.trim() || !doctorForm.consultation_fee?.trim() || !doctorForm.chamber_address?.trim()) {
        toast.error('All doctor profile fields are required');
        return;
      }

      await authService.updateProfile({
        phone: doctorForm.phone,
      });

      await doctorService.updateProfile({
        specialization: doctorForm.specialization.trim(),
        qualification: doctorForm.qualification.trim(),
        consultation_fee: Number(doctorForm.consultation_fee),
        chamber_address: doctorForm.chamber_address.trim(),
        chamber_latitude: doctorForm.chamber_latitude,
        chamber_longitude: doctorForm.chamber_longitude,
      });
      toast.success('Profile updated');
      setIsEditingDoctor(false);
      await fetchProfile();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const startDoctorEdit = () => {
    setDoctorForm(getDoctorFormState(doctorProfile, user));
    setIsEditingDoctor(true);
  };

  const cancelDoctorEdit = () => {
    setDoctorForm(getDoctorFormState(doctorProfile, user));
    setIsEditingDoctor(false);
  };

  const savePatientProfile = async (e) => {
    e.preventDefault();
    try {
      if (!patientForm.name.trim()) {
        toast.error('Name is required');
        return;
      }

      const payload = {
        name: patientForm.name.trim(),
        phone: patientForm.phone,
      };

      if (patientForm.age !== '') {
        payload.age = Number(patientForm.age);
      }
      if (patientForm.gender !== '') {
        payload.gender = patientForm.gender;
      }

      await authService.updateProfile(payload);
      toast.success('Profile updated successfully');
      setIsEditingPatient(false);
      await fetchProfile();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const cancelPatientEdit = () => {
    if (user && patientProfile) {
      setPatientForm({
        name: user.name || '',
        phone: user.phone || '',
        age: patientProfile.age || '',
        gender: patientProfile.gender || '',
      });
    }
    setIsEditingPatient(false);
  };

  const openDeleteModal = () => {
    setIsDeleteModalOpen(true);
  };

  const handleDoctorImageUpload = async (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload JPEG, PNG, or WEBP image');
      e.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be 5MB or smaller');
      e.target.value = '';
      return;
    }

    try {
      setIsUploadingDoctorImage(true);
      await authService.uploadProfileImage(file);
      await fetchProfile();
      toast.success('Profile image updated');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsUploadingDoctorImage(false);
      e.target.value = '';
    }
  };

  const closeDeleteModal = () => {
    if (isDeleting) return;
    setIsDeleteModalOpen(false);
  };

  const openChangePasswordModal = () => {
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setIsChangePasswordModalOpen(true);
  };

  const closeChangePasswordModal = () => {
    if (isChangingPassword) return;
    setIsChangePasswordModalOpen(false);
  };

  const handlePasswordFormChange = (field, value) => {
    setPasswordForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    const { currentPassword, newPassword, confirmPassword } = passwordForm;
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('All password fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New password and confirm password must match');
      return;
    }

    try {
      setIsChangingPassword(true);
      await authService.changePassword({ currentPassword, newPassword });
      toast.success('Password updated successfully');
      setIsChangePasswordModalOpen(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setIsDeleting(true);
      await authService.deleteAccount();
      toast.success('Account removed successfully');
      logout();
      navigate('/', { replace: true });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  return (
    <section className="space-y-4">
      {user?.role === 'doctor' ? (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 border-white/80 bg-gradient-to-br from-sky-100 via-emerald-100 to-cyan-100 text-3xl font-bold text-slate-700 shadow-lg dark:border-slate-800 dark:from-sky-900/40 dark:via-emerald-900/30 dark:to-cyan-900/40 dark:text-slate-100">
                {doctorImageUrl ? (
                  <img
                    src={doctorImageUrl}
                    alt="Doctor profile"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span>{doctorInitial}</span>
                )}
              </div>
              <label
                htmlFor="doctor-profile-image-upload"
                className="absolute -bottom-1 -right-1 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-brand-500 bg-brand-500 text-white shadow transition hover:bg-brand-600"
              >
                <Camera className="h-4.5 w-4.5" />
                <span className="sr-only">Upload profile image</span>
              </label>
            </div>

            <div>
              <h2 className="font-display text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">My Profile</h2>
              <p className="mt-1 text-base text-slate-600 dark:text-slate-300">
                Keep your account and professional details up to date.
              </p>
            </div>
          </div>

          <div className="pl-1">
            <input
              id="doctor-profile-image-upload"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleDoctorImageUpload}
              disabled={isUploadingDoctorImage}
            />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isUploadingDoctorImage ? 'Uploading...' : 'Tap camera to upload'}
            </p>
          </div>
        </div>
      ) : (
        <SectionHeader title="My Profile" subtitle="Keep your account and professional details up to date." />
      )}

      {user?.role === 'doctor' ? (
        <>
        <div className="glass-card rounded-3xl p-6">
          <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white">Basic Details</h3>
          <div className="mt-4 grid gap-2 text-sm text-slate-600 dark:text-slate-300 md:grid-cols-2">
            <p><strong>Name:</strong> {user?.name}</p>
            <p><strong>Email:</strong> {user?.email}</p>
            <p><strong>Phone:</strong> {user?.phone || 'N/A'}</p>
            <p><strong>Role:</strong> {user?.role}</p>
            <p><strong>Doctor ID:</strong> {doctorProfile?.doctor_code || doctorProfile?.doctorCode || 'N/A'}</p>
          </div>
        </div>
        <form onSubmit={saveDoctorProfile} className="glass-card rounded-3xl p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white">Doctor Details</h3>
            <div className="flex items-center gap-2">
              {!isEditingDoctor && (
                <button
                  type="button"
                  onClick={startDoctorEdit}
                  className="secondary-button text-sm"
                >
                  Edit Profile
                </button>
              )}
              <button
                type="button"
                onClick={openDeleteModal}
                className="rounded-2xl border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 dark:border-rose-800/60 dark:bg-rose-950/40 dark:text-rose-300"
              >
                Delete Account
              </button>
            </div>
          </div>

          {isEditingDoctor ? (
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                  Phone
                </label>
                <input
                  type="text"
                  value={doctorForm.phone}
                  onChange={(e) => setDoctorForm((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="Phone Number"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                  Specialization
                </label>
                <input
                  type="text"
                  value={doctorForm.specialization}
                  onChange={(e) => setDoctorForm((p) => ({ ...p, specialization: e.target.value }))}
                  placeholder="Specialization"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                  Qualification
                </label>
                <input
                  type="text"
                  value={doctorForm.qualification}
                  onChange={(e) => setDoctorForm((p) => ({ ...p, qualification: e.target.value }))}
                  placeholder="Qualification"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                  required
                />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                    Consultation Fee
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={doctorForm.consultation_fee}
                    onChange={(e) => setDoctorForm((p) => ({ ...p, consultation_fee: e.target.value }))}
                    placeholder="Consultation Fee"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                    BMDC Registration (Read-only)
                  </label>
                  <input
                    type="text"
                    value={doctorForm.bmdc_registration_number}
                    disabled
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                  Chamber Address
                </label>
                <textarea
                  value={doctorForm.chamber_address}
                  onChange={(e) => setDoctorForm((p) => ({ ...p, chamber_address: e.target.value }))}
                  placeholder="Chamber Address"
                  rows={3}
                  className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button type="submit" className="primary-button flex-1">
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={cancelDoctorEdit}
                  className="secondary-button flex-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-3">
              <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                <p><strong>Phone:</strong> {doctorForm.phone || 'N/A'}</p>
                <p><strong>Specialization:</strong> {doctorForm.specialization || 'N/A'}</p>
                <p><strong>Qualification:</strong> {doctorForm.qualification || 'N/A'}</p>
                <p><strong>Consultation Fee:</strong> {doctorForm.consultation_fee || 'N/A'}</p>
                <p><strong>BMDC Registration Number:</strong> {doctorForm.bmdc_registration_number || 'N/A'}</p>
                <p><strong>Chamber Address:</strong> {doctorForm.chamber_address || 'N/A'}</p>
              </div>
              <DoctorLocationMap address={doctorForm.chamber_address} />
            </div>
          )}

        </form>

        <div className="relative">
          <div className="glass-card rounded-3xl p-6 lg:pr-32">
            <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">Security</h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Update your account password.
            </p>
            <button
              type="button"
              onClick={openChangePasswordModal}
              className="secondary-button mt-4 text-sm"
            >
              Change Password
            </button>
          </div>

          <div className="pointer-events-none absolute inset-y-0 right-8 hidden lg:flex lg:items-center">
            <Stethoscope className="h-24 w-24 animate-pulse text-brand-600/80 dark:text-brand-300/80" />
          </div>
        </div>
        </>
      ) : (
        <>
        <div className="glass-card rounded-3xl p-6">
          <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white">Basic Details</h3>
          <div className="mt-4 grid gap-2 text-sm text-slate-600 dark:text-slate-300 md:grid-cols-2">
            <p><strong>Name:</strong> {user?.name}</p>
            <p><strong>Email:</strong> {user?.email}</p>
            <p><strong>Phone:</strong> {user?.phone || 'N/A'}</p>
            <p><strong>Role:</strong> {user?.role}</p>
            <p><strong>Patient ID:</strong> {patientProfile?.patient_code || patientProfile?.patientCode || 'N/A'}</p>
          </div>
        </div>
        <form onSubmit={savePatientProfile} className="glass-card rounded-3xl p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white">Patient Details</h3>
            <div className="flex items-center gap-2">
              {!isEditingPatient && (
                <button
                  type="button"
                  onClick={() => setIsEditingPatient(true)}
                  className="secondary-button text-sm"
                >
                  Edit Profile
                </button>
              )}
              <button
                type="button"
                onClick={openDeleteModal}
                className="rounded-2xl border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 dark:border-rose-800/60 dark:bg-rose-950/40 dark:text-rose-300"
              >
                Delete Account
              </button>
            </div>
          </div>

          {isEditingPatient ? (
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                  Name
                </label>
                <input
                  type="text"
                  value={patientForm.name}
                  onChange={(e) => setPatientForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Full Name"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                  Phone
                </label>
                <input
                  type="text"
                  value={patientForm.phone}
                  onChange={(e) => setPatientForm((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="Phone Number"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                    Age
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={patientForm.age}
                    onChange={(e) => setPatientForm((p) => ({ ...p, age: e.target.value }))}
                    placeholder="Age"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                    Gender
                  </label>
                  <select
                    value={patientForm.gender}
                    onChange={(e) => setPatientForm((p) => ({ ...p, gender: e.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                  Email (Read-only)
                </label>
                <input
                  type="email"
                  value={user?.email}
                  disabled
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                  Role (Read-only)
                </label>
                <input
                  type="text"
                  value={user?.role}
                  disabled
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm capitalize text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="primary-button flex-1">
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={cancelPatientEdit}
                  className="secondary-button flex-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
              <p><strong>Name:</strong> {user?.name || 'N/A'}</p>
              <p><strong>Phone:</strong> {user?.phone || 'N/A'}</p>
              <p><strong>Age:</strong> {patientProfile?.age || 'N/A'}</p>
              <p><strong>Gender:</strong> {patientProfile?.gender || 'N/A'}</p>
              <p><strong>Email:</strong> {user?.email}</p>
              <p><strong>Role:</strong> <span className="capitalize">{user?.role}</span></p>
            </div>
          )}
        </form>

        <div className="relative">
          <div className="glass-card rounded-3xl p-6 lg:pr-32">
            <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">Security</h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Update your account password.
            </p>
            <button
              type="button"
              onClick={openChangePasswordModal}
              className="secondary-button mt-4 text-sm"
            >
              Change Password
            </button>
          </div>

          <div className="pointer-events-none absolute inset-y-0 right-8 hidden lg:flex lg:items-center">
            <Stethoscope className="h-24 w-24 animate-pulse text-brand-600/80 dark:text-brand-300/80" />
          </div>
        </div>
        </>
      )}

      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900">
            <h4 className="font-display text-lg font-bold text-slate-900 dark:text-white">Delete Account</h4>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
              Are you sure you want to permanently remove this {user?.role} account? This action cannot be undone.
            </p>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={isDeleting}
                className="secondary-button flex-1 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="flex-1 rounded-2xl border border-rose-600 bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ChangePasswordModal
        isOpen={isChangePasswordModalOpen}
        form={passwordForm}
        isSubmitting={isChangingPassword}
        onChange={handlePasswordFormChange}
        onClose={closeChangePasswordModal}
        onSubmit={handleChangePassword}
      />
    </section>
  );
}

export default ProfilePage;
