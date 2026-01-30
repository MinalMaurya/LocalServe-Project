import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaStar } from "react-icons/fa";

const VENDOR_REVIEWS_KEY = "local-service-discovery:vendor-reviews";

const safeParse = (raw, fallback) => {
  try {
    const v = JSON.parse(raw);
    return v ?? fallback;
  } catch {
    return fallback;
  }
};

const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const isAdmin = (u) => u && (u.role === "admin" || u.role === "Admin");

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

function Donut({ dist, size = 280, stroke = 22 }) {
  const segs = donutSegments(dist);
  const cx = size / 2;
  const cy = size / 2;
  const r = cx - stroke;
  const total = [1, 2, 3, 4, 5].reduce((s, k) => s + (dist[k] || 0), 0);

  return (
    <div
      style={{
        display: "flex",
        gap: 18,
        alignItems: "center",
        justifyContent: "center",
        flexWrap: "wrap",
      }}
    >
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
          y={cy - 6}
          textAnchor="middle"
          fontSize="22"
          fontWeight="900"
          fill="#0f172a"
        >
          {total || 0}
        </text>
        <text
          x={cx}
          y={cy + 18}
          textAnchor="middle"
          fontSize="12"
          fontWeight="800"
          fill="#64748b"
        >
          TOTAL REVIEWS
        </text>
      </svg>

      <div style={{ minWidth: 240 }}>
        {[5, 4, 3, 2, 1].map((k) => (
          <div
            key={k}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderRadius: 14,
              border: "1px solid #e2e8f0",
              padding: "10px 12px",
              background: "#fff",
              marginBottom: 10,
              boxShadow: "0 12px 28px rgba(15,23,42,0.06)",
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                fontWeight: 900,
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
            <span style={{ fontWeight: 900, color: "#64748b" }}>
              {dist[k] || 0}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminAnalyticsRatings() {
  const navigate = useNavigate();
  const authUser = safeParse(localStorage.getItem("authUser") || "null", null);

  if (!isAdmin(authUser)) {
    return (
      <div style={{ padding: 24 }}>
        <h2 style={{ marginBottom: 8 }}>Admin ratings analytics</h2>
        <p style={{ color: "#64748b" }}>Please login as admin.</p>
        <button onClick={() => navigate("/admin/login")}>Go to admin login</button>
      </div>
    );
  }

  const { dist, avg } = useMemo(() => {
    const allReviews = safeParse(
      localStorage.getItem(VENDOR_REVIEWS_KEY) || "[]",
      []
    );
    const d = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let sum = 0;
    let cnt = 0;

    allReviews.forEach((r) => {
      const x = clamp(Number(r.rating) || 0, 1, 5);
      d[x] += 1;
      sum += x;
      cnt += 1;
    });

    return { dist: d, avg: cnt ? sum / cnt : null };
  }, []);

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
            <FaArrowLeft /> Back
          </button>

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              color: "#0f172a",
              fontWeight: 900,
            }}
          >
            <FaStar /> Ratings analytics
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
            All-services rating pie
          </div>
          <div style={{ fontSize: 13, opacity: 0.92, marginTop: 4 }}>
            Avg rating {avg != null ? avg.toFixed(1) : "—"}
          </div>
        </div>

        <div
          style={{
            marginTop: 14,
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: 18,
            padding: 18,
            boxShadow: "0 14px 30px rgba(15,23,42,0.06)",
          }}
        >
          <Donut dist={dist} />
        </div>
      </div>
    </div>
  );
}