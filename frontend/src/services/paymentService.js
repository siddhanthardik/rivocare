import api from './api';

const paymentService = {
  createOrder: (bookingId) => api.post('/payment/create-order', { bookingId }),
  verifyPayment: (data) => api.post('/payment/verify', data),
  payWithWallet: (bookingId) => api.post('/payment/pay-with-wallet', { bookingId }),
  createLabOrder: (orderId) => api.post('/payment/lab/create-order', { orderId }),
  verifyLabPayment: (data) => api.post('/payment/lab/verify', data),
};

export default paymentService;
