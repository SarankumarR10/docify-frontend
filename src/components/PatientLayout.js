// components/PatientLayout.js
import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import './PatientDashboard.css';
import axios from 'axios';

function PatientLayout() {
  const navigate = useNavigate();
  const [user, setUser] = useState({});

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (storedUser) {
      setUser(storedUser);
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      localStorage.removeItem('user');
      navigate('/');
    }
  };

  return (
    <div className="patient-dashboard-wrapper">
      {/* Sidebar */}
      <aside className="patient-sidebar">
        <div className="patient-sidebar-header">
          <span role="img" aria-label="hospital"></span>
          <h2>DOCIFY</h2>


        <nav className="patient-sidebar-nav">
          <button onClick={() => navigate('/patient/dashboard')}>🏠 Dashboard</button>
          <button onClick={() => navigate('/patient/appointments')}>📅 Appointments</button>
          <button onClick={() => navigate('/patient/records')}>📁 Health Records</button>
          <button onClick={() => navigate('/patient/prescriptions')}>💊 Prescriptions</button>
          <button onClick={handleLogout}>🚪 Logout</button>
        </nav>
        </div>
      </aside>

      {/* Main content */}
      <main className="patient-dashboard-main">
        <Outlet />
      </main>
    </div>
  );
}

export default PatientLayout;