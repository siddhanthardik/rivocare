import { Routes, Route, Navigate } from 'react-router-dom';
import { GuestRoute, ProtectedRoute } from './components/layout/RouteGuards';
import Header from './components/layout/Header';
import DashboardLayout from './components/layout/DashboardLayout';
import ScrollToTop from './components/layout/ScrollToTop';
import { useAuth } from './context/AuthContext';
import { PageLoader } from './components/ui/Feedback';

// Pages
import Landing from './pages/Landing';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import BookingWizard from './pages/booking/BookingWizard';
import JoinProvider from './pages/JoinProvider';
import Footer from './components/layout/Footer';

import TermsOfService from './pages/legal/TermsOfService';
import PrivacyPolicy from './pages/legal/PrivacyPolicy';
import AboutUs from './pages/company/AboutUs';
import ContactUs from './pages/company/ContactUs';
import Careers from './pages/company/Careers';
import Sitemap from './pages/company/Sitemap';
import Blog from './pages/Blog';
import ReferralLanding from './pages/ReferralLanding';

// Services
import Services from './pages/services/Services';
import NursingCare from './pages/services/NursingCare';
import Physiotherapy from './pages/services/Physiotherapy';
import DoctorAtHome from './pages/services/DoctorAtHome';
import ElderCare from './pages/services/ElderCare';
// Patient Dashboard
import PatientOverview from './pages/dashboard/patient/Overview';
import PatientBookings from './pages/dashboard/patient/Bookings';
import PatientProfile from './pages/dashboard/patient/Profile';
import PatientPlansPackages from './pages/dashboard/patient/PlansPackages';
import PatientReferral from './pages/dashboard/patient/Referral';

// Provider Dashboard
import ProviderOverview from './pages/dashboard/provider/Overview';
import ProviderBookings from './pages/dashboard/provider/Bookings';
import ProviderAvailability from './pages/dashboard/provider/Availability';
import ProviderEarnings from './pages/dashboard/provider/Earnings';
import ProviderProfile from './pages/dashboard/provider/Profile';
import ProviderReferrals from './pages/dashboard/provider/Referrals';
import ProviderKYC from './pages/dashboard/provider/ProviderKYC';
import ProviderOnboarding from './pages/dashboard/provider/ProviderOnboarding';
import ProviderAssignments from './pages/dashboard/provider/Assignments';

// Admin Dashboard
import AdminOverview from './pages/dashboard/admin/Overview';
import AdminUsers from './pages/dashboard/admin/Users';
import AdminProviders from './pages/dashboard/admin/Providers';
import AdminBookings from './pages/dashboard/admin/Bookings';
import AdminKYC from './pages/dashboard/admin/AdminKYC';
import AdminRevenueDashboard from './pages/dashboard/admin/RevenueDashboard';
import AdminFraudDashboard from './pages/dashboard/admin/FraudDashboard';
import AdminServiceAreas from './pages/dashboard/admin/ServiceAreas';
import AdminPricingOS from './pages/dashboard/admin/PricingOS';

import AdminLabPricing from './pages/dashboard/admin/LabPricing';
import AdminSupplyExpansion from './pages/dashboard/admin/SupplyExpansion';
import ContentManagement from './components/admin/ContentManagement';
import AdminDispatch from './pages/dashboard/admin/Dispatch';

// --- Rivo Labs Imports ---
// Public
import LabsHome from './pages/labs/LabsHome';
import TestSearch from './pages/labs/TestSearch';
import LabCheckout from './pages/labs/LabCheckout';
import ReportsLogin from './pages/labs/ReportsLogin';
// Patient Labs
import LabBooking from './pages/dashboard/patient/LabBooking';
import LabOrders from './pages/dashboard/patient/LabOrders';
import LabReports from './pages/dashboard/patient/LabReports';
// Partner Labs
import PartnerLogin from './pages/dashboard/partner/PartnerLogin';
import PartnerOverview from './pages/dashboard/partner/Overview';
import OrderManagement from './pages/dashboard/partner/OrderManagement';
import TestCatalog from './pages/dashboard/partner/TestCatalog';
import StaffManagement from './pages/dashboard/partner/StaffManagement';
import PartnerWallet from './pages/dashboard/partner/Wallet';
// Admin Labs
import LabManagement from './pages/dashboard/admin/LabManagement';
import LabOrdersOverview from './pages/dashboard/admin/LabOrdersOverview';
import LabAnalytics from './pages/dashboard/admin/LabAnalytics';
import FinanceOS from './pages/dashboard/admin/FinanceOS';
import LabReconciliation from './pages/dashboard/admin/LabReconciliation';
import ErrorLogs from './pages/dashboard/admin/ErrorLogs';
// -----------------------

// Nav items
import { LayoutDashboard, Calendar, User, ToggleLeft, TrendingUp, Users, ShieldCheck, BookOpen, UserCheck, BarChart2, ShieldAlert, MapPin, DollarSign, Activity, FileText, FlaskConical, Wallet, AlertOctagon } from 'lucide-react';

