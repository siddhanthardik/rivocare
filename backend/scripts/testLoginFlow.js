const axios = require('axios');

const testLogin = async () => {
  try {
    const res = await axios.post('http://localhost:5000/api/partner/lab/login', {
      email: 'apollo@lab.com',
      password: 'password123'
    });
    console.log('Login Response:', JSON.stringify(res.data, null, 2));
    
    const token = res.data.token;
    const resMe = await axios.get('http://localhost:5000/api/partner/lab/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Me Response:', JSON.stringify(resMe.data, null, 2));
  } catch (err) {
    console.error('Error:', err.response?.data || err.message);
  }
};

testLogin();
