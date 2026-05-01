const LabOrder        = require('../models/LabOrder');
const Partner         = require('../models/Partner');
const PartnerSettlement = require('../models/PartnerSettlement');
const PartnerWallet   = require('../models/PartnerWallet');
const PartnerTransaction = require('../models/PartnerTransaction');
const LabReconciliation  = require('../models/LabReconciliation');

/* ── Configurable platform margin (default 20%) ────────────────────────
   In production, fetch from AdminSettings collection if it exists.
   We read it from env with a safe fallback.                          */
const PLATFORM_MARGIN = parseFloat(process.env.PLATFORM_FEE_PERCENT || '20') / 100;

function toDateString(d) {
  return new Date(d).toISOString().split('T')[0]; // 'YYYY-MM-DD'
}

/* ══════════════════════════════════════════════════════════════════════
   GET /api/admin/labs/reconciliation?date=&city=&partnerId=
   ══════════════════════════════════════════════════════════════════════ */
exports.getReconciliation = async (req, res, next) => {
  try {
    const { date, city, partnerId } = req.query;
    const targetDate = date || toDateString(new Date());

    // Day window in UTC
    const dayStart = new Date(targetDate + 'T00:00:00.000Z');
    const dayEnd   = new Date(targetDate + 'T23:59:59.999Z');

    /* ── Build base match ──────────────────────────────────────────── */
    const match = {
      status:        { $in: ['completed', 'report_uploaded'] },
      paymentStatus: 'collected',
      paymentCollectedAt: { $gte: dayStart, $lte: dayEnd },
    };
    if (partnerId) match.partner = require('mongoose').Types.ObjectId(partnerId);

    /* ── Aggregate per lab ─────────────────────────────────────────── */
    const agg = await LabOrder.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$partner',
          ordersCount:    { $sum: 1 },
          totalAmount:    { $sum: '$totalAmount' },
          collectedAmount:{ $sum: '$totalAmount' },
          orders:         { $push: {
            _id: '$_id',
            totalAmount: '$totalAmount',
            paymentMethod: '$paymentMethod',
            paymentStatus: '$paymentStatus',
            status: '$status',
          }},
        },
      },
      {
        $lookup: {
          from: 'partners',
          localField: '_id',
          foreignField: '_id',
          as: 'partnerInfo',
        },
      },
      { $unwind: { path: '$partnerInfo', preserveNullAndEmpty: true } },
    ]);

    /* ── City filter (post-agg on partner.city) ────────────────────── */
    // Partner model may have city; filter in JS to avoid another lookup stage
    let rows = agg;
    if (city && city !== 'all') {
      rows = agg.filter(r =>
        (r.partnerInfo?.city || '').toLowerCase() === city.toLowerCase()
      );
    }

    /* ── Fetch already-settled amounts for the day ─────────────────── */
    const partnerIds = rows.map(r => r._id);
    const settlements = await PartnerSettlement.find({
      partner: { $in: partnerIds },
      createdAt: { $gte: dayStart, $lte: dayEnd },
      status: 'completed',
    });

    const settledMap = {};
    settlements.forEach(s => {
      settledMap[s.partner.toString()] = (settledMap[s.partner.toString()] || 0) + s.netPayout;
    });

    /* ── Compute per-lab financials ─────────────────────────────────── */
    const labs = rows.map(r => {
      const platformFee    = parseFloat((r.totalAmount * PLATFORM_MARGIN).toFixed(2));
      const labEarning     = parseFloat((r.totalAmount - platformFee).toFixed(2));
      const settledAmount  = parseFloat((settledMap[r._id.toString()] || 0).toFixed(2));
      const difference     = parseFloat((r.collectedAmount - settledAmount).toFixed(2));

      let status;
      if (Math.abs(difference) < 0.01) status = 'settled';
      else if (difference > 0)          status = 'pending';
      else                              status = 'mismatch';   // over-settled

      return {
        partnerId:       r._id,
        labName:         r.partnerInfo?.name || 'Unknown Lab',
        city:            r.partnerInfo?.city || '—',
        ordersCount:     r.ordersCount,
        totalAmount:     r.totalAmount,
        platformFee,
        labEarning,
        collectedAmount: r.collectedAmount,
        settledAmount,
        difference,
        status,
        orders: r.orders,
      };
    });

    /* ── Summary strip ─────────────────────────────────────────────── */
    const summary = {
      totalLabs:       labs.length,
      totalOrders:     labs.reduce((s, l) => s + l.ordersCount, 0),
      totalCollected:  parseFloat(labs.reduce((s, l) => s + l.collectedAmount, 0).toFixed(2)),
      platformRevenue: parseFloat(labs.reduce((s, l) => s + l.platformFee, 0).toFixed(2)),
      totalLabPayout:  parseFloat(labs.reduce((s, l) => s + l.labEarning, 0).toFixed(2)),
      totalMismatch:   parseFloat(labs.reduce((s, l) => s + (l.status === 'mismatch' ? Math.abs(l.difference) : 0), 0).toFixed(2)),
      pendingSettlement: parseFloat(labs.filter(l => l.status === 'pending').reduce((s, l) => s + l.difference, 0).toFixed(2)),
    };

    res.status(200).json({ success: true, date: targetDate, summary, data: labs });
  } catch (err) {
    next(err);
  }
};

