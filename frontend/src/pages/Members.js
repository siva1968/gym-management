import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { membersAPI } from '../services/api';
import { FiPlus, FiEdit, FiTrash2, FiSearch } from 'react-icons/fi';
import { toast } from 'react-toastify';

const Members = () => {
  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMembers();
  }, [search]);

  const fetchMembers = async () => {
    try {
      const response = await membersAPI.getAll({ search });
      if (response.data.success) {
        setMembers(response.data.members);
      }
    } catch (error) {
      toast.error('Error fetching members');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this member?')) return;

    try {
      const response = await membersAPI.delete(id);
      if (response.data.success) {
        toast.success('Member deleted successfully');
        fetchMembers();
      }
    } catch (error) {
      toast.error('Error deleting member');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: 'badge-success',
      expired: 'badge-danger',
      frozen: 'badge-info'
    };
    return <span className={`badge ${badges[status]}`}>{status}</span>;
  };

  const getPaymentBadge = (status) => {
    const badges = {
      paid: 'badge-success',
      pending: 'badge-warning',
      overdue: 'badge-danger'
    };
    return <span className={`badge ${badges[status]}`}>{status}</span>;
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Members</h1>
        <Link to="/members/add" className="btn btn-primary">
          <FiPlus /> Add Member
        </Link>
      </div>

      <div className="card">
        <div className="search-bar">
          <FiSearch />
          <input
            type="text"
            placeholder="Search members by name, ID, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Member ID</th>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Membership</th>
                  <th>End Date</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member._id}>
                    <td>{member.memberId}</td>
                    <td>{member.name}</td>
                    <td>{member.phone}</td>
                    <td>{member.membershipType}</td>
                    <td>{new Date(member.endDate).toLocaleDateString()}</td>
                    <td>{getStatusBadge(member.status)}</td>
                    <td>{getPaymentBadge(member.paymentStatus)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Link to={`/members/${member._id}`} className="btn btn-sm btn-info">
                          View
                        </Link>
                        <Link to={`/members/edit/${member._id}`} className="btn btn-sm btn-secondary">
                          <FiEdit />
                        </Link>
                        <button onClick={() => handleDelete(member._id)} className="btn btn-sm btn-danger">
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Members;
