import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './DoctorPatientRecords.css';

function DoctorPatientRecords() {
  const user = JSON.parse(localStorage.getItem('user'));
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [records, setRecords] = useState([]);
  const [doctorId, setDoctorId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDoctorAndPatients = async () => {
      if (!user || !user.id) {
        setError("Doctor not logged in.");
        return;
      }

      try {
        // Get doctor profile using user ID
        const doctorRes = await axios.get(`http://localhost:8080/api/doctors/user/${user.id}`);
        const doctor = doctorRes.data;
        setDoctorId(doctor.id);

        // Fetch appointments using correct doctorId
        const apptRes = await axios.get(`http://localhost:8080/api/appointments/doctor/${doctor.id}`);
        const approvedAppointments = apptRes.data.filter(
          (appt) => appt.status === 'Approved' || appt.status === 'Completed'
        );

        // Deduplicate patients
        const uniquePatients = Array.from(
          new Map(
            approvedAppointments.map((appt) => [appt.user.id, appt.user])
          ).values()
        );
        setPatients(uniquePatients);
      } catch (err) {
        console.error("Failed to fetch doctor/patient data", err);
        setError("Could not load patients.");
      }
    };

    fetchDoctorAndPatients();
  }, [user]);

  const handleSearch = (e) => {
    const value = e.target.value.toLowerCase();
    setSearch(value);
    if (!value.trim()) {
      setFilteredPatients([]);
      return;
    }
    const matches = patients.filter((p) =>
      p.name?.toLowerCase().includes(value)
    );
    setFilteredPatients(matches);
  };

  const handlePatientSelect = async (patient) => {
    setSelectedPatient(patient);
    setSearch(patient.name);
    setFilteredPatients([]);

    try {
      const res = await axios.get(`http://localhost:8080/api/records/user/${patient.id}`);
      setRecords(res.data);
    } catch (err) {
      console.error("Failed to fetch records", err);
      setRecords([]);
    }
  };

  const handleView = (fileUrl) => {
    const newWindow = window.open();
    if (newWindow) {
      newWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head><title>Document View</title></head>
          <body style="margin:0">
            <iframe src="${fileUrl}" frameborder="0" style="width:100vw;height:100vh;"></iframe>
          </body>
        </html>
      `);
    }
  };

  return (
    <div className="records-container">
      <h2>📁 Patient Health Records</h2>
      {error && <p className="error-text">{error}</p>}

      <div className="search-bar">
        <input
          type="text"
          placeholder="Search patient by name..."
          value={search}
          onChange={handleSearch}
        />
        {filteredPatients.length > 0 && (
          <div className="dropdown">
            {filteredPatients.map((patient) => (
              <div
                key={patient.id}
                className="dropdown-item"
                onClick={() => handlePatientSelect(patient)}
              >
                {patient.name} ({patient.email})
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedPatient && (
        <div className="selected-patient-info">
          <h3>👤 {selectedPatient.name}</h3>
          <p>Email: {selectedPatient.email}</p>
          <p>Phone: {selectedPatient.phone}</p>
        </div>
      )}

      <div className="records-list">
        {records.length === 0 ? (
          selectedPatient && <p>No records found for this patient.</p>
        ) : (
          <ul>
            {records.map((rec) => (
              <li key={rec.id} className="record-card">
                <strong>{rec.documentName}</strong><br />
                <span>Date: {rec.recordDate}</span><br />
                {rec.notes && <span>Notes: {rec.notes}</span>}<br />
                <button
                  className="download-link"
                  onClick={() => handleView(rec.fileUrl)}
                >
                  📄 View
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default DoctorPatientRecords;
