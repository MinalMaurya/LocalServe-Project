// src/hooks/useServiceDiscovery.js
import { useEffect, useMemo, useState } from "react";
import servicesData from "../data/services.json";

const LS_KEY_FAVORITES = "local-service-discovery:favorites";

export function useServiceDiscovery() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    category: "all",
    location: "all",
    availability: "all",
    onlyFavorites: false,
    onlyVerified: false, // ✅ new
  });

  const [favoriteIds, setFavoriteIds] = useState(() => {
    try {
      const stored = localStorage.getItem(LS_KEY_FAVORITES);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Fake loading + "fetch"
  useEffect(() => {
    setLoading(true);
    setError(null);

    const timer = setTimeout(() => {
      try {
        setServices(servicesData);
        setLoading(false);
      } catch (e) {
        console.error(e);
        setError("Something went wrong while loading services.");
        setLoading(false);
      }
    }, ); // 0.9s fake delay

    return () => clearTimeout(timer);
  }, []);

  // Persist favourites
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY_FAVORITES, JSON.stringify(favoriteIds));
    } catch {
      // ignore
    }
  }, [favoriteIds]);

  const toggleFavorite = (id) => {
    setFavoriteIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({
      category: "all",
      location: "all",
      availability: "all",
      onlyFavorites: false,
      onlyVerified: false,
    });
    setSearch("");
  };

  const filteredServices = useMemo(() => {
    const query = search.trim().toLowerCase();

    return services.filter((service) => {
      // favourites
      if (filters.onlyFavorites && !favoriteIds.includes(service.id)) {
        return false;
      }

      // verified only
      if (filters.onlyVerified && !service.verified) {
        return false;
      }

      // category
      if (filters.category !== "all" && service.category !== filters.category) {
        return false;
      }

      // location
      if (filters.location !== "all" && service.location !== filters.location) {
        return false;
      }

      // availability (maps to service.status)
      if (
        filters.availability !== "all" &&
        service.status !== filters.availability
      ) {
        return false;
      }

      if (!query) return true;

      const haystack =
        `${service.name} ${service.category} ${service.location}`.toLowerCase();

      return haystack.includes(query);
    });
  }, [services, search, filters, favoriteIds]);

  return {
    services,
    filteredServices,
    totalCount: services.length,
    loading,
    error,
    search,
    setSearch,
    filters,
    updateFilter,
    favoriteIds,
    toggleFavorite,
    resetFilters,
  };
}