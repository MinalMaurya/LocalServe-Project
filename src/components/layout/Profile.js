// src/components/Profile.jsx
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import React, { useState, useRef, useEffect } from "react";
import {
  FaUser,
  FaEnvelope,
  FaBriefcase,
  FaHeart,
  FaSignOutAlt,
  FaShieldAlt,
  FaStar,
  FaEdit,
  FaHistory,
  FaChartLine,
  FaUserCircle,
  FaInbox,
  FaThumbsUp,
} from "react-icons/fa";

// same keys you use in VendorDashboard / Requests
const VENDOR_SESSION_KEY = "local-service-discovery:vendor-session";
const CONTACT_KEY = "local-service-discovery:contact-requests";
const VENDOR_REVIEWS_KEY = "local-service-discovery:vendor-reviews";
const VENDOR_SERVICES_KEY = "local-service-discovery:vendor-services";
const VENDOR_PROFILE_KEY = "local-service-discovery:vendor-profiles";

export default function Profile() {
  const navigate = useNavigate();

  // read once from localStorage
  const storedUser = JSON.parse(localStorage.getItem("authUser"));
  const [account, setAccount] = useState(storedUser);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: storedUser?.name || "",
    email: storedUser?.email || "",
  });

  // avatar
  const fileInputRef = useRef(null);
  const [avatarUrl, setAvatarUrl] = useState(
    localStorage.getItem("profile:avatar") || ""
  );

  if (!account) {
    navigate("/login");
    return null;
  }

  const isVendor = account.role === "vendor";

  // --- animations ---
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const stagger = {
    visible: {
      transition: { staggerChildren: 0.1 },
    },
  };

  // -----------------------------
  // CUSTOMER-SIDE METRICS
  // -----------------------------
  // favourites & history
  const [favoritesCount, setFavoritesCount] = useState(0);

useEffect(() => {
  try {
    // 💡 1st preference: the same key your app actually uses
    const rawFavs =
      localStorage.getItem("local-service-discovery:favorites") ||
      localStorage.getItem("local-service-discovery:shortlist") ||
      localStorage.getItem("shortlist") ||
      "[]";

    const parsed = JSON.parse(rawFavs);

    let arr = [];
    if (Array.isArray(parsed)) {
      arr = parsed;                 // e.g. [1, 2, 3]
    } else if (parsed && Array.isArray(parsed.items)) {
      arr = parsed.items;           // e.g. { items: [...] }
    }

    setFavoritesCount(arr.length);
  } catch (e) {
    console.warn("Failed to parse favorites from localStorage", e);
    setFavoritesCount(0);
  }
}, []);

