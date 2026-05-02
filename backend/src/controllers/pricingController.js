const Service = require('../models/Service');
const ServicePricing = require('../models/ServicePricing');
const Offering = require('../models/Offering');

// --- Services ---

exports.getServices = async (req, res, next) => {
  try {
    const services = await Service.find({ isActive: true }).sort({ name: 1 });
    res.json({ success: true, data: services });
  } catch (err) { next(err); }
};

exports.adminGetServices = async (req, res, next) => {
  try {
    const services = await Service.find().sort({ name: 1 });
    res.json({ success: true, data: services });
  } catch (err) { next(err); }
};

exports.createService = async (req, res, next) => {
  try {
    const { name } = req.body;
    const existing = await Service.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Service with this name already exists' });
    }
    const service = await Service.create(req.body);
    res.status(201).json({ success: true, data: service });
  } catch (err) { next(err); }
};

exports.updateService = async (req, res, next) => {
  try {
    const service = await Service.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!service) return res.status(404).json({ success: false, message: 'Service not found' });
    res.json({ success: true, data: service });
  } catch (err) { next(err); }
};

// --- Pricing Rules ---

exports.getPricingRules = async (req, res, next) => {
  try {
    const pricing = await ServicePricing.find().populate('service').sort({ 'service.name': 1 });
    res.json({ success: true, data: pricing });
  } catch (err) { next(err); }
};

exports.upsertPricingRule = async (req, res, next) => {
  try {
    const { service, basePrice, providerPayoutType, providerPayoutValue, isActive } = req.body;
    const rule = await ServicePricing.findOneAndUpdate(
      { service },
      { basePrice, providerPayoutType, providerPayoutValue, isActive },
      { upsert: true, new: true, runValidators: true }
    );
    res.json({ success: true, data: rule });
  } catch (err) { next(err); }
};

// --- Plans ---

exports.getPlansByService = async (req, res, next) => {
  try {
    const { serviceId } = req.params;
    const plans = await Offering.find({ service: serviceId, isActive: true }).sort({ price: 1 });
    res.json({ success: true, data: plans });
  } catch (err) { next(err); }
};

exports.adminGetPlans = async (req, res, next) => {
  try {
    const plans = await Offering.find().populate('service').sort({ createdAt: -1 });
    res.json({ success: true, data: plans });
  } catch (err) { next(err); }
};

exports.createPlan = async (req, res, next) => {
  try {
    const plan = await Offering.create(req.body);
    res.status(201).json({ success: true, data: plan });
  } catch (err) { next(err); }
};

exports.updatePlan = async (req, res, next) => {
  try {
    const plan = await Offering.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });
    res.json({ success: true, data: plan });
  } catch (err) { next(err); }
};

exports.deletePlan = async (req, res, next) => {
  try {
    const plan = await Offering.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });
    res.json({ success: true, message: 'Plan soft-deleted' });
  } catch (err) { next(err); }
};
