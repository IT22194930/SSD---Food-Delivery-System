const winston = require('winston');
const path = require('path');

// Create logs directory if it doesn't exist
const fs = require('fs');
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Configure Winston logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'authentication-service' },
  transports: [
    // Write all logs with importance level of `error` or less to `error.log`
    new winston.transports.File({ 
      filename: path.join(logsDir, 'error.log'), 
      level: 'error' 
    }),
    // Write all logs with importance level of `info` or less to `combined.log`
    new winston.transports.File({ 
      filename: path.join(logsDir, 'combined.log') 
    }),
    // Security-specific logs
    new winston.transports.File({
      filename: path.join(logsDir, 'security.log'),
      level: 'warn'
    })
  ],
});

// If we're not in production, log to the console as well
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// Security event logging functions
const logSecurityEvent = (event, details = {}) => {
  logger.warn('SECURITY_EVENT', {
    event,
    timestamp: new Date().toISOString(),
    ...details
  });
};

const logAuthSuccess = (userId, email, method = 'local') => {
  logger.info('AUTH_SUCCESS', {
    userId,
    email,
    method,
    timestamp: new Date().toISOString(),
    event: 'authentication_success'
  });
};

const logAuthFailure = (email, reason, ip, userAgent) => {
  logSecurityEvent('authentication_failure', {
    email,
    reason,
    ip,
    userAgent,
    timestamp: new Date().toISOString()
  });
};

const logOAuthEvent = (event, email, provider, details = {}) => {
  logger.info('OAUTH_EVENT', {
    event,
    email,
    provider,
    timestamp: new Date().toISOString(),
    ...details
  });
};

const logRateLimitExceeded = (ip, endpoint, userAgent) => {
  logSecurityEvent('rate_limit_exceeded', {
    ip,
    endpoint,
    userAgent,
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  logger,
  logSecurityEvent,
  logAuthSuccess,
  logAuthFailure,
  logOAuthEvent,
  logRateLimitExceeded
};
