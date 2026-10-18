import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Transactions from '../pages/Transactions';
import { CurrencyProvider } from '../context/CurrencyContext';
import * as txnApi from '../api/transactions';
import * as catApi from '../api/categories';

const mockCategories = [
  { _id: 'cat1', name: 'Food & Dining', type: 'expense', isDefault: true },
  { _id: 'cat2', name: 'Salary', type: 'income', isDefault: true },
];

const mockTransactions = [
  {
    _id: 'txn1',
    type: 'expense',
    amount: 45.5,
    category: { _id: 'cat1', name: 'Food & Dining' },
    date: '2026-10-15T12:00:00.000Z',
    note: 'Dinner with team',
  },
];

const renderTransactions = () => {
  return render(
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <CurrencyProvider>
        <Transactions />
      </CurrencyProvider>
    </BrowserRouter>
  );
};

describe('Transactions Page Component', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    vi.spyOn(catApi, 'getCategories').mockResolvedValue({
      success: true,
      categories: mockCategories,
    });
    vi.spyOn(txnApi, 'getTransactions').mockResolvedValue({
      success: true,
      transactions: mockTransactions,
    });
  });

  it('renders transactions page with table and filters using default INR currency', async () => {
    renderTransactions();

    expect(screen.getByRole('heading', { name: /transactions/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /\+ add transaction/i })).toBeInTheDocument();

    expect(await screen.findByText('Food & Dining')).toBeInTheDocument();
    expect(screen.getByText('Dinner with team')).toBeInTheDocument();
    expect(screen.getByText('-₹45.50')).toBeInTheDocument();
  });

  it('opens modal when "+ Add Transaction" is clicked and allows closing', async () => {
    renderTransactions();

    const addBtn = screen.getByRole('button', { name: /\+ add transaction/i });
    fireEvent.click(addBtn);

    expect(screen.getByRole('heading', { name: /add transaction/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();

    const cancelBtn = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelBtn);

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: /add transaction/i })).not.toBeInTheDocument();
    });
  });

  it('submits a new transaction and triggers create API call', async () => {
    const createSpy = vi.spyOn(txnApi, 'createTransaction').mockResolvedValue({
      success: true,
      transaction: {
        _id: 'txn2',
        type: 'expense',
        amount: 25,
        category: 'cat1',
        date: '2026-10-18',
        note: 'Coffee and books',
      },
    });

    renderTransactions();

    await screen.findByText('Food & Dining');

    fireEvent.click(screen.getByRole('button', { name: /\+ add transaction/i }));

    const amountInput = screen.getByLabelText(/amount/i);
    fireEvent.change(amountInput, { target: { value: '25' } });

    const noteInput = screen.getByLabelText(/note/i);
    fireEvent.change(noteInput, { target: { value: 'Coffee and books' } });

    const saveBtn = screen.getByRole('button', { name: /save transaction/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 25,
          note: 'Coffee and books',
          type: 'expense',
        })
      );
    });
  });
});
