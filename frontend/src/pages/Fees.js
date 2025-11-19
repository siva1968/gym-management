import React, { useState, useEffect } from 'react';
import { feesAPI } from '../services/api';
import { FiPlus } from 'react-icons/fi';
import { toast } from 'react-toastify';

const Fees = () => {
  const [activeTab, setActiveTab] = useState('payments');
  const [payments, setPayments] = useState([]);
  const [plans, setPlans] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    member: '',
    amount: '',
    paymentMethod: 'cash',
    description: ''
  });

  useEffect(() => {
    if (activeTab === 'payments') {
      fetchPayments();
    } else {
      fetchPlans();
    }
  }, [activeTab]);

  const fetchPayments = async () => {
    try {
      const response = await feesAPI.getPayments();
      if (response.data.success) {
        setPayments(response.data.payments);
      }
    } catch (error) {
      toast.error('Error fetching payments');
    }
  };

  const fetchPlans = async () => {
    try {
      const response = await feesAPI.getPlans();
      if (response.data.success) {
        setPlans(response.data.plans);
      }
    } catch (error) {
      toast.error('Error fetching plans');
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await feesAPI.createPayment(paymentForm);
      if (response.data.success) {
        toast.success('Payment recorded successfully');
        setShowPaymentModal(false);
        fetchPayments();
        setPaymentForm({
          member: '',
          amount: '',
          paymentMethod: 'cash',
          description: ''
        });
      }
    } catch (error) {
      toast.error('Error recording payment');
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Fees & Payments</h1>
        <button className="btn btn-primary" onClick={() => setShowPaymentModal(true)}>
          <FiPlus /> Record Payment
        </button>
      </div>

      <div className="card">
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'payments' ? 'active' : ''}`}
            onClick={() => setActiveTab('payments')}
          >
            Payments
          </button>
          <button
            className={`tab ${activeTab === 'plans' ? 'active' : ''}`}
            onClick={() => setActiveTab('plans')}
          >
            Membership Plans
          </button>
        </div>

        {activeTab === 'payments' ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Member</th>
                  <th>Amount</th>
                  <th>Payment Method</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment._id}>
                    <td>{payment.invoiceNumber}</td>
                    <td>{payment.memberName}</td>
                    <td>₹{payment.amount}</td>
                    <td>{payment.paymentMethod}</td>
                    <td>{new Date(payment.paymentDate).toLocaleDateString()}</td>
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
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Plan Name</th>
                  <th>Type</th>
                  <th>Duration</th>
                  <th>Price</th>
                  <th>Discount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {plans.map((plan) => (
                  <tr key={plan._id}>
                    <td>{plan.name}</td>
                    <td>{plan.membershipType}</td>
                    <td>{plan.duration.value} {plan.duration.unit}</td>
                    <td>₹{plan.price}</td>
                    <td>{plan.discount}%</td>
                    <td>
                      <span className={`badge ${plan.isActive ? 'badge-success' : 'badge-danger'}`}>
                        {plan.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showPaymentModal && (
        <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Record Payment</h2>
            <form onSubmit={handlePaymentSubmit}>
              <div className="form-group">
                <label>Member ID *</label>
                <input
                  type="text"
                  value={paymentForm.member}
                  onChange={(e) => setPaymentForm({ ...paymentForm, member: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Amount *</label>
                <input
                  type="number"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Payment Method</label>
                <select
                  value={paymentForm.paymentMethod}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                >
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
                  <option value="card">Card</option>
                  <option value="net-banking">Net Banking</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="submit" className="btn btn-primary">Record Payment</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowPaymentModal(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Fees;
