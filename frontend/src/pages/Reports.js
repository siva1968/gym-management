import React, { useState, useEffect } from 'react';
import { reportsAPI } from '../services/api';
import { toast } from 'react-toastify';

const Reports = () => {
  const [activeTab, setActiveTab] = useState('income');
  const [profitLoss, setProfitLoss] = useState(null);
  const [membershipStats, setMembershipStats] = useState(null);

  useEffect(() => {
    fetchProfitLoss();
    fetchMembershipStats();
  }, []);

  const fetchProfitLoss = async () => {
    try {
      const response = await reportsAPI.getProfitLoss();
      if (response.data.success) {
        setProfitLoss(response.data.report);
      }
    } catch (error) {
      toast.error('Error fetching profit/loss report');
    }
  };

  const fetchMembershipStats = async () => {
    try {
      const response = await reportsAPI.getMembershipStats();
      if (response.data.success) {
        setMembershipStats(response.data.stats);
      }
    } catch (error) {
      toast.error('Error fetching membership stats');
    }
  };

  return (
    <div className="page-container">
      <h1 className="page-title">Reports & Analytics</h1>

      <div className="card">
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'income' ? 'active' : ''}`}
            onClick={() => setActiveTab('income')}
          >
            Profit/Loss
          </button>
          <button
            className={`tab ${activeTab === 'membership' ? 'active' : ''}`}
            onClick={() => setActiveTab('membership')}
          >
            Membership Stats
          </button>
        </div>

        {activeTab === 'income' && profitLoss && (
          <div style={{ marginTop: '2rem' }}>
            <div className="grid grid-3">
              <div className="stat-card">
                <h3>Total Income</h3>
                <p style={{ fontSize: '2rem', color: 'var(--success-color)' }}>
                  ₹{profitLoss.totalIncome?.toLocaleString() || 0}
                </p>
              </div>
              <div className="stat-card">
                <h3>Total Expenses</h3>
                <p style={{ fontSize: '2rem', color: 'var(--danger-color)' }}>
                  ₹{profitLoss.totalExpenses?.toLocaleString() || 0}
                </p>
              </div>
              <div className="stat-card">
                <h3>Net Profit</h3>
                <p style={{ fontSize: '2rem', color: profitLoss.profit >= 0 ? 'var(--success-color)' : 'var(--danger-color)' }}>
                  ₹{profitLoss.profit?.toLocaleString() || 0}
                </p>
                <small>Profit Margin: {profitLoss.profitMargin}%</small>
              </div>
            </div>

            <div style={{ marginTop: '2rem' }}>
              <h3>Expense Breakdown</h3>
              {profitLoss.expenseBreakdown?.map((item) => (
                <div key={item._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: '#f9fafb', marginBottom: '0.5rem', borderRadius: '0.5rem' }}>
                  <span>{item._id}</span>
                  <strong>₹{item.totalExpense.toLocaleString()}</strong>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'membership' && membershipStats && (
          <div style={{ marginTop: '2rem' }}>
            <h3>Members by Type</h3>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Membership Type</th>
                    <th>Count</th>
                  </tr>
                </thead>
                <tbody>
                  {membershipStats.byType?.map((item) => (
                    <tr key={item._id}>
                      <td>{item._id}</td>
                      <td><strong>{item.count}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h3 style={{ marginTop: '2rem' }}>Members by Status</h3>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Count</th>
                  </tr>
                </thead>
                <tbody>
                  {membershipStats.byStatus?.map((item) => (
                    <tr key={item._id}>
                      <td>
                        <span className={`badge badge-${item._id === 'active' ? 'success' : 'warning'}`}>
                          {item._id}
                        </span>
                      </td>
                      <td><strong>{item.count}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
