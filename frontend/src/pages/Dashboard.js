import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardAPI, reportsAPI } from '../services/api';
import { FiUsers, FiUserCheck, FiDollarSign, FiAlertCircle, FiCalendar, FiTrendingUp } from 'react-icons/fi';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { toast } from 'react-toastify';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState(null);
  const [membershipStats, setMembershipStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, activitiesRes, membershipStatsRes] = await Promise.all([
        dashboardAPI.getStats(),
        dashboardAPI.getRecentActivities(),
        reportsAPI.getMembershipStats()
      ]);

      if (statsRes.data.success) {
        setStats(statsRes.data.stats);
      }

      if (activitiesRes.data.success) {
        setActivities(activitiesRes.data.activities);
      }

      if (membershipStatsRes.data.success) {
        setMembershipStats(membershipStatsRes.data.stats);
      }
    } catch (error) {
      toast.error('Error fetching dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="page-container">Loading...</div>;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-4">
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#dbeafe', color: '#2563eb' }}>
            <FiUsers />
          </div>
          <div className="stat-content">
            <h3>Total Members</h3>
            <p>{stats?.members.total || 0}</p>
            <small>{stats?.members.active || 0} Active</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#d1fae5', color: '#10b981' }}>
            <FiUserCheck />
          </div>
          <div className="stat-content">
            <h3>Trainers</h3>
            <p>{stats?.trainers.total || 0}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#fef3c7', color: '#f59e0b' }}>
            <FiCalendar />
          </div>
          <div className="stat-content">
            <h3>Today's Attendance</h3>
            <p>{stats?.attendance.today || 0}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#d1fae5', color: '#10b981' }}>
            <FiTrendingUp />
          </div>
          <div className="stat-content">
            <h3>Monthly Profit</h3>
            <p>₹{stats?.financials.profit?.toLocaleString() || 0}</p>
          </div>
        </div>
      </div>

      {/* Revenue & Expense */}
      <div className="grid grid-2">
        <div className="card">
          <h3>Monthly Revenue</h3>
          <div className="revenue-amount">₹{stats?.financials.monthlyRevenue?.toLocaleString() || 0}</div>
        </div>

        <div className="card">
          <h3>Monthly Expenses</h3>
          <div className="expense-amount">₹{stats?.financials.monthlyExpenses?.toLocaleString() || 0}</div>
        </div>
      </div>

      {/* Alerts */}
      {(stats?.alerts.pendingDues > 0 || stats?.alerts.expiringMemberships > 0) && (
        <div className="card alerts-card">
          <h3><FiAlertCircle /> Alerts</h3>
          <div className="alerts-grid">
            {stats?.alerts.pendingDues > 0 && (
              <Link to="/members?filter=dues" className="alert-item alert-warning">
                <strong>{stats.alerts.pendingDues}</strong> members have pending dues
              </Link>
            )}
            {stats?.alerts.expiringMemberships > 0 && (
              <Link to="/members?filter=expiring" className="alert-item alert-info">
                <strong>{stats.alerts.expiringMemberships}</strong> memberships expiring soon
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-2">
        {membershipStats?.byType && (
          <div className="card">
            <h3>Membership Distribution by Type</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={membershipStats.byType.map(item => ({ name: item._id, value: item.count }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {membershipStats.byType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {membershipStats?.byStatus && (
          <div className="card">
            <h3>Member Status Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={membershipStats.byStatus.map(item => ({ name: item._id, value: item.count }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {membershipStats.byStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Recent Activities */}
      <div className="grid grid-2">
        <div className="card">
          <h3>Recent Payments</h3>
          {activities?.recentPayments?.length > 0 ? (
            <div className="activity-list">
              {activities.recentPayments.map((payment) => (
                <div key={payment._id} className="activity-item">
                  <div>
                    <strong>{payment.memberName}</strong>
                    <p>{new Date(payment.paymentDate).toLocaleDateString()}</p>
                  </div>
                  <div className="amount">₹{payment.amount?.toLocaleString()}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-data">No recent payments</p>
          )}
        </div>

        <div className="card">
          <h3>Recent Members</h3>
          {activities?.recentMembers?.length > 0 ? (
            <div className="activity-list">
              {activities.recentMembers.map((member) => (
                <div key={member._id} className="activity-item">
                  <div>
                    <strong>{member.name}</strong>
                    <p>{member.memberId} - {member.membershipType}</p>
                  </div>
                  <span className="badge badge-success">New</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-data">No recent members</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
