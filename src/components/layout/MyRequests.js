// src/components/layout/MyRequests.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  FaHistory,
  FaFilter,
  FaClock,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaExclamationCircle,
  FaCheckCircle,
  FaBolt,
  FaWrench,
  FaBook,
  FaCar,
  FaHome,
  FaTimes,
} from "react-icons/fa";

const CONTACT_KEY = "local-service-discovery:contact-requests";

const categoryIcon = {
  Electrician: <FaBolt className="me-2" />,
  Plumber: <FaWrench className="me-2" />,
  Tutor: <FaBook className="me-2" />,
  Mechanic: <FaCar className="me-2" />,
  "Home Service": <FaHome className="me-2" />,
};

function classifyStatus(req) {
  // Upcoming / Past based on preferredDate
  const today = new Date();
  if (!req.preferredDate || req.preferredDate === "Flexible") {
    return "Upcoming";
  }
  const date = new Date(req.preferredDate);
  if (isNaN(date.getTime())) return "Upcoming";

  if (
    date.getFullYear() > today.getFullYear() ||
    (date.getFullYear() === today.getFullYear() &&
      (date.getMonth() > today.getMonth() ||
        (date.getMonth() === today.getMonth() &&
          date.getDate() >= today.getDate())))
  ) {
    return "Upcoming";
  }
  return "Past";
}

