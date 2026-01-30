// src/utils/reviewInsights.js
// Keyword-based review insights (NO ML)

const POSITIVE_WORDS = new Set([
  "good", "great", "excellent", "amazing", "awesome", "perfect", "fantastic",
  "love", "loved", "helpful", "professional", "friendly", "polite", "quick",
  "fast", "prompt", "on-time", "ontime", "timely", "clean", "neat", "smooth",
  "reliable", "trustworthy", "recommended", "recommend", "best", "satisfied",
  "nice", "affordable", "reasonable", "value", "efficient", "supportive",
]);

const NEGATIVE_WORDS = new Set([
  "bad", "worst", "poor", "terrible", "awful", "horrible", "rude",
  "late", "delay", "delayed", "slow", "unprofessional", "dirty", "messy",
  "scam", "fraud", "cheat", "cheated", "overpriced", "expensive",
  "disappointed", "disappointing", "problem", "issues", "issue", "broken",
  "waste", "refund", "cancelled", "canceled", "noisy", "careless",
]);

const NEGATIONS = new Set(["not", "no", "never", "hardly", "barely", "dont", "don't", "didnt", "didn't"]);
const INTENSIFIERS = new Set(["very", "really", "extremely", "super", "too"]);

function safeString(v) {
  return String(v || "").trim();
}

function normalizeText(text) {
  return safeString(text)
    .toLowerCase()
    .replace(/[\u2019]/g, "'")
    .replace(/[^a-z0-9\s'-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(text) {
  const t = normalizeText(text);
  if (!t) return [];
  return t.split(" ").filter(Boolean);
}

// Score text using keyword hits + basic negation handling
function scoreText(tokens) {
  let score = 0;
  const posHits = [];
  const negHits = [];

  for (let i = 0; i < tokens.length; i++) {
    const w = tokens[i];

    // Combine simple hyphen words (on-time, etc already handled by cleanup)
    const prev = tokens[i - 1] || "";
    const prev2 = tokens[i - 2] || "";

    const negated = NEGATIONS.has(prev) || NEGATIONS.has(prev2);

    // Intensifier boosts magnitude
    const intensified = INTENSIFIERS.has(prev);

    if (POSITIVE_WORDS.has(w)) {
      const delta = (negated ? -1 : 1) * (intensified ? 2 : 1);
      score += delta;
      (negated ? negHits : posHits).push(w);
    }

    if (NEGATIVE_WORDS.has(w)) {
      const delta = (negated ? 1 : -1) * (intensified ? 2 : 1);
      score += delta;
      (negated ? posHits : negHits).push(w);
    }
  }

  return { score, posHits, negHits };
}

// Rating contributes as a strong prior (because users often rate honestly even with short text)
function ratingSignal(ratingNumber) {
  const r = Number(ratingNumber || 0);
  if (r >= 4) return 2;     // strong positive
  if (r === 3) return 0;    // neutral
  if (r > 0 && r <= 2) return -2; // strong negative
  return 0;
}

export function classifyReview(review) {
  const rating = Number(review?.rating || 0);
  const text = safeString(review?.text);
  const tokens = tokenize(text);

  const textResult = scoreText(tokens);
  const score = ratingSignal(rating) + textResult.score;

  // Thresholds
  let sentiment = "neutral";
  if (score >= 2) sentiment = "positive";
  if (score <= -2) sentiment = "negative";

  return {
    sentiment, // "positive" | "neutral" | "negative"
    score,
    rating,
    posHits: textResult.posHits,
    negHits: textResult.negHits,
  };
}

// Pick trust badge based on distribution
function computeTrustBadge(total, posPct, negPct) {
  if (total < 3) return { label: "New listing", tone: "neutral" };
  if (posPct >= 0.7 && negPct <= 0.15) return { label: "Mostly positive", tone: "positive" };
  if (negPct >= 0.45) return { label: "Mostly negative", tone: "negative" };
  if (posPct >= 0.45 && negPct <= 0.25) return { label: "Generally positive", tone: "positive" };
  return { label: "Mixed feedback", tone: "neutral" };
}

function topKFromHits(hitsArray, k = 5) {
  const freq = new Map();
  for (const w of hitsArray) freq.set(w, (freq.get(w) || 0) + 1);
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, k)
    .map(([word, count]) => ({ word, count }));
}

export function summarizeReviews(reviews) {
  const list = Array.isArray(reviews) ? reviews : [];
  const total = list.length;

  if (total === 0) {
    return {
      total: 0,
      avgRating: "—",
      counts: { positive: 0, neutral: 0, negative: 0 },
      pct: { positive: 0, neutral: 0, negative: 0 },
      trust: { label: "No reviews yet", tone: "neutral" },
      topPositiveKeywords: [],
      topNegativeKeywords: [],
      byReviewId: {},
    };
  }

  let sumRating = 0;
  const counts = { positive: 0, neutral: 0, negative: 0 };
  const allPosHits = [];
  const allNegHits = [];
  const byReviewId = {};

  for (const r of list) {
    const res = classifyReview(r);
    byReviewId[String(r.id)] = res;
    counts[res.sentiment] += 1;
    sumRating += Number(r.rating || 0);
    allPosHits.push(...res.posHits);
    allNegHits.push(...res.negHits);
  }

  const avgRatingNumber = sumRating / total;
  const pct = {
    positive: counts.positive / total,
    neutral: counts.neutral / total,
    negative: counts.negative / total,
  };

  const trust = computeTrustBadge(total, pct.positive, pct.negative);

  return {
    total,
    avgRating: avgRatingNumber.toFixed(1),
    avgRatingNumber,
    counts,
    pct,
    trust,
    topPositiveKeywords: topKFromHits(allPosHits, 6),
    topNegativeKeywords: topKFromHits(allNegHits, 6),
    byReviewId,
  };
}