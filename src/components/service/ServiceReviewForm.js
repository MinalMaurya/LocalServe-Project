// src/components/service/ServiceReviewForm.js
import { useState, useEffect } from "react";
import { FaStar } from "react-icons/fa";
import { motion } from "framer-motion";

const REVIEWS_KEY = "local-service-discovery:vendor-reviews";

export default function ServiceReviewForm({
  serviceId,
  serviceName,
  onReviewSaved, // ✅ new callback from parent
}) {
  const authUser = JSON.parse(localStorage.getItem("authUser"));
  const isVendor = authUser?.role === "vendor";
  const userId = authUser?.id || authUser?.email; // fallback if no id

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [text, setText] = useState("");
  const [status, setStatus] = useState(null); // "success" | null
  const [error, setError] = useState("");
  const [reviews, setReviews] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(REVIEWS_KEY) || "[]");
    } catch {
      return [];
    }
  });
 const [isNewReview, setIsNewReview] = useState(false);
  const existingReview =
    authUser &&
    reviews.find(
      (r) => r.serviceId === serviceId && r.userId === userId
    );

  // pre-fill when user has already reviewed this service
  useEffect(() => {
    if (existingReview && !isNewReview) {
      setRating(existingReview.rating);
      setText(existingReview.text);
    }
    if (!existingReview && !isNewReview) {
      setRating(0);
      setText("");
    }
  }, [existingReview, isNewReview]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setStatus(null);

    if (!authUser) {
      setError("You need to be logged in to leave a review.");
      return;
    }

    if (isVendor) {
      setError("Vendors can’t review their own services here.");
      return;
    }

    if (!rating) {
      setError("Please select a star rating.");
      return;
    }

    if (!text.trim()) {
      setError("Please write something about your experience.");
      return;
    }

    const now = new Date();

        // 🔹 Decide ID: if editing existing & not in "new" mode → keep same id
    // otherwise create a fresh unique id so old reviews are preserved
    const reviewId =
      existingReview && !isNewReview
        ? existingReview.id
        : `${serviceId}-${userId}-${Date.now()}`;

    const newReview = {
      id: reviewId,
      serviceId,
      serviceName,
      userId,
      customerName: authUser.name || "Customer",
      rating,
      text: text.trim(),
      date: now.toLocaleDateString(),
      createdAt: existingReview?.createdAt || now.toISOString(),
      updatedAt: now.toISOString(),
    };

    let updated;
    if (existingReview && !isNewReview) {
      // ✅ edit mode: replace the existing one
      updated = reviews.map((r) =>
        r.id === existingReview.id ? newReview : r
      );
    } else {
      // ✅ new mode: append a fresh review
      updated = [...reviews, newReview];
    }

    setReviews(updated);
    localStorage.setItem(REVIEWS_KEY, JSON.stringify(updated));

    if (onReviewSaved) {
      onReviewSaved(updated); // keep parent in sync
    }

    setIsNewReview(false); // go back to "edit last one" mode
    setStatus("success");

    // 🔁 notify parent so it updates avg rating + past reviews without refresh
    if (typeof onReviewSaved === "function") {
      onReviewSaved(updated);
    }
  };
      // ✅ Clear form for a fresh, separate review (does NOT overwrite old one)
  const handleNewReviewClick = () => {
    setIsNewReview(true);     // 🟡 very important
    setRating(0);
    setHoverRating(0);
    setText("");
    setStatus(null);
    setError("");
  };

  const fadeIn = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="service-review-wrapper mt-4">
      <style>{`
        .service-review-card {
          background: #ffffff;
          border-radius: 22px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 12px 30px rgba(15,23,42,0.06);
          padding: 24px 22px;
          margin-top: 16px;
        }

        .service-review-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .service-review-title {
          font-size: 18px;
          font-weight: 800;
          color: #0f172a;
        }

        .service-review-subtitle {
          font-size: 13px;
          color: #64748b;
        }

        .existing-tag {
          font-size: 11px;
          color: #0f172a;
          background: #e0f2fe;
          border-radius: 999px;
          padding: 4px 10px;
          font-weight: 600;
          white-space: nowrap;
        }

        .stars-row {
          display: flex;
          gap: 6px;
          margin: 14px 0 10px;
        }

        .star-btn {
          border: none;
          background: none;
          padding: 0;
          cursor: pointer;
          font-size: 26px;
          transition: transform 0.12s ease;
        }

        .star-btn:hover {
          transform: translateY(-1px) scale(1.03);
        }

        .star-icon-active {
          color: #facc15;
        }
        .star-icon-inactive {
          color: #e2e8f0;
        }

        .review-textarea {
          width: 100%;
          border-radius: 16px;
          border: 1px solid #cbd5e1;
          padding: 10px 12px;
          min-height: 80px;
          font-size: 14px;
          resize: vertical;
          outline: none;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .review-textarea:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 1px rgba(59,130,246,0.35);
        }

        .review-actions-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 14px;
          gap: 14px;
          flex-wrap: wrap;
        }

        .review-hint {
          font-size: 12px;
          color: #94a3b8;
        }

        .review-submit-btn {
          padding: 9px 20px;
          border-radius: 999px;
          border: none;
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: #ffffff;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 10px 20px rgba(37,99,235,0.35);
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }

        .review-submit-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 14px 26px rgba(37,99,235,0.45);
        }

        .review-submit-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          box-shadow: none;
        }

        .review-status {
          margin-top: 10px;
          font-size: 13px;
          font-weight: 500;
        }

        .review-status-success {
          color: #16a34a;
        }

        .review-status-error {
          color: #b91c1c;
        }

        @media (max-width: 768px) {
          .service-review-card {
            padding: 20px 18px;
          }
          .review-actions-row {
            flex-direction: column;
            align-items: flex-start;
          }
        }
                  .review-secondary-btn {
          padding: 9px 16px;
          border-radius: 999px;
          border: 1px solid #e5e7eb;
          background: #f9fafb;
          color: #111827;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }

        .review-secondary-btn:hover {
          background: #e5e7eb;
        }
      `}</style>

      <motion.div
        className="service-review-card"
        initial="hidden"
        animate="visible"
        variants={fadeIn}
      >
        <div className="service-review-header">
          <div>
            <div className="service-review-title">
              Share your experience
            </div>
            <div className="service-review-subtitle">
              Rate <strong>{serviceName}</strong> and help other customers.
            </div>
          </div>
          {existingReview && (
            <span className="existing-tag">You reviewed this</span>
          )}
        </div>

        {/* STARS */}
        <div className="stars-row">
          {[1, 2, 3, 4, 5].map((star) => {
            const active = hoverRating
              ? star <= hoverRating
              : star <= rating;
            return (
              <button
                type="button"
                key={star}
                className="star-btn"
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
              >
                <FaStar
                  className={
                    active ? "star-icon-active" : "star-icon-inactive"
                  }
                />
              </button>
            );
          })}
        </div>

        {/* TEXT + SUBMIT */}
        <form onSubmit={handleSubmit}>
          <textarea
            className="review-textarea"
            placeholder={
              isVendor
                ? "Vendors can’t leave reviews."
                : "Tell others what you liked, what could be better, etc."
            }
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={isVendor}
          />

                 <div className="review-actions-row">
          <span className="review-hint">
            Your profile name will be shown with this review.
          </span>

          <div style={{ display: "flex", gap: "8px" }}>
            <button
              type="button"
              className="review-secondary-btn"
              onClick={handleNewReviewClick}
            >
              Submit another review
            </button>

            <button
              type="submit"
              className="review-submit-btn"
              disabled={!authUser || isVendor}
            >
              {existingReview ? "Update review" : "Submit review"}
            </button>
          </div>
        </div>
        </form>

        {error && (
          <div className="review-status review-status-error">
            {error}
          </div>
        )}
        {status === "success" && (
          <div className="review-status review-status-success">
            {existingReview
              ? "Your review has been updated."
              : "Thank you! Your review has been submitted."}
          </div>
        )}
      </motion.div>
    </div>
  );
}