export default function MyRequests() {
  const [requests, setRequests] = useState([]);
  const [viewFilter, setViewFilter] = useState("All"); // All / Upcoming / Accepted
  const [urgencyFilter, setUrgencyFilter] = useState("All");

  const [selectedRequest, setSelectedRequest] = useState(null);
  const [editData, setEditData] = useState(null);
    useEffect(() => {
    const originalOverflow = document.body.style.overflow || "";

    if (selectedRequest) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = originalOverflow;
    }

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [selectedRequest]);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(CONTACT_KEY) || "[]");
      const sorted = [...stored].sort(
        (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()
      );
      // ensure each has requestStatus
      const enriched = sorted.map((r) => ({
        requestStatus: "Pending",
        ...r,
        requestStatus: r.requestStatus || "Pending",
      }));
      setRequests(enriched);
    } catch {
      setRequests([]);
    }
  }, []);

  const filtered = useMemo(() => {
    return requests.filter((req) => {
      const status = classifyStatus(req);

      if (viewFilter === "Upcoming" && status !== "Upcoming") {
        return false;
      }
      if (viewFilter === "Accepted" && req.requestStatus !== "Accepted") {
        return false;
      }

      if (urgencyFilter !== "All" && req.urgency !== urgencyFilter) {
        return false;
      }
      return true;
    });
  }, [requests, viewFilter, urgencyFilter]);

  // Stats
  const totalRequests = requests.length;
  const upcomingCount = requests.filter(
    (r) => classifyStatus(r) === "Upcoming"
  ).length;
  const acceptedCount = requests.filter(
    (r) => r.requestStatus === "Accepted"
  ).length;

  // open details modal
  const openDetails = (req) => {
    setSelectedRequest(req);
    setEditData({
      urgency: req.urgency || "Normal",
      preferredDate:
        !req.preferredDate || req.preferredDate === "Flexible"
          ? ""
          : req.preferredDate,
      preferredTime:
        !req.preferredTime || req.preferredTime === "Flexible"
          ? ""
          : req.preferredTime,
      message: req.message || "",
    });
  };

  const closeDetails = () => {
    setSelectedRequest(null);
    setEditData(null);
  };

  const handleSaveEdit = () => {
    if (!selectedRequest || !editData) return;

    const updated = requests.map((r) => {
      if (r.id === selectedRequest.id && r.time === selectedRequest.time) {
        return {
          ...r,
          urgency: editData.urgency,
          preferredDate: editData.preferredDate || "Flexible",
          preferredTime: editData.preferredTime || "Flexible",
          message:
            editData.message.trim() || "No additional details provided.",
        };
      }
      return r;
    });

    setRequests(updated);
    localStorage.setItem(CONTACT_KEY, JSON.stringify(updated));

    const refreshed = updated.find(
      (r) => r.id === selectedRequest.id && r.time === selectedRequest.time
    );
    setSelectedRequest(refreshed);
  };

  return (
    <div className="my-requests-page">
      <style>{`
        .my-requests-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          padding: 0 0 40px 0;
        }

        .my-requests-container {
          max-width: 1100px;
          margin: 0 auto;
          padding: 0 20px;
        }

        /* 🔷 FULL WIDTH HERO */
        .page-hero-wrapper {
          width: 100%;
          margin-bottom: 32px;
        }

        .page-hero {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          border-radius: 0 0 24px 24px;
          padding: 32px 20px 36px;
          color: white;
          position: relative;
          overflow: hidden;
        }

        .page-hero-inner {
          max-width: 1100px;
          margin: 0 auto;
        }

        .page-hero::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml,<svg width="60" height="60" xmlns="http://www.w3.org/2000/svg"><circle cx="30" cy="30" r="1.5" fill="rgba(255,255,255,0.12)"/></svg>');
          opacity: 0.5;
        }

        .page-hero::after {
          content: '';
          position: absolute;
          width: 320px;
          height: 320px;
          background: radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%);
          top: -160px;
          right: -160px;
          border-radius: 50%;
        }

        .page-hero-content {
          position: relative;
          z-index: 1;
          animation: fadeUpSoft 0.6s ease-out forwards;
          opacity: 0;
          transform: translateY(16px);
        }

        .page-hero-title-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 24px;
        }

        .page-hero-title-block {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .page-hero-icon {
          width: 44px;
          height: 44px;
          border-radius: 16px;
          background: rgba(15, 23, 42, 0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
        }

        .page-hero-title {
          font-size: 30px;
          font-weight: 800;
          letter-spacing: -0.5px;
        }

        .page-hero-subtitle {
          font-size: 14px;
          opacity: 0.9;
          margin-top: 4px;
        }

        .page-hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 18px;
          border-radius: 999px;
          background: rgba(15, 23, 42, 0.25);
          border: 1px solid rgba(255,255,255,0.3);
          font-size: 12px;
          font-weight: 600;
          backdrop-filter: blur(10px);
        }

        .page-hero-stats {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 18px;
          margin-top: 4px;
        }

        .page-hero-stat-card {
          background: rgba(15, 23, 42, 0.22);
          border-radius: 18px;
          padding: 14px 16px;
          border: 1px solid rgba(148, 163, 184, 0.45);
          backdrop-filter: blur(10px);
        }

        .page-hero-stat-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          opacity: 0.9;
        }

        .page-hero-stat-value {
          font-size: 22px;
          font-weight: 800;
          margin-top: 4px;
        }

        .page-hero-stat-chip {
          font-size: 12px;
          margin-top: 2px;
          opacity: 0.9;
        }

        /* FILTERS */
        .requests-section {
          animation: fadeUpSoft 0.6s ease-out forwards;
          animation-delay: 0.1s;
          opacity: 0;
          transform: translateY(16px);
        }

        .requests-filters {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 18px;
        }

        .requests-filters-left {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #0f172a;
          font-weight: 600;
        }

        .requests-filters-right {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .view-toggle-group {
          display: inline-flex;
          padding: 3px;
          border-radius: 999px;
          background: #e2e8f0;
        }

        .view-toggle-btn {
          font-size: 12px;
          padding: 6px 12px;
          border-radius: 999px;
          border: none;
          background: transparent;
          cursor: pointer;
          font-weight: 600;
          color: #475569;
          transition: all 0.2s ease;
        }

        .view-toggle-btn.active {
          background: white;
          color: #1d4ed8;
          box-shadow: 0 1px 4px rgba(15, 23, 42, 0.18);
        }

        .requests-select {
          border-radius: 999px;
          border: 1px solid #cbd5e1;
          padding: 8px 14px;
          font-size: 13px;
          background: white;
          min-width: 140px;
          outline: none;
        }

        .requests-select:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 1px rgba(59,130,246,0.2);
        }

        /* LIST + CARDS */
        .requests-list-wrapper {
          background: white;
          border-radius: 24px;
          padding: 24px 24px 18px;
          box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
          animation: fadeUpSoft 0.6s ease-out forwards;
          animation-delay: 0.15s;
          opacity: 0;
          transform: translateY(16px);
        }

        .requests-list-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        .requests-list-title {
          font-size: 18px;
          font-weight: 700;
          color: #0f172a;
        }

        .requests-count-pill {
          font-size: 12px;
          padding: 6px 12px;
          border-radius: 999px;
          background: #eff6ff;
          color: #1d4ed8;
          font-weight: 600;
        }

        .requests-empty {
          text-align: center;
          padding: 40px 16px 28px;
          color: #64748b;
          animation: fadeUpSoft 0.5s ease-out forwards;
        }

        .requests-empty-icon {
          width: 60px;
          height: 60px;
          border-radius: 999px;
          background: #eff6ff;
          color: #1d4ed8;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 18px;
          font-size: 28px;
        }

        .requests-empty-title {
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 4px;
          color: #0f172a;
        }

        .requests-empty-text {
          font-size: 14px;
          max-width: 380px;
          margin: 0 auto 0;
        }

        .requests-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .request-card {
          border-radius: 18px;
          border: 1px solid #e2e8f0;
          padding: 16px 18px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
          box-shadow: 0 4px 14px rgba(15, 23, 42, 0.03);
          transition: all 0.2s ease;
          opacity: 0;
          transform: translateY(14px);
          animation: fadeUpSoft 0.4s ease-out forwards;
          cursor: pointer;
        }

        .request-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 26px rgba(15, 23, 42, 0.08);
          border-color: #bfdbfe;
        }

        .request-card-top {
          display: flex;
          justify-content: space-between;
          gap: 10px;
        }

        .request-main {
          min-width: 0;
        }

        .request-title {
          font-size: 16px;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 4px;
        }

        .request-location {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: #64748b;
        }

        .request-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 8px;
        }

        .chip {
          font-size: 11px;
          padding: 4px 10px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-weight: 600;
        }

        .chip-category {
          background: #eff6ff;
          color: #1d4ed8;
        }

        .chip-urgency-normal {
          background: #ecfdf3;
          color: #15803d;
        }

        .chip-urgency-urgent {
          background: #fef9c3;
          color: #b45309;
        }

        .chip-urgency-emergency {
          background: #fee2e2;
          color: #b91c1c;
        }

        .chip-status-upcoming {
          background: #e0f2fe;
          color: #0369a1;
        }

        .chip-status-past {
          background: #e5e7eb;
          color: #4b5563;
        }

        .chip-status-accepted {
          background: #dcfce7;
          color: #15803d;
        }

        .request-side {
          text-align: right;
          font-size: 12px;
          color: #6b7280;
        }

        .request-time-label {
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-weight: 600;
          font-size: 10px;
          color: #9ca3af;
        }

        .request-time-value {
          font-size: 12px;
          font-weight: 600;
          margin-top: 2px;
        }

        .request-meta-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px 18px;
          margin-top: 4px;
        }

        .request-meta-item {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: #6b7280;
        }

        .request-message {
          font-size: 13px;
          color: #4b5563;
          margin-top: 4px;
        }

        .request-message-quote {
          font-style: italic;
        }

        /* MODAL */
        .request-modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.55);
        display: flex;
        align-items: flex-start;
        justify-content: center;
        z-index: 999;
        padding: 24px 16px;
        overflow-y: auto;        
        animation: fadeIn 0.2s ease-out forwards;
      }

        .request-modal {
  background: white;
  border-radius: 24px;
  max-width: 720px;
  width: 100%;
  max-height: 90vh;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.45);
  animation: fadeUpSoft 0.25s ease-out forwards;
  display: flex;              /* ✅ flex layout */
  flex-direction: column;     /* header, body, footer stacked */
}

        .request-modal-header {
          padding: 16px 20px;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .request-modal-title-block {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .request-modal-title {
          font-size: 18px;
          font-weight: 700;
          color: #0f172a;
        }

        .request-modal-subtitle {
          font-size: 12px;
          color: #6b7280;
        }

        .request-modal-close-btn {
          border: none;
          background: #f1f5f9;
          border-radius: 999px;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #4b5563;
        }

        .request-modal-body {
          padding: 18px 20px 20px;
          max-height: calc(90vh - 56px);
          overflow-y: auto;
          display: grid;
          grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
          gap: 18px;
        }

        .request-modal-section-title {
          font-size: 13px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #6b7280;
          margin-bottom: 8px;
        }

        .request-provider-card,
        .request-details-card {
          border-radius: 16px;
          border: 1px solid #e5e7eb;
          padding: 14px 14px;
          background: #f9fafb;
        }

        .request-provider-name {
          font-size: 15px;
          font-weight: 700;
          color: #0f172a;
        }

        .request-provider-meta {
          font-size: 13px;
          color: #6b7280;
          margin-top: 4px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .request-badge-row {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 8px;
        }

        .request-detail-row {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-top: 6px;
          font-size: 13px;
          color: #4b5563;
        }

        .request-detail-line-label {
          font-weight: 600;
          color: #374151;
        }

        .request-edit-note {
          font-size: 12px;
          color: #6b7280;
          margin-top: 8px;
        }

        .request-edit-form {
          margin-top: 10px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .request-edit-label {
          font-size: 12px;
          font-weight: 600;
          color: #6b7280;
        }

        .request-edit-select,
        .request-edit-input,
        .request-edit-textarea {
          width: 100%;
          font-size: 13px;
          border-radius: 10px;
          border: 1px solid #cbd5e1;
          padding: 6px 8px;
          outline: none;
        }

        .request-edit-textarea {
          min-height: 70px;
          resize: vertical;
        }

        .request-edit-select:focus,
        .request-edit-input:focus,
        .request-edit-textarea:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 1px rgba(59,130,246,0.2);
        }

        .request-modal-footer {
          padding: 12px 20px 16px;
          border-top: 1px solid #e5e7eb;
          display: flex;
          justify-content: flex-end;
          gap: 10px;
        }

        .btn-outline {
          border-radius: 999px;
          border: 1px solid #cbd5e1;
          padding: 8px 14px;
          font-size: 13px;
          background: white;
          cursor: pointer;
          font-weight: 600;
          color: #4b5563;
        }

        .btn-primary-save {
          border-radius: 999px;
          border: none;
          padding: 8px 16px;
          font-size: 13px;
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
          cursor: pointer;
          font-weight: 600;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.45);
        }

        .btn-primary-save:disabled {
          opacity: 0.7;
          box-shadow: none;
          cursor: default;
        }

        /* Animations */
        @keyframes fadeUpSoft {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @media (max-width: 768px) {
          .page-hero {
            padding: 24px 16px 28px;
          }

          .page-hero-title {
            font-size: 24px;
          }

          .my-requests-container {
            padding: 0 16px;
          }

          .requests-list-wrapper {
            padding: 18px 16px 14px;
          }

          .request-card {
            padding: 14px 14px;
          }

          .request-modal-body {
            grid-template-columns: minmax(0, 1fr);
            max-height: calc(90vh - 56px);
          }
        }
      `}</style>

      {/* 🔵 HERO */}
      <div className="page-hero-wrapper">
        <div className="page-hero">
          <div className="page-hero-inner">
            <div className="page-hero-content">
              <div className="page-hero-title-row">
                <div className="page-hero-title-block">
                  <div className="page-hero-icon">
                    <FaHistory />
                  </div>
                  <div>
                    <div className="page-hero-title">My Requests</div>
                    <div className="page-hero-subtitle">
                      Track all your service requests: total, upcoming, and accepted.
                    </div>
                  </div>
                </div>
                <div className="page-hero-badge">
                  <FaCheckCircle />
                  Requests auto-saved for you
                </div>
              </div>

              <div className="page-hero-stats">
                <div className="page-hero-stat-card">
                  <div className="page-hero-stat-label">Total Requests</div>
                  <div className="page-hero-stat-value">{totalRequests}</div>
                  <div className="page-hero-stat-chip">
                    All requests you ever sent
                  </div>
                </div>
                <div className="page-hero-stat-card">
                  <div className="page-hero-stat-label">Upcoming</div>
                  <div className="page-hero-stat-value">{upcomingCount}</div>
                  <div className="page-hero-stat-chip">Future or flexible dates</div>
                </div>
                <div className="page-hero-stat-card">
                  <div className="page-hero-stat-label">Accepted</div>
                  <div className="page-hero-stat-value">{acceptedCount}</div>
                  <div className="page-hero-stat-chip">
                    Marked as accepted by provider
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="my-requests-container">
        <section className="requests-section">
          <div className="requests-filters">
            <div className="requests-filters-left">
              <FaFilter />
              <span>Filter my requests</span>
            </div>
            <div className="requests-filters-right">
              <div className="view-toggle-group">
                <button
                  className={
                    "view-toggle-btn" + (viewFilter === "All" ? " active" : "")
                  }
                  onClick={() => setViewFilter("All")}
                >
                  Total
                </button>
                <button
                  className={
                    "view-toggle-btn" +
                    (viewFilter === "Upcoming" ? " active" : "")
                  }
                  onClick={() => setViewFilter("Upcoming")}
                >
                  Upcoming
                </button>
                <button
                  className={
                    "view-toggle-btn" +
                    (viewFilter === "Accepted" ? " active" : "")
                  }
                  onClick={() => setViewFilter("Accepted")}
                >
                  Accepted
                </button>
              </div>

              <select
                className="requests-select"
                value={urgencyFilter}
                onChange={(e) => setUrgencyFilter(e.target.value)}
              >
                <option value="All">All urgency</option>
                <option value="Normal">Normal</option>
                <option value="Urgent">Urgent</option>
                {/* Emergency removed from filter as you asked */}
              </select>
            </div>
          </div>

          <div className="requests-list-wrapper">
            <div className="requests-list-header">
              <div className="requests-list-title">
                {viewFilter === "All"
                  ? "All requests"
                  : viewFilter === "Upcoming"
                  ? "Upcoming requests"
                  : "Accepted requests"}
              </div>
              <div className="requests-count-pill">
                {filtered.length} shown • {totalRequests} total
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="requests-empty">
                <div className="requests-empty-icon">
                  <FaHistory />
                </div>
                <div className="requests-empty-title">
                  No requests found for these filters
                </div>
                <p className="requests-empty-text">
                  Any time you contact a provider from the service details page,
                  your request will appear here from newest to oldest.
                </p>
              </div>
            ) : (
              <div className="requests-list">
                {filtered.map((req, index) => {
                  const status = classifyStatus(req);
                  const createdAt = new Date(req.time);
                  const createdLabel = createdAt.toLocaleString(undefined, {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  let urgencyClass = "chip-urgency-normal";
                  if (req.urgency === "Urgent")
                    urgencyClass = "chip-urgency-urgent";
                  if (req.urgency === "Emergency")
                    urgencyClass = "chip-urgency-emergency";

                  return (
                    <article
                      className="request-card"
                      key={`${req.id}-${req.time}`}
                      style={{ animationDelay: `${0.05 * index}s` }}
                      onClick={() => openDetails(req)}
                    >
                      <div className="request-card-top">
                        <div className="request-main">
                          <div className="request-title">{req.name}</div>
                          <div className="request-location">
                            <FaMapMarkerAlt className="text-primary" />
                            <span>{req.location}</span>
                          </div>
                          <div className="request-chips">
                            <span className="chip chip-category">
                              {categoryIcon[req.category]}
                              {req.category}
                            </span>
                            <span className={`chip ${urgencyClass}`}>
                              <FaExclamationCircle />
                              {req.urgency}
                            </span>
                            <span
                              className={`chip ${
                                status === "Upcoming"
                                  ? "chip-status-upcoming"
                                  : "chip-status-past"
                              }`}
                            >
                              <FaClock />
                              {status}
                            </span>
                            {req.requestStatus === "Accepted" && (
                              <span className="chip chip-status-accepted">
                                <FaCheckCircle />
                                Accepted
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="request-side">
                          <div className="request-time-label">CREATED ON</div>
                          <div className="request-time-value">
                            {createdLabel}
                          </div>
                        </div>
                      </div>

                      <div className="request-meta-row">
                        <div className="request-meta-item">
                          <FaCalendarAlt />
                          <span>
                            {req.preferredDate &&
                            req.preferredDate !== "Flexible"
                              ? req.preferredDate
                              : "Date: Flexible"}
                          </span>
                        </div>
                        <div className="request-meta-item">
                          <FaClock />
                          <span>
                            {req.preferredTime &&
                            req.preferredTime !== "Flexible"
                              ? req.preferredTime
                              : "Time: Flexible"}
                          </span>
                        </div>
                      </div>

                      <div className="request-message">
                        <span className="request-message-quote">
                          “{req.message}”
                        </span>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* DETAILS MODAL */}
      {selectedRequest && (
        <div className="request-modal-backdrop" onClick={closeDetails}>
          <div
            className="request-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="request-modal-header">
              <div className="request-modal-title-block">
                <div className="request-modal-title">
                  Request details for {selectedRequest.name}
                </div>
                <div className="request-modal-subtitle">
                  Full summary of what you sent to this provider.
                </div>
              </div>
              <button
                className="request-modal-close-btn"
                onClick={closeDetails}
              >
                <FaTimes size={14} />
              </button>
            </div>

            <div className="request-modal-body">
              {/* Provider info */}
              <div>
                <div className="request-modal-section-title">
                  Service provider
                </div>
                <div className="request-provider-card">
                  <div className="request-provider-name">
                    {selectedRequest.name}
                  </div>
                  <div className="request-provider-meta">
                    <span>
                      <FaMapMarkerAlt className="me-1 text-primary" />
                      {selectedRequest.location}
                    </span>
                    <span>
                      Category: {selectedRequest.category || "—"}
                    </span>
                  </div>
                  <div className="request-badge-row">
                    <span className="chip chip-category">
                      {categoryIcon[selectedRequest.category]}
                      {selectedRequest.category}
                    </span>
                    {selectedRequest.requestStatus === "Accepted" ? (
                      <span className="chip chip-status-accepted">
                        <FaCheckCircle />
                        Accepted by provider
                      </span>
                    ) : (
                      <span className="chip chip-status-upcoming">
                        <FaClock />
                        {classifyStatus(selectedRequest)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Request details + edit */}
              <div>
                <div className="request-modal-section-title">Your request</div>
                <div className="request-details-card">
                  <div className="request-detail-row">
                    <div>
                      <span className="request-detail-line-label">
                        Created on:
                      </span>{" "}
                      {new Date(selectedRequest.time).toLocaleString()}
                    </div>
                    <div>
                      <span className="request-detail-line-label">
                        Urgency:
                      </span>{" "}
                      {selectedRequest.urgency}
                    </div>
                    <div>
                      <span className="request-detail-line-label">
                        Preferred date:
                      </span>{" "}
                      {selectedRequest.preferredDate}
                    </div>
                    <div>
                      <span className="request-detail-line-label">
                        Preferred time:
                      </span>{" "}
                      {selectedRequest.preferredTime}
                    </div>
                    <div>
                      <span className="request-detail-line-label">
                        Problem description:
                      </span>
                      <div>“{selectedRequest.message}”</div>
                    </div>
                  </div>

                  {(() => {
                    const status = classifyStatus(selectedRequest);
                    const isAccepted =
                      selectedRequest.requestStatus === "Accepted";
                    const canEdit = !isAccepted && status === "Upcoming";

                    return (
                      <>
                        <div className="request-edit-note">
                          {canEdit ? (
                            <>
                              You can still update <strong>urgency</strong>,{" "}
                              <strong>date</strong>,{" "}
                              <strong>time</strong> and{" "}
                              <strong>description</strong> for this upcoming
                              request.
                            </>
                          ) : isAccepted ? (
                            <>
                              This request has been{" "}
                              <strong>accepted by the provider</strong>, so it
                              can no longer be edited.
                            </>
                          ) : (
                            <>
                              This request is in the <strong>past</strong> and
                              cannot be edited anymore.
                            </>
                          )}
                        </div>

                        {canEdit && editData && (
                          <div className="request-edit-form">
                            <div>
                              <div className="request-edit-label">
                                Urgency level
                              </div>
                              <select
                                className="request-edit-select"
                                value={editData.urgency}
                                onChange={(e) =>
                                  setEditData((prev) => ({
                                    ...prev,
                                    urgency: e.target.value,
                                  }))
                                }
                              >
                                <option>Normal</option>
                                <option>Urgent</option>
                                <option>Emergency</option>
                              </select>
                            </div>
                            <div>
                              <div className="request-edit-label">
                                Preferred date
                              </div>
                              <input
                                type="date"
                                className="request-edit-input"
                                value={editData.preferredDate}
                                onChange={(e) =>
                                  setEditData((prev) => ({
                                    ...prev,
                                    preferredDate: e.target.value,
                                  }))
                                }
                              />
                            </div>
                            <div>
                              <div className="request-edit-label">
                                Preferred time
                              </div>
                              <input
                                type="text"
                                className="request-edit-input"
                                placeholder="e.g. Morning, 9–11 AM"
                                value={editData.preferredTime}
                                onChange={(e) =>
                                  setEditData((prev) => ({
                                    ...prev,
                                    preferredTime: e.target.value,
                                  }))
                                }
                              />
                            </div>
                            <div>
                              <div className="request-edit-label">
                                Description
                              </div>
                              <textarea
                                className="request-edit-textarea"
                                value={editData.message}
                                onChange={(e) =>
                                  setEditData((prev) => ({
                                    ...prev,
                                    message: e.target.value,
                                  }))
                                }
                              />
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>

            <div className="request-modal-footer">
              <button className="btn-outline" onClick={closeDetails}>
                Close
              </button>
              {(() => {
                if (!selectedRequest || !editData) return null;
                const status = classifyStatus(selectedRequest);
                const isAccepted =
                  selectedRequest.requestStatus === "Accepted";
                const canEdit = !isAccepted && status === "Upcoming";

                if (!canEdit) return null;

                return (
                  <button className="btn-primary-save" onClick={handleSaveEdit}>
                    Save changes
                  </button>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}