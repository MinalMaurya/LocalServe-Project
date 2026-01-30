
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaTimesCircle,
  FaArrowLeft,
  FaShieldAlt,
  FaCheckCircle,
  FaUserTie,
  FaChartBar,
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
  } catch {
    // ignore
  }
}

function normalizeAdminStatus(v) {
  const s = String(v || "pending").toLowerCase();
  if (s === "approved" || s === "accept" || s === "accepted") return "approved";
  if (s === "rejected" || s === "reject") return "rejected";
  return "pending";
}

export default function AdminRejectedServicesPage() {
  const navigate = useNavigate();
  const [authUser, setAuthUser] = useState(null);
  const [baseServices, setBaseServices] = useState([]);
  const [adminState, setAdminState] = useState({});

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

  const enrichedRemoved = useMemo(() => {
    return enrichedAll.filter((s) => s.adminRemoved);
  }, [enrichedAll]);

  const stats = useMemo(() => {
    const total = enrichedAll.length;

    const removed = enrichedAll.filter((s) => s.adminRemoved).length;


    const active = enrichedAll.filter((s) => !s.adminRemoved);

    const pending = active.filter((s) => s.adminStatus === "pending").length;
    const approved = active.filter((s) => s.adminStatus === "approved").length;

    return { total, pending, approved, removed };
  }, [enrichedAll]);

  const handleRestore = (service) => {
    const key = getKey(service);
    const previous = adminState[key] || {};

    const nextState = {
      ...adminState,
      [key]: {
        ...previous,
        removed: false,
        status: previous.status || "pending",
      },
    };
    saveAdminState(nextState);

    if (service.source === "vendor") {
      pushVendorNotification(
        service,
        "restored",
        `Your service "${service.name}" was restored and moved back to pending review.`
      );
    }
  };

  const styles = `
    @keyframes adminFadeInSoft {
      from { opacity: 0; transform: translateY(12px) scale(0.99); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }

    .admin-page {
      width: 100%;
      min-height: 100vh;
      background: linear-gradient(135deg, #f8fafc 0%, #eef2ff 50%, #e5e7eb 100%);
      padding: 24px 0 44px;
    }

    .admin-wrap {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 24px;
      animation: adminFadeInSoft 0.45s ease-out forwards;
    }

    .admin-topbar {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 14px;
      margin-bottom: 14px;
    }

    .admin-title {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 22px;
      font-weight: 900;
      color: #0f172a;
      margin: 0;
    }

    .admin-subtitle {
      margin: 6px 0 0;
      color: #64748b;
      font-size: 13px;
      font-weight: 700;
    }

    .admin-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      border-radius: 999px;
      background: rgba(255,255,255,0.7);
      border: 1px solid #e5e7eb;
      box-shadow: 0 16px 42px rgba(15,23,42,0.10);
      color: #0f172a;
      font-weight: 900;
      font-size: 13px;
      white-space: nowrap;
    }

    .admin-back-btn {
      border: 1px solid #e2e8f0;
      background: #ffffff;
      padding: 10px 14px;
      border-radius: 999px;
      cursor: pointer;
      font-weight: 900;
      color: #0f172a;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      box-shadow: 0 12px 28px rgba(15,23,42,0.08);
    }

    .admin-stats-shell {
      margin-top: 10px;
      background: rgba(255,255,255,0.8);
      border: 1px solid #e5e7eb;
      border-radius: 26px;
      padding: 18px;
      box-shadow: 0 24px 70px rgba(15,23,42,0.10);
    }

    .admin-stats-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 16px;
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
    }

    .stat-active {
      outline: 2px solid rgba(239,68,68,0.22);
      background: linear-gradient(180deg, #fff 0%, #fff7f7 100%);
    }

    .admin-card {
      margin-top: 14px;
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 20px;
      padding: 18px;
      box-shadow: 0 20px 50px rgba(15,23,42,0.08);
    }

    .admin-removed-header-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 14px;
    }

    .admin-removed-title {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 16px;
      font-weight: 900;
      color: #0f172a;
    }

    .admin-removed-count-pill {
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 900;
      background: #fee2e2;
      color: #b91c1c;
      border: 1px solid #fecaca;
    }

    .admin-empty-removed {
      font-size: 13px;
      color: #64748b;
      font-weight: 700;
      padding: 10px 2px;
    }

    .admin-removed-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 16px;
    }

    .admin-removed-card {
      background: #ffffff;
      border-radius: 20px;
      padding: 16px 16px 14px;
      box-shadow: 0 18px 40px rgba(15,23,42,0.08);
      border: 1px solid #e5e7eb;
    }

    .admin-removed-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 900;
      background: #fee2e2;
      color: #b91c1c;
      margin-bottom: 8px;
    }

    .admin-removed-name {
      font-size: 15px;
      font-weight: 950;
      color: #0f172a;
      margin-bottom: 4px;
    }

    .admin-removed-meta {
      font-size: 12px;
      color: #64748b;
      margin-bottom: 4px;
      font-weight: 700;
    }

    .admin-removed-actions {
      margin-top: 10px;
      display: flex;
      gap: 10px;
      align-items: center;
    }

    .admin-removed-restore-btn {
      border-radius: 999px;
      border: none;
      padding: 9px 12px;
      font-size: 12px;
      font-weight: 950;
      background: #d1fae5;
      color: #065f46;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    @media (max-width: 1100px) {
      .admin-stats-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    }

    @media (max-width: 820px) {
      .admin-topbar { flex-direction: column; align-items: stretch; }
      .admin-pill { width: 100%; justify-content: center; }
      .admin-back-btn { width: 100%; justify-content: center; }
      .admin-stats-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }

    @media (max-width: 520px) {
      .admin-stats-grid { grid-template-columns: 1fr; }
    }
  `;

  if (!authUser || !(authUser.role === "admin" || authUser.role === "Admin")) {
    return (
      <div className="admin-page">
        <style>{styles}</style>
        <div className="admin-wrap">
          <div className="admin-card">
            <p style={{ margin: 0, fontWeight: 800, color: "#0f172a" }}>
              You must be admin to view removed services.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const removedCount = enrichedRemoved.length;

  return (
    <div className="admin-page">
      <style>{styles}</style>

      <div className="admin-wrap">
        {/* Top bar */}
        <div className="admin-topbar">
          <div>
            <h1 className="admin-title">
              <FaTimesCircle /> Removed services
            </h1>
            <div className="admin-subtitle">
              View all services removed by admins and restore them if needed.
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <div className="admin-pill" title="Current admin">
              <FaUserTie size={13} />
              Logged in as admin: {authUser.name || authUser.email}
            </div>

            <button
              type="button"
              className="admin-back-btn"
              onClick={() => navigate("/admin/services")}
              title="Back to moderation panel"
            >
              <FaArrowLeft /> Back
            </button>
          </div>
        </div>

        {/*  Stats cards row */}
        <div className="admin-stats-shell">
          <div className="admin-stats-grid">
            <div className="stat-card">
              <div
                className="stat-icon"
                style={{ background: "#dbeafe", color: "#2563eb" }}
              >
                <FaBox />
              </div>
              <div className="stat-value">{stats.total}</div>
              <div className="stat-label">TOTAL SERVICES</div>
            </div>

            <div className="stat-card">
              <div
                className="stat-icon"
                style={{ background: "#fef3c7", color: "#b45309" }}
              >
                <FaClock />
              </div>
              <div className="stat-value">{stats.pending}</div>
              <div className="stat-label">PENDING</div>
            </div>

            <div className="stat-card">
              <div
                className="stat-icon"
                style={{ background: "#dcfce7", color: "#16a34a" }}
              >
                <FaCheckCircle />
              </div>
              <div className="stat-value">{stats.approved}</div>
              <div className="stat-label">APPROVED</div>
            </div>

            <div className="stat-card stat-active">
              <div
                className="stat-icon"
                style={{ background: "#ffe4e6", color: "#b91c1c" }}
              >
                <FaTimesCircle />
              </div>
              <div className="stat-value">{stats.removed}</div>
              <div className="stat-label">REMOVED</div>
              
            </div>
          </div>
        </div>

        {/* Removed list */}
        <div className="admin-card">
          <div className="admin-removed-header-row">
            <div className="admin-removed-title">
              <FaShieldAlt size={14} />
              Removed services{" "}
              <span className="admin-removed-count-pill">
                {removedCount} removed
              </span>
            </div>
          </div>

          {removedCount === 0 ? (
            <p className="admin-empty-removed">
              No removed services at the moment. 🎉
            </p>
          ) : (
            <div className="admin-removed-grid">
              {enrichedRemoved.map((s) => (
                <div key={getKey(s)} className="admin-removed-card">
                  <div className="admin-removed-badge">
                    <FaTimesCircle size={11} />
                    Removed by admin
                  </div>

                  <div className="admin-removed-name">{s.name}</div>

                  <div className="admin-removed-meta">
                    {s.category || "Service"} · {s.location || "Location not set"}
                  </div>

                  <div className="admin-removed-meta">
                    {s.source === "vendor" ? "Vendor" : "Static"} listing
                  </div>

                  <div className="admin-removed-actions">
                    <button
                      type="button"
                      className="admin-removed-restore-btn"
                      onClick={() => handleRestore(s)}
                    >
                      <FaCheckCircle size={11} />
                      Restore
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}