/**
 * Axios Instance with Interceptors
 * Configured for microservices architecture with JWT authentication
 */

import axios from 'axios';
import { getApiUrl, isDebugEnabled } from './apiConfig';

// Create axios instance with default config
const axiosInstance = axios.create({
  baseURL: getApiUrl(),
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request Interceptor
 * Adds JWT token to all requests
 */
axiosInstance.interceptors.request.use(
  (config) => {
    // Get JWT token from localStorage
    const token = localStorage.getItem('token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log request in debug mode
    if (isDebugEnabled()) {
      console.log('🔵 API Request:', {
        method: config.method?.toUpperCase(),
        url: config.url,
        data: config.data,
      });
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor
 * Handles errors and token refresh
 */
axiosInstance.interceptors.response.use(
  (response) => {
    // Log response in debug mode
    if (isDebugEnabled()) {
      console.log('🟢 API Response:', {
        status: response.status,
        url: response.config.url,
        data: response.data,
      });
    }
    
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Handle network errors
    if (!error.response) {
      console.error('❌ Network Error:', error.message);
      return Promise.reject({
        message: 'Network error. Please check your connection.',
        type: 'NETWORK_ERROR',
      });
    }
    
    const status = error.response.status;
    
    // Handle 401 Unauthorized - Token expired
    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh token
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (refreshToken) {
          const response = await axios.post(
            `${getApiUrl()}/api/auth/refresh`,
            { refreshToken }
          );
          
          const { token } = response.data.data;
          localStorage.setItem('token', token);
          
          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return axiosInstance(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed - logout user
        console.error('Token refresh failed:', refreshError);
        handleLogout();
        return Promise.reject(refreshError);
      }
      
      // No refresh token - logout user
      handleLogout();
    }
    
    // Handle 403 Forbidden
    if (status === 403) {
      console.error('❌ Access Denied:', error.response.data);
      return Promise.reject({
        message: error.response.data.message || 'Access denied',
        type: 'FORBIDDEN',
      });
    }
    
    // Handle 404 Not Found
    if (status === 404) {
      console.error('❌ Not Found:', error.response.data);
      return Promise.reject({
        message: error.response.data.message || 'Resource not found',
        type: 'NOT_FOUND',
      });
    }
    
    // Handle 429 Too Many Requests
    if (status === 429) {
      console.error('❌ Rate Limit Exceeded:', error.response.data);
      return Promise.reject({
        message: 'Too many requests. Please try again later.',
        type: 'RATE_LIMIT',
      });
    }
    
    // Handle 500 Internal Server Error
    if (status >= 500) {
      console.error('❌ Server Error:', error.response.data);
      return Promise.reject({
        message: 'Server error. Please try again later.',
        type: 'SERVER_ERROR',
      });
    }
    
    // Log other errors in debug mode
    if (isDebugEnabled()) {
      console.error('❌ API Error:', {
        status,
        url: error.config?.url,
        data: error.response.data,
      });
    }
    
    // Return error data
    return Promise.reject(
      error.response.data || {
        message: 'An error occurred',
        type: 'UNKNOWN_ERROR',
      }
    );
  }
);

/**
 * Handle user logout
 */
function handleLogout() {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  
  // Redirect to login page
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
}

/**
 * API Helper Functions
 */

// GET request
export const get = (url, config = {}) => {
  return axiosInstance.get(url, config);
};

// POST request
export const post = (url, data, config = {}) => {
  return axiosInstance.post(url, data, config);
};

// PUT request
export const put = (url, data, config = {}) => {
  return axiosInstance.put(url, data, config);
};

// DELETE request
export const del = (url, config = {}) => {
  return axiosInstance.delete(url, config);
};

// PATCH request
export const patch = (url, data, config = {}) => {
  return axiosInstance.patch(url, data, config);
};

/**
 * Upload file with progress
 */
export const uploadFile = (url, file, onProgress) => {
  const formData = new FormData();
  formData.append('file', file);
  
  return axiosInstance.post(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onProgress(percentCompleted);
      }
    },
  });
};

export default axiosInstance;
