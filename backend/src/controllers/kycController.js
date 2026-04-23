const ProviderVerification = require('../models/ProviderVerification');
const Provider = require('../models/Provider');
const { encrypt, decrypt } = require('../utils/encryption');

// ─── PROVIDER APIS ──────────────────────────────────────────

exports.submitKYC = async (req, res) => {
  try {
    const { registrationNumber, councilType, accountNumber, ifscCode, accountHolderName } = req.body;
    
    if (!req.files || !req.files.govtId || !req.files.degree || !req.files.cheque) {
      return res.status(400).json({ success: false, message: 'All documents (govtId, degree, cheque) are required' });
    }

    // Extract Cloudinary URLs from multer-storage-cloudinary
    const govtIdUrl = req.files.govtId[0].path;
    const degreeUrl = req.files.degree[0].path;
    const chequeUrl = req.files.cheque[0].path;

    // Encrypt the bank account number
    const encryptedAccountNumber = encrypt(accountNumber);

    // Upsert the KYC record (if rejected before, they can resubmit, converting it back to PENDING)
    const kycData = {
      userId: req.user.id,
      govtIdUrl,
      degreeUrl,
      registrationNumber,
      councilType,
      bankDetails: {
        accountNumber: encryptedAccountNumber,
        ifscCode,
        accountHolderName,
        chequeUrl,
      },
      status: 'PENDING',
      rejectedReason: null, // Clear any previous rejection
    };

    let verification = await ProviderVerification.findOne({ userId: req.user.id });
    if (verification) {
      // Update existing
      verification = await ProviderVerification.findOneAndUpdate({ userId: req.user.id }, kycData, { new: true });
    } else {
      // Create new
      verification = await ProviderVerification.create(kycData);
    }

    res.status(201).json({ success: true, data: verification });
  } catch (error) {
    console.error('Submit KYC Error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit KYC data' });
  }
};

exports.getProviderKYCStatus = async (req, res) => {
  try {
    const verification = await ProviderVerification.findOne({ userId: req.user.id }).select('-bankDetails.accountNumber');
    if (!verification) {
      return res.status(404).json({ success: false, message: 'No KYC submission found' });
    }
    res.json({ success: true, data: verification });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch KYC status' });
  }
};

// ─── ADMIN APIS ─────────────────────────────────────────────

exports.getPendingKYC = async (req, res) => {
  try {
    const pending = await ProviderVerification.find({ status: 'PENDING' })
      .populate('userId', 'name email phone avatar')
      .select('-bankDetails.accountNumber'); // Don't send encrypted numbers to the list view
    res.json({ success: true, data: pending });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch pending KYC' });
  }
};

exports.getKYCDetails = async (req, res) => {
  try {
    const verification = await ProviderVerification.findById(req.params.id)
      .populate('userId', 'name email phone');
    if (!verification) return res.status(404).json({ success: false, message: 'KYC not found' });

    // Admin-only: Decrypt the bank account number for viewing
    const decryptedAccount = decrypt(verification.bankDetails.accountNumber);
    
    // Create a plain object to return with the decrypted string inserted safely
    const dataObj = verification.toObject();
    dataObj.bankDetails.accountNumber = decryptedAccount;

    res.json({ success: true, data: dataObj });
  } catch (error) {
    console.error('KYC Detailed fetch error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch KYC details' });
  }
};

exports.approveKYC = async (req, res) => {
  try {
    const verification = await ProviderVerification.findById(req.params.id);
    if (!verification) return res.status(404).json({ success: false, message: 'KYC not found' });

    verification.status = 'VERIFIED';
    verification.verifiedAt = Date.now();
    await verification.save();

    // Mark the user's Provider profile as verified!
    const provider = await Provider.findOne({ user: verification.userId });
    if (provider) {
      provider.isVerified = true;
      await provider.save();
    }

    res.json({ success: true, message: 'Provider Verified Successfully', data: verification });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to approve KYC' });
  }
};

exports.rejectKYC = async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ success: false, message: 'Rejection reason is required' });

    const verification = await ProviderVerification.findById(req.params.id);
    if (!verification) return res.status(404).json({ success: false, message: 'KYC not found' });

    verification.status = 'REJECTED';
    verification.rejectedReason = reason;
    await verification.save();

    // Ensure Provider is NOT verified
    const provider = await Provider.findOne({ user: verification.userId });
    if (provider) {
      provider.isVerified = false;
      await provider.save();
    }

    res.json({ success: true, message: 'Provider KYC Rejected', data: verification });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to reject KYC' });
  }
};
