import React from 'react';

const Transactions = () => {
  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2>Transactions</h2>
        <p style={{ color: 'var(--text-muted)' }}>
          Manage and filter your income and expense records.
        </p>
      </div>
      <div className="card">
        <p>Transaction list, filters, and creation form will be loaded here.</p>
      </div>
    </div>
  );
};

export default Transactions;