const historyList = JSON.parse(localStorage.getItem("history") || "[]");

  // all requests in system
  const allRequests = JSON.parse(localStorage.getItem(CONTACT_KEY) || "[]");

  // requests sent by THIS customer
  const myRequests = allRequests.filter((r) => {
    // when we send request we stored:
    // customerName: authUser?.name || authUser?.email || "You"
    const customerName = (r.customerName || "").toLowerCase();
    const name = (account.name || "").toLowerCase();
    const email = (account.email || "").toLowerCase();

    return customerName === name || customerName === email;
  });

  // recommendations (you can fill this later from your logic)
  const recommendations = JSON.parse(
    localStorage.getItem("recommendations") || "[]"
  );

  // ---- Services viewed: unique services from history + from requests ----
  const viewedServiceIds = new Set();

  // history items (assume { id, ... } )
  historyList.forEach((item) => {
    if (item && item.id != null) {
      viewedServiceIds.add(item.id);
    }
  });

  // also count services where this customer sent a request
  myRequests.forEach((req) => {
    if (req && req.serviceId != null) {
      viewedServiceIds.add(req.serviceId);
    }
  });

  const servicesViewedCount = viewedServiceIds.size;

 const customerStats = [
  { label: "Services viewed", value: servicesViewedCount },
  { label: "Favorites", value: favoritesCount },
  { label: "Requests", value: myRequests.length }, // bookings/requests
];

  // -----------------------------
  // VENDOR-SIDE METRICS
  // -----------------------------
  let vendorStats = [
    { label: "Active services", value: 1 },
    { label: "Customer requests", value: 0 },
    { label: "Average rating", value: "—" },
  ];

  let vendorQuickMetrics = {
    totalRequests: 0,
    pendingRequests: 0,
    reviewsCount: 0,
  };

  // NEW: for status box logic
  let vendorAvailability = null;   // "Available", "Busy", "Offline", etc.
  let vendorIsVerified = false;    // set by admin

  if (isVendor) {
    const vendorSession = JSON.parse(
      localStorage.getItem(VENDOR_SESSION_KEY) || "null"
    );

    if (vendorSession?.serviceId != null) {
      // requests for this service
      const allReq =
        JSON.parse(localStorage.getItem(CONTACT_KEY) || "[]") || [];
      const mineReq = allReq.filter(
        (r) => r.serviceId === vendorSession.serviceId
      );

      const total = mineReq.length;
      const pending = mineReq.filter(
        (r) =>
          (r.status || "").toLowerCase() === "pending" ||
          (r.requestStatus || "Pending") === "Pending"
      ).length;

      // reviews for this service
      const allReviews =
        JSON.parse(localStorage.getItem(VENDOR_REVIEWS_KEY) || "[]") || [];
      const myReviews = allReviews.filter(
        (r) => r.serviceId === vendorSession.serviceId
      );
      const avgRating =
        myReviews.length > 0
          ? (
              myReviews.reduce((sum, r) => sum + (r.rating || 0), 0) /
              myReviews.length
            ).toFixed(1)
          : "—";

      vendorStats = [
        { label: "Customer requests", value: total },
        { label: "Pending", value: pending },
        { label: "Average rating", value: avgRating },
      ];

      vendorQuickMetrics = {
        totalRequests: total,
        pendingRequests: pending,
        reviewsCount: myReviews.length,
      };

      // 🔹 NEW: read availability from vendor profile
      try {
        const allProfiles =
          JSON.parse(localStorage.getItem(VENDOR_PROFILE_KEY) || "{}") || {};
        const myProfile =
          allProfiles[String(vendorSession.serviceId)] || {};
        vendorAvailability = myProfile.availability || null;
      } catch {
        vendorAvailability = null;
      }

      // 🔹 NEW: read isVerified from vendor services
      try {
        const allVendorServices =
          JSON.parse(localStorage.getItem(VENDOR_SERVICES_KEY) || "[]") || [];
        const thisService = allVendorServices.find(
          (s) => s.id === vendorSession.serviceId
        );
        vendorIsVerified = !!(thisService && thisService.isVerified);
      } catch {
        vendorIsVerified = false;
      }
    }
  }

  const statsToShow = isVendor ? vendorStats : customerStats;

  // --- quick actions ---

  const quickActionsCustomer = [
    {
     icon: <FaHeart />,
  title: "My Favorites",
  description: "Saved services",
  count: `${favoritesCount} items`,
  action: () => navigate("/shortlist"),
      color: "#ef4444",
      gradient: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
    },
    {
      icon: <FaHistory />,
      // renamed
      title: "My Requests",
      description: "All service requests you’ve sent",
      count: `${myRequests.length} requests`,
      // go to customer requests page (adjust route if different)
      action: () => navigate("/requests"),
      color: "#3b82f6",
      gradient: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
    },
    {
      icon: <FaThumbsUp />,
      title: "Recommendations",
      description: "Services you might like",
      count: `${recommendations.length} suggestions`,
      // open same as homepage
      action: () => navigate("/"),
      color: "#10b981",
      gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    },
  ];

  // vendor-specific actions – wired to existing vendor routes
  const quickActionsVendor = [
    {
      icon: <FaBriefcase />,
      title: "Service dashboard",
      description: "Manage profile & performance",
      count: "Open dashboard",
      action: () => navigate("/vendor/dashboard"),
      color: "#3b82f6",
      gradient: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
    },
    {
      icon: <FaInbox />,
      title: "Customer requests",
      description: "View & respond to leads",
      count: `${vendorQuickMetrics.totalRequests} requests`,
      action: () => navigate("/vendor/requests"),
      color: "#10b981",
      gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    },
    {
      icon: <FaStar />,
      title: "Reviews",
      description: "See what customers say",
      count: `${vendorQuickMetrics.reviewsCount} reviews`,
      action: () => navigate("/vendor/reviews"),
      color: "#f59e0b",
      gradient: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
    },
    {
      icon: <FaChartLine />,
      title: "Performance",
      description: "Track conversion & response",
      count: "View stats",
      action: () => navigate("/vendor/dashboard"),
      color: "#6366f1",
      gradient: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
    },
  ];

  const quickActions = isVendor ? quickActionsVendor : quickActionsCustomer;

  // --- logout ---
  const handleLogout = () => {
    localStorage.removeItem("authUser");
    localStorage.removeItem(VENDOR_SESSION_KEY);
    window.location.href = "/login";
  };

  // --- save edited profile (basic account info) ---
  const handleSaveProfile = () => {
    const updated = {
      ...account,
      name: editForm.name.trim() || account.name,
      email: editForm.email.trim() || account.email,
    };
    localStorage.setItem("authUser", JSON.stringify(updated));
    setAccount(updated);
    setIsEditing(false);
  };

  // --- avatar upload ---
  const handleAvatarButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      if (typeof dataUrl === "string") {
        setAvatarUrl(dataUrl);
        localStorage.setItem("profile:avatar", dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

    // 🔹 Compute final status text + color for the Account Status box
  let accountStatusLabel = "Active";
  let accountStatusColor = "#0f172a";

  if (!isVendor) {
    // normal customer
    accountStatusLabel = "Active";
    accountStatusColor = "#0f172a";
  } else {
    const avail = (vendorAvailability || "").toLowerCase();

    if (!vendorIsVerified && !vendorAvailability) {
      // no profile availability set + not verified by admin
      accountStatusLabel = "Unverified";
      accountStatusColor = "#f97316"; // orange
    } else if (vendorIsVerified) {
      // ✅ VERIFIED by admin
      accountStatusColor = "#10b981"; // green
      if (avail === "busy") {
        accountStatusLabel = "Busy · Verified";
      } else if (avail === "available") {
        accountStatusLabel = "Active · Verified";
      } else {
        accountStatusLabel = "Verified";
      }
    } else {
      // ❗ Not verified but availability known
      accountStatusColor = "#f97316"; // orange
      if (avail === "busy") {
        accountStatusLabel = "Busy · Not verified";
      } else if (avail === "available") {
        accountStatusLabel = "Active · Not verified";
      } else {
        accountStatusLabel = "Unverified";
      }
    }
  }


  return (
    <div className="profile-page">
     <style>{`
        .profile-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          padding: 40px 20px;
        }

        .profile-container {
          max-width: 1100px;
          margin: 0 auto;
        }

        .profile-header {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          border-radius: 24px;
          padding: 60px 48px;
          color: white;
          text-align: center;
          margin-bottom: 40px;
          position: relative;
          overflow: hidden;
        }

        .profile-header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml,<svg width="60" height="60" xmlns="http://www.w3.org/2000/svg"><circle cx="30" cy="30" r="1.5" fill="rgba(255,255,255,0.1)"/></svg>');
          opacity: 0.4;
        }

        .profile-header::after {
          content: '';
          position: absolute;
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
          top: -200px;
          right: -200px;
          border-radius: 50%;
        }

        .profile-content {
          position: relative;
          z-index: 1;
        }

        .profile-avatar {
          width: 140px;
          height: 140px;
          background: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px;
          font-size: 64px;
          color: #3b82f6;
          box-shadow: 0 16px 32px rgba(0, 0, 0, 0.2);
          position: relative;
        }

        .avatar-badge {
          position: absolute;
          bottom: 5px;
          right: 5px;
          width: 36px;
          height: 36px;
          background: #10b981;
          border-radius: 50%;
          border: 4px solid white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
        }

        .edit-avatar-btn {
          position: absolute;
          top: 5px;
          right: 5px;
          width: 36px;
          height: 36px;
          background: rgba(255, 255, 255, 0.9);
          border-radius: 50%;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          color: #3b82f6;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .edit-avatar-btn:hover {
          background: white;
          transform: scale(1.1);
        }

        .profile-name {
          font-size: 40px;
          font-weight: 800;
          margin-bottom: 8px;
          letter-spacing: -0.5px;
        }

        .profile-email {
          font-size: 16px;
          opacity: 0.9;
          margin-bottom: 16px;
        }

        .profile-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.25);
          padding: 10px 24px;
          border-radius: 50px;
          font-size: 14px;
          font-weight: 600;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          margin-top: 32px;
        }

        .stat-card {
          background: rgba(255, 255, 255, 0.15);
          border-radius: 16px;
          padding: 20px;
          text-align: center;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .stat-number {
          font-size: 32px;
          font-weight: 800;
          display: block;
          margin-bottom: 4px;
        }

        .stat-label {
          font-size: 13px;
          opacity: 0.9;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .actions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 24px;
          margin-bottom: 32px;
        }

        .action-card {
          background: white;
          border-radius: 20px;
          padding: 28px;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          border: 2px solid transparent;
          position: relative;
          overflow: hidden;
        }

        .action-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: var(--card-gradient);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .action-card:hover::before {
          opacity: 0.05;
        }

        .action-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 16px 32px rgba(0, 0, 0, 0.12);
          border-color: var(--card-color);
        }

        .action-icon-wrapper {
          width: 64px;
          height: 64px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
          font-size: 28px;
          color: white;
          position: relative;
          z-index: 1;
        }

        .action-title {
          font-size: 18px;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 6px;
          position: relative;
          z-index: 1;
        }

        .action-description {
          font-size: 14px;
          color: #64748b;
          margin-bottom: 12px;
          position: relative;
          z-index: 1;
        }

        .action-count {
          display: inline-block;
          background: var(--card-color);
          color: white;
          padding: 4px 12px;
          border-radius: 50px;
          font-size: 12px;
          font-weight: 700;
          position: relative;
          z-index: 1;
        }

        .info-section {
          background: white;
          border-radius: 24px;
          padding: 40px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
          margin-bottom: 24px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
        }

        .section-title {
          font-size: 24px;
          font-weight: 800;
          color: #0f172a;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .edit-btn {
          background: #f1f5f9;
          border: none;
          padding: 10px 20px;
          border-radius: 50px;
          font-size: 14px;
          font-weight: 600;
          color: #0f172a;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .edit-btn:hover {
          background: #e2e8f0;
          transform: translateX(4px);
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 24px;
        }

        .info-item {
          padding: 20px;
          background: #f8fafc;
          border-radius: 16px;
          border: 2px solid #e2e8f0;
          transition: all 0.3s ease;
        }

        .info-item:hover {
          border-color: #3b82f6;
          background: #f1f5f9;
        }

        .info-label {
          font-size: 12px;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .info-value {
          font-size: 16px;
          font-weight: 600;
          color: #0f172a;
        }

        .danger-zone {
          background: white;
          border-radius: 24px;
          padding: 40px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
          border: 2px solid #fee2e2;
        }

        .logout-btn {
          width: 100%;
          padding: 16px;
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 8px 16px rgba(239, 68, 68, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        .logout-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 24px rgba(239, 68, 68, 0.4);
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal-content {
          background: white;
          border-radius: 24px;
          padding: 40px;
          max-width: 400px;
          width: 100%;
          text-align: center;
        }

        .modal-icon {
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px;
          font-size: 36px;
          color: #ef4444;
        }

        .modal-title {
          font-size: 24px;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 12px;
        }

        .modal-description {
          font-size: 15px;
          color: #64748b;
          margin-bottom: 32px;
          line-height: 1.6;
        }

        .modal-actions {
          display: flex;
          gap: 12px;
        }

        .modal-btn {
          flex: 1;
          padding: 14px;
          border: none;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .modal-btn-cancel {
          background: #f1f5f9;
          color: #0f172a;
        }

        .modal-btn-cancel:hover {
          background: #e2e8f0;
        }

        .modal-btn-confirm {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
        }

        .modal-btn-confirm:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(239, 68, 68, 0.3);
        }

        @media (max-width: 768px) {
          .profile-header {
            padding: 40px 24px;
          }

          .profile-name {
            font-size: 32px;
          }

          .stats-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
          }

          .stat-card {
            padding: 16px 12px;
          }

          .stat-number {
            font-size: 24px;
          }

          .stat-label {
            font-size: 11px;
          }

          .actions-grid {
            grid-template-columns: 1fr;
          }

          .info-section,
          .danger-zone {
            padding: 24px;
          }
        }
          .edit-btn {
  background: rgba(255, 255, 255, 0.8);
  border: 2px solid #3b82f6;
  padding: 10px 22px;
  border-radius: 50px;
  font-size: 15px;
  font-weight: 600;
  color: #2563eb;
  cursor: pointer;
  transition: all 0.25s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 8px rgba(59, 130, 246, 0.2);
}

.edit-btn:hover {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
  transform: translateY(-3px);
  box-shadow: 0 6px 14px rgba(59, 130, 246, 0.35);
}

.edit-btn:active {
  transform: scale(0.96);
}
          .info-actions {
          margin-top: 24px;
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }

        .info-save-btn,
        .info-cancel-btn {
          padding: 10px 20px;
          border-radius: 999px;
          border: none;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .info-save-btn {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          color: #ffffff;
          box-shadow: 0 8px 18px rgba(37, 99, 235, 0.35);
        }

        .info-save-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 10px 22px rgba(37, 99, 235, 0.45);
        }

        .info-cancel-btn {
          background: #f1f5f9;
          color: #0f172a;
        }

        .info-cancel-btn:hover {
          background: #e2e8f0;
        }
      `}</style>

      <div className="profile-container">
        {/* HEADER */}
        <motion.div
          className="profile-header"
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          transition={{ duration: 0.6 }}
        >
          <div className="profile-content">
            <motion.div
  className="profile-avatar"
  initial={{ scale: 0 }}
  animate={{ scale: 1 }}
  transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
>
  {avatarUrl ? (
    <img src={avatarUrl} alt="Profile" className="avatar-img" />
  ) : (
    <FaUserCircle className="default-avatar-icon" />
  )}

  {isVendor && (
    <div className="avatar-badge">
      <FaStar size={16} />
    </div>
  )}

  <button type="button" className="edit-avatar-btn" onClick={handleAvatarButtonClick}>
    <FaEdit />
  </button>

  <input
    ref={fileInputRef}
    type="file"
    accept="image/*"
    style={{ display: "none" }}
    onChange={handleAvatarChange}
  />
</motion.div>

            <motion.h1
              className="profile-name"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {account.name || "User"}
            </motion.h1>

            <motion.p
              className="profile-email"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              {account.email}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
            >
              <span className="profile-badge">
                {isVendor ? <FaBriefcase /> : <FaUser />}
                {isVendor ? "Service Provider" : "Customer"}
              </span>
            </motion.div>

            {/* stats */}
            <motion.div
              className="stats-grid"
              initial="hidden"
              animate="visible"
              variants={stagger}
            >
              {statsToShow.map((s, idx) => (
                <motion.div key={idx} className="stat-card" variants={fadeIn}>
                  <span className="stat-number">{s.value}</span>
                  <span className="stat-label">{s.label}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.div>

        {/* QUICK ACTIONS */}
        <motion.div
          className="actions-grid"
          initial="hidden"
          whileInView="visible"
          variants={stagger}
          viewport={{ once: true }}
        >
          {quickActions.map((action, index) => (
            <motion.div
              key={index}
              className="action-card"
              variants={fadeIn}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={action.action}
              style={{
                "--card-color": action.color,
                "--card-gradient": action.gradient,
              }}
            >
              <div
                className="action-icon-wrapper"
                style={{ background: action.gradient }}
              >
                {action.icon}
              </div>
              <h3 className="action-title">{action.title}</h3>
              <p className="action-description">{action.description}</p>
              <span className="action-count">{action.count}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* ACCOUNT INFORMATION */}
        <motion.div
          className="info-section"
          initial="hidden"
          whileInView="visible"
          variants={fadeIn}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="section-header">
            <h2 className="section-title">
              <FaUser />
              Account Information
            </h2>
            <button
              className="edit-btn"
              onClick={() => {
                setIsEditing((prev) => !prev);
                setEditForm({
                  name: account.name || "",
                  email: account.email || "",
                });
              }}
            >
              <FaEdit />
              {isEditing ? "Close" : "Edit Profile"}
            </button>
          </div>

          <div className="info-grid">
            <div className="info-item">
              <div className="info-label">
                <FaUser size={12} />
                Full Name
              </div>
              {isEditing ? (
                <input
                  className="info-input"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, name: e.target.value }))
                  }
                />
              ) : (
                <div className="info-value">{account.name || "—"}</div>
              )}
            </div>

            <div className="info-item">
              <div className="info-label">
                <FaEnvelope size={12} />
                Email Address
              </div>
              {isEditing ? (
                <input
                  className="info-input"
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, email: e.target.value }))
                  }
                />
              ) : (
                <div className="info-value">{account.email}</div>
              )}
            </div>

            <div className="info-item">
              <div className="info-label">
                <FaBriefcase size={12} />
                Account Type
              </div>
              <div className="info-value">
                {isVendor ? "Service Provider" : "Customer"}
              </div>
            </div>

              <div className="info-item">
              <div className="info-label">
                <FaShieldAlt size={12} />
                Account Status
              </div>
              <div
                className="info-value"
                style={{ color: accountStatusColor }}
              >
                {accountStatusLabel}
              </div>
            </div>
          </div>

          {isEditing && (
            <div className="info-actions">
              <button
                className="info-cancel-btn"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </button>
              <button className="info-save-btn" onClick={handleSaveProfile}>
                Save Changes
              </button>
            </div>
          )}
        </motion.div>

        {/* DANGER ZONE */}
        <motion.div
          className="danger-zone"
          initial="hidden"
          whileInView="visible"
          variants={fadeIn}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h2 className="section-title" style={{ marginBottom: "20px" }}>
            <FaSignOutAlt />
            Account Actions
          </h2>
          <p style={{ color: "#64748b", marginBottom: "24px" }}>
            Ready to sign out? You can log back in anytime with your
            credentials.
          </p>
          <button
            className="logout-btn"
            onClick={() => setShowLogoutConfirm(true)}
          >
            <FaSignOutAlt />
            Logout from Account
          </button>
        </motion.div>
      </div>

      {/* LOGOUT MODAL */}
      {showLogoutConfirm && (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setShowLogoutConfirm(false)}
        >
          <motion.div
            className="modal-content"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-icon">
              <FaSignOutAlt />
            </div>
            <h3 className="modal-title">Confirm Logout</h3>
            <p className="modal-description">
              Are you sure you want to log out? You'll need to sign in again to
              access your account.
            </p>
            <div className="modal-actions">
              <button
                className="modal-btn modal-btn-cancel"
                onClick={() => setShowLogoutConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="modal-btn modal-btn-confirm"
                onClick={handleLogout}
              >
                Yes, Logout
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}