import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { membersAPI, feesAPI, attendanceAPI } from '../services/api';
import { toast } from 'react-toastify';

const MemberDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [member, setMember] = useState(null);
  const [payments, setPayments] = useState([]);
  const [attendance, setAttendance] = useState([]);

  useEffect(() => {
    fetchMemberDetails();
  }, [id]);

  const fetchMemberDetails = async () => {
    try {
      // First fetch member data
      const memberRes = await membersAPI.getById(id);

      if (memberRes.data.success) {
        const memberData = memberRes.data.member;
        setMember(memberData);

        // Then fetch payments and attendance using the memberId
        const [paymentsRes, attendanceRes] = await Promise.all([
          feesAPI.getMemberPayments(memberData.memberId),
          attendanceAPI.getMemberHistory(memberData.memberId)
        ]);

        if (paymentsRes.data.success) setPayments(paymentsRes.data.payments);
        if (attendanceRes.data.success) setAttendance(attendanceRes.data.attendance);
      }
    } catch (error) {
      console.error('Error fetching member details:', error);
      toast.error('Error fetching member details');
    }
  };

  if (!member) return <div className="page-container">Loading...</div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">{member.name}</h1>
        <button className="btn btn-secondary" onClick={() => navigate('/members')}>
          Back
        </button>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h3>Member Information</h3>
          <div style={{ marginTop: '1rem', lineHeight: '2' }}>
            <p><strong>Member ID:</strong> {member.memberId}</p>
            <p><strong>Email:</strong> {member.email || 'N/A'}</p>
            <p><strong>Phone:</strong> {member.phone}</p>
            <p><strong>Gender:</strong> {member.gender}</p>
            <p><strong>Membership Type:</strong> {member.membershipType}</p>
            <p><strong>Start Date:</strong> {new Date(member.startDate).toLocaleDateString()}</p>
            <p><strong>End Date:</strong> {new Date(member.endDate).toLocaleDateString()}</p>
            <p>
              <strong>Status:</strong>{' '}
              <span className={`badge badge-${member.status === 'active' ? 'success' : 'danger'}`}>
                {member.status}
              </span>
            </p>
            {member.fitnessGoal && <p><strong>Fitness Goal:</strong> {member.fitnessGoal}</p>}
            {member.weight && <p><strong>Weight:</strong> {member.weight} kg</p>}
            {member.height && <p><strong>Height:</strong> {member.height} cm</p>}
            {member.bmi && <p><strong>BMI:</strong> {member.bmi}</p>}
          </div>
        </div>

        <div className="card">
          <h3>Payment Information</h3>
          <div style={{ marginTop: '1rem', lineHeight: '2' }}>
            <p><strong>Total Fees:</strong> ₹{member.totalFees?.toLocaleString()}</p>
            <p><strong>Paid Amount:</strong> ₹{member.paidAmount?.toLocaleString()}</p>
            <p><strong>Pending Amount:</strong> ₹{member.pendingAmount?.toLocaleString()}</p>
            <p>
              <strong>Payment Status:</strong>{' '}
              <span className={`badge badge-${member.paymentStatus === 'paid' ? 'success' : member.paymentStatus === 'overdue' ? 'danger' : 'warning'}`}>
                {member.paymentStatus}
              </span>
            </p>
          </div>
          {member.qrCode && (
            <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
              <h4>QR Code for Attendance</h4>
              <img src={member.qrCode} alt="QR Code" style={{ width: '200px', marginTop: '1rem', border: '2px solid #e5e7eb', padding: '1rem', borderRadius: '0.5rem' }} />
            </div>
          )}
        </div>
      </div>

      {/* Payment History */}
      <div className="card">
        <h3>Payment History</h3>
        {payments.length > 0 ? (
          <div className="table-container" style={{ marginTop: '1rem' }}>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Invoice #</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment._id}>
                    <td>{new Date(payment.paymentDate).toLocaleDateString()}</td>
                    <td>{payment.invoiceNumber}</td>
                    <td>₹{payment.amount?.toLocaleString()}</td>
                    <td>{payment.paymentMethod}</td>
                    <td>
                      <span className={`badge badge-${payment.status === 'completed' ? 'success' : 'warning'}`}>
                        {payment.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ marginTop: '1rem', color: '#6b7280' }}>No payment history available</p>
        )}
      </div>

      {/* Attendance History */}
      <div className="card">
        <h3>Attendance History (Last 30 Days)</h3>
        {attendance.length > 0 ? (
          <div className="table-container" style={{ marginTop: '1rem' }}>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Check-In</th>
                  <th>Check-Out</th>
                  <th>Duration</th>
                  <th>Method</th>
                </tr>
              </thead>
              <tbody>
                {attendance.slice(0, 30).map((record) => (
                  <tr key={record._id}>
                    <td>{new Date(record.date).toLocaleDateString()}</td>
                    <td>{new Date(record.checkInTime).toLocaleTimeString()}</td>
                    <td>{record.checkOutTime ? new Date(record.checkOutTime).toLocaleTimeString() : '-'}</td>
                    <td>{record.duration ? `${record.duration} mins` : '-'}</td>
                    <td>
                      <span className="badge badge-info">{record.checkInMethod}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ marginTop: '1rem', color: '#6b7280' }}>No attendance records available</p>
        )}
      </div>
    </div>
  );
};

export default MemberDetail;
