import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaUser,
  FaArrowRight,
  FaCheckCircle,
  FaShieldAlt,
  FaClock,
} from "react-icons/fa";

export default function AdminSignup() {
  const navigate = useNavigate();

  const [role] = useState("admin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const handleSignup = () => {
    const newErrors = {};

    if (!name.trim()) newErrors.name = "Name is required";
    if (!email) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = "Invalid email";
    if (!password) newErrors.password = "Password is required";
    else if (password.length < 6)
      newErrors.password = "Minimum 6 characters required";

    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }

    const admins = JSON.parse(localStorage.getItem("registeredAdmin") || "[]");
    const exists = admins.some((u) => u.email === email && u.role === role);
    if (exists) {
      setErrors({ general: "Admin account already exists. Please login." });
      return;
    }

    const newAdmin = { name, email, password, role };
    const updated = [...admins, newAdmin];
    localStorage.setItem("registeredAdmin", JSON.stringify(updated));
    localStorage.setItem("authUser", JSON.stringify(newAdmin));
    navigate("/admin/services");
  };

  return (
    <div className="signup-page">
      <style>{`
        .signup-page {
          min-height: 100vh;
          display: flex;
          background: #f8fbff;
        }
        .signup-left {
          flex: 1.3;
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
          padding: 80px 60px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .signup-left h1 {
          font-size: 44px;
          font-weight: 800;
          margin-bottom: 20px;
        }
        .signup-left p {
          font-size: 18px;
          line-height: 1.7;
          opacity: 0.95;
        }
        .signup-left ul {
          margin-top: 30px;
          padding-left: 20px;
        }
        .signup-left li {
          margin-bottom: 12px;
          font-size: 16px;
        }

        .signup-right {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px;
        }

        .signup-card {
          width: 100%;
          max-width: 420px;
          background: #ffffff;
          border-radius: 20px;
          padding: 40px 36px;
          box-shadow: 0 20px 50px rgba(37, 99, 235, 0.15);
        }

        .signup-title {
          font-size: 28px;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 6px;
        }

        .signup-subtitle {
          font-size: 14px;
          color: #64748b;
          margin-bottom: 24px;
        }

        .role-chip {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          border-radius: 999px;
          background: #eff6ff;
          color: #1d4ed8;
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 20px;
        }

        .input-group-custom {
          position: relative;
          margin-bottom: 18px;
        }

        .input-label {
          display: block;
          margin-bottom: 6px;
          font-size: 13px;
          font-weight: 600;
          color: #0f172a;
        }

        .input-icon {
          position: absolute;
          left: 14px;
          top: 37px;
          transform: translateY(-50%);
          color: #94a3b8;
        }

        .input-field {
          width: 100%;
          padding: 11px 14px 11px 44px;
          border-radius: 12px;
          border: 2px solid #e2e8f0;
          background: #f8fafc;
          font-size: 14px;
        }

        .input-field:focus {
          outline: none;
          border-color: #2563eb;
          background: #ffffff;
        }

        .password-toggle {
          position: absolute;
          right: 14px;
          top: 37px;
          transform: translateY(-50%);
          border: none;
          background: none;
          color: #64748b;
          cursor: pointer;
        }

        .error-text {
          font-size: 12px;
          color: #dc2626;
          margin-top: 4px;
        }

        .general-error {
          font-size: 13px;
          color: #dc2626;
          margin-bottom: 10px;
        }

        .signup-btn {
          width: 100%;
          padding: 14px;
          border-radius: 12px;
          background: #2563eb;
          color: white;
          font-weight: 700;
          border: none;
          margin-top: 10px;
          transition: 0.3s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        .signup-btn:hover {
          background: #1e40af;
        }

        .signup-footer {
          text-align: center;
          margin-top: 20px;
          font-size: 14px;
          color: #64748b;
        }

        .signup-footer a {
          color: #2563eb;
          font-weight: 600;
          text-decoration: none;
        }

        @media (max-width: 900px) {
          .signup-page {
            flex-direction: column;
          }

          .signup-left {
            padding: 50px 30px 32px;
            text-align: center;
            flex: none;
          }

          .signup-right {
            padding: 24px 20px 40px;
            align-items: center;
            justify-content: flex-start;
          }

          .signup-card {
            max-width: 480px;
            width: 100%;
            margin: 0 auto;
          }
        }

        @media (max-width: 640px) {
          .signup-left {
            padding: 32px 18px 24px;
          }

          .signup-left h1 {
            font-size: 32px;
            margin-bottom: 14px;
          }

          .signup-left p {
            font-size: 14px;
          }

          .signup-left li {
            font-size: 14px;
            margin-bottom: 8px;
          }

          .signup-right {
            padding: 16px 12px 28px;
          }

          .signup-card {
            padding: 28px 20px;
            border-radius: 18px;
            box-shadow: 0 12px 30px rgba(15, 23, 42, 0.12);
          }

          .signup-title {
            font-size: 24px;
          }

          .signup-subtitle {
            font-size: 13px;
          }
        }
      `}</style>

      <motion.div
        className="signup-left"
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <h1>Admin Access Control</h1>
        <p>
          Create an admin account to manage services, approve providers, and
          keep LocalServe clean and trustworthy.
        </p>
        <ul>
          <li>✔ Approve or reject service listings</li>
          <li>✔ Flag and manage verified providers</li>
          <li>✔ Maintain platform quality and trust</li>
        </ul>
      </motion.div>

      <motion.div
        className="signup-right"
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="signup-card">
          <h2 className="signup-title">Create Admin Account</h2>
          <p className="signup-subtitle">
            Set up an admin profile to manage the platform
          </p>

          {errors.general && (
            <div className="general-error">{errors.general}</div>
          )}

          <div className="role-chip">
            <FaUser />
            Admin role
          </div>

          <div className="input-group-custom">
            <label className="input-label">Full name</label>
            <FaUser className="input-icon" />
            <input
              className="input-field"
              placeholder="Admin name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setErrors({ ...errors, name: "" });
              }}
            />
            {errors.name && <div className="error-text">{errors.name}</div>}
          </div>

          <div className="input-group-custom">
            <label className="input-label">Email address</label>
            <FaEnvelope className="input-icon" />
            <input
              className="input-field"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrors({ ...errors, email: "" });
              }}
            />
            {errors.email && <div className="error-text">{errors.email}</div>}
          </div>

          <div className="input-group-custom">
            <label className="input-label">Password</label>
            <FaLock className="input-icon" />
            <input
              type={showPassword ? "text" : "password"}
              className="input-field"
              placeholder="Minimum 6 characters"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrors({ ...errors, password: "" });
              }}
            />
            <button
              className="password-toggle"
              type="button"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
            {errors.password && (
              <div className="error-text">{errors.password}</div>
            )}
          </div>

          <button className="signup-btn" onClick={handleSignup}>
            Create Admin <FaArrowRight />
          </button>

          <div className="signup-footer">
            Already have an admin account?{" "}
            <a href="/admin/login">Login</a>
          </div>
        </div>
      </motion.div>
    </div>
  );
}