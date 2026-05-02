const Offering = require('../models/Offering');
const ServicePricing = require('../models/ServicePricing');
const LabTest = require('../models/LabTest');
const LabProfile = require('../models/LabProfile');
const LabCommission = require('../models/LabCommission');

/**
 * Centralized Pricing Engine for Carely Pricing OS
 * Calculates totalAmount, platformFee, and providerEarning
 */
exports.calculateBookingPrice = async ({ serviceDoc, serviceId, offeringId, testId, providerId, durationHours = 1 }) => {
  let totalAmount = 0;
  let basePrice = 0;
  let providerEarning = 0;
  let platformFee = 0;
  let labPayout = 0;

  // 1. LAB SERVICES
  if (serviceDoc.slug === 'lab') {
    if (!testId) throw new Error('Lab test ID required');
    const test = await LabTest.findById(testId);
    if (!test || !test.isActive) throw new Error('Invalid or inactive lab test');
    
    totalAmount = test.price;
    basePrice = test.price;
    
    const labProfile = await LabProfile.findOne({ partner: providerId });

    let commissionType = 'percentage';
    let commissionValue = 20; // Default 20%

    if (test.commissionOverride?.active) {
      commissionType = test.commissionOverride.commissionType;
      commissionValue = test.commissionOverride.commissionValue;
    } else {
      // Check the new dedicated LabCommission model first
      const labComm = await LabCommission.findOne({ partner: providerId, department: test.department, isActive: true });
      if (labComm) {
        commissionType = labComm.commissionType;
        commissionValue = labComm.commissionValue;
      } else {
        // Fallback to legacy LabProfile commissions if available
        const labProfile = await LabProfile.findOne({ partner: providerId });
        const deptComm = labProfile?.commissions?.find(d => d.department === test.department);
        if (deptComm) {
          commissionType = deptComm.commissionType;
          commissionValue = deptComm.commissionValue;
        }
      }
    }

    if (commissionType === 'percentage') {
      const rate = (commissionValue > 1) ? commissionValue / 100 : commissionValue;
      platformFee = Math.round(totalAmount * rate);
    } else {
      platformFee = commissionValue;
    }
    providerEarning = totalAmount - platformFee;
    labPayout = providerEarning;
    
    return { totalAmount, basePrice, platformFee, providerEarning, labPayout };
  }

  // 2. OFFERING-BASED BOOKINGS (Subscriptions/Packages)
  if (offeringId) {
    const offering = await Offering.findById(offeringId).populate('service');
    if (!offering || !offering.isActive) throw new Error('Invalid or inactive offering selected');
    
    totalAmount = offering.price;
    basePrice = offering.price;

    // For offerings, we look at the ServicePricing for that service to determine payout %
    const pricing = await ServicePricing.findOne({ service: offering.service._id, isActive: true });
    if (pricing) {
      if (pricing.providerPayoutType === 'percentage') {
        providerEarning = Math.round(totalAmount * (pricing.providerPayoutValue || 0.8));
      } else {
        // For a bulk offering, a flat payout value per hour/session might not apply directly
        // Usually, offerings use the percentage logic from the service
        providerEarning = Math.round(totalAmount * 0.8); 
      }
    } else {
      providerEarning = Math.round(totalAmount * 0.8); // Fallback
    }
    platformFee = totalAmount - providerEarning;

    return { totalAmount, basePrice, platformFee, providerEarning };
  }

  // 3. ON-DEMAND SERVICES (HOURLY/SESSION)
  const pricing = await ServicePricing.findOne({ service: serviceId, isActive: true });
  if (!pricing) throw new Error('Pricing configuration missing for this service');
  
  basePrice = pricing.basePrice;
  totalAmount = basePrice * durationHours;
  
  if (pricing.providerPayoutType === 'percentage') {
    providerEarning = Math.round(totalAmount * (pricing.providerPayoutValue || 0.8));
  } else {
    providerEarning = (pricing.providerPayoutValue || 0) * durationHours;
  }
  platformFee = totalAmount - providerEarning;

  return { totalAmount, basePrice, platformFee, providerEarning };
};
