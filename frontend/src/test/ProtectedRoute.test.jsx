import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';

describe('ProtectedRoute Component', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('redirects to /login when user is not authenticated', async () => {
    render(
      <MemoryRouter
        initialEntries={['/dashboard']}
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<div>Login Page Mock</div>} />
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<div>Protected Dashboard Content</div>} />
            </Route>
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(await screen.findByText('Login Page Mock')).toBeInTheDocument();
    expect(screen.queryByText('Protected Dashboard Content')).not.toBeInTheDocument();
  });
});
