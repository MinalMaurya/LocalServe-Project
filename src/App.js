import React from "react";
import { Routes, Route, Navigate, useLocation, useParams } from "react-router-dom";

import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import Home from "./components/layout/Home";
import Shortlist from "./components/layout/Shortlist";
import About from "./components/layout/About";
import NotFound from "./components/layout/NotFound";
import ServiceDetails from "./components/service/ServiceDetails";
import MyRequests from "./components/layout/MyRequests";
import Login from "./components/layout/Login";
import Signup from "./components/layout/Signup";
import Profile from "./components/layout/Profile";
import Contact from "./components/layout/Contact";

import VendorDashboard from "./components/vendors/VendorDashboard";
import VendorRequestsPage from "./components/vendors/VendorRequestsPage";
import VendorReviewsPage from "./components/vendors/VendorReviewsPage";

import AdminServicesPage from "./components/Admin/AdminServicesPage";
import AdminSignup from "./components/Admin/adminsignup";
import AdminLogin from "./components/Admin/adminLogin";
import AdminHeader from "./components/Admin/adminHeader";
import AdminProfile from "./components/Admin/adminprofile";
import AdminRejectedServicesPage from "./components/Admin/AdminRejectedServicesPage";

import AdminAnalyticsOverview from "./components/Admin/AdminAnalyticsOverview";
import AdminAnalyticsService from "./components/Admin/AdminAnalyticsService";
import AdminAnalyticsRatings from "./components/Admin/AdminAnalyticsRatings";

import "./App.css";
import VendorAnalyticsPage from "./components/vendors/VendorAnalyticsPage";

const isAdminUser = (user) => user && (user.role === "admin" || user.role === "Admin");
const isVendorUser = (user) => user && user.role === "vendor";

function VendorAnalyticsRedirect() {
  return <Navigate to="/admin/analytics" replace />;
}

function VendorAnalyticsRatingsRedirect() {
  return <Navigate to="/admin/analytics/ratings" replace />;
}

function VendorAnalyticsServiceRedirect() {
  const { id } = useParams();
  return <Navigate to={`/admin/analytics/service/${id}`} replace />;
}

function App() {
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("authUser") || "null");

  const isAuthPage =
    location.pathname === "/login" ||
    location.pathname === "/signup" ||
    location.pathname === "/admin/login" ||
    location.pathname === "/admin/signup";

  const isAdmin = isAdminUser(user);
  const isVendor = isVendorUser(user);

  const isAdminRoute = location.pathname.startsWith("/admin") && !isAuthPage;

  return (
    <>
      {!isAuthPage && !isAdminRoute && <Header />}
      {!isAuthPage && isAdminRoute && <AdminHeader />}

      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
        <Route path="/signup" element={user ? <Navigate to="/" /> : <Signup />} />

        <Route
          path="/admin/login"
          element={isAdmin ? <Navigate to="/admin/services" /> : <AdminLogin />}
        />
        <Route path="/admin/signup" element={<AdminSignup />} />

        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />

        <Route path="/shortlist" element={user ? <Shortlist /> : <Navigate to="/login" />} />
        <Route path="/requests" element={user ? <MyRequests /> : <Navigate to="/login" />} />
        <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" />} />
        <Route path="/service/:id" element={user ? <ServiceDetails /> : <Navigate to="/login" />} />

        <Route
          path="/vendor/dashboard"
          element={isVendor ? <VendorDashboard /> : <Navigate to="/login" />}
        />
        <Route
          path="/vendor/requests"
          element={isVendor ? <VendorRequestsPage /> : <Navigate to="/login" />}
        />
        <Route
          path="/vendor/reviews"
          element={isVendor ? <VendorReviewsPage /> : <Navigate to="/login" />}
        />

        <Route path="/vendor/analytics" element={<VendorAnalyticsPage />} />


        <Route
          path="/admin/services"
          element={isAdmin ? <AdminServicesPage /> : <Navigate to="/admin/login" />}
        />
        <Route
          path="/admin/profile"
          element={isAdmin ? <AdminProfile /> : <Navigate to="/admin/login" />}
        />
        <Route
          path="/admin/removed"
          element={isAdmin ? <AdminRejectedServicesPage /> : <Navigate to="/admin/login" />}
        />

        <Route
          path="/admin/analytics"
          element={isAdmin ? <AdminAnalyticsOverview /> : <Navigate to="/admin/login" />}
        />
        <Route
          path="/admin/analytics/service/:id"
          element={isAdmin ? <AdminAnalyticsService /> : <Navigate to="/admin/login" />}
        />
        <Route
          path="/admin/analytics/ratings"
          element={isAdmin ? <AdminAnalyticsRatings /> : <Navigate to="/admin/login" />}
        />

        <Route path="*" element={<NotFound />} />
      </Routes>

      {!isAuthPage && !isAdminRoute && <Footer />}
    </>
  );
}

export default App;