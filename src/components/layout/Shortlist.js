// src/components/pages/Shortlist.jsx
import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { useServiceDiscovery } from "../../hooks/useServiceDiscovery";
import ServiceFilters from "../service/ServiceFilters";
import ServiceCard from "../service/ServiceCard";
import Loading from "../states/Loading";

function Shortlist() {
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

  // ✅ Always show only favourites on this page
  useEffect(() => {
    if (!filters.onlyFavorites) {
      updateFilter("onlyFavorites", true);
    }
  }, [filters.onlyFavorites, updateFilter]);

  const categories = ["all", ...new Set(services.map((s) => s.category))];
  const locations = ["all", ...new Set(services.map((s) => s.location))];
  const availabilities = ["all", "Available", "Busy", "Offline"];

  // show loader only on first load
  const isInitialLoading = loading && services.length === 0;

  // ---------- animations ----------
  const fadeInUp = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0 },
  };

  const stagger = {
    hidden: {},
    visible: {
      transition: { staggerChildren: 0.08 },
    },
  };

  return (
    <main className="shortlist-layout">
      <style>{`
        .shortlist-layout {
          min-height: 100vh;
          background: #f3f4f6;
        }

        /* Full-width blue hero (background is static) */
        .shortlist-hero {
          width: 100%;
         background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: #ffffff;
          padding: 56px 0 40px;
          height: 250px;
        }

        .shortlist-hero-inner {
          max-width: 1120px;
          margin: 0 auto;
          padding: 0 24px;

        }

        .shortlist-title {
          font-size: 32px;
          font-weight: 800;
          letter-spacing: -0.03em;
          margin-bottom: 8px;
        }

        .shortlist-subtitle {
          font-size: 15px;
          max-width: 520px;
        }

        /* Main panel (white card like other pages) */
        .shortlist-body-wrapper {
          max-width: 1250px;
           margin: -60px auto 50px;
          padding: 0 24px 40px;
        }

        .shortlist-panel {
          background: #ffffff;
          border-radius: 24px;
          padding: 24px 24px 28px;
          box-shadow: 0 22px 50px rgba(15, 23, 42, 0.18);
        }

        /* inside panel: space for results */
        .shortlist-panel .results {
          margin-top: 18px;
        }

        /* keep existing grid style, just small tweak if needed */
        .shortlist-panel .results__grid {
          margin-top: 8px;
        }

        @media (max-width: 768px) {
          .shortlist-title {
            font-size: 26px;
          }
          .shortlist-hero-inner {
            padding: 0 16px;
          }
          .shortlist-body-wrapper {
            padding: 0 16px 32px;
          }
          .shortlist-panel {
            padding: 18px 16px 22px;
          }
        }
      `}</style>

      {/* HERO – background is static, only inner content is animated */}
      <section className="shortlist-hero">
        <motion.div
          className="shortlist-hero-inner"
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          transition={{ duration: 0.45 }}
        >
          <h1 className="shortlist-title">My Shortlisted Services</h1>
          <p className="shortlist-subtitle">
            All services you&apos;ve marked as favourites in one place.
          </p>
        </motion.div>
      </section>

      {/* BODY – white card with filters + list */}
      <div className="shortlist-body-wrapper">
        <motion.div
          className="shortlist-panel"
          initial="hidden"
          animate="visible"
          variants={stagger}
        >
          {/* FILTERS (professional look inside the card) */}
          <motion.div variants={fadeInUp}>
            <ServiceFilters
              search={search}
              setSearch={setSearch}
              filters={filters}
              updateFilter={updateFilter}
              onReset={resetFilters}
              totalCount={totalCount}
              visibleCount={filteredServices.length}
              categories={categories}
              locations={locations}
              availabilities={availabilities}
              showFavoritesToggle={false}
            />
          </motion.div>

          {/* INITIAL LOADING */}
          {isInitialLoading && (
            <motion.div
              variants={fadeInUp}
              style={{ marginTop: "24px" }}
            >
              <Loading />
            </motion.div>
          )}

          {/* ERROR */}
          {!isInitialLoading && error && (
            <motion.div
              className="state state--error"
              variants={fadeInUp}
            >
              <p>{error}</p>
              <p>Please refresh the page to try again.</p>
            </motion.div>
          )}

          {/* EMPTY */}
          {!isInitialLoading && !error && filteredServices.length === 0 && (
            <motion.div
              className="state state--empty"
              variants={fadeInUp}
            >
              <h2>No favourites yet</h2>
              <p>
                Go back to the main services page and tap the heart icon to
                shortlist providers you like.
              </p>
            </motion.div>
          )}

          {/* RESULTS */}
          {!isInitialLoading && !error && filteredServices.length > 0 && (
            <section className="results" aria-live="polite">
              <motion.div
                className="results__grid"
                variants={stagger}
              >
                {filteredServices.map((service) => (
                  <motion.div key={service.id} variants={fadeInUp}>
                    <ServiceCard
                      service={service}
                      isFavorite={favoriteIds.includes(service.id)}
                      onToggleFavorite={() => toggleFavorite(service.id)}
                    />
                  </motion.div>
                ))}
              </motion.div>
            </section>
          )}
        </motion.div>
      </div>
    </main>
  );
}

export default Shortlist;