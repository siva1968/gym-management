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
      const [memberRes, paymentsRes, attendanceRes] = await Promise.all([
        membersAPI.getById(id),
        feesAPI.getMemberPayments(member?.memberId || ''),
        attendanceAPI.getMemberHistory(member?.memberId || '')
      ]);

      if (memberRes.data.success) setMember(memberRes.data.member);
      if (paymentsRes.data.success) setPayments(paymentsRes.data.payments);
      if (attendanceRes.data.success) setAttendance(attendanceRes.data.attendance);
    } catch (error) {
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
          <div style={{ marginTop: '1rem' }}>
            <p><strong>Member ID:</strong> {member.memberId}</p>
            <p><strong>Email:</strong> {member.email || 'N/A'}</p>
            <p><strong>Phone:</strong> {member.phone}</p>
            <p><strong>Gender:</strong> {member.gender}</p>
            <p><strong>Membership Type:</strong> {member.membershipType}</p>
            <p><strong>Start Date:</strong> {new Date(member.startDate).toLocaleDateString()}</p>
            <p><strong>End Date:</strong> {new Date(member.endDate).toLocaleDateString()}</p>
            <p><strong>Status:</strong> {member.status}</p>
          </div>
        </div>

        <div className="card">
          <h3>Payment Information</h3>
          <div style={{ marginTop: '1rem' }}>
            <p><strong>Total Fees:</strong> ₹{member.totalFees}</p>
            <p><strong>Paid Amount:</strong> ₹{member.paidAmount}</p>
            <p><strong>Pending Amount:</strong> ₹{member.pendingAmount}</p>
            <p><strong>Payment Status:</strong> {member.paymentStatus}</p>
          </div>
          {member.qrCode && (
            <div style={{ marginTop: '1rem' }}>
              <h4>QR Code for Attendance</h4>
              <img src={member.qrCode} alt="QR Code" style={{ width: '200px' }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MemberDetail;
