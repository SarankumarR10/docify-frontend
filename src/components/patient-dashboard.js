import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './PatientDashboard.css';

import appointmentImg from '../images/appointment1.jpg';
import recordsImg from '../images/records.png';
import prescriptionImg from '../images/prescription.png';

function PatientDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState({});
  const [profileImage, setProfileImage] = useState('');

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (storedUser) {
      setUser(storedUser);
      fetchProfileImage(storedUser.id);
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const fetchProfileImage = async (userId) => {
    try {
      const res = await axios.get(`http://localhost:8080/api/users/${userId}`);
      if (res.data?.profileImage) {
        setProfileImage(res.data.profileImage);
      }
    } catch (err) {
      console.error("Error fetching profile image", err);
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file || !user.id) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Image = reader.result;
      try {
        await axios.post(`http://localhost:8080/api/users/upload-image/${user.id}`, {
          profileImage: base64Image
        });
        setProfileImage(base64Image);
        alert("Profile image uploaded successfully");
      } catch (error) {
        console.error("Upload failed", error);
        alert("Failed to upload profile image");
      }
    };
    reader.readAsDataURL(file);
  };

  const removeProfileImage = async () => {
    if (!user.id) return;
    if (window.confirm("Are you sure you want to remove your profile picture?")) {
      try {
        await axios.put(`http://localhost:8080/api/users/remove-image/${user.id}`);
        setProfileImage('');
        alert("Profile image removed");
      } catch (error) {
        console.error("Remove failed", error);
        alert("Failed to remove profile image");
      }
    }
  };

  return (
    <div className="patient-dashboard-container">
      <div className="patient-dashboard-header">
        <div className="profile-box">
          <img
            src={profileImage || '/default-avatar.png'}
            alt="Profile"
            className="profile-img"
          />
          <div className="profile-info">
            <h2>{user.name}</h2>
            <p>{user.email}</p>
            <div className="image-actions">
              <input
                type="file"
                accept="image/*"
                id="upload-profile"
                style={{ display: 'none' }}
                onChange={handleImageChange}
              />
              <label htmlFor="upload-profile" className="upload-button">Upload Photo</label>
              {profileImage && (
                <button onClick={removeProfileImage} className="remove-button">
                  Remove Photo
                </button>
              )}
            </div>
          </div>
        </div>
        <p className="welcome-msg">👋 Hello, {user.name}. Manage your appointments, prescriptions, and health records here.</p>
      </div>

      <div className="dashboard-cards">
        <div className="dashboard-card" onClick={() => navigate('/patient/appointments')}>
          <img src={appointmentImg} alt="Appointments" />
          <h3>Appointments</h3>
          <p>View and manage your bookings</p>
        </div>

        <div className="dashboard-card" onClick={() => navigate('/patient/records')}>
          <img src={recordsImg} alt="Health Records" />
          <h3>Health Records</h3>
          <p>Access and upload your medical documents</p>
        </div>

        <div className="dashboard-card" onClick={() => navigate('/patient/prescriptions')}>
          <img src={prescriptionImg} alt="Prescriptions" />
          <h3>Prescriptions</h3>
          <p>View prescriptions from your doctors</p>
        </div>
      </div>
    </div>
  );
}

export default PatientDashboard;
