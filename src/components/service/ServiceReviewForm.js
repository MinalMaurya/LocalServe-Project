import { useEffect, useMemo, useState } from "react";
import { FaStar } from "react-icons/fa";
import { motion } from "framer-motion";

const REVIEWS_KEY = "local-service-discovery:vendor-reviews";

export default function ServiceReviewForm({
  serviceId,
  serviceName,
  onReviewSaved,

  // edit mode from ServiceDetails (click Edit on card)
  editingReview = null,
  onCancelEdit,
}) {
  const authUser = JSON.parse(localStorage.getItem("authUser") || "null");
  const isVendor = authUser?.role === "vendor";
  const userId = authUser?.id || authUser?.email || null;

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [text, setText] = useState("");
  const [status, setStatus] = useState(null);
  const [error, setError] = useState("");

  const [reviews, setReviews] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(REVIEWS_KEY) || "[]");
    } catch {
      return [];
    }
  });

  const isEditing = !!(editingReview && editingReview.id);

  // reload list if storage changes outside (optional safety)
  useEffect(() => {
    try {
      setReviews(JSON.parse(localStorage.getItem(REVIEWS_KEY) || "[]"));
    } catch {
      setReviews([]);
    }
  }, [serviceId]);

  // when editing review changes, load it into form
  useEffect(() => {
    setStatus(null);
    setError("");

    if (isEditing) {
      setRating(editingReview?.rating || 0);
      setHoverRating(0);
      setText(editingReview?.text || "");
      return;
    }

    // NOT editing -> always blank for NEW submission
    setRating(0);
    setHoverRating(0);
    setText("");
  }, [isEditing, editingReview?.id]); // important: only when id changes

  const persist = (updatedList) => {
    setReviews(updatedList);
    localStorage.setItem(REVIEWS_KEY, JSON.stringify(updatedList));
    if (onReviewSaved) onReviewSaved(updatedList);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setStatus(null);
    setError("");

    if (!authUser) {
      setError("You need to be logged in to leave a review.");
      return;
    }
    if (isVendor) {
      setError("Vendors can’t review their own services.");
      return;
    }
    if (!rating) {
      setError("Please select a rating.");
      return;
    }
    if (!text.trim()) {
      setError("Please write a review.");
      return;
    }

    const now = new Date();
    const nowIso = now.toISOString();

    if (isEditing) {
      // ✅ update ONLY the selected review id
      const updatedReview = {
        ...editingReview,
        serviceId,
        serviceName,
        userId: editingReview.userId || userId,
        customerId: editingReview.customerId || userId,
        customerName: editingReview.customerName || authUser.name || "Customer",
        rating,
        text: text.trim(),
        updatedAt: nowIso,
        readableDate: now.toLocaleString(),
        date: now.toLocaleDateString(),
      };

      const updatedList = reviews.map((r) =>
        String(r.id) === String(editingReview.id) ? updatedReview : r
      );

      persist(updatedList);
      setStatus("success");

      if (onCancelEdit) onCancelEdit();
      return;
    }

    // ✅ NEW review submission always allowed (multiple reviews)
    const newReview = {
      id: `${serviceId}-${userId}-${Date.now()}`,
      serviceId,
      serviceName,
      userId,
      customerId: userId, // for ownership checks in ServiceDetails
      customerName: authUser.name || "Customer",
      rating,
      text: text.trim(),
      createdAt: nowIso,
      updatedAt: nowIso,
      readableDate: now.toLocaleString(),
      date: now.toLocaleDateString(),
    };

    const updatedList = [...reviews, newReview];
    persist(updatedList);

    setRating(0);
    setHoverRating(0);
    setText("");
    setStatus("success");
  };

  const handleNewReviewClick = () => {
    // if editing, cancel edit and clear
    if (onCancelEdit) onCancelEdit();
    setRating(0);
    setHoverRating(0);
    setText("");
    setStatus(null);
    setError("");
  };

  const fadeIn = useMemo(
    () => ({
      hidden: { opacity: 0, y: 15 },
      visible: { opacity: 1, y: 0 },
    }),
    []
  );

  return (
    <div id="service-review-form" className="service-review-wrapper mt-4">
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
        .existing-tag {
          font-size: 11px;
          color: #0f172a;
          background: #e0f2fe;
          border-radius: 999px;
          padding: 4px 10px;
          font-weight: 600;
        }
        .stars-row {
          display: flex;
          gap: 6px;
          margin: 14px 0 10px;
        }
        .star-btn {
          background: none;
          border: none;
          padding: 0;
          cursor: pointer;
          font-size: 26px;
        }
        .star-icon-active { color: #facc15; }
        .star-icon-inactive { color: #e2e8f0; }
        .review-textarea {
          width: 100%;
          border-radius: 16px;
          border: 1px solid #cbd5e1;
          padding: 10px 12px;
          min-height: 80px;
          font-size: 14px;
        }
        .review-actions-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 14px;
          gap: 14px;
          flex-wrap: wrap;
        }
        .review-submit-btn {
          padding: 9px 20px;
          border-radius: 999px;
          border: none;
          background: linear-gradient(135deg,#3b82f6,#2563eb);
          color: #fff;
          font-weight: 700;
        }
        .review-secondary-btn {
          padding: 9px 16px;
          border-radius: 999px;
          border: 1px solid #e5e7eb;
          background: #f9fafb;
          font-weight: 600;
        }
        .review-danger-btn {
          padding: 9px 16px;
          border-radius: 999px;
          border: 1px solid #fecaca;
          background: #fff;
          color: #b91c1c;
          font-weight: 700;
        }
        .review-status-success { color: #16a34a; margin-top: 10px; font-size: 13px; }
        .review-status-error { color: #b91c1c; margin-top: 10px; font-size: 13px; }
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
              {isEditing ? "Edit your review" : "Share your experience"}
            </div>
            <div style={{ fontSize: "13px", color: "#64748b" }}>
              Rate <strong>{serviceName}</strong>.
            </div>
          </div>

          {isEditing && <span className="existing-tag">Editing</span>}
        </div>

        <div className="stars-row">
          {[1, 2, 3, 4, 5].map((star) => {
            const active = hoverRating ? star <= hoverRating : star <= rating;
            return (
              <button
                type="button"
                key={star}
                className="star-btn"
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
                disabled={isVendor}
              >
                <FaStar className={active ? "star-icon-active" : "star-icon-inactive"} />
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmit}>
          <textarea
            className="review-textarea"
            placeholder={isVendor ? "Vendors cannot review services." : "Share your thoughts..."}
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={isVendor}
          />

          <div className="review-actions-row">
            <span style={{ fontSize: "12px", color: "#94a3b8" }}>
              Your profile name appears with your review.
            </span>

            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                className="review-secondary-btn"
                onClick={handleNewReviewClick}
              >
                New review
              </button>

              {isEditing && (
                <button
                  type="button"
                  className="review-danger-btn"
                  onClick={() => onCancelEdit && onCancelEdit()}
                >
                  Cancel
                </button>
              )}

              <button type="submit" className="review-submit-btn" disabled={isVendor}>
                {isEditing ? "Save review" : "Submit review"}
              </button>
            </div>
          </div>
        </form>

        {error && <div className="review-status-error">{error}</div>}
        {status === "success" && (
          <div className="review-status-success">
            {isEditing ? "Your review has been updated." : "Thank you! Review submitted."}
          </div>
        )}
      </motion.div>
    </div>
  );
}