import express from 'express';
import { register, login, sendOTP, forgotPassword, resetPassword } from '../controllers/authController.js';

const router = express.Router();

/**
 * POST /api/auth/send-otp
 * Send OTP for email verification
 */
router.post('/send-otp', sendOTP);

/**
 * POST /api/auth/register
 * Register a new user with OTP verification
 */
router.post('/register', register);

/**
 * POST /api/auth/login
 * Login user and receive JWT token
 */
router.post('/login', login);

/**
 * POST /api/auth/forgot-password
 * Request password reset email
 */
router.post('/forgot-password', forgotPassword);

/**
 * POST /api/auth/reset-password/:token
 * Reset password with token
 */
router.post('/reset-password/:token', resetPassword);

export default router;