const request = require('supertest');
const mongoose = require('mongoose');
const crypto = require('crypto');

// Ensure test env
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'memory';
process.env.RAZORPAY_KEY_SECRET = 'test_secret';

let app;

beforeAll(async () => {
  // Require app after env vars set so it uses in-memory mongo
  app = require('../../src/index');
  // wait for mongoose connection
  if (mongoose.connection.readyState !== 1) {
    await new Promise((res) => setTimeout(res, 500));
  }
});

afterAll(async () => {
  try { await mongoose.disconnect(); } catch(e) {}
  try { await mongoose.connection.close(); } catch(e) {}
});

test('booking -> prepaid payment verify creates LabOrder (labIntent) and marks payment SUCCESS', async () => {
  const Payment = require('../../src/models/Payment');
  const LabOrder = require('../../src/models/LabOrder');

  // Create a fake user id
  const userId = new mongoose.Types.ObjectId();
  const partnerId = new mongoose.Types.ObjectId();
  const testId = new mongoose.Types.ObjectId();

  // Create Payment with labIntent (prepaid)
  const payment = await Payment.create({
    user: userId,
    amount: 499.0,
    currency: 'INR',
    status: 'CREATED',
    razorpayOrderId: 'order_test_123',
    labIntent: {
      partnerId: partnerId,
      testIds: [testId],
      scheduledDate: new Date().toISOString(),
      scheduledTime: '09:00 AM - 10:00 AM',
      collectionType: 'home',
      collectionAddress: { fullAddress: 'Test Addr' },
      memberId: 'self'
    }
  });

  // Compute valid signature
  const bodyToSign = 'order_test_123' + '|' + 'payment_test_456';
  const signature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(bodyToSign).digest('hex');

  const res = await request(app)
    .post('/api/payment/lab/verify')
    .send({ razorpay_order_id: 'order_test_123', razorpay_payment_id: 'payment_test_456', razorpay_signature: signature })
    .expect(200);

  expect(res.body).toBeDefined();
  expect(res.body.success).toBeTruthy();

  // Reload payment
  const updated = await Payment.findById(payment._id).lean();
  expect(updated.status === 'SUCCESS' || updated.status === 'SUCCESS').toBeTruthy();

  // LabOrder should be created and attached to payment
  const labOrder = await LabOrder.findOne({ patient: userId }).lean();
  expect(labOrder).toBeTruthy();
  expect(labOrder.paymentStatus === 'paid' || labOrder.paymentStatus === 'paid').toBeTruthy();
});
