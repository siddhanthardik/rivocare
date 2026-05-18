const LabProfile = require('../models/LabProfile');
const LabTest = require('../models/LabTest');
const LabOrder = require('../models/LabOrder');
const puppeteer = require('puppeteer');
const { cleanObject, cleanString } = require('../utils/sanitizeInput');
const { LAB_DEPARTMENTS } = require('../constants/departments');

const familyMemberSchema = {
  name: { type: 'string', maxLength: 80 },
  relationship: { type: 'string', maxLength: 20 },
  age: { type: 'number' },
  gender: { type: 'string', maxLength: 20 },
  phone: { type: 'string', maxLength: 10 },
};

const savedAddressSchema = {
  type: { type: 'string', maxLength: 20 },
  fullAddress: { type: 'string', maxLength: 500 },
  city: { type: 'string', maxLength: 80 },
  locality: { type: 'string', maxLength: 120 },
  pincode: { type: 'string', maxLength: 6 },
  landmark: { type: 'string', maxLength: 120 },
  isDefault: { type: 'boolean' },
};

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
      
    const formatted = tests.map(t => {
      const obj = t.toObject();
      // Ensure prices are mapped correctly for patient UI
      const finalPrice = obj.discountPrice || obj.price;
      const mrp = obj.discountPrice ? obj.price : null;
      
      return {
        ...obj,
        price: finalPrice,
        discountPrice: mrp // Swap so frontend can show strikethrough
      };
    });
      
    res.status(200).json({ success: true, count: formatted.length, data: formatted });
  } catch (err) {
    next(err);
  }
};

// Book a test (requires patient auth)
exports.bookTest = async (req, res, next) => {
  try {
    const { 
      partnerId, testId, memberId, addressId, schedule, 
      scheduledTime, collectionType, collectionAddress,
      paymentMethod, patientDetails
    } = req.body;
    const testIds = Array.isArray(req.body.testIds) && req.body.testIds.length
      ? req.body.testIds
      : [testId].filter(Boolean);
    const scheduledDate = schedule?.date || req.body.scheduledDate;
    const requestedTime = schedule?.time || scheduledTime;

    if (!testIds.length || !scheduledDate) {
      return res.status(400).json({ success: false, message: 'Invalid request data' });
    }
    
    let calculatedTotalAmount = 0;
    let platformFee = 0;
    let labPayout = 0;

    // Load tests and lab profile for commission hierarchy
    const tests = await LabTest.find({ _id: { $in: testIds }, partner: partnerId, isActive: true });
    const labProfile = await LabProfile.findOne({ partner: partnerId });
    if (!labProfile) {
      return res.status(400).json({ success: false, message: 'Invalid lab partner' });
    }
    if (tests.length !== testIds.length) {
      return res.status(400).json({ success: false, message: 'One or more selected tests are invalid for this lab' });
    }

    let member = null;
    if (memberId && memberId !== 'self') {
      member = req.user.familyMembers.id(memberId);
      if (!member) return res.status(400).json({ success: false, message: 'Invalid request data' });
    }

    let selectedAddress = null;
    if (addressId) {
      selectedAddress = req.user.savedAddresses.id(addressId);
      if (!selectedAddress) return res.status(400).json({ success: false, message: 'Invalid request data' });
    }

    const requestedDate = new Date(scheduledDate);
    const requestedDayEnd = new Date(requestedDate);
    requestedDayEnd.setHours(23, 59, 59, 999);
    if (requestedDayEnd < new Date()) {
      return res.status(400).json({ success: false, message: 'Cannot create a lab booking for a past date' });
    }

    const duplicateOrder = await LabOrder.findOne({
      patient: req.user.id,
      partner: partnerId,
      scheduledDate: requestedDate,
      scheduledTime: requestedTime,
      tests: { $all: testIds },
      status: { $nin: ['cancelled', 'rejected', 'completed'] },
    });
    if (duplicateOrder) {
      return res.status(409).json({ success: false, message: 'Duplicate lab booking for this slot' });
    }

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

    const orderTotal = calculatedTotalAmount;
    const cleanCollectionAddress = collectionType === 'center'
      ? undefined
      : cleanObject(selectedAddress || collectionAddress || {
          fullAddress: req.user.address,
          city: req.user.city,
          locality: req.user.locality,
          pincode: req.user.pincode,
          type: req.user.addressType,
        }, savedAddressSchema);

    const order = await LabOrder.create({
      orderId: `LAB-${Date.now()}`,
      patient: req.user.id,
      partner: partnerId,
      tests: testIds,
      member: member?._id,
      address: selectedAddress?._id,
      totalAmount: orderTotal,
      platformFee,
      labPayout,
      commissionUsed,
      commissionSource,
      scheduledDate: requestedDate,
      scheduledTime: cleanString(requestedTime || '', 60),
      collectionType,
      collectionAddress: cleanCollectionAddress,
      paymentMethod,
    });

    // Mock WhatsApp Confirmation
    console.log({
      action: 'LAB_ORDER_CREATED',
      user: req.user.id.toString(),
      order: order._id.toString(),
      orderId: order.orderId,
      ip: req.ip,
    });
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
    const member = cleanObject(req.body, familyMemberSchema);
    req.user.familyMembers.push(member);
    await req.user.save();
    res.status(200).json({ success: true, data: req.user.familyMembers[req.user.familyMembers.length - 1] });
  } catch (err) { next(err); }
};

