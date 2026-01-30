import React, { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaSearch, FaFire, FaChevronDown, FaFilter } from "react-icons/fa";
import { useServiceDiscovery } from "../../hooks/useServiceDiscovery";
import ServiceCard from "../service/ServiceCard";
import ServiceFilters from "../service/ServiceFilters";
import Loading from "../states/Loading";
import EmptyState from "../states/EmptyState";

const RECENT_SEARCH_KEY = "local-service-discovery:recent-searches";
const VENDOR_SERVICES_KEY = "local-service-discovery:vendor-services";
const ADMIN_STATE_KEY = "local-service-discovery:admin-service-state";

export default function Home() {
  const {
    services,
    filteredServices,
    loading,
    error,
    search,
    setSearch,
    filters,
    updateFilter,
    favoriteIds,
    toggleFavorite,
    resetFilters,
  } = useServiceDiscovery();

  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem("isLoggedIn") === "true";
  });

  useEffect(() => {
    const handleStorage = () => {
      setIsLoggedIn(localStorage.getItem("isLoggedIn") === "true");
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const [sortBy, setSortBy] = useState("relevance");
  const [visibleCount, setVisibleCount] = useState(9);
  const [showFilters, setShowFilters] = useState(true);
  const [vendorServices, setVendorServices] = useState([]);
  const [adminState, setAdminState] = useState({});
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);

  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(RECENT_SEARCH_KEY) || "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(RECENT_SEARCH_KEY, JSON.stringify(recentSearches));
    } catch {}
  }, [recentSearches]);

  useEffect(() => {
    try {
      const stored =
        JSON.parse(localStorage.getItem(VENDOR_SERVICES_KEY) || "[]") || [];
      setVendorServices(stored);
    } catch {
      setVendorServices([]);
    }
  }, []);

  useEffect(() => {
    const loadAdminState = () => {
      try {
        const s =
          JSON.parse(localStorage.getItem(ADMIN_STATE_KEY) || "{}") || {};
        setAdminState(s);
      } catch {
        setAdminState({});
      }
    };
    loadAdminState();
    window.addEventListener("storage", loadAdminState);
    return () => window.removeEventListener("storage", loadAdminState);
  }, []);

  const getSource = (s) => s.source || (s.fromVendor ? "vendor" : "static");

  const applyAdminOverrides = (s) => {
    const key = `${getSource(s)}:${s.id}`;
    const override = adminState[key] || {};
    const adminRemoved = !!override.removed;
    const adminVerified = override.isVerified ?? s.isVerified ?? s.verified ?? false;

    return {
      ...s,
      adminRemoved,
      adminVerified,
      isVerified: adminVerified,
      verified: adminVerified,
    };
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") {
      const term = search.trim();
      if (!term) return;

      setRecentSearches((prev) => {
        const filtered = prev.filter(
          (t) => t.toLowerCase() !== term.toLowerCase()
        );
        return [term, ...filtered].slice(0, 5);
      });
    }
  };

  const handleRecentClick = (term) => {
    setSearch(term);
  };

  const adminAllStatic = useMemo(
    () => services.map(applyAdminOverrides).filter((s) => !s.adminRemoved),
    [services, adminState]
  );

  const adminVendorServices = useMemo(
    () =>
      vendorServices
        .map(applyAdminOverrides)
        .filter((s) => !s.adminRemoved),
    [vendorServices, adminState]
  );

  const allServicesForMeta = useMemo(
    () => [...adminAllStatic, ...adminVendorServices],
    [adminAllStatic, adminVendorServices]
  );

  const categories = useMemo(
    () => ["all", ...new Set(allServicesForMeta.map((s) => s.category))],
    [allServicesForMeta]
  );

  const locations = useMemo(
    () => ["all", ...new Set(allServicesForMeta.map((s) => s.location))],
    [allServicesForMeta]
  );

  const availabilities = ["all", "Available", "Busy", "Offline"];

  const adminFilteredStatic = useMemo(
    () =>
      filteredServices
        .map(applyAdminOverrides)
        .filter((s) => {
          if (s.adminRemoved) return false;
          if (showVerifiedOnly && !s.isVerified && !s.verified) return false;
          return true;
        }),
    [filteredServices, adminState, showVerifiedOnly]
  );

  const dynamicFiltered = useMemo(() => {
    const term = search.trim().toLowerCase();

    return adminVendorServices.filter((s) => {
      if (term) {
        const text = `${s.name || ""} ${s.category || ""} ${s.location || ""}`.toLowerCase();
        if (!text.includes(term)) return false;
      }

      if (filters.category && filters.category !== "all") {
        if ((s.category || "").toLowerCase() !== filters.category.toLowerCase())
          return false;
      }

      if (filters.location && filters.location !== "all") {
        if ((s.location || "").toLowerCase() !== filters.location.toLowerCase())
          return false;
      }

      if (filters.availability && filters.availability !== "all") {
        if (!s.status || s.status !== filters.availability) return false;
      }

      if (filters.showFavoritesOnly && !favoriteIds.includes(s.id)) {
        return false;
      }

      if (showVerifiedOnly && !s.isVerified && !s.verified) {
        return false;
      }

      return true;
    });
  }, [adminVendorServices, search, filters, favoriteIds, showVerifiedOnly]);

  const mergedFilteredServices = useMemo(
    () => [...adminFilteredStatic, ...dynamicFiltered],
    [adminFilteredStatic, dynamicFiltered]
  );

  const DEFAULT_USER_LOCATION = "New York";

  const getUserLocation = () => {
    try {
      const u = JSON.parse(localStorage.getItem("authUser") || "null");
      return u?.location || u?.city || DEFAULT_USER_LOCATION;
    } catch {
      return DEFAULT_USER_LOCATION;
    }
  };

  const normalize = (s) => String(s || "").trim().toLowerCase();

  const locationScore = (serviceLoc, userLoc) => {
    const s = normalize(serviceLoc);
    const u = normalize(userLoc);
    if (!s || !u) return 0;
    if (s === u) return 1;
    if (s.includes(u) || u.includes(s)) return 0.8;
    return 0;
  };

  const rankedServices = useMemo(() => {
    const userLoc = getUserLocation();
    const list = [...mergedFilteredServices];

    const withScore = list.map((s) => {
      const loc = locationScore(s.location, userLoc);
      const ratingNorm = Math.min(5, Math.max(0, s.rating || 0)) / 5;
      const availabilityBoost =
        s.status === "Available" ? 1 : s.status === "Busy" ? 0.5 : 0;

      const score = loc * 0.5 + ratingNorm * 0.35 + availabilityBoost * 0.15;
      return { ...s, __rankScore: score };
    });

    withScore.sort((a, b) => (b.__rankScore || 0) - (a.__rankScore || 0));

    if (sortBy === "rating-desc") {
      withScore.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === "name-asc") {
      withScore.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    } else if (sortBy === "status-availability") {
      const scoreStatus = (s) =>
        s.status === "Available" ? 0 : s.status === "Busy" ? 1 : 2;
      withScore.sort((a, b) => scoreStatus(a) - scoreStatus(b));
    }

    const topN = 3;

    return withScore.map((s, idx) => ({
      ...s,
      rankMeta: {
        score: s.__rankScore,
        isTop: idx < topN,
      },
    }));
  }, [mergedFilteredServices, sortBy]);

  const visibleServices = rankedServices.slice(0, visibleCount);
  const canLoadMore = visibleCount < rankedServices.length;

  const fadeIn = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 },
  };

  const stagger = {
    visible: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const totalPublicServices = allServicesForMeta.length;

  return (
    <div className="home-page">
      <style>{`
        .home-page {
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          min-height: 100vh;
        }

        .hero-section {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
          padding: 100px 0 80px;
          position: relative;
          overflow: hidden;
        }

        .hero-section::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml,<svg width="60" height="60" xmlns="http://www.w3.org/2000/svg"><circle cx="30" cy="30" r="1.5" fill="rgba(255,255,255,0.1)"/></svg>');
          opacity: 0.4;
        }

        .hero-section::after {
          content: '';
          position: absolute;
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
          top: -300px;
          right: -300px;
          border-radius: 50%;
        }

        .hero-content {
          position: relative;
          z-index: 1;
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.2);
          padding: 8px 20px;
          border-radius: 50px;
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 24px;
          backdrop-filter: blur(10px);
        }

        .hero-title {
          font-size: 64px;
          font-weight: 900;
          margin-bottom: 20px;
          letter-spacing: -1.5px;
          line-height: 1.1;
        }

        .hero-subtitle {
          font-size: 20px;
          opacity: 0.95;
          max-width: 600px;
          margin: 0 auto 40px;
          line-height: 1.6;
        }

        .search-container {
          max-width: 700px;
          margin: 0 auto 24px;
          position: relative;
        }

        .search-wrapper {
          position: relative;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
        }

        .search-icon {
          position: absolute;
          left: 24px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 20px;
          color: #64748b;
          z-index: 1;
        }

        .search-input {
          width: 100%;
          padding: 20px 24px 20px 60px;
          font-size: 16px;
          border: none;
          border-radius: 16px;
          background: white;
          transition: all 0.3s ease;
        }

        .search-input:focus {
          outline: none;
          box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.3);
        }

        .recent-searches {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          justify-content: center;
          margin-top: 20px;
        }

        .recent-chip {
          display: inline-flex;
          align-items: center;
          padding: 8px 18px;
          border-radius: 50px;
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: white;
          font-size: 14px;
          cursor: pointer;
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(10px);
          transition: all 0.3s ease;
        }

        .recent-chip:hover {
          background: rgba(255, 255, 255, 0.25);
          transform: translateY(-2px);
        }

        .stats-section {
          background: white;
          margin-top: -60px;
          position: relative;
          z-index: 10;
          border-radius: 24px;
          padding: 40px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 30px;
        }

        .stat-item {
          text-align: center;
        }

        .stat-number {
          font-size: 48px;
          font-weight: 800;
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          display: block;
          margin-bottom: 8px;
        }

        .stat-label {
          font-size: 14px;
          color: #64748b;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .filters-section {
          margin-top: 60px;
        }

        .filters-card {
          background: white;
          border-radius: 20px;
          padding: 32px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
          margin-bottom: 40px;
        }

        .filters-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .filters-title {
          font-size: 20px;
          font-weight: 700;
          color: #0f172a;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .toggle-filters-btn {
          background: #f1f5f9;
          border: none;
          padding: 10px 20px;
          border-radius: 50px;
          font-size: 14px;
          font-weight: 600;
          color: #0f172a;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .toggle-filters-btn:hover {
          background: #e2e8f0;
        }

        .services-section {
          padding: 20px 0 80px;
        }

        .results-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
          flex-wrap: wrap;
          gap: 16px;
        }

        .results-text {
          font-size: 16px;
          color: #64748b;
        }

        .results-count {
          font-weight: 700;
          color: #0f172a;
        }

        .load-more-container {
          text-align: center;
          margin-top: 48px;
        }

        .load-more-btn {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
          border: none;
          padding: 16px 48px;
          font-size: 16px;
          font-weight: 700;
          border-radius: 50px;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 8px 16px rgba(59, 130, 246, 0.3);
          display: inline-flex;
          align-items: center;
          gap: 10px;
        }

        .load-more-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 24px rgba(59, 130, 246, 0.4);
        }

        .trending-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: white;
          padding: 6px 14px;
          border-radius: 50px;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        @media (max-width: 768px) {
          .hero-title {
            font-size: 40px;
          }

          .hero-subtitle {
            font-size: 16px;
          }

          .stats-section {
            padding: 24px;
            margin-top: -40px;
          }

          .stat-number {
            font-size: 36px;
          }

          .filters-card {
            padding: 20px;
          }
        }

        .verified-toggle-btn {
          background: #e0f2fe;
          border: none;
          padding: 10px 18px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 600;
          color: #0369a1;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 6px;
          margin-left: 8px;
        }

        .verified-toggle-btn:hover {
          background: #bae6fd;
        }

        .verified-toggle-btn-active {
          background: #0369a1;
          color: #ffffff;
        }
      `}</style>

      <div className="hero-section">
        <div className="container">
          <motion.div
            className="hero-content text-center"
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <span className="hero-badge">
                <FaFire />
                Trusted by 10,000+ customers
              </span>
            </motion.div>

            <motion.h1
              className="hero-title"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              Discover Local Services
            </motion.h1>

            <motion.p
              className="hero-subtitle"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              Find trusted electricians, plumbers, tutors, mechanics and home
              services near you — all in one place.
            </motion.p>

            <motion.div
              className="search-container"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="search-wrapper">
                <FaSearch className="search-icon" />
                <input
                  className="search-input"
                  placeholder="Search for services, categories, or locations..."
                  value={search}
                  onChange={handleSearchChange}
                  onKeyDown={handleSearchKeyDown}
                />
              </div>

              {recentSearches.length > 0 && (
                <div className="recent-searches">
                  <span
                    style={{
                      color: "rgba(255,255,255,0.9)",
                      fontSize: "14px",
                      marginRight: "8px",
                    }}
                  >
                    Recent:
                  </span>
                  {recentSearches.map((term) => (
                    <button
                      key={term}
                      type="button"
                      className="recent-chip"
                      onClick={() => handleRecentClick(term)}
                    >
                      {term}
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        </div>
      </div>

      <div className="container">
        <motion.div
          className="stats-section"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-number">{totalPublicServices}+</span>
              <span className="stat-label">Service Providers</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">50+</span>
              <span className="stat-label">Categories</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">100+</span>
              <span className="stat-label">Cities Covered</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">4.8</span>
              <span className="stat-label">Average Rating</span>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="container filters-section">
        <motion.div
          className="filters-card"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="filters-header">
            <h2 className="filters-title">
              <FaFilter />
              Filter & Sort Services
            </h2>

            <div style={{ display: "flex", alignItems: "center" }}>
              <button
                className="toggle-filters-btn"
                onClick={() => setShowFilters(!showFilters)}
              >
                {showFilters ? "Hide Filters" : "Show Filters"}
                <FaChevronDown
                  style={{
                    transform: showFilters ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.3s ease",
                  }}
                />
              </button>

              <button
                type="button"
                className={
                  "verified-toggle-btn" +
                  (showVerifiedOnly ? " verified-toggle-btn-active" : "")
                }
                onClick={() => setShowVerifiedOnly((prev) => !prev)}
              >
                {showVerifiedOnly ? "Showing Verified Only" : "Verified Services"}
              </button>
            </div>
          </div>

          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
            >
              <ServiceFilters
                search={search}
                setSearch={setSearch}
                filters={filters}
                updateFilter={updateFilter}
                onReset={() => {
                  resetFilters();
                  setVisibleCount(9);
                  setShowVerifiedOnly(false);
                }}
                totalCount={totalPublicServices}
                visibleCount={rankedServices.length}
                categories={categories}
                locations={locations}
                availabilities={availabilities}
                showFavoritesToggle={true}
                showSearch={false}
                showSort={true}
                sortBy={sortBy}
                setSortBy={setSortBy}
              />
            </motion.div>
          )}
        </motion.div>
      </div>

      <div className="services-section">
        <div className="container">
          {loading && <Loading />}

          {!loading && error && (
            <div className="alert alert-danger">
              <strong>Error:</strong> {error}
              <br />
              Please refresh the page to try again.
            </div>
          )}

          {!loading && !error && rankedServices.length === 0 && <EmptyState />}

          {!loading && !error && rankedServices.length > 0 && (
            <>
              <div className="results-info">
                <p className="results-text">
                  Showing <span className="results-count">{visibleServices.length}</span> of{" "}
                  <span className="results-count">{rankedServices.length}</span> services
                </p>
                {rankedServices.length > 20 && (
                  <span className="trending-badge">
                    <FaFire />
                    Trending Now
                  </span>
                )}
              </div>

              <motion.div
                className="row g-4"
                initial="hidden"
                animate="visible"
                variants={stagger}
              >
                {visibleServices.map((service) => (
                  <motion.div
                    key={service.id}
                    className="col-md-6 col-lg-4"
                    variants={fadeIn}
                    transition={{ duration: 0.4 }}
                  >
                    <ServiceCard
                      service={service}
                      rankMeta={service.rankMeta}
                      isFavorite={favoriteIds.includes(service.id)}
                      onToggleFavorite={() => toggleFavorite(service.id)}
                      isLoggedIn={isLoggedIn}
                    />
                  </motion.div>
                ))}
              </motion.div>

              {canLoadMore && (
                <motion.div
                  className="load-more-container"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <button
                    className="load-more-btn"
                    onClick={() => setVisibleCount((prev) => prev + 9)}
                  >
                    Load More Services
                    <FaChevronDown />
                  </button>
                </motion.div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}