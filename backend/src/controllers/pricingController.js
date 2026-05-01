const Pricing = require('../models/Pricing');

// @GET /api/admin/pricing
exports.getAllPricing = async (req, res, next) => {
  try {
    const pricing = await Pricing.find().sort({ serviceType: 1, label: 1 });
    res.json({ success: true, data: pricing });
  } catch (err) {
    next(err);
  }
};

// @POST /api/admin/pricing
exports.upsertPricing = async (req, res, next) => {
  try {
    const { serviceType, category, label, basePrice, multiplier, platformMargin, isActive } = req.body;
    
    const pricing = await Pricing.findOneAndUpdate(
      { serviceType, category },
      { 
        label, 
        basePrice, 
        multiplier, 
        platformMargin, 
        isActive 
      },
      { upsert: true, new: true, runValidators: true }
    );

    res.json({ success: true, data: pricing });
  } catch (err) {
    next(err);
  }
};

// @POST /api/pricing/calculate
// Public-facing calculation engine
exports.calculatePrice = async (req, res, next) => {
  try {
    const { serviceType, category, durationHours = 1, pincode, partnerId } = req.body;

    const rule = await Pricing.findOne({ serviceType, category, isActive: true });
    if (!rule) {
      return res.status(404).json({ success: false, message: 'Pricing rule not found for this selection.' });
    }

    let finalBasePrice = rule.basePrice;

    // Check Pincode Overrides
    if (pincode) {
      const pOverride = rule.pincodeOverrides.find(o => o.pincode === pincode);
      if (pOverride) finalBasePrice = pOverride.price;
    }

    // Check Partner Overrides
    if (partnerId) {
      const partOverride = rule.partnerOverrides.find(o => o.partnerId.toString() === partnerId.toString());
      if (partOverride) finalBasePrice = partOverride.price;
    }

    const subtotal = finalBasePrice * rule.multiplier * durationHours;
    const marginAmount = subtotal * rule.platformMargin;
    const totalAmount = subtotal + marginAmount;

    res.json({
      success: true,
      data: {
        basePrice: finalBasePrice,
        multiplier: rule.multiplier,
        durationHours,
        subtotal,
        platformMargin: rule.platformMargin,
        marginAmount,
        totalAmount: Math.round(totalAmount),
        label: rule.label
      }
    });
  } catch (err) {
    next(err);
  }
};
