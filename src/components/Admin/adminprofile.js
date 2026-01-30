// src/components/Admin/adminprofile.jsx
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FaUser,
  FaEnvelope,
  FaShieldAlt,
  FaSignOutAlt,
  FaUserCircle,
  FaCrown,
  FaCheckCircle,
  FaClock,
  FaListUl,
} from "react-icons/fa";

const VENDOR_SERVICES_KEY = "local-service-discovery:vendor-services";
const ADMIN_STATE_KEY = "local-service-discovery:admin-service-state";

export default function AdminProfile() {
  const navigate = useNavigate();

  const storedUser = JSON.parse(localStorage.getItem("authUser") || "null");
  const [admin, setAdmin] = useState(storedUser);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: storedUser?.name || "",
    email: storedUser?.email || "",
  });

  // avatar (separate key for admin)
  const fileInputRef = useRef(null);
  const [avatarUrl, setAvatarUrl] = useState(
    localStorage.getItem("admin:avatar") || ""
  );

  // redirect if not admin
  if (!admin || !(admin.role === "admin" || admin.role === "Admin")) {
    navigate("/admin/login");
    return null;
  }

  // simple animation variants (same style as vendor profile)
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const stagger = {
    visible: {
      transition: { staggerChildren: 0.1 },
    },
  };

  // ─────────────────────────────
  // Moderation stats (dynamic)
  // ─────────────────────────────
  const [serviceStats, setServiceStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    verified: 0,
  });

  useEffect(() => {
    try {
      const rawServices =
        JSON.parse(localStorage.getItem(VENDOR_SERVICES_KEY) || "[]") || [];
      const adminState =
        JSON.parse(localStorage.getItem(ADMIN_STATE_KEY) || "{}") || {};

      const enriched = rawServices
        .map((s) => {
          const key = `vendor:${s.id}`; // same pattern as AdminServicesPage
          const override = adminState[key] || {};

          const status = override.status || "pending";
          const removed = !!override.removed;
          const isVerified =
            override.isVerified ??
            !!s.isVerified ??
            !!s.verified ??
            false;

          return { ...s, status, removed, isVerified };
        })
        .filter((s) => !s.removed);

      const total = enriched.length;
      const pending = enriched.filter((s) => s.status === "pending").length;
      const approved = enriched.filter((s) => s.status === "approved").length;
      const rejected = enriched.filter((s) => s.status === "rejected").length;
      const verified = enriched.filter((s) => s.isVerified).length;

      setServiceStats({ total, pending, approved, rejected, verified });
    } catch {
      setServiceStats({
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        verified: 0,
      });
    }
  }, []);

  const adminStats = [
    { label: "Total services", value: serviceStats.total },
    { label: "Pending approvals", value: serviceStats.pending },
    { label: "Verified services", value: serviceStats.verified },
  ];

  // ─────────────────────────────
  // Logout
  // ─────────────────────────────
  const handleLogout = () => {
    localStorage.removeItem("authUser");
    localStorage.removeItem("isLoggedIn");
    navigate("/admin/login");
  };

  // ─────────────────────────────
  // Save profile edits
  // ─────────────────────────────
  const handleSaveProfile = () => {
    const updated = {
      ...admin,
      name: editForm.name.trim() || admin.name,
      email: editForm.email.trim() || admin.email,
    };
    localStorage.setItem("authUser", JSON.stringify(updated));
    setAdmin(updated);
    setIsEditing(false);
  };

  // ─────────────────────────────
  // Avatar upload
  // ─────────────────────────────
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
        localStorage.setItem("admin:avatar", dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const accountStatusLabel = "Admin • Full access";

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
          background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
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
          color: #1d4ed8;
          box-shadow: 0 16px 32px rgba(0, 0, 0, 0.2);
          position: relative;
          overflow: hidden;
        }

        .profile-avatar img.avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 50%;
        }

        .default-avatar-icon {
          width: 70%;
          height: 70%;
        }

        .avatar-badge {
          position: absolute;
          bottom: 5px;
          right: 5px;
          width: 36px;
          height: 36px;
          background: #facc15;
          border-radius: 50%;
          border: 4px solid white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          color: #854d0e;
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
          color: #1d4ed8;
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
          background: rgba(255, 255, 255, 0.8);
          border: 2px solid #1d4ed8;
          padding: 10px 22px;
          border-radius: 50px;
          font-size: 15px;
          font-weight: 600;
          color: #1d4ed8;
          cursor: pointer;
          transition: all 0.25s ease;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 4px 8px rgba(37, 99, 235, 0.2);
        }

        .edit-btn:hover {
          background: #1d4ed8;
          color: white;
          border-color: #1d4ed8;
          transform: translateY(-3px);
          box-shadow: 0 6px 14px rgba(37, 99, 235, 0.35);
        }

        .edit-btn:active {
          transform: scale(0.96);
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
          border-color: #1d4ed8;
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

       @media (max-width: 992px) {
  .profile-header {
    padding: 44px 26px;
  }

  .profile-name {
    font-size: 30px;
  }

  .stats-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
  }

  .info-section,
  .danger-zone {
    padding: 26px;
  }
}

