import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaChartBar, FaUserTie, FaCheckCircle, FaClock, FaStar, FaTimesCircle } from "react-icons/fa";
import servicesData from "../../data/services.json";

const VENDOR_SESSION_KEY = "local-service-discovery:vendor-session";
const CONTACT_KEY = "local-service-discovery:contact-requests";
const VENDOR_REVIEWS_KEY = "local-service-discovery:vendor-reviews";
const VENDOR_SERVICES_KEY = "local-service-discovery:vendor-services";

const safeParse = (raw, fallback) => {
  try {
    const v = JSON.parse(raw);
    return v ?? fallback;
  } catch {
    return fallback;
  }
};

const getRequestStatus = (r) => (r.status || r.requestStatus || "pending").toLowerCase();

export default function VendorAnalyticsPage() {
  const navigate = useNavigate();
  const authUser = safeParse(localStorage.getItem("authUser") || "null", null);

  if (!authUser || authUser.role !== "vendor") {
    return (
      <div style={{ padding: 24 }}>
        <h2 style={{ marginBottom: 8 }}>Vendor analytics</h2>
        <p style={{ color: "#64748b" }}>Please login as vendor.</p>
        <button onClick={() => navigate("/login")}>Go to login</button>
      </div>
    );
  }

  const session =
    safeParse(localStorage.getItem(VENDOR_SESSION_KEY) || "null", null) || {
      vendorName: authUser.name || authUser.email,
      serviceId: authUser.serviceId || 1,
    };

  const styles = `
@keyframes fadeSlideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
@keyframes fadeInSoft { from { opacity: 0; transform: translateY(10px) scale(0.985); } to { opacity: 1; transform: translateY(0) scale(1); } }

.analytics-page {
  width: 100%;
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  padding-bottom: 60px;
  box-sizing: border-box;
}

.analytics-hero {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: #ffffff;
  padding: 90px 0 80px;
  position: relative;
  overflow: hidden;
  width: 100%;
}
.analytics-hero::before {
  content: '';
  position: absolute;
  inset: 0;
  background: url('data:image/svg+xml,<svg width="60" height="60" xmlns="http://www.w3.org/2000/svg"><circle cx="30" cy="30" r="1.5" fill="rgba(255,255,255,0.1)"/></svg>');
  opacity: 0.4;
}
.analytics-hero::after {
  content: '';
  position: absolute;
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%);
  top: -300px;
  right: -300px;
  border-radius: 50%;
}

.analytics-hero-content {
  position: relative;
  z-index: 1;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 18px;
  animation: fadeSlideDown 0.6s ease-out forwards;
}

.analytics-hero-left {
  display: flex;
  align-items: center;
  gap: 18px;
}
.analytics-big-icon {
  width: 112px;
  height: 112px;
  border-radius: 32px;
  background: rgba(15, 23, 42, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 46px;
  color: #dbeafe;
  box-shadow: inset 0 0 26px rgba(255, 255, 255, 0.16), 0 28px 60px rgba(15, 23, 42, 0.85);
}
.analytics-title {
  font-size: 40px;
  font-weight: 900;
  letter-spacing: -0.8px;
  margin-bottom: 6px;
}
.analytics-subtitle {
  font-size: 18px;
  font-weight: 600;
  color: #e0ecff;
}

.analytics-hero-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
}
.analytics-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(15, 23, 42, 0.35);
  padding: 8px 18px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 700;
  color: #e5edff;
  box-shadow: 0 14px 40px rgba(15, 23, 42, 0.75);
}
.analytics-back-btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,0.25);
  background: rgba(15, 23, 42, 0.22);
  color: #ffffff;
  cursor: pointer;
  font-weight: 800;
}

.analytics-stats-strip {
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
  animation: fadeInSoft 0.55s ease-out forwards;
}
.analytics-stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 18px;
}
.analytics-stat-card {
  background: linear-gradient(180deg, #ffffff 0%, #f6f8ff 100%);
  border-radius: 24px;
  padding: 18px 14px;
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.06);
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}
.analytics-stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 22px 50px rgba(15, 23, 42, 0.12);
}
.analytics-stat-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.analytics-stat-icon {
  width: 52px;
  height: 52px;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #eff6ff;
  color: #2563eb;
  font-size: 18px;
}
.analytics-stat-value {
  font-size: 32px;
  font-weight: 900;
  color: #0f172a;
  line-height: 1.1;
}
.analytics-stat-label {
  margin-top: 8px;
  font-size: 12px;
  font-weight: 900;
  color: #64748b;
  letter-spacing: 0.10em;
  text-transform: uppercase;
}
.analytics-stat-note {
  margin-top: 6px;
  font-size: 12px;
  color: #94a3b8;
}

.analytics-main {
  max-width: 1200px;
  margin: 36px auto 0;
  padding: 0 30px;
  box-sizing: border-box;
}

.analytics-grid-2 {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 0.8fr);
  gap: 18px;
  margin-top: 18px;
  animation: fadeInSoft 0.55s ease-out forwards;
}

.analytics-card {
  background: #ffffff;
  border-radius: 20px;
  border: 1px solid #e2e8f0;
  padding: 16px 18px;
  box-shadow: 0 16px 36px rgba(15, 23, 42, 0.06);
}
.analytics-card-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}
.analytics-card-title span {
  font-size: 14px;
  font-weight: 900;
  color: #0f172a;
}

.analytics-bar-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 10px 0;
}
.analytics-bar-name {
  width: 180px;
  font-size: 12px;
  font-weight: 800;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.analytics-bar-track {
  flex: 1;
  height: 12px;
  border-radius: 999px;
  background: #e5e7eb;
  overflow: hidden;
}
.analytics-bar-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #60a5fa, #2563eb);
}
.analytics-bar-score {
  width: 44px;
  text-align: right;
  font-size: 12px;
  font-weight: 900;
  color: #0f172a;
}

.analytics-pie-wrap {
  display: flex;
  gap: 14px;
  align-items: center;
}
.analytics-legend {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.analytics-legend-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  color: #0f172a;
  font-weight: 800;
}
.analytics-legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
}
.analytics-muted {
  font-size: 12px;
  color: #64748b;
  line-height: 1.5;
}

@media (max-width: 980px) {
  .analytics-hero-content { padding: 0 22px; }
  .analytics-title { font-size: 30px; }
  .analytics-stats-grid { grid-template-columns: repeat(2, minmax(0,1fr)); }
  .analytics-grid-2 { grid-template-columns: minmax(0,1fr); }
  .analytics-bar-name { width: 140px; }
}
@media (max-width: 640px) {
  .analytics-hero { padding: 70px 0 60px; }
  .analytics-hero-content { flex-direction: column; align-items: flex-start; }
  .analytics-big-icon { width: 88px; height: 88px; font-size: 36px; }
  .analytics-title { font-size: 26px; }
  .analytics-stats-grid { grid-template-columns: minmax(0,1fr); }
  .analytics-main { padding: 0 14px; }
  .analytics-pie-wrap { flex-direction: column; align-items: flex-start; }
  .analytics-bar-name { width: 120px; }
}
`;

  const {
    kpis,
    allServicesBars,
    pieSegments,
    pieLegend,
    vendorName,
    companyName,
    city,
  } = useMemo(() => {
    const vendorServices = safeParse(localStorage.getItem(VENDOR_SERVICES_KEY) || "[]", []);
    const merged = mergeServices(servicesData, vendorServices);

    const allReq = safeParse(localStorage.getItem(CONTACT_KEY) || "[]", []);
    const allReviews = safeParse(localStorage.getItem(VENDOR_REVIEWS_KEY) || "[]", []);

    const sid = session.serviceId;

    const myReq = allReq
      .filter((r) => r.serviceId === sid || r.id === sid)
      .map((r) => ({ ...r, status: getRequestStatus(r) }));

    const myRev = allReviews.filter((r) => r.serviceId === sid);

    const total = myReq.length;
    const pending = myReq.filter((r) => r.status === "pending").length;
    const accepted = myReq.filter((r) => r.status === "accepted").length;
    const rejected = myReq.filter((r) => r.status === "rejected").length;

    const avgRating =
      myRev.length > 0
        ? myRev.reduce((sum, r) => sum + (Number(r.rating) || 0), 0) / myRev.length
        : null;

    const conversionRate = total > 0 ? Math.round((accepted / total) * 100) : 0;
    const responseRate = total > 0 ? Math.round(((accepted + rejected) / total) * 100) : 0;

    const ratingText = avgRating != null ? avgRating.toFixed(1) : "—";

    const kpiCards = [
      { key: "conv", icon: <FaCheckCircle />, value: `${conversionRate}%`, label: "CONVERSION", note: `Accepted ${accepted} / ${total || 0}` },
      { key: "resp", icon: <FaClock />, value: `${responseRate}%`, label: "RESPONSE", note: `Accepted+Rejected ${accepted + rejected}` },
      { key: "rate", icon: <FaStar />, value: ratingText, label: "AVG RATING", note: `${myRev.length} reviews` },
      { key: "pend", icon: <FaTimesCircle />, value: `${pending}`, label: "PENDING", note: `Total requests ${total}` },
    ];

    const scoreForService = (serviceId) => {
      const req = allReq
        .filter((r) => r.serviceId === serviceId || r.id === serviceId)
        .map((r) => ({ ...r, status: getRequestStatus(r) }));

      const rev = allReviews.filter((r) => r.serviceId === serviceId);

      const t = req.length || 0;
      const a = req.filter((r) => r.status === "accepted").length;
      const rej = req.filter((r) => r.status === "rejected").length;

      const conv = t ? (a / t) * 100 : 0;
      const resp = t ? ((a + rej) / t) * 100 : 0;

      const ar =
        rev.length > 0
          ? rev.reduce((sum, r) => sum + (Number(r.rating) || 0), 0) / rev.length
          : 0;

      const ratingPct = Math.max(0, Math.min(100, (ar / 5) * 100));
      const score = Math.round(conv * 0.45 + resp * 0.35 + ratingPct * 0.20);
      return { score, conv: Math.round(conv), resp: Math.round(resp), ar: rev.length ? ar : null, reviews: rev.length };
    };

    const bars = merged
      .map((s) => {
        const met = scoreForService(s.id);
        return {
          id: s.id,
          name: s.name || `Service ${s.id}`,
          score: met.score,
          isMine: s.id === sid,
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    allReviews.forEach((r) => {
      const x = Math.max(1, Math.min(5, Number(r.rating) || 0));
      dist[x] += 1;
    });

    const totalStars = Object.values(dist).reduce((s, x) => s + x, 0) || 1;

    const palette = {
      5: "#2563eb",
      4: "#60a5fa",
      3: "#93c5fd",
      2: "#f59e0b",
      1: "#ef4444",
    };

    const segments = buildPieSegments(dist, totalStars, palette);

    const legend = [5, 4, 3, 2, 1].map((k) => ({
      label: `${k} star`,
      count: dist[k],
      color: palette[k],
    }));

    const mineSvc =
      merged.find((x) => x.id === sid) || servicesData.find((x) => x.id === sid) || null;

    return {
      kpis: kpiCards,
      allServicesBars: bars,
      pieSegments: segments,
      pieLegend: legend,
      vendorName: session.vendorName || authUser.name || authUser.email || "Vendor",
      companyName: mineSvc?.name || "Your service",
      city: mineSvc?.location || "Your city",
    };
  }, [authUser, session]);

  return (
    <div className="analytics-page">
      <style>{styles}</style>

      <div className="analytics-hero">
        <div className="analytics-hero-content">
          <div className="analytics-hero-left">
            <div className="analytics-big-icon">
              <FaUserTie />
            </div>
            <div>
              <div className="analytics-title">Analytics overview</div>
              <div className="analytics-subtitle">
                {vendorName} managing <strong>{companyName}</strong> in {city}
              </div>
            </div>
          </div>

          <div className="analytics-hero-right">
            <button className="analytics-back-btn" type="button" onClick={() => navigate("/vendor/dashboard")}>
              <FaArrowLeft /> Back to dashboard
            </button>
            <div className="analytics-pill">
              <FaChartBar size={14} /> Performance analytics
            </div>
          </div>
        </div>
      </div>

      <div className="analytics-stats-strip">
        <div className="analytics-stats-grid">
          {kpis.map((k) => (
            <div key={k.key} className="analytics-stat-card">
              <div className="analytics-stat-top">
                <div className="analytics-stat-icon">{k.icon}</div>
                <div className="analytics-stat-value">{k.value}</div>
              </div>
              <div className="analytics-stat-label">{k.label}</div>
              <div className="analytics-stat-note">{k.note}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="analytics-main">
        <div className="analytics-grid-2">
          <div className="analytics-card">
            <div className="analytics-card-title">
              <span>Service performance (overall)</span>
              <span className="analytics-muted">Top services by score</span>
            </div>

            {allServicesBars.map((b) => (
              <div key={b.id} className="analytics-bar-row">
                <div className="analytics-bar-name" title={b.name}>
                  {b.isMine ? `⭐ ${b.name}` : b.name}
                </div>
                <div className="analytics-bar-track">
                  <div className="analytics-bar-fill" style={{ width: `${Math.max(0, Math.min(100, b.score))}%` }} />
                </div>
                <div className="analytics-bar-score">{b.score}</div>
              </div>
            ))}

            <div className="analytics-muted" style={{ marginTop: 10 }}>
              Score blends conversion, response, and ratings into a single 0–100 value.
            </div>
          </div>

          <div className="analytics-card">
            <div className="analytics-card-title">
              <span>Ratings pie (all services)</span>
              <span className="analytics-muted">Distribution</span>
            </div>

            <div className="analytics-pie-wrap">
              <PieChart size={160} segments={pieSegments} />
              <div className="analytics-legend">
                {pieLegend.map((x) => (
                  <div key={x.label} className="analytics-legend-item">
                    <span className="analytics-legend-dot" style={{ background: x.color }} />
                    <span>{x.label}</span>
                    <span style={{ marginLeft: "auto", color: "#64748b", fontWeight: 900 }}>{x.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="analytics-muted" style={{ marginTop: 12 }}>
              This pie updates automatically when new reviews are saved in localStorage.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function mergeServices(base, fromVendor) {
  const map = new Map();
  (Array.isArray(base) ? base : []).forEach((s) => {
    if (s && s.id != null) map.set(s.id, { ...s });
  });
  (Array.isArray(fromVendor) ? fromVendor : []).forEach((s) => {
    if (s && s.id != null) map.set(s.id, { ...(map.get(s.id) || {}), ...s });
  });
  return Array.from(map.values());
}

function buildPieSegments(dist, total, palette) {
  const order = [5, 4, 3, 2, 1];
  let start = 0;
  const segs = [];

  order.forEach((k) => {
    const count = dist[k] || 0;
    const frac = count / total;
    const angle = frac * Math.PI * 2;
    const end = start + angle;
    if (count > 0) {
      segs.push({ startAngle: start, endAngle: end, color: palette[k], label: `${k}` });
    }
    start = end;
  });

  if (segs.length === 0) {
    segs.push({ startAngle: 0, endAngle: Math.PI * 2, color: "#e5e7eb", label: "0" });
  }
  return segs;
}

function PieChart({ size = 160, segments = [] }) {
  const r = size / 2;
  const cx = r;
  const cy = r;
  const ir = r * 0.62;

  const arcs = segments.map((seg, i) => {
    const d = donutPath(cx, cy, r, ir, seg.startAngle, seg.endAngle);
    return <path key={i} d={d} fill={seg.color} />;
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {arcs}
      <circle cx={cx} cy={cy} r={ir} fill="#ffffff" />
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fontSize="12" fontWeight="900" fill="#0f172a">
        Ratings
      </text>
    </svg>
  );
}

function donutPath(cx, cy, rOuter, rInner, a0, a1) {
  const large = a1 - a0 > Math.PI ? 1 : 0;

  const x0 = cx + rOuter * Math.cos(a0 - Math.PI / 2);
  const y0 = cy + rOuter * Math.sin(a0 - Math.PI / 2);
  const x1 = cx + rOuter * Math.cos(a1 - Math.PI / 2);
  const y1 = cy + rOuter * Math.sin(a1 - Math.PI / 2);

  const xi0 = cx + rInner * Math.cos(a1 - Math.PI / 2);
  const yi0 = cy + rInner * Math.sin(a1 - Math.PI / 2);
  const xi1 = cx + rInner * Math.cos(a0 - Math.PI / 2);
  const yi1 = cy + rInner * Math.sin(a0 - Math.PI / 2);

  return [
    `M ${x0} ${y0}`,
    `A ${rOuter} ${rOuter} 0 ${large} 1 ${x1} ${y1}`,
    `L ${xi0} ${yi0}`,
    `A ${rInner} ${rInner} 0 ${large} 0 ${xi1} ${yi1}`,
    "Z",
  ].join(" ");
}