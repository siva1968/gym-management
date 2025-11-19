import React, { useState, useEffect } from 'react';
import { trainersAPI } from '../services/api';
import { FiPlus } from 'react-icons/fi';
import { toast } from 'react-toastify';

const Trainers = () => {
  const [trainers, setTrainers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    specialization: [],
    joiningDate: new Date().toISOString().split('T')[0],
    baseSalary: ''
  });

  useEffect(() => {
    fetchTrainers();
  }, []);

  const fetchTrainers = async () => {
    try {
      const response = await trainersAPI.getAll();
      if (response.data.success) {
        setTrainers(response.data.trainers);
      }
    } catch (error) {
      toast.error('Error fetching trainers');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await trainersAPI.create(formData);
      if (response.data.success) {
        toast.success('Trainer added successfully');
        setShowModal(false);
        fetchTrainers();
        setFormData({
          name: '',
          email: '',
          phone: '',
          specialization: [],
          joiningDate: new Date().toISOString().split('T')[0],
          baseSalary: ''
        });
      }
    } catch (error) {
      toast.error('Error adding trainer');
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Trainers</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <FiPlus /> Add Trainer
        </button>
      </div>

      <div className="card table-container">
        <table>
          <thead>
            <tr>
              <th>Trainer ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Specialization</th>
              <th>Assigned Members</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {trainers.map((trainer) => (
              <tr key={trainer._id}>
                <td>{trainer.trainerId}</td>
                <td>{trainer.name}</td>
                <td>{trainer.email}</td>
                <td>{trainer.phone}</td>
                <td>{trainer.specialization?.join(', ')}</td>
                <td>{trainer.assignedMembers?.length || 0}</td>
                <td>
                  <span className={`badge ${trainer.isActive ? 'badge-success' : 'badge-danger'}`}>
                    {trainer.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Add New Trainer</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Phone *</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Base Salary</label>
                <input
                  type="number"
                  value={formData.baseSalary}
                  onChange={(e) => setFormData({ ...formData, baseSalary: e.target.value })}
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="submit" className="btn btn-primary">Add Trainer</button>
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

export default Trainers;
