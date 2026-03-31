import React, { useEffect, useState } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import './PatientPrescriptions.css';

function PatientPrescriptions() {
  const user = JSON.parse(localStorage.getItem('user'));
  const [prescriptions, setPrescriptions] = useState([]);

  useEffect(() => {
    const fetchPrescriptions = async () => {
      try {
        const res = await axios.get(`http://localhost:8080/api/consultations/patient/${user.id}`);
        setPrescriptions(res.data);
      } catch (err) {
        console.error('Error fetching prescriptions:', err);
      }
    };
    fetchPrescriptions();
  }, [user.id]);

  const generatePDF = (item) => {
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text(`e-Prescription`, 105, 15, null, null, 'center');

    doc.setFontSize(12);
    doc.text(`Doctor: Dr. ${item.appointment?.doctor?.user?.name}`, 14, 30);
    doc.text(`Specialization: ${item.appointment?.doctor?.specialization || 'General'}`, 14, 38);
    doc.text(`Date: ${item.appointment?.date}`, 14, 46);
    doc.text(`Time: ${item.appointment?.time}`, 14, 54);
    doc.text(`Patient: ${user.name}`, 14, 62);

    doc.text('Notes:', 14, 74);
    doc.text(doc.splitTextToSize(item.notes || '-', 180), 14, 82);

    doc.text('Prescription:', 14, 110);
    doc.text(doc.splitTextToSize(item.prescription || '-', 180), 14, 118);

    if (item.signature) {
      const imgWidth = 50;
      const imgHeight = 20;
      doc.setFontSize(11);
      doc.text(`Doctor's Signature:`, 14, 270);
      doc.addImage(item.signature, 'PNG', 60, 260, imgWidth, imgHeight);
    } else {
      doc.text(`Signature: __________________`, 140, 280);
    }

    doc.save(`prescription-${item.id}.pdf`);
  };

  return (
    <div className="prescriptions-container">
      <h2> My Prescriptions</h2>

      {prescriptions.length === 0 ? (
        <p>No prescriptions found.</p>
      ) : (
        prescriptions.map((item, index) => (
          <div key={index} className="prescription-card">
            <p><strong>Date:</strong> {item.appointment?.date}</p>
            <p><strong>Time:</strong> {item.appointment?.time}</p>
            <p><strong>Doctor:</strong> {item.appointment?.doctor?.user?.name}</p>
            <p><strong>Notes:</strong> {item.notes}</p>
            <p><strong>Prescription:</strong> {item.prescription}</p>

            {item.signature && (
              <div className="signature-section">
                <strong>Doctor's Signature:</strong><br />
                <img
                  src={item.signature}
                  alt="Doctor Signature"
                  className="signature-image"
                />
              </div>
            )}

            <div className="prescription-actions">
              <button onClick={() => generatePDF(item)}>📥 Download PDF</button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default PatientPrescriptions;
