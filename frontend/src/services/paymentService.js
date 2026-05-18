import api from './api';

const paymentService = {
  createOrder: (bookingId) => api.post('/payment/create-order', { bookingId }),
  // Accepts either { orderId } OR { labIntent: { partnerId, testIds, scheduledDate, scheduledTime, collectionType, collectionAddress, memberId } }
  createLabOrder: (payload) => api.post('/payment/lab/create-order', payload),
  verifyPayment: (data) => api.post('/payment/verify', data),
  payWithWallet: (bookingId) => api.post('/payment/pay-with-wallet', { bookingId }),
  verifyLabPayment: (data) => api.post('/payment/lab/verify', data),
  getBooking(bookingId) {
    return api.get(`/bookings/${bookingId}`).then(r => r.data);
  }
  ,
  markCashCollectedBooking(id, payload) {
    // payload may include amountCollected, note; optional proof (file) handled by caller
    return api.post(`/payments/mark-cash-collected/${id}`, payload).then(r => r.data);
  },
  confirmCash(id) {
    return api.post(`/payments/confirm-cash/${id}`).then(r => r.data);
  },
  reportCashIssue(id, payload) {
    return api.post(`/payments/report-cash-issue/${id}`, payload).then(r => r.data);
  }
};

export default paymentService;
