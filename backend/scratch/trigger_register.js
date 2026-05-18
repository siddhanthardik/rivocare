const http = require('http');

const data = JSON.stringify({
  name: 'Test Patient',
  email: `test_patient_${Date.now()}@carely.com`,
  password: 'password123',
  phone: `9${Math.floor(Math.random() * 1000000000)}`.padEnd(10, '0'),
  pincode: '110001',
  acceptedTerms: true
});

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/auth/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  res.on('data', (d) => {
    process.stdout.write(d);
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.write(data);
req.end();
