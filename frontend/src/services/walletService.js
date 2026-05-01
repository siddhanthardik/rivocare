import api from './api';

const walletService = {
  getInfo: () => api.get('/wallet'),
  getTransactions: (params) => api.get('/wallet/transactions', { params }),
  requestPayout: (amount) => api.post('/wallet/payout', { amount }),
};

export default walletService;
