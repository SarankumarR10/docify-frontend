import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (performance.navigation.type === 1) {
      window.history.pushState(null, '', '/');
      window.history.pushState(null, '', '/login');
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data?.message || 'Invalid credentials');
      if (!data.role) throw new Error('User role not found.');

      localStorage.setItem('user', JSON.stringify(data));

      // Navigate based on lowercase role from backend
      const role = data.role.toLowerCase();
      if (role === 'doctor') {
        navigate('/doctor-dashboard');
      } else if (role === 'patient') {
        navigate('/patient-dashboard');
      } else if (role === 'admin') {
        navigate('/admin-dashboard');
      } else {
        setError('Invalid user role.');
      }
    } catch (err) {
      console.error('Login error:', err.message);
      setError(err.message || 'Login failed');
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h2>Login</h2>
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          /><br />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          /><br />
          <button type="submit">Login</button>
          {error && <p style={{ color: 'red', marginTop: '1rem' }}>{error}</p>}

          <p style={{ marginTop: '1rem' }}>
            <a href="/">← Back to Home</a>
          </p>

          <p className="register-link" style={{ marginTop: '1rem' }}>
            Don't have an account? <a href="/register">Register</a>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Login;
