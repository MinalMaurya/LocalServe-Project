// src/components/vendors/VendorReviewsPage.js
import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  FaStar,
  FaRegStar,
  FaStarHalfAlt,
  FaUserCircle,
  FaClock,
  FaFilter,
  FaSortAmountDownAlt,
} from "react-icons/fa";

const VENDOR_SESSION_KEY = "local-service-discovery:vendor-session";
const VENDOR_REVIEWS_KEY = "local-service-discovery:vendor-reviews";
const LEGACY_REVIEWS_KEY = "local-service-discovery:reviews"; // old key (optional fallback)

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

export default function VendorReviewsPage() {
  const [session, setSession] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [starFilter, setStarFilter] = useState("all"); // "all" | "5" | "4"...
  const [sortOrder, setSortOrder] = useState("newest"); // "newest" | "oldest"

  /* 1) Load which vendor is logged in (same idea as dashboard) */
  useEffect(() => {
    try {
      const auth = JSON.parse(localStorage.getItem("authUser") || "null");
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

  /* 2) Load ONLY this vendor's reviews from localStorage */
  useEffect(() => {
    if (!session) {
      setReviews([]);
      return;
    }

    try {
      // primary: new vendor reviews key
      let stored =
        JSON.parse(localStorage.getItem(VENDOR_REVIEWS_KEY) || "[]") || [];

      // optional: fallback to legacy key if new one is empty
      if (!stored.length) {
        stored =
          JSON.parse(localStorage.getItem(LEGACY_REVIEWS_KEY) || "[]") || [];
      }

      const mine = stored
        .filter((r) => {
          // if review has serviceId, match with this vendor's service
          if (r.serviceId != null) {
            return r.serviceId === session.serviceId;
          }
          // if not, we keep it (legacy / demo) so the page is not empty
          return true;
        })
        .sort((a, b) => {
          const ta = new Date(
            a.createdAt || a.time || a.date || 0
          ).getTime();
          const tb = new Date(
            b.createdAt || b.time || b.date || 0
          ).getTime();
          return (tb || 0) - (ta || 0);
        });

      setReviews(mine);
    } catch {
      setReviews([]);
    }
  }, [session]);

  /* 3) Summary numbers */
  const totalReviews = reviews.length;

  const avgRating =
    totalReviews === 0
      ? 0
      : reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / totalReviews;

  const starCounts = useMemo(() => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => {
      const star = Math.round(r.rating || 0);
      if (counts[star] !== undefined) counts[star] += 1;
    });
    return counts;
  }, [reviews]);

  /* 4) Filter + sort list shown */
  const visibleReviews = useMemo(() => {
    let list = [...reviews];

    if (starFilter !== "all") {
      const s = Number(starFilter);
      list = list.filter((r) => Math.round(r.rating || 0) === s);
    }

    list.sort((a, b) => {
      const ta = new Date(
        a.createdAt || a.time || a.date || ""
      ).getTime();
      const tb = new Date(
        b.createdAt || b.time || b.date || ""
      ).getTime();
      if (sortOrder === "newest") return tb - ta;
      return ta - tb;
    });

    return list;
  }, [reviews, starFilter, sortOrder]);

  /* 5) Star renderer */
  const renderStars = (ratingValue) => {
    const rating = ratingValue || 0;
    const full = Math.floor(rating);
    const hasHalf = rating - full >= 0.5;
    const empty = 5 - full - (hasHalf ? 1 : 0);

    return (
      <>
        {Array.from({ length: full }).map((_, i) => (
          <FaStar key={`full-${i}`} className="star-full" />
        ))}
        {hasHalf && <FaStarHalfAlt className="star-full" />}
        {Array.from({ length: empty }).map((_, i) => (
          <FaRegStar key={`empty-${i}`} className="star-empty" />
        ))}
      </>
    );
  };

  return (
    <div className="vendor-reviews-page">
      <style>{`
        .vendor-reviews-page {
          min-height: 100vh;
          background: #f3f4f6;
        }

        /* shared hero like other pages */
        .page-hero {
           background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          padding: 56px 16px 72px;
          color: #fff;
        }

        .page-hero-inner {
          max-width: 1100px;
          margin: 0 auto;
          text-align: center;
        }

        .page-hero-title {
          font-size: 36px;
          font-weight: 800;
          letter-spacing: -0.03em;
          margin-bottom: 8px;
        }

        .page-hero-subtitle {
          font-size: 15px;
          opacity: 0.9;
        }

        .reviews-main {
          max-width: 1100px;
          margin: -40px auto 40px;
          padding: 0 16px 40px;
        }

        .reviews-summary-card {
          background: #ffffff;
          border-radius: 24px;
          padding: 28px 32px;
          box-shadow: 0 20px 50px rgba(15, 23, 42, 0.26);
          display: grid;
          grid-template-columns: minmax(0, 0.7fr) minmax(0, 1.3fr);
          gap: 32px;
        }

        .summary-left {
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .summary-score {
          font-size: 56px;
          font-weight: 800;
          line-height: 1;
          color: #0f172a;
        }

        .summary-stars {
          margin-top: 8px;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .star-full {
          color: #fbbf24;
          font-size: 22px;
        }

        .star-empty {
          color: #e5e7eb;
          font-size: 22px;
        }

        .summary-caption {
          margin-top: 4px;
          font-size: 13px;
          color: #6b7280;
        }

        .summary-total {
          margin-top: 6px;
          font-size: 13px;
          font-weight: 600;
          color: #4b5563;
        }

        .summary-bars {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .summary-row {
          display: grid;
          grid-template-columns: 40px 1fr 32px;
          align-items: center;
          font-size: 13px;
          color: #374151;
          gap: 12px;
        }

        .summary-row-label {
          display: flex;
          align-items: center;
          gap: 3px;
          justify-content: flex-start;
        }

        .summary-row-label span {
          font-weight: 600;
        }

        .summary-row-bar-bg {
          width: 100%;
          height: 8px;
          border-radius: 999px;
          background: #e5e7eb;
          overflow: hidden;
        }

        .summary-row-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #2563eb, #22c55e);
          border-radius: 999px;
          transition: width 0.35s ease;
        }

        .summary-row-count {
          text-align: right;
          font-size: 12px;
          color: #6b7280;
        }

        /* filters + list */
        .reviews-controls-row {
          margin-top: 28px;
          margin-bottom: 16px;
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          gap: 12px;
          align-items: center;
        }

        .reviews-filters {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 10px;
        }

        .filter-chip {
          border-radius: 999px;
          padding: 6px 13px;
          font-size: 13px;
          border: 1px solid #d1d5db;
          background: #ffffff;
          color: #374151;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s ease;
        }

        .filter-chip.active {
          background: #2563eb;
          border-color: #2563eb;
          color: #ffffff;
          box-shadow: 0 8px 18px rgba(37, 99, 235, 0.35);
        }

        .filter-chip:hover {
          transform: translateY(-1px);
          box-shadow: 0 10px 22px rgba(15, 23, 42, 0.12);
        }

        .reviews-sort {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: #4b5563;
        }

        .reviews-sort select {
          border-radius: 999px;
          border: 1px solid #d1d5db;
          padding: 6px 12px;
          font-size: 13px;
          background: #ffffff;
          outline: none;
        }

        .reviews-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
          margin-top: 8px;
        }

        .review-card {
          background: #ffffff;
          border-radius: 18px;
          padding: 16px 18px;
          box-shadow: 0 10px 25px rgba(15, 23, 42, 0.12);
          display: flex;
          flex-direction: column;
          gap: 8px;
          transition: transform 0.18s ease, box-shadow 0.18s ease;
        }

        .review-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 32px rgba(15, 23, 42, 0.18);
        }

        .review-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 10px;
        }

        .review-user {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .review-user-icon {
          width: 32px;
          height: 32px;
          border-radius: 999px;
          background: #e5f0ff;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #2563eb;
        }

        .review-user-meta {
          display: flex;
          flex-direction: column;
        }

        .review-user-name {
          font-size: 14px;
          font-weight: 600;
          color: #111827;
        }

        .review-service-name {
          font-size: 12px;
          color: #6b7280;
        }

        .review-stars {
          display: flex;
          align-items: center;
          gap: 2px;
        }

        .review-date {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          color: #6b7280;
        }

        .review-comment {
          font-size: 14px;
          color: #4b5563;
          line-height: 1.5;
        }

        .no-reviews-box {
          margin-top: 16px;
          padding: 20px;
          border-radius: 16px;
          background: #e5efff;
          color: #1e3a8a;
          font-size: 14px;
        }

        @media (max-width: 768px) {
          .reviews-summary-card {
            grid-template-columns: 1fr;
            padding: 22px 20px;
          }

          .page-hero-title {
            font-size: 28px;
          }

          .reviews-main {
            margin-top: -32px;
          }

          .review-card {
            padding: 14px 14px;
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
          <h1 className="page-hero-title">Reviews and ratings</h1>
          <p className="page-hero-subtitle">
            See how customers feel about your service and track your reputation
            over time.
          </p>
        </motion.div>
      </section>

      {/* MAIN CONTENT */}
      <div className="reviews-main">
        {/* SUMMARY CARD */}
        <motion.div
          className="reviews-summary-card"
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          transition={{ duration: 0.45, delay: 0.05 }}
        >
          <div className="summary-left">
            <div className="summary-score">{avgRating.toFixed(1)}</div>
            <div className="summary-stars">{renderStars(avgRating)}</div>
            <div className="summary-caption">Average rating out of 5</div>
            <div className="summary-total">
              {totalReviews} review{totalReviews !== 1 ? "s" : ""} in total
            </div>
          </div>

          <div className="summary-bars">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = starCounts[star] || 0;
              const pct =
                totalReviews === 0 ? 0 : Math.round((count / totalReviews) * 100);
              return (
                <div key={star} className="summary-row">
                  <div className="summary-row-label">
                    <span>{star}</span>★
                  </div>
                  <div className="summary-row-bar-bg">
                    <div
                      className="summary-row-bar-fill"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="summary-row-count">{count}</div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* FILTERS */}
        <motion.div
          className="reviews-controls-row"
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <div className="reviews-filters">
            <span
              className={`filter-chip ${starFilter === "all" ? "active" : ""}`}
              onClick={() => setStarFilter("all")}
            >
              <FaFilter />
              All ratings
            </span>
            {[5, 4, 3, 2, 1].map((star) => (
              <button
                key={star}
                type="button"
                className={`filter-chip ${
                  starFilter === String(star) ? "active" : ""
                }`}
                onClick={() => setStarFilter(String(star))}
              >
                {star}★
              </button>
            ))}
          </div>

          <div className="reviews-sort">
            <FaSortAmountDownAlt />
            <span>Sort:</span>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </div>
        </motion.div>

        {/* REVIEWS LIST */}
        <motion.div
          className="reviews-list"
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          transition={{ duration: 0.45, delay: 0.15 }}
        >
          {visibleReviews.length === 0 ? (
            <div className="no-reviews-box">
              You don’t have any reviews matching this filter yet. Ask customers
              to share their experience after a completed job.
            </div>
          ) : (
            visibleReviews.map((rev, idx) => {
              const rawDate =
                rev.createdAt || rev.time || rev.date || null;
              let formattedDate = "Recently";
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
                <div key={rev.id || idx} className="review-card">
                  <div className="review-card-header">
                    <div className="review-user">
                      <div className="review-user-icon">
                        <FaUserCircle />
                      </div>
                      <div className="review-user-meta">
                        <span className="review-user-name">
                          {reviewerName}
                        </span>
                        <span className="review-service-name">
                          {rev.serviceName || "Your service"}
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="review-stars">
                        {renderStars(rev.rating)}
                      </div>
                      <div className="review-date">
                        <FaClock />
                        <span>{formattedDate}</span>
                      </div>
                    </div>
                  </div>

                  {rev.comment && (
                    <p className="review-comment">“{rev.comment}”</p>
                  )}
                </div>
              );
            })
          )}
        </motion.div>
      </div>
    </div>
  );
}