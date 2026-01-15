import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaUserTie,
  FaMapMarkerAlt,
  FaInbox,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaStar,
  FaPhoneAlt,
} from "react-icons/fa";

import servicesData from "../../data/services.json";

const VENDOR_SESSION_KEY = "local-service-discovery:vendor-session";
const CONTACT_KEY = "local-service-discovery:contact-requests";
const VENDOR_PROFILE_KEY = "local-service-discovery:vendor-profiles";
const VENDOR_REVIEWS_KEY = "local-service-discovery:vendor-reviews";
const VENDOR_SERVICES_KEY = "local-service-discovery:vendor-services";
// normalise status from old & new formats
const getRequestStatus = (r) =>
  (r.status || r.requestStatus || "pending").toLowerCase();

export default function VendorDashboard() {
  const navigate = useNavigate();

  const [authUser, setAuthUser] = useState(null);
  const [session, setSession] = useState(null);
  const [service, setService] = useState(null);

  // extended profile with location + branches
  const [profile, setProfile] = useState({
    companyName: "",
    phone: "",
    availability: "Available",
    description: "",
    primaryLocation: "",
    branches: "",
  });

  const [requests, setRequests] = useState([]);
  const [reviews, setReviews] = useState([]);

  // ----------------- LOAD AUTH + SESSION -----------------
  useEffect(() => {
    try {
      const auth = JSON.parse(localStorage.getItem("authUser") || "null");
      setAuthUser(auth);

      if (!auth || auth.role !== "vendor") {
        setSession(null);
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
    } catch {
      setSession(null);
    }
  }, []);

  // ----------------- LOAD SERVICE + PROFILE + REQUESTS + REVIEWS -----------------
  useEffect(() => {
    if (!session) return;

    const svc = servicesData.find((s) => s.id === session.serviceId);
    setService(svc || null);

    // profile overrides
    try {
      const allProfiles =
        JSON.parse(localStorage.getItem(VENDOR_PROFILE_KEY) || "{}") || {};
      const p = allProfiles[String(session.serviceId)] || {};

      setProfile({
        companyName: p.companyName || svc?.name || "",
        phone: p.phone || svc?.phone || "",
        availability: p.availability || svc?.status || "Available",
        description:
          p.description ||
          "Describe your services, experience, coverage areas, and working hours.",
        primaryLocation: p.primaryLocation || svc?.location || "",
        branches: p.branches || "",
      });
    } catch {
      setProfile({
        companyName: svc?.name || "",
        phone: svc?.phone || "",
        availability: svc?.status || "Available",
        description:
          "Describe your services, experience, coverage areas, and working hours.",
        primaryLocation: svc?.location || "",
        branches: "",
      });
    }

    // requests
try {
  const allReq =
    JSON.parse(localStorage.getItem(CONTACT_KEY) || "[]") || [];

  const mine = allReq
    .filter((r) => {
      // NEW format: match by serviceId
      if (r.serviceId != null) {
        return r.serviceId === session.serviceId;
      }

      // OLD format: link by id (1,2,3…) or by name
      return r.id === session.serviceId || r.name === svc?.name;
    })
    .map((r) => ({
      // normalise into a shape the dashboard understands
      ...r,
      serviceId: r.serviceId ?? session.serviceId,
      status: getRequestStatus(r),
    }))
    .sort((a, b) => new Date(b.time) - new Date(a.time));

  setRequests(mine);
} catch {
  setRequests([]);
}

    // reviews
    try {
      const allReviews =
        JSON.parse(localStorage.getItem(VENDOR_REVIEWS_KEY) || "[]") || [];

      const mine = allReviews
        .filter((r) => r.serviceId === session.serviceId)
        .sort((a, b) => {
          const ta = new Date(
            a.time || a.createdAt || a.date || 0
          ).getTime();
          const tb = new Date(
            b.time || b.createdAt || b.date || 0
          ).getTime();
          return (tb || 0) - (ta || 0);
        });

      setReviews(mine);
    } catch {
      setReviews([]);
    }
  }, [session]);

  // ----------------- SAVE PROFILE -----------------
const saveProfile = () => {
  if (!session) return;

  try {
    // 1) Save profile overrides (as you already had)
    const allProfiles =
      JSON.parse(localStorage.getItem(VENDOR_PROFILE_KEY) || "{}") || {};
    allProfiles[String(session.serviceId)] = { ...profile };
    localStorage.setItem(VENDOR_PROFILE_KEY, JSON.stringify(allProfiles));

    // 2) Publish / update a public service card for this vendor
    let published = [];
    try {
      published =
        JSON.parse(localStorage.getItem(VENDOR_SERVICES_KEY) || "[]") || [];
    } catch {
      published = [];
    }

    const entry = {
      id: session.serviceId, // keeps it linked by ID
      name: profile.companyName || service?.name || session.vendorName,
      category: service?.category || "Service provider",
      location: profile.primaryLocation || service?.location || "",
      phone: profile.phone || service?.phone || "",
      description:
        profile.description ||
        service?.description ||
        "Local service provider",
      isVerified: true,     // ✅ dynamic vendors are verified
      fromVendor: true      // mark as coming from real vendor account
    };

    // upsert by id (if same id exists, update it)
    const idx = published.findIndex((p) => p.id === entry.id);
    if (idx >= 0) {
      published[idx] = entry;
    } else {
      published.push(entry);
    }

    localStorage.setItem(VENDOR_SERVICES_KEY, JSON.stringify(published));

    alert("Vendor profile updated & published to customers.");
  } catch {
    alert("Could not save profile (localStorage error).");
  }
};

  // ----------------- UPDATE REQUEST STATUS -----------------
 const handleUpdateRequestStatus = (requestId, status) => {
  try {
    const allReq =
      JSON.parse(localStorage.getItem(CONTACT_KEY) || "[]") || [];

    const updated = allReq.map((r) => {
      if (r.id !== requestId) return r;

      const normalised = status.toLowerCase(); // "accepted" / "rejected" / "pending"
      const pretty =
        normalised.charAt(0).toUpperCase() + normalised.slice(1); // "Accepted"

      return {
        ...r,
        status: normalised,        // new format
        requestStatus: pretty,     // keep old field for MyRequests
      };
    });

    localStorage.setItem(CONTACT_KEY, JSON.stringify(updated));

    // re-apply same filter + normalisation as in useEffect
    const mine = updated
      .filter((r) => {
        if (r.serviceId != null) return r.serviceId === session.serviceId;
        return r.id === session.serviceId || r.name === service?.name;
      })
      .map((r) => ({
        ...r,
        serviceId: r.serviceId ?? session.serviceId,
        status: getRequestStatus(r),
      }))
      .sort((a, b) => new Date(b.time) - new Date(a.time));

    setRequests(mine);
  } catch {
    // ignore
  }
};

  // ----------------- STATS -----------------
  const stats = useMemo(() => {
    const total = requests.length;
    const pending = requests.filter((r) => r.status === "pending").length;
    const accepted = requests.filter((r) => r.status === "accepted").length;
    const rejected = requests.filter((r) => r.status === "rejected").length;
    const urgent = requests.filter((r) => r.urgency === "Urgent").length;

    const avgRating =
      reviews.reduce((sum, r) => sum + (r.rating || 0), 0) /
      (reviews.length || 1);

    return {
      total,
      pending,
      accepted,
      rejected,
      urgent,
      avgRating: reviews.length ? avgRating.toFixed(1) : null,
      reviewCount: reviews.length,
    };
  }, [requests, reviews]);

  // extra derived metrics for “Performance insights”
  const conversionRate =
    stats.total > 0 ? Math.round((stats.accepted / stats.total) * 100) : 0;
  const responseRate =
    stats.total > 0
      ? Math.round(
          ((stats.accepted + stats.rejected) / stats.total) * 100
        )
      : 0;
  const pendingShare =
    stats.total > 0 ? Math.round((stats.pending / stats.total) * 100) : 0;

  const totalForBars = stats.total || 1;
  const acceptedPct = Math.round((stats.accepted / totalForBars) * 100);
  const rejectedPct = Math.round((stats.rejected / totalForBars) * 100);
  const pendingPct = Math.round((stats.pending / totalForBars) * 100);

  // ----------------- DERIVED HERO TEXT -----------------
  const vendorName =
    session?.vendorName || authUser?.name || authUser?.email || "Vendor";
  const companyName = profile.companyName || service?.name || "Your business";
  const category = service?.category || "Service provider";
  const city = profile.primaryLocation || service?.location || "Your city";

  // ----------------- STYLES -----------------
 const styles = `
@keyframes fadeSlideDown {
  from { opacity: 0; transform: translateY(-10px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes fadeSlideUp {
  from { opacity: 0; transform: translateY(18px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes fadeInSoft {
  from { opacity: 0; transform: translateY(10px) scale(0.98); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

.vendor-animate-hero { animation: fadeSlideDown 0.6s ease-out forwards; }
.vendor-animate-hero-delay {
  animation: fadeSlideDown 0.7s ease-out forwards;
  animation-delay: 0.08s;
}
.vendor-animate-card { animation: fadeInSoft 0.5s ease-out forwards; }
.vendor-animate-card-right {
  animation: fadeInSoft 0.55s ease-out forwards;
  animation-delay: 0.05s;
}

/* PAGE WRAPPER */
.vendor-page {
  width: 100%;
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  padding-bottom: 60px;
  padding-top: 0;
  box-sizing: border-box;
}

/* HERO */
.vendor-hero {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: #ffffff;
  padding: 90px 0 80px;
  position: relative;
  overflow: hidden;
  width: 100%;
}
.vendor-hero::before {
  content: '';
  position: absolute;
  inset: 0;
  background: url('data:image/svg+xml,<svg width="60" height="60" xmlns="http://www.w3.org/2000/svg"><circle cx="30" cy="30" r="1.5" fill="rgba(255,255,255,0.1)"/></svg>');
  opacity: 0.4;
}
.vendor-hero::after {
  content: '';
  position: absolute;
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%);
  top: -300px;
  right: -300px;
  border-radius: 50%;
}
.vendor-hero-content {
  position: relative;
  z-index: 1;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
}
.vendor-hero-left {
  display: flex;
  align-items: center;
  gap: 20px;
}
.vendor-big-icon {
  width: 112px;
  height: 112px;
  border-radius: 32px;
  background: rgba(15, 23, 42, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  color: #dbeafe;
  box-shadow:
    inset 0 0 26px rgba(255, 255, 255, 0.16),
    0 28px 60px rgba(15, 23, 42, 0.85);
}
.vendor-welcome-text {
  font-size: 40px;
  font-weight: 900;
  letter-spacing: -0.8px;
  color: #f9fafb;
  margin-bottom: 6px;
}
.vendor-company-meta {
  font-size: 18px;
  font-weight: 600;
  color: #e0ecff;
}
.vendor-hero-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}
.vendor-location-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(15, 23, 42, 0.35);
  padding: 8px 20px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 600;
  color: #e5edff;
  box-shadow: 0 14px 40px rgba(15, 23, 42, 0.75);
}

/* STATS STRIP (outer card has NO animation) */
.vendor-stats-strip {
  background: #ffffff;
  margin: -60px auto 0;
  position: relative;
  z-index: 10;
  border-radius: 24px;
  padding: 24px 28px;
  box-shadow: 0 18px 50px rgba(15, 23, 42, 0.12);
  width: 90%;
  max-width: 1100px;
  box-sizing: border-box;
}
.vendor-stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 24px;
}

/* inner stat cards individually animated */
.vendor-stat-card {
  background: linear-gradient(180deg, #ffffff 0%, #f6f8ff 100%);
  border-radius: 24px;
  padding: 20px 10px 22px;
  text-align: center;
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.06);
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    background 0.18s ease;
  cursor: pointer;
  opacity: 0;
  animation: fadeInSoft 0.55s ease-out forwards;
}
.vendor-stat-card:nth-child(1) { animation-delay: 0.06s; }
.vendor-stat-card:nth-child(2) { animation-delay: 0.12s; }
.vendor-stat-card:nth-child(3) { animation-delay: 0.18s; }
.vendor-stat-card:nth-child(4) { animation-delay: 0.24s; }

.vendor-stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 22px 50px rgba(15, 23, 42, 0.14);
  background: linear-gradient(180deg, #ffffff 0%, #eef3ff 100%);
}
.vendor-stat-icon-circle {
  width: 80px;
  height: 80px;
  margin: 0 auto 12px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
}
.vendor-stat-icon-blue { background: #e0ebff; color: #2563eb; }
.vendor-stat-icon-amber { background: #fef3c7; color: #d97706; }
.vendor-stat-icon-green { background: #dcfce7; color: #16a34a; }
.vendor-stat-icon-gold { background: #fef9c3; color: #eab308; }
.vendor-stat-value {
  font-size: 32px;
  line-height: 1.1;
  font-weight: 800;
  color: #111827;
  margin-bottom: 6px;
}
.vendor-stat-label {
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: #4b5563;
  text-transform: uppercase;
}

/* MAIN CONTENT */
.vendor-main-block {
  max-width: 100%;
  margin: 50px auto 40px;
  padding: 0 30px;   /* ~30px space on left & right */
  box-sizing: border-box;
}

/* LAYOUT
   1) Left column  = Service profile
   2) Right column = wrapper (customer requests + performance stacked)
*/
.vendor-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 1.2fr);
  column-gap: 40px;      /* horizontal gap between profile and right column */
  row-gap: 0;
  align-items: flex-start;
}

/* map only the TWO direct children now */
.vendor-layout > :nth-child(1) {
  grid-column: 1;
}
.vendor-layout > :nth-child(2) {
  grid-column: 2;
}

/* right side: stack Customer requests + Performance insights */
.vendor-right-column {
  display: flex;
  flex-direction: column;
  gap: 40px;          /* vertical gap between the two cards */
  height: 100%;
}

/* make both right cards stretch equally so top one doesn't look tiny */
.vendor-right-column > .vendor-card {
  flex: 1;
}

.vendor-card {
  background: #ffffff;
  border-radius: 20px;
  border: 1px solid #e2e8f0;
  padding: 18px 20px;
  box-shadow: 0 16px 36px rgba(15, 23, 42, 0.06);
}

.vendor-card--equal {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.vendor-card-title {
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.vendor-card-body {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
}

.vendor-card--reviews {
  margin-top: 24px;
}

/* clickable title link */
.vendor-card-link {
  background: none;
  border: none;
  padding: 0;
  font: inherit;
  color: inherit;
  cursor: pointer;
}

.vendor-card-link:hover {
  text-decoration: underline;
}
/* FORM CONTROLS */
.vendor-label {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.vendor-input,
.vendor-select,
.vendor-textarea {
  width: 100%;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  padding: 10px 12px;
  font-size: 14px;
  background: #f8fafc;
  transition: 0.2s ease;
}
.vendor-input:focus,
.vendor-select:focus,
.vendor-textarea:focus {
  outline: none;
  border-color: #2563eb;
  background: #ffffff;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.16);
}
.vendor-textarea {
  resize: vertical;
  min-height: 90px;
}
.vendor-save-btn {
  margin-top: 10px;
  border: none;
  border-radius: 999px;
  padding: 10px 16px;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 10px 20px rgba(37, 99, 235, 0.35);
}

/* REQUESTS / REVIEWS */
.vendor-requests-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-height: 260px;
  overflow-y: auto;
}
.vendor-request-item {
  border-radius: 14px;
  border: 1px solid #e2e8f0;
  padding: 10px 12px;
  display: flex;
  justify-content: space-between;
  gap: 10px;
  background: #f9fafb;
  transition: box-shadow 0.18s ease, transform 0.18s ease;
}
.vendor-request-item:hover {
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.12);
  transform: translateY(-2px);
}
.vendor-request-meta {
  font-size: 11px;
  color: #64748b;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}
.vendor-request-name {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 2px;
}
.vendor-request-msg {
  font-size: 13px;
  color: #475569;
}
.vendor-request-actions {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: flex-end;
  min-width: 130px;
}
.vendor-pill-status {
  font-size: 11px;
  padding: 4px 8px;
  border-radius: 999px;
  background: #e5e7eb;
  color: #374151;
  font-weight: 600;
}
.vendor-pill-status.pending {
  background: #fef3c7;
  color: #92400e;
}
.vendor-pill-status.accepted {
  background: #dcfce7;
  color: #166534;
}
.vendor-pill-status.rejected {
  background: #fee2e2;
  color: #991b1b;
}
.vendor-btn-accept,
.vendor-btn-reject {
  border-radius: 999px;
  border: none;
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
}
.vendor-btn-accept {
  background: #16a34a;
  color: #ffffff;
}
.vendor-btn-reject {
  background: #ffffff;
  color: #b91c1c;
  border: 1px solid #fecaca;
}
.vendor-request-phone {
  font-size: 12px;
  color: #0f172a;
  margin-top: 4px;
}
.vendor-request-phone span {
  font-weight: 600;
}
.vendor-reviews-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.vendor-review-item {
  border-radius: 14px;
  border: 1px solid #e2e8f0;
  padding: 8px 10px;
  font-size: 13px;
  background: #f9fafb;
  display: flex;
  justify-content: space-between;
  gap: 8px;
  transition: box-shadow 0.18s ease, transform 0.18s ease;
}
.vendor-review-item:hover {
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.12);
  transform: translateY(-2px);
}
.vendor-review-stars {
  display: flex;
  align-items: center;
  gap: 2px;
  margin-bottom: 2px;
}

/* performance metrics */
.vendor-metrics {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 4px;
}
.vendor-metric-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  margin-bottom: 4px;
}
.vendor-metric-label {
  color: #6b7280;
  font-weight: 500;
}
.vendor-metric-value {
  color: #111827;
  font-weight: 600;
}
.vendor-metric-bar {
  width: 100%;
  height: 8px;
  border-radius: 999px;
  background: #e5e7eb;
  overflow: hidden;
}
.vendor-metric-bar-inner {
  height: 100%;
  border-radius: 999px;
  transition: width 0.4s ease;
}

/* LOGIN CARD */
.vendor-login-card {
  max-width: 480px;
  margin: 80px auto;
  padding: 32px 28px;
  border-radius: 24px;
  background: #ffffff;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.16);
  text-align: center;
  border: 1px solid #e2e8f0;
}
.vendor-login-btn {
  margin-top: 18px;
  padding: 10px 18px;
  border-radius: 999px;
  border: none;
  background: #2563eb;
  color: white;
  font-weight: 600;
  cursor: pointer;
}

/* RESPONSIVE */
@media (max-width: 960px) {
  .vendor-hero-content {
    padding: 0 30px 32px;
  }
  .vendor-welcome-text {
    font-size: 32px;
  }
  .vendor-stats-strip {
    width: 94%;
    padding: 20px;
  }
  .vendor-stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 18px;
  }
  .vendor-main-block {
    margin-top: 40px;
    padding: 0 10px 32px;
  }
  .vendor-layout {
    grid-template-columns: minmax(0, 1fr);
    grid-template-areas:
      "profile"
      "requests"
      "performance";
  }
}
@media (max-width: 640px) {
  .vendor-hero {
    padding: 70px 0 60px;
  }
  .vendor-hero-content {
    flex-direction: column;
    align-items: flex-start;
  }
  .vendor-big-icon {
    width: 88px;
    height: 88px;
    font-size: 38px;
  }
  .vendor-welcome-text {
    font-size: 26px;
  }
  .vendor-company-meta {
    font-size: 15px;
  }
  .vendor-stats-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
  /* EXTRA: make service profile, customer requests, performance & reviews cards responsive */
@media (max-width: 960px) {
  /* stack profile + right column instead of grid */
  .vendor-layout {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  /* make right column full width */
  .vendor-right-column {
    width: 100%;
  }

  /* ensure all main cards use full width on smaller screens */
  .vendor-card,
  .vendor-card--reviews {
    width: 100%;
    box-sizing: border-box;
  }
}

@media (max-width: 640px) {
  /* softer padding for very small screens */
  .vendor-main-block {
    padding: 0 12px 28px;
  }

  /* let requests list grow naturally instead of tiny scroll area */
  .vendor-requests-list {
    max-height: none;
  }
}
`;
   // ----------------- RENDER -----------------
  if (!authUser || authUser.role !== "vendor") {
    return (
      <div className="vendor-page">
        <style>{styles}</style>
        <div className="vendor-login-card vendor-animate-card">
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 20,
              background: "#eff6ff",
              margin: "0 auto 12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#2563eb",
              fontSize: 24,
            }}
          >
            <FaUserTie />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>
            Vendor dashboard
          </h2>
          <p style={{ fontSize: 14, color: "#64748b", marginBottom: 0 }}>
            You are not logged in as a service provider. Sign in with your
            vendor account to manage your profile and customer requests.
          </p>
          <button
            className="vendor-login-btn"
            onClick={() => navigate("/login")}
          >
            Go to login
          </button>
        </div>
      </div>
    );
  }

  if (!session || !service) {
    return (
      <div className="vendor-page">
        <style>{styles}</style>
        <p style={{ padding: "40px 24px" }}>Loading vendor data…</p>
      </div>
    );
  }

  return (
    <div className="vendor-page">
      <style>{styles}</style>

      {/* HERO */}
      <div className="vendor-hero">
        <div className="vendor-hero-content vendor-animate-hero">
          <div className="vendor-hero-left">
            <div className="vendor-big-icon">
              <FaUserTie />
            </div>
            <div className="vendor-animate-hero-delay">
              <div className="vendor-welcome-text">
                Welcome back, {vendorName}
              </div>
              <div className="vendor-company-meta">
                Managing <strong>{companyName}</strong> • {category} in {city}
              </div>
            </div>
          </div>

          <div className="vendor-hero-right vendor-animate-hero-delay">
            <div className="vendor-location-pill">
              <FaMapMarkerAlt size={13} /> {city}
            </div>
            <div style={{ fontSize: 12, color: "#e5edff", opacity: 0.85 }}>
              Logged in as vendor
            </div>
          </div>
        </div>
      </div>

            {/* STATS STRIP */}
      <div className="vendor-stats-strip">
        <div className="vendor-stats-grid">
          {/* Total requests -> ALL */}
          <div
            className="vendor-stat-card"
            onClick={() => navigate("/vendor/requests?filter=all")}
          >
            <div className="vendor-stat-icon-circle vendor-stat-icon-blue">
              <FaInbox />
            </div>
            <div className="vendor-stat-value">{stats.total}</div>
            <div className="vendor-stat-label">TOTAL REQUESTS</div>
          </div>

          {/* Pending -> PENDING tab */}
          <div
            className="vendor-stat-card"
            onClick={() => navigate("/vendor/requests?filter=pending")}
          >
            <div className="vendor-stat-icon-circle vendor-stat-icon-amber">
              <FaClock />
            </div>
            <div className="vendor-stat-value">{stats.pending}</div>
            <div className="vendor-stat-label">PENDING</div>
          </div>

          {/* Accepted -> ACCEPTED tab */}
          <div
            className="vendor-stat-card"
            onClick={() => navigate("/vendor/requests?filter=accepted")}
          >
            <div className="vendor-stat-icon-circle vendor-stat-icon-green">
              <FaCheckCircle />
            </div>
            <div className="vendor-stat-value">{stats.accepted}</div>
            <div className="vendor-stat-label">ACCEPTED</div>
          </div>

          {/* Rating -> REVIEWS PAGE */}
          <div
            className="vendor-stat-card"
            onClick={() => navigate("/vendor/reviews")}
          >
            <div className="vendor-stat-icon-circle vendor-stat-icon-gold">
              <FaStar />
            </div>
            <div className="vendor-stat-value">
              {stats.avgRating || "—"}
            </div>
            <div className="vendor-stat-label">RATING</div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="vendor-main-block">
        <div className="vendor-layout">
          {/* LEFT: SERVICE PROFILE */}
          <div className="vendor-card vendor-card--equal vendor-animate-card">
            <div className="vendor-card-title">
              <span>Service profile</span>
            </div>

            <div className="vendor-card-body">
              {/* Business name */}
              <div>
                <div className="vendor-label">Business / company name</div>
                <input
                  className="vendor-input"
                  value={profile.companyName}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, companyName: e.target.value }))
                  }
                  placeholder={service.name || "e.g. SparkPro Electrician"}
                />
                <div
                  style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}
                >
                  This name appears on your public card (for example “SparkPro
                  Electrician”).
                </div>
              </div>

              {/* Phone */}
              <div>
                <div className="vendor-label">Public contact phone</div>
                <div
                  style={{ display: "flex", alignItems: "center", gap: 8 }}
                >
                  <span
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 12,
                      background: "#eff6ff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#2563eb",
                    }}
                  >
                    <FaPhoneAlt />
                  </span>
                  <input
                    className="vendor-input"
                    value={profile.phone}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, phone: e.target.value }))
                    }
                    placeholder="e.g. 9876543210"
                  />
                </div>
                <div
                  style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}
                >
                  Customers see this after they send you a request.
                </div>
              </div>

              {/* Primary location */}
              <div>
                <div className="vendor-label">Primary location</div>
                <input
                  className="vendor-input"
                  value={profile.primaryLocation}
                  onChange={(e) =>
                    setProfile((p) => ({
                      ...p,
                      primaryLocation: e.target.value,
                    }))
                  }
                  placeholder={service.location || "e.g. Mumbai"}
                />
                <div
                  style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}
                >
                  This is the main city / area where you operate.
                </div>
              </div>

              {/* Branches */}
              <div>
                <div className="vendor-label">Branch locations (optional)</div>
                <textarea
                  className="vendor-textarea"
                  value={profile.branches}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, branches: e.target.value }))
                  }
                  placeholder="e.g. Andheri West, Bandra East, Thane"
                />
                <div
                  style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}
                >
                  List any additional branches or service areas, separated by
                  commas or on new lines.
                </div>
              </div>

              {/* Availability */}
              <div>
                <div className="vendor-label">Availability</div>
                <select
                  className="vendor-select"
                  value={profile.availability}
                  onChange={(e) =>
                    setProfile((p) => ({
                      ...p,
                      availability: e.target.value,
                    }))
                  }
                >
                  <option value="Available">Available</option>
                  <option value="Busy">Busy</option>
                  <option value="Offline">Offline</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <div className="vendor-label">Service description</div>
                <textarea
                  className="vendor-textarea"
                  value={profile.description}
                  onChange={(e) =>
                    setProfile((p) => ({
                      ...p,
                      description: e.target.value,
                    }))
                  }
                />
              </div>

              <button
                className="vendor-save-btn"
                type="button"
                onClick={saveProfile}
              >
                Save profile
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: CUSTOMER REQUESTS + PERFORMANCE (STACKED) */}
          <div className="vendor-right-column">
            {/* CUSTOMER REQUESTS */}
            <div className="vendor-card vendor-card--equal vendor-animate-card-right">
              <div className="vendor-card-title">
                <button
                  className="vendor-card-link"
                  type="button"
                  onClick={() => navigate("/vendor/requests")}
                >
                  Customer requests
                </button>
                <span
                  style={{
                    fontSize: 12,
                    color: "#64748b",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <FaClock size={12} />
                  latest first
                </span>
              </div>

              <div className="vendor-card-body">
                {requests.length === 0 && (
                  <p
                    style={{
                      fontSize: 13,
                      color: "#64748b",
                      marginBottom: 0,
                    }}
                  >
                    No requests yet. Customers can contact you from your service
                    card on the main site.
                  </p>
                )}

                {requests.length > 0 && (
                  <div className="vendor-requests-list">
                    {requests.map((r) => (
                    <div
                      key={`${r.id}-${r.time}`}
                        className="vendor-request-item"
                        onClick={() => navigate(`/vendor/requests/${r.id}`)}
                        style={{ cursor: "pointer" }}
                      >
                        <div>
                          <div className="vendor-request-meta">
                            <span>
                              <FaClock size={11} />{" "}
                              {new Date(r.time).toLocaleString()}
                            </span>
                            {r.urgency === "Urgent" && (
                              <span
                                style={{
                                  padding: "3px 8px",
                                  borderRadius: 999,
                                  background: "#fee2e2",
                                  color: "#b91c1c",
                                  fontWeight: 600,
                                  fontSize: 11,
                                }}
                              >
                                Urgent
                              </span>
                            )}
                          </div>
                          <div className="vendor-request-name">
                            {r.customerName || "Customer"}
                          </div>
                          <div className="vendor-request-msg">
                            {r.message
                              ? r.message.length > 120
                                ? `${r.message.slice(0, 120)}…`
                                : r.message
                              : "No additional details provided."}
                          </div>
                          <div className="vendor-request-phone">
                            <span>Customer phone: </span>
                            {r.status === "accepted"
                              ? r.customerPhone || "Not provided"
                              : "hidden until you accept the request"}
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              color: "#94a3b8",
                              marginTop: 2,
                            }}
                          >
                            Your phone visible to customer:{" "}
                            {profile.phone || service.phone || "Not set"}
                          </div>
                        </div>

                        <div className="vendor-request-actions">
                         {(() => {
                            const st = getRequestStatus(r); // normalize old/new status
                            return (
                              <span className={`vendor-pill-status ${st}`}>
                                {st === "pending" && "Pending"}
                                {st === "accepted" && "Accepted"}
                                {st === "rejected" && "Rejected"}
                              </span>
                            );
                          })()}
                          {r.status !== "accepted" && (
                            <button
                              className="vendor-btn-accept"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpdateRequestStatus(r.id, "accepted");
                              }}
                            >
                              <FaCheckCircle size={11} />
                              Accept
                            </button>
                          )}
                          {r.status !== "rejected" && (
                            <button
                              className="vendor-btn-reject"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpdateRequestStatus(r.id, "rejected");
                              }}
                            >
                              <FaTimesCircle size={11} />
                              Reject
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* PERFORMANCE INSIGHTS */}
            <div className="vendor-card vendor-card--equal vendor-animate-card-right">
              <div className="vendor-card-title">
                <span>Performance insights</span>
              </div>
              <div className="vendor-card-body">
                <div
                  style={{ fontSize: 13, color: "#6b7280", marginBottom: 4 }}
                >
                  Quick snapshot of how your service is performing. Later you
                  can plug in earnings / service charges here.
                </div>

                <div className="vendor-metrics">
                  {/* Conversion rate */}
                  <div>
                    <div className="vendor-metric-row">
                      <span className="vendor-metric-label">
                        Conversion rate
                      </span>
                      <span className="vendor-metric-value">
                        {conversionRate}%
                      </span>
                    </div>
                    <div className="vendor-metric-bar">
                      <div
                        className="vendor-metric-bar-inner"
                        style={{
                          width: `${conversionRate}%`,
                          background:
                            "linear-gradient(90deg, #4ade80, #22c55e)",
                        }}
                      />
                    </div>
                  </div>

                  {/* Response rate */}
                  <div>
                    <div className="vendor-metric-row">
                      <span className="vendor-metric-label">
                        Response rate
                      </span>
                      <span className="vendor-metric-value">
                        {responseRate}%
                      </span>
                    </div>
                    <div className="vendor-metric-bar">
                      <div
                        className="vendor-metric-bar-inner"
                        style={{
                          width: `${responseRate}%`,
                          background:
                            "linear-gradient(90deg, #60a5fa, #2563eb)",
                        }}
                      />
                    </div>
                  </div>

                  {/* Pending workload */}
                  <div>
                    <div className="vendor-metric-row">
                      <span className="vendor-metric-label">
                        Pending workload
                      </span>
                      <span className="vendor-metric-value">
                        {pendingShare}%
                      </span>
                    </div>
                    <div className="vendor-metric-bar">
                      <div
                        className="vendor-metric-bar-inner"
                        style={{
                          width: `${pendingShare}%`,
                          background:
                            "linear-gradient(90deg, #f97316, #ea580c)",
                        }}
                      />
                    </div>
                  </div>

                  <div
                    style={{
                      marginTop: 6,
                      fontSize: 12,
                      color: "#9ca3af",
                      lineHeight: 1.5,
                    }}
                  >
                    Accepted {stats.accepted} / {stats.total || 0} requests.{" "}
                    Pending {stats.pending}, rejected {stats.rejected}. Future:
                    add monthly bookings & revenue chart here.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* REVIEWS */}
        <div className="vendor-card vendor-card--reviews vendor-animate-card">
          <div className="vendor-card-title">
            <button
              className="vendor-card-link"
              type="button"
              onClick={() => navigate("/vendor/reviews")}
            >
              Reviews
            </button>
          </div>
          {reviews.length === 0 && (
            <p style={{ fontSize: 13, color: "#64748b", marginBottom: 0 }}>
              No reviews yet. Once customers submit ratings, they will appear
              here.
            </p>
          )}
          {reviews.length > 0 && (
  <div className="vendor-reviews-list">
    {reviews.map((rev, idx) => {
      // pick any date field that exists
      const rawDate = rev.time || rev.createdAt || rev.date;
      let formattedDate = "";
      if (rawDate) {
        const d = new Date(rawDate);
        if (!Number.isNaN(d.getTime())) {
          formattedDate = d.toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
          });
        }
      }

      const reviewerName =
        rev.customerName || rev.reviewerName || "Customer";

      return (
        <div key={rev.id || idx} className="vendor-review-item">
          <div>
            <div className="vendor-review-stars">
              {Array.from({ length: 5 }).map((_, starIdx) => (
                <FaStar
                  key={starIdx}
                  size={12}
                  color={
                    starIdx < (rev.rating || 0)
                      ? "#facc15"
                      : "#e5e7eb"
                  }
                />
              ))}
            </div>

            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 2,
              }}
            >
              {reviewerName}
            </div>

            <div style={{ fontSize: 13, color: "#475569" }}>
              {rev.comment && rev.comment.trim().length
                ? rev.comment
                : "No comment left, only rating."}
            </div>
          </div>

          <div style={{ fontSize: 11, color: "#94a3b8" }}>
            {formattedDate || "—"}
          </div>
        </div>
      );
    })}
  </div>
)}
        </div>
      </div>
    </div>
  );
}