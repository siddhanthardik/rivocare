const Partner = require('../models/Partner');
const LabProfile = require('../models/LabProfile');
const LabOrder = require('../models/LabOrder');
const { LAB_DEPARTMENT_KEYS } = require('../constants/departments');

// @desc    Get all lab partners
exports.getPartners = async (req, res, next) => {
  try {
    const Partner = require('../models/Partner');
    const LabProfile = require('../models/LabProfile');
    
    const partners = await Partner.find().select('-password').sort('-createdAt').lean();
    
    // Attach LabProfile data
    const profiles = await LabProfile.find({ partner: { $in: partners.map(p => p._id) } }).lean();
    const profileMap = profiles.reduce((acc, profile) => {
      acc[profile.partner.toString()] = profile;
      return acc;
    }, {});

    const enrichedPartners = partners.map(p => ({
      ...p,
      profile: profileMap[p._id.toString()] || null
    }));

    res.status(200).json({ success: true, data: enrichedPartners });
  } catch (err) {
    next(err);
  }
};

// @desc    Approve/Reject Partner
exports.updatePartnerStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const partner = await Partner.findByIdAndUpdate(req.params.id, { status }, { new: true }).select('-password');
    if (!partner) return res.status(404).json({ success: false, message: 'Partner not found' });
    
    // Also update public profile visibility if approved
    if (status === 'active') {
      await LabProfile.findOneAndUpdate({ partner: partner._id }, { isVerified: true });
    } else {
      await LabProfile.findOneAndUpdate({ partner: partner._id }, { isVerified: false });
    }

    res.status(200).json({ success: true, data: partner });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all lab orders (Global)
exports.getAllOrders = async (req, res, next) => {
  try {
    const orders = await LabOrder.find()
      .populate('patient', 'name email phone')
      .populate('partner', 'name')
      .populate('tests', 'name price')
      .sort('-createdAt');
    res.status(200).json({ success: true, count: orders.length, data: orders });
  } catch (err) {
    next(err);
  }
};

