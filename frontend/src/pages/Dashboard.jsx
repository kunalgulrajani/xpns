import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts';
import { getDashboardSummary } from '../api/dashboard';
import { createTransaction } from '../api/transactions';
import { getCategories } from '../api/categories';
import { useCurrency } from '../context/CurrencyContext';

const COLORS = [
  '#4f46e5', 
  '#10b981', 
  '#f59e0b', 
  '#ef4444', 
  '#8b5cf6', 
  '#06b6d4', 
  '#ec4899', 
  '#f97316', 
  '#64748b', 
];

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const Dashboard = () => {
  const { currency, formatAmount } = useCurrency();

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
    categoryExpenses: [],
    recentTransactions: [],
  });

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
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

  const fetchSummary = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await getDashboardSummary({ month, year });
      if (res.success && res.data) {
        setSummary(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch dashboard summary.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [month, year]);

  const {
    totalIncome,
    totalExpense,
    balance,
    categoryExpenses,
    recentTransactions,
  } = summary;

  const handleOpenAddModal = () => {
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

  const handleCloseModal = () => {
    setIsModalOpen(false);
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
      await createTransaction({
        ...formData,
        amount: numAmount,
      });
      setSuccess('Transaction saved! Dashboard metrics updated.');
      handleCloseModal();
      fetchSummary();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save transaction.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const availableCategoriesForForm = categories.filter(
    (c) => c.type === formData.type
  );

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '0.6rem 0.9rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          }}
        >
          <p style={{ fontWeight: 700, margin: 0, color: '#0f172a' }}>
            {data.categoryName}
          </p>
          <p style={{ margin: '0.2rem 0', color: '#4f46e5', fontWeight: 600 }}>
            {formatAmount(data.amount)} ({data.percentage}%)
          </p>
          <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>
            {data.count} {data.count === 1 ? 'transaction' : 'transactions'}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      {}
      <div className="page-header">
        <div>
          <h2>Dashboard</h2>
          <p style={{ color: 'var(--text-muted)' }}>
            Financial health and expense analytics for {MONTH_NAMES[month - 1]} {year}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {}
          <button
            onClick={handleOpenAddModal}
            className="btn btn-primary btn-sm"
            id="dashboard-add-txn-btn"
          >
            + Add Transaction
          </button>

          {}
          <div className="period-selector">
            <label htmlFor="select-month" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
              Period:
            </label>
            <select
              id="select-month"
              className="form-select"
              style={{ width: 'auto', padding: '0.35rem 0.6rem' }}
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value, 10))}
            >
              {MONTH_NAMES.map((m, idx) => (
                <option key={m} value={idx + 1}>
                  {m}
                </option>
              ))}
            </select>
            <select
              id="select-year"
              className="form-select"
              style={{ width: 'auto', padding: '0.35rem 0.6rem' }}
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value, 10))}
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
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

      {loading ? (
        <div className="spinner-container" style={{ minHeight: '300px' }}>
          <div className="spinner"></div>
        </div>
      ) : (
        <>
          {}
          <div className="kpi-grid">
            {}
            <div className="kpi-card kpi-income">
              <div className="kpi-header">
                <span className="kpi-title">Total Income</span>
                <span className="kpi-icon">📈</span>
              </div>
              <div className="kpi-value" style={{ color: 'var(--success)' }}>
                +{formatAmount(totalIncome)}
              </div>
              <div className="kpi-subtext">Received in {MONTH_NAMES[month - 1]}</div>
            </div>

            {}
            <div className="kpi-card kpi-expense">
              <div className="kpi-header">
                <span className="kpi-title">Total Expenses</span>
                <span className="kpi-icon">📉</span>
              </div>
              <div className="kpi-value" style={{ color: 'var(--danger)' }}>
                -{formatAmount(totalExpense)}
              </div>
              <div className="kpi-subtext">Spent in {MONTH_NAMES[month - 1]}</div>
            </div>

            {}
            <div
              className={`kpi-card kpi-balance ${
                balance >= 0 ? 'positive' : 'negative'
              }`}
            >
              <div className="kpi-header">
                <span className="kpi-title">Net Balance</span>
                <span className="kpi-icon">💰</span>
              </div>
              <div
                className="kpi-value"
                style={{
                  color: balance >= 0 ? 'var(--primary)' : 'var(--danger)',
                }}
              >
                {balance >= 0 ? formatAmount(balance) : `-${formatAmount(Math.abs(balance))}`}
              </div>
              <div className="kpi-subtext">
                {balance >= 0
                  ? 'Savings / Net Positive'
                  : 'Deficit / Expenses exceed income'}
              </div>
            </div>
          </div>

          {}
          <div className="dashboard-grid">
            {}
            <div className="card">
              <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem' }}>
                Expense Distribution
              </h3>

              {categoryExpenses.length === 0 ? (
                <div className="empty-state" style={{ padding: '3.5rem 1rem' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📊</div>
                  <h4>No expenses recorded</h4>
                  <p>Expenses recorded in this month will appear on the chart.</p>
                </div>
              ) : (
                <div style={{ width: '100%', height: 320 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={categoryExpenses}
                        dataKey="amount"
                        nameKey="categoryName"
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={95}
                        paddingAngle={3}
                      >
                        {categoryExpenses.map((entry, index) => (
                          <Cell
                            key={`cell-${entry.categoryId || index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {}
            <div className="card">
              <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem' }}>
                Top Expense Categories
              </h3>

              {categoryExpenses.length === 0 ? (
                <div className="empty-state" style={{ padding: '3.5rem 1rem' }}>
                  <p>No category breakdown available for this period.</p>
                </div>
              ) : (
                <div>
                  {categoryExpenses.map((cat, idx) => {
                    const color = COLORS[idx % COLORS.length];
                    return (
                      <div key={cat.categoryId || cat.categoryName} className="cat-item">
                        <div className="cat-item-header">
                          <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span
                              style={{
                                width: '10px',
                                height: '10px',
                                borderRadius: '50%',
                                backgroundColor: color,
                                display: 'inline-block',
                              }}
                            ></span>
                            {cat.categoryName}
                          </span>
                          <span style={{ fontWeight: 700 }}>
                            {formatAmount(cat.amount)}{' '}
                            <span style={{ color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.8rem' }}>
                              ({cat.percentage}%)
                            </span>
                          </span>
                        </div>
                        <div className="cat-progress-track">
                          <div
                            className="cat-progress-fill"
                            style={{
                              width: `${cat.percentage}%`,
                              backgroundColor: color,
                            }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {}
          <div className="card">
            <div className="page-header" style={{ marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.15rem' }}>Recent Transactions</h3>
              <Link to="/transactions" className="btn btn-secondary btn-sm">
                View All Transactions &rarr;
              </Link>
            </div>

            {recentTransactions.length === 0 ? (
              <div className="empty-state">
                <p>No transactions yet. Click above to view and add transactions.</p>
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
                    </tr>
                  </thead>
                  <tbody>
                    {recentTransactions.map((txn) => {
                      const isIncome = txn.type === 'income';
                      const formattedDate = txn.date
                        ? new Date(txn.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
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
                          <td style={{ color: 'var(--text-muted)' }}>
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
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={handleCloseModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Transaction</h3>
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
                    <label className="form-label" htmlFor="dash-txn-amount">
                      Amount
                    </label>
                    <input
                      id="dash-txn-amount"
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
                    <label className="form-label" htmlFor="dash-txn-currency">
                      Currency
                    </label>
                    <select
                      id="dash-txn-currency"
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
                  <label className="form-label" htmlFor="dash-txn-category">
                    Category
                  </label>
                  <select
                    id="dash-txn-category"
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
                  <label className="form-label" htmlFor="dash-txn-date">
                    Date
                  </label>
                  <input
                    id="dash-txn-date"
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
                  <label className="form-label" htmlFor="dash-txn-note">
                    Note (optional)
                  </label>
                  <input
                    id="dash-txn-note"
                    type="text"
                    maxLength={500}
                    className="form-input"
                    placeholder="e.g. Morning coffee, Team lunch"
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
                  {formSubmitting ? 'Saving...' : 'Save Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
