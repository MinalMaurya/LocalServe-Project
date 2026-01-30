import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaChartBar,
  FaShieldAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaTrash,
  FaFilter,
  FaSearch,
  FaUserTie,
  FaHome,
  FaInbox,
  FaClock,
  FaBox,
} from "react-icons/fa";
import servicesData from "../../data/services.json";

const VENDOR_SERVICES_KEY = "local-service-discovery:vendor-services";
const ADMIN_STATE_KEY = "local-service-discovery:admin-service-state";
const VENDOR_NOTIFICATIONS_KEY = "local-service-discovery:vendor-notifications";

function getKey(s) {
  const source = s.source || "static";
  return `${source}:${s.id}`;
}

function getVendorKey(service) {
  return (
    service.vendorId ||
    service.vendorEmail ||
    service.ownerEmail ||
    service.ownerId ||
    null
  );
}

function pushVendorNotification(service, type, message) {
  const vendorKey = getVendorKey(service);
  if (!vendorKey) return;

  const notif = {
    id: Date.now(),
    vendorKey,
    serviceId: service.id,
    source: service.source || "static",
    type,
    message,
    createdAt: new Date().toISOString(),
    read: false,
  };

  try {
    const raw =
      JSON.parse(localStorage.getItem(VENDOR_NOTIFICATIONS_KEY) || "[]") || [];
    raw.push(notif);
    localStorage.setItem(VENDOR_NOTIFICATIONS_KEY, JSON.stringify(raw));
  } catch {}
}

function normalizeAdminStatus(v) {
  const s = String(v || "pending").toLowerCase();
  if (s === "approved" || s === "accept" || s === "accepted") return "approved";
  if (s === "rejected" || s === "reject") return "rejected";
  return "pending";
}

