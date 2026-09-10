import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Website from '../models/Website.js';
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

    // Ensure admin flags for Gnanasekaran / process.env.ADMIN_USERNAME
    const adminName = process.env.ADMIN_USERNAME || 'Gnanasekaran';
    if (user.username === adminName || user.username === 'admin' || user.username === 'Gnanasekaran') {
      if (user.role !== 'admin' || !user.isSuperAdmin) {
        user.role = 'admin';
        user.isSuperAdmin = true;
        await user.save();
      }
    }

    // Create token with fallback secret for cloud deployments
    const jwtSecret = process.env.JWT_SECRET || 'webvaultsupersecretdashkeyjwt';
    const token = jwt.sign({ id: user._id }, jwtSecret, {
      expiresIn: '30d',
    });

    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role || 'user',
        isSuperAdmin: !!user.isSuperAdmin,
        allowedWebsites: user.allowedWebsites || [],
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
// @desc    Direct password reset without OTP (by username or email)
// @route   POST /api/auth/forgot-password/request-otp
// @route   POST /api/auth/forgot-password/reset
// @access  Public
export const requestPasswordResetOtp = async (req, res, next) => {
  try {
    const { username, email, newPassword, confirmPassword } = req.body;
    const identifier = (username || email || '').trim();

    if (!identifier || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide username, new password, and confirm password',
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

    // Find user by username or email
    let user = await User.findOne({
      $or: [
        { username: { $regex: `^${identifier}$`, $options: 'i' } },
        { email: { $regex: `^${identifier}$`, $options: 'i' } },
      ],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: `Account '${identifier}' not found`,
      });
    }

    // Update password directly without requiring OTP
    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword.trim(), salt);
    user.plainPassword = newPassword.trim();
    user.resetOtp = null;
    user.resetOtpExpires = null;
    user.pendingPasswordHash = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: `Password updated successfully for account '${user.username}'! Please log in with your new password.`,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify OTP and finalize password change (legacy compatibility)
// @route   POST /api/auth/forgot-password/verify-otp
// @access  Public
export const verifyPasswordResetOtp = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Password updated directly.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update profile details & password for logged-in user (without requiring current password)
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req, res, next) => {
  try {
    const { username, email, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if new username is already taken by another user
    if (username && username.trim() !== user.username) {
      const existingUser = await User.findOne({ username: username.trim() });
      if (existingUser && existingUser._id.toString() !== user._id.toString()) {
        return res.status(400).json({ success: false, message: 'Username is already taken' });
      }
      user.username = username.trim();
    }

    if (email) {
      user.email = email.toLowerCase().trim();
    }

    // Handle direct password update based on username without asking for current password
    if (newPassword && newPassword.trim()) {
      if (newPassword.trim().length < 6) {
        return res.status(400).json({
          success: false,
          message: 'New password must be at least 6 characters long',
        });
      }

      const salt = await bcrypt.genSalt(10);
      user.passwordHash = await bcrypt.hash(newPassword.trim(), salt);
      user.plainPassword = newPassword.trim();
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile & password updated successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isSuperAdmin: !!user.isSuperAdmin,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get list of all users (for Admin access management)
// @route   GET /api/auth/users
// @access  Private (Admin)
export const getUsers = async (req, res, next) => {
  try {
    const users = await User.find({}).select('-passwordHash -resetOtp -pendingPasswordHash').populate('allowedWebsites', 'name url category');
    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create/Add a new user/admin account
// @route   POST /api/auth/users
// @access  Private (Admin)
export const createUser = async (req, res, next) => {
  try {
    const { username, email, password, role = 'user', allowedWebsites = [] } = req.body;

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
      email: email ? email.toLowerCase().trim() : 'user@webvault.com',
      passwordHash,
      plainPassword: password.trim(),
      role: role === 'admin' ? 'admin' : 'user',
      isSuperAdmin: false,
      allowedWebsites: Array.isArray(allowedWebsites) ? allowedWebsites : [],
    });

    if (Array.isArray(allowedWebsites) && allowedWebsites.length > 0) {
      await Website.updateMany(
        { _id: { $in: allowedWebsites } },
        { $addToSet: { allowedUsers: newUser._id } }
      );
    }

    const populatedUser = await User.findById(newUser._id).select('-passwordHash').populate('allowedWebsites', 'name url category');

    res.status(201).json({
      success: true,
      message: `User '${newUser.username}' created successfully!`,
      user: populatedUser,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user access permissions, role & password
// @route   PUT /api/auth/users/:id/access
// @access  Private (Admin)
export const updateUserAccess = async (req, res, next) => {
  try {
    const { role, allowedWebsites, newPassword } = req.body;
    const userToUpdate = await User.findById(req.params.id);

    if (!userToUpdate) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (role && ['admin', 'user'].includes(role)) {
      // Prevent demoting SuperAdmin
      if (!userToUpdate.isSuperAdmin) {
        userToUpdate.role = role;
      }
    }

    if (Array.isArray(allowedWebsites)) {
      const oldAllowedWebsites = (userToUpdate.allowedWebsites || []).map((id) => id.toString());
      userToUpdate.allowedWebsites = allowedWebsites;
      const newAllowedWebsites = allowedWebsites.map((id) => id.toString());

      // Add user ID to website.allowedUsers for newly assigned websites
      await Website.updateMany(
        { _id: { $in: newAllowedWebsites } },
        { $addToSet: { allowedUsers: userToUpdate._id } }
      );

      // Remove user ID from website.allowedUsers for unassigned websites
      const removedWebsiteIds = oldAllowedWebsites.filter((id) => !newAllowedWebsites.includes(id));
      if (removedWebsiteIds.length > 0) {
        await Website.updateMany(
          { _id: { $in: removedWebsiteIds } },
          { $pull: { allowedUsers: userToUpdate._id } }
        );
      }
    }

    if (newPassword && newPassword.trim().length >= 6) {
      const salt = await bcrypt.genSalt(10);
      userToUpdate.passwordHash = await bcrypt.hash(newPassword.trim(), salt);
      userToUpdate.plainPassword = newPassword.trim();
    }

    await userToUpdate.save();

    const updatedUser = await User.findById(userToUpdate._id)
      .select('-passwordHash')
      .populate('allowedWebsites', 'name url category');

    res.status(200).json({
      success: true,
      message: `Permissions updated for '${updatedUser.username}'`,
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a sub-user account
// @route   DELETE /api/auth/users/:id
// @access  Private (Admin)
export const deleteUser = async (req, res, next) => {
  try {
    const userToDelete = await User.findById(req.params.id);

    if (!userToDelete) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (userToDelete.isSuperAdmin || userToDelete._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete Super Admin or current active user account',
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: `User '${userToDelete.username}' deleted successfully`,
    });
  } catch (error) {
    next(error);
  }
};


