import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import Chatbot from './components/Chatbot.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import AdminLogin from './pages/AdminLogin.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Apply from './pages/Apply.jsx';
import Payment from './pages/Payment.jsx';
import NotFound from './pages/NotFound.jsx';
import LegalIndex from './pages/legal/LegalIndex.jsx';
import PrivacyPolicy from './pages/legal/PrivacyPolicy.jsx';
import Terms from './pages/legal/Terms.jsx';
import Disclaimer from './pages/legal/Disclaimer.jsx';
import FairPractice from './pages/legal/FairPractice.jsx';
import Grievance from './pages/legal/Grievance.jsx';

import AdminApp from './pages/admin/AdminApp.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import AdminUsers from './pages/admin/AdminUsers.jsx';
import AdminApplications from './pages/admin/AdminApplications.jsx';
import AdminApplicationDetail from './pages/admin/AdminApplicationDetail.jsx';
import AdminPlans from './pages/admin/AdminPlans.jsx';
import AdminPayments from './pages/admin/AdminPayments.jsx';
import AdminChatbot from './pages/admin/AdminChatbot.jsx';
import AdminSettings from './pages/admin/AdminSettings.jsx';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />

        {/* Legacy multi-page URLs now scroll to sections on the single home page */}
        <Route path="/plans" element={<Navigate to="/#plans" replace />} />
        <Route path="/how-it-works" element={<Navigate to="/#how-it-works" replace />} />
        <Route path="/about" element={<Navigate to="/#about" replace />} />
        <Route path="/contact" element={<Navigate to="/#contact" replace />} />
        <Route path="/support" element={<Navigate to="/#support" replace />} />
        <Route path="/faq" element={<Navigate to="/#faq" replace />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Legal & compliance documents */}
        <Route path="/legal" element={<LegalIndex />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/disclaimer" element={<Disclaimer />} />
        <Route path="/fair-practice" element={<FairPractice />} />
        <Route path="/grievance" element={<Grievance />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/apply"
          element={
            <ProtectedRoute>
              <Apply />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payment/:applicationId"
          element={
            <ProtectedRoute>
              <Payment />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute adminOnly>
              <AdminApp />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="applications" element={<AdminApplications />} />
          <Route path="applications/:id" element={<AdminApplicationDetail />} />
          <Route path="plans" element={<AdminPlans />} />
          <Route path="payments" element={<AdminPayments />} />
          <Route path="chatbot" element={<AdminChatbot />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
      <Footer />
      <Chatbot />
    </>
  );
}
