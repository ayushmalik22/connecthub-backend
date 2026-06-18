import User from '../models/User.js';
import OTP from '../models/OTP.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { generateToken } from '../utils/jwt.js';
import { sendOTPEmail, sendPasswordResetEmail } from '../utils/nodemailer.js';

const SALT_ROUNDS = 12;

/**
 * Send OTP for email verification
 * POST /api/auth/send-otp
 */
export const sendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    // Validation: Email must end with @gmail.com
    if (!email || !email.endsWith('@gmail.com')) {
      return res.status(400).json({
        success: false,
        message: 'Only Gmail addresses are supported',
      });
    }

    // Normalize email for checking
    const normalizedEmail = email.toLowerCase().replace(/\./g, '').split('@')[0] + '@gmail.com';

    // Check if email already exists in User collection (using normalized email)
    const existingUser = await User.findOne({ emailNormalized: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'This email is already registered',
      });
    }

    // Rate limit check: If OTP was sent less than 60 seconds ago
    const recentOTP = await OTP.findOne({
      email: email.toLowerCase(),
      createdAt: { $gte: new Date(Date.now() - 60 * 1000) }
    });

    if (recentOTP) {
      return res.status(429).json({
        success: false,
        message: 'Please wait 60 seconds before requesting another OTP',
      });
    }

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash the OTP with bcrypt
    const hashedOTP = await bcrypt.hash(otpCode, SALT_ROUNDS);

    // Save OTP to database
    await OTP.findOneAndUpdate(
      { email: email.toLowerCase() },
      { email: email.toLowerCase(), otp: hashedOTP, attempts: 0 },
      { upsert: true, new: true }
    );

    // Send OTP via email with timeout protection
    try {
      await Promise.race([
        sendOTPEmail(email, otpCode),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Email sending timeout')), 15000)
        )
      ]);
    } catch (emailError) {
      console.error('Email sending failed or timed out:', emailError.message);
      // Continue anyway - OTP is saved in database, user can request again if needed
      // Don't fail the entire request just because email failed
    }

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully to your email',
      developmentOTP: process.env.NODE_ENV === 'production' ? otpCode : otpCode
    });
  } catch (error) {
    console.error('Send OTP error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error sending OTP',
      error: error.message,
    });
  }
};

/**
 * Register a new user with OTP verification
 * POST /api/auth/register
 */
export const register = async (req, res) => {
  try {
    const { username, email, password, otp } = req.body;

    // Validation
    if (!username || !email || !password || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Please provide username, email, password, and OTP',
      });
    }

    // Email validation: Must end with @gmail.com
    if (!email.endsWith('@gmail.com')) {
      return res.status(400).json({
        success: false,
        message: 'Only Gmail addresses are supported',
      });
    }

    // Password complexity validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters with 1 uppercase, 1 lowercase, 1 number, and 1 special character',
      });
    }

    // Username validation (regex and reserved names)
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    const reservedNames = ['admin', 'support', 'connecthub', 'official', 'system', 'moderator'];
    if (!usernameRegex.test(username)) {
      return res.status(400).json({
        success: false,
        message: 'Username must be 3-20 characters (letters, numbers, underscores only)',
      });
    }
    if (reservedNames.includes(username.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'This username is reserved and cannot be used',
      });
    }

    // Check if username or email already exists
    const existingUser = await User.findOne({
      $or: [
        { usernameLower: username.toLowerCase() },
        { emailNormalized: email.toLowerCase().replace(/\./g, '').split('@')[0] + '@gmail.com' }
      ]
    });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email or username already exists',
      });
    }

    // OTP Validation
    const otpRecord = await OTP.findOne({ email: email.toLowerCase() }).select('+otp');
    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP. Please request a new one.',
      });
    }

    // Compare OTP with hashed version
    const isOTPValid = await bcrypt.compare(otp, otpRecord.otp);
    if (!isOTPValid) {
      // Increment attempts
      otpRecord.attempts += 1;
      if (otpRecord.attempts >= 3) {
        await OTP.deleteOne({ email: email.toLowerCase() });
        return res.status(400).json({
          success: false,
          message: 'Too many invalid attempts. Please request a new OTP.',
        });
      }
      await otpRecord.save();
      return res.status(400).json({
        success: false,
        message: `Invalid OTP. ${3 - otpRecord.attempts} attempts remaining.`,
      });
    }

    // Create new user with isVerified: true
    const newUser = new User({
      username,
      email,
      password,
      isVerified: true,
    });

    await newUser.save();

    // Delete OTP record after successful registration
    await OTP.deleteOne({ email: email.toLowerCase() });

    // Generate token
    const token = generateToken(newUser._id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        isVerified: newUser.isVerified,
      },
    });
  } catch (error) {
    console.error('Registration error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error registering user',
      error: error.message,
    });
  }
};

/**
 * Login user
 * POST /api/auth/login
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email/username and password',
      });
    }

    // Find user by email or username (include password for comparison)
    const user = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { usernameLower: email.toLowerCase() }
      ]
    }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Verify user is verified
    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email before logging in',
      });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error logging in',
      error: error.message,
    });
  }
};

/**
 * Forgot password - send reset email
 * POST /api/auth/forgot-password
 */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Validation
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your email',
      });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email',
      });
    }

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Set token and expiration (1 hour)
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await user.save();

    // Send reset email
    await sendPasswordResetEmail(user.email, resetToken);

    res.status(200).json({
      success: true,
      message: 'Password reset email sent successfully',
    });
  } catch (error) {
    console.error('Forgot password error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error processing password reset request',
      error: error.message,
    });
  }
};

/**
 * Reset password with token
 * POST /api/auth/reset-password/:token
 */
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // Validation
    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a new password',
      });
    }

    // Password complexity validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters with 1 uppercase, 1 lowercase, 1 number, and 1 special character',
      });
    }

    // Find user by reset token and check expiration
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() }
    }).select('+resetPasswordToken +resetPasswordExpires');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token',
      });
    }

    // Update password (pre-save hook will hash it)
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error) {
    console.error('Reset password error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error resetting password',
      error: error.message,
    });
  }
};
