// All imports must be first
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Homepage from './components/Homepage';
import Login from './components/Login';
import Register from './components/Register';

import DoctorDashboard from './components/doctor-dashboard';
import DoctorAppointments from './components/DoctorAppointments';
import DoctorPrescriptions from './components/DoctorPrescriptions';
import DoctorPatientRecords from './components/DoctorPatientRecords';
import LiveConsultation from './components/LiveConsultation';

import PatientDashboard from './components/patient-dashboard';
import PatientAppointments from './components/PatientAppointments';
import PatientPrescriptions from './components/PatientPrescriptions';
import PatientHealthRecords from './components/PatientHealthRecords';
import PatientLiveConsultation from './components/PatientLiveConsultation';

import AdminDashboard from './components/admin-dashboard';

import DoctorLayout from './components/DoctorLayout';    // 🩺 Sidebar for doctors
import PatientLayout from './components/PatientLayout';  // 🧑‍⚕️ Sidebar for patients

import { Buffer } from 'buffer';
import process from 'process';

// Fix: Assign globals *after* all imports
window.Buffer = Buffer;
window.process = process;

// 🔐 Role-based route guard
const ProtectedRoute = ({ children, allowedRole }) => {
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user) return <Navigate to="/login" replace />;
  return user.role === allowedRole ? children : <Navigate to="/" replace />;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Homepage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Doctor Routes (wrapped in layout) */}
        <Route
          path="/doctor"
          element={
            <ProtectedRoute allowedRole="doctor">
              <DoctorLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<DoctorDashboard />} />
          <Route path="appointments" element={<DoctorAppointments />} />
          <Route path="prescriptions" element={<DoctorPrescriptions />} />
          <Route path="records" element={<DoctorPatientRecords />} />
          <Route path="consultations" element={<LiveConsultation />} />
          <Route path="consultations/:consultationId" element={<LiveConsultation />} />
        </Route>

        {/* Optional: redirect legacy path */}
        <Route path="/doctor-dashboard" element={<Navigate to="/doctor/dashboard" replace />} />

        {/* Patient Routes (wrapped in layout) */}
        <Route
          path="/patient"
          element={
            <ProtectedRoute allowedRole="patient">
              <PatientLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<PatientDashboard />} />
          <Route path="appointments" element={<PatientAppointments />} />
          <Route path="prescriptions" element={<PatientPrescriptions />} />
          <Route path="records" element={<PatientHealthRecords />} />
          <Route path="consultations" element={<PatientLiveConsultation />} />
          <Route path="consultations/:consultationId" element={<PatientLiveConsultation />} />
        </Route>

        {/* Optional: redirect legacy path */}
        <Route path="/patient-dashboard" element={<Navigate to="/patient/dashboard" replace />} />

        {/* Admin Route */}
        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
