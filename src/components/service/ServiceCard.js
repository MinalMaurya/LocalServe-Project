// src/components/service/ServiceCard.jsx
import {
  FaHeart,
  FaRegHeart,
  FaStar,
  FaStarHalfAlt,
  FaRegStar,
  FaMapMarkerAlt,
  FaInfoCircle,
  FaBolt,
  FaWrench,
  FaBook,
  FaCar,
  FaHome,
  FaCheckCircle,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const categoryIcon = {
  Electrician: <FaBolt className="me-1" />,
  Plumber: <FaWrench className="me-1" />,
  Tutor: <FaBook className="me-1" />,
  Mechanic: <FaCar className="me-1" />,
  "Home Service": <FaHome className="me-1" />,
};

export default function ServiceCard({
  service,
  isFavorite,
  onToggleFavorite,
  // ⭐ you can keep this prop, but we’ll ignore it and use role instead
  isLoggedIn,
}) {
  const rating = service.rating || 0;
  const MAX_STARS = 5;
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.5;
  const emptyStars = MAX_STARS - fullStars - (hasHalf ? 1 : 0);

  const isVerified = service.isVerified || service.verified;
  const navigate = useNavigate();

  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  // ⭐ NEW: read user + role from localStorage
  const authUser = JSON.parse(localStorage.getItem("authUser") || "null");
  const role = authUser?.role || "guest"; // "customer" | "vendor" | "guest"
  const isRealUser = !!authUser && role !== "guest"; // 👈 our final condition

  const handleViewDetails = (e) => {
    e.preventDefault();
    e.stopPropagation();

    // ⭐ CHANGED: use isRealUser instead of isLoggedIn
    if (!isRealUser) {
      // 🔐 guest / not logged in → show mini prompt
      setShowAuthPrompt(true);
      return;
    }

    // ✅ Logged in (customer/vendor) → go to details
    navigate(`/service/${service.id}`);
  };

  const handleCardClick = (e) => {
    // entire card behaves like "view details" click
    handleViewDetails(e);
  };

  return (
    <div
      className="card h-100 border-0 shadow-sm service-card-clickable"
      onClick={handleCardClick}
      style={{ cursor: "pointer", position: "relative" }}
    >
      <style>{`
        .card.service-card-clickable {
          border-radius: 20px;
          transition: all 0.35s ease;
          background: #ffffff !important;
          color: #0f172a;
        }
        .card.service-card-clickable:hover {
          transform: translateY(-12px);
          box-shadow: 0 30px 60px rgba(37,99,235,0.25);
        }
        .tag {
          background: #eef2ff;
          color: #2563eb;
          font-size: 13px;
          padding: 6px 14px;
          border-radius: 999px;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
        }
        .verified-badge {
          font-size: 11px;
          border-radius: 999px;
          background: #dcfce7;
          color: #16a34a;
          padding: 4px 10px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        .service-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .auth-prompt-overlay {
          position: absolute;
          inset: 0;
          background: rgba(15,23,42,0.52);
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 5;
        }

        .auth-prompt-card {
          background: #ffffff;
          border-radius: 18px;
          padding: 18px 20px;
          max-width: 260px;
          text-align: center;
          box-shadow: 0 18px 40px rgba(15,23,42,0.35);
        }

        .auth-prompt-title {
          font-size: 15px;
          font-weight: 700;
          margin-bottom: 8px;
          color: #0f172a;
        }

        .auth-prompt-text {
          font-size: 13px;
          color: #64748b;
          margin-bottom: 12px;
        }

        .auth-prompt-actions {
          display: flex;
          justify-content: center;
          gap: 8px;
        }

        .auth-btn {
          border-radius: 999px;
          border: none;
          font-size: 13px;
          font-weight: 600;
          padding: 7px 14px;
          cursor: pointer;
        }

        .auth-btn-primary {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: #ffffff;
        }

        .auth-btn-secondary {
          background: #e2e8f0;
          color: #0f172a;
        }
      `}</style>

      <div className="card-body d-flex flex-column">
        <div className="d-flex justify-content-between align-items-start">
          <div>
            <div className="service-header-row">
              <h5 className="fw-bold mb-1">{service.name}</h5>
              {isVerified && (
                <span className="verified-badge">
                  <FaCheckCircle />
                  Verified
                </span>
              )}
            </div>
          </div>

          <span
            style={{ cursor: "pointer", zIndex: 10 }}
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
          >
            {isFavorite ? <FaHeart color="red" /> : <FaRegHeart />}
          </span>
        </div>

        <p className="text-muted mb-2 mt-2">
          <FaMapMarkerAlt className="me-1" />
          {service.location}
        </p>

        <div className="d-flex justify-content-between align-items-center mb-2">
          <span className="tag">
            {categoryIcon[service.category] || null}
            {service.category}
          </span>
          <span
            className={
              service.status === "Available"
                ? "text-success fw-semibold"
                : service.status === "Busy"
                ? "text-warning fw-semibold"
                : "text-danger fw-semibold"
            }
          >
            {service.status}
          </span>
        </div>

        <div className="d-flex align-items-center mb-3">
          <div className="me-2">
            {Array.from({ length: fullStars }).map((_, idx) => (
              <FaStar key={`full-${idx}`} className="text-warning me-1" />
            ))}
            {hasHalf && (
              <FaStarHalfAlt className="text-warning me-1" />
            )}
            {Array.from({ length: emptyStars }).map((_, idx) => (
              <FaRegStar
                key={`empty-${idx}`}
                className="text-warning me-1"
              />
            ))}
          </div>
          <span className="text-muted small">
            {rating.toFixed(1)} / 5
          </span>
        </div>

        <button
          type="button"
          className="btn btn-outline-primary mt-auto"
          onClick={handleViewDetails}
        >
          <FaInfoCircle className="me-1" />
          View Details
        </button>
      </div>

      {/* 🔐 Auth prompt overlay now also checks isRealUser */}
      {showAuthPrompt && !isRealUser && (
        <div
          className="auth-prompt-overlay"
          onClick={() => setShowAuthPrompt(false)}
        >
          <div
            className="auth-prompt-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="auth-prompt-title">
              Sign in to view details
            </div>
            <div className="auth-prompt-text">
              You need an account to view full details and send requests
              to this service provider.
            </div>
            <div className="auth-prompt-actions">
              <button
                className="auth-btn auth-btn-secondary"
                type="button"
                onClick={() => navigate("/signup")}
              >
                Sign up
              </button>
              <button
                className="auth-btn auth-btn-primary"
                type="button"
                onClick={() => navigate("/login")}
              >
                Log in
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}