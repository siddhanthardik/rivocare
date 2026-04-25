const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Provider = require('../models/Provider');
const sendEmail = require('../utils/sendEmail');

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  });
  const refreshToken = jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });
  return { accessToken, refreshToken };
};

// @POST /api/auth/register
// Temporarily disabled 2FA - users are created with is2FAEnabled: false
exports.register = async (req, res, next) => {
  try {
    let { name, email, password, role, phone, pincode, services, acceptedTerms, ref } = req.body;
    
    // SECURITY FIX: Prevent NoSQL Injection via objects
    if (email && typeof email === 'string') {
      email = email.trim().toLowerCase();
    } else if (email) {
      return res.status(400).json({ success: false, message: 'Invalid email format' });
    }

    if (!acceptedTerms) {
      return res.status(400).json({ success: false, message: 'You must accept the terms and conditions to register.' });
    }

    if (phone && typeof phone !== 'string') {
      return res.status(400).json({ success: false, message: 'Invalid phone format' });
    }

    const existingUser = await User.findOne({ 
      $or: [{ email }, { phone }] 
    });
    
    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(409).json({ success: false, message: 'Email already registered' });
      }
      return res.status(409).json({ success: false, message: 'Phone number already registered' });
    }

    // Create user with is2FAEnabled: false (2FA temporarily disabled)
    const user = await User.create({ 
      name, 
      email, 
      password, 
      role: role || 'patient', 
      phone, 
      pincode,
      acceptedTerms,
      is2FAEnabled: false,
      referredByCode: ref || null,
      referralCode: `CARE${Math.random().toString(36).slice(2, 8).toUpperCase()}`
    });

    // If registering as provider, create provider profile
    if (user.role === 'provider') {
      await Provider.create({
        user: user._id,
        services: services || [],
        pincodesServed: pincode ? [pincode] : [],
      });
    }

    // Temporarily disabled 2FA - issue tokens immediately
    const { accessToken, refreshToken } = generateTokens(user._id);
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: { user, accessToken, refreshToken },
    });
  } catch (err) {
    next(err);
  }
};

// @POST /api/auth/login
// Temporarily disabled 2FA - tokens issued immediately after password verification
exports.login = async (req, res, next) => {
  try {
    let { email, password } = req.body;

    // SECURITY FIX: Validate primitive types to block NoSQL objects
    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ success: false, message: 'Valid email and password are required' });
    }
    
    email = email.trim().toLowerCase();

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is suspended' });
    }

    // Issue tokens directly - 2FA is temporarily disabled
    const { accessToken, refreshToken } = generateTokens(user._id);
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    // Remove password from output
    user.password = undefined;

    res.json({
      success: true,
      message: 'Login successful',
      data: { user, accessToken, refreshToken },
    });
  } catch (err) {
    next(err);
  }
};

// @GET /api/auth/me
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    let providerProfile = null;

    if (user.role === 'provider') {
      providerProfile = await Provider.findOne({ user: user._id });
    }

    if (!user.referralCode) {
      user.referralCode = `CARE${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      await user.save({ validateBeforeSave: false });
    }

    res.json({ success: true, data: { user, providerProfile } });
  } catch (err) {
    next(err);
  }
};

// @POST /api/auth/refresh-token
exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken || typeof refreshToken !== 'string') {
      return res.status(400).json({ success: false, message: 'Refresh token required' });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id).select('+refreshToken');

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }

    const tokens = generateTokens(user._id);
    user.refreshToken = tokens.refreshToken;
    await user.save({ validateBeforeSave: false });

    res.json({ success: true, data: tokens });
  } catch (err) {
    next(err);
  }
};

// @POST /api/auth/logout
exports.logout = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
};

// @PUT /api/auth/profile
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone, address, pincode } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone, address, pincode },
      { new: true, runValidators: true }
    );
    res.json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
};

// @POST /api/auth/verify-otp
exports.verifyOTP = async (req, res, next) => {
  try {
    return res.status(403).json({ 
      success: false, 
      message: '2FA is currently disabled. Please login directly with email and password.' 
    });
  } catch (err) {
    next(err);
  }
};

// @POST /api/auth/resend-otp
exports.resendOTP = async (req, res, next) => {
  try {
    return res.status(403).json({ 
      success: false, 
      message: '2FA is currently disabled. Please login directly with email and password.' 
    });
  } catch (err) {
    next(err);
  }
};

// @POST /api/auth/forgot-password
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ success: false, message: 'Valid email required' });
    }
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: 'There is no user with that email' });

    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;
    const message = `You are receiving this email because you (or someone else) requested to reset the password for your RIVO account.\n\nPlease make a put request to:\n\n${resetUrl}\n\nIgnore this email if it wasn't requested by you.`;

    try {
      await sendEmail({ email: user.email, subject: 'RIVO - Password Reset', message });
      res.json({ success: true, message: 'Email sent successfully' });
    } catch (err) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      return res.status(500).json({ success: false, message: 'Email could not be sent' });
    }
  } catch (err) {
    next(err);
  }
};

// @PUT /api/auth/reset-password/:token
exports.resetPassword = async (req, res, next) => {
  try {
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({ 
      resetPasswordToken, 
      resetPasswordExpire: { $gt: Date.now() } 
    }).select('+password');

    if (!user) return res.status(400).json({ success: false, message: 'Invalid or expired token' });

    if (!req.body.password || typeof req.body.password !== 'string' || req.body.password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    
    // SECURITY FIX: Invalidate active refresh tokens to stop stolen session hijacking
    user.refreshToken = null; 
    
    await user.save(); // 'save' hook will run to hash the new password

    res.json({ success: true, message: 'Password successfully reset' });
  } catch (err) {
    next(err);
  }
};
