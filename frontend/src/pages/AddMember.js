import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { membersAPI, feesAPI, trainersAPI } from '../services/api';
import { toast } from 'react-toastify';

const AddMember = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: 'male',
    membershipType: 'Strength',
    planId: '',
    startDate: new Date().toISOString().split('T')[0],
    totalFees: '',
    assignedTrainer: '',
    fitnessGoal: '',
    medicalConditions: ''
  });

  useEffect(() => {
    fetchPlans();
    fetchTrainers();
    if (id) {
      fetchMember();
    }
  }, [id]);

  const fetchPlans = async () => {
    try {
      const response = await feesAPI.getPlans();
      if (response.data.success) {
        setPlans(response.data.plans);
      }
    } catch (error) {
      console.error('Error fetching plans');
    }
  };

  const fetchTrainers = async () => {
    try {
      const response = await trainersAPI.getAll();
      if (response.data.success) {
        setTrainers(response.data.trainers);
      }
    } catch (error) {
      console.error('Error fetching trainers');
    }
  };

  const fetchMember = async () => {
    try {
      const response = await membersAPI.getById(id);
      if (response.data.success) {
        const member = response.data.member;
        setFormData({
          ...member,
          startDate: new Date(member.startDate).toISOString().split('T')[0],
          dateOfBirth: member.dateOfBirth ? new Date(member.dateOfBirth).toISOString().split('T')[0] : ''
        });
      }
    } catch (error) {
      toast.error('Error fetching member');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Auto-calculate end date and fees when plan is selected
    if (name === 'planId') {
      const selectedPlan = plans.find(p => p._id === value);
      if (selectedPlan) {
        setFormData(prev => ({
          ...prev,
          planId: value,
          totalFees: selectedPlan.price,
          membershipType: selectedPlan.membershipType
        }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let response;
      if (id) {
        response = await membersAPI.update(id, formData);
      } else {
        response = await membersAPI.create(formData);
      }

      if (response.data.success) {
        toast.success(`Member ${id ? 'updated' : 'created'} successfully`);
        navigate('/members');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error saving member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <h1 className="page-title">{id ? 'Edit' : 'Add'} Member</h1>

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-2">
            <div className="form-group">
              <label>Name *</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label>Phone *</label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label>Date of Birth</label>
              <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label>Gender</label>
              <select name="gender" value={formData.gender} onChange={handleChange}>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label>Membership Plan *</label>
              <select name="planId" value={formData.planId} onChange={handleChange} required>
                <option value="">Select Plan</option>
                {plans.map(plan => (
                  <option key={plan._id} value={plan._id}>
                    {plan.name} - ₹{plan.price} ({plan.duration.value} {plan.duration.unit})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Start Date *</label>
              <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label>Total Fees *</label>
              <input type="number" name="totalFees" value={formData.totalFees} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label>Assigned Trainer</label>
              <select name="assignedTrainer" value={formData.assignedTrainer} onChange={handleChange}>
                <option value="">No Trainer</option>
                {trainers.map(trainer => (
                  <option key={trainer._id} value={trainer._id}>{trainer.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Fitness Goal</label>
              <input type="text" name="fitnessGoal" value={formData.fitnessGoal} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label>Medical Conditions</label>
              <textarea name="medicalConditions" value={formData.medicalConditions} onChange={handleChange} rows="3" />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save Member'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/members')}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMember;
