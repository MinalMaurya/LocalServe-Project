import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaChartBar, FaStar, FaCheckCircle, FaTimesCircle, FaClock } from "react-icons/fa";
import servicesData from "../../data/services.json";

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

const isAdmin = (u) => u && (u.role === "admin" || u.role === "Admin");
const getRequestStatus = (r) => (r.status || r.requestStatus || "pending").toLowerCase();
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

const scoreFor = ({ conversionRate, responseRate, avgRating, pendingShare }) => {
  const ratingScore = avgRating == null ? 0 : (clamp(avgRating, 0, 5) / 5) * 100;
  const workloadScore = 100 - clamp(pendingShare, 0, 100);
  const s = 0.38 * conversionRate + 0.28 * responseRate + 0.22 * ratingScore + 0.12 * workloadScore;
  return Math.round(clamp(s, 0, 100));
};

function donutSegments(dist) {
  const keys = [5, 4, 3, 2, 1];
  const total = keys.reduce((s, k) => s + (dist[k] || 0), 0) || 1;
  const colors = { 5: "#22c55e", 4: "#60a5fa", 3: "#f59e0b", 2: "#fb7185", 1: "#ef4444" };
  let acc = 0;
  return keys.map((k) => {
    const v = dist[k] || 0;
    const start = acc / total;
    acc += v;
    const end = acc / total;
    return { k, v, start, end, color: colors[k] };
  });
}

function arcPath(cx, cy, r, start, end) {
  const a0 = start * Math.PI * 2 - Math.PI / 2;
  const a1 = end * Math.PI * 2 - Math.PI / 2;
  const x0 = cx + r * Math.cos(a0);
  const y0 = cy + r * Math.sin(a0);
  const x1 = cx + r * Math.cos(a1);
  const y1 = cy + r * Math.sin(a1);
  const large = end - start > 0.5 ? 1 : 0;
  return `M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1}`;
}

function Donut({ dist, size = 220, stroke = 18 }) {
  const segs = donutSegments(dist);
  const cx = size / 2;
  const cy = size / 2;
  const r = cx - stroke;
  const total = [1, 2, 3, 4, 5].reduce((s, k) => s + (dist[k] || 0), 0);

  return (
    <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
      <svg width={size} height={size} style={{ display: "block" }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e5e7eb" strokeWidth={stroke} />
        {segs.map((s) => (
          <path
            key={s.k}
            d={arcPath(cx, cy, r, s.start, s.end)}
            fill="none"
            stroke={s.color}
            strokeWidth={stroke}
            strokeLinecap="round"
          />
        ))}
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize="18" fontWeight="900" fill="#0f172a">
          {total || 0}
        </text>
        <text x={cx} y={cy + 16} textAnchor="middle" fontSize="11" fontWeight="800" fill="#64748b">
          REVIEWS
        </text>
      </svg>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 170 }}>
        {[5, 4, 3, 2, 1].map((k) => (
          <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontWeight: 800, color: "#0f172a" }}>
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 999,
                  background: donutSegments(dist).find((x) => x.k === k)?.color,
                }}
              />
              {k} star
            </span>
            <span style={{ color: "#64748b", fontWeight: 900 }}>{dist[k] || 0}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BarList({ items, onPick }) {
  const max = Math.max(1, ...items.map((x) => x.value));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {items.map((it) => {
        const pct = Math.round((it.value / max) * 100);
        return (
          <div
            key={it.id}
            onClick={() => onPick(it)}
            style={{
              cursor: "pointer",
              borderRadius: 14,
              border: "1px solid #e2e8f0",
              padding: 12,
              background: "#f9fafb",
              transition: "transform 0.18s ease, box-shadow 0.18s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 12px 30px rgba(15,23,42,0.10)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0px)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <div style={{ fontWeight: 900, color: "#0f172a", fontSize: 13 }}>{it.label}</div>
              <div style={{ fontWeight: 900, color: "#2563eb" }}>{it.value}</div>
            </div>
            <div style={{ marginTop: 8, width: "100%", height: 10, borderRadius: 999, background: "#e5e7eb", overflow: "hidden" }}>
              <div
                style={{
                  width: `${pct}%`,
                  height: "100%",
                  borderRadius: 999,
                  background: "linear-gradient(90deg, #60a5fa, #2563eb)",
                }}
              />
            </div>
            <div style={{ marginTop: 8, fontSize: 12, color: "#64748b" }}>{it.meta}</div>
          </div>
        );
      })}
    </div>
  );
}

function KpiCard({ icon, title, subtitle, note }) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: 18,
        padding: 14,
        boxShadow: "0 14px 30px rgba(15,23,42,0.06)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#eff6ff",
            color: "#2563eb",
            fontSize: 18,
          }}
        >
          {icon}
        </div>
        <div>
          <div style={{ fontSize: 26, fontWeight: 900, color: "#0f172a", lineHeight: 1.1 }}>{title}</div>
          <div style={{ fontSize: 12, fontWeight: 800, color: "#64748b", letterSpacing: "0.08em" }}>
            {subtitle.toUpperCase()}
          </div>
        </div>
      </div>
      <div style={{ marginTop: 10, fontSize: 12, color: "#64748b" }}>{note}</div>
    </div>
  );
}

