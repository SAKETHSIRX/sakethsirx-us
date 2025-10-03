import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  signUp,
  signIn,
  signInVerify,
  verifyEmail,
  resendEmailCode,
  getProfile,
  updateProfile,
  changePassword,
  signOut
} from '../controllers/authController.js';
import {
  validateSignUp,
  validateSignIn,
  validateUpdateProfile,
  validateChangePassword
} from '../middleware/validation.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    success: false,
    message: 'Too many requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Per-email key generator for rate limits
const emailKey = (req, res) => {
  const email = (req.body && req.body.email) ? String(req.body.email).toLowerCase() : null;
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
  return email || ip;
};

// Resend cooldown: 30 seconds per email
const resendLimiter = rateLimit({
  windowMs: 30 * 1000,
  max: 1,
  message: {
    success: false,
    message: 'Too many requests. Please wait 30 seconds before requesting another code.'
  },
  keyGenerator: emailKey,
  standardHeaders: true,
  legacyHeaders: false,
});

// OTP verification attempts: 10 per hour per email
const otpAttemptsLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: 'Too many attempts. Please try again in 1 hour.'
  },
  keyGenerator: emailKey,
  standardHeaders: true,
  legacyHeaders: false,
});

// Public routes (with rate limiting)
router.post('/signup', authLimiter, validateSignUp, signUp);
router.post('/verify-email', otpAttemptsLimiter, verifyEmail);
router.post('/resend-code', resendLimiter, resendEmailCode);
router.post('/signin', authLimiter, validateSignIn, signIn);
router.post('/signin/verify', otpAttemptsLimiter, signInVerify);

// Protected routes (require authentication)
router.get('/profile', generalLimiter, authenticateToken, getProfile);
router.put('/profile', generalLimiter, authenticateToken, validateUpdateProfile, updateProfile);
router.put('/change-password', generalLimiter, authenticateToken, validateChangePassword, changePassword);
router.post('/signout', generalLimiter, authenticateToken, signOut);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Auth service is running',
    timestamp: new Date().toISOString()
  });
});

// Development endpoint to view all users (remove in production)
router.get('/admin/users', async (req, res) => {
  try {
    const db = req.app.get('db');
    const result = await db.query(`
      SELECT 
        id, 
        name, 
        email, 
        created_at, 
        updated_at, 
        is_active, 
        last_login 
      FROM users 
      ORDER BY created_at DESC
    `);
    
    res.json({
      success: true,
      message: 'Users retrieved successfully',
      data: {
        users: result.rows,
        total: result.rows.length
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
});

export default router;