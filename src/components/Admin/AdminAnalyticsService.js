import React, { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FaArrowLeft,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
} from "react-icons/fa";
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
const getRequestStatus = (r) =>
  (r.status || r.requestStatus || "pending").toLowerCase();
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

function donutSegments(dist) {
  const keys = [5, 4, 3, 2, 1];
  const total = keys.reduce((s, k) => s + (dist[k] || 0), 0) || 1;
  const colors = {
    5: "#22c55e",
    4: "#60a5fa",
    3: "#f59e0b",
    2: "#fb7185",
    1: "#ef4444",
  };
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
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={stroke}
        />
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
        <text
          x={cx}
          y={cy - 4}
          textAnchor="middle"
          fontSize="18"
          fontWeight="900"
          fill="#0f172a"
        >
          {total || 0}
        </text>
        <text
          x={cx}
          y={cy + 16}
          textAnchor="middle"
          fontSize="11"
          fontWeight="800"
          fill="#64748b"
        >
          REVIEWS
        </text>
      </svg>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          minWidth: 170,
        }}
      >
        {[5, 4, 3, 2, 1].map((k) => (
          <div
            key={k}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: 13,
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                fontWeight: 800,
                color: "#0f172a",
              }}
            >
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
            <span style={{ color: "#64748b", fontWeight: 900 }}>
              {dist[k] || 0}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Bar({ value, gradient }) {
  return (
    <div
      style={{
        width: "100%",
        height: 10,
        borderRadius: 999,
        background: "#e5e7eb",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${clamp(value, 0, 100)}%`,
          height: "100%",
          borderRadius: 999,
          background: gradient,
        }}
      />
    </div>
  );
}

function MetricRow({ label, value, icon }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        fontSize: 13,
      }}
    >
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          color: "#0f172a",
          fontWeight: 900,
        }}
      >
        <span style={{ color: "#2563eb" }}>{icon}</span> {label}
      </span>
      <span style={{ color: "#0f172a", fontWeight: 900 }}>{value}</span>
    </div>
  );
}

function Panel({ title, children }) {
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
      <div style={{ fontWeight: 900, color: "#0f172a", marginBottom: 10 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

export default function AdminAnalyticsService() {
  const navigate = useNavigate();
  const { id } = useParams();
  const serviceId = Number(id);

  const authUser = safeParse(localStorage.getItem("authUser") || "null", null);

  if (!isAdmin(authUser)) {
    return (
      <div style={{ padding: 24 }}>
        <h2 style={{ marginBottom: 8 }}>Admin analytics</h2>
        <p style={{ color: "#64748b" }}>Please login as admin.</p>
        <button onClick={() => navigate("/admin/login")}>
          Go to admin login
        </button>
      </div>
    );
  }

  const data = useMemo(() => {
    const allReq = safeParse(localStorage.getItem(CONTACT_KEY) || "[]", []);
    const allReviews = safeParse(
      localStorage.getItem(VENDOR_REVIEWS_KEY) || "[]",
      []
    );
    const published = safeParse(
      localStorage.getItem(VENDOR_SERVICES_KEY) || "[]",
      []
    );

    const name =
      published.find((p) => p?.id === serviceId)?.name ||
      servicesData.find((s) => s?.id === serviceId)?.name ||
      `Service ${serviceId}`;

    const req = allReq
      .filter((r) => r.serviceId === serviceId || r.id === serviceId)
      .map((r) => ({ ...r, status: getRequestStatus(r) }));

    const rev = allReviews.filter((r) => r.serviceId === serviceId);

    const total = req.length;
    const pending = req.filter((r) => r.status === "pending").length;
    const accepted = req.filter((r) => r.status === "accepted").length;
    const rejected = req.filter((r) => r.status === "rejected").length;

    const avgRating =
      rev.length > 0
        ? rev.reduce((sum, r) => sum + (Number(r.rating) || 0), 0) / rev.length
        : null;

    const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    rev.forEach((r) => {
      const x = clamp(Number(r.rating) || 0, 1, 5);
      dist[x] += 1;
    });

    const conversionRate = total > 0 ? Math.round((accepted / total) * 100) : 0;
    const responseRate =
      total > 0 ? Math.round(((accepted + rejected) / total) * 100) : 0;
    const pendingShare = total > 0 ? Math.round((pending / total) * 100) : 0;

    return {
      name,
      total,
      pending,
      accepted,
      rejected,
      conversionRate,
      responseRate,
      pendingShare,
      avgRating,
      reviewCount: rev.length,
      ratingsDist: dist,
    };
  }, [serviceId]);

  return (
    <div
      style={{
        padding: 24,
        minHeight: "70vh",
        background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
      }}
    >
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
          }}
        >
          <button
            onClick={() => navigate("/admin/analytics")}
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
            <FaArrowLeft /> Back to overview
          </button>

          <div style={{ color: "#0f172a", fontWeight: 900, fontSize: 14 }}>
            {data.name} (ID: {serviceId})
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
          <div style={{ fontSize: 18, fontWeight: 900 }}>
            Service performance
          </div>
          <div style={{ fontSize: 13, opacity: 0.92, marginTop: 4 }}>
            Conversion {data.conversionRate}% • Response {data.responseRate}% •
            Avg rating {data.avgRating != null ? data.avgRating.toFixed(1) : "—"}
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0,1fr))",
            gap: 14,
            marginTop: 14,
          }}
        >
          <Panel title="Requests breakdown">
            <MetricRow
              label="Pending"
              value={`${data.pending} / ${data.total}`}
              icon={<FaClock />}
            />
            <Bar
              value={data.pendingShare}
              gradient={"linear-gradient(90deg, #f97316, #ea580c)"}
            />
            <div style={{ height: 10 }} />
            <MetricRow
              label="Accepted"
              value={`${data.accepted}`}
              icon={<FaCheckCircle />}
            />
            <Bar
              value={data.conversionRate}
              gradient={"linear-gradient(90deg, #4ade80, #22c55e)"}
            />
            <div style={{ height: 10 }} />
            <MetricRow
              label="Rejected"
              value={`${data.rejected}`}
              icon={<FaTimesCircle />}
            />
            <Bar
              value={data.total ? Math.round((data.rejected / data.total) * 100) : 0}
              gradient={"linear-gradient(90deg, #fb7185, #ef4444)"}
            />
          </Panel>

          <Panel title="Ratings (this service)">
            <Donut dist={data.ratingsDist} />
            <div style={{ marginTop: 10, fontSize: 12, color: "#64748b" }}>
              {data.reviewCount === 0
                ? "No reviews yet."
                : `${data.reviewCount} reviews • Avg ${
                    data.avgRating != null ? data.avgRating.toFixed(1) : "—"
                  }`}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}