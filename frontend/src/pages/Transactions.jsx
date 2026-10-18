import React, { useState, useEffect } from 'react';
import {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from '../api/transactions';
import { getCategories } from '../api/categories';
import { useCurrency } from '../context/CurrencyContext';

const Transactions = () => {
  const { currency, symbol, formatAmount } = useCurrency();
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [filterType, setFilterType] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    type: 'expense',
    amount: '',
    category: '',
    currency: 'INR',
    date: new Date().toISOString().split('T')[0],
    note: '',
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await getCategories();
        if (res.success) {
          setCategories(res.categories || []);
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    };
    fetchCats();
  }, []);

  const fetchTxns = async () => {
    try {
      setLoading(true);
      setError('');
      const filters = {};
      if (filterType) filters.type = filterType;
      if (filterCategory) filters.category = filterCategory;
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;

      const res = await getTransactions(filters);
      if (res.success) {
        setTransactions(res.transactions || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch transactions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTxns();
  }, [filterType, filterCategory, startDate, endDate]);

  const handleOpenAddModal = () => {
    setEditingId(null);
    const firstCat = categories.find((c) => c.type === 'expense')?._id || '';
    setFormData({
      type: 'expense',
      amount: '',
      category: firstCat,
      currency: currency || 'INR',
      date: new Date().toISOString().split('T')[0],
      note: '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (txn) => {
    setEditingId(txn._id);
    setFormData({
      type: txn.type,
      amount: txn.amount,
      category: txn.category?._id || txn.category || '',
      currency: txn.currency || currency || 'INR',
      date: txn.date ? new Date(txn.date).toISOString().split('T')[0] : '',
      note: txn.note || '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormError('');
  };

  const handleTypeChange = (newType) => {
    const firstCat = categories.find((c) => c.type === newType)?._id || '';
    setFormData((prev) => ({
      ...prev,
      type: newType,
      category: firstCat,
    }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const numAmount = parseFloat(formData.amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setFormError('Please enter a valid amount greater than 0.');
      return;
    }

    if (!formData.category) {
      setFormError('Please select a category.');
      return;
    }

    try {
      setFormSubmitting(true);
      if (editingId) {
        await updateTransaction(editingId, {
          ...formData,
          amount: numAmount,
        });
        setSuccess('Transaction updated successfully.');
      } else {
        await createTransaction({
          ...formData,
          amount: numAmount,
        });
        setSuccess('Transaction added successfully.');
      }
      handleCloseModal();
      fetchTxns();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save transaction.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) {
      return;
    }

    try {
      setError('');
      setSuccess('');
      await deleteTransaction(id);
      setTransactions((prev) => prev.filter((t) => t._id !== id));
      setSuccess('Transaction deleted.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete transaction.');
    }
  };

  const handleClearFilters = () => {
    setFilterType('');
    setFilterCategory('');
    setStartDate('');
    setEndDate('');
  };

  const availableCategoriesForForm = categories.filter(
    (c) => c.type === formData.type
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Transactions</h2>
          <p style={{ color: 'var(--text-muted)' }}>
            Track, filter, and manage your income and expenses.
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="btn btn-primary"
          id="add-transaction-btn"
        >
          + Add Transaction
        </button>
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

      {}
      <div className="filter-bar">
        <div className="filter-item">
          <label htmlFor="filter-type">Type</label>
          <select
            id="filter-type"
            className="form-select"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="">All Types</option>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        </div>

        <div className="filter-item">
          <label htmlFor="filter-category">Category</label>
          <select
            id="filter-category"
            className="form-select"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name} ({c.type})
              </option>
            ))}
          </select>
        </div>

        <div className="filter-item">
          <label htmlFor="filter-start-date">From Date</label>
          <input
            id="filter-start-date"
            type="date"
            className="form-input"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        <div className="filter-item">
          <label htmlFor="filter-end-date">To Date</label>
          <input
            id="filter-end-date"
            type="date"
            className="form-input"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        {(filterType || filterCategory || startDate || endDate) && (
          <div style={{ alignSelf: 'flex-end' }}>
            <button
              onClick={handleClearFilters}
              className="btn btn-secondary btn-sm"
              style={{ height: '38px' }}
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {}
      <div className="card">
        {loading ? (
          <div className="spinner-container" style={{ minHeight: '200px' }}>
            <div className="spinner"></div>
          </div>
        ) : transactions.length === 0 ? (
          <div className="empty-state">
            <h4>No transactions found</h4>
            <p>
              {filterType || filterCategory || startDate || endDate
                ? 'Try adjusting your filters or click "Reset Filters".'
                : 'Get started by clicking "+ Add Transaction" above!'}
            </p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Type</th>
                  <th>Note</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((txn) => {
                  const isIncome = txn.type === 'income';
                  const formattedDate = txn.date
                    ? new Date(txn.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })
                    : 'N/A';

                  return (
                    <tr key={txn._id}>
                      <td style={{ whiteSpace: 'nowrap' }}>{formattedDate}</td>
                      <td style={{ fontWeight: 600 }}>
                        {txn.category?.name || 'Uncategorized'}
                      </td>
                      <td>
                        <span className={`badge badge-${txn.type}`}>{txn.type}</span>
                      </td>
                      <td style={{ color: 'var(--text-muted)', maxWidth: '250px' }}>
                        {txn.note || '—'}
                      </td>
                      <td
                        style={{
                          textAlign: 'right',
                          fontWeight: 700,
                          color: isIncome ? 'var(--success)' : 'var(--danger)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {isIncome
                          ? `+${formatAmount(txn.amount, txn.currency)}`
                          : `-${formatAmount(txn.amount, txn.currency)}`}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="action-btns">
                          <button
                            onClick={() => handleOpenEditModal(txn)}
                            className="btn btn-secondary btn-sm btn-icon"
                            title="Edit transaction"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(txn._id)}
                            className="btn btn-danger btn-sm btn-icon"
                            title="Delete transaction"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={handleCloseModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingId ? 'Edit Transaction' : 'Add Transaction'}</h3>
              <button
                className="modal-close"
                onClick={handleCloseModal}
                aria-label="Close modal"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleFormSubmit}>
              <div className="modal-body">
                {formError && (
                  <div className="alert alert-error" role="alert">
                    <span>⚠️</span> {formError}
                  </div>
                )}

                {}
                <div className="form-group">
                  <label className="form-label">Transaction Type</label>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                      type="button"
                      className={`btn btn-block ${
                        formData.type === 'expense' ? 'btn-danger' : 'btn-secondary'
                      }`}
                      onClick={() => handleTypeChange('expense')}
                    >
                      Expense
                    </button>
                    <button
                      type="button"
                      className={`btn btn-block ${
                        formData.type === 'income' ? 'btn-primary' : 'btn-secondary'
                      }`}
                      onClick={() => handleTypeChange('income')}
                    >
                      Income
                    </button>
                  </div>
                </div>

                {}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="txn-amount">
                      Amount
                    </label>
                    <input
                      id="txn-amount"
                      type="number"
                      step="0.01"
                      min="0.01"
                      className="form-input"
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={(e) =>
                        setFormData({ ...formData, amount: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="txn-currency">
                      Currency
                    </label>
                    <select
                      id="txn-currency"
                      className="form-select"
                      value={formData.currency || currency}
                      onChange={(e) =>
                        setFormData({ ...formData, currency: e.target.value })
                      }
                    >
                      <option value="INR">₹ INR</option>
                      <option value="USD">$ USD</option>
                      <option value="EUR">€ EUR</option>
                      <option value="GBP">£ GBP</option>
                    </select>
                  </div>
                </div>

                {}
                <div className="form-group">
                  <label className="form-label" htmlFor="txn-category">
                    Category
                  </label>
                  <select
                    id="txn-category"
                    className="form-select"
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    required
                  >
                    {availableCategoriesForForm.length === 0 ? (
                      <option value="">No categories for this type</option>
                    ) : (
                      availableCategoriesForForm.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {}
                <div className="form-group">
                  <label className="form-label" htmlFor="txn-date">
                    Date
                  </label>
                  <input
                    id="txn-date"
                    type="date"
                    className="form-input"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    required
                  />
                </div>

                {}
                <div className="form-group">
                  <label className="form-label" htmlFor="txn-note">
                    Note (optional)
                  </label>
                  <input
                    id="txn-note"
                    type="text"
                    maxLength={500}
                    className="form-input"
                    placeholder="e.g. Grocery run, Client invoice"
                    value={formData.note}
                    onChange={(e) =>
                      setFormData({ ...formData, note: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCloseModal}
                  disabled={formSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={formSubmitting}
                >
                  {formSubmitting
                    ? 'Saving...'
                    : editingId
                    ? 'Update Transaction'
                    : 'Save Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;
