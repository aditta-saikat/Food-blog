import { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Configure axios
  axios.defaults.baseURL = import.meta.env.VITE_API_URL;
  axios.defaults.withCredentials = true;

  // Add interceptor for adding token to requests
  axios.interceptors.request.use(
    (config) => {
      // Skip adding Authorization header for Google Sign-In to avoid token mix-up
      if (config.url.includes('/auth/google')) {
        return config;
      }
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Add interceptor for token refresh
  axios.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      // If error is 401 and not already retrying
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          // Call refresh endpoint
          const res = await axios.get('/auth/refresh', { withCredentials: true });
          localStorage.setItem('accessToken', res.data.accessToken);

          // Update user data if provided
          if (res.data.user) {
            localStorage.setItem('userInfo', JSON.stringify(res.data.user));
            setCurrentUser(res.data.user);
          }

          // Retry the original request
          return axios(originalRequest);
        } catch (err) {
          console.error('Token refresh failed:', err);
          // Only logout if refresh token is invalid
          if (err.response?.status === 401 || err.response?.data?.message === 'Invalid refresh token') {
            logout();
          }
          return Promise.reject(err);
        }
      }

      return Promise.reject(error);
    }
  );

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const userInfo = localStorage.getItem('userInfo');

        // If token and userInfo exist, set currentUser from localStorage first
        if (token && userInfo) {
          setCurrentUser(JSON.parse(userInfo));
        }

        // Verify token by fetching user data
        if (token) {
          const res = await axios.get('/users/me', { withCredentials: true });
          localStorage.setItem('userInfo', JSON.stringify(res.data));
          setCurrentUser(res.data);
        }
      } catch (err) {
        console.error('Auth check failed:', err.response?.data || err.message);
        // Only clear session if token is explicitly invalid
        if (err.response?.status === 401 && err.response?.data?.message === 'Invalid token') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('userInfo');
          setCurrentUser(null);
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const register = async (username, email, password) => {
    try {
      await axios.post('/auth/register', { username, email, password });
      return true;
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed';
      setError(message);
      throw new Error(message);
    }
  };

  const login = async (email, password, token = null) => {
    try {
      let res;
      if (token) {
        // Google Sign-In: Use token-based authentication
        res = await axios.post('/auth/google', { idToken: token }, { withCredentials: true });
      } else {
        // Email/Password login
        if (!email || !password) {
          throw new Error('Email and password are required');
        }
        res = await axios.post('/auth/login', { email, password }, { withCredentials: true });
      }

      localStorage.setItem('accessToken', res.data.accessToken || res.data.token);
      localStorage.setItem('userInfo', JSON.stringify(res.data.user));
      setCurrentUser(res.data.user);
      setError('');
      return res.data;
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed';
      setError(message);
      throw new Error(message);
    }
  };

  const logout = async () => {
    try {
      await axios.post('/auth/logout', {}, { withCredentials: true });
    } catch (err) {
      console.error('Logout error:', err.response?.data || err.message);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('userInfo');
      setCurrentUser(null);
      setError('');
    }
  };

  const value = {
    currentUser,
    setCurrentUser,
    loading,
    error,
    register,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;