const patientNav = [
  { path: '/dashboard/patient', label: 'Overview', icon: LayoutDashboard, end: true },
  { path: '/dashboard/patient/bookings', label: 'My Bookings', icon: Calendar },
  { path: '/dashboard/patient/plans', label: 'Plans & Packages', icon: BookOpen },
  { path: '/dashboard/patient/labs/book', label: 'Book Lab Test', icon: FlaskConical },
  { path: '/dashboard/patient/labs/orders', label: 'My Lab Orders', icon: Activity },
  { path: '/dashboard/patient/labs/reports', label: 'Diagnostic Reports', icon: FileText },
  { path: '/dashboard/patient/refer', label: 'Refer & Earn', icon: Users },
  { path: '/dashboard/patient/profile', label: 'Profile Settings', icon: User },
];
const providerNav = [
  { path: '/dashboard/provider', label: 'Overview', icon: LayoutDashboard, end: true },
  { path: '/dashboard/provider/bookings', label: 'Booking Requests', icon: BookOpen },
  { path: '/dashboard/provider/assignments', label: 'Assigned Packages', icon: ShieldCheck },
  { path: '/dashboard/provider/availability', label: 'Availability', icon: ToggleLeft },
  { path: '/dashboard/provider/earnings', label: 'Earnings', icon: TrendingUp },
  { path: '/dashboard/provider/referrals', label: 'Refer & Earn', icon: Users },
  { path: '/dashboard/provider/kyc', label: 'KYC & Verification', icon: ShieldCheck },
  { path: '/dashboard/provider/profile', label: 'Profile', icon: User },
  { path: '/dashboard/provider/onboarding', label: 'Onboarding', icon: UserCheck },
];
const partnerNav = [
  { path: '/dashboard/partner/lab', label: 'Overview', icon: LayoutDashboard, end: true },
  { path: '/dashboard/partner/lab/orders', label: 'Order Management', icon: Activity },
  { path: '/dashboard/partner/lab/tests', label: 'Test Catalog', icon: FlaskConical },
  { path: '/dashboard/partner/lab/staff', label: 'Staff Management', icon: Users },
  { path: '/dashboard/partner/lab/wallet', label: 'Wallet & Payouts', icon: Wallet },
];
const adminNav = [
  { path: '/dashboard/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { path: '/dashboard/admin/revenue', label: 'Revenue', icon: BarChart2 },
  { path: '/dashboard/admin/pricing', label: 'Pricing OS', icon: DollarSign },
  { path: '/dashboard/admin/content', label: 'Content Management', icon: BookOpen },
  { path: '/dashboard/admin/lab-pricing', label: 'Lab Pricing', icon: FlaskConical },
  { path: '/dashboard/admin/supply', label: 'Supply Expansion', icon: Users },
  { path: '/dashboard/admin/users', label: 'Users', icon: Users },
  { path: '/dashboard/admin/providers', label: 'Providers', icon: ShieldCheck },
  { path: '/dashboard/admin/kyc', label: 'KYC Approvals', icon: UserCheck },
  { path: '/dashboard/admin/service-areas', label: 'Service Areas', icon: MapPin },
  { path: '/dashboard/admin/labs', label: 'Lab Partners', icon: FlaskConical },
  { path: '/dashboard/admin/lab-orders', label: 'Lab Orders', icon: Activity },
  { path: '/dashboard/admin/lab-finance', label: 'Finance OS', icon: DollarSign },
  { path: '/dashboard/admin/lab-analytics', label: 'Lab Analytics', icon: BarChart2 },
  { path: '/dashboard/admin/lab-reconciliation', label: 'Reconciliation', icon: ShieldCheck },
  { path: '/dashboard/admin/bookings', label: 'Bookings', icon: Calendar },
  { path: '/dashboard/admin/dispatch', label: 'Control Tower', icon: Activity },
  { path: '/dashboard/admin/fraud', label: 'Fraud Analytics', icon: ShieldAlert },
  { path: '/dashboard/admin/errors', label: 'System Errors', icon: AlertOctagon },
];

export default function App() {
  const { loading } = useAuth();

  if (loading) return <PageLoader fullPage label="Initializing secure session..." />;

  return (
    <>
      <ScrollToTop />
      <Routes>
      {/* Public */}
      <Route path="/" element={<><Header /><Landing /></>} />
      <Route path="/services" element={<><Header /><Services /><Footer /></>} />
      <Route path="/services/nursing-care" element={<><Header /><NursingCare /><Footer /></>} />
      <Route path="/services/physiotherapy" element={<><Header /><Physiotherapy /><Footer /></>} />
      <Route path="/services/doctor-at-home" element={<><Header /><DoctorAtHome /><Footer /></>} />
      <Route path="/services/elder-care" element={<><Header /><ElderCare /><Footer /></>} />
      <Route path="/join" element={<><Header /><JoinProvider /></>} />
      <Route path="/about-us" element={<><Header /><AboutUs /><Footer /></>} />
      <Route path="/contact-us" element={<><Header /><ContactUs /><Footer /></>} />
      <Route path="/careers" element={<><Header /><Careers /><Footer /></>} />
      <Route path="/blog" element={<><Header /><Blog /><Footer /></>} />
      <Route path="/sitemap" element={<><Header /><Sitemap /><Footer /></>} />
      <Route path="/terms-of-service" element={<><Header /><TermsOfService /><Footer /></>} />
      <Route path="/terms-and-conditions" element={<Navigate to="/terms-of-service" replace />} />
      <Route path="/privacy-policy" element={<><Header /><PrivacyPolicy /><Footer /></>} />
      <Route path="/refer" element={<><Header /><ReferralLanding /><Footer /></>} />
      
      {/* Rivo Labs Public */}
      <Route path="/labs" element={<><Header /><LabsHome /><Footer /></>} />
      <Route path="/labs/search" element={<><Header /><TestSearch /><Footer /></>} />
      <Route path="/labs/reports" element={<><Header /><ReportsLogin /><Footer /></>} />
      <Route path="/partner/lab/login" element={<><Header /><PartnerLogin /><Footer /></>} />

      {/* Guest-only */}
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<><Header /><Login /></>} />
        <Route path="/register" element={<><Header /><Register /></>} />
        <Route path="/forgot-password" element={<><Header /><ForgotPassword /></>} />
        <Route path="/reset-password/:token" element={<><Header /><ResetPassword /></>} />
      </Route>

      {/* Patient */}
      <Route element={<ProtectedRoute role="patient" />}>
        <Route path="/dashboard/patient" element={<DashboardLayout navItems={patientNav} role="patient" />}>
          <Route index element={<PatientOverview />} />
          <Route path="plans" element={<PatientPlansPackages />} />
          <Route path="bookings" element={<PatientBookings />} />
          
          {/* Redirects for old routes */}
          <Route path="labs" element={<Navigate to="labs/orders" replace />} />
          <Route path="reports" element={<Navigate to="labs/reports" replace />} />
          
          {/* Nested Lab Routes */}
          <Route path="labs/book" element={<LabBooking />} />
          <Route path="labs/orders" element={<LabOrders />} />
          <Route path="labs/reports" element={<LabReports />} />
          
          <Route path="refer" element={<PatientReferral />} />
          <Route path="profile" element={<PatientProfile />} />
          <Route path="book" element={<BookingWizard />} />
          <Route path="labs/checkout" element={<LabCheckout />} />
        </Route>
      </Route>

      {/* Provider */}
      <Route element={<ProtectedRoute role="provider" />}>
        <Route path="/dashboard/provider" element={<DashboardLayout navItems={providerNav} role="provider" />}>
          <Route index element={<ProviderOverview />} />
          <Route path="bookings" element={<ProviderBookings />} />
          <Route path="assignments" element={<ProviderAssignments />} />
          <Route path="availability" element={<ProviderAvailability />} />
          <Route path="earnings" element={<ProviderEarnings />} />
          <Route path="referrals" element={<ProviderReferrals />} />
          <Route path="kyc" element={<ProviderKYC />} />
          <Route path="profile" element={<ProviderProfile />} />
          <Route path="onboarding" element={<ProviderOnboarding />} />
        </Route>
      </Route>

      {/* Partner Lab */}
      <Route element={<ProtectedRoute role="partner" />}>
        <Route path="/dashboard/partner/lab" element={<DashboardLayout navItems={partnerNav} role="partner" />}>
          <Route index element={<PartnerOverview />} />
          <Route path="orders" element={<OrderManagement />} />
          <Route path="tests" element={<TestCatalog />} />
          <Route path="staff" element={<StaffManagement />} />
          <Route path="wallet" element={<PartnerWallet />} />
        </Route>
      </Route>

      {/* Admin */}
      <Route element={<ProtectedRoute role="admin" />}>
        <Route path="/dashboard/admin" element={<DashboardLayout navItems={adminNav} role="admin" />}>
          <Route index element={<AdminOverview />} />
          <Route path="revenue" element={<AdminRevenueDashboard />} />
          <Route path="pricing" element={<AdminPricingOS />} />
          <Route path="content" element={<ContentManagement />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="providers" element={<AdminProviders />} />
          <Route path="kyc" element={<AdminKYC />} />
          <Route path="service-areas" element={<AdminServiceAreas />} />
          <Route path="labs" element={<LabManagement />} />
          <Route path="lab-orders" element={<LabOrdersOverview />} />
          <Route path="lab-finance" element={<FinanceOS />} />
          <Route path="lab-analytics" element={<LabAnalytics />} />
          <Route path="lab-reconciliation" element={<LabReconciliation />} />
          <Route path="bookings" element={<AdminBookings />} />
          <Route path="dispatch" element={<AdminDispatch />} />

          <Route path="lab-pricing" element={<AdminLabPricing />} />
          <Route path="supply" element={<AdminSupplyExpansion />} />
          <Route path="fraud" element={<AdminFraudDashboard />} />
          <Route path="errors" element={<ErrorLogs />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  );
}
