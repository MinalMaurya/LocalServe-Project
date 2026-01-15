// src/components/pages/Home.jsx
import React, { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FaSearch,
  FaFire,
  FaChevronDown,
  FaFilter,
} from "react-icons/fa";
import { Link } from "react-router-dom";

import { useServiceDiscovery } from "../../hooks/useServiceDiscovery";
import ServiceCard from "../service/ServiceCard";
import ServiceFilters from "../service/ServiceFilters";
import Loading from "../states/Loading";
import EmptyState from "../states/EmptyState";

const RECENT_SEARCH_KEY = "local-service-discovery:recent-searches";
const VENDOR_SERVICES_KEY = "local-service-discovery:vendor-services";

export default function Home() {
  const {
    services,
    filteredServices,
    totalCount,
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

  // 🔐 Login state
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem("isLoggedIn") === "true";
  });

  // keep it in sync if login changes in another tab / somewhere else
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
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(RECENT_SEARCH_KEY) || "[]");
    } catch {
      return [];
    }
  });

  // Load recent searches
  useEffect(() => {
    try {
      localStorage.setItem(RECENT_SEARCH_KEY, JSON.stringify(recentSearches));
    } catch {
      // ignore
    }
  }, [recentSearches]);

  // 🔹 Load dynamic vendor services from localStorage once
  useEffect(() => {
    try {
      const stored =
        JSON.parse(localStorage.getItem(VENDOR_SERVICES_KEY) || "[]") || [];
      setVendorServices(stored);
    } catch {
      setVendorServices([]);
    }
  }, []);

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

  // For filter dropdowns, include both static & dynamic services
  const allServicesForMeta = useMemo(
    () => [...services, ...vendorServices],
    [services, vendorServices]
  );

  const categories = [
    "all",
    ...new Set(allServicesForMeta.map((s) => s.category)),
  ];
  const locations = [
    "all",
    ...new Set(allServicesForMeta.map((s) => s.location)),
  ];
  const availabilities = ["all", "Available", "Busy", "Offline"];

  // 🔹 Apply search + filters also to vendorServices so behavior is consistent
  const dynamicFiltered = useMemo(() => {
    const term = search.trim().toLowerCase();

    return vendorServices.filter((s) => {
      // Search filter
      if (term) {
        const text = `${s.name || ""} ${s.category || ""} ${
          s.location || ""
        }`.toLowerCase();
        if (!text.includes(term)) return false;
      }

      // Category filter
      if (filters.category && filters.category !== "all") {
        if ((s.category || "").toLowerCase() !== filters.category.toLowerCase())
          return false;
      }

      // Location filter
      if (filters.location && filters.location !== "all") {
        if ((s.location || "").toLowerCase() !== filters.location.toLowerCase())
          return false;
      }

      // Availability / status filter (if present)
      if (filters.availability && filters.availability !== "all") {
        if (!s.status || s.status !== filters.availability) return false;
      }

      // Favorites-only filter
      if (filters.showFavoritesOnly && !favoriteIds.includes(s.id)) {
        return false;
      }

      return true;
    });
  }, [vendorServices, search, filters, favoriteIds]);

  // 🔹 Merge static filteredServices + dynamicFiltered
  const mergedFilteredServices = useMemo(
    () => [...filteredServices, ...dynamicFiltered],
    [filteredServices, dynamicFiltered]
  );

  // Recommended services uses merged list & verified vendors (if you show them somewhere)
  const recommendedServices = useMemo(() => {
    const mergedAll = [...services, ...vendorServices];
    return mergedAll
      .filter((s) => favoriteIds.includes(s.id) && (s.isVerified || s.verified))
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 3);
  }, [services, vendorServices, favoriteIds]);

  // Sorting now works on merged filtered list
  const sortedServices = useMemo(() => {
    const list = [...mergedFilteredServices];

    switch (sortBy) {
      case "rating-desc":
        return list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      case "name-asc":
        return list.sort((a, b) => a.name.localeCompare(b.name));
      case "status-availability":
        const score = (s) =>
          s.status === "Available" ? 0 : s.status === "Busy" ? 1 : 2;
        return list.sort((a, b) => score(a) - score(b));
      case "relevance":
      default:
        return list;
    }
  }, [mergedFilteredServices, sortBy]);

  const visibleServices = sortedServices.slice(0, visibleCount);
  const canLoadMore = visibleCount < sortedServices.length;

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

        .section-header {
          margin-bottom: 32px;
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

        .public-header {
          width: 100%;
          background: #ffffff;
          border-bottom: 1px solid #e2e8f0;
          position: sticky;
          top: 0;
          z-index: 50;
        }

        .public-header-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 0;
        }

        .public-logo {
          font-size: 20px;
          font-weight: 800;
          color: #1e293b;
          letter-spacing: 0.03em;
        }

        .public-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .public-link {
          font-size: 14px;
          color: #475569;
          text-decoration: none;
          font-weight: 600;
        }

        .public-link:hover {
          color: #1d4ed8;
        }

        .public-cta {
          padding: 8px 18px;
          border-radius: 999px;
          border: none;
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: #ffffff;
          font-size: 14px;
          font-weight: 700;
          text-decoration: none;
          box-shadow: 0 8px 16px rgba(37,99,235,0.25);
        }

        .public-cta:hover {
          filter: brightness(1.05);
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
              <span className="stat-number">
                {totalCount + vendorServices.length}+
              </span>
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
                }}
                totalCount={totalCount + vendorServices.length}
                visibleCount={sortedServices.length}
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

      {/* SERVICES SECTION */}
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

          {!loading && !error && sortedServices.length === 0 && <EmptyState />}

          {!loading && !error && sortedServices.length > 0 && (
            <>
              <div className="results-info">
                <p className="results-text">
                  Showing{" "}
                  <span className="results-count">
                    {visibleServices.length}
                  </span>{" "}
                  of{" "}
                  <span className="results-count">
                    {sortedServices.length}
                  </span>{" "}
                  services
                </p>
                {sortedServices.length > 20 && (
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
                    onClick={() =>
                      setVisibleCount((prev) => prev + 9)
                    }
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