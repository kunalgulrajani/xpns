import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from '../pages/Dashboard';
import { CurrencyProvider } from '../context/CurrencyContext';
import * as dashApi from '../api/dashboard';
import * as catApi from '../api/categories';

vi.mock('recharts', async () => {
  const original = await vi.importActual('recharts');
  return {
    ...original,
    ResponsiveContainer: ({ children }) => (
      <div data-testid="responsive-container" style={{ width: 400, height: 300 }}>
        {children}
      </div>
    ),
  };
});

const mockSummaryData = {
  totalIncome: 5000,
  totalExpense: 2000,
  balance: 3000,
  categoryExpenses: [
    {
      categoryId: 'cat1',
      categoryName: 'Housing & Rent',
      amount: 1500,
      count: 1,
      percentage: 75,
    },
    {
      categoryId: 'cat2',
      categoryName: 'Food & Dining',
      amount: 500,
      count: 3,
      percentage: 25,
    },
  ],
  recentTransactions: [
    {
      _id: 'txn1',
      type: 'expense',
      amount: 500,
      category: { name: 'Food & Dining' },
      date: '2026-10-18T10:00:00.000Z',
      note: 'Grocery haul',
    },
  ],
};

const renderDashboard = () => {
  return render(
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <CurrencyProvider>
        <Dashboard />
      </CurrencyProvider>
    </BrowserRouter>
  );
};

describe('Dashboard Page Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(catApi, 'getCategories').mockResolvedValue({
      success: true,
      categories: [
        { _id: 'cat1', name: 'Housing & Rent', type: 'expense' },
        { _id: 'cat2', name: 'Food & Dining', type: 'expense' },
      ],
    });
    vi.spyOn(dashApi, 'getDashboardSummary').mockResolvedValue({
      success: true,
      data: mockSummaryData,
    });
  });

  it('renders KPI metric summary cards with formatted amounts', async () => {
    renderDashboard();

    expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument();

    expect(await screen.findByText('Total Income')).toBeInTheDocument();
    expect(screen.getByText('+₹5,000.00')).toBeInTheDocument();

    expect(screen.getByText('Total Expenses')).toBeInTheDocument();
    expect(screen.getByText('-₹2,000.00')).toBeInTheDocument();

    expect(screen.getByText('Net Balance')).toBeInTheDocument();
    expect(screen.getByText('₹3,000.00')).toBeInTheDocument();
  });

  it('renders category breakdown list with percentages', async () => {
    renderDashboard();

    expect(await screen.findByText('Housing & Rent')).toBeInTheDocument();
    expect(screen.getByText('(75%)')).toBeInTheDocument();

    const foodElements = screen.getAllByText('Food & Dining');
    expect(foodElements.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('(25%)')).toBeInTheDocument();
  });

  it('renders period month and year selector controls', async () => {
    renderDashboard();

    expect(await screen.findByLabelText(/period:/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue(new Date().getFullYear().toString())).toBeInTheDocument();
  });

  it('renders Quick Add Transaction button', async () => {
    renderDashboard();

    const addBtn = await screen.findByRole('button', { name: /\+ add transaction/i });
    expect(addBtn).toBeInTheDocument();
  });
});

