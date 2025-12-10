import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { config } from '../config/index.js';
import { JwtPayload } from '../types/index.js';

// Hash password
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

// Verify password
export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

// Generate access token (short-lived)
export const generateAccessToken = (payload: Omit<JwtPayload, 'type'>): string => {
  const expiresInMs = parseExpiry(config.JWT_ACCESS_EXPIRY);
  return jwt.sign(
    { ...payload, type: 'access' },
    config.JWT_SECRET,
    { expiresIn: Math.floor(expiresInMs / 1000) }
  );
};

// Generate refresh token (long-lived)
export const generateRefreshToken = (payload: Omit<JwtPayload, 'type'>): string => {
  const expiresInMs = parseExpiry(config.JWT_REFRESH_EXPIRY);
  return jwt.sign(
    { ...payload, type: 'refresh' },
    config.JWT_SECRET,
    { expiresIn: Math.floor(expiresInMs / 1000) }
  );
};

// Verify token
export const verifyToken = (token: string): JwtPayload | null => {
  try {
    return jwt.verify(token, config.JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
};

// Parse expiry string to milliseconds
export const parseExpiry = (expiry: string): number => {
  const match = expiry.match(/^(\d+)(s|m|h|d)$/);
  if (!match) return 15 * 60 * 1000; // Default 15 minutes
  
  const value = parseInt(match[1], 10);
  const unit = match[2];
  
  switch (unit) {
    case 's': return value * 1000;
    case 'm': return value * 60 * 1000;
    case 'h': return value * 60 * 60 * 1000;
    case 'd': return value * 24 * 60 * 60 * 1000;
    default: return 15 * 60 * 1000;
  }
};
