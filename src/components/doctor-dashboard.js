import React, { useState, useEffect } from 'react';
import './DoctorDashboard.css';
import { useNavigate } from 'react-router-dom';
import appointmentIcon from '../images/appointment1.jpg';
import prescriptionIcon from '../images/prescription.png';
import recordsIcon from '../images/records.png';

function DoctorDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const email = user?.email || user?.user?.email;

  const [form, setForm] = useState({
    specialization: '',
    experience: '',
    qualifications: '',
    location: '',
    availability: ''
  });

  const [userId, setUserId] = useState(null);
  const [doctorName, setDoctorName] = useState('Doctor');
  const [profileCreated, setProfileCreated] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [doctorData, setDoctorData] = useState(null);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    if (!user || !user.id) {
      navigate('/login');
    } else {
      setUserId(user.id);
      setDoctorName(user?.name || user?.doctor?.user?.name || 'Doctor');
      checkProfileExists(user.id);
    }
  }, []);

  const checkProfileExists = (id) => {
    fetch(`http://localhost:8080/api/doctors/user/${id}`)
      .then(res => res.ok ? res.json() : Promise.reject('Error'))
      .then(data => {
        if (data && data.id) {
          setProfileCreated(true);
          setDoctorData(data);
          setProfileImage(data.profileImage || null);
          setForm({
            specialization: data.specialization || '',
            experience: data.experience || '',
            qualifications: data.qualifications || '',
            location: data.location || '',
            availability: data.availability || ''
          });
        }
      })
      .catch(() => console.log("No profile found."));
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCreate = () => {
    if (!userId) {
      alert("User not logged in");
      return;
    }
    const doctorData = {
      ...form,
      user: { id: userId }
    };

    fetch('http://localhost:8080/api/doctors/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(doctorData)
    })
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => {
        alert("Doctor profile created successfully");
        setProfileCreated(true);
        setDoctorData(data);
      })
      .catch(err => {
        console.error(err);
        alert("Error creating doctor profile");
      });
  };

  const handleUpdate = () => {
    fetch(`http://localhost:8080/api/doctors/update/${doctorData.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, profileImage, user: { id: userId } })
    })
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(updated => {
        alert("Profile updated!");
        setDoctorData(updated);
        setEditMode(false);
        setForm({
          specialization: updated.specialization,
          experience: updated.experience,
          qualifications: updated.qualifications,
          location: updated.location,
          availability: updated.availability
        });
        setProfileImage(updated.profileImage || null);
      })
      .catch(err => {
        console.error(err);
        alert("Update failed");
      });
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete your profile?")) {
      fetch(`http://localhost:8080/api/doctors/delete/${doctorData.id}`, {
        method: 'DELETE'
      })
        .then(res => {
          if (res.ok) {
            alert("Profile deleted");
            setProfileCreated(false);
            setDoctorData(null);
            setProfileImage(null);
            setForm({
              specialization: '',
              experience: '',
              qualifications: '',
              location: '',
              availability: ''
            });
          }
        })
        .catch(() => alert("Delete failed"));
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file && doctorData?.id) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Image = reader.result;

        try {
          const res = await fetch(`http://localhost:8080/api/doctors/upload-image/${doctorData.id}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ profileImage: base64Image })
          });

          if (res.ok) {
            setProfileImage(base64Image);
            alert("Image uploaded successfully!");
          } else {
            throw new Error("Upload failed");
          }
        } catch (error) {
          alert("Failed to upload image");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = async () => {
    if (window.confirm("Remove profile picture?") && doctorData?.id) {
      try {
        const res = await fetch(`http://localhost:8080/api/doctors/remove-image/${doctorData.id}`, {
          method: 'PUT'
        });

        if (res.ok) {
          setProfileImage(null);
          alert("Profile picture removed.");
        } else {
          throw new Error("Remove failed");
        }
      } catch (error) {
        alert("Failed to remove image");
      }
    }
  };

  // ✅ Only check selected fields for completeness
  const requiredFields = ['specialization', 'experience', 'qualifications', 'location', 'availability'];
  const isProfileComplete = requiredFields.every(field => doctorData?.[field]);

  return (
    <div className="doctor-dashboard">
      <header className="header">
        <div className="doctor-info">
          {profileImage && (
            <img src={profileImage} alt="Profile" className="profile-pic" />
          )}
          <h1>Welcome, Dr. {doctorName}</h1>
        </div>
      </header>

      <div className="upload-container">
        <label className="upload-label">
          Upload Profile Picture:
          <input type="file" accept="image/*" onChange={handleImageUpload} />
        </label>
        {profileImage && (
          <button className="delete-btn" onClick={handleRemoveImage}>Remove Picture</button>
        )}
      </div>

      {!profileCreated ? (
        <section className="profile-form">
          <h2>Create Doctor Profile</h2>
          <div className="form-grid">
            <input name="specialization" placeholder="Specialization" value={form.specialization} onChange={handleChange} />
            <input name="experience" type="number" placeholder="Experience (Years)" value={form.experience} onChange={handleChange} />
            <input name="qualifications" placeholder="Qualifications" value={form.qualifications} onChange={handleChange} />
            <input name="location" placeholder="Location" value={form.location} onChange={handleChange} />
            <input name="availability" placeholder="Availability" value={form.availability} onChange={handleChange} />
          </div>
          <button className="submit-btn" onClick={handleCreate}>Create Profile</button>
        </section>
      ) : (
        !editMode ? (
          <>
            <section className="profile-summary">
              <h2>Your Profile</h2>
              <p><strong>Specialization:</strong> {doctorData.specialization}</p>
              <p><strong>Experience:</strong> {doctorData.experience} years</p>
              <p><strong>Qualifications:</strong> {doctorData.qualifications}</p>
              <p><strong>Location:</strong> {doctorData.location}</p>
              <p><strong>Availability:</strong> {doctorData.availability}</p>
              <p><strong>Profile Status:</strong> {isProfileComplete ? "✅ Complete" : "⚠️ Incomplete"}</p>
              <button className="edit-profile-btn" onClick={() => setEditMode(true)}> Edit Profile</button>
              <button className="delete-btn" onClick={handleDelete}> Delete Profile</button>
            </section>

            <section className="cards-container">
              <div className="card" onClick={() => navigate('/doctor/appointments')}>
                <img src={appointmentIcon} alt="Appointments" className="card-icon" />
                <h3>Appointments</h3>
                <p>View and manage your appointments</p>
              </div>

              <div className="card" onClick={() => navigate('/doctor/prescriptions')}>
                <img src={prescriptionIcon} alt="Prescriptions" className="card-icon" />
                <h3>Prescriptions</h3>
                <p>Write and send e-prescriptions</p>
              </div>

              <div className="card" onClick={() => navigate('/doctor/records')}>
                <img src={recordsIcon} alt="Patient Records" className="card-icon" />
                <h3>Patient Records</h3>
                <p>Access previous medical history and documents</p>
              </div>
            </section>
          </>
        ) : (
          <section className="profile-form">
            <h2>Edit Doctor Profile</h2>
            <div className="form-grid">
              <input name="specialization" placeholder="Specialization" value={form.specialization} onChange={handleChange} />
              <input name="experience" type="number" placeholder="Experience (Years)" value={form.experience} onChange={handleChange} />
              <input name="qualifications" placeholder="Qualifications" value={form.qualifications} onChange={handleChange} />
              <input name="location" placeholder="Location" value={form.location} onChange={handleChange} />
              <input name="availability" placeholder="Availability" value={form.availability} onChange={handleChange} />
            </div>
            <button className="submit-btn" onClick={handleUpdate}>Save Changes</button>
            <button className="delete-btn" onClick={() => setEditMode(false)}>Cancel</button>
          </section>
        )
      )}
    </div>
  );
}

export default DoctorDashboard;