export default function AdminServicesPage() {
  const navigate = useNavigate();
  const [authUser, setAuthUser] = useState(null);
  const [baseServices, setBaseServices] = useState([]);
  const [adminState, setAdminState] = useState({});
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem("authUser") || "null");
      setAuthUser(u);
    } catch {
      setAuthUser(null);
    }
  }, []);

  useEffect(() => {
    const staticServices = servicesData.map((s) => ({
      ...s,
      source: "static",
    }));

    let vendorServices = [];
    try {
      vendorServices =
        JSON.parse(localStorage.getItem(VENDOR_SERVICES_KEY) || "[]") || [];
    } catch {
      vendorServices = [];
    }

    const vendorServicesWithSource = vendorServices.map((s) => ({
      ...s,
      source: "vendor",
    }));

    setBaseServices([...staticServices, ...vendorServicesWithSource]);

    try {
      const state =
        JSON.parse(localStorage.getItem(ADMIN_STATE_KEY) || "{}") || {};
      setAdminState(state);
    } catch {
      setAdminState({});
    }
  }, []);

  const saveAdminState = (next) => {
    setAdminState(next);
    try {
      localStorage.setItem(ADMIN_STATE_KEY, JSON.stringify(next));
    } catch {}
  };

  // approve / reject
  const handleChangeStatus = (service, status) => {
    const key = getKey(service);
    const next = {
      ...adminState,
      [key]: {
        ...(adminState[key] || {}),
        status,
      },
    };
    saveAdminState(next);

    if (service.source === "vendor") {
      let msg;
      if (status === "approved") {
        msg = `Your service "${service.name}" has been approved by admin.`;
      } else if (status === "rejected") {
        msg = `Your service "${service.name}" was rejected by admin.`;
      } else {
        msg = `Status of your service "${service.name}" was changed to "${status}".`;
      }
      pushVendorNotification(service, status, msg);
    }
  };

  // verify / unverify
  const handleToggleVerified = (service) => {
    const key = getKey(service);
    const current = adminState[key] || {};
    const nextVerified = !current.isVerified;

    const nextState = {
      ...adminState,
      [key]: {
        ...current,
        isVerified: nextVerified,
      },
    };
    saveAdminState(nextState);

    if (service.source === "vendor") {
      try {
        const raw =
          JSON.parse(localStorage.getItem(VENDOR_SERVICES_KEY) || "[]") || [];
        const updated = raw.map((s) =>
          s.id === service.id ? { ...s, isVerified: nextVerified } : s
        );
        localStorage.setItem(VENDOR_SERVICES_KEY, JSON.stringify(updated));
      } catch {}

      pushVendorNotification(
        service,
        nextVerified ? "verified" : "unverified",
        nextVerified
          ? `Your service "${service.name}" has been verified by admin.`
          : `Your service "${service.name}" is no longer marked as verified.`
      );
    }
  };

  // remove
  const handleRemove = (service) => {
    const key = getKey(service);
    const next = {
      ...adminState,
      [key]: {
        ...(adminState[key] || {}),
        removed: true,
      },
    };
    saveAdminState(next);

    if (service.source === "vendor") {
      pushVendorNotification(
        service,
        "removed",
        `Your service "${service.name}" was removed from the platform by admin.`
      );
    }
  };

  // ✅ All services with admin overrides (including removed)
  const enrichedAll = useMemo(() => {
    return baseServices.map((s) => {
      const key = getKey(s);
      const override = adminState[key] || {};
      const adminStatus = normalizeAdminStatus(override.status);
      const adminRemoved = !!override.removed;

      return {
        ...s,
        adminStatus,
        adminRemoved,
      };
    });
  }, [baseServices, adminState]);

  // ✅ main table services (hide removed)
  const enrichedServices = useMemo(() => {
    return enrichedAll
      .map((s) => {
        const key = getKey(s);
        const override = adminState[key] || {};
        const adminVerified =
          override.isVerified ?? !!s.isVerified ?? !!s.verified ?? false;

        return {
          ...s,
          adminVerified,
        };
      })
      .filter((s) => !s.adminRemoved);
  }, [enrichedAll, adminState]);

  const filteredServices = useMemo(() => {
    const q = search.trim().toLowerCase();
    return enrichedServices.filter((s) => {
      if (statusFilter !== "all" && s.adminStatus !== statusFilter) return false;
      if (sourceFilter !== "all" && s.source !== sourceFilter) return false;
      if (!q) return true;
      const haystack = `${s.name} ${s.category} ${s.location}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [enrichedServices, statusFilter, sourceFilter, search]);

  // ✅ Stats (same as your stats block)
  const stats = useMemo(() => {
    const total = enrichedAll.length;
    const removed = enrichedAll.filter((s) => s.adminRemoved).length;

    const active = enrichedAll.filter((s) => !s.adminRemoved);
    const pending = active.filter((s) => s.adminStatus === "pending").length;
    const approved = active.filter((s) => s.adminStatus === "approved").length;

    return { total, pending, approved, removed };
  }, [enrichedAll]);

  const styles = `
  @keyframes adminFadeSlideDown {
    from { opacity: 0; transform: translateY(-10px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @keyframes adminFadeInSoft {
    from { opacity: 0; transform: translateY(14px) scale(0.98); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  .admin-animate-hero { animation: adminFadeSlideDown 0.6s ease-out forwards; }
  .admin-animate-hero-delay {
    animation: adminFadeSlideDown 0.7s ease-out forwards;
    animation-delay: 0.08s;
  }
  .admin-animate-card {
    opacity: 0;
    animation: adminFadeInSoft 0.55s ease-out forwards;
  }
  .admin-animate-stat-card {
    opacity: 0;
    animation: adminFadeInSoft 0.55s ease-out forwards;
  }
  .admin-animate-stat-card:nth-child(1) { animation-delay: 0.06s; }
  .admin-animate-stat-card:nth-child(2) { animation-delay: 0.12s; }
  .admin-animate-stat-card:nth-child(3) { animation-delay: 0.18s; }
  .admin-animate-stat-card:nth-child(4) { animation-delay: 0.24s; }
  .admin-animate-stat-card:nth-child(5) { animation-delay: 0.30s; }

  .admin-page {
    width: 100%;
    min-height: 100vh;
    background: linear-gradient(135deg, #f8fafc 0%, #e5e7eb 100%);
    padding-bottom: 40px;
  }

  .admin-hero {
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    color: #ffffff;
    padding: 80px 0 60px;
  }

  .admin-hero-inner {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 32px;
    display: flex;
    justify-content: space-between;
    gap: 20px;
    align-items: center;
  }

  .admin-hero-left {
    display: flex;
    align-items: center;
    gap: 18px;
  }

  .admin-hero-icon {
    width: 80px;
    height: 80px;
    border-radius: 26px;
    background: rgba(15,23,42,0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 36px;
    color: #e0f2fe;
    box-shadow: 0 24px 60px rgba(15,23,42,0.9);
  }

  .admin-hero-title {
    font-size: 30px;
    font-weight: 800;
    margin-bottom: 4px;
  }

  .admin-hero-subtitle {
    font-size: 14px;
    color: #c7d2fe;
  }

  .admin-hero-right-pill {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    border-radius: 999px;
    background: rgba(15,23,42,0.5);
    font-size: 13px;
    box-shadow: 0 16px 40px rgba(15,23,42,0.7);
  }

  /* =========================
     ✅ STATS (same as your block)
     ========================= */
  .admin-stats-shell {
    background: #ffffff;
    margin: -40px auto 16px;
    position: relative;
    z-index: 10;
    border-radius: 24px;
    padding: 20px 24px;
    box-shadow: 0 18px 50px rgba(15, 23, 42, 0.12);
    width: 90%;
    max-width: 1100px;
    box-sizing: border-box;
  }

  .admin-stats-grid {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 20px;
  }

  .stat-card {
    border: none;
    border-radius: 22px;
    padding: 18px 14px;
    background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
    box-shadow: 0 18px 52px rgba(15,23,42,0.08);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    text-align: center;
    min-height: 142px;
  }

  .stat-card.clickable {
    cursor: pointer;
    transition: transform 0.18s ease, box-shadow 0.18s ease;
  }

  .stat-card.clickable:hover {
    transform: translateY(-2px);
    box-shadow: 0 26px 70px rgba(15,23,42,0.12);
  }

  .stat-icon {
    width: 74px;
    height: 74px;
    border-radius: 999px;
    display: grid;
    place-items: center;
    font-size: 26px;
  }

  .stat-value {
    font-size: 38px;
    font-weight: 950;
    color: #0f172a;
    line-height: 1;
  }

  .stat-label {
    font-size: 12px;
    letter-spacing: 0.14em;
    color: #475569;
    font-weight: 900;
    text-transform: uppercase;
  }

  .stat-active {
    outline: 2px solid rgba(239,68,68,0.22);
    background: linear-gradient(180deg, #fff 0%, #fff7f7 100%);
  }

  .stat-analytics .stat-value {
    font-size: 18px;
    font-weight: 950;
    letter-spacing: 0.02em;
  }

  .admin-main {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 24px 32px;
  }

  .admin-card {
    background: #ffffff;
    border-radius: 20px;
    padding: 20px 20px 18px;
    box-shadow: 0 20px 50px rgba(15,23,42,0.08);
    border: 1px solid #e5e7eb;
  }

  .admin-filters {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
    margin-bottom: 16px;
  }
  .admin-filter-group {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .admin-filter-label {
    font-size: 13px;
    color: #6b7280;
    font-weight: 600;
  }
  .admin-select,
  .admin-search-input {
    border-radius: 999px;
    border: 1px solid #d1d5db;
    padding: 7px 12px;
    font-size: 13px;
    background: #f9fafb;
  }
  .admin-search-wrap { position: relative; }
  .admin-search-wrap .admin-search-input { padding-left: 30px; }
  .admin-search-icon {
    position: absolute;
    left: 10px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 12px;
    color: #9ca3af;
  }

  .admin-summary {
    display: flex;
    gap: 10px;
    margin-bottom: 12px;
    font-size: 13px;
    color: #4b5563;
  }
  .admin-summary-pill {
    padding: 4px 10px;
    border-radius: 999px;
    background: #eff6ff;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .admin-services-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 4px;
  }
  .admin-services-table thead { background: #f9fafb; }
  .admin-services-table th,
  .admin-services-table td {
    padding: 10px 8px;
    font-size: 13px;
    text-align: left;
    border-bottom: 1px solid #e5e7eb;
    vertical-align: middle;
  }
  .admin-services-table th {
    font-weight: 700;
    color: #4b5563;
    font-size: 12px;
    text-transform: uppercase;
  }

  .admin-source-pill {
    padding: 4px 8px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 600;
  }
  .admin-source-static { background: #eef2ff; color: #4f46e5; }
  .admin-source-vendor { background: #ecfdf5; color: #059669; }

  .admin-status-pill {
    padding: 4px 10px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 600;
  }
  .admin-status-pending { background: #fef3c7; color: #92400e; }
  .admin-status-approved { background: #dcfce7; color: #166534; }
  .admin-status-rejected { background: #fee2e2; color: #b91c1c; }

  .admin-verified-pill {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 600;
    background: #dcfce7;
    color: #15803d;
  }
  .admin-not-verified { font-size: 11px; color: #9ca3af; }

  .admin-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .admin-btn {
    border-radius: 999px;
    border: none;
    font-size: 11px;
    padding: 5px 9px;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    cursor: pointer;
  }
  .admin-btn-approve { background: #16a34a; color: #ffffff; }
  .admin-btn-reject { background: #fee2e2; color: #b91c1c; }
  .admin-btn-verify { background: #eef2ff; color: #4f46e5; }
  .admin-btn-remove { background: #111827; color: #f9fafb; }

  .admin-empty {
    text-align: center;
    font-size: 13px;
    color: #6b7280;
    padding: 18px 4px;
  }

  .admin-guard-card {
    max-width: 480px;
    margin: 80px auto;
    padding: 28px 24px;
    background: #ffffff;
    border-radius: 22px;
    box-shadow: 0 20px 60px rgba(15,23,42,0.16);
    text-align: center;
  }
  .admin-guard-btn {
    margin-top: 16px;
    border-radius: 999px;
    border: none;
    padding: 10px 16px;
    background: #4f46e5;
    color: white;
    font-weight: 600;
    cursor: pointer;
  }

  @media (max-width: 960px) {
    .admin-filters { flex-direction: column; align-items: stretch; gap: 10px; }
    .admin-filter-group { width: 100%; justify-content: space-between; }
    .admin-select, .admin-search-input { width: 100%; }

    .admin-card { overflow-x: auto; -webkit-overflow-scrolling: touch; }
    .admin-actions { flex-wrap: nowrap; overflow-x: auto; padding-bottom: 4px; }

    .admin-stats-shell { width: 94%; padding: 16px; }
    .admin-stats-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
  }

  @media (max-width: 640px) {
    .admin-card { overflow: visible !important; }

    .admin-services-table,
    .admin-services-table tbody,
    .admin-services-table tr,
    .admin-services-table td { display: block; width: 100%; }

    .admin-services-table thead { display: none; }

    .admin-services-table tr {
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 16px;
      padding: 12px 14px;
      margin-bottom: 12px;
      box-shadow: 0 10px 22px rgba(15, 23, 42, 0.06);
    }

    .admin-services-table td { padding: 10px 0; border: none; }
    .admin-services-table td + td { border-top: 1px dashed #e5e7eb; }

    .admin-services-table td::before {
      display: block;
      font-weight: 800;
      color: #6b7280;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: 6px;
      text-align: left;
    }

    .admin-services-table td:nth-child(1)::before { content: "Name"; }
    .admin-services-table td:nth-child(2)::before { content: "Category & Location"; }
    .admin-services-table td:nth-child(3)::before { content: "Source"; }
    .admin-services-table td:nth-child(4)::before { content: "Status"; }
    .admin-services-table td:nth-child(5)::before { content: "Verified"; }
    .admin-services-table td:nth-child(6)::before { content: "Actions"; }

    .admin-actions {
      display: grid;
      grid-template-columns: 1fr;
      gap: 8px;
      width: 100%;
    }

    .admin-btn {
      width: 100%;
      justify-content: center;
      padding: 10px 12px;
      font-size: 12px;
      white-space: nowrap;
    }

    .admin-stats-grid { grid-template-columns: 1fr; gap: 12px; }
  }
  `;

  if (!authUser || !(authUser.role === "admin" || authUser.role === "Admin")) {
    return (
      <div className="admin-page">
        <style>{styles}</style>

        <div className="admin-guard-card admin-animate-card">
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 18,
              margin: "0 auto 10px",
              background: "#eef2ff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#4f46e5",
              fontSize: 26,
            }}
          >
            <FaShieldAlt />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>
            Admin area only
          </h2>
          <p style={{ fontSize: 14, color: "#6b7280" }}>
            You must be logged in as an admin to manage service listings.
          </p>
          <button
            className="admin-guard-btn"
            type="button"
            onClick={() => navigate("/admin/login")}
          >
            Go to admin login
          </button>
        </div>
      </div>
    );
  }

  const pendingCount = enrichedServices.filter((s) => s.adminStatus === "pending")
    .length;
  const approvedCount = enrichedServices.filter(
    (s) => s.adminStatus === "approved"
  ).length;
  const rejectedCount = enrichedServices.filter(
    (s) => s.adminStatus === "rejected"
  ).length;

  return (
    <div className="admin-page">
      <style>{styles}</style>

      <div className="admin-hero">
        <div className="admin-hero-inner admin-animate-hero">
          <div className="admin-hero-left">
            <div className="admin-hero-icon">
              <FaShieldAlt />
            </div>
            <div>
              <div className="admin-hero-title">Service moderation panel</div>
              <div className="admin-hero-subtitle">
                Approve, reject, verify or remove services across the platform.
              </div>
            </div>
          </div>
          <div className="admin-hero-right-pill admin-animate-hero-delay">
            <FaUserTie size={13} />
            Logged in as admin: {authUser.name || authUser.email}
          </div>
        </div>
      </div>

      {/* ✅ STATS ROW (same as your block) */}
      <div className="admin-stats-shell">
        <div className="admin-stats-grid">
          <div className="stat-card admin-animate-stat-card">
            <div
              className="stat-icon"
              style={{ background: "#dbeafe", color: "#2563eb" }}
            >
              <FaBox />
            </div>
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">TOTAL SERVICES</div>
          </div>

          <div className="stat-card admin-animate-stat-card">
            <div
              className="stat-icon"
              style={{ background: "#fef3c7", color: "#b45309" }}
            >
              <FaClock />
            </div>
            <div className="stat-value">{stats.pending}</div>
            <div className="stat-label">PENDING</div>
          </div>

          <div className="stat-card admin-animate-stat-card">
            <div
              className="stat-icon"
              style={{ background: "#dcfce7", color: "#16a34a" }}
            >
              <FaCheckCircle />
            </div>
            <div className="stat-value">{stats.approved}</div>
            <div className="stat-label">APPROVED</div>
          </div>

          <div
            className="stat-card stat-active clickable admin-animate-stat-card"
            onClick={() => navigate("/admin/removed")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ")
                navigate("/admin/removed");
            }}
            title="Open removed services"
          >
            <div
              className="stat-icon"
              style={{ background: "#ffe4e6", color: "#b91c1c" }}
            >
              <FaTimesCircle />
            </div>
            <div className="stat-value">{stats.removed}</div>
            <div className="stat-label">REMOVED</div>
          </div>

          <div
            className="stat-card clickable stat-analytics admin-animate-stat-card"
            onClick={() => navigate("/admin/analytics")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ")
                navigate("/admin/analytics");
            }}
            title="Open analytics"
          >
            <div
              className="stat-icon"
              style={{ background: "#e0e7ff", color: "#3730a3" }}
            >
              <FaChartBar />
            </div>
            <div className="stat-value">View</div>
            <div className="stat-label">ANALYTICS</div>
          </div>
        </div>
      </div>

      <div className="admin-main">
        <div className="admin-card admin-animate-card">
          <div className="admin-filters">
            <div className="admin-filter-group">
              <span className="admin-filter-label">
                <FaFilter size={12} /> Status
              </span>
              <select
                className="admin-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div className="admin-filter-group">
              <span className="admin-filter-label">Source</span>
              <select
                className="admin-select"
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
              >
                <option value="all">All</option>
                <option value="static">Static (seed)</option>
                <option value="vendor">Vendor-published</option>
              </select>
            </div>

            <div className="admin-filter-group admin-search-wrap">
              <FaSearch className="admin-search-icon" />
              <input
                className="admin-search-input"
                placeholder="Search by name, category, or location"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="admin-summary">
            <div className="admin-summary-pill">
              <FaHome size={12} /> {enrichedServices.length} total services
            </div>
            <div className="admin-summary-pill">
              Pending: {pendingCount} • Approved: {approvedCount} • Rejected:{" "}
              {rejectedCount} • Removed: {stats.removed}
            </div>
          </div>

          <table className="admin-services-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Category & location</th>
                <th>Source</th>
                <th>Status</th>
                <th>Verified</th>
                <th style={{ width: 220 }}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredServices.length === 0 && (
                <tr>
                  <td colSpan={6} className="admin-empty">
                    No services match your current filters.
                  </td>
                </tr>
              )}

              {filteredServices.map((s) => (
                <tr key={getKey(s)}>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{s.name}</div>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>
                      {s.phone || "No phone set"}
                    </div>
                  </td>

                  <td>
                    <div style={{ fontSize: 12, color: "#111827" }}>
                      {s.category || "Service"}
                    </div>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>
                      {s.location || "Not specified"}
                    </div>
                  </td>

                  <td>
                    <span
                      className={
                        "admin-source-pill " +
                        (s.source === "vendor"
                          ? "admin-source-vendor"
                          : "admin-source-static")
                      }
                    >
                      {s.source === "vendor" ? "Vendor" : "Static"}
                    </span>
                  </td>

                  <td>
                    <span
                      className={
                        "admin-status-pill " +
                        (s.adminStatus === "approved"
                          ? "admin-status-approved"
                          : s.adminStatus === "rejected"
                          ? "admin-status-rejected"
                          : "admin-status-pending")
                      }
                    >
                      {s.adminStatus.charAt(0).toUpperCase() +
                        s.adminStatus.slice(1)}
                    </span>
                  </td>

                  <td>
                    {s.adminVerified ? (
                      <span className="admin-verified-pill">
                        <FaCheckCircle size={11} />
                        Verified
                      </span>
                    ) : (
                      <span className="admin-not-verified">Not verified yet</span>
                    )}
                  </td>

                  <td>
                    <div className="admin-actions">
                      <button
                        type="button"
                        className="admin-btn admin-btn-approve"
                        onClick={() => handleChangeStatus(s, "approved")}
                      >
                        <FaCheckCircle size={11} />
                        Approve
                      </button>

                      <button
                        type="button"
                        className="admin-btn admin-btn-reject"
                        onClick={() => handleChangeStatus(s, "rejected")}
                      >
                        <FaTimesCircle size={11} />
                        Reject
                      </button>

                      <button
                        type="button"
                        className="admin-btn admin-btn-verify"
                        onClick={() => handleToggleVerified(s)}
                      >
                        <FaShieldAlt size={11} />
                        {s.adminVerified ? "Unverify" : "Verify"}
                      </button>

                      <button
                        type="button"
                        className="admin-btn admin-btn-remove"
                        onClick={() => handleRemove(s)}
                      >
                        <FaTrash size={11} />
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}