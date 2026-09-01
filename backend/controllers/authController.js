import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { sendOtpEmail } from '../services/emailService.js';

// @desc    Authenticate admin & get token
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // Validate inputs
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both username and password',
      });
    }

    // Check for user
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Create token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '30d',
    });

    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res, next) => {
  try {
    // req.user is attached by auth middleware
    res.status(200).json({
      success: true,
      data: req.user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Request password reset OTP via Brevo email
// @route   POST /api/auth/forgot-password/request-otp
// @access  Public
export const requestPasswordResetOtp = async (req, res, next) => {
  try {
    const { email, newPassword, confirmPassword } = req.body;

    if (!email || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email, new password, and confirm password',
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password and confirm password do not match',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
    }

    // Find admin user (or match by email)
    let user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Single admin portal fallback: find primary admin user
      user = await User.findOne({ username: process.env.ADMIN_USERNAME || 'admin' });
      if (!user) {
        user = await User.findOne({});
      }
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found',
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Hash pending password
    const salt = await bcrypt.genSalt(10);
    const pendingHash = await bcrypt.hash(newPassword, salt);

    // Save fields on user document
    user.email = email.toLowerCase();
    user.resetOtp = otp;
    user.resetOtpExpires = otpExpires;
    user.pendingPasswordHash = pendingHash;
    await user.save();

    // Dispatch email via Brevo
    const emailResult = await sendOtpEmail({ toEmail: email, otp });

    const responseMsg = emailResult.success
      ? `OTP sent successfully to ${email}. Please check your inbox.`
      : `OTP Code: ${otp} (Brevo Email Blocked: Add your IP to Brevo Authorized IPs)`;

    res.status(200).json({
      success: true,
      message: responseMsg,
      otp: otp,
      emailSent: emailResult.success,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify OTP and finalize password change
// @route   POST /api/auth/forgot-password/verify-otp
// @access  Public
export const verifyPasswordResetOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and OTP',
      });
    }

    // Find user by email or fallback to admin
    let user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      user = await User.findOne({ username: process.env.ADMIN_USERNAME || 'admin' });
      if (!user) {
        user = await User.findOne({});
      }
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found',
      });
    }

    // Check if OTP matches and is not expired
    if (!user.resetOtp || user.resetOtp !== otp.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP code. Please check and try again.',
      });
    }

    if (!user.resetOtpExpires || new Date() > user.resetOtpExpires) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new OTP.',
      });
    }

    if (!user.pendingPasswordHash) {
      return res.status(400).json({
        success: false,
        message: 'No pending password change request found. Please request a new OTP.',
      });
    }

    // Finalize password change
    user.passwordHash = user.pendingPasswordHash;
    user.resetOtp = null;
    user.resetOtpExpires = null;
    user.pendingPasswordHash = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully! Please log in with your new password.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update profile details & password for logged-in user
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req, res, next) => {
  try {
    const { username, email, currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if new username is already taken by another user
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'Username is already taken' });
      }
      user.username = username;
    }

    if (email) {
      user.email = email.toLowerCase();
    }

    // Handle password update if requested
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: 'Please enter your current password to set a new password',
        });
      }

      const isMatch = await user.matchPassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect',
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'New password must be at least 6 characters long',
        });
      }

      const salt = await bcrypt.genSalt(10);
      user.passwordHash = await bcrypt.hash(newPassword, salt);
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create/Add a new user/admin account
// @route   POST /api/auth/users
// @access  Private
export const createUser = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required',
      });
    }

    const existingUser = await User.findOne({ username: username.trim() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Username already exists',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      username: username.trim(),
      email: email ? email.toLowerCase().trim() : 'admin@webvault.com',
      passwordHash,
    });

    res.status(201).json({
      success: true,
      message: `User '${newUser.username}' created successfully!`,
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
      },
    });
  } catch (error) {
    next(error);
  }
};


