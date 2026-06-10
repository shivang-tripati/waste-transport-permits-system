import pino from 'pino';

const isDev = process.env.NODE_ENV === 'development';
const enableAuthDebug = process.env.ENABLE_AUTH_DEBUG === 'true';
const logLevel = process.env.LOG_LEVEL || (isDev ? 'debug' : 'info');

// Configure Pino
export const logger = pino({
  level: logLevel,
  // Redact sensitive information automatically
  redact: {
    paths: [
      'user.id',
      'user.email', 
      'user.password',
      'password',
      'token',
      'accessToken',
      'refreshToken',
      'authorization',
      'headers.authorization',
      'cookies.accessToken',
      'cookies.refreshToken'
    ],
    censor: '[REDACTED]',
    remove: true // Remove redacted fields entirely
  },
  // Add timestamp in ISO format
  timestamp: pino.stdTimeFunctions.isoTime,
  // Custom serializers for specific data types
  serializers: {
    err: pino.stdSerializers.err,
    error: pino.stdSerializers.err,
    req: (req) => ({
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.headers?.['user-agent']
    }),
    res: pino.stdSerializers.res,
  },
  // Pretty print in development only
  transport: isDev ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
      singleLine: false,
      messageFormat: '{level}: {msg}',
      hideObject: false,
    }
  } : undefined,
  // Don't include pid/hostname in production (reduces log size)
  base: isDev ? undefined : null,
});

// For backward compatibility with existing debug calls
export const debug = {
  auth: (...args: any[]) => {
    if (isDev && enableAuthDebug) {
      logger.debug({ type: 'AUTH' }, args.map(String).join(' '));
    }
  },
  log: (...args: any[]) => {
    if (isDev) {
      logger.info(args.map(String).join(' '));
    }
  },
  error: (...args: any[]) => {
    logger.error({ type: 'ERROR' }, args.map(String).join(' '));
  },
  warn: (...args: any[]) => {
    if (isDev) {
      logger.warn(args.map(String).join(' '));
    }
  },
  info: (...args: any[]) => {
    if (isDev) {
      logger.info(args.map(String).join(' '));
    }
  }
};

// Export convenience methods
export const log = {
  info: (message: string, data?: any) => {
    logger.info(data || {}, message);
  },
  error: (message: string, error?: any, data?: any) => {
    logger.error({ error, ...data }, message);
  },
  warn: (message: string, data?: any) => {
    logger.warn(data || {}, message);
  },
  debug: (message: string, data?: any) => {
    if (isDev || process.env.DEBUG === 'true') {
      logger.debug(data || {}, message);
    }
  },
  auth: (message: string, data?: any) => {
    if (enableAuthDebug) {
      logger.info({ type: 'AUTH', ...data }, message);
    }
  }
};