import React from "react";

export default function ServiceFilters({
  search,
  setSearch,
  filters,
  updateFilter,
  onReset,
  totalCount,
  visibleCount,
  categories = [],
  locations = [],
  availabilities = [],
  showFavoritesToggle = true,
  showSearch = true,
  showSort = false,
  sortBy,
  setSortBy,
}) {
  const handleSelectChange = (key) => (e) => {
    updateFilter(key, e.target.value);
  };

  const handleCheckboxChange = (key) => (e) => {
    updateFilter(key, e.target.checked);
  };

  return (
    <div>
      {showSearch && setSearch && (
        <div className="mb-3">
          <label className="form-label small fw-semibold">Search</label>
          <input
            type="text"
            className="form-control form-control-sm"
            placeholder="Search by name, category, location"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      )}
      <div className="row g-3 align-items-end mb-2">
        <div className="col-md-3">
          <label className="form-label small fw-semibold">Category</label>
          <select
            className="form-select form-select-sm"
            value={filters.category}
            onChange={handleSelectChange("category")}
          >
            <option value="all">All categories</option>
            {categories
              .filter((c) => c !== "all")
              .map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
          </select>
        </div>
        <div className="col-md-3">
          <label className="form-label small fw-semibold">Location</label>
          <select
            className="form-select form-select-sm"
            value={filters.location}
            onChange={handleSelectChange("location")}
          >
            <option value="all">All locations</option>
            {locations
              .filter((l) => l !== "all")
              .map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
          </select>
        </div>
        <div className="col-md-3">
          <label className="form-label small fw-semibold">Availability</label>
          <select
            className="form-select form-select-sm"
            value={filters.availability}
            onChange={handleSelectChange("availability")}
          >
            {availabilities.map((a) => (
              <option key={a} value={a}>
                {a === "all" ? "All statuses" : a}
              </option>
            ))}
          </select>
        </div>
        {showSort && setSortBy && (
          <div className="col-md-3">
            <label className="form-label small fw-semibold">Sort by</label>
            <select
              className="form-select form-select-sm"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="relevance">Relevance</option>
              <option value="rating-desc">Rating (high to low)</option>
              <option value="name-asc">Name (A–Z)</option>
              <option value="status-availability">
                Availability (Available first)
              </option>
            </select>
          </div>
        )}
        {!showSort && <div className="col-md-3 d-none d-md-block" />}
      </div>
      <div className="row g-3 align-items-center">
        <div className="col-md-6">
          <div className="d-flex flex-wrap gap-3">
            {showFavoritesToggle && (
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="onlyFavoritesSwitch"
                  checked={filters.onlyFavorites}
                  onChange={handleCheckboxChange("onlyFavorites")}
                />
                <label
                  className="form-check-label small"
                  htmlFor="onlyFavoritesSwitch"
                >
                  Show only favourites
                </label>
              </div>
            )}

            <div className="form-check form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                id="onlyVerifiedSwitch"
                checked={filters.onlyVerified}
                onChange={handleCheckboxChange("onlyVerified")}
              />
              <label
                className="form-check-label small"
                htmlFor="onlyVerifiedSwitch"
              >
                Show only verified
              </label>
            </div>
          </div>
        </div>

        <div className="col-md-6 text-md-end">
          <p className="small text-muted mb-1">
            Showing <strong>{visibleCount}</strong> of{" "}
            <strong>{totalCount}</strong> services
          </p>
          {onReset && (
            <button
              type="button"
              className="btn btn-link btn-sm text-decoration-none"
              onClick={onReset}
            >
              Reset filters
            </button>
          )}
        </div>
      </div>
    </div>
  );
}