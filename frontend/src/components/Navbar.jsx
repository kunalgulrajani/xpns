import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <NavLink to="/" className="nav-brand">
          💳 XPNS
        </NavLink>

        <ul className="nav-links">
          {isAuthenticated ? (
            <>
              <li>
                <NavLink
                  to="/dashboard"
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                  Dashboard
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/transactions"
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                  Transactions
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/categories"
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                  Categories
                </NavLink>
              </li>
              <li className="user-badge">
                👤 {user?.name || user?.email}
              </li>
              <li>
                <button
                  onClick={handleLogout}
                  className="btn btn-secondary btn-sm"
                  aria-label="Logout"
                >
                  Logout
                </button>
              </li>
            </>
          ) : (
            <>
              <li>
                <NavLink
                  to="/login"
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                  Login
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/register"
                  className="btn btn-primary btn-sm"
                >
                  Register
                </NavLink>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
