import React, { useState, useEffect } from 'react';
import { getCategories, createCategory, deleteCategory } from '../api/categories';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all'); 

  const [name, setName] = useState('');
  const [type, setType] = useState('expense');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchCategoryList = async () => {
    try {
      setLoading(true);
      const res = await getCategories();
      if (res.success) {
        setCategories(res.categories || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load categories.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategoryList();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name.trim()) {
      setError('Category name is required.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await createCategory({ name: name.trim(), type });
      if (res.success && res.category) {
        setCategories((prev) => [...prev, res.category]);
        setName('');
        setSuccess(`Custom category "${res.category.name}" created successfully.`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create category.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, catName) => {
    if (!window.confirm(`Are you sure you want to delete category "${catName}"?`)) {
      return;
    }

    try {
      setError('');
      setSuccess('');
      await deleteCategory(id);
      setCategories((prev) => prev.filter((c) => c._id !== id));
      setSuccess(`Category "${catName}" deleted.`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete category.');
    }
  };

  const filteredCategories = categories.filter((cat) => {
    if (filterType === 'all') return true;
    return cat.type === filterType;
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Categories</h2>
          <p style={{ color: 'var(--text-muted)' }}>
            Manage predefined defaults and create your own custom categories.
          </p>
        </div>
      </div>

      {error && (
        <div className="alert alert-error" role="alert">
          <span>⚠️</span> {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success" role="alert">
          <span>✅</span> {success}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 1fr) 2fr', gap: '1.5rem', alignItems: 'start' }}>
        {}
        <div className="card">
          <h3 style={{ marginBottom: '1rem', fontSize: '1.15rem' }}>Add Custom Category</h3>
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label className="form-label" htmlFor="cat-name">
                Category Name
              </label>
              <input
                id="cat-name"
                type="text"
                className="form-input"
                placeholder="e.g. Gym, Pet Care, Bonus"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={50}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="cat-type">
                Type
              </label>
              <select
                id="cat-type"
                className="form-select"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={submitting}
            >
              {submitting ? 'Creating...' : '+ Create Category'}
            </button>
          </form>
        </div>

        {}
        <div className="card">
          <div className="tabs">
            <button
              className={`tab-btn ${filterType === 'all' ? 'active' : ''}`}
              onClick={() => setFilterType('all')}
            >
              All ({categories.length})
            </button>
            <button
              className={`tab-btn ${filterType === 'expense' ? 'active' : ''}`}
              onClick={() => setFilterType('expense')}
            >
              Expenses ({categories.filter((c) => c.type === 'expense').length})
            </button>
            <button
              className={`tab-btn ${filterType === 'income' ? 'active' : ''}`}
              onClick={() => setFilterType('income')}
            >
              Income ({categories.filter((c) => c.type === 'income').length})
            </button>
          </div>

          {loading ? (
            <div className="spinner-container" style={{ minHeight: '180px' }}>
              <div className="spinner"></div>
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="empty-state">
              <p>No categories found for this filter.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Category Name</th>
                    <th>Type</th>
                    <th>Classification</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCategories.map((cat) => (
                    <tr key={cat._id}>
                      <td style={{ fontWeight: 600 }}>{cat.name}</td>
                      <td>
                        <span className={`badge badge-${cat.type}`}>{cat.type}</span>
                      </td>
                      <td>
                        {cat.isDefault ? (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            🔒 System Default
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}>
                            👤 Custom
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {!cat.isDefault && (
                          <button
                            onClick={() => handleDelete(cat._id, cat.name)}
                            className="btn btn-danger btn-sm btn-icon"
                            title="Delete custom category"
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Categories;
