const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Review = require('../models/Review');
const { BOOKING_STATUS, normalizeBookingStatus } = require('../constants/bookingStatus');
const Provider = require('../models/Provider');
const emailService = require('../services/emailService');
const { cleanObject } = require('../utils/sanitizeInput');

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

    // Send Welcome Email (Non-blocking)
    emailService.sendWelcome(user.email, user.name);

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
    console.log('[DEBUG_LOGIN] Request received:', req.body.email);
    let { email, password } = req.body;

    // SECURITY FIX: Validate primitive types to block NoSQL objects
    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      console.log('[DEBUG_LOGIN] Invalid input types');
      return res.status(400).json({ success: false, message: 'Valid email and password are required' });
    }
    
    email = email.trim().toLowerCase();

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      console.log('[DEBUG_LOGIN] User not found');
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    console.log('[DEBUG_LOGIN] User found, validating password...');

    if (!(await user.comparePassword(password))) {
      console.log('[DEBUG_LOGIN] Password mismatch');
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    console.log('[DEBUG_LOGIN] Password valid');

    if (!user.isActive) {
      console.log('[DEBUG_LOGIN] User inactive');
      return res.status(403).json({ success: false, message: 'Account is suspended' });
    }

    // Issue tokens directly - 2FA is temporarily disabled
    console.log('[DEBUG_LOGIN] Generating tokens...');
    const { accessToken, refreshToken } = generateTokens(user._id);
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    console.log('[DEBUG_LOGIN] Tokens saved to user');

    // Remove password from output
    user.password = undefined;

    // SAFE ENRICHMENT: Only fetch provider profile if user is a provider
    let providerProfile = null;
    if (user.role === 'provider') {
      console.log('[DEBUG_LOGIN] Fetching provider profile...');
      const Provider = require('../models/Provider');
      providerProfile = await Provider.findOne({ user: user._id });
      console.log('[DEBUG_LOGIN] Provider profile found:', !!providerProfile);
    }

    console.log('[DEBUG_LOGIN] Sending success response');
    res.json({
      success: true,
      message: 'Login successful',
      data: { user, accessToken, refreshToken, providerProfile },
    });
  } catch (err) {
    console.error('[DEBUG_LOGIN] ERROR:', err);
    next(err);
  }
};

// @GET /api/auth/me
exports.getMe = async (req, res, next) => {
  try {
    console.log('[DEBUG_GETME] Request received for user ID:', req.user?._id);
    if (!req.user) {
      console.log('[DEBUG_GETME] req.user is undefined');
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      console.log('[DEBUG_GETME] User not found in DB');
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    console.log('[DEBUG_GETME] User found:', user.email);

    let providerProfile = null;
    if (user.role === 'provider') {
      console.log('[DEBUG_GETME] Fetching provider profile...');
      providerProfile = await Provider.findOne({ user: user._id });
      console.log('[DEBUG_GETME] Provider profile found:', !!providerProfile);
    }

    if (!user.referralCode) {
      console.log('[DEBUG_GETME] Generating referral code...');
      user.referralCode = `CARE${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      await user.save({ validateBeforeSave: false });
      console.log('[DEBUG_GETME] Referral code saved');
    }

    console.log('[DEBUG_GETME] Sending success response');
    res.json({ success: true, data: { user, providerProfile } });
  } catch (err) {
    console.error('[DEBUG_GETME] ERROR:', err);
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
    const { 
      name, phone, address, pincode,
      dob, gender, emergencyContact,
      addressType, city, locality, landmark, houseNo, coords
    } = req.body;

    const profileUpdate = cleanObject({
      name, phone, address, pincode,
      dob, gender, emergencyContact,
      addressType, city, locality, landmark, houseNo, coords
    }, {
      name: { type: 'string', maxLength: 80 },
      phone: { type: 'string', maxLength: 10 },
      address: { type: 'string', maxLength: 500 },
      pincode: { type: 'string', maxLength: 6 },
      dob: { type: 'string', maxLength: 30 },
      gender: { type: 'string', maxLength: 20 },
      emergencyContact: {
        type: 'object',
        schema: {
          name: { type: 'string', maxLength: 80 },
          relationship: { type: 'string', maxLength: 40 },
          phone: { type: 'string', maxLength: 10 },
        },
      },
      addressType: { type: 'string', maxLength: 20 },
      city: { type: 'string', maxLength: 80 },
      locality: { type: 'string', maxLength: 120 },
      landmark: { type: 'string', maxLength: 120 },
      houseNo: { type: 'string', maxLength: 80 },
      coords: {
        type: 'object',
        schema: {
          lat: { type: 'number' },
          lng: { type: 'number' },
        },
      },
    });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      profileUpdate,
      { new: true, runValidators: true }
    );
    res.json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
};

// @POST /api/auth/avatar
exports.uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const url = req.file.path || req.file.secure_url || req.file.url;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: url },
      { new: true }
    );

    res.json({ success: true, message: 'Avatar uploaded successfully', data: { user } });
  } catch (err) {
    next(err);
  }
};

// @DELETE /api/auth/avatar
exports.removeAvatar = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: null },
      { new: true }
    );

    res.json({ success: true, message: 'Avatar removed successfully', data: { user } });
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

    try {
      await emailService.sendPasswordReset(user.email, user.name, resetUrl);
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

// @GET /api/auth/referrals
exports.getReferrals = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user.referralCode) {
      user.referralCode = `CARE${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      await user.save({ validateBeforeSave: false });
    }

    // Find users referred by this user
    const referredUsers = await User.find({ referredByCode: user.referralCode })
      .select('name createdAt role')
      .lean();

    // Map to history format
    // In a real system, we'd check their bookings to see if "Reward Unlocked"
    // For now, we'll return a calculated status
    const Booking = require('../models/Booking');
    
    const history = await Promise.all(referredUsers.map(async (u) => {
      // Logic: 
      // - Pending: Just registered
      // - Booked: Has at least one booking
      // - Completed: Has at least one completed booking
      // - Reward Unlocked: (Same as completed for now)
      
      const bookings = await Booking.find({ patient: u._id });
      let status = 'Pending';
      let rewardStatus = 'Locked';

      if (bookings.length > 0) {
        status = 'Booked';
        const hasCompleted = bookings.some(b => normalizeBookingStatus(b.status) === BOOKING_STATUS.COMPLETED);
        if (hasCompleted) {
          status = 'Completed';
          rewardStatus = 'Unlocked';
        }
      }

      return {
        name: u.name,
        date: u.createdAt,
        status,
        rewardStatus
      };
    }));

    res.json({
      success: true,
      data: {
        referralCode: user.referralCode,
        referralLink: `${process.env.CLIENT_URL || 'http://localhost:5173'}/register?ref=${user.referralCode}`,
        stats: {
          total: history.length,
          successful: history.filter(h => normalizeBookingStatus(h.status) === BOOKING_STATUS.COMPLETED).length,
          pending: history.filter(h => h.status !== 'Completed').length,
          rewards: history.filter(h => h.rewardStatus === 'Unlocked').length
        },
        history
      }
    });
  } catch (err) {
    next(err);
  }
};
