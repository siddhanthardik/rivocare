/**
 * ── Carely / Rivo Service Layer ──────────────────────────────────────────────
 * Single entry point for ALL API interactions.
 * Standard: Each service is a default export object in its own file.
 * Re-exported here as named objects for easy consumption.
 * 
 * Usage: import { authService, providerService } from '@/services';
 */

import authService from './authService';
import providerService from './providerService';
import bookingService from './bookingService';
import adminService from './adminService';
import kycService from './kycService';
import reviewService from './reviewService';
import paymentService from './paymentService';
import walletService from './walletService';
import notificationService from './notificationService';
import subscriptionService from './subscriptionService';
import labService from './labService';
import pricingService from './pricingService';
import autoAssignEngine from './autoAssign';
import availabilityEngine from './availability';

// Extract utilities
const { getRecommendedProviders } = autoAssignEngine;
const { checkAvailability, getProviderAvailabilityConfig } = availabilityEngine;

export {
  authService,
  providerService,
  bookingService,
  adminService,
  kycService,
  reviewService,
  paymentService,
  walletService,
  notificationService,
  subscriptionService,
  labService,
  pricingService,
  getRecommendedProviders,
  checkAvailability,
  getProviderAvailabilityConfig
};