function Panel({ title, right, onClick, children }) {
  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (!onClick) return;
        if (e.key === "Enter" || e.key === " ") onClick();
      }}
      style={{
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: 18,
        padding: 14,
        boxShadow: "0 14px 30px rgba(15,23,42,0.06)",
        cursor: onClick ? "pointer" : "default",
        transition: "transform 0.18s ease, box-shadow 0.18s ease",
      }}
      onMouseEnter={(e) => {
        if (!onClick) return;
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 18px 44px rgba(15,23,42,0.10)";
      }}
      onMouseLeave={(e) => {
        if (!onClick) return;
        e.currentTarget.style.transform = "translateY(0px)";
        e.currentTarget.style.boxShadow = "0 14px 30px rgba(15,23,42,0.06)";
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 10 }}>
        <div style={{ fontWeight: 900, color: "#0f172a" }}>{title}</div>
        {right}
      </div>
      {children}
    </div>
  );
}

export default function AdminAnalyticsOverview() {
  const navigate = useNavigate();
  const authUser = safeParse(localStorage.getItem("authUser") || "null", null);

  if (!isAdmin(authUser)) {
    return (
      <div style={{ padding: 24 }}>
        <h2 style={{ marginBottom: 8 }}>Admin analytics</h2>
        <p style={{ color: "#64748b" }}>Please login as admin.</p>
        <button onClick={() => navigate("/admin/login")}>Go to admin login</button>
      </div>
    );
  }

  const { serviceRows, overall, overallRatingsDist } = useMemo(() => {
    const allReq = safeParse(localStorage.getItem(CONTACT_KEY) || "[]", []);
    const allReviews = safeParse(localStorage.getItem(VENDOR_REVIEWS_KEY) || "[]", []);
    const published = safeParse(localStorage.getItem(VENDOR_SERVICES_KEY) || "[]", []);

    const idsFromPublished = published.map((x) => x?.id).filter((x) => x != null);
    const idsFromJson = (servicesData || []).map((s) => s?.id).filter((x) => x != null);
    const allIds = Array.from(new Set([...idsFromJson, ...idsFromPublished])).slice(0, 200);

    const ratingDistAll = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    const rows = allIds.map((id) => {
      const req = allReq
        .filter((r) => r.serviceId === id || r.id === id)
        .map((r) => ({ ...r, status: getRequestStatus(r) }));

      const rev = allReviews.filter((r) => r.serviceId === id);

      const total = req.length;
      const pending = req.filter((r) => r.status === "pending").length;
      const accepted = req.filter((r) => r.status === "accepted").length;
      const rejected = req.filter((r) => r.status === "rejected").length;

      const avgRating = rev.length > 0 ? rev.reduce((sum, r) => sum + (Number(r.rating) || 0), 0) / rev.length : null;

      const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      rev.forEach((r) => {
        const x = clamp(Number(r.rating) || 0, 1, 5);
        dist[x] += 1;
        ratingDistAll[x] += 1;
      });

      const conversionRate = total > 0 ? Math.round((accepted / total) * 100) : 0;
      const responseRate = total > 0 ? Math.round(((accepted + rejected) / total) * 100) : 0;
      const pendingShare = total > 0 ? Math.round((pending / total) * 100) : 0;

      const score = scoreFor({ conversionRate, responseRate, avgRating, pendingShare });

      const name =
        published.find((p) => p?.id === id)?.name ||
        servicesData.find((s) => s?.id === id)?.name ||
        `Service ${id}`;

      return {
        id,
        name,
        total,
        pending,
        accepted,
        rejected,
        avgRating,
        reviewCount: rev.length,
        conversionRate,
        responseRate,
        pendingShare,
        score,
        ratingsDist: dist,
      };
    });

    const rowsNonEmpty = rows.filter((r) => r.total > 0 || r.reviewCount > 0);

    const overallTotalReq = rowsNonEmpty.reduce((s, r) => s + r.total, 0);
    const overallAccepted = rowsNonEmpty.reduce((s, r) => s + r.accepted, 0);
    const overallRejected = rowsNonEmpty.reduce((s, r) => s + r.rejected, 0);
    const overallPending = rowsNonEmpty.reduce((s, r) => s + r.pending, 0);

    const allReviewsCount = rowsNonEmpty.reduce((s, r) => s + r.reviewCount, 0);
    const ratingSum = rowsNonEmpty.reduce((s, r) => s + (r.avgRating != null ? r.avgRating * r.reviewCount : 0), 0);
    const overallAvgRating = allReviewsCount > 0 ? ratingSum / allReviewsCount : null;

    const overallConversion = overallTotalReq > 0 ? Math.round((overallAccepted / overallTotalReq) * 100) : 0;
    const overallResponse = overallTotalReq > 0 ? Math.round(((overallAccepted + overallRejected) / overallTotalReq) * 100) : 0;

    return {
      serviceRows: rowsNonEmpty.sort((a, b) => b.score - a.score),
      overall: {
        total: overallTotalReq,
        accepted: overallAccepted,
        rejected: overallRejected,
        pending: overallPending,
        conversionRate: overallConversion,
        responseRate: overallResponse,
        avgRating: overallAvgRating,
        reviewCount: allReviewsCount,
      },
      overallRatingsDist: ratingDistAll,
    };
  }, []);

  const barItems = serviceRows.map((r) => ({
    id: r.id,
    label: r.name,
    value: r.score,
    meta: `Score: ${r.score} • Conv ${r.conversionRate}% • Resp ${r.responseRate}% • Rating ${r.avgRating != null ? r.avgRating.toFixed(1) : "—"}`,
  }));

  return (
    <div style={{ padding: 24, minHeight: "70vh", background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)" }}>
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => navigate("/admin/services")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              border: "1px solid #e2e8f0",
              background: "#fff",
              padding: "10px 14px",
              borderRadius: 12,
              cursor: "pointer",
              fontWeight: 800,
            }}
          >
            <FaArrowLeft /> Back
          </button>

          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, color: "#0f172a", fontWeight: 900 }}>
            <FaChartBar /> Performance analytics
          </div>
        </div>

        <div
          style={{
            marginTop: 18,
            borderRadius: 18,
            padding: 18,
            background: "linear-gradient(135deg, #2563eb, #3b82f6)",
            color: "#fff",
            boxShadow: "0 18px 45px rgba(15,23,42,0.18)",
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 900 }}>Analytics overview</div>
          <div style={{ fontSize: 13, opacity: 0.92, marginTop: 4 }}>
            KPIs + charts from requests and reviews (localStorage).
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 14, marginTop: 16 }}>
          <KpiCard icon={<FaCheckCircle />} title={`${overall.conversionRate}%`} subtitle="Conversion" note={`Accepted ${overall.accepted} / ${overall.total}`} />
          <KpiCard icon={<FaClock />} title={`${overall.responseRate}%`} subtitle="Response" note={`Accepted+Rejected ${overall.accepted + overall.rejected}`} />
          <KpiCard icon={<FaStar />} title={overall.avgRating != null ? overall.avgRating.toFixed(1) : "—"} subtitle="Avg rating" note={`${overall.reviewCount} reviews`} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 14, marginTop: 14 }}>
          <Panel title="Service performance (score)" right={<span style={{ fontSize: 12, fontWeight: 900, color: "#2563eb" }}>Click a row</span>}>
            {barItems.length === 0 ? (
              <div style={{ fontSize: 13, color: "#64748b" }}>No service activity yet.</div>
            ) : (
              <BarList items={barItems} onPick={(it) => navigate(`/admin/analytics/service/${it.id}`)} />
            )}
          </Panel>

          <Panel title="Ratings distribution (all services)" right={<span style={{ fontSize: 12, fontWeight: 900, color: "#2563eb" }}>Open</span>} onClick={() => navigate("/admin/analytics/ratings")}>
            <Donut dist={overallRatingsDist} />
            <div style={{ marginTop: 10, fontSize: 12, color: "#64748b" }}>Tap to view full ratings pie and totals.</div>
          </Panel>
        </div>
      </div>
    </div>
  );
}