const crypto = require('crypto');
const fs = require('fs');

const payload = {
  event: 'payment.captured',
  payload: {
    payment: {
      entity: {
        id: 'pay_test_123456',
        amount: 50000,
        currency: 'INR',
        order_id: 'order_test_123',
        status: 'captured'
      }
    }
  }
};

const raw = JSON.stringify(payload);
const secret = process.env.RAZORPAY_WEBHOOK_SECRET || 'dummysecret';
const signature = crypto.createHmac('sha256', secret).update(raw).digest('hex');

console.log('Raw payload:');
console.log(raw);
console.log('\nSignature (X-Razorpay-Signature): ' + signature);
console.log('\nRun this curl command to POST to local webhook endpoint:');
console.log(`curl -v -X POST http://localhost:5000/webhooks/razorpay \\
  -H "Content-Type: application/json" \\
  -H "X-Razorpay-Signature: ${signature}" \\
  -d '${raw.replace(/'/g, "'\\''")}'`);

// Optionally write to file
fs.writeFileSync('webhook_payload.json', raw);
console.log('\nPayload written to webhook_payload.json');
