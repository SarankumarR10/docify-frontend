import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './PatientAppointments.css';

function PatientAppointments() {
  const user = JSON.parse(localStorage.getItem('user'));
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [search, setSearch] = useState('');
  const [appointments, setAppointments] = useState([]);

  const [formData, setFormData] = useState({
    doctorId: '',
    date: '',
    time: '',
    reason: '',
    mode: 'Online' // Default to Online
  });

  useEffect(() => {
    fetchDoctors();
    fetchAppointments();
  }, []);

  const fetchDoctors = async () => {
    try {
      const res = await axios.get('http://localhost:8080/api/doctors');
      setDoctors(res.data);
    } catch (err) {
      console.error('Error fetching doctors', err);
    }
  };

  const fetchAppointments = async () => {
    try {
      const res = await axios.get(`http://localhost:8080/api/appointments/user/${user.id}`);
      setAppointments(res.data);
    } catch (err) {
      console.error('Error fetching appointments', err);
    }
  };

  const handleSearch = (e) => {
    const value = e.target.value.toLowerCase();
    setSearch(value);

    if (value.trim() === '') {
      setFilteredDoctors([]);
      return;
    }

    const filtered = doctors.filter(doc =>
      doc.user?.name?.toLowerCase().includes(value) ||
      doc.specialization?.toLowerCase().includes(value) ||
      doc.location?.toLowerCase().includes(value)
    );
    setFilteredDoctors(filtered);
  };

  const handleDoctorSelect = (doctorId) => {
    setFormData(prev => ({ ...prev, doctorId }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.doctorId) {
      alert('Please select a doctor before booking.');
      return;
    }

    try {
      await axios.post('http://localhost:8080/api/appointments/create', {
        date: formData.date,
        time: formData.time,
        reason: formData.reason,
        mode: formData.mode,
        status: 'Pending',
        user: { id: user.id },
        doctor: { id: formData.doctorId }
      });

      alert('Appointment booked successfully');
      setFormData({ doctorId: '', date: '', time: '', reason: '', mode: 'Online' });
      setSearch('');
      setFilteredDoctors([]);
      fetchAppointments();
    } catch (err) {
      console.error('Booking error', err);
      alert('Failed to book appointment');
    }
  };

  const joinConsultation = (appointmentId) => {
    window.location.href = `/patient/consultations/${appointmentId}`;
  };

  return (
    <div className="appointment-container">
      <h2> Book Appointment</h2>

      <input
        type="text"
        value={search}
        onChange={handleSearch}
        placeholder="Search by name, specialization or location..."
        className="doctor-search"
      />

      {search.length > 0 && (
        <div className="doctor-dropdown">
          {filteredDoctors.length > 0 ? (
            filteredDoctors.map(doc => {
              const profileImage = doc.profileImage || '/default-avatar.png';

              return (
                <div
                  key={doc.id}
                  className={`doctor-item ${formData.doctorId === doc.id ? 'selected' : ''}`}
                  onClick={() => handleDoctorSelect(doc.id)}
                >
                  <img
                    src={profileImage}
                    alt="Doctor"
                    className="doctor-avatar"
                  />
                  <div className="doctor-info">
                    <div className="doctor-name">Dr. {doc.user.name}</div>
                    <div className="doctor-specialization">{doc.specialization}</div>
                    <div className="doctor-location">{doc.location}</div>
                  </div>
                </div>
              );
            })
          ) : (
            <p>No matching doctors found.</p>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="appointment-form">
        <input
          type="date"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          required
        />
        <input
          type="time"
          value={formData.time}
          onChange={(e) => setFormData({ ...formData, time: e.target.value })}
          required
        />
        <textarea
          placeholder="Reason for appointment"
          value={formData.reason}
          onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
          required
        />
        <select
          value={formData.mode}
          onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
          required
        >
          <option value="Online">Online</option>
          <option value="Offline">Offline</option>
        </select>
        <button type="submit">Book Appointment</button>
      </form>

      <h2> Your Appointments</h2>
      <div className="appointments-list">
        {appointments.map((appt) => (
          <div key={appt.id} className="appointment-card">
            <p><strong>Doctor:</strong> Dr. {appt.doctor?.user?.name}</p>
            <p><strong>Date:</strong> {appt.date}</p>
            <p><strong>Time:</strong> {appt.time}</p>
            <p><strong>Status:</strong> {appt.status}</p>
            <p><strong>Reason:</strong> {appt.reason}</p>
            <p><strong>Mode:</strong> {appt.mode || 'Online'}</p>

            {appt.status === 'Approved' && appt.mode === 'Online' && (
              <button
                className="join-consultation-btn"
                onClick={() => joinConsultation(appt.id)}
              >
                Join Consultation
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default PatientAppointments;
