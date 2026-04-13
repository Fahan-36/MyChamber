import { AnimatePresence, motion } from 'framer-motion';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import PublicLayout from '../components/layout/PublicLayout';
import useAuth from '../hooks/useAuth';
import DoctorAppointmentsPage from '../pages/DoctorAppointmentsPage';
import DoctorDashboardPage from '../pages/DoctorDashboardPage';
import DoctorDetailsPage from '../pages/DoctorDetailsPage';
import DoctorPatientHistoryPage from '../pages/DoctorPatientHistoryPage';
import DoctorSchedulePage from '../pages/DoctorSchedulePage';
import DoctorsPage from '../pages/DoctorsPage';
import AdminAppointments from '../pages/admin/AdminAppointments';
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminDoctors from '../pages/admin/AdminDoctors';
import AdminPatients from '../pages/admin/AdminPatients';
import AdminReviews from '../pages/admin/AdminReviews';
import LandingPage from '../pages/LandingPage';
import LoginPage from '../pages/LoginPage';
import NotFoundPage from '../pages/NotFoundPage';
import PatientAppointmentsPage from '../pages/PatientAppointmentsPage';
import PatientUpcomingAppointmentsPage from '../pages/PatientUpcomingAppointmentsPage';
import PatientDashboardPage from '../pages/PatientDashboardPage';
import PatientHistoryPage from '../pages/PatientHistoryPage';
import ProfilePage from '../pages/ProfilePage';
import RegisterPage from '../pages/RegisterPage';
import AdminRoute from './AdminRoute';
import ProtectedRoute from './ProtectedRoute';
import RoleBasedRoute from './RoleBasedRoute';

function AnimatedPage({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.25 }}
    >
      {children}
    </motion.div>
  );
}

function AuthRedirect() {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role === 'admin') return <Navigate to="/admin" replace />;
  return <Navigate to={user?.role === 'doctor' ? '/doctor' : '/patient'} replace />;
}

function AppRouter() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<AnimatedPage><LandingPage /></AnimatedPage>} />
          <Route path="/login" element={<AnimatedPage><LoginPage /></AnimatedPage>} />
          <Route path="/register" element={<AnimatedPage><RegisterPage /></AnimatedPage>} />
          <Route path="/doctors" element={<AnimatedPage><DoctorsPage /></AnimatedPage>} />
          <Route path="/doctors/:id" element={<AnimatedPage><DoctorDetailsPage /></AnimatedPage>} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/profile" element={<AnimatedPage><ProfilePage /></AnimatedPage>} />

            <Route element={<RoleBasedRoute allowedRoles={['patient']} />}>
              <Route path="/patient" element={<AnimatedPage><PatientDashboardPage /></AnimatedPage>} />
              <Route path="/patient/appointments/upcoming" element={<AnimatedPage><PatientUpcomingAppointmentsPage /></AnimatedPage>} />
              <Route path="/patient/appointments" element={<AnimatedPage><PatientAppointmentsPage /></AnimatedPage>} />
              <Route path="/patient/history" element={<AnimatedPage><PatientHistoryPage /></AnimatedPage>} />
            </Route>

            <Route element={<RoleBasedRoute allowedRoles={['doctor']} />}>
              <Route path="/doctor" element={<AnimatedPage><DoctorDashboardPage /></AnimatedPage>} />
              <Route path="/doctor/schedule" element={<AnimatedPage><DoctorSchedulePage /></AnimatedPage>} />
              <Route path="/doctor/appointments" element={<AnimatedPage><DoctorAppointmentsPage /></AnimatedPage>} />
              <Route path="/doctor/patient-history" element={<AnimatedPage><DoctorPatientHistoryPage /></AnimatedPage>} />
            </Route>

            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<AnimatedPage><AdminDashboard /></AnimatedPage>} />
              <Route path="/admin/doctors" element={<AnimatedPage><AdminDoctors /></AnimatedPage>} />
              <Route path="/admin/patients" element={<AnimatedPage><AdminPatients /></AnimatedPage>} />
              <Route path="/admin/appointments" element={<AnimatedPage><AdminAppointments /></AnimatedPage>} />
              <Route path="/admin/reviews" element={<AnimatedPage><AdminReviews /></AnimatedPage>} />
            </Route>
          </Route>
        </Route>

        <Route path="/dashboard" element={<AuthRedirect />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AnimatePresence>
  );
}

export default AppRouter;
