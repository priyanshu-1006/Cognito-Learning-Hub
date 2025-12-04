/**
 * HTTP Client Utility
 * For inter-service communication
 */

const axios = require('axios');
const createLogger = require('./logger');

class HttpClient {
  constructor(serviceName, baseURL, timeout = 5000) {
    this.logger = createLogger(serviceName);
    this.client = axios.create({
      baseURL,
      timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        this.logger.debug(`HTTP ${config.method.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        this.logger.error('Request error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        return response;
      },
      (error) => {
        if (error.response) {
          this.logger.error('Response error:', {
            status: error.response.status,
            data: error.response.data,
          });
        } else if (error.request) {
          this.logger.error('No response received:', error.message);
        } else {
          this.logger.error('Request setup error:', error.message);
        }
        return Promise.reject(error);
      }
    );
  }

  async get(url, config = {}) {
    return this.client.get(url, config);
  }

  async post(url, data, config = {}) {
    return this.client.post(url, data, config);
  }

  async put(url, data, config = {}) {
    return this.client.put(url, data, config);
  }

  async patch(url, data, config = {}) {
    return this.client.patch(url, data, config);
  }

  async delete(url, config = {}) {
    return this.client.delete(url, config);
  }

  setAuthToken(token) {
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  removeAuthToken() {
    delete this.client.defaults.headers.common['Authorization'];
  }
}

module.exports = HttpClient;
