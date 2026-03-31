import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './AdminDashboard.css';

function AdminDashboard() {
  const [pendingDoctors, setPendingDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [processingId, setProcessingId] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const doctorsPerPage = 5;

  useEffect(() => {
    fetchPendingDoctors();
  }, []);

  useEffect(() => {
    const results = pendingDoctors.filter(doc =>
      doc.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
      doc.user?.email?.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredDoctors(results);
  }, [search, pendingDoctors]);

  const fetchPendingDoctors = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:8080/api/admin/pending-doctors');
      setPendingDoctors(res.data);
      setFilteredDoctors(res.data);
    } catch (error) {
      console.error('Error fetching pending doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  const approveDoctor = async (userId) => {
    try {
      setProcessingId(userId);
      await axios.put(`http://localhost:8080/api/admin/approve-doctor/${userId}`);
      setMessage(`✅ Doctor with User ID ${userId} approved.`);
      fetchPendingDoctors();
    } catch (error) {
      console.error('Error approving doctor:', error);
      setMessage('❌ Failed to approve doctor.');
    } finally {
      setProcessingId(null);
    }
  };

  const disapproveDoctor = async (doctorId) => {
    try {
      setProcessingId(doctorId);
      await axios.delete(`http://localhost:8080/api/admin/delete-doctor/${doctorId}`);
      setMessage(`❌ Doctor with ID ${doctorId} disapproved and removed.`);
      fetchPendingDoctors();
    } catch (error) {
      console.error('Error deleting doctor:', error);
      setMessage('❌ Failed to disapprove doctor.');
    } finally {
      setProcessingId(null);
    }
  };

  // Pagination logic
  const indexOfLastDoctor = currentPage * doctorsPerPage;
  const indexOfFirstDoctor = indexOfLastDoctor - doctorsPerPage;
  const currentDoctors = filteredDoctors.slice(indexOfFirstDoctor, indexOfLastDoctor);
  const totalPages = Math.ceil(filteredDoctors.length / doctorsPerPage);

  return (
    <div className="admin-dashboard-container">
      <h2>🛡️ Admin Dashboard - Doctor Verification</h2>

      {message && (
        <div className="status-message">
          {message}
          <button className="close-msg" onClick={() => setMessage('')}>✖</button>
        </div>
      )}

      <input
        type="text"
        placeholder="Search by name or email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="search-bar"
      />

      {loading ? (
        <p>Loading doctors...</p>
      ) : currentDoctors.length === 0 ? (
        <p>No pending doctor approvals.</p>
      ) : (
        <>
          <table className="pending-doctors-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>NMC Reg No</th>
                <th>Doctor Proof</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentDoctors.map((doc) => (
                <tr key={doc.id}>
                  <td>{doc.user?.name || '—'}</td>
                  <td>{doc.user?.email || '—'}</td>
                  <td>{doc.user?.phone || '—'}</td>
                  <td>{doc.registrationNumber || 'Not Provided'}</td>
                  <td>
                    {doc.registrationProof ? (
                      <a
                        href={doc.registrationProof}
                        target="_blank"
                        rel="noopener noreferrer"
                        download={`DoctorProof-${doc.user?.name || 'unknown'}`}
                      >
                        View/Download
                      </a>
                    ) : (
                      'Not Provided'
                    )}
                  </td>
                  <td>
                    <button
                      onClick={() => approveDoctor(doc.user.id)}
                      disabled={processingId === doc.user.id}
                    >
                      {processingId === doc.user.id ? 'Approving...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('Are you sure you want to disapprove and delete this doctor?')) {
                          disapproveDoctor(doc.id);
                        }
                      }}
                      disabled={processingId === doc.id}
                      style={{ marginLeft: '8px', backgroundColor: 'crimson', color: 'white' }}
                    >
                      {processingId === doc.id ? 'Removing...' : 'Disapprove'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="pagination">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
              <button
                key={num}
                onClick={() => setCurrentPage(num)}
                className={num === currentPage ? 'active' : ''}
              >
                {num}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default AdminDashboard;
