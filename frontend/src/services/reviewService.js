import api from './api';

const reviewService = {
  submit: (data) => api.post('/reviews', data),
  getBookingReview: (bookingId) => api.get(`/reviews/booking/${bookingId}`),
  getProviderReviews: (providerId, params) => api.get(`/reviews/provider/${providerId}`, { params }),
};

export default reviewService;
