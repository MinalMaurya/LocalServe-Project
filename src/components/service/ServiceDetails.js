// src/components/pages/ServiceDetails.jsx
import React, { useMemo, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
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

export default function ServiceDetails() {
  const { id } = useParams(); // route like /services/:id
  const navigate = useNavigate();

  const { services, favoriteIds, toggleFavorite } = useServiceDiscovery();

  const authUser = JSON.parse(localStorage.getItem("authUser") || "null");

  // 🔹 service lookup (always same hook order)
  const service = useMemo(
    () => services.find((s) => String(s.id) === String(id)),
    [services, id]
  );

  // 🔹 booking form state
  const [urgency, setUrgency] = useState("Normal");
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTime, setPreferredTime] = useState("Flexible / Anytime");
  const [message, setMessage] = useState("");
  const [submitStatus, setSubmitStatus] = useState(null); // "success" | "error" | null

  // 🔹 reviews state for THIS service
  const [serviceReviews, setServiceReviews] = useState([]);

  // load reviews for this service when component mounts / service changes
  useEffect(() => {
    if (!service) {
      setServiceReviews([]);
      return;
    }
    try {
      const all = JSON.parse(localStorage.getItem(REVIEWS_KEY) || "[]");
      const filtered = all.filter((r) => r.serviceId === service.id);
      setServiceReviews(filtered);
    } catch {
      setServiceReviews([]);
    }
  }, [service]);

  // 🔹 average rating (number + formatted)
  let avgRatingNumber = 0;
  if (serviceReviews.length > 0) {
    avgRatingNumber =
      serviceReviews.reduce((sum, r) => sum + (r.rating || 0), 0) /
      serviceReviews.length;
  }

  const avgRating =
    serviceReviews.length > 0 ? avgRatingNumber.toFixed(1) : "—";

  // 🔹 last request for this user + service (no hooks here)
  const allRequests = JSON.parse(localStorage.getItem(CONTACT_KEY) || "[]");
  const userId = authUser?.id || authUser?.email;

  const lastRequest = service
    ? [...allRequests]
        .reverse()
        .find(
          (r) =>
            r.serviceId === service.id &&
            (!userId || r.customerId === userId)
        )
    : null;

  const isFavorite = service ? favoriteIds.includes(service.id) : false;

  // 🔹 callback from review form: keeps UI in sync without refresh
  const handleReviewsUpdated = (allUpdatedReviews) => {
    if (!service) return;
    const onlyThisService = allUpdatedReviews.filter(
      (r) => r.serviceId === service.id
    );
    setServiceReviews(onlyThisService);
  };

  // 🔹 animations
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

  // ✅ AFTER all hooks: safe early return
  if (!service) {
    return (
      <main className="service-detail-page">
        <div className="service-detail-empty">
          <button
            className="back-link"
            type="button"
            onClick={() => navigate(-1)}
          >
            <FaArrowLeft /> Back to results
          </button>
          <p>Service not found. It may have been removed.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="service-detail-page">
      <style>{`
        .service-detail-page {
          background: #f5f7fb;
          min-height: 100vh;
        }

        /* BLUE HERO */
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

        /* LAYOUT CARD */
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

        /* RIGHT COLUMN: BOOKING PANEL */
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

        /* bottom reviews wrapper */
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

        .service-detail-empty {
          max-width: 800px;
          margin: 60px auto;
          padding: 0 24px;
        }

        .back-link {
          border: none;
          background: none;
          color: #2563eb;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 10px;
          cursor: pointer;
          font-weight: 600;
        }

        @media (max-width: 900px) {
          .service-detail-hero {
            padding: 40px 0 90px;
          }
          .service-detail-hero-title {
            font-size: 26px;
          }
          .service-detail-layout {
            grid-template-columns: 1fr;
            margin: -70px 16px 24px;
            padding: 18px 18px 20px;
          }
        }
      `}</style>

      {/* 🌊 BLUE HERO */}
      <section className="service-detail-hero">
        <div className="service-detail-hero-inner">
          <motion.div initial="hidden" animate="visible" variants={fadeInUp}>
            <div className="hero-back-row" onClick={() => navigate(-1)}>
              <FaArrowLeft />
              <span>Back to results</span>
            </div>
            <p className="hero-kicker">SERVICE DETAILS</p>
            <h1 className="hero-title">
              Review the service and send a request
            </h1>
            <p className="hero-meta">
              Check the provider&apos;s details, availability and customer
              feedback.
            </p>
          </motion.div>
        </div>
      </section>

      {/* MAIN OVERLAPPING CARD */}
      <div className="service-detail-layout">
        {/* LEFT SIDE: DESCRIPTION + REVIEW FORM */}
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

          {/* Rating banner with live-updating stars */}
          <div className="rating-banner">
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

          {/* REVIEW FORM INSIDE MAIN CARD */}
          <ServiceReviewForm
            serviceId={service.id}
            serviceName={service.name}
            onReviewSaved={handleReviewsUpdated}
          />
        </div>

        {/* RIGHT SIDE: BOOKING PANEL */}
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
                <div className="booking-helper">
                  Leave blank for flexible scheduling.
                </div>
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
                  <option value="Flexible / Anytime">
                    Flexible / Anytime
                  </option>
                  <option value="Morning (8AM - 12PM)">
                    Morning (8AM - 12PM)
                  </option>
                  <option value="Afternoon (12PM - 4PM)">
                    Afternoon (12PM - 4PM)
                  </option>
                  <option value="Evening (4PM - 8PM)">
                    Evening (4PM - 8PM)
                  </option>
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
                  Your request has been saved. The provider will see it in their
                  dashboard.
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
                  <span className="last-request-value">
                    {lastRequest.urgency}
                  </span>
                </div>
                <div className="last-request-row">
                  <span className="last-request-label">Preferred Date</span>
                  <span className="last-request-value">
                    {lastRequest.preferredDate || "Flexible"}
                  </span>
                </div>
                <div className="last-request-row">
                  <span className="last-request-label">Preferred Time</span>
                  <span className="last-request-value">
                    {lastRequest.preferredTime}
                  </span>
                </div>
                <div className="last-request-row">
                  <span className="last-request-label">Message</span>
                  <span className="last-request-value">
                    {lastRequest.message}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PUBLIC PAST REVIEWS BELOW THE CARD */}
      {serviceReviews.length > 0 && (
        <section className="service-detail-reviews-section">
          <div className="service-reviews-list">
            <h3 className="reviews-list-title">
              What other customers are saying
            </h3>

            {serviceReviews
              .slice()
              .sort(
                (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
              )
              .map((rev) => (
                <div key={rev.id} className="review-item-card">
                  <div className="review-item-header">
                    <span className="reviewer-name">
                      {rev.customerName || "Customer"}
                    </span>
                    <span className="review-date">{rev.date}</span>
                  </div>

                  <div className="review-stars-row">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <FaStar
                        key={star}
                        className={
                          star <= rev.rating
                            ? "rating-star-icon-active"
                            : "rating-star-icon-inactive"
                        }
                      />
                    ))}
                  </div>

                  <p className="review-text">{rev.text}</p>
                </div>
              ))}
          </div>
        </section>
      )}
    </main>
  );
}