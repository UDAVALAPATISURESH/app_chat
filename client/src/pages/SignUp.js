/**
 * Sign Up Page Component
 * User registration form with validation
 * Creates new user account and automatically logs in
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/axiosConfig';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import './Auth.css';

const SignUp = () => {
  // ========== STATE MANAGEMENT ==========
  // Form data state
  const [formData, setFormData] = useState({
    name: '',      // User's full name
    email: '',     // User's email address
    phone: '',     // User's phone number
    password: ''   // User's password (will be hashed on backend)
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
      const response = await api.post('/api/auth/signup', formData);
      login(response.data.user, response.data.token);
      toast.success('Account created successfully!');
      navigate('/chat');
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Sign up failed. Please try again.';
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
          <h1>Create Account</h1>
          <p>Sign up to start chatting</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Enter your full name"
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter your email"
            />
          </div>

          <div className="form-group">
            <label>Phone Number</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              placeholder="Enter your phone number"
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
              minLength="6"
              placeholder="Enter your password (min 6 characters)"
            />
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Already have an account? <Link to="/login">Login</Link></p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