exports.updateFamilyMember = async (req, res, next) => {
  try {
    const member = req.user.familyMembers.id(req.params.id);
    if (!member) return res.status(404).json({ success: false, message: 'Not found' });

    member.set(cleanObject(req.body, familyMemberSchema));
    await req.user.save();
    res.status(200).json({ success: true, data: member });
  } catch (err) { next(err); }
};

exports.deleteFamilyMember = async (req, res, next) => {
  try {
    const member = req.user.familyMembers.id(req.params.id);
    if (!member) return res.status(404).json({ success: false, message: 'Not found' });

    member.deleteOne();
    await req.user.save();
    res.status(200).json({ success: true, message: 'Family member deleted' });
  } catch (err) { next(err); }
};

exports.getSavedAddresses = async (req, res, next) => {
  try {
    res.status(200).json({ success: true, data: req.user.savedAddresses || [] });
  } catch (err) { next(err); }
};

exports.addSavedAddress = async (req, res, next) => {
  try {
    const address = cleanObject(req.body, savedAddressSchema);
    if (address.isDefault) {
      req.user.savedAddresses.forEach((saved) => { saved.isDefault = false; });
    }
    req.user.savedAddresses.push(address);
    await req.user.save();
    res.status(200).json({ success: true, data: req.user.savedAddresses[req.user.savedAddresses.length - 1] });
  } catch (err) { next(err); }
};

exports.updateSavedAddress = async (req, res, next) => {
  try {
    const address = req.user.savedAddresses.id(req.params.id);
    if (!address) return res.status(404).json({ success: false, message: 'Not found' });

    const update = cleanObject(req.body, savedAddressSchema);
    if (update.isDefault) {
      req.user.savedAddresses.forEach((saved) => { saved.isDefault = false; });
    }
    address.set(update);
    await req.user.save();
    res.status(200).json({ success: true, data: address });
  } catch (err) { next(err); }
};

