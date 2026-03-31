import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './PatientHealthRecords.css';

function PatientHealthRecords() {
  const user = JSON.parse(localStorage.getItem('user'));
  const [records, setRecords] = useState([]);
  const [formData, setFormData] = useState({
    documentName: '',
    file: null,
    recordDate: '',
    notes: ''
  });

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      const res = await axios.get(`http://localhost:8080/api/records/user/${user.id}`);
      setRecords(res.data);
    } catch (err) {
      console.error('Error fetching records:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'file') {
      const selectedFile = files[0];
      if (selectedFile && selectedFile.size > 5 * 1024 * 1024) {
        alert('File size should be less than 5MB');
        return;
      }
      setFormData({ ...formData, file: selectedFile });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.documentName || !formData.file || !formData.recordDate) {
      alert("Please fill all required fields.");
      return;
    }

    const fileReader = new FileReader();
    fileReader.onloadend = async () => {
      const fileUrl = fileReader.result;

      const payload = {
        documentName: formData.documentName,
        fileUrl,
        recordDate: formData.recordDate,
        notes: formData.notes,
        user: { id: user.id }
      };

      try {
        await axios.post('http://localhost:8080/api/records/upload', payload);
        alert("✅ Record uploaded successfully");
        setFormData({
          documentName: '',
          file: null,
          recordDate: '',
          notes: ''
        });
        document.getElementById('file-input').value = '';
        fetchRecords();
      } catch (err) {
        console.error("Error uploading record", err);
        alert("❌ Failed to upload record");
      }
    };

    fileReader.readAsDataURL(formData.file);
  };

  return (
    <div className="health-records-container">
      <h2> Your Health Records</h2>

      <form onSubmit={handleSubmit} className="record-form">
        <input
          type="text"
          name="documentName"
          placeholder="Document Name"
          value={formData.documentName}
          onChange={handleChange}
          required
        />
        <input
          type="file"
          name="file"
          id="file-input"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleChange}
          required
        />
        <input
          type="date"
          name="recordDate"
          value={formData.recordDate}
          onChange={handleChange}
          required
        />
        <textarea
          name="notes"
          placeholder="Notes (optional)"
          value={formData.notes}
          onChange={handleChange}
        ></textarea>
        <button type="submit"> Upload Record</button>
      </form>

      <div className="records-list">
        {records.length === 0 ? (
          <p>No records found.</p>
        ) : (
          records.map((rec, index) => (
            <div key={index} className="record-card">
              <h4>{rec.documentName}</h4>
              <p><strong>Date:</strong> {rec.recordDate}</p>
              {rec.notes && <p><strong>Notes:</strong> {rec.notes}</p>}
              {rec.fileUrl?.startsWith('data:') ? (
                <a
                  href={rec.fileUrl}
                  download={`${rec.documentName}.pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  📄 View / Download
                </a>
              ) : (
                <p>No file available</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default PatientHealthRecords;
