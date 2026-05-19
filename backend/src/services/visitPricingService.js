const VisitPricingConfig = require('../models/VisitPricingConfig');

/**
 * Calculates visit pricing safely without altering base service price.
 * Follows an additive approach to ensure old bookings are not broken.
 * 
 * @param {Object} params
 * @param {String} params.serviceType - The name or slug of the service (e.g. 'nurse', 'physiotherapist')
 * @param {String} params.city - The city (default 'Default')
 * @param {Number} params.serviceAmount - The base price of the service/plan
 * @param {Number} params.distanceKm - Optional travel distance (default 0 for Phase 1)
 * @returns {Object} { visitCharge, distanceCharge, distanceTier, pricingBreakdown }
 */
/*
PRIORITY ORDER:
1. Emergency Override
2. Manual Admin Waiver
3. Campaign Promotion
4. Threshold Waiver
5. Standard Pricing
*/
exports.calculateVisitPricing = async ({ serviceType, city = 'Default', serviceAmount, distanceKm = 0 }) => {
  let visitCharge = 0;
  let distanceCharge = 0;
  let distanceTier = null;
  let discountAmount = 0;
  
  // Snapshot tracking fields
  let baseVisitFee = 0;
  let waiverApplied = false;
  let promoApplied = null;

  try {
    // 1. Fetch config (try city specific, then fallback to 'Default')
    let config = await VisitPricingConfig.findOne({ 
      serviceType: { $regex: new RegExp(`^${serviceType}$`, 'i') }, 
      city: { $regex: new RegExp(`^${city}$`, 'i') }, 
      isActive: true 
    });

    if (!config) {
      config = await VisitPricingConfig.findOne({ 
        serviceType: { $regex: new RegExp(`^${serviceType}$`, 'i') }, 
        city: 'Default', 
        isActive: true 
      });
    }

    // If no config found, return zeros (Safe Additive)
    if (!config) {
      return {
        visitCharge: 0,
        distanceCharge: 0,
        distanceTier: null,
        pricingBreakdown: {
          serviceAmount,
          visitCharge: 0,
          distanceCharge: 0,
          discountAmount: 0,
          totalAmount: serviceAmount,
          pricingRuleSnapshot: {
            baseVisitFee: 0,
            appliedTier: null,
            waiverApplied: false,
            promoApplied: null,
            calculatedAt: new Date()
          }
        }
      };
    }

    // 2. Base Visit Fee
    visitCharge = config.baseVisitFee || 0;
    baseVisitFee = visitCharge;

    // 3. Distance Tier Charge
    if (config.tierRules && config.tierRules.length > 0) {
      for (const tier of config.tierRules) {
        if (distanceKm >= tier.minKm && distanceKm < tier.maxKm) {
          distanceCharge = tier.fee;
          distanceTier = `${tier.minKm}-${tier.maxKm}km`;
          break;
        }
      }
      if (!distanceTier && distanceKm >= config.tierRules[config.tierRules.length - 1].maxKm) {
        const lastTier = config.tierRules[config.tierRules.length - 1];
        distanceCharge = lastTier.fee;
        distanceTier = `>${lastTier.maxKm}km`;
      }
    }

    // 4. Promo Rules (e.g. Free Visit Days)
    if (config.promoRules && config.promoRules.freeVisitDays && config.promoRules.freeVisitDays.length > 0) {
      const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
      if (config.promoRules.freeVisitDays.includes(today)) {
        discountAmount += visitCharge + distanceCharge; // Waive completely
        promoApplied = `Free Visit Day: ${today}`;
      }
    }

    // 5. Waiver Rules (e.g. Free if booking > ₹1999)
    if (config.waiverRules && config.waiverRules.enabled) {
      if (serviceAmount >= config.waiverRules.aboveAmount) {
        const potentialDiscount = visitCharge + distanceCharge;
        if (discountAmount < potentialDiscount) {
            discountAmount = potentialDiscount;
            waiverApplied = true;
        }
      }
    }

    const finalVisitCharge = discountAmount >= visitCharge ? 0 : visitCharge;
    const finalDistanceCharge = discountAmount >= (visitCharge + distanceCharge) ? 0 : 
                               (discountAmount >= visitCharge ? distanceCharge - (discountAmount - visitCharge) : distanceCharge);

    const totalAmount = serviceAmount + finalVisitCharge + finalDistanceCharge;

    return {
      visitCharge: finalVisitCharge,
      distanceCharge: finalDistanceCharge,
      distanceTier,
      pricingBreakdown: {
        serviceAmount,
        visitCharge: finalVisitCharge,
        distanceCharge: finalDistanceCharge,
        discountAmount,
        totalAmount,
        pricingRuleSnapshot: {
          baseVisitFee,
          appliedTier: distanceTier,
          waiverApplied,
          promoApplied,
          calculatedAt: new Date()
        }
      }
    };

  } catch (error) {
    console.error('[visitPricingService] Error calculating visit pricing:', error);
    // Safe fallback on error
    return {
      visitCharge: 0,
      distanceCharge: 0,
      distanceTier: null,
      pricingBreakdown: {
        serviceAmount,
        visitCharge: 0,
        distanceCharge: 0,
        discountAmount: 0,
        totalAmount: serviceAmount,
        pricingRuleSnapshot: {
          baseVisitFee: 0,
          appliedTier: null,
          waiverApplied: false,
          promoApplied: null,
          calculatedAt: new Date()
        }
      }
    };
  }
};
