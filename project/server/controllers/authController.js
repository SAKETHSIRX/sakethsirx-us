import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { dbGet, dbRun } from '../config/database-manager.js';
import { queries, getInsertId } from '../utils/queryHelper.js';
import { sendVerificationCode } from '../services/email.js';

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' } // Token expires in 7 days
  );
};

// Generate 6-digit numeric OTP
const generateOTP = (length = 6) => {
  return Math.floor(Math.random() * Math.pow(10, length))
    .toString()
    .padStart(length, '0');
};

const setOtpForUser = async (userId) => {
  const code = generateOTP(6);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes
  await dbRun(queries.setVerificationData, [code, expiresAt, userId]);
  return { code, expiresAt };
};

// Sign up controller (send email verification OTP)
export const signUp = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await dbGet(queries.checkUserExists, [email]);
    
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const result = await dbRun(queries.insertUser, [name, email, hashedPassword]);
    const userId = getInsertId(result);

    // Generate and store email verification OTP
    const { code } = await setOtpForUser(userId);
    await sendVerificationCode(email, code);

    return res.status(201).json({
      success: true,
      message: 'Account created. Verification code sent to your email.',
    });

  } catch (error) {
    console.error('Sign up error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during sign up'
    });
  }
};

// Verify email after signup
export const verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body;

    const user = await dbGet(queries.findUserByEmail, [email]);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.email_verified) {
      return res.status(400).json({ success: false, message: 'Email already verified' });
    }

    if (!user.verification_code || !user.verification_expires) {
      return res.status(400).json({ success: false, message: 'No verification code found. Please request a new code.' });
    }

    const now = Date.now();
    const exp = new Date(user.verification_expires).getTime();
    if (user.verification_code !== code || now > exp) {
      return res.status(400).json({ success: false, message: 'Invalid or expired code' });
    }

    await dbRun(queries.markEmailVerified, [user.id]);

    return res.json({ success: true, message: 'Email verified successfully. You can now sign in.' });

  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Resend email verification code
export const resendEmailCode = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await dbGet(queries.findUserByEmail, [email]);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.email_verified) {
      return res.status(400).json({ success: false, message: 'Email already verified' });
    }

    const { code } = await setOtpForUser(user.id);
    await sendVerificationCode(email, code);

    return res.json({ success: true, message: 'Verification code resent to your email.' });

  } catch (error) {
    console.error('Resend email code error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Sign in step 1: check password and send login OTP (requires email verified)
export const signIn = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await dbGet(queries.findUserByEmail, [email]);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    if (!user.is_active) {
      return res.status(401).json({ success: false, message: 'Account is deactivated. Please contact support.' });
    }

    // Require email verification first
    if (!user.email_verified) {
      return res.status(401).json({ success: false, message: 'Please verify your email before signing in.' });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Send login OTP
    const { code } = await setOtpForUser(user.id);
    await sendVerificationCode(user.email, code);

    return res.json({ success: true, message: 'Login code sent to your email.' });

  } catch (error) {
    console.error('Sign in error:', error);
    res.status(500).json({ success: false, message: 'Internal server error during sign in' });
  }
};

// Sign in step 2: verify login OTP and return JWT
export const signInVerify = async (req, res) => {
  try {
    const { email, code } = req.body;

    const user = await dbGet(queries.findUserByEmail, [email]);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or code' });
    }

    if (!user.is_active) {
      return res.status(401).json({ success: false, message: 'Account is deactivated. Please contact support.' });
    }

    if (!user.email_verified) {
      return res.status(401).json({ success: false, message: 'Please verify your email first.' });
    }

    if (!user.verification_code || !user.verification_expires) {
      return res.status(400).json({ success: false, message: 'No login code found. Please sign in again.' });
    }

    const now = Date.now();
    const exp = new Date(user.verification_expires).getTime();
    if (user.verification_code !== code || now > exp) {
      return res.status(400).json({ success: false, message: 'Invalid or expired code' });
    }

    // Clear OTP and update last login
    await dbRun(queries.clearVerificationData, [user.id]);
    await dbRun(queries.updateLastLogin, [user.id]);

    // Generate token
    const token = generateToken(user.id);
    const { password: _, verification_code, verification_expires, ...userWithoutSensitive } = user;

    return res.json({
      success: true,
      message: 'Signed in successfully',
      data: {
        user: userWithoutSensitive,
        token
      }
    });

  } catch (error) {
    console.error('Sign in verify error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get current user profile
export const getProfile = async (req, res) => {
  try {
    const user = await dbGet(
      'SELECT id, name, email, created_at, last_login FROM users WHERE id = ?',
      [req.user.id]
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, data: { user } });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Update user profile
export const updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    const userId = req.user.id;

    if (email && email !== req.user.email) {
      const existingUser = await dbGet(
        queries.checkEmailExists,
        [email, userId]
      );
      
      if (existingUser) {
        return res.status(409).json({ success: false, message: 'Email is already taken by another user' });
      }
    }

    const fields = { name: !!name, email: !!email };
    const updates = [];
    const values = [];

    if (name) { updates.push('name'); values.push(name); }
    if (email) { updates.push('email'); values.push(email); }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields to update' });
    }

    // Build query using helper to support both SQLite and Postgres
    const updateSql = queries.updateUserProfile({ name, email });
    values.push(userId);

    await dbRun(updateSql, values);

    const updatedUser = await dbGet(
      'SELECT id, name, email, created_at, updated_at FROM users WHERE id = ?',
      [userId]
    );

    res.json({ success: true, message: 'Profile updated successfully', data: { user: updatedUser } });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Change password
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    const user = await dbGet(
      'SELECT password FROM users WHERE id = ?',
      [userId]
    );

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    await dbRun(queries.updatePassword, [hashedNewPassword, userId]);

    res.json({ success: true, message: 'Password changed successfully' });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Sign out (client-side token removal, but we can log it)
export const signOut = async (req, res) => {
  try {
    res.json({ success: true, message: 'Signed out successfully' });
  } catch (error) {
    console.error('Sign out error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
