import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FiHome,
  FiUsers,
  FiUserCheck,
  FiCalendar,
  FiDollarSign,
  FiTrendingDown,
  FiBarChart2,
  FiSettings,
  FiLogOut,
  FiMenu,
  FiX
} from 'react-icons/fi';
import './Layout.css';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { path: '/', icon: <FiHome />, label: 'Dashboard' },
    { path: '/members', icon: <FiUsers />, label: 'Members' },
    { path: '/trainers', icon: <FiUserCheck />, label: 'Trainers' },
    { path: '/attendance', icon: <FiCalendar />, label: 'Attendance' },
    { path: '/fees', icon: <FiDollarSign />, label: 'Fees & Payments' },
    { path: '/expenses', icon: <FiTrendingDown />, label: 'Expenses' },
    { path: '/reports', icon: <FiBarChart2 />, label: 'Reports' },
    { path: '/settings', icon: <FiSettings />, label: 'Settings' }
  ];

  return (
    <div className="layout">
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <h2 className="logo">Elite Arena Gym</h2>
          <button className="toggle-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              {sidebarOpen && <span className="nav-label">{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <FiLogOut />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      <div className={`main-content ${sidebarOpen ? 'shifted' : ''}`}>
        <header className="top-header">
          <button className="mobile-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <FiMenu />
          </button>
          <div className="header-right">
            <div className="user-info">
              <span className="user-name">{user?.name}</span>
              <span className="user-role">{user?.role}</span>
            </div>
          </div>
        </header>

        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
