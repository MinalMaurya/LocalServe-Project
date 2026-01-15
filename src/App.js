// src/App.js
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
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
import "./App.css";

function App() {
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("authUser"));

  // Hide header/footer on auth pages
  const isAuthPage =
    location.pathname === "/login" || location.pathname === "/signup";

  return (
    <>
      {/* Header is ALWAYS shown except on /login & /signup */}
      {!isAuthPage && <Header />}

      <Routes>
        {/* AUTH ROUTES */}
        <Route
          path="/login"
          element={user ? <Navigate to="/" /> : <Login />}
        />
        <Route
          path="/signup"
          element={user ? <Navigate to="/" /> : <Signup />}
        />

        {/* PUBLIC ROUTES (NO LOGIN REQUIRED) */}
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />

        {/* PROTECTED USER ROUTES (LOGIN REQUIRED) */}
        <Route
          path="/shortlist"
          element={user ? <Shortlist /> : <Navigate to="/login" />}
        />

        <Route
          path="/requests"
          element={user ? <MyRequests /> : <Navigate to="/login" />}
        />

        <Route
          path="/profile"
          element={user ? <Profile /> : <Navigate to="/login" />}
        />

        {/* SERVICE DETAILS – LOGIN REQUIRED */}
        <Route
          path="/service/:id"
          element={user ? <ServiceDetails /> : <Navigate to="/login" />}
        />

        {/* VENDOR-ONLY ROUTES */}
        <Route
          path="/vendor/dashboard"
          element={
            user && user.role === "vendor" ? (
              <VendorDashboard />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route
          path="/vendor/requests"
          element={
            user && user.role === "vendor" ? (
              <VendorRequestsPage />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route
          path="/vendor/reviews"
          element={
            user && user.role === "vendor" ? (
              <VendorReviewsPage />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>

      {!isAuthPage && <Footer />}
    </>
  );
}

export default App;