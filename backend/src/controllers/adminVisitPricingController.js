const VisitPricingConfig = require('../models/VisitPricingConfig');

// @GET /api/admin/visit-pricing
exports.getVisitPricingConfigs = async (req, res, next) => {
  try {
    const configs = await VisitPricingConfig.find().sort({ createdAt: -1 });
    res.json({ success: true, data: configs });
  } catch (error) {
    next(error);
  }
};

// @POST /api/admin/visit-pricing
exports.createVisitPricingConfig = async (req, res, next) => {
  try {
    const data = { ...req.body, createdBy: req.user._id, updatedBy: req.user._id };
    const config = await VisitPricingConfig.create(data);
    res.json({ success: true, data: config });
  } catch (error) {
    next(error);
  }
};

// @PUT /api/admin/visit-pricing/:id
exports.updateVisitPricingConfig = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = { ...req.body, updatedBy: req.user._id };
    const config = await VisitPricingConfig.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    
    if (!config) {
      return res.status(404).json({ success: false, message: 'Pricing config not found' });
    }
    
    res.json({ success: true, data: config });
  } catch (error) {
    next(error);
  }
};

// @PATCH /api/admin/visit-pricing/:id/toggle
exports.toggleVisitPricingConfig = async (req, res, next) => {
  try {
    const { id } = req.params;
    const config = await VisitPricingConfig.findById(id);
    
    if (!config) {
      return res.status(404).json({ success: false, message: 'Pricing config not found' });
    }
    
    config.isActive = !config.isActive;
    config.updatedBy = req.user._id;
    await config.save();
    
    res.json({ success: true, data: config, message: `Config ${config.isActive ? 'activated' : 'deactivated'}` });
  } catch (error) {
    next(error);
  }
};
