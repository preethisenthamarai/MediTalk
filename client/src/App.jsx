import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';
import Landing from './pages/Landing';
import AuthPortal from './pages/AuthPortal';
import Register from './pages/Register';
import DoctorRegister from './pages/DoctorRegister';
import Dashboard from './pages/Dashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import BookAppointment from './pages/BookAppointment';
import ConsultationRoom from './pages/ConsultationRoom';
import TranscriptPage from './pages/TranscriptPage';
import InterpreterDashboard from './pages/InterpreterDashboard';
import AdminPanel from './pages/AdminPanel';

const PORTAL_OF_ROLE = { patient: 'patient', clinician: 'doctor', interpreter: 'staff', admin: 'staff' };

// /dashboard shows the right home for each role
function Home() {
  const { user } = useAuth();
  if (user.role === 'clinician') return <DoctorDashboard />;
  if (user.role === 'interpreter') return <Navigate to="/interpreter" replace />;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  return <Dashboard />;
}

export default function App() {
  const { user, loading } = useAuth();
  const { pathname } = useLocation();

  // Keep the shared blue accent consistent across patient, clinician, and staff portals.
  useEffect(() => {
    const portal = user ? PORTAL_OF_ROLE[user.role] : pathname.startsWith('/doctor') ? 'doctor' : pathname.startsWith('/staff') ? 'staff' : 'patient';
    document.documentElement.dataset.portal = portal;
  }, [user, pathname]);

  if (loading) return null;
  const guest = (el) => (user ? <Navigate to="/dashboard" replace /> : el);

  return (
    <>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={guest(<Landing />)} />
          <Route path="/login" element={guest(<AuthPortal portal="patient" />)} />
          <Route path="/doctor/login" element={guest(<AuthPortal portal="doctor" />)} />
          <Route path="/staff/login" element={guest(<AuthPortal portal="staff" />)} />
          <Route path="/register" element={guest(<Register />)} />
          <Route path="/doctor/register" element={guest(<DoctorRegister />)} />
          <Route path="/dashboard" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/book" element={<ProtectedRoute roles={['patient']}><BookAppointment /></ProtectedRoute>} />
          <Route path="/room/:roomId" element={<ProtectedRoute><ConsultationRoom /></ProtectedRoute>} />
          <Route path="/transcript/:roomId" element={<ProtectedRoute><TranscriptPage /></ProtectedRoute>} />
          <Route path="/interpreter" element={<ProtectedRoute roles={['interpreter']}><InterpreterDashboard /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminPanel /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
}