/* ══════════════════════════════════════════════════════════════════════
   GET /api/admin/labs/reconciliation/orders?partnerId=&date=
   Order-level breakdown for modal/expandable row
   ══════════════════════════════════════════════════════════════════════ */
exports.getReconciliationOrders = async (req, res, next) => {
  try {
    const { partnerId, date } = req.query;
    if (!partnerId) return res.status(400).json({ success: false, message: 'partnerId required' });

    const targetDate = date || toDateString(new Date());
    const dayStart = new Date(targetDate + 'T00:00:00.000Z');
    const dayEnd   = new Date(targetDate + 'T23:59:59.999Z');

    const orders = await LabOrder.find({
      partner: partnerId,
      status: { $in: ['completed', 'report_uploaded'] },
      paymentStatus: 'collected',
      paymentCollectedAt: { $gte: dayStart, $lte: dayEnd },
    })
      .populate('patient', 'name phone')
      .populate('tests', 'name price')
      .select('_id patient tests totalAmount paymentMethod paymentStatus status paymentCollectedAt')
      .sort('-paymentCollectedAt');

    const rows = orders.map(o => {
      const platformFee = parseFloat((o.totalAmount * PLATFORM_MARGIN).toFixed(2));
      return {
        orderId:        o._id,
        patient:        o.patient?.name || '—',
        tests:          o.tests?.map(t => t.name).join(', ') || '—',
        amount:         o.totalAmount,
        platformFee,
        labEarning:     parseFloat((o.totalAmount - platformFee).toFixed(2)),
        paymentMode:    o.paymentMethod,
        paymentStatus:  o.paymentStatus,
        settlementStatus: 'pending',  // per-order settlement not tracked; row-level indicator
      };
    });

    res.status(200).json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

/* ══════════════════════════════════════════════════════════════════════
   POST /api/admin/labs/reconciliation/settle
   Mark settlement complete for a lab on a given date.
   Idempotent — checks for existing settlement in window.
   Prevents over-settlement (cannot settle > difference).
   ══════════════════════════════════════════════════════════════════════ */
exports.settleReconciliation = async (req, res, next) => {
  try {
    const { partnerId, date, amount, payoutReference, payoutMethod, notes } = req.body;

    if (!partnerId || !date || !amount) {
      return res.status(400).json({ success: false, message: 'partnerId, date, and amount are required' });
    }

    const settleAmount = parseFloat(amount);
    if (isNaN(settleAmount) || settleAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }

    /* ── Recompute collected for the day ────────────────────────────── */
    const dayStart = new Date(date + 'T00:00:00.000Z');
    const dayEnd   = new Date(date + 'T23:59:59.999Z');

    const agg = await LabOrder.aggregate([
      {
        $match: {
          partner: require('mongoose').Types.ObjectId(partnerId),
          status: { $in: ['completed', 'report_uploaded'] },
          paymentStatus: 'collected',
          paymentCollectedAt: { $gte: dayStart, $lte: dayEnd },
        },
      },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);
    const totalCollected = agg[0]?.total || 0;
    const labEarning = parseFloat((totalCollected * (1 - PLATFORM_MARGIN)).toFixed(2));

    /* ── Already settled in this window ────────────────────────────── */
    const existingSettlements = await PartnerSettlement.find({
      partner: partnerId,
      createdAt: { $gte: dayStart, $lte: dayEnd },
      status: 'completed',
    });
    const alreadySettled = existingSettlements.reduce((s, e) => s + e.netPayout, 0);

    /* ── Prevent over-settlement ────────────────────────────────────── */
    if (alreadySettled + settleAmount > labEarning + 0.01) {
      return res.status(400).json({
        success: false,
        message: `Over-settlement prevented. Max payable: ₹${(labEarning - alreadySettled).toFixed(2)}`,
      });
    }

    /* ── Get or create wallet ──────────────────────────────────────── */
    const wallet = await PartnerWallet.findOneAndUpdate(
      { partner: partnerId },
      { $setOnInsert: { balance: 0, totalEarned: 0, pendingPayouts: 0 } },
      { new: true, upsert: true }
    );

    if (wallet.balance < settleAmount - 0.01) {
      return res.status(400).json({
        success: false,
        message: `Insufficient wallet balance. Available: ₹${wallet.balance.toFixed(2)}`,
      });
    }

    /* ── Deduct balance ─────────────────────────────────────────────── */
    wallet.balance -= settleAmount;
    await wallet.save();

    /* ── Create settlement record ───────────────────────────────────── */
    const settlement = await PartnerSettlement.create({
      partner: partnerId,
      wallet:  wallet._id,
      totalAmount: settleAmount,
      platformFees: parseFloat((settleAmount * (PLATFORM_MARGIN / (1 - PLATFORM_MARGIN))).toFixed(2)),
      netPayout: settleAmount,
      status: 'completed',
      payoutReference: payoutReference || 'MANUAL',
      payoutMethod:    payoutMethod || 'bank_transfer',
      periodStart: dayStart,
      periodEnd:   dayEnd,
      notes,
    });

    /* ── Create transaction record ──────────────────────────────────── */
    await PartnerTransaction.create({
      partner: partnerId,
      wallet:  wallet._id,
      type:    'debit',
      amount:  settleAmount,
      netAmount: settleAmount,
      status:  'completed',
      description: `Daily Settlement ${date}${payoutReference ? ` (Ref: ${payoutReference})` : ''}`,
    });

    /* ── Upsert LabReconciliation snapshot ──────────────────────────── */
    const newSettled = alreadySettled + settleAmount;
    const newDiff    = parseFloat((totalCollected - newSettled).toFixed(2));
    let recStatus = Math.abs(newDiff) < 0.01 ? 'settled' : newDiff > 0 ? 'pending' : 'mismatch';

    await LabReconciliation.findOneAndUpdate(
      { partner: partnerId, date },
      {
        $set: {
          ordersCount:    agg[0]?.count || 0,
          totalAmount:    totalCollected,
          platformFee:    parseFloat((totalCollected * PLATFORM_MARGIN).toFixed(2)),
          labEarning,
          collectedAmount: totalCollected,
          settledAmount:  newSettled,
          difference:     newDiff,
          status:         recStatus,
          settledBy:      req.user._id,
          settledAt:      new Date(),
          notes,
        },
      },
      { upsert: true, new: true }
    );

    res.status(200).json({
      success: true,
      message: `Settlement of ₹${settleAmount.toFixed(2)} processed successfully`,
      data: settlement,
    });
  } catch (err) {
    next(err);
  }
};

/* ══════════════════════════════════════════════════════════════════════
   PUT /api/admin/labs/reconciliation/flag
   Flag a lab's reconciliation entry for review
   ══════════════════════════════════════════════════════════════════════ */
exports.flagReconciliation = async (req, res, next) => {
  try {
    const { partnerId, date, reason } = req.body;
    if (!partnerId || !date) {
      return res.status(400).json({ success: false, message: 'partnerId and date required' });
    }

    const rec = await LabReconciliation.findOneAndUpdate(
      { partner: partnerId, date },
      { $set: { flagged: true, flagReason: reason || 'Flagged for review' } },
      { upsert: true, new: true }
    );

    res.status(200).json({ success: true, data: rec });
  } catch (err) {
    next(err);
  }
};
