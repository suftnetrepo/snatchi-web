import bunyan from 'bunyan';
import path from 'path';
import fs from 'fs';

// Ensure the logs directory exists
if (!fs.existsSync('logs')) {
  fs.mkdirSync('logs');
}

// Determine the environment: production or development
const env = process.env.NODE_ENV === 'production' ? 'production' : 'development';

// Create a writable stream for access logs
const accessLogStream = fs.createWriteStream(
  path.resolve(process.cwd(), 'logs', `${env}.log`),
  { flags: 'a' }, // Append mode
);

// Create a Bunyan logger instance with multiple streams
const logger = bunyan.createLogger({
  name: 'jsl-snatchi', // Name of the logger
  streams: [
    {
      type: 'rotating-file', // Rotating log file for informational logs
      path: path.resolve('logs', 'info.log'),
      period: '1d', // Rotate daily
      level: 'info', // Log level
      count: 3, // Keep last 3 files
    },
    {
      type: 'rotating-file', // Rotating log file for error logs
      path: path.resolve('logs', 'error.log'),
      period: '1d',
      level: 'error',
      count: 7, // Keep last 7 files
    },
    {
      type: 'rotating-file', // Rotating log file for trace logs
      path: path.resolve('logs', 'trace.log'),
      period: '1d',
      level: 'trace',
      count: 3, // Keep last 3 files
    },
  ],
});

// Export the logger and access log stream for use in other modules
export { accessLogStream, logger };
