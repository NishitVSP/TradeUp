import { Request, Response } from 'express';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import { hashPassword, comparePassword, generateToken } from '../utils/auth';
import { logger } from '../utils/logger';

interface RegisterRequest {
  userName: string;
  email: string;
  password: string;
  phoneNumber?: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Register a new user
 */
export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { userName, email, password, phoneNumber }: RegisterRequest = req.body;

    // Validation
    if (!userName || !email || !password) {
      res.status(400).json({
        success: false,
        message: 'User name, email, and password are required'
      });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
      return;
    }

    const db = await open({
      filename: './data/tradeup.db',
      driver: sqlite3.Database
    });

    // Check if user already exists
    const existingUser = await db.get(
      'SELECT user_id FROM users WHERE email = ?',
      [email]
    );

    if (existingUser) {
      await db.close();
      res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
      return;
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Insert new user
    const result = await db.run(
      `INSERT INTO users (user_name, email, hashed_password, phone_number)
       VALUES (?, ?, ?, ?)`,
      [userName, email, hashedPassword, phoneNumber || null]
    );

    await db.close();

    if (!result.lastID) {
      res.status(500).json({
        success: false,
        message: 'Failed to create user'
      });
      return;
    }

    // Generate token
    const token = generateToken(result.lastID, email);

    logger.info(`New user registered: ${email}`);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        userId: result.lastID,
        userName,
        email,
        phoneNumber: phoneNumber || null,
        token
      }
    });

  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}

/**
 * Login user
 */
export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password }: LoginRequest = req.body;

    // Validation
    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
      return;
    }

    const db = await open({
      filename: './data/tradeup.db',
      driver: sqlite3.Database
    });

    // Find user
    const user = await db.get(
      `SELECT user_id, user_name, email, hashed_password, phone_number, balance
       FROM users WHERE email = ?`,
      [email]
    );

    await db.close();

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
      return;
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.hashed_password);

    if (!isValidPassword) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
      return;
    }

    // Generate token
    const token = generateToken(user.user_id, user.email);

    logger.info(`User logged in: ${email}`);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        userId: user.user_id,
        userName: user.user_name,
        email: user.email,
        phoneNumber: user.phone_number,
        balance: user.balance,
        token
      }
    });

  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}

/**
 * Get current user profile
 */
export async function getProfile(req: any, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    const db = await open({
      filename: './data/tradeup.db',
      driver: sqlite3.Database
    });

    const user = await db.get(
      `SELECT user_id, user_name, email, phone_number, balance, created_at
       FROM users WHERE user_id = ?`,
      [userId]
    );

    await db.close();

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    res.json({
      success: true,
      data: user
    });

  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}