exports.deleteSavedAddress = async (req, res, next) => {
  try {
    const address = req.user.savedAddresses.id(req.params.id);
    if (!address) return res.status(404).json({ success: false, message: 'Not found' });

    address.deleteOne();
    await req.user.save();
    res.status(200).json({ success: true, message: 'Address deleted' });
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
      if (!['collected', 'paid'].includes(orderObj.paymentStatus)) {
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
    if (!['collected', 'paid'].includes(order.paymentStatus)) {
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
    try {
      const billingLogger = require('../utils/billingLogger');
      billingLogger.logInvoiceGenerated({
        bookingId: order._id && order._id.toString(),
        providerId: order.partner && order.partner.toString(),
        amount: order.totalAmount,
        status: 'GENERATED',
        requestId: req.requestId,
        ip: req.ip,
        endpoint: req.originalUrl
      });
    } catch (e) {}
  } catch (err) {
    next(err);
  }
};

// Download invoice as simple HTML (partner/patient/admin access)
exports.downloadInvoice = async (req, res, next) => {
  try {
    const id = req.params.id;
    const user = req.user;
    const partner = req.partner;
    const order = await LabOrder.findById(id)
      .populate('partner', 'name email phone address')
      .populate('patient', 'name email phone')
      .populate('tests', 'name price');
    if (!order) return res.status(404).send('Order not found');

    // Authorization: patient who owns it, partner owner, or admin
    if (user && user.role === 'patient' && order.patient._id.toString() !== user._id.toString()) {
      return res.status(403).send('Forbidden');
    }
    if (partner) {
      if (partner._id.toString() !== order.partner._id.toString()) return res.status(403).send('Forbidden');
    }

    if (!['collected', 'paid'].includes(order.paymentStatus)) {
      return res.status(400).send('Invoice available only for collected payments');
    }

    const format = (req.query.format || 'pdf').toLowerCase();

    // build printable HTML
    const invoiceHtml = `<!doctype html><html><head><meta charset="utf-8"><title>Invoice INV-${order._id.toString().slice(-6).toUpperCase()}</title><style>@media print{.no-print{display:none}}body{font-family:Inter,Arial,sans-serif;padding:24px;color:#111}header{display:flex;justify-content:space-between;align-items:center}h1{font-size:18px;margin:0}table{width:100%;border-collapse:collapse;margin-top:12px}th,td{padding:8px;border:1px solid #eee;text-align:left} .right{text-align:right}.footer{margin-top:24px;border-top:1px solid #eee;padding-top:8px;color:#666;font-size:12px}</style></head><body>
      <header><div><h1>RIVO Care — Invoice</h1><div>INV-${order._id.toString().slice(-6).toUpperCase()}</div></div><div><strong>Date:</strong> ${order.createdAt.toLocaleString()}</div></header>
      <section style="margin-top:12px"><h3>Patient</h3><div>${order.patient.name} • ${order.patient.email || ''} • ${order.patient.phone || ''}</div></section>
      <section style="margin-top:8px"><h3>Lab Partner</h3><div>${order.partner.name} • ${order.partner.email || ''}</div></section>
      <section><table><thead><tr><th>Test</th><th class="right">Price</th></tr></thead><tbody>
      ${order.tests.map(t => `<tr><td>${t.name}</td><td class="right">₹${Number(t.price).toFixed(2)}</td></tr>`).join('')}
      </tbody></table></section>
      <section class="footer"><div><strong>Total:</strong> ₹${Number(order.totalAmount).toFixed(2)}</div><div>Platform Fee: ₹${Number(order.platformFee || (order.totalAmount*0.2)).toFixed(2)}</div><div>Lab Amount: ₹${Number(order.labPayout || (order.totalAmount - (order.platformFee || (order.totalAmount*0.2)))).toFixed(2)}</div></section>
      <div class="no-print" style="margin-top:16px"><button onclick="window.print()">Print</button></div>
    </body></html>`;

    if (format === 'html') {
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Content-Disposition', `inline; filename="invoice-${order._id}.html"`);
      try { require('../utils/billingLogger').logInvoiceGenerated({ bookingId: order._id && order._id.toString(), providerId: order.partner && order.partner.toString(), amount: order.totalAmount, status: 'DOWNLOAD_HTML', requestId: req.requestId, ip: req.ip, endpoint: req.originalUrl }); } catch(e){}
      return res.send(invoiceHtml);
    }

    // Render HTML to PDF using Puppeteer for pixel-perfect output
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    try {
      const page = await browser.newPage();
      await page.setContent(invoiceHtml, { waitUntil: 'networkidle0' });
      const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '20mm', bottom: '20mm' } });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="invoice-${order._id}.pdf"`);
      res.send(pdfBuffer);
    } finally {
      await browser.close();
    }
  } catch (err) {
    next(err);
  }
};

exports.getReport = async (req, res, next) => {
  try {
    const order = await LabOrder.findOne({ _id: req.params.id, patient: req.user.id })
      .populate('tests', 'name')
      .populate('partner', 'name');

    if (!order) return res.status(404).json({ success: false, message: 'Report not found' });
    if (!['paid', 'collected'].includes(order.paymentStatus)) {
      return res.status(403).json({ success: false, message: 'Complete payment to view report' });
    }
    if (!order.reportUrl) {
      return res.status(404).json({ success: false, message: 'Report not uploaded yet' });
    }

    res.status(200).json({
      success: true,
      data: {
        orderId: order.orderId || order._id,
        reportUrl: order.reportUrl,
        tests: order.tests,
        partner: order.partner,
      },
    });
  } catch (err) {
    next(err);
  }
};

// Get all available lab departments
exports.getDepartments = async (req, res, next) => {
  try {
    res.status(200).json({ success: true, data: LAB_DEPARTMENTS });
  } catch (err) {
    next(err);
  }
};
