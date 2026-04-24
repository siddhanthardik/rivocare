import { Routes, Route, Navigate } from 'react-router-dom';
import { GuestRoute, ProtectedRoute } from './components/layout/RouteGuards';
import Header from './components/layout/Header';
import DashboardLayout from './components/layout/DashboardLayout';
import ScrollToTop from './components/layout/ScrollToTop';

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
import AdminPlansPackages from './pages/dashboard/admin/PlansPackages';
import AdminServicePricing from './pages/dashboard/admin/ServicePricing';
import AdminSupplyExpansion from './pages/dashboard/admin/SupplyExpansion';

// Nav items
import { LayoutDashboard, Calendar, User, ToggleLeft, TrendingUp, Users, ShieldCheck, BookOpen, UserCheck, BarChart2, ShieldAlert, MapPin, DollarSign } from 'lucide-react';

const patientNav = [
  { path: '/dashboard/patient', label: 'Overview', icon: LayoutDashboard, end: true },
  { path: '/dashboard/patient/plans', label: 'Plans & Packages', icon: BookOpen },
  { path: '/dashboard/patient/bookings', label: 'My Bookings', icon: Calendar },
  { path: '/dashboard/patient/profile', label: 'Profile', icon: User },
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
];
const adminNav = [
  { path: '/dashboard/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { path: '/dashboard/admin/revenue', label: 'Revenue', icon: BarChart2 },
  { path: '/dashboard/admin/plans', label: 'Plans & Packages', icon: BookOpen },
  { path: '/dashboard/admin/pricing', label: 'Service Pricing', icon: DollarSign },
  { path: '/dashboard/admin/supply', label: 'Supply Expansion', icon: Users },
  { path: '/dashboard/admin/users', label: 'Users', icon: Users },
  { path: '/dashboard/admin/providers', label: 'Providers', icon: ShieldCheck },
  { path: '/dashboard/admin/kyc', label: 'KYC Approvals', icon: UserCheck },
  { path: '/dashboard/admin/service-areas', label: 'Service Areas', icon: MapPin },
  { path: '/dashboard/admin/bookings', label: 'Bookings', icon: Calendar },
  { path: '/dashboard/admin/fraud', label: 'Fraud Analytics', icon: ShieldAlert },
];

export default function App() {
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

      {/* Guest-only */}
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<><Header /><Login /></>} />
        <Route path="/register" element={<><Header /><Register /></>} />
        <Route path="/forgot-password" element={<><Header /><ForgotPassword /></>} />
        <Route path="/reset-password/:token" element={<><Header /><ResetPassword /></>} />
      </Route>

      {/* Patient */}
      <Route element={<ProtectedRoute role="patient" />}>
        <Route path="/dashboard/patient" element={<DashboardLayout navItems={patientNav} />}>
          <Route index element={<PatientOverview />} />
          <Route path="plans" element={<PatientPlansPackages />} />
          <Route path="bookings" element={<PatientBookings />} />
          <Route path="profile" element={<PatientProfile />} />
          <Route path="book" element={<BookingWizard />} />
        </Route>
      </Route>

      {/* Provider */}
      <Route element={<ProtectedRoute role="provider" />}>
        <Route path="/dashboard/provider" element={<DashboardLayout navItems={providerNav} />}>
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

      {/* Admin */}
      <Route element={<ProtectedRoute role="admin" />}>
        <Route path="/dashboard/admin" element={<DashboardLayout navItems={adminNav} />}>
          <Route index element={<AdminOverview />} />
          <Route path="revenue" element={<AdminRevenueDashboard />} />
          <Route path="plans" element={<AdminPlansPackages />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="providers" element={<AdminProviders />} />
          <Route path="kyc" element={<AdminKYC />} />
          <Route path="service-areas" element={<AdminServiceAreas />} />
          <Route path="bookings" element={<AdminBookings />} />
          <Route path="pricing" element={<AdminServicePricing />} />
          <Route path="supply" element={<AdminSupplyExpansion />} />
          <Route path="fraud" element={<AdminFraudDashboard />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  );
}
