import React, { useState, useEffect } from 'react';
import { expensesAPI } from '../services/api';
import { FiPlus } from 'react-icons/fi';
import { toast } from 'react-toastify';

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: 'Utilities',
    amount: '',
    paymentMethod: 'cash',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const response = await expensesAPI.getAll();
      if (response.data.success) {
        setExpenses(response.data.expenses);
      }
    } catch (error) {
      toast.error('Error fetching expenses');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await expensesAPI.create(formData);
      if (response.data.success) {
        toast.success('Expense recorded successfully');
        setShowModal(false);
        fetchExpenses();
        setFormData({
          title: '',
          category: 'Utilities',
          amount: '',
          paymentMethod: 'cash',
          description: '',
          date: new Date().toISOString().split('T')[0]
        });
      }
    } catch (error) {
      toast.error('Error recording expense');
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Expenses</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <FiPlus /> Add Expense
        </button>
      </div>

      <div className="card table-container">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Title</th>
              <th>Category</th>
              <th>Amount</th>
              <th>Payment Method</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((expense) => (
              <tr key={expense._id}>
                <td>{new Date(expense.date).toLocaleDateString()}</td>
                <td>{expense.title}</td>
                <td>
                  <span className="badge badge-info">{expense.category}</span>
                </td>
                <td>₹{expense.amount}</td>
                <td>{expense.paymentMethod}</td>
                <td>{expense.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Add Expense</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="Rent">Rent</option>
                  <option value="Equipment">Equipment</option>
                  <option value="Utilities">Utilities</option>
                  <option value="Salaries">Salaries</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Supplies">Supplies</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Amount *</label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Payment Method</label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                >
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
                  <option value="card">Card</option>
                  <option value="net-banking">Net Banking</option>
                </select>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="3"
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="submit" className="btn btn-primary">Add Expense</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
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

export default Expenses;
