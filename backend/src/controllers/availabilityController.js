const Provider = require('../models/Provider');
const Availability = require('../models/Availability');

const DEFAULT_AVAILABILITY = {
  isAvailable: true,
  workingDays: [],
  slots: [],
  startTime: '09:00',
  endTime: '19:00',
  shiftType: 'custom',
  blockedSlots: [],
};

async function resolveProvider(userId) {
  return Provider.findOne({ user: userId });
}

exports.getAvailability = async (req, res, next) => {
  try {
    const provider = await resolveProvider(req.user._id);
    if (!provider) {
      return res.status(404).json({ success: false, message: 'Provider not found' });
    }

    let availability = await Availability.findOne({ provider: provider._id });
    if (!availability) {
      availability = await Availability.create({
        provider: provider._id,
        ...DEFAULT_AVAILABILITY,
      });
    }

    res.json({
      success: true,
      data: {
        availability: {
          ...DEFAULT_AVAILABILITY,
          ...availability.toObject(),
          quickSlots: availability.slots,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.updateAvailability = async (req, res, next) => {
  try {
    const provider = await resolveProvider(req.user._id);
    if (!provider) {
      return res.status(404).json({ success: false, message: 'Provider not found' });
    }

    const payload = {
      isAvailable: req.body.isAvailable ?? DEFAULT_AVAILABILITY.isAvailable,
      workingDays: Array.isArray(req.body.workingDays) ? req.body.workingDays : [],
      slots: Array.isArray(req.body.quickSlots)
        ? req.body.quickSlots
        : Array.isArray(req.body.slots)
          ? req.body.slots
          : [],
      startTime: req.body.startTime || DEFAULT_AVAILABILITY.startTime,
      endTime: req.body.endTime || DEFAULT_AVAILABILITY.endTime,
      shiftType: req.body.shiftType || DEFAULT_AVAILABILITY.shiftType,
      blockedSlots: Array.isArray(req.body.blockedSlots) ? req.body.blockedSlots : [],
    };

    const availability = await Availability.findOneAndUpdate(
      { provider: provider._id },
      payload,
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    provider.isAvailable = payload.isAvailable;
    await provider.save();

    res.json({
      success: true,
      message: 'Availability saved',
      data: {
        availability: {
          ...DEFAULT_AVAILABILITY,
          ...availability.toObject(),
          quickSlots: availability.slots,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};
