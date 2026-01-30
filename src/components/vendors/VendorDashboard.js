
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaUserTie,
  FaMapMarkerAlt,
  FaInbox,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaStar,
  FaPhoneAlt,
} from "react-icons/fa";

import servicesData from "../../data/services.json";
import PerformanceAnalyticsModal from "../Admin/AdminAnalyticsOverview"; 

const VENDOR_SESSION_KEY = "local-service-discovery:vendor-session";
const CONTACT_KEY = "local-service-discovery:contact-requests";
const VENDOR_PROFILE_KEY = "local-service-discovery:vendor-profiles";
const VENDOR_REVIEWS_KEY = "local-service-discovery:vendor-reviews";
const VENDOR_SERVICES_KEY = "local-service-discovery:vendor-services";

const VENDOR_ACTIVITY_KEY = "local-service-discovery:vendor-activity-log";
const VENDOR_IMAGES_KEY = "local-service-discovery:vendor-service-images";

const safeParse = (raw, fallback) => {
  try {
    const v = JSON.parse(raw);
    return v ?? fallback;
  } catch {
    return fallback;
  }
};

const getRequestStatus = (r) =>
  (r.status || r.requestStatus || "pending").toLowerCase();

const makeId = () =>
  `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const formatDT = (isoOrDate) => {
  const d = new Date(isoOrDate);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString();
};

const loadActivityStore = () =>
  safeParse(localStorage.getItem(VENDOR_ACTIVITY_KEY) || "{}", {});

const saveActivityStore = (store) => {
  localStorage.setItem(VENDOR_ACTIVITY_KEY, JSON.stringify(store));
};

const readActivityForService = (serviceId) => {
  const store = loadActivityStore();
  return Array.isArray(store?.[String(serviceId)]) ? store[String(serviceId)] : [];
};

const writeActivityForService = (serviceId, entries) => {
  const store = loadActivityStore();
  store[String(serviceId)] = entries;
  saveActivityStore(store);
};

const addActivity = (serviceId, entry) => {
  const existing = readActivityForService(serviceId);
  const next = [entry, ...existing].slice(0, 200); // keep last 200
  writeActivityForService(serviceId, next);
  return next;
};

const loadImagesStore = () =>
  safeParse(localStorage.getItem(VENDOR_IMAGES_KEY) || "{}", {});

const saveImagesStore = (store) => {
  localStorage.setItem(VENDOR_IMAGES_KEY, JSON.stringify(store));
};

const readImagesForService = (serviceId) => {
  const store = loadImagesStore();
  const arr = store?.[String(serviceId)];
  if (!Array.isArray(arr)) return [null, null, null];
  return [arr?.[0] ?? null, arr?.[1] ?? null, arr?.[2] ?? null];
};

const writeImagesForService = (serviceId, images3) => {
  const store = loadImagesStore();
  store[String(serviceId)] = images3;
  saveImagesStore(store);
};

const resizeImageFileToDataURL = (file, maxW = 1200, maxH = 900, quality = 0.86) =>
  new Promise((resolve, reject) => {
    if (!file) return resolve(null);

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("file_read_failed"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("image_load_failed"));
      img.onload = () => {
        const w = img.width || 1;
        const h = img.height || 1;

        const scale = Math.min(maxW / w, maxH / h, 1);
        const tw = Math.round(w * scale);
        const th = Math.round(h * scale);

        const canvas = document.createElement("canvas");
        canvas.width = tw;
        canvas.height = th;

        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("canvas_failed"));

        ctx.drawImage(img, 0, 0, tw, th);

        // Save as jpeg for size control
        const out = canvas.toDataURL("image/jpeg", quality);
        resolve(out);
      };
      img.src = String(reader.result || "");
    };

    reader.readAsDataURL(file);
  });

export default function VendorDashboard() {
  const navigate = useNavigate();

  const [authUser, setAuthUser] = useState(null);
  const [session, setSession] = useState(null);
  const [service, setService] = useState(null);

  // extended profile with location + branches
  const [profile, setProfile] = useState({
    companyName: "",
    phone: "",
    availability: "Available",
    description: "",
    primaryLocation: "",
    branches: "",
  });

  const [requests, setRequests] = useState([]);
  const [reviews, setReviews] = useState([]);

  
  const [activity, setActivity] = useState([]);
  const [toasts, setToasts] = useState([]);

  
  const [images3, setImages3] = useState([null, null, null]);

  const [publishedEntry, setPublishedEntry] = useState(null);
  const [openAnalytics, setOpenAnalytics] = useState(false);
  const vendorKey = authUser?.id || authUser?.email || null;

  const lastPublishedSnapRef = useRef(null);
  const lastReqSnapRef = useRef(null);
  const lastReqStatusMapRef = useRef({});

  const pushToast = useCallback((toast) => {
    const id = toast.id || makeId();
    const t = { ...toast, id };

    setToasts((prev) => [t, ...prev].slice(0, 3));

    window.setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
    }, toast.durationMs || 3800);
  }, []);

  const logAndToast = useCallback(
    (entry) => {
      if (!session?.serviceId) return;

      const full = {
        id: entry.id || makeId(),
        serviceId: session.serviceId,
        kind: entry.kind || "system", // admin | request | system
        title: entry.title || "Update",
        body: entry.body || "",
        status: entry.status || "info", // info | success | danger | warning
        createdAt: entry.createdAt || new Date().toISOString(),
        read: false,
      };

      const next = addActivity(session.serviceId, full);
      setActivity(next);

      // Toast popup
      pushToast({
        title: full.title,
        message: full.body,
        status: full.status,
      });
    },
    [pushToast, session?.serviceId]
  );

  const loadMineRequests = useCallback(
    (sess, svc) => {
      const allReq = safeParse(localStorage.getItem(CONTACT_KEY) || "[]", []);
      const mine = allReq
        .filter((r) => {
          if (r.serviceId != null) return r.serviceId === sess.serviceId;
          return r.id === sess.serviceId || r.name === svc?.name;
        })
        .map((r) => ({
          ...r,
          serviceId: r.serviceId ?? sess.serviceId,
          status: getRequestStatus(r),
        }))
        .sort((a, b) => new Date(b.time) - new Date(a.time));
      return mine;
    },
    []
  );

  const loadMineReviews = useCallback((sess) => {
    const allReviews = safeParse(localStorage.getItem(VENDOR_REVIEWS_KEY) || "[]", []);
    const mine = allReviews
      .filter((r) => r.serviceId === sess.serviceId)
      .sort((a, b) => {
        const ta = new Date(a.time || a.createdAt || a.date || 0).getTime();
        const tb = new Date(b.time || b.createdAt || b.date || 0).getTime();
        return (tb || 0) - (ta || 0);
      });
    return mine;
  }, []);

  const readPublishedForVendor = useCallback((serviceId) => {
    const list = safeParse(localStorage.getItem(VENDOR_SERVICES_KEY) || "[]", []);
    return list.find((x) => x?.id === serviceId) || null;
  }, []);

  const describeVendorState = (entry) => {
    if (!entry) return { state: "removed", label: "Removed" };

    const removed =
      entry.isRemoved === true ||
      String(entry.status || "").toLowerCase() === "removed" ||
      String(entry.adminStatus || "").toLowerCase() === "removed";

    if (removed) return { state: "removed", label: "Removed" };

    const verified = entry.isVerified === true;
    const vStatus =
      String(entry.verificationStatus || entry.adminStatus || "").toLowerCase();

    if (verified) return { state: "verified", label: "Verified" };
    if (vStatus === "rejected") return { state: "rejected", label: "Rejected" };
    if (vStatus === "pending") return { state: "pending", label: "Pending" };

    return { state: "pending", label: "Pending" };
  };

  useEffect(() => {
    try {
      const auth = safeParse(localStorage.getItem("authUser") || "null", null);
      setAuthUser(auth);

      if (!auth || auth.role !== "vendor") {
        setSession(null);
        return;
      }

      const storedSession = safeParse(localStorage.getItem(VENDOR_SESSION_KEY) || "null", null);

      const effectiveSession =
        storedSession || {
          vendorName: auth.name || auth.email,
          serviceId: auth.serviceId || 1,
        };

      localStorage.setItem(VENDOR_SESSION_KEY, JSON.stringify(effectiveSession));
      setSession(effectiveSession);
    } catch {
      setSession(null);
    }
  }, []);

  useEffect(() => {
    if (!session) return;

    const svc = servicesData.find((s) => s.id === session.serviceId);
    setService(svc || null);

    try {
      const allProfiles = safeParse(localStorage.getItem(VENDOR_PROFILE_KEY) || "{}", {});
      const p = allProfiles[String(session.serviceId)] || {};

      setProfile({
        companyName: p.companyName || svc?.name || "",
        phone: p.phone || svc?.phone || "",
        availability: p.availability || svc?.status || "Available",
        description:
          p.description ||
          "Describe your services, experience, coverage areas, and working hours.",
        primaryLocation: p.primaryLocation || svc?.location || "",
        branches: p.branches || "",
      });
    } catch {
      setProfile({
        companyName: svc?.name || "",
        phone: svc?.phone || "",
        availability: svc?.status || "Available",
        description:
          "Describe your services, experience, coverage areas, and working hours.",
        primaryLocation: svc?.location || "",
        branches: "",
      });
    }

    // initial requests/reviews
    try {
      const mineReq = loadMineRequests(session, svc);
      setRequests(mineReq);
    } catch {
      setRequests([]);
    }

    try {
      const mineRev = loadMineReviews(session);
      setReviews(mineRev);
    } catch {
      setReviews([]);
    }

    const existingLog = readActivityForService(session.serviceId).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    setActivity(existingLog);

    setImages3(readImagesForService(session.serviceId));

    const pub = readPublishedForVendor(session.serviceId);
    setPublishedEntry(pub);
    lastPublishedSnapRef.current = JSON.stringify(pub || null);

    const initialMine = loadMineRequests(session, svc);
    const map = {};
    initialMine.forEach((r) => {
      map[String(r.id)] = getRequestStatus(r);
    });
    lastReqStatusMapRef.current = map;

    const snap = JSON.stringify(
      initialMine.map((r) => `${r.id}__${r.time}__${getRequestStatus(r)}`)
    );
    lastReqSnapRef.current = snap;

    const unread = existingLog.filter((x) => !x.read);
    if (unread.length > 0) {
      const top = unread[0];
      pushToast({
        title: top.title,
        message: top.body,
        status: top.status,
        durationMs: 4200,
      });
    }
  }, [session, loadMineRequests, loadMineReviews, pushToast, readPublishedForVendor]);

  useEffect(() => {
    if (!session || !service) return;

    const refresh = () => {

      const pub = readPublishedForVendor(session.serviceId);
      setPublishedEntry(pub);

      const prevSnap = lastPublishedSnapRef.current;
      const nextSnap = JSON.stringify(pub || null);

      if (prevSnap != null && prevSnap !== nextSnap) {
        const prev = safeParse(prevSnap, null);
        const next = pub;

        const prevState = describeVendorState(prev);
        const nextState = describeVendorState(next);

        
        if (!prev && next) {
          logAndToast({
            kind: "admin",
            status: "info",
            title: "Profile received by admin",
            body: "Your service profile is now visible for admin review.",
          });
        } else if (prev && !next) {
          logAndToast({
            kind: "admin",
            status: "danger",
            title: "Service removed",
            body: "Admin removed your service from the public list.",
          });
        } else if (prevState.state !== nextState.state) {
          if (nextState.state === "verified") {
            logAndToast({
              kind: "admin",
              status: "success",
              title: "Verified ✅",
              body: "Admin verified your service. Customers can now see your verified badge.",
            });
          } else if (nextState.state === "rejected") {
            logAndToast({
              kind: "admin",
              status: "danger",
              title: "Verification rejected",
              body: "Admin rejected verification. Please update your profile details and try again.",
            });
          } else if (nextState.state === "pending") {
            logAndToast({
              kind: "admin",
              status: "warning",
              title: "Verification pending",
              body: "Your profile is pending admin verification.",
            });
          } else if (nextState.state === "removed") {
            logAndToast({
              kind: "admin",
              status: "danger",
              title: "Service removed",
              body: "Admin removed your service from the public list.",
            });
          }
        }
      }
      lastPublishedSnapRef.current = nextSnap;

      const mineReq = loadMineRequests(session, service);
      setRequests(mineReq);

      const prevReqSnap = lastReqSnapRef.current;
      const nextReqSnap = JSON.stringify(
        mineReq.map((r) => `${r.id}__${r.time}__${getRequestStatus(r)}`)
      );

      if (prevReqSnap != null && prevReqSnap !== nextReqSnap) {
     
        const prevKeys = new Set(safeParse(prevReqSnap, []).map(String));
        const nextKeys = new Set(safeParse(nextReqSnap, []).map(String));

        mineReq.forEach((r) => {
          const key = `${r.id}__${r.time}__${getRequestStatus(r)}`;
          if (!prevKeys.has(key)) {
           
            const st = getRequestStatus(r);
            const oldMap = lastReqStatusMapRef.current || {};
            const prevSt = oldMap[String(r.id)];

            if (!prevSt) {
              logAndToast({
                kind: "request",
                status: "info",
                title: "New customer request",
                body: `${r.customerName || "Customer"} sent a new request. (${formatDT(
                  r.time
                )})`,
              });
            } else if (prevSt !== st) {
              // status changed 
              const title =
                st === "accepted"
                  ? "Request accepted"
                  : st === "rejected"
                  ? "Request rejected"
                  : "Request updated";
              const status =
                st === "accepted" ? "success" : st === "rejected" ? "danger" : "warning";

              logAndToast({
                kind: "request",
                status,
                title,
                body: `${r.customerName || "Customer"} request is now ${st}. (${formatDT(
                  new Date().toISOString()
                )})`,
              });
            }
          }
        });

        // update last status map
        const map = {};
        mineReq.forEach((r) => {
          map[String(r.id)] = getRequestStatus(r);
        });
        lastReqStatusMapRef.current = map;
      }

      lastReqSnapRef.current = nextReqSnap;

      //reviews refresh 
      const mineRev = loadMineReviews(session);
      setReviews(mineRev);
    };

    const onStorage = (e) => {
      if (!e?.key) return;
      if (
        e.key === VENDOR_SERVICES_KEY ||
        e.key === CONTACT_KEY ||
        e.key === VENDOR_REVIEWS_KEY ||
        e.key === VENDOR_ACTIVITY_KEY
      ) {
        refresh();
        
        if (e.key === VENDOR_ACTIVITY_KEY) {
          const log = readActivityForService(session.serviceId);
          setActivity(log);
        }
      }
    };

    window.addEventListener("storage", onStorage);

    const t = window.setInterval(refresh, 2500); 
    return () => {
      window.removeEventListener("storage", onStorage);
      window.clearInterval(t);
    };
  }, [session, service, loadMineRequests, loadMineReviews, readPublishedForVendor, logAndToast]);

  const markAllRead = () => {
    if (!session) return;
    const current = readActivityForService(session.serviceId);
    const next = current.map((x) => ({ ...x, read: true }));
    writeActivityForService(session.serviceId, next);
    setActivity(next);
    pushToast({
      title: "Messages cleared",
      message: "All messages marked as read.",
      status: "info",
      durationMs: 2200,
    });
  };

  const markOneRead = (id) => {
    if (!session) return;
    const current = readActivityForService(session.serviceId);
    const next = current.map((x) => (x.id === id ? { ...x, read: true } : x));
    writeActivityForService(session.serviceId, next);
    setActivity(next);
  };

  const unreadCount = useMemo(
    () => activity.filter((x) => !x.read).length,
    [activity]
  );

  const verification = useMemo(() => {
    const st = describeVendorState(publishedEntry);
    return st;
  }, [publishedEntry]);

  const saveProfile = () => {
    if (!session) return;

    try {
      const allProfiles = safeParse(localStorage.getItem(VENDOR_PROFILE_KEY) || "{}", {});
      allProfiles[String(session.serviceId)] = { ...profile };
      localStorage.setItem(VENDOR_PROFILE_KEY, JSON.stringify(allProfiles));

      // publish/update vendor entry but DO NOT force verify here
      let published = safeParse(localStorage.getItem(VENDOR_SERVICES_KEY) || "[]", []);

      const existing = published.find((p) => p.id === session.serviceId);

      const entry = {
        id: session.serviceId,
        name: profile.companyName || service?.name || session.vendorName,
        category: service?.category || "Service provider",
        location: profile.primaryLocation || service?.location || "",
        phone: profile.phone || service?.phone || "",
        description:
          profile.description || service?.description || "Local service provider",
        
        isVerified: existing?.isVerified === true,
        verificationStatus: existing?.verificationStatus || (existing?.isVerified ? "verified" : "pending"),
        adminStatus: existing?.adminStatus || undefined,
        fromVendor: true,
      };

      const idx = published.findIndex((p) => p.id === entry.id);
      if (idx >= 0) published[idx] = { ...published[idx], ...entry };
      else published.push(entry);

      localStorage.setItem(VENDOR_SERVICES_KEY, JSON.stringify(published));
      setPublishedEntry(entry);

      // log + toast
      const msg =
        entry.isVerified === true
          ? "Profile saved. Your verification is already active."
          : "Profile saved. Admin verification is pending.";
      logAndToast({
        kind: "system",
        status: entry.isVerified ? "success" : "warning",
        title: "Profile saved",
        body: msg,
      });
    } catch {
      pushToast({
        title: "Save failed",
        message: "Could not save profile (localStorage error).",
        status: "danger",
      });
    }
  };

  const handleUpdateRequestStatus = (requestId, status) => {
    try {
      const allReq = safeParse(localStorage.getItem(CONTACT_KEY) || "[]", []);

      const updated = allReq.map((r) => {
        if (r.id !== requestId) return r;

        const normalised = status.toLowerCase(); 
        const pretty = normalised.charAt(0).toUpperCase() + normalised.slice(1);

        return {
          ...r,
          status: normalised,
          requestStatus: pretty,
          statusUpdatedAt: new Date().toISOString(),
        };
      });

      localStorage.setItem(CONTACT_KEY, JSON.stringify(updated));

      const mine = updated
        .filter((r) => {
          if (r.serviceId != null) return r.serviceId === session.serviceId;
          return r.id === session.serviceId || r.name === service?.name;
        })
        .map((r) => ({
          ...r,
          serviceId: r.serviceId ?? session.serviceId,
          status: getRequestStatus(r),
        }))
        .sort((a, b) => new Date(b.time) - new Date(a.time));

      setRequests(mine);

      const changed = mine.find((x) => x.id === requestId);
      if (changed) {
        const st = getRequestStatus(changed);
        logAndToast({
          kind: "request",
          status: st === "accepted" ? "success" : st === "rejected" ? "danger" : "info",
          title: st === "accepted" ? "Request accepted" : "Request rejected",
          body: `${changed.customerName || "Customer"} • ${formatDT(new Date().toISOString())}`,
        });
      }
    } catch {
      // ignore
    }
  };

  const handleUploadImage = async (slotIdx, file) => {
    if (!session) return;

    try {
      const dataUrl = await resizeImageFileToDataURL(file);
      const next = [...images3];
      next[slotIdx] = dataUrl;
      setImages3(next);
      writeImagesForService(session.serviceId, next);

      logAndToast({
        kind: "system",
        status: "success",
        title: "Image uploaded",
        body: `Gallery image ${slotIdx + 1} updated.`,
      });
    } catch {
      pushToast({
        title: "Upload failed",
        message: "Please try a smaller image (localStorage has limited space).",
        status: "danger",
      });
    }
  };

  const handleRemoveImage = (slotIdx) => {
    if (!session) return;
    const next = [...images3];
    next[slotIdx] = null;
    setImages3(next);
    writeImagesForService(session.serviceId, next);

    logAndToast({
      kind: "system",
      status: "info",
      title: "Image removed",
      body: `Gallery image ${slotIdx + 1} removed.`,
    });
  };

  
  const stats = useMemo(() => {
    const total = requests.length;
    const pending = requests.filter((r) => r.status === "pending").length;
    const accepted = requests.filter((r) => r.status === "accepted").length;
    const rejected = requests.filter((r) => r.status === "rejected").length;
    const urgent = requests.filter((r) => r.urgency === "Urgent").length;

    const avgRating =
      reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / (reviews.length || 1);

    return {
      total,
      pending,
      accepted,
      rejected,
      urgent,
      avgRating: reviews.length ? avgRating.toFixed(1) : null,
      reviewCount: reviews.length,
    };
  }, [requests, reviews]);

  // extra derived metrics for “Performance insights”
  const conversionRate =
    stats.total > 0 ? Math.round((stats.accepted / stats.total) * 100) : 0;
  const responseRate =
    stats.total > 0
      ? Math.round(((stats.accepted + stats.rejected) / stats.total) * 100)
      : 0;
  const pendingShare = stats.total > 0 ? Math.round((stats.pending / stats.total) * 100) : 0;

  // ----------------- DERIVED HERO TEXT -----------------
  const vendorName =
    session?.vendorName || authUser?.name || authUser?.email || "Vendor";
  const companyName = profile.companyName || service?.name || "Your business";
  const category = service?.category || "Service provider";
  const city = profile.primaryLocation || service?.location || "Your city";

  // ----------------- STYLES -----------------
  const styles = `
