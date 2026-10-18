import React from 'react';

const Dashboard = () => {
  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2>Dashboard</h2>
        <p style={{ color: 'var(--text-muted)' }}>
          Overview of your monthly income, expenses, and category breakdown.
        </p>
      </div>
      <div className="card">
        <p>Dashboard analytics and charts will be loaded here.</p>
      </div>
    </div>
  );
};

export default Dashboard;
