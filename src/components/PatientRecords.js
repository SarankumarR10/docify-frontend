import React, { useEffect, useState } from 'react';
import './PatientRecords.css';

function PatientRecords() {
  const [records, setRecords] = useState([]);
  const [documentName, setDocumentName] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const userId = JSON.parse(localStorage.getItem('user'))?.id;

  useEffect(() => {
    fetch(`http://localhost:8080/api/health-records/user/${userId}`)
      .then(res => res.json())
      .then(setRecords);
  }, [userId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const record = { user: { id: userId }, documentName, fileUrl };

    fetch('http://localhost:8080/api/health-records/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record),
    })
      .then(res => res.json())
      .then(newRecord => {
        setRecords(prev => [...prev, newRecord]);
        setDocumentName('');
        setFileUrl('');
      });
  };

  return (
    <div className="records-container">
      <h2>📁 Patient Records</h2>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Document Name"
          value={documentName}
          onChange={(e) => setDocumentName(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="File URL"
          value={fileUrl}
          onChange={(e) => setFileUrl(e.target.value)}
          required
        />
        <button type="submit">Add Record</button>
      </form>

      <ul className="record-list">
        {records.map((record) => (
          <li key={record.id}>
            <strong>{record.documentName}</strong> - <a href={record.fileUrl} target="_blank" rel="noreferrer">View File</a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default PatientRecords;
