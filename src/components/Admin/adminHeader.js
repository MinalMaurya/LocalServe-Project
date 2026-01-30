
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminHeader() {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);

  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem("authUser") || "null");
      setAdmin(u);
    } catch {
      setAdmin(null);
    }
  }, []);

  const logout = () => {
    localStorage.removeItem("authUser");
    localStorage.removeItem("isLoggedIn");
    navigate("/", { replace: true });
  };

  const displayName = admin?.name || admin?.email || "Admin";

  return (
    <nav className="navbar navbar-light bg-white border-bottom">
      <style>{`
        .admin-brand {
          font-weight: 800;
          font-size: 22px;
          color: #2563eb;
          cursor: pointer;
        }
        .admin-nav-btn {
          font-size: 14px;
          font-weight: 600;
          border-radius: 999px;
          padding: 6px 14px;
          border: none;
          background: transparent;
          color: #0f172a;
          transition: all 0.2s ease;
        }
        .admin-nav-btn:hover {
          background: #e5efff;
          color: #2563eb;
        }
        .admin-nav-btn-logout {
          font-size: 14px;
          font-weight: 600;
          border-radius: 999px;
          padding: 6px 14px;
          border: 1px solid #ef4444;
          color: #ef4444;
          background: #fff5f5;
          transition: all 0.2s ease;
        }
        .admin-nav-btn-logout:hover {
          background: #fee2e2;
        }
      `}</style>

      <div className="container d-flex justify-content-between align-items-center">
        {/* Brand → Admin services dashboard (home) */}
        <span
          className="admin-brand"
          onClick={() => navigate("/admin/services")}
        >
          LocalServe Admin
        </span>

        <div className="d-flex align-items-center gap-2">
          {/* Home → admin dashboard/services */}
          <button
            type="button"
            className="admin-nav-btn"
            onClick={() => navigate("/admin/services")}
          >
            Home
          </button>

          {/* Profile → admin profile page */}
          <button
            type="button"
            className="admin-nav-btn"
            title={displayName}
            onClick={() => navigate("/admin/profile")}
          >
            Profile
          </button>

          {/* Logout */}
          <button
            type="button"
            className="admin-nav-btn-logout"
            onClick={logout}
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}