// src/utils/smartRanking.js

const clamp01 = (n) => Math.max(0, Math.min(1, n));

const normalizeText = (s) => String(s || "").trim().toLowerCase();

export function inferTargetLocationFromSearch(search, knownLocations = []) {
  const q = normalizeText(search);
  if (!q) return null;

  // try exact / includes match on known locations
  for (const loc of knownLocations) {
    const L = normalizeText(loc);
    if (!L) continue;
    if (q.includes(L)) return loc;
  }

  return null;
}

export function computeAvailabilityScore(status) {
  const s = normalizeText(status);
  if (s === "available") return 1.0;
  if (s === "busy") return 0.55;
  if (s === "offline") return 0.15;

  // unknown status
  return 0.35;
}

export function computeLocationScore(serviceLocation, targetLocation) {
  const a = normalizeText(serviceLocation);
  const b = normalizeText(targetLocation);

  // If user didn't indicate a location, keep it neutral (no penalty)
  if (!b) return 0.55;

  if (!a) return 0.2;

  if (a === b) return 1.0;

  // partial match
  if (a.includes(b) || b.includes(a)) return 0.75;

  // weak match
  return 0.25;
}

export function buildRankReasons({ rating, status, serviceLocation, targetLocation }) {
  const reasons = [];

  const r = Number(rating || 0);
  if (r >= 4.5) reasons.push(`Highly rated (${r.toFixed(1)}★)`);
  else if (r >= 4.0) reasons.push(`Well rated (${r.toFixed(1)}★)`);
  else if (r > 0) reasons.push(`Rated ${r.toFixed(1)}★`);

  const s = normalizeText(status);
  if (s === "available") reasons.push("Available now");
  else if (s === "busy") reasons.push("Busy but active");
  else if (s === "offline") reasons.push("Currently offline");

  const loc = String(serviceLocation || "").trim();
  const tgt = String(targetLocation || "").trim();

  if (tgt && loc) {
    if (normalizeText(loc) === normalizeText(tgt)) {
      reasons.push(`Matches your location (${loc})`);
    } else if (normalizeText(loc).includes(normalizeText(tgt)) || normalizeText(tgt).includes(normalizeText(loc))) {
      reasons.push(`Close location match (${loc})`);
    } else {
      // still provide transparency without lying about distance
      reasons.push(`Location: ${loc}`);
    }
  } else if (loc) {
    reasons.push(`Location: ${loc}`);
  }

  // keep it short
  return reasons.slice(0, 3);
}

export function smartRankServices(services, options = {}) {
  const {
    search = "",
    filtersLocation = "all",
    knownLocations = [],
  } = options;

  const targetLocation =
    filtersLocation && filtersLocation !== "all"
      ? filtersLocation
      : inferTargetLocationFromSearch(search, knownLocations);

  // weights (tweakable)
  const W_RATING = 0.55;
  const W_AVAIL = 0.25;
  const W_LOC = 0.20;

  return [...services]
    .map((s) => {
      const rating = Number(s.rating || 0);
      const ratingScore = clamp01(rating / 5);

      const availabilityScore = computeAvailabilityScore(s.status);
      const locationScore = computeLocationScore(s.location, targetLocation);

      const score =
        ratingScore * W_RATING +
        availabilityScore * W_AVAIL +
        locationScore * W_LOC;

      const reasons = buildRankReasons({
        rating,
        status: s.status,
        serviceLocation: s.location,
        targetLocation,
      });

      const why = reasons.join(" · ");

      return {
        ...s,
        rankMeta: {
          score: Math.round(score * 1000) / 10, // 0-100 with 0.1 precision
          reasons,
          why,
          targetLocation: targetLocation || null,
        },
      };
    })
    .sort((a, b) => {
      // primary: smart score
      const d = (b.rankMeta?.score || 0) - (a.rankMeta?.score || 0);
      if (d !== 0) return d;

      // tie-breakers: availability then rating then name
      const as = computeAvailabilityScore(b.status) - computeAvailabilityScore(a.status);
      if (as !== 0) return as;

      const rs = (b.rating || 0) - (a.rating || 0);
      if (rs !== 0) return rs;

      return String(a.name || "").localeCompare(String(b.name || ""));
    });
}