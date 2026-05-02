const LabProfile = require('../models/LabProfile');
const LabTest = require('../models/LabTest');
const LabOrder = require('../models/LabOrder');

// Get all verified labs
exports.getLabs = async (req, res, next) => {
  try {
    const labs = await LabProfile.find({ isVerified: true })
      .populate('partner', 'name email phone')
      .select('-__v');
    res.status(200).json({ success: true, count: labs.length, data: labs });
  } catch (err) {
    next(err);
  }
};

// Get lab by ID
exports.getLabById = async (req, res, next) => {
  try {
    const lab = await LabProfile.findById(req.params.id)
      .populate('partner', 'name email phone')
      .select('-__v');
    if (!lab) return res.status(404).json({ success: false, message: 'Lab not found' });
    res.status(200).json({ success: true, data: lab });
  } catch (err) {
    next(err);
  }
};

// Search tests/packages across all verified labs
exports.searchTests = async (req, res, next) => {
  try {
    const { q, department } = req.query;
    let query = { isActive: true };
    
    if (q) query.$text = { $search: q };
    if (department) query.department = department;

    const tests = await LabTest.find(query)
      .populate({
        path: 'partner',
        select: 'name',
      })
      .limit(50);
      
    res.status(200).json({ success: true, count: tests.length, data: tests });
  } catch (err) {
    next(err);
  }
};

// Book a test (requires patient auth)
exports.bookTest = async (req, res, next) => {
  try {
    const { 
      partnerId, testIds, totalAmount, scheduledDate, 
      scheduledTime, collectionType, collectionAddress,
      paymentMethod, patientDetails
    } = req.body;
    
    let calculatedTotalAmount = 0;
    let platformFee = 0;
    let labPayout = 0;

    // Load tests and lab profile for commission hierarchy
    const tests = await LabTest.find({ _id: { $in: testIds } });
    const labProfile = await LabProfile.findOne({ partner: partnerId });

    // Ensure we track breakdown
    let commissionUsed = null;
    let commissionSource = 'default';

    tests.forEach(test => {
      let cType = 'percentage';
      let cVal = 20; // default 20%
      let cSource = 'default';

      if (test.commissionOverride && test.commissionOverride.active) {
        cType = test.commissionOverride.commissionType;
        cVal = test.commissionOverride.commissionValue;
        cSource = 'override';
      } else if (labProfile && labProfile.commissions) {
        const deptComm = labProfile.commissions.find(d => d.department === test.department);
        if (deptComm) {
          cType = deptComm.commissionType;
          cVal = deptComm.commissionValue;
          cSource = 'department';
        }
      }

      const tPrice = test.price;
      calculatedTotalAmount += tPrice;

      let fee = 0;
      if (cType === 'percentage') {
        const rate = (cVal > 1) ? cVal / 100 : cVal;
        fee = Math.round(tPrice * rate);
      } else {
        fee = cVal;
      }
      
      platformFee += fee;
      labPayout += (tPrice - fee);
      
      // Store the last one for logging, or you could change schema to an array
      commissionUsed = cVal;
      commissionSource = cSource;
    });

    // Security: ensure frontend totalAmount matches calculated (or just use calculated)
    const orderTotal = totalAmount || calculatedTotalAmount;

    const order = await LabOrder.create({
      patient: req.user.id,
      partner: partnerId,
      tests: testIds,
      totalAmount: orderTotal,
      platformFee,
      labPayout,
      commissionUsed,
      commissionSource,
      scheduledDate,
      scheduledTime,
      collectionType,
      collectionAddress: collectionType === 'home' ? collectionAddress : undefined,
      paymentMethod,
    });

    // Mock WhatsApp Confirmation
    console.log(`Sending WhatsApp confirmation to ${req.user.phone || 'patient'} for order ${order._id}`);
    // In production: await whatsappService.sendTemplate(req.user.phone, 'lab_booking_confirmed', { orderId: order._id });

    res.status(201).json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
};

// --- Retention & Profiles ---

exports.getFamilyMembers = async (req, res, next) => {
  try {
    res.status(200).json({ success: true, data: req.user.familyMembers || [] });
  } catch (err) { next(err); }
};

exports.addFamilyMember = async (req, res, next) => {
  try {
    req.user.familyMembers.push(req.body);
    await req.user.save();
    res.status(200).json({ success: true, data: req.user.familyMembers });
  } catch (err) { next(err); }
};

exports.getSavedAddresses = async (req, res, next) => {
  try {
    res.status(200).json({ success: true, data: req.user.savedAddresses || [] });
  } catch (err) { next(err); }
};

exports.addSavedAddress = async (req, res, next) => {
  try {
    req.user.savedAddresses.push(req.body);
    await req.user.save();
    res.status(200).json({ success: true, data: req.user.savedAddresses });
  } catch (err) { next(err); }
};

// Get patient's lab orders
exports.getMyOrders = async (req, res, next) => {
  try {
    let orders = await LabOrder.find({ patient: req.user.id })
      .populate('partner', 'name')
      .populate('tests', 'name price department')
      .sort('-createdAt');
      
    // Strip report URL if uncollected
    orders = orders.map(o => {
      const orderObj = o.toObject();
      // If payment is not collected, force lock on the frontend payload
      if (orderObj.paymentStatus !== 'collected') {
        orderObj.reportUrl = null;
        orderObj.isReportLocked = true;
      } else {
        // If it is collected, but the db somehow says it's locked, we still show it (or use db state)
        // Usually reportLocked is synced, but this ensures frontend respects the backend truth.
        orderObj.isReportLocked = orderObj.reportLocked;
      }
      return orderObj;
    });
      
    res.status(200).json({ success: true, data: orders });
  } catch (err) {
    next(err);
  }
};

// Get GST Invoice details
exports.getInvoice = async (req, res, next) => {
  try {
    const order = await LabOrder.findOne({ _id: req.params.id, patient: req.user.id })
      .populate('partner', 'name email phone address')
      .populate('patient', 'name email phone')
      .populate('tests', 'name price');
      
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.paymentStatus !== 'collected') {
      return res.status(400).json({ success: false, message: 'Invoice is only available for collected payments' });
    }

    const platformFee = order.platformFee || (order.totalAmount * 0.2);
    const labAmount = order.labPayout || (order.totalAmount - platformFee);

    // GST is typically 18% in India, calculated backwards from total
    // Total = Base + (Base * 0.18) => Base = Total / 1.18
    const baseAmount = order.totalAmount / 1.18;
    const gstAmount = order.totalAmount - baseAmount;
    const cgst = gstAmount / 2;
    const sgst = gstAmount / 2;

    const invoiceData = {
      invoiceId: `INV-${order._id.toString().slice(-6).toUpperCase()}`,
      date: order.createdAt,
      orderId: order._id,
      patient: order.patient,
      labPartner: order.partner,
      tests: order.tests,
      financials: {
        totalAmount: order.totalAmount,
        baseAmount: baseAmount.toFixed(2),
        cgst: cgst.toFixed(2),
        sgst: sgst.toFixed(2),
        platformFee: platformFee.toFixed(2),
        labAmount: labAmount.toFixed(2)
      },
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod
    };

    res.status(200).json({ success: true, data: invoiceData });
  } catch (err) {
    next(err);
  }
};
