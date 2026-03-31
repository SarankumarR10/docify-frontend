import React, { useEffect, useState } from 'react';
import './DoctorAppointments.css';

function DoctorAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [error, setError] = useState('');
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modeFilter, setModeFilter] = useState('');

  useEffect(() => {
    const fetchAppointments = async () => {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user || !user.id) {
        setError("Doctor not logged in.");
        return;
      }

      try {
        const doctorRes = await fetch(`http://localhost:8080/api/doctors/by-user/${user.id}`);
        if (!doctorRes.ok) throw new Error("Doctor profile not found.");
        const doctorData = await doctorRes.json();
        const doctorId = doctorData.id;

        const apptRes = await fetch(`http://localhost:8080/api/appointments/doctor/${doctorId}`);
        if (!apptRes.ok) throw new Error("Failed to fetch appointments");

        const appointmentsData = await apptRes.json();
        setAppointments(appointmentsData);
      } catch (err) {
        console.error("Error fetching doctor appointments:", err);
        setError("Please update your profile to view appointments.");
      }
    };

    fetchAppointments();
  }, []);

  const handleStatusChange = async (id, status) => {
    try {
      const response = await fetch(`http://localhost:8080/api/appointments/update-status/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!response.ok) throw new Error('Update failed');

      const updated = await response.json();
      setAppointments(prev =>
        prev.map(appt => appt.id === id ? { ...appt, status: updated.status } : appt)
      );
    } catch (err) {
      alert("Error updating status");
      console.error(err);
    }
  };

  const filteredAppointments = appointments.filter(a =>
    a.user?.name?.toLowerCase().includes(searchText.toLowerCase()) &&
    (!statusFilter || a.status === statusFilter) &&
    (!modeFilter || a.mode?.toLowerCase() === modeFilter.toLowerCase())
  );

  return (
    <div className="glass-wrapper">
    <div className="appointments-container">
      <h2>📅 Doctor Appointments</h2>
      {error && <p className="error-text">{error}</p>}

      {!error && (
        <>
          <div className="filters">
            <input
              type="text"
              placeholder="Search by patient name"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
            <select value={modeFilter} onChange={(e) => setModeFilter(e.target.value)}>
              <option value="">All Modes</option>
              <option value="Online">Online</option>
              <option value="Offline">Offline</option>
            </select>
          </div>

          {filteredAppointments.length === 0 ? (
            <p>No appointments match your filter.</p>
          ) : (
            <table className="appointment-table">
              <thead>
                <tr>
                  <th>Profile</th>
                  <th>Patient Name</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Mode</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredAppointments.map((appt, index) => {
                  const profileImage = appt.user?.profileImage || '/default-avatar.png';

                  return (
                    <tr key={index} className={appt.status?.toLowerCase()}>
                      <td>
                        <img
                          src={profileImage}
                          alt="Patient"
                          className="patient-profile-img"
                          style={{ width: "40px", height: "40px", borderRadius: "50%" }}
                        />
                      </td>
                      <td>{appt.user?.name || "Unknown"}</td>
                      <td>{appt.date}</td>
                      <td>{appt.time}</td>
                      <td>{appt.reason}</td>
                      <td>{appt.status}</td>
                      <td>{appt.mode || "N/A"}</td>
                      <td>
                        <select
                          value={appt.status}
                          onChange={(e) => handleStatusChange(appt.id, e.target.value)}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Approved">Approved</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>

                        {appt.status === 'Approved' && appt.mode === 'Online' && (
                          <button
                            onClick={() => window.location.href = `/doctor/consultations/${appt.id}`}
                            className="start-consultation-btn"
                          >
                            Start Consultation
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
    </div>
  );
}

export default DoctorAppointments;
