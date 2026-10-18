import React from 'react';

const Categories = () => {
  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2>Categories</h2>
        <p style={{ color: 'var(--text-muted)' }}>
          Manage your default and custom expense/income categories.
        </p>
      </div>
      <div className="card">
        <p>Category list and custom category form will be loaded here.</p>
      </div>
    </div>
  );
};

export default Categories;
