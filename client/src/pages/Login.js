/**
 * Login Page Component
 * User authentication form
 * Allows login with email OR phone number
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/axiosConfig';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import './Auth.css';

const Login = () => {
  // ========== STATE MANAGEMENT ==========
  // Form data state
  const [formData, setFormData] = useState({
    emailOrPhone: '',  // User can login with email OR phone
    password: ''        // User's password
  });
  
  const [error, setError] = useState('');        // Error message to display
  const [loading, setLoading] = useState(false); // Loading state during API call
  
  // ========== HOOKS ==========
  const navigate = useNavigate();  // For programmatic navigation
  const { login } = useAuth();     // Login function from auth context
  const toast = useToast();        // Toast notifications

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/api/auth/login', formData);
      login(response.data.user, response.data.token);
      toast.success('Login successful!');
      navigate('/chat');
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Login failed. Please try again.';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <div className="auth-header">
          <h1>Welcome Back</h1>
          <p>Login to continue chatting</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Email or Phone Number</label>
            <input
              type="text"
              name="emailOrPhone"
              value={formData.emailOrPhone}
              onChange={handleChange}
              required
              placeholder="Enter your email or phone"
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Enter your password"
            />
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Don't have an account? <Link to="/signup">Sign Up</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Login;