@keyframes fadeSlideDown {
  from { opacity: 0; transform: translateY(-10px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes fadeSlideUp {
  from { opacity: 0; transform: translateY(18px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes fadeInSoft {
  from { opacity: 0; transform: translateY(10px) scale(0.98); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

/* ✅ Toast animations (nice popup, not browser alerts) */
@keyframes toastIn {
  from { opacity: 0; transform: translateX(12px) translateY(-6px); }
  to   { opacity: 1; transform: translateX(0) translateY(0); }
}
@keyframes toastOut {
  from { opacity: 1; transform: translateX(0) translateY(0); }
  to   { opacity: 0; transform: translateX(12px) translateY(-6px); }
}

.vendor-animate-hero { animation: fadeSlideDown 0.6s ease-out forwards; }
.vendor-animate-hero-delay {
  animation: fadeSlideDown 0.7s ease-out forwards;
  animation-delay: 0.08s;
}
.vendor-animate-card { animation: fadeInSoft 0.5s ease-out forwards; }
.vendor-animate-card-right {
  animation: fadeInSoft 0.55s ease-out forwards;
  animation-delay: 0.05s;
}

/* PAGE WRAPPER */
.vendor-page {
  width: 100%;
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  padding-bottom: 60px;
  padding-top: 0;
  box-sizing: border-box;
}

/* ✅ Toast container */
.vendor-toast-wrap {
  position: fixed;
  top: 18px;
  right: 18px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: min(360px, calc(100vw - 36px));
}
.vendor-toast {
  background: #ffffff;
  border-radius: 18px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 18px 50px rgba(15, 23, 42, 0.16);
  padding: 12px 14px;
  animation: toastIn 0.28s ease-out forwards;
  display: flex;
  gap: 10px;
}
.vendor-toast-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  margin-top: 5px;
}
.vendor-toast-dot.info { background: #2563eb; }
.vendor-toast-dot.success { background: #16a34a; }
.vendor-toast-dot.warning { background: #ea580c; }
.vendor-toast-dot.danger { background: #b91c1c; }

.vendor-toast-title {
  font-size: 13px;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 2px;
}
.vendor-toast-msg {
  font-size: 12px;
  color: #475569;
  line-height: 1.45;
}

/* HERO */
.vendor-hero {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: #ffffff;
  padding: 90px 0 80px;
  position: relative;
  overflow: hidden;
  width: 100%;
}
.vendor-hero::before {
  content: '';
  position: absolute;
  inset: 0;
  background: url('data:image/svg+xml,<svg width="60" height="60" xmlns="http://www.w3.org/2000/svg"><circle cx="30" cy="30" r="1.5" fill="rgba(255,255,255,0.1)"/></svg>');
  opacity: 0.4;
}
.vendor-hero::after {
  content: '';
  position: absolute;
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%);
  top: -300px;
  right: -300px;
  border-radius: 50%;
}
.vendor-hero-content {
  position: relative;
  z-index: 1;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
}
.vendor-hero-left {
  display: flex;
  align-items: center;
  gap: 20px;
}
.vendor-big-icon {
  width: 112px;
  height: 112px;
  border-radius: 32px;
  background: rgba(15, 23, 42, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  color: #dbeafe;
  box-shadow:
    inset 0 0 26px rgba(255, 255, 255, 0.16),
    0 28px 60px rgba(15, 23, 42, 0.85);
}
.vendor-welcome-text {
  font-size: 40px;
  font-weight: 900;
  letter-spacing: -0.8px;
  color: #f9fafb;
  margin-bottom: 6px;
}
.vendor-company-meta {
  font-size: 18px;
  font-weight: 600;
  color: #e0ecff;
}
.vendor-hero-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}
.vendor-location-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(15, 23, 42, 0.35);
  padding: 8px 20px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 600;
  color: #e5edff;
  box-shadow: 0 14px 40px rgba(15, 23, 42, 0.75);
}

/* ✅ small verification pill */
.vendor-verify-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  border: 1px solid rgba(255,255,255,0.22);
  background: rgba(15, 23, 42, 0.32);
  color: #e5edff;
}
.vendor-verify-pill.verified { background: rgba(22, 163, 74, 0.25); border-color: rgba(22, 163, 74, 0.35); }
.vendor-verify-pill.pending { background: rgba(234, 88, 12, 0.20); border-color: rgba(234, 88, 12, 0.35); }
.vendor-verify-pill.rejected { background: rgba(185, 28, 28, 0.22); border-color: rgba(185, 28, 28, 0.35); }
.vendor-verify-pill.removed { background: rgba(185, 28, 28, 0.22); border-color: rgba(185, 28, 28, 0.35); }

/* STATS STRIP */
.vendor-stats-strip {
  background: #ffffff;
  margin: -60px auto 0;
  position: relative;
  z-index: 10;
  border-radius: 24px;
  padding: 24px 28px;
  box-shadow: 0 18px 50px rgba(15, 23, 42, 0.12);
  width: 90%;
  max-width: 1100px;
  box-sizing: border-box;
}
.vendor-stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 24px;
}
.vendor-stat-card {
  background: linear-gradient(180deg, #ffffff 0%, #f6f8ff 100%);
  border-radius: 24px;
  padding: 20px 10px 22px;
  text-align: center;
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.06);
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    background 0.18s ease;
  cursor: pointer;
  opacity: 0;
  animation: fadeInSoft 0.55s ease-out forwards;
}
.vendor-stat-card:nth-child(1) { animation-delay: 0.06s; }
.vendor-stat-card:nth-child(2) { animation-delay: 0.12s; }
.vendor-stat-card:nth-child(3) { animation-delay: 0.18s; }
.vendor-stat-card:nth-child(4) { animation-delay: 0.24s; }

.vendor-stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 22px 50px rgba(15, 23, 42, 0.14);
  background: linear-gradient(180deg, #ffffff 0%, #eef3ff 100%);
}
.vendor-stat-icon-circle {
  width: 80px;
  height: 80px;
  margin: 0 auto 12px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
}
.vendor-stat-icon-blue { background: #e0ebff; color: #2563eb; }
.vendor-stat-icon-amber { background: #fef3c7; color: #d97706; }
.vendor-stat-icon-green { background: #dcfce7; color: #16a34a; }
.vendor-stat-icon-gold { background: #fef9c3; color: #eab308; }
.vendor-stat-value {
  font-size: 32px;
  line-height: 1.1;
  font-weight: 800;
  color: #111827;
  margin-bottom: 6px;
}
.vendor-stat-label {
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: #4b5563;
  text-transform: uppercase;
}

/* MAIN CONTENT */
.vendor-main-block {
  max-width: 100%;
  margin: 50px auto 40px;
  padding: 0 30px;
  box-sizing: border-box;
}
.vendor-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 1.2fr);
  column-gap: 40px;
  row-gap: 0;
  align-items: flex-start;
}
.vendor-layout > :nth-child(1) { grid-column: 1; }
.vendor-layout > :nth-child(2) { grid-column: 2; }

.vendor-right-column {
  display: flex;
  flex-direction: column;
  gap: 40px;
  height: 100%;
}
.vendor-right-column > .vendor-card { flex: 1; }

.vendor-card {
  background: #ffffff;
  border-radius: 20px;
  border: 1px solid #e2e8f0;
  padding: 18px 20px;
  box-shadow: 0 16px 36px rgba(15, 23, 42, 0.06);
}
.vendor-card--equal { display: flex; flex-direction: column; height: 100%; }

.vendor-card-title {
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.vendor-card-body {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
}
.vendor-card--reviews { margin-top: 24px; }

.vendor-card-link {
  background: none;
  border: none;
  padding: 0;
  font: inherit;
  color: inherit;
  cursor: pointer;
}
.vendor-card-link:hover { text-decoration: underline; }

/* FORM CONTROLS */
.vendor-label {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.vendor-input,
.vendor-select,
.vendor-textarea {
  width: 100%;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  padding: 10px 12px;
  font-size: 14px;
  background: #f8fafc;
  transition: 0.2s ease;
}
.vendor-input:focus,
.vendor-select:focus,
.vendor-textarea:focus {
  outline: none;
  border-color: #2563eb;
  background: #ffffff;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.16);
}
.vendor-textarea { resize: vertical; min-height: 90px; }
.vendor-save-btn {
  margin-top: 10px;
  border: none;
  border-radius: 999px;
  padding: 10px 16px;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 10px 20px rgba(37, 99, 235, 0.35);
}

/* ✅ Image upload grid */
.vendor-image-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}
.vendor-image-slot {
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  background: #f8fafc;
  padding: 10px;
}
.vendor-image-preview {
  width: 100%;
  height: 90px;
  border-radius: 12px;
  background: #eef2ff;
  border: 1px dashed #c7d2fe;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #475569;
  font-size: 12px;
  margin-bottom: 8px;
}
.vendor-image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.vendor-image-actions {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
}
.vendor-file {
  width: 100%;
  font-size: 12px;
}
.vendor-mini-btn {
  border-radius: 999px;
  border: 1px solid #e2e8f0;
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 700;
  background: #ffffff;
  cursor: pointer;
}
.vendor-mini-btn.danger {
  border-color: #fecaca;
  color: #b91c1c;
}

/* REQUESTS / REVIEWS */
.vendor-requests-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-height: 260px;
  overflow-y: auto;
}
.vendor-request-item {
  border-radius: 14px;
  border: 1px solid #e2e8f0;
  padding: 10px 12px;
  display: flex;
  justify-content: space-between;
  gap: 10px;
  background: #f9fafb;
  transition: box-shadow 0.18s ease, transform 0.18s ease;
}
.vendor-request-item:hover {
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.12);
  transform: translateY(-2px);
}
.vendor-request-meta {
  font-size: 11px;
  color: #64748b;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}
.vendor-request-name { font-size: 14px; font-weight: 600; margin-bottom: 2px; }
.vendor-request-msg { font-size: 13px; color: #475569; }
.vendor-request-actions {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: flex-end;
  min-width: 130px;
}
.vendor-pill-status {
  font-size: 11px;
  padding: 4px 8px;
  border-radius: 999px;
  background: #e5e7eb;
  color: #374151;
  font-weight: 600;
}
.vendor-pill-status.pending { background: #fef3c7; color: #92400e; }
.vendor-pill-status.accepted { background: #dcfce7; color: #166534; }
.vendor-pill-status.rejected { background: #fee2e2; color: #991b1b; }

.vendor-btn-accept,
.vendor-btn-reject {
  border-radius: 999px;
  border: none;
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
}
.vendor-btn-accept { background: #16a34a; color: #ffffff; }
.vendor-btn-reject { background: #ffffff; color: #b91c1c; border: 1px solid #fecaca; }

.vendor-request-phone { font-size: 12px; color: #0f172a; margin-top: 4px; }
.vendor-request-phone span { font-weight: 600; }

.vendor-reviews-list { display: flex; flex-direction: column; gap: 8px; }
.vendor-review-item {
  border-radius: 14px;
  border: 1px solid #e2e8f0;
  padding: 8px 10px;
  font-size: 13px;
  background: #f9fafb;
  display: flex;
  justify-content: space-between;
  gap: 8px;
  transition: box-shadow 0.18s ease, transform 0.18s ease;
}
.vendor-review-item:hover {
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.12);
  transform: translateY(-2px);
}
.vendor-review-stars { display: flex; align-items: center; gap: 2px; margin-bottom: 2px; }

/* performance metrics */
.vendor-metrics { display: flex; flex-direction: column; gap: 10px; margin-top: 4px; }
.vendor-metric-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  margin-bottom: 4px;
}
.vendor-metric-label { color: #6b7280; font-weight: 500; }
.vendor-metric-value { color: #111827; font-weight: 600; }
.vendor-metric-bar {
  width: 100%;
  height: 8px;
  border-radius: 999px;
  background: #e5e7eb;
  overflow: hidden;
}
.vendor-metric-bar-inner { height: 100%; border-radius: 999px; transition: width 0.4s ease; }

/* ✅ Bottom grid: Reviews + Messages card side-by-side */
.vendor-bottom-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 24px;
  margin-top: 24px;
}

/* ✅ Messages list */
.vendor-msg-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 330px;
  overflow-y: auto;
}
.vendor-msg-item {
  border-radius: 14px;
  border: 1px solid #e2e8f0;
  padding: 10px 12px;
  background: #f9fafb;
  display: flex;
  gap: 10px;
  cursor: pointer;
  transition: box-shadow 0.18s ease, transform 0.18s ease;
}
.vendor-msg-item:hover {
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.10);
  transform: translateY(-2px);
}
.vendor-msg-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  margin-top: 5px;
}
.vendor-msg-dot.info { background: #2563eb; }
.vendor-msg-dot.success { background: #16a34a; }
.vendor-msg-dot.warning { background: #ea580c; }
.vendor-msg-dot.danger { background: #b91c1c; }

.vendor-msg-title {
  font-size: 13px;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 2px;
}
.vendor-msg-body {
  font-size: 12px;
  color: #475569;
  line-height: 1.45;
}
.vendor-msg-meta {
  font-size: 11px;
  color: #94a3b8;
  margin-top: 4px;
  display: flex;
  justify-content: space-between;
  gap: 10px;
}
.vendor-unread-pill {
  font-size: 11px;
  font-weight: 800;
  padding: 4px 10px;
  border-radius: 999px;
  background: #eff6ff;
  color: #2563eb;
  border: 1px solid #dbeafe;
}

/* LOGIN CARD */
.vendor-login-card {
  max-width: 480px;
  margin: 80px auto;
  padding: 32px 28px;
  border-radius: 24px;
  background: #ffffff;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.16);
  text-align: center;
  border: 1px solid #e2e8f0;
}
.vendor-login-btn {
  margin-top: 18px;
  padding: 10px 18px;
  border-radius: 999px;
  border: none;
  background: #2563eb;
  color: white;
  font-weight: 600;
  cursor: pointer;
}

/* RESPONSIVE */
@media (max-width: 960px) {
  .vendor-hero-content { padding: 0 30px 32px; }
  .vendor-welcome-text { font-size: 32px; }
  .vendor-stats-strip { width: 94%; padding: 20px; }
  .vendor-stats-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; }
  .vendor-main-block { margin-top: 40px; padding: 0 10px 32px; }

  .vendor-layout {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }
  .vendor-right-column { width: 100%; }
  .vendor-card, .vendor-card--reviews { width: 100%; box-sizing: border-box; }

  .vendor-bottom-grid { grid-template-columns: minmax(0, 1fr); }
  .vendor-image-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 640px) {
  .vendor-hero { padding: 70px 0 60px; }
  .vendor-hero-content { flex-direction: column; align-items: flex-start; }
  .vendor-big-icon { width: 88px; height: 88px; font-size: 38px; }
  .vendor-welcome-text { font-size: 26px; }
  .vendor-company-meta { font-size: 15px; }
  .vendor-stats-grid { grid-template-columns: minmax(0, 1fr); }
  .vendor-main-block { padding: 0 12px 28px; }
  .vendor-requests-list { max-height: none; }
  .vendor-image-grid { grid-template-columns: minmax(0, 1fr); }
}
`;

  // ----------------- RENDER -----------------
  if (!authUser || authUser.role !== "vendor") {
    return (
      <div className="vendor-page">
        <style>{styles}</style>
        <div className="vendor-login-card vendor-animate-card">
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 20,
              background: "#eff6ff",
              margin: "0 auto 12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#2563eb",
              fontSize: 24,
            }}
          >
            <FaUserTie />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>
            Vendor dashboard
          </h2>
          <p style={{ fontSize: 14, color: "#64748b", marginBottom: 0 }}>
            You are not logged in as a service provider. Sign in with your vendor
            account to manage your profile and customer requests.
          </p>
          <button className="vendor-login-btn" onClick={() => navigate("/login")}>
            Go to login
          </button>
        </div>
      </div>
    );
  }

  if (!session || !service) {
    return (
      <div className="vendor-page">
        <style>{styles}</style>
        <p style={{ padding: "40px 24px" }}>Loading vendor data…</p>
      </div>
    );
  }

  return (
    <div className="vendor-page">
      <style>{styles}</style>

      {/* Toast popups */}
      <div className="vendor-toast-wrap">
        {toasts.map((t) => (
          <div className="vendor-toast" key={t.id}>
            <div className={`vendor-toast-dot ${t.status || "info"}`} />
            <div>
              <div className="vendor-toast-title">{t.title}</div>
              <div className="vendor-toast-msg">{t.message}</div>
            </div>
          </div>
        ))}
      </div>

      {/* HERO */}
      <div className="vendor-hero">
        <div className="vendor-hero-content vendor-animate-hero">
          <div className="vendor-hero-left">
            <div className="vendor-big-icon">
              <FaUserTie />
            </div>
            <div className="vendor-animate-hero-delay">
              <div className="vendor-welcome-text">Welcome back, {vendorName}</div>
              <div className="vendor-company-meta">
                Managing <strong>{companyName}</strong> • {category} in {city}
              </div>
            </div>
          </div>

          <div className="vendor-hero-right vendor-animate-hero-delay">
            <div className="vendor-location-pill">
              <FaMapMarkerAlt size={13} /> {city}
            </div>

            <div className={`vendor-verify-pill ${verification.state}`}>
              {verification.state === "verified" ? (
                <>
                  <FaCheckCircle size={13} /> Verified
                </>
              ) : verification.state === "rejected" ? (
                <>
                  <FaTimesCircle size={13} /> Rejected
                </>
              ) : verification.state === "removed" ? (
                <>
                  <FaTimesCircle size={13} /> Removed
                </>
              ) : (
                <>
                  <FaClock size={13} /> Pending
                </>
              )}
            </div>

            <div style={{ fontSize: 12, color: "#e5edff", opacity: 0.85 }}>
              Logged in as vendor
            </div>
          </div>
        </div>
      </div>

      {/* STATS STRIP */}
      <div className="vendor-stats-strip">
        <div className="vendor-stats-grid">
          <div
            className="vendor-stat-card"
            onClick={() => navigate("/vendor/requests?filter=all")}
          >
            <div className="vendor-stat-icon-circle vendor-stat-icon-blue">
              <FaInbox />
            </div>
            <div className="vendor-stat-value">{stats.total}</div>
            <div className="vendor-stat-label">TOTAL REQUESTS</div>
          </div>

          <div
            className="vendor-stat-card"
            onClick={() => navigate("/vendor/requests?filter=pending")}
          >
            <div className="vendor-stat-icon-circle vendor-stat-icon-amber">
              <FaClock />
            </div>
            <div className="vendor-stat-value">{stats.pending}</div>
            <div className="vendor-stat-label">PENDING</div>
          </div>

          <div
            className="vendor-stat-card"
            onClick={() => navigate("/vendor/requests?filter=accepted")}
          >
            <div className="vendor-stat-icon-circle vendor-stat-icon-green">
              <FaCheckCircle />
            </div>
            <div className="vendor-stat-value">{stats.accepted}</div>
            <div className="vendor-stat-label">ACCEPTED</div>
          </div>

          <div className="vendor-stat-card" onClick={() => navigate("/vendor/reviews")}>
            <div className="vendor-stat-icon-circle vendor-stat-icon-gold">
              <FaStar />
            </div>
            <div className="vendor-stat-value">{stats.avgRating || "—"}</div>
            <div className="vendor-stat-label">RATING</div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="vendor-main-block">
        <div className="vendor-layout">
          {/* LEFT: SERVICE PROFILE */}
          <div className="vendor-card vendor-card--equal vendor-animate-card">
            <div className="vendor-card-title">
              <span>Service profile</span>
              <span className={`vendor-unread-pill`} style={{ opacity: unreadCount ? 1 : 0.55 }}>
                {unreadCount ? `${unreadCount} new` : "Messages"}
              </span>
            </div>

            <div className="vendor-card-body">
              {/* Business name */}
              <div>
                <div className="vendor-label">Business / company name</div>
                <input
                  className="vendor-input"
                  value={profile.companyName}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, companyName: e.target.value }))
                  }
                  placeholder={service.name || "e.g. SparkPro Electrician"}
                />
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                  This name appears on your public card.
                </div>
              </div>

              {/* Phone */}
              <div>
                <div className="vendor-label">Public contact phone</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 12,
                      background: "#eff6ff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#2563eb",
                    }}
                  >
                    <FaPhoneAlt />
                  </span>
                  <input
                    className="vendor-input"
                    value={profile.phone}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, phone: e.target.value }))
                    }
                    placeholder="e.g. 9876543210"
                  />
                </div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                  Customers see this after they send you a request.
                </div>
              </div>

              {/* Primary location */}
              <div>
                <div className="vendor-label">Primary location</div>
                <input
                  className="vendor-input"
                  value={profile.primaryLocation}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, primaryLocation: e.target.value }))
                  }
                  placeholder={service.location || "e.g. Mumbai"}
                />
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                  Main city / area where you operate.
                </div>
              </div>

              {/* Branches */}
              <div>
                <div className="vendor-label">Branch locations (optional)</div>
                <textarea
                  className="vendor-textarea"
                  value={profile.branches}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, branches: e.target.value }))
                  }
                  placeholder="e.g. Andheri West, Bandra East, Thane"
                />
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                  Additional areas, separated by commas or new lines.
                </div>
              </div>

              {/* Availability */}
              <div>
                <div className="vendor-label">Availability</div>
                <select
                  className="vendor-select"
                  value={profile.availability}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, availability: e.target.value }))
                  }
                >
                  <option value="Available">Available</option>
                  <option value="Busy">Busy</option>
                  <option value="Offline">Offline</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <div className="vendor-label">Service description</div>
                <textarea
                  className="vendor-textarea"
                  value={profile.description}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, description: e.target.value }))
                  }
                />
              </div>

              {/* 3-image upload for carousel */}
              <div>
                <div className="vendor-label">Service gallery images (3)</div>
                <div className="vendor-image-grid">
                  {[0, 1, 2].map((idx) => (
                    <div className="vendor-image-slot" key={idx}>
                      <div className="vendor-image-preview">
                        {images3[idx] ? (
                          <img src={images3[idx]} alt={`Gallery ${idx + 1}`} />
                        ) : (
                          <span>Default image {idx + 1}</span>
                        )}
                      </div>

                      <div className="vendor-image-actions">
                        <input
                          className="vendor-file"
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleUploadImage(idx, f);
                            e.target.value = "";
                          }}
                        />
                      </div>

                      {images3[idx] && (
                        <div style={{ marginTop: 8, display: "flex", justifyContent: "flex-end" }}>
                          <button
                            type="button"
                            className="vendor-mini-btn danger"
                            onClick={() => handleRemoveImage(idx)}
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 8 }}>
                  These images will show in the customer Service Detail carousel.
                  If not uploaded, default images will display.
                </div>
              </div>

              <button className="vendor-save-btn" type="button" onClick={saveProfile}>
                Save profile
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: CUSTOMER REQUESTS + PERFORMANCE (STACKED) */}
          <div className="vendor-right-column">
            {/* CUSTOMER REQUESTS */}
            <div className="vendor-card vendor-card--equal vendor-animate-card-right">
              <div className="vendor-card-title">
                <button
                  className="vendor-card-link"
                  type="button"
                  onClick={() => navigate("/vendor/requests")}
                >
                  Customer requests
                </button>
                <span
                  style={{
                    fontSize: 12,
                    color: "#64748b",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <FaClock size={12} />
                  latest first
                </span>
              </div>

              <div className="vendor-card-body">
                {requests.length === 0 && (
                  <p style={{ fontSize: 13, color: "#64748b", marginBottom: 0 }}>
                    No requests yet. Customers can contact you from your service card.
                  </p>
                )}

                {requests.length > 0 && (
                  <div className="vendor-requests-list">
                    {requests.map((r) => (
                      <div
                        key={`${r.id}-${r.time}`}
                        className="vendor-request-item"
                        onClick={() => navigate("/vendor/requests")}
                        style={{ cursor: "pointer" }}
                      >
                        <div>
                          <div className="vendor-request-meta">
                            <span>
                              <FaClock size={11} /> {new Date(r.time).toLocaleString()}
                            </span>
                            {r.urgency === "Urgent" && (
                              <span
                                style={{
                                  padding: "3px 8px",
                                  borderRadius: 999,
                                  background: "#fee2e2",
                                  color: "#b91c1c",
                                  fontWeight: 600,
                                  fontSize: 11,
                                }}
                              >
                                Urgent
                              </span>
                            )}
                          </div>
                          <div className="vendor-request-name">
                            {r.customerName || "Customer"}
                          </div>
                          <div className="vendor-request-msg">
                            {r.message
                              ? r.message.length > 120
                                ? `${r.message.slice(0, 120)}…`
                                : r.message
                              : "No additional details provided."}
                          </div>
                          <div className="vendor-request-phone">
                            <span>Customer phone: </span>
                            {r.status === "accepted"
                              ? r.customerPhone || "Not provided"
                              : "hidden until you accept the request"}
                          </div>
                          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                            Your phone visible to customer:{" "}
                            {profile.phone || service.phone || "Not set"}
                          </div>
                        </div>

                        <div className="vendor-request-actions">
                          {(() => {
                            const st = getRequestStatus(r);
                            return (
                              <span className={`vendor-pill-status ${st}`}>
                                {st === "pending" && "Pending"}
                                {st === "accepted" && "Accepted"}
                                {st === "rejected" && "Rejected"}
                              </span>
                            );
                          })()}

                          {r.status !== "accepted" && (
                            <button
                              className="vendor-btn-accept"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpdateRequestStatus(r.id, "accepted");
                              }}
                            >
                              <FaCheckCircle size={11} />
                              Accept
                            </button>
                          )}

                          {r.status !== "rejected" && (
                            <button
                              className="vendor-btn-reject"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpdateRequestStatus(r.id, "rejected");
                              }}
                            >
                              <FaTimesCircle size={11} />
                              Reject
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div
  className="vendor-card vendor-card--equal vendor-animate-card-right performance-insights-card"
  role="button"
  tabIndex={0}
  onClick={() => navigate("/vendor/analytics")}
  onKeyDown={(e) => {
    if (e.key === "Enter" || e.key === " ") navigate("/vendor/analytics");
  }}
  style={{ cursor: "pointer" }}
>
  <div className="vendor-card-title">
    <span>Performance insights</span>

    <button
  type="button"
  className="vendor-mini-btn"
  onClick={(e) => {
    e.stopPropagation();
    navigate("/vendor/analytics");  
  }}
  style={{ borderColor: "#dbeafe", color: "#2563eb" }}
>
  View analytics
</button>
  </div>
              <div className="vendor-card-body">
                <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 4 }}>
                  Quick snapshot of how your service is performing.
                </div>

                <div className="vendor-metrics">
                  <div>
                    <div className="vendor-metric-row">
                      <span className="vendor-metric-label">Conversion rate</span>
                      <span className="vendor-metric-value">{conversionRate}%</span>
                    </div>
                    <div className="vendor-metric-bar">
                      <div
                        className="vendor-metric-bar-inner"
                        style={{
                          width: `${conversionRate}%`,
                          background: "linear-gradient(90deg, #4ade80, #22c55e)",
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="vendor-metric-row">
                      <span className="vendor-metric-label">Response rate</span>
                      <span className="vendor-metric-value">{responseRate}%</span>
                    </div>
                    <div className="vendor-metric-bar">
                      <div
                        className="vendor-metric-bar-inner"
                        style={{
                          width: `${responseRate}%`,
                          background: "linear-gradient(90deg, #60a5fa, #2563eb)",
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="vendor-metric-row">
                      <span className="vendor-metric-label">Pending workload</span>
                      <span className="vendor-metric-value">{pendingShare}%</span>
                    </div>
                    <div className="vendor-metric-bar">
                      <div
                        className="vendor-metric-bar-inner"
                        style={{
                          width: `${pendingShare}%`,
                          background: "linear-gradient(90deg, #f97316, #ea580c)",
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ marginTop: 6, fontSize: 12, color: "#9ca3af", lineHeight: 1.5 }}>
                    Accepted {stats.accepted} / {stats.total || 0} requests. Pending{" "}
                    {stats.pending}, rejected {stats.rejected}.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        

        {/* Reviews + Messages side-by-side (desktop), stacked (mobile) */}
        <div className="vendor-bottom-grid">
          {/* REVIEWS */}
          <div className="vendor-card vendor-animate-card">
            <div className="vendor-card-title">
              <button
                className="vendor-card-link"
                type="button"
                onClick={() => navigate("/vendor/reviews")}
              >
                Reviews
              </button>
            </div>

            {reviews.length === 0 && (
              <p style={{ fontSize: 13, color: "#64748b", marginBottom: 0 }}>
                No reviews yet. Once customers submit ratings, they will appear here.
              </p>
            )}

            {reviews.length > 0 && (
              <>
                {reviews.length > 5 && (
                  <p style={{ fontSize: 12, color: "#9ca3af", marginBottom: 8 }}>
                    Showing the latest 5 reviews. Click any review to open the full page.
                  </p>
                )}

                <div className="vendor-reviews-list">
                  {reviews.slice(0, 5).map((rev, idx) => {
                    const rawDate = rev.time || rev.createdAt || rev.date;
                    let formattedDate = "";
                    if (rawDate) {
                      const d = new Date(rawDate);
                      if (!Number.isNaN(d.getTime())) {
                        formattedDate = d.toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        });
                      }
                    }

                    const reviewerName = rev.customerName || rev.reviewerName || "Customer";
                    const rawText = (rev.text ?? rev.comment ?? "").trim();
                    const displayText =
                      rawText.length > 0
                        ? rawText.length > 120
                          ? rawText.slice(0, 120) + "…"
                          : rawText
                        : "No comment left, only rating.";

                    return (
                      <div
                        key={rev.id || idx}
                        className="vendor-review-item"
                        onClick={() => navigate("/vendor/reviews")}
                        style={{ cursor: "pointer" }}
                      >
                        <div>
                          <div className="vendor-review-stars">
                            {Array.from({ length: 5 }).map((_, starIdx) => (
                              <FaStar
                                key={starIdx}
                                size={12}
                                color={starIdx < (rev.rating || 0) ? "#facc15" : "#e5e7eb"}
                              />
                            ))}
                          </div>

                          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>
                            {reviewerName}
                          </div>

                          <div style={{ fontSize: 13, color: "#475569" }}>{displayText}</div>
                        </div>

                        <div style={{ fontSize: 11, color: "#94a3b8" }}>
                          {formattedDate || "—"}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/*  MESSAGES CARD */}
          <div className="vendor-card vendor-animate-card">
            <div className="vendor-card-title">
              <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                Messages
                {unreadCount > 0 && <span className="vendor-unread-pill">{unreadCount} new</span>}
              </span>

              <button
                type="button"
                className="vendor-mini-btn"
                onClick={markAllRead}
                style={{ borderColor: "#dbeafe", color: "#2563eb" }}
              >
                Mark all read
              </button>
            </div>

            <div className="vendor-card-body">
              {activity.length === 0 && (
                <p style={{ fontSize: 13, color: "#64748b", marginBottom: 0 }}>
                  No messages yet. Admin updates (verify/remove) and request updates will appear here.
                </p>
              )}

              {activity.length > 0 && (
                <div className="vendor-msg-list">
                  {activity.slice(0, 12).map((m) => (
                    <div
                      key={m.id}
                      className="vendor-msg-item"
                      onClick={() => markOneRead(m.id)}
                      style={{
                        opacity: m.read ? 0.85 : 1,
                        borderColor: m.read ? "#e2e8f0" : "#c7d2fe",
                      }}
                    >
                      <div className={`vendor-msg-dot ${m.status || "info"}`} />
                      <div style={{ flex: 1 }}>
                        <div className="vendor-msg-title">
                          {m.title}
                          {!m.read && (
                            <span style={{ marginLeft: 8, fontSize: 11, color: "#2563eb", fontWeight: 900 }}>
                              NEW
                            </span>
                          )}
                        </div>
                        <div className="vendor-msg-body">{m.body}</div>
                        <div className="vendor-msg-meta">
                          <span>{m.kind === "admin" ? "Admin" : m.kind === "request" ? "Requests" : "System"}</span>
                          <span>{formatDT(m.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 8 }}>
                Tip: This log keeps the history with date and time (accepted, rejected, verified, removed).
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}