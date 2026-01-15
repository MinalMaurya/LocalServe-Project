// src/components/layout/Header.jsx
import { NavLink, useNavigate } from "react-router-dom";

export default function Header() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("authUser"));

  const isVendor = user?.role === "vendor";
  const homePath = isVendor ? "/vendor/dashboard" : "/";

  const logout = () => {
    localStorage.removeItem("authUser");
    localStorage.removeItem("isLoggedIn"); // 🔹 keep in sync with rest of app
    navigate("/login");
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom">
      <style>{`
        .brand {
          font-weight: 800;
          font-size: 22px;
          color: #2563eb;
          cursor: pointer;
        }
        .nav-link {
          color: #475569;
          font-weight: 500;
        }
        .nav-link.active {
          color: #2563eb !important;
          font-weight: 600;
        }
      `}</style>

      <div className="container">
        {/* 🔹 Brand: same always */}
        <span className="brand" onClick={() => navigate(homePath)}>
          LocalServe
        </span>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#mainHeaderNav"
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div
          className="collapse navbar-collapse justify-content-end"
          id="mainHeaderNav"
        >
          {user ? (
            // ✅ LOGGED-IN HEADER (same as before)
            <>
              <NavLink className="nav-link d-inline mx-3" to={homePath}>
                Home
              </NavLink>

              {!isVendor && (
                <NavLink className="nav-link d-inline mx-3" to="/requests">
                  MyRequests
                </NavLink>
              )}

              <NavLink className="nav-link d-inline mx-3" to="/about">
                About
              </NavLink>

              <NavLink className="nav-link d-inline mx-3" to="/contact">
                Contact Us
              </NavLink>

              <NavLink className="nav-link d-inline mx-3" to="/profile">
                Profile
              </NavLink>

              <button
                className="btn btn-sm btn-outline-danger ms-3"
                onClick={logout}
              >
                Logout
              </button>
            </>
          ) : (
            // 🔓 NOT LOGGED IN: only Login + Sign up
            <div className="d-flex align-items-center">
               <NavLink className="nav-link d-inline mx-3" to={homePath}>
                Home
              </NavLink>
              <NavLink className="nav-link d-inline mx-3" to="/about">
                About
              </NavLink>
              <NavLink
                className="btn btn-sm btn-outline-primary me-2"
                to="/login"
              >
                Login
              </NavLink>
              <NavLink className="btn btn-sm btn-primary" to="/signup">
                Sign Up
              </NavLink>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
