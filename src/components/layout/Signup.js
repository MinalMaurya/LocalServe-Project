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
  FaUserCircle,
  FaArrowRight,
} from "react-icons/fa";

export default function Signup() {
  const navigate = useNavigate();

  const [role, setRole] = useState("user");
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

    const users = JSON.parse(localStorage.getItem("registeredUsers") || "[]");
    const exists = users.some((u) => u.email === email && u.role === role);
    if (exists) {
      setErrors({ general: "Account already exists. Please login." });
      return;
    }

    const newUser = { name, email, password, role };
    users.push(newUser);
    localStorage.setItem("registeredUsers", JSON.stringify(users));
    localStorage.setItem("authUser", JSON.stringify(newUser));
    navigate("/");
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
          margin-bottom: 28px;
        }

        .role-selector {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 22px;
        }

        .role-option {
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          padding: 14px;
          text-align: center;
          cursor: pointer;
          transition: 0.3s;
          background: #f8fafc;
        }

        .role-option.active {
          border-color: #2563eb;
          background: #eff6ff;
        }

        .role-icon {
          color: #2563eb;
          font-size: 20px;
          margin-bottom: 6px;
        }

        .input-group-custom {
          position: relative;
          margin-bottom: 18px;
        }

        .input-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
        }

        .input-field {
          width: 100%;
          padding: 13px 14px 13px 44px;
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
          top: 50%;
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
            flex-direction: column; /* blue section on top, form below */
          }

          .signup-left {
            padding: 50px 30px 32px;
            text-align: center;
            flex: none; /* don't stretch full height */
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

      {/* LEFT SIDE - BLUE PANEL */}
      <motion.div
        className="signup-left"
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <h1>Join LocalServe</h1>
        <p>
          Discover trusted local professionals for your everyday needs. Book
          services faster, smarter, and with confidence.
        </p>
        <ul>
          <li>✔ Verified local service providers</li>
          <li>✔ Easy shortlisting & requests</li>
          <li>✔ Transparent & reliable experience</li>
        </ul>
      </motion.div>

      {/* RIGHT SIDE - FORM PANEL */}
      <motion.div
        className="signup-right"
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="signup-card">
          <h2 className="signup-title">Create Account</h2>
          <p className="signup-subtitle">
            Sign up to get started with LocalServe
          </p>

          {errors.general && (
            <div className="error-text mb-2">{errors.general}</div>
          )}

          <div className="role-selector">
            <div
              className={`role-option ${role === "user" ? "active" : ""}`}
              onClick={() => setRole("user")}
            >
              <div className="role-icon">
                <FaUser />
              </div>
              User
            </div>
            <div
              className={`role-option ${role === "vendor" ? "active" : ""}`}
              onClick={() => setRole("vendor")}
            >
              <div className="role-icon">
                <FaBriefcase />
              </div>
              Provider
            </div>
          </div>

          <div className="input-group-custom">
            <FaUserCircle className="input-icon" />
            <input
              className="input-field"
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            {errors.name && <div className="error-text">{errors.name}</div>}
          </div>

          <div className="input-group-custom">
            <FaEnvelope className="input-icon" />
            <input
              className="input-field"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {errors.email && <div className="error-text">{errors.email}</div>}
          </div>

          <div className="input-group-custom">
            <FaLock className="input-icon" />
            <input
              type={showPassword ? "text" : "password"}
              className="input-field"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
            Sign Up <FaArrowRight />
          </button>

          <div className="signup-footer">
            Already have an account? <a href="/login">Login</a>
          </div>
        </div>
      </motion.div>
    </div>
  );
}