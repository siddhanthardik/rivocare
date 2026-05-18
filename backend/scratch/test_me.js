const http = require('http');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5YzkwMTRkZjgzZjQwMzVjOTQyM2IxYiIsImlhdCI6MTc3ODQ4OTAyMCwiZXhwIjoxNzc4NDg5OTIwfQ.K-tAmv6ZAonP-W7QOgBD32iLJgh6IKiXe9q1jcjl3VQ';

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/auth/me',
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
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

req.end();
