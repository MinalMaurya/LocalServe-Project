
import { useEffect, useMemo, useState } from "react";
import servicesData from "../data/services.json";

const LS_KEY_FAVORITES = "local-service-discovery:favorites";
const LS_KEY_ADMIN_OVERRIDES = "local-service-discovery:admin-services";

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
    onlyVerified: false,
  });

  const [favoriteIds, setFavoriteIds] = useState(() => {
    try {
      const stored = localStorage.getItem(LS_KEY_FAVORITES);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });


  const loadServices = () => {
    try {
      // 1) start from static JSON
      const base = servicesData.map((s) => ({
        ...s,
    
        approved: s.approved ?? true,
        removed: s.removed ?? false,
        verified: s.verified ?? false,
      }));

    
      let overrides = [];
      try {
        overrides =
          JSON.parse(localStorage.getItem(LS_KEY_ADMIN_OVERRIDES) || "[]") ||
          [];
      } catch {
        overrides = [];
      }

      const merged = base.map((svc) => {
        const ov = overrides.find((o) => o.id === svc.id);
        return ov ? { ...svc, ...ov } : svc;
      });

      setServices(merged);
      setLoading(false);
    } catch (e) {
      console.error(e);
      setError("Something went wrong while loading services.");
      setLoading(false);
    }
  };
  useEffect(() => {
    setLoading(true);
    setError(null);

    const timer = setTimeout(() => {
      loadServices();
    }, 900); 

    return () => clearTimeout(timer);
  }, []);

  const refreshServices = () => {
    setLoading(true);
    loadServices();
  };
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY_FAVORITES, JSON.stringify(favoriteIds));
    } catch {

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
      if (service.removed) return false;
      if (service.approved === false) return false;


      if (filters.onlyFavorites && !favoriteIds.includes(service.id)) {
        return false;
      }

      // verified-only
      if (filters.onlyVerified && !service.verified) {
        return false;
      }

      // category
      if (filters.category !== "all" && service.category !== filters.category) {
        return false;
      }


      if (filters.location !== "all" && service.location !== filters.location) {
        return false;
      }

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
    refreshServices, 
  };
}