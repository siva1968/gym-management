import React from 'react';

const Settings = () => {
  return (
    <div className="page-container">
      <h1 className="page-title">Settings</h1>
      <div className="card">
        <h3>Application Settings</h3>
        <p>Settings page - Configure your gym management system here.</p>
        <ul style={{ marginTop: '1rem', lineHeight: '2' }}>
          <li>Gym Name & Logo Configuration</li>
          <li>Branch Management</li>
          <li>Notification Settings (SMS/WhatsApp)</li>
          <li>Email Templates</li>
          <li>Backup & Restore Data</li>
          <li>User Management</li>
        </ul>
      </div>
    </div>
  );
};

export default Settings;
