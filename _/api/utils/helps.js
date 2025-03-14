import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
const bcrypt = require('bcrypt');
const crypto = require('crypto');
import { logger } from './logger';
import { serialize } from 'cookie';
import { getRefreshToken } from '../../../utils/generateToken';

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const verifyJwtTokenAsync = (token, secret) =>
  new Promise((resolve, reject) => {
    jwt.verify(token, secret, (err, decoded) => {
      if (err) return reject(err);
      resolve(decoded);
    });
  });

const verifyToken = (handler, options = {}) => {
  const { handleRefreshToken = true } = options;

  const verifyJwtToken = (token, secret) => {
    try {
      return jwt.verify(token, secret);
    } catch (err) {
      throw err;
    }
  };

  return async (req, res) => {
    try {
      const { authToken } = req.cookies;

      const decoded = verifyJwtToken(authToken, process.env.NEXT_PUBLIC_ACCESS_TOKEN_SECRET);
      req.user = decoded;
      return handler(req, res);
    } catch (err) {
      if (err.name === 'JsonWebTokenError' && handleRefreshToken) {
        try {
          const { refreshToken } = req.cookies;
          const user = await verifyJwtTokenAsync(refreshToken, process.env.NEXT_PUBLIC_REFRESH_TOKEN_SECRET);
          const newAccessToken = getRefreshToken({
            id: user.id,
            email: user.email,
            role: user.role,
            integrator: user.integrator
          });

          res.setHeader(
            'Set-Cookie',
            serialize('authToken', newAccessToken, {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'strict',
              maxAge: 60 * 15,
              path: '/'
            })
          );

          req.user = user;
          return handler(req, res);
        } catch (refreshErr) {
          logger.error('Refresh token error:', refreshErr);
          return res.status(403).json({ error: 'Session expired. Please log in again.' });
        }
      } else {
        logger.error('Authentication error:', err);
        const statusCode = err.name === 'JsonWebTokenError' ? 401 : 403;
        return res.status(statusCode).json({ error: 'Unauthorized access' });
      }
    }
  };
};

async function generatePassword(passwordString) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(passwordString, salt);
}

async function comparePassword(password, hashString) {
  return bcrypt.compare(password, hashString);
}

function clearCookie(res, key) {
  res.clearCookie(key);
}

const generateRandomKey = () =>
  new Promise((resolve, reject) => {
    crypto.randomBytes(32, (error, buf) => {
      if (error) {
        return reject(error);
      }
      const token = buf.toString('hex');
      return resolve(token);
    });
  });

const getAggregate = (data, status) => {
  {
    const result = (data || []).find((j) => j._id === status);
    return result ? result.count : 0;
  }
};

const dateFormatted = (str) => {
  const date0 = new Date(str);
  date0.setHours(date0.getHours() + 5);
  date0.setMinutes(date0.getMinutes() + 30);
  const month = `0${date0.getMonth() + 1}`.slice(-2);
  const day = `0${date0.getDate()}`.slice(-2);
  return [day, month, date0.getFullYear()].join('-');
};

function convertToUnix(dateString) {
  const date = new Date(dateString);
  const unixTimestamp = date.getTime();
  return unixTimestamp;
}

function convertFromUnix(unixTimestamp) {
  const formattedDate = new Date(unixTimestamp * 1000);
  return formattedDate;
}

const converterTimeStampToDate = (timestamp) => {
  const formattedDate = new Date(parseInt(timestamp));
  return formattedDate;
};

export {
  getAggregate,
  dateFormatted,
  isValidObjectId,
  verifyToken,
  generatePassword,
  generateRandomKey,
  clearCookie,
  comparePassword,
  convertToUnix,
  convertFromUnix,
  converterTimeStampToDate,
  verifyJwtTokenAsync
};