@media (max-width: 768px) {
  .profile-page {
    padding: 22px 12px;
  }

  .profile-header {
    padding: 34px 18px;
    border-radius: 18px;
  }

  .profile-avatar {
    width: 110px;
    height: 110px;
    font-size: 48px;
  }

  .profile-name {
    font-size: 26px;
  }

  .stats-grid {
    grid-template-columns: 1fr; /* ✅ stack stats */
    gap: 10px;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .edit-btn {
    width: 100%;
    justify-content: center;
  }

  .info-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .info-save-btn,
  .info-cancel-btn {
    width: 100%;
  }

  .modal-content {
    padding: 22px;
  }

  .modal-actions {
    flex-direction: column;
  }

  .modal-btn {
    width: 100%;
  }
}

@media (max-width: 420px) {
  .profile-name {
    font-size: 22px;
  }

  .profile-badge {
    width: 100%;
    justify-content: center;
    text-align: center;
  }
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
                <img src={avatarUrl} alt="Admin" className="avatar-img" />
              ) : (
                <FaUserCircle className="default-avatar-icon" />
              )}

              <div className="avatar-badge">
                <FaCrown size={16} />
              </div>

              <button
                type="button"
                className="edit-avatar-btn"
                onClick={handleAvatarButtonClick}
              >
                ✎
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
              {admin.name || "Admin"}
            </motion.h1>

            <motion.p
              className="profile-email"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              {admin.email}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
            >
              <span className="profile-badge">
                <FaShieldAlt />
                Platform Administrator
              </span>
            </motion.div>

            {/* stats */}
            <motion.div
              className="stats-grid"
              initial="hidden"
              animate="visible"
              variants={stagger}
            >
              {adminStats.map((s, idx) => (
                <motion.div
                  key={idx}
                  className="stat-card"
                  variants={fadeIn}
                >
                  <span className="stat-number">{s.value}</span>
                  <span className="stat-label">{s.label}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.div>

        {/* ACCOUNT INFO */}
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
              Admin Account
            </h2>
            <button
              className="edit-btn"
              onClick={() => {
                setIsEditing((prev) => !prev);
                setEditForm({
                  name: admin.name || "",
                  email: admin.email || "",
                });
              }}
            >
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
                <div className="info-value">{admin.name || "—"}</div>
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
                <div className="info-value">{admin.email}</div>
              )}
            </div>

            <div className="info-item">
              <div className="info-label">
                <FaShieldAlt size={12} />
                Role
              </div>
              <div className="info-value">Administrator</div>
            </div>

            <div className="info-item">
              <div className="info-label">
                <FaCheckCircle size={12} />
                Account Status
              </div>
              <div className="info-value" style={{ color: "#16a34a" }}>
                {accountStatusLabel}
              </div>
            </div>

            <div className="info-item">
              <div className="info-label">
                <FaClock size={12} />
                Moderation snapshot
              </div>
              <div className="info-value">
                {serviceStats.pending} pending • {serviceStats.approved} approved
                • {serviceStats.rejected} rejected
              </div>
            </div>

            <div className="info-item">
              <div className="info-label">
                <FaListUl size={12} />
                Managed services
              </div>
              <div className="info-value">
                {serviceStats.total || 0} vendor services
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
            Log out of the admin console. You’ll need your credentials to sign
            back in.
          </p>
          <button
            className="logout-btn"
            onClick={() => setShowLogoutConfirm(true)}
          >
            <FaSignOutAlt />
            Logout from Admin Account
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
              Are you sure you want to log out from the admin account?
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