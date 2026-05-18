const mongoose = require('mongoose');
const Partner = require('../models/Partner');
const LabProfile = require('../models/LabProfile');
const LabTest = require('../models/LabTest');
const { autoAssignDepartment } = require('../constants/departments');
const PartnerStaff = require('../models/PartnerStaff');
const PartnerWallet = require('../models/PartnerWallet');
const LabOrder = require('../models/LabOrder');
const LabReview = require('../models/LabReview');
const PartnerTransaction = require('../models/PartnerTransaction');
const jwt = require('jsonwebtoken');
const { BOOKING_STATUS, PAYMENT_STATUS, normalizeBookingStatus, normalizePaymentStatus, LAB_ORDER_STATUS } = require('../constants/bookingStatus');

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
    const partner = await Partner.findById(req.partner._id);
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
    const profile = await LabProfile.findOne({ partner: req.partner._id });
    res.status(200).json({ success: true, data: { partner: req.partner, profile } });
  } catch (err) {
    next(err);
  }
};

// @desc    Update Partner Profile
exports.updateProfile = async (req, res, next) => {
  try {
    const profile = await LabProfile.findOneAndUpdate(
      { partner: req.partner._id },
      { ...req.body },
      { new: true, runValidators: true, upsert: true }
    );
    res.status(200).json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
};

// Removed local require, now at top
// Removed local require, now at top

// @desc    Get Dashboard Stats
exports.getDashboardStats = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const partner = await Partner.findById(req.partner._id);
    const [
      totalOrders,
      todayOrders,
      pendingAction,
      collectedToday,
      reportsPending,
      wallet,
      reviews
    ] = await Promise.all([
      LabOrder.countDocuments({ partner: req.partner._id }),
      LabOrder.countDocuments({ partner: req.partner._id, createdAt: { $gte: today } }),
      LabOrder.countDocuments({ partner: req.partner._id, status: { $in: ['new', 'NEW', 'REQUESTED'] } }),
      LabOrder.countDocuments({ partner: req.partner._id, status: { $in: ['sample_collected', 'SAMPLE_COLLECTED'] }, updatedAt: { $gte: today } }),
      LabOrder.countDocuments({ partner: req.partner._id, status: { $in: ['processing', 'PROCESSING'] } }),
      PartnerWallet.findOne({ partner: req.partner._id }),
      LabReview.find({ partner: req.partner._id }).sort('-createdAt').limit(5).populate('patient', 'name')
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

    const txns = await PartnerTransaction.find({ partner: req.partner._id, status: 'completed' });

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
    let query = { partner: req.partner._id };
    
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
    const { status, reportUrl, staffId, rejectionReason, paymentStatus } = req.body;
    const updateData = {};
    if (status) updateData.status = status;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;
    
    // Security: Ensure order belongs to partner
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid order ID format' });
    }

    const currentOrder = await LabOrder.findOne({ _id: req.params.id, partner: req.partner._id });
    if (!currentOrder) return res.status(404).json({ success: false, message: 'Order not found or access denied' });

    // SLA Auto-Adjustment
    const nbs = normalizeBookingStatus(status);
    if (nbs === BOOKING_STATUS.CONFIRMED || nbs === 'ACCEPTED') {
       // Set next SLA for collection (e.g., scheduledTime start)
       updateData.slaDeadline = new Date(currentOrder.scheduledDate);
    } else if (nbs === 'SAMPLE_COLLECTED') {
       // Set SLA for report upload (e.g., +12 hours)
       updateData.slaDeadline = new Date(Date.now() + 12 * 60 * 60 * 1000);
    }
    
    if (reportUrl) {
      updateData.reportUrl = reportUrl;
      // Simulation: Auto-Watermark Report
      console.log(`[B2B-OS] Watermarking report for order ${req.params.id}: "Powered by Rivo Labs"`);
    }
    if (staffId) updateData.assignedStaff = staffId;
    
    if (nbs === BOOKING_STATUS.CANCELLED || nbs === 'REJECTED') {
       updateData.rejectionReason = rejectionReason;
       // Penalty logic
       if (!['out_of_service_area', 'staff_unavailable'].includes(rejectionReason)) {
          const penalty = 50; // ₹50 penalty for "soft" rejections
          await Partner.findByIdAndUpdate(req.partner._id, { $inc: { penaltyBalance: penalty, performanceScore: -2 } });
          await PartnerWallet.findOneAndUpdate({ partner: req.partner._id }, { $inc: { balance: -penalty } });
          updateData.penaltyAmount = penalty;
       }
    }

    const order = await LabOrder.findOneAndUpdate(
      { _id: req.params.id, partner: req.partner._id },
      updateData,
      { new: true }
    ).populate('patient', 'name phone email');
    
    // Financial logic for completion
    if (nbs === BOOKING_STATUS.COMPLETED || nbs === 'REPORT_UPLOADED') {
      const existingTx = await PartnerTransaction.findOne({ order: order._id });
      
      if (!existingTx) {
        if (order.paymentMethod === 'cod') {
          const platformFee = order.totalAmount * 0.2;
          const wallet = await PartnerWallet.findOneAndUpdate(
            { partner: req.partner._id },
            { $inc: { balance: -platformFee } },
            { new: true, upsert: true }
          );
          await PartnerTransaction.create({
            partner: req.partner._id,
            wallet: wallet._id,
            order: order._id,
            type: 'debit',
            amount: platformFee,
            netAmount: platformFee,
            description: `Platform Fee Deduction for COD Order #${order._id.toString().slice(-6).toUpperCase()}`
          });
        } else if (normalizePaymentStatus(order.paymentStatus) === PAYMENT_STATUS.COLLECTED) {
          const platformFee = order.totalAmount * 0.2;
          const netAmount = order.totalAmount - platformFee;
          const wallet = await PartnerWallet.findOneAndUpdate(
            { partner: req.partner._id },
            { $inc: { balance: netAmount, totalEarned: netAmount } },
            { new: true, upsert: true }
          );
          await PartnerTransaction.create({
            partner: req.partner._id,
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
      await Partner.findByIdAndUpdate(req.partner._id, { $inc: { performanceScore: 1 } });
    }
    
    res.status(200).json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
};

// @desc Mark payment collected by partner for a COD order
exports.markPaymentCollected = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { notes, proofUrl } = req.body;

    const order = await LabOrder.findOne({ _id: id, partner: req.partner._id });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found or access denied' });

    if (order.paymentMethod !== 'cod') {
      return res.status(400).json({ success: false, message: 'Only COD orders can be marked collected by partner' });
    }

    const nps = normalizePaymentStatus(order.paymentStatus);
    if (nps === PAYMENT_STATUS.COLLECTED || nps === PAYMENT_STATUS.PAID) {
      return res.status(200).json({ success: true, message: 'Payment already marked collected', data: order });
    }

    const mongoose = require('mongoose');
    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      order.paymentStatus = PAYMENT_STATUS.COLLECTED;
      order.paymentCollectedAt = Date.now();
      order.paymentCollectedBy = req.partner._id.toString();
      if (notes) order.paymentCollectionNotes = notes;
      if (proofUrl) order.collectionProof = proofUrl;
      order.paymentVerified = true;
      order.reportLocked = false;
      order.reportReleasedAt = Date.now();
      order.releaseReason = 'Collected by Partner';
      await order.save({ session });

      // Guard against duplicate credit
      const existingTx = await PartnerTransaction.findOne({ order: order._id, type: 'credit' }).session(session);
      if (!existingTx) {
        // Credit partner wallet atomically
        const wallet = await PartnerWallet.findOneAndUpdate(
          { partner: req.partner._id },
          { $inc: { balance: order.labPayout || order.totalAmount, totalEarned: order.labPayout || order.totalAmount } },
          { new: true, upsert: true, session }
        );

        await PartnerTransaction.create([
          {
            partner: req.partner._id,
            wallet: wallet._id,
            order: order._id,
            type: 'credit',
            amount: order.totalAmount,
            platformCommission: order.platformFee || (order.totalAmount * 0.2),
            netAmount: order.labPayout || order.totalAmount,
            description: `Earnings for Lab Order #${order._id.toString().slice(-6).toUpperCase()} (Collected by Partner)`
          }
        ], { session });
      }

      await session.commitTransaction();
      session.endSession();

      res.status(200).json({ success: true, message: 'Payment marked as collected', data: order });
      return;
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
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
    const orderToUpdate = await LabOrder.findOne({ _id: orderId, partner: req.partner._id });
    if (!orderToUpdate) return res.status(404).json({ success: false, message: 'Order not found' });

    // Payment validation check (Robust enforcement)
    const nps = normalizePaymentStatus(orderToUpdate.paymentStatus);
    if (orderToUpdate.paymentMethod === 'cod' && nps !== PAYMENT_STATUS.COLLECTED) {
      return res.status(400).json({ success: false, message: 'Payment must be marked as COLLECTED for COD orders before you can upload the report.' });
    }

    if (['razorpay', 'upi'].includes(orderToUpdate.paymentMethod) && nps !== PAYMENT_STATUS.PAID) {
      return res.status(400).json({ success: false, message: 'This is a prepaid order but payment is still pending. Please contact support if this is unexpected.' });
    }

    const updateData = {
      status: 'REPORT_UPLOADED',
      reportUrl: req.file.path
    };

    if (normalizePaymentStatus(orderToUpdate.paymentStatus) === PAYMENT_STATUS.COLLECTED) {
      updateData.reportLocked = false;
      updateData.reportReleasedAt = Date.now();
      updateData.releaseReason = 'Auto-released upon report upload';
    }

    const order = await LabOrder.findByIdAndUpdate(orderToUpdate._id, updateData, { new: true })
      .populate('patient', 'name phone email');

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    // Financial logic for completion
    const existingTx = await PartnerTransaction.findOne({ order: order._id });
    
    if (!existingTx) {
      if (order.paymentMethod === 'cod') {
        const platformFee = order.totalAmount * 0.2;
        const wallet = await PartnerWallet.findOneAndUpdate(
          { partner: req.partner._id },
          { $inc: { balance: -platformFee } },
          { new: true, upsert: true }
        );
        await PartnerTransaction.create({
          partner: req.partner._id,
          wallet: wallet._id,
          order: order._id,
          type: 'debit',
          amount: platformFee,
          netAmount: platformFee,
          description: `Platform Fee Deduction for COD Order #${order._id.toString().slice(-6).toUpperCase()}`
        });
      } else if (normalizePaymentStatus(order.paymentStatus) === PAYMENT_STATUS.COLLECTED) {
        const platformFee = order.totalAmount * 0.2;
        const netAmount = order.totalAmount - platformFee;
        const wallet = await PartnerWallet.findOneAndUpdate(
          { partner: req.partner._id },
          { $inc: { balance: netAmount, totalEarned: netAmount } },
          { new: true, upsert: true }
        );
        await PartnerTransaction.create({
          partner: req.partner._id,
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

    await Partner.findByIdAndUpdate(req.partner._id, { $inc: { performanceScore: 1 } });

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
    const { tests } = req.body;
    if (!Array.isArray(tests)) return res.status(400).json({ success: false, message: 'Invalid data format' });

    const formattedTests = tests.map(t => {
      const formatted = { 
        ...t, 
        partner: req.partner._id,
        name: t.testName || t.name,
        prepInstructions: t.preparationInstructions || t.prepInstructions
      };
      if (t.reportTat && !t.tatHours) {
        const match = String(t.reportTat).match(/\d+/);
        if (match) formatted.tatHours = parseInt(match[0]);
      }
      return formatted;
    });
    await LabTest.insertMany(formattedTests);
    
    res.status(201).json({ success: true, message: `${tests.length} tests uploaded successfully` });
  } catch (err) {
    next(err);
  }
};

// --- Staff Management ---

exports.getStaff = async (req, res, next) => {
  try {
    const staff = await PartnerStaff.find({ partner: req.partner._id }).sort('-createdAt');
    res.status(200).json({ success: true, data: staff });
  } catch (err) {
    next(err);
  }
};

exports.addStaff = async (req, res, next) => {
  try {
    const { phone } = req.body;
    
    // Check for duplicate phone for the SAME partner
    const existingStaff = await PartnerStaff.findOne({ phone, partner: req.partner._id });
    if (existingStaff) {
      return res.status(400).json({ success: false, message: 'This number already exists for a staff member.' });
    }

    const staff = await PartnerStaff.create({ ...req.body, partner: req.partner._id });
    res.status(201).json({ success: true, data: staff });
  } catch (err) {
    next(err);
  }
};

exports.updateStaffStatus = async (req, res, next) => {
  try {
    const staff = await PartnerStaff.findOneAndUpdate(
      { _id: req.params.id, partner: req.partner._id },
      { isActive: req.body.isActive },
      { new: true }
    );
    res.status(200).json({ success: true, data: staff });
  } catch (err) {
    next(err);
  }
};

exports.updateStaff = async (req, res, next) => {
  try {
    const staff = await PartnerStaff.findOneAndUpdate(
      { _id: req.params.id, partner: req.partner._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!staff) return res.status(404).json({ success: false, message: 'Staff not found' });
    res.status(200).json({ success: true, data: staff });
  } catch (err) {
    next(err);
  }
};

exports.deleteStaff = async (req, res, next) => {
  try {
    const staff = await PartnerStaff.findOneAndDelete({ _id: req.params.id, partner: req.partner._id });
    if (!staff) return res.status(404).json({ success: false, message: 'Staff not found' });
    res.status(200).json({ success: true, message: 'Staff deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// --- Wallet & Transactions ---

exports.getTransactions = async (req, res, next) => {
  try {
    const transactions = await PartnerTransaction.find({ partner: req.partner._id })
      .sort('-createdAt')
      .limit(50);
    const wallet = await PartnerWallet.findOne({ partner: req.partner._id });
    
    const orders = await LabOrder.find({ partner: req.partner._id });
    let codPending = 0;
    orders.forEach(o => {
      const nbs = normalizeBookingStatus(o.status);
      if ((nbs === BOOKING_STATUS.COMPLETED || nbs === 'REPORT_UPLOADED') && o.paymentMethod === 'cod') {
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
    const tests = await LabTest.find({ partner: req.partner._id }).sort('-createdAt');
    const formatted = tests.map(t => {
      const obj = t.toObject();
      obj.testName = obj.name || 'Unnamed Test';
      obj.department = obj.department || 'pathology';
      obj.offerPrice = obj.discountPrice || obj.price;
      obj.standardMrp = obj.price;
      return obj;
    });
    res.status(200).json({ success: true, data: formatted });
  } catch (err) {
    next(err);
  }
};

// @desc    Add Test
exports.addTest = async (req, res, next) => {
  try {
    let data = { ...req.body };
    
    // Map frontend fields to backend model
    if (data.testName && !data.name) data.name = data.testName;
    if (data.preparationInstructions) data.prepInstructions = data.preparationInstructions;
    if (data.reportTat && !data.tatHours) {
      const match = String(data.reportTat).match(/\d+/);
      if (match) data.tatHours = parseInt(match[0]);
    }

      if (!data.department) {
      data.department = autoAssignDepartment(data.testName || data.name);
      console.log(`[AUTO_ASSIGN] Assigned department "${data.department}" to test "${data.testName || data.name}"`);
    }

    // Price mapping
    if (data.standardMrp) data.price = data.standardMrp;
    if (data.offerPrice) data.discountPrice = data.offerPrice;
    
    // Fallback for required price if only offerPrice is provided
    if (!data.price && data.offerPrice) data.price = data.offerPrice;

    const test = await LabTest.create({ ...data, partner: req.partner._id });
    res.status(201).json({ success: true, data: test });
  } catch (err) {
    next(err);
  }
};

// @desc    Update Test
exports.updateTest = async (req, res, next) => {
  try {
    let data = { ...req.body };
    if (data.testName && !data.name) data.name = data.testName;
    if (data.preparationInstructions) data.prepInstructions = data.preparationInstructions;
    
    // Price mapping
    if (data.standardMrp) data.price = data.standardMrp;
    if (data.offerPrice) data.discountPrice = data.offerPrice;
    
    const test = await LabTest.findOneAndUpdate(
      { _id: req.params.id, partner: req.partner._id },
      data,
      { new: true, runValidators: true }
    );
    
    if (!test) return res.status(404).json({ success: false, message: 'Test not found' });
    res.status(200).json({ success: true, data: test });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete Test
exports.deleteTest = async (req, res, next) => {
  try {
    const test = await LabTest.findOneAndDelete({ _id: req.params.id, partner: req.partner._id });
    if (!test) return res.status(404).json({ success: false, message: 'Test not found' });
    res.status(200).json({ success: true, message: 'Test deleted successfully' });
  } catch (err) {
    next(err);
  }
};

