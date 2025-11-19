import React, { useState, useEffect } from 'react';
import { attendanceAPI } from '../services/api';
import { toast } from 'react-toastify';
import { FiUserPlus } from 'react-icons/fi';

const Attendance = () => {
  const [todayAttendance, setTodayAttendance] = useState([]);
  const [memberId, setMemberId] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTodayAttendance();
  }, []);

  const fetchTodayAttendance = async () => {
    try {
      const response = await attendanceAPI.getToday();
      if (response.data.success) {
        setTodayAttendance(response.data.attendance);
      }
    } catch (error) {
      toast.error('Error fetching attendance');
    }
  };

  const handleCheckIn = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await attendanceAPI.checkIn({
        memberId,
        checkInMethod: 'manual'
      });

      if (response.data.success) {
        toast.success('Check-in successful');
        setMemberId('');
        fetchTodayAttendance();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Check-in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <h1 className="page-title">Attendance Management</h1>

      <div className="grid grid-2">
        <div className="card">
          <h3>Manual Check-In</h3>
          <form onSubmit={handleCheckIn} style={{ marginTop: '1rem' }}>
            <div className="form-group">
              <label>Member ID</label>
              <input
                type="text"
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
                placeholder="Enter Member ID"
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              <FiUserPlus /> {loading ? 'Checking In...' : 'Check In'}
            </button>
          </form>
        </div>

        <div className="card">
          <h3>Today's Summary</h3>
          <div style={{ marginTop: '1rem' }}>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>
              {todayAttendance.length}
            </p>
            <p>Members Present Today</p>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Today's Attendance</h3>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Member ID</th>
                <th>Name</th>
                <th>Check-In Time</th>
                <th>Check-Out Time</th>
                <th>Duration (mins)</th>
                <th>Method</th>
              </tr>
            </thead>
            <tbody>
              {todayAttendance.map((record) => (
                <tr key={record._id}>
                  <td>{record.memberId}</td>
                  <td>{record.memberName}</td>
                  <td>{new Date(record.checkInTime).toLocaleTimeString()}</td>
                  <td>{record.checkOutTime ? new Date(record.checkOutTime).toLocaleTimeString() : '-'}</td>
                  <td>{record.duration || '-'}</td>
                  <td>
                    <span className="badge badge-info">{record.checkInMethod}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Attendance;
