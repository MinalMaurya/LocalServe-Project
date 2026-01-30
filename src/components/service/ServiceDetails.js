import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { summarizeReviews } from "../../utils/reviewInsights";
import {
  FaArrowLeft,
  FaMapMarkerAlt,
  FaHeart,
  FaRegHeart,
  FaTag,
  FaClock,
  FaStar,
} from "react-icons/fa";

import { useServiceDiscovery } from "../../hooks/useServiceDiscovery";
import ServiceReviewForm from "../service/ServiceReviewForm";

const CONTACT_KEY = "local-service-discovery:contact-requests";
const REVIEWS_KEY = "local-service-discovery:vendor-reviews";
const VENDOR_IMAGES_KEY = "local-service-discovery:vendor-service-images";

const getVendorImages = (serviceId) => {
  try {
    const store = JSON.parse(localStorage.getItem(VENDOR_IMAGES_KEY) || "{}");
    const arr = store?.[String(serviceId)];
    if (!Array.isArray(arr)) return [];
    return arr.filter(Boolean);
  } catch {
    return [];
  }
};

export default function ServiceDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  const preloadedService = location.state?.service || null;

  const { services, favoriteIds, toggleFavorite } = useServiceDiscovery();

  const authUser = JSON.parse(localStorage.getItem("authUser") || "null");
  const userId = authUser?.id || authUser?.email || null;

  const service =
    preloadedService || services.find((s) => String(s.id) === String(id));

  const [urgency, setUrgency] = useState("Normal");
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTime, setPreferredTime] = useState("Flexible / Anytime");
  const [message, setMessage] = useState("");
  const [submitStatus, setSubmitStatus] = useState(null);

  const [serviceReviews, setServiceReviews] = useState([]);
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editDrafts, setEditDrafts] = useState({});

  const reviewSummary = useMemo(
    () => summarizeReviews(serviceReviews),
    [serviceReviews]
  );

  const [sentimentFilter, setSentimentFilter] = useState("all");

  const reviewsForRender = useMemo(() => {
    const sorted = serviceReviews
      .slice()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    if (sentimentFilter === "all") return sorted;

    return sorted.filter((r) => {
      const meta = reviewSummary.byReviewId?.[String(r.id)];
      return meta?.sentiment === sentimentFilter;
    });
  }, [serviceReviews, sentimentFilter, reviewSummary]);

  useEffect(() => {
    if (!service) {
      setServiceReviews([]);
      return;
    }
    try {
      const all = JSON.parse(localStorage.getItem(REVIEWS_KEY) || "[]");
      const filtered = all.filter(
        (r) => String(r.serviceId) === String(service.id)
      );
      setServiceReviews(filtered);
    } catch {
      setServiceReviews([]);
    }
  }, [service]);

  const handleReviewsUpdated = (allUpdatedReviews) => {
    if (!service) return;
    const onlyThisService = allUpdatedReviews.filter(
      (r) => String(r.serviceId) === String(service.id)
    );
    setServiceReviews(onlyThisService);
  };

  const startInlineEdit = (rev) => {
    setEditingReviewId(rev.id);
    setEditDrafts((prev) => ({
      ...prev,
      [rev.id]: {
        rating: rev.rating || 0,
        hover: 0,
        text: rev.text || "",
      },
    }));
  };

  const cancelInlineEdit = (reviewId) => {
    setEditingReviewId(null);
    setEditDrafts((prev) => {
      const copy = { ...prev };
      delete copy[reviewId];
      return copy;
    });
  };

  const saveInlineEdit = (reviewId) => {
    if (!service) return;

    const draft = editDrafts[reviewId];
    if (!draft) return;

    if (!draft.rating) {
      alert("Please select a rating.");
      return;
    }
    if (!draft.text.trim()) {
      alert("Please write a review.");
      return;
    }

    try {
      const all = JSON.parse(localStorage.getItem(REVIEWS_KEY) || "[]") || [];
      const now = new Date();
      const nowIso = now.toISOString();

      const updatedAll = all.map((r) => {
        if (String(r.id) !== String(reviewId)) return r;

        return {
          ...r,
          rating: draft.rating,
          text: draft.text.trim(),
          updatedAt: nowIso,
          readableDate: now.toLocaleString(),
          date: now.toLocaleDateString(),
        };
      });

      localStorage.setItem(REVIEWS_KEY, JSON.stringify(updatedAll));
      handleReviewsUpdated(updatedAll);
      cancelInlineEdit(reviewId);
    } catch {
      // ignore
    }
  };

  const handleDeleteMyReview = (reviewId) => {
    if (!service) return;

    const ok = window.confirm("Delete this review?");
    if (!ok) return;

    try {
      const all = JSON.parse(localStorage.getItem(REVIEWS_KEY) || "[]") || [];
      const updated = all.filter((r) => String(r.id) !== String(reviewId));

      localStorage.setItem(REVIEWS_KEY, JSON.stringify(updated));

      setEditingReviewId((cur) =>
        String(cur) === String(reviewId) ? null : cur
      );
      setEditDrafts((prev) => {
        const copy = { ...prev };
        delete copy[reviewId];
        return copy;
      });

      handleReviewsUpdated(updated);
    } catch {
      // ignore
    }
  };

  // rating summary (your original)
  let avgRatingNumber = 0;
  if (serviceReviews.length > 0) {
    avgRatingNumber =
      serviceReviews.reduce((sum, r) => sum + (r.rating || 0), 0) /
      serviceReviews.length;
  }
  const avgRating = serviceReviews.length > 0 ? avgRatingNumber.toFixed(1) : "—";

  const allRequests = JSON.parse(localStorage.getItem(CONTACT_KEY) || "[]");

  const lastRequest = service
    ? [...allRequests]
        .reverse()
        .find(
          (r) =>
            String(r.serviceId) === String(service.id) &&
            (!userId || String(r.customerId) === String(userId))
        )
    : null;

  const isFavorite = service ? favoriteIds.includes(service.id) : false;

  const fadeInUp = {
    hidden: { opacity: 0, y: 18 },
    visible: { opacity: 1, y: 0 },
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();

    if (!authUser) {
      setSubmitStatus("error");
      return;
    }
    if (!service) return;

    const now = new Date().toISOString();

    const newReq = {
      id: `${service.id}-${now}`,
      serviceId: service.id,
      serviceName: service.name,
      vendorId: service.vendorId,
      vendorName: service.vendorName,
      customerId: userId,
      customerName: authUser.name || authUser.email || "You",
      urgency,
      preferredDate: preferredDate || null,
      preferredTime,
      message: message.trim() || "No additional details provided.",
      createdAt: now,
      status: "Pending",
      requestStatus: "Pending",
      location: service.location,
      category: service.category,
    };

    const updated = [...allRequests, newReq];
    localStorage.setItem(CONTACT_KEY, JSON.stringify(updated));
    setSubmitStatus("success");
  };

  if (!service) {
    return null;
  }

  const defaultImages = [
    "https://img.freepik.com/free-photo/man-doing-professional-home-cleaning-service_23-2150359014.jpg",
    "https://homeguruworld.com/wp-content/uploads/2022/12/home-tutor-Bangalore.png",
    "https://content.jdmagicbox.com/v2/comp/pune/w1/020pxx20.xx20.200721204059.w7w1/catalogue/electrician-near-me-kalyani-nagar-pune-electricians-kjdnhfawxi.jpg",
  ];

  const uploaded = getVendorImages(service.id);

  const imagesForCarousel =
    uploaded.length > 0
      ? uploaded
      : Array.isArray(service.images) && service.images.length > 0
      ? service.images
      : defaultImages;

  const carouselId = `service-carousel-${service.id}`;

  // Trust badge styles
  const trustTone = reviewSummary.trust?.tone || "neutral";
  const trustBg =
    trustTone === "positive"
      ? "#dcfce7"
      : trustTone === "negative"
      ? "#fee2e2"
      : "#eef2ff";
  const trustColor =
    trustTone === "positive"
      ? "#166534"
      : trustTone === "negative"
      ? "#b91c1c"
      : "#3730a3";

  return (
    <main className="service-detail-page">
      <style>{`
        .service-detail-page {
          background: #f5f7fb;
          min-height: 100vh;
        }
        .service-detail-hero {
          width: 100%;
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          color: #ffffff;
          padding: 52px 0 115px;
        }
        .service-detail-hero-inner {
          max-width: 1120px;
          margin: 0 auto;
          padding: 0 24px;
        }
        .hero-back-row {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 14px;
          margin-bottom: 18px;
          cursor: pointer;
          color: rgba(255,255,255,0.9);
        }
        .hero-back-row:hover {
          text-decoration: underline;
        }
        .hero-kicker {
          text-transform: uppercase;
          letter-spacing: 0.12em;
          font-size: 12px;
          font-weight: 700;
          color: #dbeafe;
          margin-bottom: 8px;
        }
        .hero-title {
          font-size: 28px;
          font-weight: 800;
          color: #ffffff;
          margin-bottom: 6px;
        }
        .hero-meta {
          font-size: 14px;
          color: #e5edff;
          max-width: 520px;
        }
        .service-detail-layout {
          max-width: 1120px;
          margin: -78px auto 32px;
          padding: 26px 26px 28px;
          border-radius: 28px;
          background: #ffffff;
          box-shadow: 0 18px 40px rgba(15, 23, 42, 0.18);
          display: grid;
          grid-template-columns: minmax(0, 2fr) minmax(0, 1.15fr);
          gap: 30px;
        }
        .service-detail-main {
          min-width: 0;
        }
        .service-detail-header-row {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          align-items: flex-start;
          margin-bottom: 18px;
        }
        .service-detail-name {
          font-size: 26px;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 4px;
        }
        .service-detail-location {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
          color: #475569;
        }
        .service-detail-chip-row {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 12px;
        }
        .service-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border-radius: 999px;
          padding: 6px 12px;
          font-size: 12px;
          font-weight: 600;
        }
        .service-chip-category {
          background: #eef2ff;
          color: #4338ca;
        }
        .service-chip-status {
          background: #ecfdf5;
          color: #16a34a;
        }
        .favorite-button {
          width: 40px;
          height: 40px;
          border-radius: 999px;
          border: none;
          background: #eff6ff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 20px;
          color: #ef4444;
          box-shadow: 0 8px 18px rgba(15,23,42,0.12);
        }
        .favorite-button:hover {
          transform: translateY(-1px);
        }
        .rating-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          padding: 12px 18px;
          margin-bottom: 24px;
          background: #f8fafc;
          font-size: 14px;
        }
        .rating-main-value {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 4px;
        }
        .rating-score {
          font-size: 20px;
          font-weight: 800;
          color: #0f172a;
        }
        .rating-out-of {
          font-size: 13px;
          color: #64748b;
        }
        .rating-stars-row {
          display: flex;
          gap: 4px;
          margin-top: 2px;
          font-size: 16px;
        }
        .rating-star-icon-active {
          color: #facc15;
        }
        .rating-star-icon-inactive {
          color: #e2e8f0;
        }
        .rating-label {
          font-size: 13px;
          color: #64748b;
        }
        .section-title {
          font-size: 18px;
          font-weight: 800;
          margin-bottom: 8px;
          color: #0f172a;
        }
        .section-body {
          font-size: 14px;
          color: #475569;
          line-height: 1.6;
        }
        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit,minmax(220px,1fr));
          gap: 8px 20px;
          margin-top: 12px;
        }
        .feature-item {
          font-size: 14px;
          color: #111827;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .feature-dot {
          width: 6px;
          height: 6px;
          border-radius: 999px;
          background: #22c55e;
        }
        .booking-panel {
          border-radius: 24px;
          border: 1px solid #e2e8f0;
          padding: 20px 20px 22px;
          background: #f9fafb;
        }
        .booking-title {
          font-size: 18px;
          font-weight: 800;
          margin-bottom: 4px;
          color: #0f172a;
        }
        .booking-subtitle {
          font-size: 13px;
          color: #64748b;
          margin-bottom: 14px;
        }
        .form-group {
          margin-bottom: 12px;
        }
        .form-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 700;
          color: #0f172a;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin-bottom: 5px;
        }
        .form-label span {
          font-size: 14px;
        }
        .form-control {
          width: 100%;
          border-radius: 12px;
          border: 1px solid #cbd5e1;
          font-size: 14px;
          padding: 8px 10px;
          outline: none;
        }
        .form-control:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 1px rgba(37,99,235,0.25);
        }
        .booking-helper {
          font-size: 11px;
          color: #94a3b8;
          margin-top: 3px;
        }
        .booking-primary-btn {
          width: 100%;
          margin-top: 10px;
          border: none;
          border-radius: 999px;
          padding: 10px 14px;
          background: linear-gradient(135deg,#2563eb 0%,#1d4ed8 100%);
          color: #ffffff;
          font-weight: 700;
          font-size: 15px;
          cursor: pointer;
          box-shadow: 0 12px 24px rgba(37,99,235,0.35);
        }
        .booking-secondary-btn {
          width: 100%;
          margin-top: 8px;
          border-radius: 999px;
          border: 1px solid #e2e8f0;
          padding: 9px 14px;
          background: #ffffff;
          font-size: 14px;
          font-weight: 600;
          color: #111827;
          cursor: pointer;
        }
        .booking-status {
          margin-top: 8px;
          font-size: 13px;
        }
        .booking-status-success {
          color: #16a34a;
        }
        .booking-status-error {
          color: #b91c1c;
        }
        .last-request-card {
          margin-top: 16px;
          border-radius: 18px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          padding: 14px 14px 16px;
          font-size: 13px;
        }
        .last-request-title {
          font-weight: 700;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .last-request-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 4px;
        }
        .last-request-label {
          color: #64748b;
        }
        .last-request-value {
          color: #111827;
          text-align: right;
        }
        .service-detail-reviews-section {
          max-width: 1120px;
          margin: 0 auto 40px;
          padding: 0 24px;
        }
        .service-reviews-list {
          margin-top: 8px;
        }
        .reviews-list-title {
          font-size: 16px;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 12px;
        }
        .review-item-card {
          background: #ffffff;
          border-radius: 18px;
          padding: 14px 16px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 8px 18px rgba(15,23,42,0.04);
          margin-bottom: 10px;
        }
        .review-item-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
        }
        .reviewer-name {
          font-weight: 600;
          color: #0f172a;
        }
        .review-date {
          font-size: 12px;
          color: #9ca3af;
        }
        .review-stars-row {
          display: flex;
          gap: 4px;
          font-size: 14px;
          margin-bottom: 4px;
        }
        .review-text {
          font-size: 14px;
          color: #4b5563;
          line-height: 1.5;
        }
        @media (max-width: 900px) {
          .service-detail-hero {
            padding: 40px 0 90px;
          }
          .service-detail-layout {
            grid-template-columns: 1fr;
            margin: -70px 16px 24px;
            padding: 18px 18px 20px;
          }
        }
        .review-edit-box {
          margin-top: 10px;
          border-top: 1px dashed #e2e8f0;
          padding-top: 10px;
        }
        .review-edit-textarea {
          width: 100%;
          border-radius: 14px;
          border: 1px solid #cbd5e1;
          padding: 10px 12px;
          min-height: 70px;
          font-size: 14px;
          outline: none;
        }
        .review-edit-textarea:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 1px rgba(37, 99, 235, 0.25);
        }
        .review-edit-actions {
          margin-top: 10px;
          display: flex;
          justify-content: flex-end;
          gap: 8px;
        }
        .review-pill-btn {
          border-radius: 999px;
          padding: 6px 12px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          background: #fff;
          border: 1px solid #e2e8f0;
        }
        .review-pill-btn-primary {
          background: linear-gradient(135deg,#2563eb,#1d4ed8);
          color: #fff;
          border: none;
        }
        .review-pill-btn-danger {
          border: 1px solid #fecaca;
          color: #b91c1c;
        }
      `}</style>

      <section className="service-detail-hero">
        <div className="service-detail-hero-inner">
          <motion.div initial="hidden" animate="visible" variants={fadeInUp}>
            <div className="hero-back-row" onClick={() => navigate(-1)}>
              <FaArrowLeft />
              <span>Back to results</span>
            </div>
            <p className="hero-kicker">SERVICE DETAILS</p>
            <h1 className="hero-title">Review the service and send a request</h1>
            <p className="hero-meta">
              Check the provider&apos;s details, availability and customer
              feedback.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="service-detail-layout">
        <div className="service-detail-main">
          <div className="service-detail-header-row">
            <div>
              <h2 className="service-detail-name">{service.name}</h2>
              <div className="service-detail-location">
                <FaMapMarkerAlt /> {service.location}
              </div>
              <div className="service-detail-chip-row">
                <span className="service-chip service-chip-category">
                  <FaTag size={12} />
                  {service.category}
                </span>
                <span className="service-chip service-chip-status">
                  {service.availability || "Available"}
                </span>
              </div>
            </div>
            <button
              type="button"
              className="favorite-button"
              onClick={() => toggleFavorite(service.id)}
            >
              {isFavorite ? <FaHeart /> : <FaRegHeart />}
            </button>
          </div>

          {/* carousel */}
          <div className="Image-carousel mb-3">
            <div>
              <div
                id={carouselId}
                className="carousel slide"
                data-bs-ride="carousel"
                data-bs-interval="3000"
              >
                <div className="carousel-indicators">
                  {imagesForCarousel.map((_, index) => (
                    <button
                      key={index}
                      type="button"
                      data-bs-target={`#${carouselId}`}
                      data-bs-slide-to={index}
                      className={index === 0 ? "active" : ""}
                      aria-current={index === 0 ? "true" : undefined}
                      aria-label={`Slide ${index + 1}`}
                    />
                  ))}
                </div>

                <div className="carousel-inner" role="listbox">
                  {imagesForCarousel.map((url, index) => (
                    <div
                      key={`${url}-${index}`}
                      className={`carousel-item ${index === 0 ? "active" : ""}`}
                    >
                      <img
                        src={url}
                        className="w-100 d-block"
                        alt={`Service image ${index + 1}`}
                      />
                    </div>
                  ))}
                </div>

                {imagesForCarousel.length > 1 && (
                  <>
                    <button
                      className="carousel-control-prev"
                      type="button"
                      data-bs-target={`#${carouselId}`}
                      data-bs-slide="prev"
                    >
                      <span
                        className="carousel-control-prev-icon"
                        aria-hidden="true"
                      ></span>
                      <span className="visually-hidden">Previous</span>
                    </button>

                    <button
                      className="carousel-control-next"
                      type="button"
                      data-bs-target={`#${carouselId}`}
                      data-bs-slide="next"
                    >
                      <span
                        className="carousel-control-next-icon"
                        aria-hidden="true"
                      ></span>
                      <span className="visually-hidden">Next</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* rating + insights */}
          <div className="rating-banner" style={{ flexDirection: "column", alignItems: "stretch" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 18 }}>
              <div className="rating-main-value">
                <div>
                  <span className="rating-score">
                    {avgRating === "—" ? "—" : avgRating}
                  </span>
                  <span className="rating-out-of">
                    {avgRating === "—" ? "  No reviews yet" : "  out of 5.0"}
                  </span>
                </div>
                {avgRating !== "—" && (
                  <div className="rating-stars-row">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <FaStar
                        key={star}
                        className={
                          star <= Math.round(avgRatingNumber)
                            ? "rating-star-icon-active"
                            : "rating-star-icon-inactive"
                        }
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="rating-label">
                Customer Rating · {serviceReviews.length}{" "}
                {serviceReviews.length === 1 ? "review" : "reviews"}
              </div>
            </div>

            {/* ✅ Trust + breakdown + filters */}
            {serviceReviews.length > 0 && (
              <div style={{ marginTop: 10 }}>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
                  <div
                    style={{
                      padding: "6px 12px",
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 900,
                      border: "1px solid #e2e8f0",
                      background: trustBg,
                      color: trustColor,
                    }}
                    title="Trust indicator based on review distribution"
                  >
                    Trust: {reviewSummary.trust?.label || "No signal"}
                  </div>

                  <div style={{ fontSize: 12, color: "#475569", fontWeight: 800 }}>
                    Positive: {reviewSummary.counts?.positive || 0} • Neutral:{" "}
                    {reviewSummary.counts?.neutral || 0} • Negative:{" "}
                    {reviewSummary.counts?.negative || 0}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                  {["all", "positive", "neutral", "negative"].map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setSentimentFilter(k)}
                      style={{
                        borderRadius: 999,
                        padding: "6px 12px",
                        fontSize: 12,
                        fontWeight: 900,
                        cursor: "pointer",
                        border: "1px solid #e2e8f0",
                        background: sentimentFilter === k ? "#111827" : "#ffffff",
                        color: sentimentFilter === k ? "#fff" : "#111827",
                      }}
                    >
                      {k === "all" ? "All" : k.charAt(0).toUpperCase() + k.slice(1)}
                    </button>
                  ))}
                </div>

                <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {reviewSummary.topPositiveKeywords?.length > 0 && (
                    <div style={{ fontSize: 12, color: "#166534", fontWeight: 900 }}>
                      👍 Top positives:{" "}
                      {reviewSummary.topPositiveKeywords
                        .map((x) => x.word)
                        .slice(0, 4)
                        .join(", ")}
                    </div>
                  )}
                  {reviewSummary.topNegativeKeywords?.length > 0 && (
                    <div style={{ fontSize: 12, color: "#b91c1c", fontWeight: 900 }}>
                      👎 Top negatives:{" "}
                      {reviewSummary.topNegativeKeywords
                        .map((x) => x.word)
                        .slice(0, 4)
                        .join(", ")}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <section style={{ marginBottom: 20 }}>
            <h3 className="section-title">About This Provider</h3>
            <p className="section-body">
              {service.description ||
                "This provider offers professional services with strong customer feedback and reliable response times."}
            </p>
          </section>

          <section>
            <h3 className="section-title">Key Features</h3>
            <div className="features-grid">
              <div className="feature-item">
                <span className="feature-dot" />
                Trusted local professional
              </div>
              <div className="feature-item">
                <span className="feature-dot" />
                Transparent pricing on request
              </div>
              <div className="feature-item">
                <span className="feature-dot" />
                Safety &amp; quality prioritised
              </div>
              <div className="feature-item">
                <span className="feature-dot" />
                Punctual &amp; reliable service
              </div>
            </div>
          </section>

          <ServiceReviewForm
            serviceId={service.id}
            serviceName={service.name}
            onReviewSaved={handleReviewsUpdated}
          />
        </div>

        <div className="service-detail-side">
          <div className="booking-panel">
            <h3 className="booking-title">Book This Service</h3>
            <p className="booking-subtitle">
              Fill out the form below and the provider will contact you with
              availability and pricing details.
            </p>

            <form onSubmit={handleContactSubmit}>
              <div className="form-group">
                <label className="form-label">
                  <FaClock size={11} />
                  <span>Urgency level</span>
                </label>
                <select
                  className="form-control"
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value)}
                >
                  <option value="Normal">Normal</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <span>Preferred date</span>
                </label>
                <input
                  type="date"
                  className="form-control"
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                />
                <div className="booking-helper">Leave blank for flexible scheduling.</div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <span>Preferred time</span>
                </label>
                <select
                  className="form-control"
                  value={preferredTime}
                  onChange={(e) => setPreferredTime(e.target.value)}
                >
                  <option value="Flexible / Anytime">Flexible / Anytime</option>
                  <option value="Morning (8AM - 12PM)">Morning (8AM - 12PM)</option>
                  <option value="Afternoon (12PM - 4PM)">Afternoon (12PM - 4PM)</option>
                  <option value="Evening (4PM - 8PM)">Evening (4PM - 8PM)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <span>Service details</span>
                </label>
                <textarea
                  className="form-control"
                  rows={4}
                  placeholder="E.g., need help with AC servicing this weekend..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>

              <button type="submit" className="booking-primary-btn">
                Send Contact Request
              </button>

              <button
                type="button"
                className="booking-secondary-btn"
                onClick={() => toggleFavorite(service.id)}
              >
                {isFavorite ? "Remove from Favorites" : "Add to Favorites"}
              </button>

              {submitStatus === "success" && (
                <div className="booking-status booking-status-success">
                  Your request has been saved. The provider will see it in their dashboard.
                </div>
              )}
              {submitStatus === "error" && (
                <div className="booking-status booking-status-error">
                  Please log in to send a request.
                </div>
              )}
            </form>

            {lastRequest && (
              <div className="last-request-card">
                <div className="last-request-title">Your Last Request</div>
                <div className="last-request-row">
                  <span className="last-request-label">Urgency</span>
                  <span className="last-request-value">{lastRequest.urgency}</span>
                </div>
                <div className="last-request-row">
                  <span className="last-request-label">Preferred Date</span>
                  <span className="last-request-value">{lastRequest.preferredDate || "Flexible"}</span>
                </div>
                <div className="last-request-row">
                  <span className="last-request-label">Preferred Time</span>
                  <span className="last-request-value">{lastRequest.preferredTime}</span>
                </div>
                <div className="last-request-row">
                  <span className="last-request-label">Message</span>
                  <span className="last-request-value">{lastRequest.message}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {serviceReviews.length > 0 && (
        <section className="service-detail-reviews-section">
          <div className="service-reviews-list">
            <h3 className="reviews-list-title">What other customers are saying</h3>

            {reviewsForRender.map((rev) => {
              const ownerId =
                rev.customerId || rev.userId || rev.email || rev.customerEmail || null;

              const isMine =
                userId &&
                ownerId &&
                String(ownerId).toLowerCase() === String(userId).toLowerCase();

              const isEditingThis = String(editingReviewId) === String(rev.id);
              const draft = editDrafts[rev.id] || { rating: 0, hover: 0, text: "" };

              const insight = reviewSummary.byReviewId?.[String(rev.id)];
              const sentiment = insight?.sentiment || "neutral";

              const sentimentStyle =
                sentiment === "positive"
                  ? { background: "#dcfce7", color: "#166534", border: "1px solid #bbf7d0" }
                  : sentiment === "negative"
                  ? { background: "#fee2e2", color: "#b91c1c", border: "1px solid #fecaca" }
                  : { background: "#eef2ff", color: "#3730a3", border: "1px solid #e0e7ff" };

              return (
                <div key={rev.id} className="review-item-card">
                  <div className="review-item-header">
                    <span className="reviewer-name">{rev.customerName || "Customer"}</span>

                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {/* ✅ Sentiment badge */}
                      <span
                        style={{
                          ...sentimentStyle,
                          padding: "4px 10px",
                          borderRadius: 999,
                          fontSize: 11,
                          fontWeight: 900,
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                        }}
                        title="Keyword-based sentiment"
                      >
                        {sentiment}
                      </span>

                      <span className="review-date">{rev.readableDate || rev.date || ""}</span>

                      {isMine && (
                        <div style={{ display: "flex", gap: 8 }}>
                          {!isEditingThis ? (
                            <>
                              <button
                                type="button"
                                onClick={() => startInlineEdit(rev)}
                                className="review-pill-btn"
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteMyReview(rev.id)}
                                className="review-pill-btn review-pill-btn-danger"
                              >
                                Delete
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => saveInlineEdit(rev.id)}
                                className="review-pill-btn review-pill-btn-primary"
                              >
                                Save
                              </button>

                              <button
                                type="button"
                                onClick={() => cancelInlineEdit(rev.id)}
                                className="review-pill-btn"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Stars display OR editable stars */}
                  <div className="review-stars-row">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const active = isEditingThis
                        ? draft.hover
                          ? star <= draft.hover
                          : star <= draft.rating
                        : star <= (rev.rating || 0);

                      return (
                        <button
                          key={star}
                          type="button"
                          onMouseEnter={() => {
                            if (!isEditingThis) return;
                            setEditDrafts((p) => ({
                              ...p,
                              [rev.id]: { ...draft, hover: star },
                            }));
                          }}
                          onMouseLeave={() => {
                            if (!isEditingThis) return;
                            setEditDrafts((p) => ({
                              ...p,
                              [rev.id]: { ...draft, hover: 0 },
                            }));
                          }}
                          onClick={() => {
                            if (!isEditingThis) return;
                            setEditDrafts((p) => ({
                              ...p,
                              [rev.id]: { ...draft, rating: star },
                            }));
                          }}
                          style={{
                            background: "none",
                            border: "none",
                            padding: 0,
                            cursor: isEditingThis ? "pointer" : "default",
                          }}
                          aria-label={`Rate ${star}`}
                        >
                          <FaStar
                            className={
                              active ? "rating-star-icon-active" : "rating-star-icon-inactive"
                            }
                          />
                        </button>
                      );
                    })}
                  </div>

                  {!isEditingThis ? (
                    <p className="review-text">{rev.text}</p>
                  ) : (
                    <div className="review-edit-box">
                      <textarea
                        className="review-edit-textarea"
                        value={draft.text}
                        onChange={(e) =>
                          setEditDrafts((p) => ({
                            ...p,
                            [rev.id]: { ...draft, text: e.target.value },
                          }))
                        }
                        placeholder="Update your review..."
                      />

                      <div className="review-edit-actions">
                        <button
                          type="button"
                          className="review-pill-btn"
                          onClick={() => cancelInlineEdit(rev.id)}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="review-pill-btn review-pill-btn-primary"
                          onClick={() => saveInlineEdit(rev.id)}
                        >
                          Save review
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}