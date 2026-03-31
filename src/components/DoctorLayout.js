// DoctorLayout.js
import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import './DoctorDashboard.css';

function DoctorLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user'));
  const doctorName = user?.name || user?.doctor?.user?.name || 'Doctor';

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      localStorage.removeItem('user');
      navigate('/');
    }
  };

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <h2 className="logo">DOCIFY</h2>
        <nav>
          <a className={location.pathname === '/doctor/dashboard' ? 'active' : ''} onClick={() => navigate('/doctor/dashboard')}>🏠 Dashboard</a>
          <a className={location.pathname.includes('/doctor/appointments') ? 'active' : ''} onClick={() => navigate('/doctor/appointments')}>📅 Appointments</a>
          <a className={location.pathname.includes('/doctor/prescriptions') ? 'active' : ''} onClick={() => navigate('/doctor/prescriptions')}>📝 Prescriptions</a>
          <a className={location.pathname.includes('/doctor/records') ? 'active' : ''} onClick={() => navigate('/doctor/records')}>📁 Records</a>
          <a onClick={handleLogout}>🚪 Logout</a>
        </nav>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

export default DoctorLayout;
