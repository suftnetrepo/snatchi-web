import bunyan from 'bunyan';
import path from 'path';
import fs from 'fs';

// Check if running in a serverless environment
const isServerless = process.env.VERCEL === "1" || process.env.NODE_ENV === "production";

// Ensure logs directory exists (Only in non-serverless environments)
const logDir = path.resolve(process.cwd(), 'logs');

if (!isServerless) {
  try {
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  } catch (err) {
    console.error("Log directory creation failed:", err);
  }
}

// Determine log stream setup
const streams = isServerless
  ? [
      { stream: process.stdout, level: 'info' }, // Log to console in serverless mode
      { stream: process.stderr, level: 'error' },
    ]
  : [
      {
        type: 'rotating-file',
        path: path.resolve(logDir, 'info.log'),
        period: '1d',
        level: 'info',
        count: 3,
      },
      {
        type: 'rotating-file',
        path: path.resolve(logDir, 'error.log'),
        period: '1d',
        level: 'error',
        count: 7,
      },
      {
        type: 'rotating-file',
        path: path.resolve(logDir, 'trace.log'),
        period: '1d',
        level: 'trace',
        count: 3,
      },
    ];

// Create a Bunyan logger instance
const logger = bunyan.createLogger({
  name: 'jsl-snatchi',
  streams,
});

// Access log stream (Only for non-serverless environments)
const accessLogStream = !isServerless
  ? fs.createWriteStream(path.resolve(logDir, `${process.env.NODE_ENV || 'development'}.log`), { flags: 'a' })
  : process.stdout; // Use stdout in serverless environments

export { accessLogStream, logger };
