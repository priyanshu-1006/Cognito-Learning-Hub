/**
 * Service Health Check Utility
 * Monitors health of dependent services
 */

const axios = require('axios');
const createLogger = require('./logger');

class HealthChecker {
  constructor(serviceName) {
    this.logger = createLogger(serviceName);
  }

  async checkService(serviceUrl, serviceName) {
    try {
      const response = await axios.get(`${serviceUrl}/health`, {
        timeout: 3000,
      });

      if (response.status === 200) {
        this.logger.debug(`✓ ${serviceName} is healthy`);
        return {
          service: serviceName,
          status: 'healthy',
          url: serviceUrl,
          timestamp: new Date().toISOString(),
        };
      }
    } catch (error) {
      this.logger.warn(`✗ ${serviceName} is unhealthy:`, error.message);
      return {
        service: serviceName,
        status: 'unhealthy',
        url: serviceUrl,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async checkMultipleServices(services) {
    const results = await Promise.allSettled(
      Object.entries(services).map(([name, url]) =>
        this.checkService(url, name)
      )
    );

    return results.map((result) =>
      result.status === 'fulfilled' ? result.value : result.reason
    );
  }
}

module.exports = HealthChecker;
