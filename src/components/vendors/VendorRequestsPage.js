// src/pages/vendors/VendorRequestsPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import {
  FaInbox,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaMapMarkerAlt,
  FaBolt,
  FaWrench,
  FaBook,
  FaCar,
  FaHome,
} from "react-icons/fa";

import servicesData from "../../data/services.json";

const REQUESTS_KEY = "local-service-discovery:contact-requests";
const VENDOR_SESSION_KEY = "local-service-discovery:vendor-session";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

const categoryIcon = {
  Electrician: <FaBolt />,
  Plumber: <FaWrench />,
  Tutor: <FaBook />,
  Mechanic: <FaCar />,
  "Home Service": <FaHome />,
};

const normalizeFilter = (value) => {
  if (value === "accepted" || value === "rejected" || value === "all") {
    return value;
  }
  // default
  return "pending";
};

export default function VendorRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [searchParams] = useSearchParams();
  const [session, setSession] = useState(null);
  const [vendorServiceName, setVendorServiceName] = useState("");

  const [statusFilter, setStatusFilter] = useState(() =>
    normalizeFilter(searchParams.get("filter"))
  );
useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  /* 🔹 keep tab in sync with ?filter=pending/accepted/... */
  useEffect(() => {
    setStatusFilter(normalizeFilter(searchParams.get("filter")));
  }, [searchParams]);

  /* 🔹 figure out which vendor is logged in (same logic as dashboard) */
  useEffect(() => {
    try {
      const auth = JSON.parse(localStorage.getItem("authUser") || "null");
      if (!auth || auth.role !== "vendor") {
        setSession(null);
        setVendorServiceName("");
        return;
      }

      const storedSession = JSON.parse(
        localStorage.getItem(VENDOR_SESSION_KEY) || "null"
      );

      const effectiveSession =
        storedSession || {
          vendorName: auth.name || auth.email,
          serviceId: auth.serviceId || 1,
        };

      localStorage.setItem(
        VENDOR_SESSION_KEY,
        JSON.stringify(effectiveSession)
      );

      setSession(effectiveSession);

      const svc = servicesData.find((s) => s.id === effectiveSession.serviceId);
      const svcName = svc?.name || effectiveSession.vendorName || "";
      setVendorServiceName(svcName.trim().toLowerCase());
    } catch {
      setSession(null);
      setVendorServiceName("");
    }
  }, []);
  useEffect(() => {
    if (!session) {
      setRequests([]);
      return;
    }

    try {
      const stored =
        JSON.parse(localStorage.getItem(REQUESTS_KEY) || "[]") || [];

      const mine = stored
        .filter((r) => {
          if (r.serviceId != null) {
            return r.serviceId === session.serviceId;
          }

          // Old format match by service name
          if (!vendorServiceName) return false;
          const name = (r.serviceName || r.name || "")
            .trim()
            .toLowerCase();
          return name === vendorServiceName;
        })
        .map((r) => {
          const pretty = r.requestStatus || "Pending";
          const lower = (r.status || pretty).toLowerCase(); // pending/accepted/rejected
          return {
            ...r,
            requestStatus: pretty,
            status: lower,
          };
        });

      setRequests(mine);
    } catch {
      setRequests([]);
    }
  }, [session, vendorServiceName]);

  // stats
  const totalRequests = requests.length;
  const pendingCount = requests.filter(
    (r) => (r.requestStatus || "Pending") === "Pending"
  ).length;
  const acceptedCount = requests.filter(
    (r) => r.requestStatus === "Accepted"
  ).length;
  const rejectedCount = requests.filter(
    (r) => r.requestStatus === "Rejected"
  ).length;

  // filter for list
  const filteredRequests = useMemo(() => {
    if (statusFilter === "all") return requests;
    if (statusFilter === "pending") {
      return requests.filter(
        (r) => (r.requestStatus || "Pending") === "Pending"
      );
    }
    if (statusFilter === "accepted") {
      return requests.filter((r) => r.requestStatus === "Accepted");
    }
    if (statusFilter === "rejected") {
      return requests.filter((r) => r.requestStatus === "Rejected");
    }
    return requests;
  }, [requests, statusFilter]);

  const handleUpdateStatus = (indexInFiltered, newStatus) => {
    const pretty = newStatus; // "Accepted" / "Rejected"
    const lower = newStatus.toLowerCase();

    setRequests((prev) => {
      const filtered = filteredRequests;
      const target = filtered[indexInFiltered];
      if (!target) return prev;

      const next = prev.map((r) =>
        r.time === target.time && r.id === target.id
          ? { ...r, requestStatus: pretty, status: lower }
          : r
      );

      try {
        const all =
          JSON.parse(localStorage.getItem(REQUESTS_KEY) || "[]") || [];
        const updatedAll = all.map((r) =>
          r.time === target.time && r.id === target.id
            ? { ...r, requestStatus: pretty, status: lower }
            : r
        );
        localStorage.setItem(REQUESTS_KEY, JSON.stringify(updatedAll));
      } catch {
        // ignore
      }

      return next;
    });
  };

  const titleByFilter = {
    pending: "Pending customer requests",
    accepted: "Accepted customer requests",
    rejected: "Rejected customer requests",
    all: "All customer requests",
  };

  const subtitleByFilter = {
    pending:
      "Review new requests and respond quickly to keep customers happy.",
    accepted:
      "See all bookings you’ve already accepted and keep track of upcoming jobs.",
    rejected:
      "Requests that you chose not to take. These are stored for your records.",
    all:
      "A complete history of every customer request you’ve received on LocalServe.",
  };

  return (
    <div className="vendor-requests-page">
      <style>{`
        .vendor-requests-page {
          min-height: 100vh;
          background: #f3f4f6;
        }

        .page-hero {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          padding: 56px 16px 72px;
          color: #ffffff;
        }

        .page-hero-inner {
          max-width: 1100px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .page-hero-icon {
          width: 52px;
          height: 52px;
          border-radius: 12px;
          background: rgba(15, 23, 42, 0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 26px;
        }

        .page-hero-texts {
          flex: 1;
        }

        .page-hero-title {
          font-size: 32px;
          font-weight: 800;
          letter-spacing: -0.03em;
          margin-bottom: 6px;
        }

        .page-hero-subtitle {
          font-size: 14px;
          opacity: 0.9;
        }

        .requests-main {
          max-width: 1100px;
          margin: -40px auto 40px;
          padding: 0 16px 40px;
        }

        .requests-shell {
          background: #ffffff;
          border-radius: 24px;
          padding: 20px 22px 26px;
          box-shadow: 0 20px 50px rgba(15, 23, 42, 0.22);
        }

        .requests-tabs {
          display: inline-flex;
          background: linear-gradient(90deg, #e5edff, #eef2ff);
          border-radius: 999px;
          padding: 4px;
          gap: 4px;
          margin-bottom: 18px;
        }

        .requests-tab-btn {
          border-radius: 999px;
          padding: 7px 16px;
          font-size: 13px;
          border: none;
          background: transparent;
          color: #1e3a8a;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .requests-tab-btn.active {
          background: #ffffff;
          box-shadow: 0 8px 20px rgba(37, 99, 235, 0.35);
          color: #2563eb;
        }

        .requests-tab-btn:hover {
          transform: translateY(-1px);
        }

        .requests-stats-row {
          display: grid;
          grid-template-columns: repeat(4, minmax(0,1fr));
          gap: 14px;
        }

        .requests-stat-card {
          background: #f9fafb;
          border-radius: 18px;
          padding: 14px 16px;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.12);
          transition: transform 0.18s ease, box-shadow 0.18s ease;
        }

        .requests-stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 34px rgba(15, 23, 42, 0.18);
        }

        .stat-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: #9ca3af;
          margin-bottom: 6px;
        }

        .stat-value {
          font-size: 22px;
          font-weight: 800;
          color: #111827;
        }

        .requests-list {
          margin-top: 22px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .request-card {
          background: #ffffff;
          border-radius: 18px;
          padding: 14px 16px;
          box-shadow: 0 10px 25px rgba(15, 23, 42, 0.12);
          display: grid;
          grid-template-columns: minmax(0, 2fr) minmax(0, 1.1fr);
          gap: 12px;
          transition: transform 0.18s ease, box-shadow 0.18s ease;
        }

        .request-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 32px rgba(15, 23, 42, 0.18);
        }

        .request-main {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .request-title-row {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px;
        }

        .request-service-name {
          font-size: 15px;
          font-weight: 600;
          color: #111827;
        }

        .request-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          padding: 4px 10px;
          border-radius: 999px;
          background: #e5efff;
          color: #1d4ed8;
        }

        .request-location {
          font-size: 12px;
          color: #6b7280;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .request-meta-row {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 4px;
          font-size: 12px;
          color: #4b5563;
        }

        .request-meta-pill {
          padding: 4px 8px;
          border-radius: 999px;
          background: #f3f4f6;
        }

        .request-message {
          margin-top: 6px;
          font-size: 13px;
          color: #4b5563;
        }

        .request-side {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 8px;
        }

        .request-status-pill {
          align-self: flex-end;
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .status-pending {
          background: #fff7ed;
          color: #c2410c;
        }

        .status-accepted {
          background: #ecfdf3;
          color: #15803d;
        }

        .status-rejected {
          background: #fef2f2;
          color: #b91c1c;
        }

        .request-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          justify-content: flex-end;
        }

        .btn-round {
          border-radius: 999px;
          padding: 6px 14px;
          font-size: 12px;
          font-weight: 600;
          border: none;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 0.18s ease;
        }

        .btn-accept {
          background: linear-gradient(135deg, #22c55e, #16a34a);
          color: #ffffff;
          box-shadow: 0 8px 20px rgba(34, 197, 94, 0.4);
        }

        .btn-accept:hover {
          transform: translateY(-1px);
          box-shadow: 0 10px 24px rgba(34, 197, 94, 0.5);
        }

        .btn-reject {
          background: #f3f4f6;
          color: #b91c1c;
        }

        .btn-reject:hover {
          background: #fee2e2;
        }

        .empty-box {
          margin-top: 18px;
          padding: 20px;
          border-radius: 16px;
          background: #e5efff;
          color: #1e3a8a;
          font-size: 14px;
        }

        @media (max-width: 900px) {
          .request-card {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .page-hero-inner {
            flex-direction: row;
          }

          .page-hero-title {
            font-size: 24px;
          }

          .requests-stats-row {
            grid-template-columns: repeat(2, minmax(0,1fr));
          }

          .requests-shell {
            padding: 18px 16px 22px;
          }
        }
      `}</style>

      {/* HERO */}
      <section className="page-hero">
        <motion.div
          className="page-hero-inner"
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          transition={{ duration: 0.5 }}
        >
          <div className="page-hero-icon">
            <FaInbox />
          </div>
          <div className="page-hero-texts">
            <h1 className="page-hero-title">{titleByFilter[statusFilter]}</h1>
            <p className="page-hero-subtitle">
              {subtitleByFilter[statusFilter]}
            </p>
          </div>
        </motion.div>
      </section>

      {/* MAIN CONTENT */}
      <div className="requests-main">
        <motion.div
          className="requests-shell"
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          transition={{ duration: 0.45, delay: 0.05 }}
        >
          {/* TABS */}
          <div className="requests-tabs">
            <button
              type="button"
              className={`requests-tab-btn ${
                statusFilter === "pending" ? "active" : ""
              }`}
              onClick={() => setStatusFilter("pending")}
            >
              Pending
            </button>
            <button
              type="button"
              className={`requests-tab-btn ${
                statusFilter === "accepted" ? "active" : ""
              }`}
              onClick={() => setStatusFilter("accepted")}
            >
              Accepted
            </button>
            <button
              type="button"
              className={`requests-tab-btn ${
                statusFilter === "rejected" ? "active" : ""
              }`}
              onClick={() => setStatusFilter("rejected")}
            >
              Rejected
            </button>
            <button
              type="button"
              className={`requests-tab-btn ${
                statusFilter === "all" ? "active" : ""
              }`}
              onClick={() => setStatusFilter("all")}
            >
              All
            </button>
          </div>

          {/* STATS */}
          <div className="requests-stats-row">
            <div className="requests-stat-card">
              <div className="stat-label">Total requests</div>
              <div className="stat-value">{totalRequests}</div>
            </div>
            <div className="requests-stat-card">
              <div className="stat-label">Pending</div>
              <div className="stat-value">{pendingCount}</div>
            </div>
            <div className="requests-stat-card">
              <div className="stat-label">Accepted</div>
              <div className="stat-value">{acceptedCount}</div>
            </div>
            <div className="requests-stat-card">
              <div className="stat-label">Rejected</div>
              <div className="stat-value">{rejectedCount}</div>
            </div>
          </div>

          {/* LIST */}
          <motion.div
            className="requests-list"
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            transition={{ duration: 0.45, delay: 0.12 }}
          >
            {filteredRequests.length === 0 ? (
              <div className="empty-box">
                You don’t have any requests in this category yet. When customers
                reach out from the service page, their details will appear here.
              </div>
            ) : (
              filteredRequests.map((req, idx) => {
                const status = req.requestStatus || "Pending";
                const statusClass =
                  status === "Accepted"
                    ? "status-accepted"
                    : status === "Rejected"
                    ? "status-rejected"
                    : "status-pending";

                return (
                  <div
                    key={`${req.id}-${req.time || idx}`}
                    className="request-card"
                  >
                    <div className="request-main">
                      <div className="request-title-row">
                        <div className="request-service-name">
                          {req.name || "Service request"}
                        </div>
                        <div className="request-badge">
                          {categoryIcon[req.category] && (
                            <span>{categoryIcon[req.category]}</span>
                          )}
                          <span>{req.category || "Service"}</span>
                        </div>
                      </div>

                      <div className="request-location">
                        <FaMapMarkerAlt />
                        <span>{req.location || "Customer location"}</span>
                      </div>

                      <div className="request-meta-row">
                        <div className="request-meta-pill">
                          <strong>Urgency:</strong> {req.urgency || "Normal"}
                        </div>
                        {req.preferredDate && (
                          <div className="request-meta-pill">
                            <strong>Date:</strong> {req.preferredDate}
                          </div>
                        )}
                        {req.preferredTime && (
                          <div className="request-meta-pill">
                            <strong>Time:</strong> {req.preferredTime}
                          </div>
                        )}
                        {req.time && (
                          <div className="request-meta-pill">
                            <FaClock style={{ marginRight: 3 }} />
                            {new Date(req.time).toLocaleString()}
                          </div>
                        )}
                      </div>

                      {req.message && (
                        <div className="request-message">
                          “{req.message}”
                        </div>
                      )}
                    </div>

                    <div className="request-side">
                      <span className={`request-status-pill ${statusClass}`}>
                        {status === "Accepted" && <FaCheckCircle />}
                        {status === "Rejected" && <FaTimesCircle />}
                        {status === "Pending" && <FaClock />}
                        {status}
                      </span>

                      {status === "Pending" && (
                        <div className="request-actions">
                          <button
                            type="button"
                            className="btn-round btn-accept"
                            onClick={() =>
                              handleUpdateStatus(idx, "Accepted")
                            }
                          >
                            <FaCheckCircle />
                            Accept
                          </button>
                          <button
                            type="button"
                            className="btn-round btn-reject"
                            onClick={() =>
                              handleUpdateStatus(idx, "Rejected")
                            }
                          >
                            <FaTimesCircle />
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}