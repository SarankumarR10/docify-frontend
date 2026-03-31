import React from 'react';
import { Link } from 'react-router-dom';
import './Homepage.css';

import logo from '../images/logo.png';
// import heroImg from '../images/hero.png'; // Removed as per request
import feature1 from '../images/consultation.png';
import feature2 from '../images/appointment1.jpg';
import feature3 from '../images/availability.jpg';

function Homepage() {
  return (
    <div className="homepage">
      {/* Navbar */}
      <header className="modern-navbar">
        <div className="logo-center">
          <img src={logo} alt="Docify Logo" className="logo-icon" />
          <h1 className="brand-name">Docify</h1>
        </div>
        <div className="nav-buttons">
          <Link to="/login" className="nav-btn">Login</Link>
          <Link to="/register" className="nav-btn">Register</Link>
        </div>
      </header>

      {/* Hero Section */}
    <div className="hero-features-wrapper">
      <section className="hero-modern">
        <div className="hero-left">
          <h2>Start your health journey with Docify</h2>
          <p>
            Trusted by thousands to access 24/7 health consultations, medical records, and care services—whenever you need them.
          </p>
          <Link to="/login">
            <button>Explore Features</button>
          </Link>
        </div>
        {/* Removed hero-right image section */}
      </section>

      {/* Features Section */}
      <section className="features-modern">
        <h2>
          <span className="highlight">Best Popular</span> Features <br />
          Docify Providing
        </h2>
        <div className="feature-cards">
          <div className="card">
            <img src={feature1} alt="Consultation" />
            <h4>Expert Consultation</h4>
            <p>Get expert medical advice anytime, anywhere.</p>
          </div>
          <div className="card">
            <img src={feature2} alt="Instant Appointment" />
            <h4>Instant Appointments</h4>
            <p>Find and book available doctors in seconds.</p>
          </div>
          <div className="card">
            <img src={feature3} alt="24/7 Availability" />
            <h4>24/7 Availability</h4>
            <p>Doctors are available around the clock for you.</p>
          </div>
        </div>
      </section>
     </div>

      {/* Footer */}
      <footer>
        <p>&copy; 2025 Docify. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default Homepage;
