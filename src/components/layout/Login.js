import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaUser,
  FaBriefcase,
  FaArrowRight,
  FaCheckCircle,
  FaShieldAlt,
  FaClock,
} from "react-icons/fa";

export default function Login() {
  const navigate = useNavigate();
  const [role, setRole] = useState("user");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  // ⭐⭐⭐ FIXED — Full Correct handleLogin Function
  const handleLogin = () => {
    const newErrors = {};

    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email is invalid";
    }

    if (!password) {
      newErrors.password = "Password is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const users = JSON.parse(localStorage.getItem("registeredUsers")) || [];

    const matchedUser = users.find(
      (u) =>
        u.email === email &&
        u.password === password &&
        u.role === role
    );

    if (!matchedUser) {
      setErrors({ general: "Invalid email, password, or role" });
      return;
    }

    localStorage.setItem("authUser", JSON.stringify(matchedUser));

    // ⭐⭐⭐ Role-based redirect
    if (matchedUser.role === "vendor") {
      navigate("/vendor/dashboard");
    } else {
      navigate("/");
    }
  };

  return (
    <div className="split-auth-page">
      {/* 🎨 Styles */}
      <style>{`
        .split-auth-page {
          display: flex;
          min-height: 100vh;
        }

        .auth-left {
          flex: 1;
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
          padding: 80px 60px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          position: relative;
          overflow: hidden;
        }

        .auth-left::before {
          content: '';
          position: absolute;
          inset: 0;
          background: url('data:image/svg+xml,<svg width="60" height="60" xmlns="http://www.w3.org/2000/svg"><circle cx="30" cy="30" r="1.5" fill="rgba(255,255,255,0.1)"/></svg>');
          opacity: 0.4;
        }

        .auth-left-content {
          position: relative;
          z-index: 1;
          max-width: 480px;
        }

        .brand-logo {
          font-size: 48px;
          font-weight: 900;
          margin-bottom: 24px;
        }

        .brand-tagline {
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 16px;
        }

        .brand-description {
          font-size: 16px;
          opacity: 0.9;
          line-height: 1.7;
          margin-bottom: 48px;
        }

        .feature-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .feature-item {
          display: flex;
          align-items: center;
          gap: 16px;
          background: rgba(255, 255, 255, 0.1);
          padding: 16px;
          border-radius: 12px;
        }

        .feature-icon {
          width: 48px;
          height: 48px;
          background: white;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          color: #3b82f6;
          flex-shrink: 0;
        }

        /* RIGHT SIDE — MAKE IT MATCH SIGNUP */
        .auth-right {
          flex: 1;
          background: #f9fafb;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 0;  
        }

        .auth-form-container {
          width: 460px;
          background: white;
          padding: 46px 40px;
          border-radius: 28px;
          box-shadow: 0 12px 40px rgba(0,0,0,0.08);
        }

        .form-header {
          margin-bottom: 32px;
        }

        .form-title {
          font-size: 32px;
          font-weight: 800;
          margin-bottom: 8px;
          color: #0f172a;
        }

        .form-subtitle {
          font-size: 15px;
          color: #64748b;
        }

        .role-selector {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 28px;
        }

        .role-option {
          padding: 18px;
          border: 2px solid #e2e8f0;
          border-radius: 16px;
          cursor: pointer;
          transition: .3s ease;
          background: #f8fafc;
          text-align: center;
        }

        .role-option.active {
          border-color: #3b82f6;
          background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
          box-shadow: 0 4px 12px rgba(59,130,246,0.25);
        }

        .role-icon {
          font-size: 26px;
          color: #3b82f6;
          margin-bottom: 10px;
        }

        .input-group-custom {
          position: relative;
          margin-bottom: 20px;
        }

        .input-label {
          display: block;
          margin-bottom: 6px;
          font-size: 14px;
          font-weight: 600;
          color: #0f172a;
        }

        .input-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 17px;
          color: #94a3b8;
        }

        .input-field {
          width: 100%;
          padding: 14px 18px 14px 50px;
          border-radius: 12px;
          border: 2px solid #e2e8f0;
          font-size: 15px;
          background: #f8fafc;
        }

        .input-field:focus {
          border-color: #3b82f6;
          background: white;
          box-shadow: 0 0 0 4px rgba(59,130,246,0.12);
        }

        .auth-button {
          width: 100%;
          padding: 16px;
          background: linear-gradient(135deg,#3b82f6,#2563eb);
          color: white;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-top: 8px;
          box-shadow: 0 10px 25px rgba(59,130,246,0.3);
        }

        .auth-footer {
          text-align: center;
          font-size: 15px;
          margin-top: 20px;
          color: #64748b;
        }

        .auth-link {
          color: #2563eb;
          font-weight: 700;
        }
          .error-message {
  color: #ef4444;
  font-size: 13px;
  margin-top: 6px;
  margin-left: 4px;
  font-weight: 500;
}
  .password-toggle {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  font-size: 18px;
  padding: 4px;
  z-index: 2;
}

.password-toggle:hover {
  color: #3b82f6;
}
  /* 📱 RESPONSIVE TWEAKS FOR LOGIN PAGE */
@media (max-width: 1024px) {
  .auth-left {
    padding: 60px 40px;
  }

  .auth-form-container {
    width: 100%;
    max-width: 420px;
    padding: 36px 30px;
    margin: 40px 16px;
  }
}

@media (max-width: 768px) {
  /* Stack layout: HERO (blue) first, then form */
  .split-auth-page {
    flex-direction: column;   /* ← was column-reverse */
    min-height: auto;
  }

  /* keep rest same */
  .auth-right {
    padding: 32px 16px;
    align-items: stretch;
  }

  .auth-form-container {
    width: 100%;
    max-width: 100%;
    border-radius: 20px;
    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12);
    margin: 24px 0;
  }

  .auth-left {
    padding: 32px 20px 40px;
    min-height: auto;
  }
}

@media (max-width: 640px) {
  .auth-left {
    padding: 24px 16px 28px;
    min-height: auto;
  }

  .auth-left-content {
    max-width: 100%;
  }

  .brand-logo {
    font-size: 28px;
    margin-bottom: 12px;
  }

  .brand-tagline {
    font-size: 18px;
    margin-bottom: 10px;
  }

  .brand-description {
    font-size: 14px;
    margin-bottom: 18px;
  }

  .auth-right {
    flex: 1;
    padding: 24px 16px;
  }

  .auth-form-container {
    width: 100%;
    max-width: 100%;
    margin: 0;
    box-shadow: none;
    border-radius: 16px 16px 0 0;
    padding: 24px 16px 28px;
  }
}
      `}</style>

      {/* LEFT SIDE */}
      <motion.div
        className="auth-left"
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="auth-left-content">
          <div className="brand-logo">LocalServe</div>
          <h2 className="brand-tagline">Welcome Back to Your Local Service Hub</h2>
          <p className="brand-description">
            Sign in to continue accessing trusted local service providers.
          </p>

          <div className="feature-list">
            <div className="feature-item">
              <div className="feature-icon"><FaCheckCircle /></div>
              <div className="feature-text">Access 1000+ verified service providers</div>
            </div>
            <div className="feature-item">
              <div className="feature-icon"><FaShieldAlt /></div>
              <div className="feature-text">Secure and trusted platform</div>
            </div>
            <div className="feature-item">
              <div className="feature-icon"><FaClock /></div>
              <div className="feature-text">Quick booking & instant responses</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* RIGHT SIDE */}
      <motion.div
        className="auth-right"
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="auth-form-container">

          <div className="form-header">
            <h1 className="form-title">Login</h1>
            <p className="form-subtitle">Enter your credentials to access your account</p>
          </div>

          {errors.general && <div className="general-error">{errors.general}</div>}

          <div className="role-selector">
            <div
              className={`role-option ${role === "user" ? "active" : ""}`}
              onClick={() => setRole("user")}
            >
              <div className="role-icon"><FaUser /></div>
              <div className="role-label">User</div>
            </div>

            <div
              className={`role-option ${role === "vendor" ? "active" : ""}`}
              onClick={() => setRole("vendor")}
            >
              <div className="role-icon"><FaBriefcase /></div>
              <div className="role-label">Service Provider</div>
            </div>
          </div>

          {/* EMAIL */}
          <div className="input-group-custom">
            <label className="input-label">Email Address</label>
            <FaEnvelope className="input-icon" />
            <input
              type="email"
              className={`input-field ${errors.email ? "error" : ""}`}
              placeholder="your.email@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrors({ ...errors, email: "", general: "" });
              }}
            />
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>

          {/* PASSWORD */}
          <div className="input-group-custom">
            <label className="input-label">Password</label>
            <FaLock className="input-icon" />
            <input
              type={showPassword ? "text" : "password"}
              className={`input-field ${errors.password ? "error" : ""}`}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrors({ ...errors, password: "", general: "" });
              }}
            />
            <button
              className="password-toggle"
              type="button"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>

          {/* LOGIN BUTTON */}
          <button className="auth-button" onClick={handleLogin}>
            <span>Login to Account</span>
            <FaArrowRight />
          </button>

          <div className="auth-footer">
            Don't have an account?{" "}
            <a href="/signup" className="auth-link">Create Account</a>
          </div>
        </div>
      </motion.div>
    </div>
  );
}