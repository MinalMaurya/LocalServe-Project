// src/utils/getMergedServices.js
import servicesData from "../data/services.json";

const VENDOR_SERVICES_KEY = "local-service-discovery:vendor-services";
const ADMIN_STATE_KEY =
  "local-service-discovery:admin-service-state";

export function getMergedServicesForUser() {
  // 1) Static services from JSON
  const staticServices = (servicesData || []).map((s) => ({
    ...s,
    source: "static",
  }));

  // 2) Dynamic vendor services from localStorage
  let vendorServices = [];
  try {
    vendorServices =
      JSON.parse(localStorage.getItem(VENDOR_SERVICES_KEY) || "[]") || [];
  } catch {
    vendorServices = [];
  }
  vendorServices = vendorServices.map((s) => ({
    ...s,
    source: "vendor",
  }));

  // 3) Admin overrides
  let adminState = {};
  try {
    adminState =
      JSON.parse(localStorage.getItem(ADMIN_STATE_KEY) || "{}") || {};
  } catch {
    adminState = {};
  }

  // 4) Apply admin overrides to each service
  const applyAdmin = (service) => {
    // IMPORTANT: id must match how you store in admin (`vendor:${id}`)
    const key = `vendor:${service.id}`;
    const override = adminState[key] || {};

    const status = override.status || service.status || "approved"; 
    const removed = !!override.removed;

    const isVerified =
      override.isVerified ??
      service.isVerified ??
      service.verified ??
      false;

    return {
      ...service,
      status,
      removed,
      isVerified,
    };
  };

  // 5) Merge, apply overrides, then filter OUT rejected/removed for users
  const allServices = [...staticServices, ...vendorServices]
    .map(applyAdmin)
    .filter((s) => !s.removed && s.status !== "rejected");

  return allServices;
}