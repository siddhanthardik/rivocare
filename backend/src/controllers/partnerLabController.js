const Partner = require('../models/Partner');
const LabProfile = require('../models/LabProfile');
const LabOrder = require('../models/LabOrder');
const LabTest = require('../models/LabTest');
const PartnerStaff = require('../models/PartnerStaff');
const PartnerWallet = require('../models/PartnerWallet');
const jwt = require('jsonwebtoken');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

// @desc    Register Partner
exports.registerPartner = async (req, res, next) => {
  try {
    const { name, email, password, phone, type, labName } = req.body;
    
    let partner = await Partner.findOne({ $or: [{ email }, { phone }] });
    if (partner) return res.status(400).json({ success: false, message: 'Email or phone already exists' });

    partner = await Partner.create({ name, email, password, phone, type });
    
    // Create linked models
    await LabProfile.create({ partner: partner._id, labName });
    await PartnerWallet.create({ partner: partner._id });

    const accessToken = generateToken(partner._id);
    const refreshToken = accessToken; 

    res.status(201).json({
      success: true,
      message: 'Partner registered successfully',
      data: { 
        user: {
          _id: partner._id,
          name: partner.name,
          email: partner.email,
          phone: partner.phone,
          role: 'partner',
          status: partner.status
        },
        accessToken,
        refreshToken
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Login Partner
exports.loginPartner = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const partner = await Partner.findOne({ email }).select('+password');
    if (!partner || !(await partner.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    partner.lastLogin = Date.now();
    await partner.save();

    const accessToken = generateToken(partner._id);
    const refreshToken = accessToken;

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: { 
        user: {
          _id: partner._id,
          name: partner.name,
          email: partner.email,
          phone: partner.phone,
          role: 'partner',
          status: partner.status
        },
        accessToken,
        refreshToken
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get current logged-in partner (for AuthContext hydration)
exports.getMe = async (req, res, next) => {
  try {
    const partner = await Partner.findById(req.partner.id);
    if (!partner) return res.status(404).json({ success: false, message: 'Partner not found' });
    res.status(200).json({
      success: true,
      data: {
        user: {
          _id: partner._id,
          name: partner.name,
          email: partner.email,
          phone: partner.phone,
          role: 'partner',
          status: partner.status,
          type: partner.type,
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get Partner Profile
exports.getProfile = async (req, res, next) => {
  try {
    const profile = await LabProfile.findOne({ partner: req.partner.id });
    res.status(200).json({ success: true, data: { partner: req.partner, profile } });
  } catch (err) {
    next(err);
  }
};

// @desc    Update Partner Profile
exports.updateProfile = async (req, res, next) => {
  try {
    const profile = await LabProfile.findOneAndUpdate(
      { partner: req.partner.id },
      { ...req.body },
      { new: true, runValidators: true, upsert: true }
    );
    res.status(200).json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
};

const PartnerTransaction = require('../models/PartnerTransaction');

const LabReview = require('../models/LabReview');

// @desc    Get Dashboard Stats
exports.getDashboardStats = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const partner = await Partner.findById(req.partner.id);
    const [
      totalOrders,
      todayOrders,
      pendingAction,
      collectedToday,
      reportsPending,
      wallet,
      reviews
    ] = await Promise.all([
      LabOrder.countDocuments({ partner: req.partner.id }),
      LabOrder.countDocuments({ partner: req.partner.id, createdAt: { $gte: today } }),
      LabOrder.countDocuments({ partner: req.partner.id, status: 'new' }),
      LabOrder.countDocuments({ partner: req.partner.id, status: 'sample_collected', updatedAt: { $gte: today } }),
      LabOrder.countDocuments({ partner: req.partner.id, status: 'processing' }),
      PartnerWallet.findOne({ partner: req.partner.id }),
      LabReview.find({ partner: req.partner.id }).sort('-createdAt').limit(5).populate('patient', 'name')
    ]);

    // Monthly Earnings
    const monthlyEarnings = wallet?.totalEarned || 0; 
    
    res.status(200).json({ 
      success: true, 
      data: {
        stats: {
          totalOrders,
          todayOrders,
          pendingAction,
          collectedToday,
          reportsPending,
          balance: wallet?.balance || 0,
          penaltyBalance: partner.penaltyBalance || 0,
          subscriptionPlan: partner.subscriptionPlan,
          monthlyEarnings,
          sla: partner.performanceScore,
          rating: partner.performanceScore / 20, // Simplified conversion
          recentReviews: reviews
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get Financial Summary (Audit-grade, Transaction-based)
exports.getFinancialSummary = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const txns = await PartnerTransaction.find({ partner: req.partner.id, status: 'completed' });

    let availableBalance = 0;
    let todayEarnings = 0;
    let monthlyEarnings = 0;
    let pendingSettlement = 0;

    txns.forEach(tx => {
      if (tx.type === 'credit') {
        availableBalance += tx.netAmount;
        if (tx.createdAt >= today) todayEarnings += tx.netAmount;
        if (tx.createdAt >= firstOfMonth) monthlyEarnings += tx.netAmount;
        // All credits contribute to pending until a debit (settlement) occurs
      } else if (tx.type === 'debit') {
        availableBalance -= tx.netAmount;
      }
    });

    // In this system, availableBalance is essentially what is pending settlement
    pendingSettlement = availableBalance;

    res.status(200).json({
      success: true,
      data: {
        availableBalance: parseFloat(availableBalance.toFixed(2)),
        todayEarnings: parseFloat(todayEarnings.toFixed(2)),
        monthlyEarnings: parseFloat(monthlyEarnings.toFixed(2)),
        pendingSettlement: parseFloat(pendingSettlement.toFixed(2))
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get Orders (with SLA logic)
exports.getOrders = async (req, res, next) => {
  try {
    const { status, timeframe } = req.query;
    let query = { partner: req.partner.id };
    
    if (status && status !== 'all') query.status = status;
    if (timeframe === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      query.createdAt = { $gte: today };
    }

    const orders = await LabOrder.find(query)
      .populate('patient', 'name phone email')
      .populate('tests', 'name price category')
      .populate('assignedStaff', 'name phone')
      .sort('-createdAt');
      
    // Inject dynamic SLA status
    const processedOrders = orders.map(order => {
      const o = order.toObject();
      if (o.slaDeadline) {
        o.slaRemaining = Math.max(0, new Date(o.slaDeadline) - new Date());
        o.isUrgent = o.slaRemaining < 3600000; // < 1 hour
      }
      return o;
    });

    res.status(200).json({ success: true, data: processedOrders });
  } catch (err) {
    next(err);
  }
};

// @desc    Update Order Status (with Penalties & Auto-SLA)
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status, reportUrl, staffId, rejectionReason } = req.body;
    const updateData = { status };
    
    const currentOrder = await LabOrder.findById(req.params.id);
    if (!currentOrder) return res.status(404).json({ success: false, message: 'Order not found' });

    // SLA Auto-Adjustment
    if (status === 'accepted') {
       // Set next SLA for collection (e.g., scheduledTime start)
       updateData.slaDeadline = new Date(currentOrder.scheduledDate);
    } else if (status === 'sample_collected') {
       // Set SLA for report upload (e.g., +12 hours)
       updateData.slaDeadline = new Date(Date.now() + 12 * 60 * 60 * 1000);
    }
    
    if (reportUrl) {
      updateData.reportUrl = reportUrl;
      // Simulation: Auto-Watermark Report
      console.log(`[B2B-OS] Watermarking report for order ${req.params.id}: "Powered by Rivo Labs"`);
    }
    if (staffId) updateData.assignedStaff = staffId;
    
    if (status === 'rejected') {
       updateData.rejectionReason = rejectionReason;
       // Penalty logic
       if (!['out_of_service_area', 'staff_unavailable'].includes(rejectionReason)) {
          const penalty = 50; // ₹50 penalty for "soft" rejections
          await Partner.findByIdAndUpdate(req.partner.id, { $inc: { penaltyBalance: penalty, performanceScore: -2 } });
          await PartnerWallet.findOneAndUpdate({ partner: req.partner.id }, { $inc: { balance: -penalty } });
          updateData.penaltyAmount = penalty;
       }
    }

    const order = await LabOrder.findOneAndUpdate(
      { _id: req.params.id, partner: req.partner.id },
      updateData,
      { new: true }
    ).populate('patient', 'name phone email');
    
    // Financial logic for completion
    if (status === 'completed' || status === 'report_uploaded') {
      const PartnerTransaction = require('../models/PartnerTransaction');
      const existingTx = await PartnerTransaction.findOne({ order: order._id });
      
      if (!existingTx) {
        if (order.paymentMethod === 'cod') {
          const platformFee = order.totalAmount * 0.2;
          const wallet = await PartnerWallet.findOneAndUpdate(
            { partner: req.partner.id },
            { $inc: { balance: -platformFee } },
            { new: true, upsert: true }
          );
          await PartnerTransaction.create({
            partner: req.partner.id,
            wallet: wallet._id,
            order: order._id,
            type: 'debit',
            amount: platformFee,
            netAmount: platformFee,
            description: `Platform Fee Deduction for COD Order #${order._id.toString().slice(-6).toUpperCase()}`
          });
        } else if (order.paymentStatus === 'collected') {
          const platformFee = order.totalAmount * 0.2;
          const netAmount = order.totalAmount - platformFee;
          const wallet = await PartnerWallet.findOneAndUpdate(
            { partner: req.partner.id },
            { $inc: { balance: netAmount, totalEarned: netAmount } },
            { new: true, upsert: true }
          );
          await PartnerTransaction.create({
            partner: req.partner.id,
            wallet: wallet._id,
            order: order._id,
            type: 'credit',
            amount: order.totalAmount,
            platformCommission: platformFee,
            netAmount: netAmount,
            description: `Earnings for Lab Order #${order._id.toString().slice(-6).toUpperCase()}`
          });
        }
      }

      // Boost performance score on success
      await Partner.findByIdAndUpdate(req.partner.id, { $inc: { performanceScore: 1 } });
    }
    
    res.status(200).json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
};

// @desc    Upload Order Report
exports.uploadOrderReport = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a valid report document.' });
    }

    const orderId = req.params.id;
    const orderToUpdate = await LabOrder.findOne({ _id: orderId, partner: req.partner.id });
    if (!orderToUpdate) return res.status(404).json({ success: false, message: 'Order not found' });

    const updateData = {
      status: 'report_uploaded',
      reportUrl: req.file.path
    };

    if (orderToUpdate.paymentStatus === 'collected') {
      updateData.reportLocked = false;
      updateData.reportReleasedAt = Date.now();
      updateData.releaseReason = 'Auto-released upon report upload';
    }

    const order = await LabOrder.findByIdAndUpdate(orderToUpdate._id, updateData, { new: true })
      .populate('patient', 'name phone email');

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    // Financial logic for completion
    const PartnerTransaction = require('../models/PartnerTransaction');
    const existingTx = await PartnerTransaction.findOne({ order: order._id });
    
    if (!existingTx) {
      if (order.paymentMethod === 'cod') {
        const platformFee = order.totalAmount * 0.2;
        const wallet = await PartnerWallet.findOneAndUpdate(
          { partner: req.partner.id },
          { $inc: { balance: -platformFee } },
          { new: true, upsert: true }
        );
        await PartnerTransaction.create({
          partner: req.partner.id,
          wallet: wallet._id,
          order: order._id,
          type: 'debit',
          amount: platformFee,
          netAmount: platformFee,
          description: `Platform Fee Deduction for COD Order #${order._id.toString().slice(-6).toUpperCase()}`
        });
      } else if (order.paymentStatus === 'collected') {
        const platformFee = order.totalAmount * 0.2;
        const netAmount = order.totalAmount - platformFee;
        const wallet = await PartnerWallet.findOneAndUpdate(
          { partner: req.partner.id },
          { $inc: { balance: netAmount, totalEarned: netAmount } },
          { new: true, upsert: true }
        );
        await PartnerTransaction.create({
          partner: req.partner.id,
          wallet: wallet._id,
          order: order._id,
          type: 'credit',
          amount: order.totalAmount,
          platformCommission: platformFee,
          netAmount: netAmount,
          description: `Earnings for Lab Order #${order._id.toString().slice(-6).toUpperCase()} (Report Uploaded)`
        });
      }
    }

    await Partner.findByIdAndUpdate(req.partner.id, { $inc: { performanceScore: 1 } });

    res.status(200).json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
};

// --- B2B Operations ---

exports.getLeaderboard = async (req, res, next) => {
  try {
    const leaderboard = await Partner.find({ status: 'active' })
      .select('name performanceScore subscriptionPlan')
      .sort('-performanceScore')
      .limit(10);
    res.status(200).json({ success: true, data: leaderboard });
  } catch (err) {
    next(err);
  }
};

exports.bulkUploadTests = async (req, res, next) => {
  try {
    const { tests } = req.body; // In production, use csv-parser on req.file
    if (!Array.isArray(tests)) return res.status(400).json({ success: false, message: 'Invalid data format' });

    const formattedTests = tests.map(t => ({ ...t, partner: req.partner.id }));
    await LabTest.insertMany(formattedTests);
    
    res.status(201).json({ success: true, message: `${tests.length} tests uploaded successfully` });
  } catch (err) {
    next(err);
  }
};

// --- Staff Management ---

exports.getStaff = async (req, res, next) => {
  try {
    const staff = await PartnerStaff.find({ partner: req.partner.id }).sort('-createdAt');
    res.status(200).json({ success: true, data: staff });
  } catch (err) {
    next(err);
  }
};

exports.addStaff = async (req, res, next) => {
  try {
    const { phone } = req.body;
    
    // Check for duplicate phone for the SAME partner
    const existingStaff = await PartnerStaff.findOne({ phone, partner: req.partner.id });
    if (existingStaff) {
      return res.status(400).json({ success: false, message: 'This number already exists for a staff member.' });
    }

    const staff = await PartnerStaff.create({ ...req.body, partner: req.partner.id });
    res.status(201).json({ success: true, data: staff });
  } catch (err) {
    next(err);
  }
};

exports.updateStaffStatus = async (req, res, next) => {
  try {
    const staff = await PartnerStaff.findOneAndUpdate(
      { _id: req.params.id, partner: req.partner.id },
      { isActive: req.body.isActive },
      { new: true }
    );
    res.status(200).json({ success: true, data: staff });
  } catch (err) {
    next(err);
  }
};

// --- Wallet & Transactions ---

exports.getTransactions = async (req, res, next) => {
  try {
    const transactions = await PartnerTransaction.find({ partner: req.partner.id })
      .sort('-createdAt')
      .limit(50);
    const wallet = await PartnerWallet.findOne({ partner: req.partner.id });
    
    const LabOrder = require('../models/LabOrder');
    const orders = await LabOrder.find({ partner: req.partner.id });
    let codPending = 0;
    orders.forEach(o => {
      if ((o.status === 'completed' || o.status === 'report_uploaded') && o.paymentMethod === 'cod') {
        codPending += o.totalAmount;
      }
    });

    res.status(200).json({ success: true, data: { transactions, wallet, codPending } });
  } catch (err) {
    next(err);
  }
};

// @desc    Manage Tests
exports.getTests = async (req, res, next) => {
  try {
    const tests = await LabTest.find({ partner: req.partner.id });
    res.status(200).json({ success: true, data: tests });
  } catch (err) {
    next(err);
  }
};

exports.addTest = async (req, res, next) => {
  try {
    const test = await LabTest.create({ ...req.body, partner: req.partner.id });
    res.status(201).json({ success: true, data: test });
  } catch (err) {
    next(err);
  }
};

// @desc    Manage Tests
exports.getTests = async (req, res, next) => {
  try {
    const tests = await LabTest.find({ partner: req.partner.id });
    res.status(200).json({ success: true, data: tests });
  } catch (err) {
    next(err);
  }
};

exports.addTest = async (req, res, next) => {
  try {
    const test = await LabTest.create({ ...req.body, partner: req.partner.id });
    res.status(201).json({ success: true, data: test });
  } catch (err) {
    next(err);
  }
};
