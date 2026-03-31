import React, { useState } from 'react';
import axios from 'axios';
import './Register.css';

function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'patient',
    registrationNumber: '',
    registrationProof: ''
  });

  const [message, setMessage] = useState(null);

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === 'registrationProof' && files.length > 0) {
      const file = files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, registrationProof: reader.result }));
      };
      reader.readAsDataURL(file);
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);

    const isDoctor = formData.role.toLowerCase() === 'doctor';

    // ✅ Validation for doctor
    if (
      isDoctor &&
      (!formData.registrationNumber.trim() && !formData.registrationProof)
    ) {
      setMessage("Please provide either NMC Registration Number or upload Doctor Proof.");
      return;
    }

    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        role: isDoctor ? 'pending_doctor' : 'patient'
      };

      const userRes = await axios.post('http://localhost:8080/api/auth/register', payload);

      if (isDoctor) {
        const doctorPayload = {
          registrationNumber: formData.registrationNumber,
          registrationProof: formData.registrationProof,
          user: userRes.data
        };

        await axios.post('http://localhost:8080/api/doctors/create', doctorPayload);
        setMessage('✅ Registration successful. Please wait for admin approval.');
      } else {
        setMessage('✅ Registration successful.');
      }

    } catch (err) {
      if (err.response && err.response.data) {
        setMessage('❌ ' + (err.response.data.message || 'Registration failed.'));
      } else {
        setMessage('❌ Registration failed: server not reachable.');
      }
    }
  };

  const isDoctor = formData.role.toLowerCase() === 'doctor';

  return (
    <div className="register-page">
      <div className="register-container">
        <h2>Register</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={formData.name}
            onChange={handleChange}
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="phone"
            placeholder="Phone Number"
            value={formData.phone}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
          />

          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            required
          >
            <option value="patient">Patient</option>
            <option value="doctor">Doctor</option>
          </select>

          {isDoctor && (
            <>
              <label style={{ marginTop: '1rem' }}>
                Provide <strong>either</strong> NMC Registration Number <strong>or</strong> upload Doctor Proof
              </label>

              <input
                type="text"
                name="registrationNumber"
                placeholder="NMC Registration Number"
                value={formData.registrationNumber}
                onChange={handleChange}
              />

              <input
                type="file"
                name="registrationProof"
                accept="image/*,application/pdf"
                onChange={handleChange}
              />
            </>
          )}

          <button type="submit">Register</button>

          <p className="login-link" style={{ marginTop: '1rem' }}>
            Already have an account? <a href="/login">Login</a>
          </p>
        </form>

        {message && (
          <div style={{ marginTop: '1rem', color: message.includes('✅') ? 'green' : 'crimson' }}>
            <p>{message}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Register;