// @desc    Get War Room Stats (Founder Command Center)
exports.getWarRoomStats = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      ordersToday,
      activePartners,
      revenueToday,
      activeIssues,
      allOrders
    ] = await Promise.all([
      LabOrder.countDocuments({ createdAt: { $gte: today } }),
      Partner.countDocuments({ status: 'active' }),
      LabOrder.aggregate([
        { $match: { createdAt: { $gte: today } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      LabOrder.countDocuments({ status: { $in: ['delayed', 'rejected'] } }),
      LabOrder.find().populate('partner', 'name').sort('-createdAt').limit(100)
    ]);

    const gmvToday = revenueToday[0]?.total || 0;
    const netRevenue = gmvToday * 0.2; // 20% platform cut

    // Funnel Aggregation
    const funnel = {
      new: allOrders.filter(o => o.status === 'new').length,
      accepted: allOrders.filter(o => o.status === 'accepted').length,
      assigned: allOrders.filter(o => o.status === 'technician_assigned').length,
      collected: allOrders.filter(o => o.status === 'sample_collected').length,
      processing: allOrders.filter(o => o.status === 'processing').length,
      completed: allOrders.filter(o => o.status === 'completed').length
    };

    res.status(200).json({
      success: true,
      stats: {
        gmvToday,
        netRevenue,
        ordersToday,
        activePartners,
        activeIssues,
        slaScore: 98.2, // Simulated
        repeatRate: 24.5, // Simulated
        funnel
      },
      liveOrders: allOrders.slice(0, 10)
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get Partner Performance Scorecards
exports.getPartnersPerformance = async (req, res, next) => {
  try {
    const partners = await Partner.find({ status: 'active' });
    const performance = await Promise.all(partners.map(async (p) => {
      const orders = await LabOrder.find({ partner: p._id });
      const completed = orders.filter(o => o.status === 'completed').length;
      const rejected = orders.filter(o => o.status === 'rejected').length;
      
      return {
        _id: p._id,
        name: p.name,
        totalOrders: orders.length,
        completionRate: orders.length > 0 ? (completed / orders.length) * 100 : 0,
        rejectionRate: orders.length > 0 ? (rejected / orders.length) * 100 : 0,
        totalRevenue: orders.reduce((sum, o) => sum + o.totalAmount, 0),
        status: p.status,
        performanceScore: p.performanceScore || 100
      };
    }));

    res.status(200).json({ success: true, data: performance });
  } catch (err) {
    next(err);
  }
};

// @desc    Admin Operational Override (Reassign/Refund)
exports.manageOrder = async (req, res, next) => {
  try {
    const { action, newPartnerId, refundAmount } = req.body;
    let updateData = {};

    if (action === 'reassign') {
      updateData = { partner: newPartnerId, status: 'new' };
    } else if (action === 'refund') {
      updateData = { status: 'cancelled', paymentStatus: 'refunded' };
    } else if (action === 'escalate') {
      updateData = { isEscalated: true };
    }

    const order = await LabOrder.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.status(200).json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
};

// @desc    Get Lab Analytics (Enhanced)
exports.getAnalytics = async (req, res, next) => {
  try {
    const orders = await LabOrder.find().populate('tests', 'name price');
    
    const stats = {
      totalRevenue: orders.reduce((sum, o) => sum + o.totalAmount, 0),
      totalOrders: orders.length,
      completedOrders: orders.filter(o => o.status === 'completed').length,
      popularTests: {},
      revenueByMonth: {},
      revenueByCity: {},
    };

    orders.forEach(order => {
      // Popular Tests
      order.tests.forEach(test => {
        stats.popularTests[test.name] = (stats.popularTests[test.name] || 0) + 1;
      });

      // Monthly Revenue
      const month = new Date(order.createdAt).toLocaleString('default', { month: 'short', year: '2-digit' });
      stats.revenueByMonth[month] = (stats.revenueByMonth[month] || 0) + order.totalAmount;

      // City-wise Revenue
      const city = order.collectionAddress?.city || 'Unknown';
      stats.revenueByCity[city] = (stats.revenueByCity[city] || 0) + order.totalAmount;
    });

    // Convert popularTests object to sorted array
    stats.popularTests = Object.entries(stats.popularTests)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    res.status(200).json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
};

// @desc    Finance OS Metrics & Settlement Data
exports.getFinanceMetrics = async (req, res, next) => {
  try {
    const PartnerWallet = require('../models/PartnerWallet');
    const LabOrder = require('../models/LabOrder');
    const PartnerSettlement = require('../models/PartnerSettlement');

    const orders = await LabOrder.find();
    
    let totalGmv = 0;
    let platformRevenue = 0;
    let codPending = 0;
    let lockedReports = 0;
    let todayCollected = 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    orders.forEach(o => {
      if (o.status === 'completed' || o.status === 'report_uploaded') {
        if (o.paymentStatus === 'collected' || o.paymentStatus === 'paid') {
          totalGmv += o.totalAmount;
          platformRevenue += (o.platformFee || (o.totalAmount * 0.2));
        }
        if (o.paymentMethod === 'cod' && o.paymentStatus !== 'collected') {
          codPending += o.totalAmount;
        }
        if (o.reportLocked) {
          lockedReports++;
        }
      }
      
      if (o.paymentCollectedAt && new Date(o.paymentCollectedAt) >= today) {
        todayCollected += o.totalAmount;
      }
    });

    const wallets = await PartnerWallet.find().populate('partner', 'name email phone');
    const pendingPayouts = wallets.reduce((sum, w) => sum + w.balance, 0);

    const recentSettlements = await PartnerSettlement.find().populate('partner', 'name').sort('-createdAt').limit(20);

    res.status(200).json({
      success: true,
      data: {
        totalGmv,
        platformRevenue,
        pendingPayouts,
        codPending,
        lockedReports,
        todayCollected,
        wallets,
        recentSettlements
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Process a payout to a partner
exports.processSettlement = async (req, res, next) => {
  try {
    const { partnerId, amount, payoutReference, payoutMethod } = req.body;
    const PartnerWallet = require('../models/PartnerWallet');
    const PartnerSettlement = require('../models/PartnerSettlement');
    const PartnerTransaction = require('../models/PartnerTransaction');

    const wallet = await PartnerWallet.findOne({ partner: partnerId });
    if (!wallet || wallet.balance < amount) {
      return res.status(400).json({ success: false, message: 'Insufficient balance' });
    }

    // Deduct from wallet
    wallet.balance -= amount;
    await wallet.save();

    // Create Settlement Record
    const settlement = await PartnerSettlement.create({
      partner: partnerId,
      wallet: wallet._id,
      totalAmount: amount,
      netPayout: amount,
      status: 'completed',
      payoutReference,
      payoutMethod
    });

    // Create Transaction Record
    await PartnerTransaction.create({
      partner: partnerId,
      wallet: wallet._id,
      type: 'debit',
      amount: amount,
      netAmount: amount,
      description: `Bank Payout (Ref: ${payoutReference})`
    });

    res.status(200).json({ success: true, message: 'Payout processed successfully', data: settlement });
  } catch (err) {
    next(err);
  }
};

// @desc    Manage Finance Status of a Lab Order (Strict Gating Policy)
exports.manageFinanceStatus = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { newStatus, reason } = req.body;
    const LabOrder = require('../models/LabOrder');
    
    const validStatuses = ['pending', 'payment_link_sent', 'cash_due', 'collected', 'failed', 'refunded', 'waived'];
    if (!validStatuses.includes(newStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid payment status' });
    }

    const order = await LabOrder.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    order.paymentStatus = newStatus;
    
    if (newStatus === 'collected' || newStatus === 'waived') {
      order.reportLocked = false;
      order.reportReleasedAt = Date.now();
      order.paymentCollectedAt = Date.now();
      order.paymentCollectedBy = req.user._id.toString();
      order.releaseReason = reason || `Admin Action: Marked as ${newStatus}`;
      
      if (order.status === 'completed' || order.status === 'report_uploaded') {
        const PartnerTransaction = require('../models/PartnerTransaction');
        const PartnerWallet = require('../models/PartnerWallet');
        
        const existingTx = await PartnerTransaction.findOne({ order: order._id, type: 'credit' });
        if (!existingTx && newStatus === 'collected') {
          const platformFee = order.platformFee !== undefined ? order.platformFee : (order.totalAmount * 0.2);
          const netAmount = order.labPayout !== undefined ? order.labPayout : (order.totalAmount - platformFee);
          
          const wallet = await PartnerWallet.findOneAndUpdate(
            { partner: order.partner },
            { $inc: { balance: netAmount, totalEarned: netAmount } },
            { new: true, upsert: true }
          );
          
          await PartnerTransaction.create({
            partner: order.partner,
            wallet: wallet._id,
            order: order._id,
            type: 'credit',
            amount: order.totalAmount,
            platformCommission: platformFee,
            netAmount: netAmount,
            description: `Earnings for Lab Order #${order._id.toString().slice(-6).toUpperCase()} (Admin Marked Collected)`
          });
        }
      }
    } else {
      order.reportLocked = true;
    }

    await order.save();
    
    res.status(200).json({ success: true, data: order, message: `Payment status updated to ${newStatus}` });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all Lab Tests across all partners (Admin)
exports.getAdminTests = async (req, res, next) => {
  try {
    const LabTest = require('../models/LabTest');
    const tests = await LabTest.find().populate('partner', 'name email').sort({ createdAt: -1 });
    res.json({ success: true, data: tests });
  } catch (err) {
    next(err);
  }
};

// @desc    Update Lab Test Pricing & Commission Override (Admin)
exports.updateAdminTestPricing = async (req, res, next) => {
  try {
    const { overrideActive, commissionType, commissionValue } = req.body;
    const LabTest = require('../models/LabTest');
    
    const commissionOverride = {
      active: !!overrideActive,
      commissionType: commissionType || 'percentage',
      commissionValue: commissionValue >= 0 ? commissionValue : 0.2
    };

    const test = await LabTest.findByIdAndUpdate(
      req.params.id,
      { commissionOverride },
      { new: true, runValidators: true }
    ).populate('partner', 'name email');

    if (!test) {
      return res.status(404).json({ success: false, message: 'Lab test not found' });
    }

    res.json({ success: true, message: 'Lab test pricing updated', data: test });
  } catch (err) {
    next(err);
  }
};

// @desc    Update Lab Commission (Standardized PUT API)
exports.updateLabCommission = async (req, res, next) => {
  const { labId } = req.params;
  const { commissions } = req.body;
  
  // Logging for debugging
  console.log(`[COMMISSION_UPDATE] labId: ${labId}`, commissions);

  try {
    if (!labId) {
      return res.status(400).json({ success: false, message: 'Lab ID is required' });
    }

    if (!commissions || !Array.isArray(commissions)) {
      return res.status(400).json({ success: false, message: 'Invalid payload: commissions array is required' });
    }

    // Validate department keys and percentage bounds
    for (const comm of commissions) {
      if (!LAB_DEPARTMENT_KEYS.includes(comm.department)) {
        return res.status(400).json({ success: false, message: `Invalid department: ${comm.department}` });
      }
      if (comm.commissionType === 'percentage' && (comm.commissionValue < 0 || comm.commissionValue > 100)) {
        return res.status(400).json({ success: false, message: `Percentage for ${comm.label || comm.department} must be between 0-100` });
      }
    }

    const LabProfile = require('../models/LabProfile');
    const LabCommission = require('../models/LabCommission');

    // 1. Update legacy profile field
    const profile = await LabProfile.findOneAndUpdate(
      { partner: labId },
      { commissions },
      { new: true, runValidators: true }
    );

    // 2. Update new dedicated model
    const commissionPromises = commissions.map(comm => 
      LabCommission.findOneAndUpdate(
        { partner: labId, department: comm.department },
        { 
          commissionType: comm.commissionType, 
          commissionValue: comm.commissionValue,
          isActive: true 
        },
        { upsert: true, new: true }
      )
    );
    await Promise.all(commissionPromises);

    if (!profile) {
      console.warn(`[COMMISSION_UPDATE_FAILED] Lab profile not found for Lab ID: ${labId}`);
      return res.status(404).json({ success: false, message: 'Lab profile not found' });
    }

    res.json({ success: true, message: 'Lab commissions updated successfully', data: commissions });
  } catch (err) {
    console.error(`[COMMISSION_API_ERROR] ${err.message}`, { labId, commissions });
    next(err);
  }
};

// @desc    Update Lab Department Commissions (Admin - Deprecated)
exports.updateLabDepartmentCommissions = async (req, res, next) => {
  try {
    const { partnerId } = req.params;
    const { departmentCommissions } = req.body; 
    
    const LabProfile = require('../models/LabProfile');
    const profile = await LabProfile.findOneAndUpdate(
      { partner: partnerId },
      { commissions: departmentCommissions },
      { new: true }
    );

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Lab profile not found' });
    }

    res.json({ success: true, message: 'Department commissions updated', data: profile.commissions });
  } catch (err) {
    next(err);
  }
};

