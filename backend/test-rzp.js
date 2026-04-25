const Razorpay = require('razorpay');

const razorpay = new Razorpay({
  key_id: 'rzp_live_SgasWMpO45ghby',
  key_secret: 'ZZFm7Rc14mWna27bPKl6MvKe',
});

async function test() {
  try {
    const order = await razorpay.orders.create({
      amount: 100,
      currency: 'INR',
      receipt: 'test_receipt',
    });
    console.log('Success:', order);
  } catch (err) {
    console.error('Error:', err);
  }
}

test();
