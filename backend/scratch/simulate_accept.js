const mongoose = require('mongoose');
const LabOrder = require('../src/models/LabOrder');
const Partner = require('../src/models/Partner');
const PartnerWallet = require('../src/models/PartnerWallet');
const { autoAssignDepartment } = require('../src/constants/departments');
require('dotenv').config();

async function simulateAccept() {
  await mongoose.connect(process.env.MONGODB_URI);
  const id = '69f8e8fd4f7ebea86cb190d4';
  const status = 'accepted';
  const partnerId = '69f8cf7eb4624cb661c2bc0a';

  try {
    const { status, reportUrl, staffId, rejectionReason } = { status: 'accepted' };
    const updateData = { status };
    
    const currentOrder = await LabOrder.findById(id);
    if (!currentOrder) { console.log('Order not found'); return; }

    if (status === 'accepted') {
       updateData.slaDeadline = new Date(currentOrder.scheduledDate);
    }
    
    // Simulate the update
    console.log('Update Data:', updateData);
    const order = await LabOrder.findOneAndUpdate(
      { _id: id, partner: partnerId },
      updateData,
      { new: true }
    );
    console.log('Order updated successfully:', order.status, order.slaDeadline);
  } catch (err) {
    console.error('Error during update:', err.message);
  }
  process.exit(0);
}

simulateAccept();
