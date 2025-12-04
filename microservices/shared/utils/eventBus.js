/**
 * Event Bus Utility
 * Handles asynchronous event-driven communication between microservices
 * Can be extended to use RabbitMQ or Kafka for production
 */

const EventEmitter = require('events');
const createLogger = require('./logger');

class EventBus extends EventEmitter {
  constructor(serviceName) {
    super();
    this.logger = createLogger(serviceName);
    this.serviceName = serviceName;
  }

  publish(eventName, payload) {
    this.logger.info(`Publishing event: ${eventName}`, { payload });
    this.emit(eventName, {
      ...payload,
      _meta: {
        source: this.serviceName,
        timestamp: new Date().toISOString(),
      },
    });
  }

  subscribe(eventName, handler) {
    this.logger.info(`Subscribed to event: ${eventName}`);
    this.on(eventName, async (data) => {
      try {
        await handler(data);
      } catch (error) {
        this.logger.error(`Error handling event ${eventName}:`, error);
      }
    });
  }

  // For future RabbitMQ/Kafka integration
  async connectMessageBroker(brokerUrl) {
    // TODO: Implement RabbitMQ/Kafka connection
    this.logger.info('Message broker connection (placeholder for RabbitMQ/Kafka)');
  }
}

module.exports = EventBus;
