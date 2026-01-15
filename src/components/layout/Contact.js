import { motion } from "framer-motion";
import { useState } from "react";
import {
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaClock,
  FaPaperPlane,
  FaCheckCircle,
  FaFacebook,
  FaTwitter,
  FaLinkedin,
  FaInstagram,
  FaQuestionCircle,
  FaHeadset,
  FaBriefcase,
} from "react-icons/fa";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    category: "General Inquiry",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});

  const fadeUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0 },
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const contactInfo = [
    {
      icon: <FaEnvelope />,
      title: "Email Us",
      content: "support@localserve.com",
      link: "mailto:support@localserve.com",
      color: "#3b82f6",
    },
    {
      icon: <FaPhone />,
      title: "Call Us",
      content: "+91 1234567890",
      link: "tel:+91 1234567890",
      color: "#10b981",
    },
    {
      icon: <FaMapMarkerAlt />,
      title: "Visit Us",
      content: "Kandivali east, Mumbai",
      link: "#",
      color: "#f59e0b",
    },
    {
      icon: <FaClock />,
      title: "Business Hours",
      content: "Mon-Fri: 9AM-6PM",
      link: "#",
      color: "#8b5cf6",
    },
  ];

  const faqCategories = [
    {
      icon: <FaQuestionCircle />,
      title: "General Questions",
      description: "Learn about our platform and services",
    },
    {
      icon: <FaHeadset />,
      title: "Customer Support",
      description: "Get help with your account or bookings",
    },
    {
      icon: <FaBriefcase />,
      title: "For Service Providers",
      description: "Information about joining our platform",
    },
  ];

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!formData.subject.trim()) {
      newErrors.subject = "Subject is required";
    }

    if (!formData.message.trim()) {
      newErrors.message = "Message is required";
    } else if (formData.message.trim().length < 10) {
      newErrors.message = "Message must be at least 10 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (validateForm()) {
      console.log("Form submitted:", formData);
      setSubmitted(true);
      setTimeout(() => {
        setFormData({
          name: "",
          email: "",
          phone: "",
          subject: "",
          category: "General Inquiry",
          message: "",
        });
        setSubmitted(false);
      }, 3000);
    }
  };

  return (
    <div className="contact-page">
      <style>{`
        .contact-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
        }

        .contact-hero {
          background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
          color: white;
          padding: 80px 0 60px;
          position: relative;
          overflow: hidden;
        }

        .contact-hero::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml,<svg width="60" height="60" xmlns="http://www.w3.org/2000/svg"><circle cx="30" cy="30" r="1.5" fill="rgba(255,255,255,0.1)"/></svg>');
          opacity: 0.4;
        }

        .contact-hero-content {
          position: relative;
          z-index: 1;
          text-align: center;
          max-width: 700px;
          margin: 0 auto;
        }

        .contact-title {
          font-size: 48px;
          font-weight: 800;
          margin-bottom: 20px;
          letter-spacing: -1px;
        }

        .contact-subtitle {
          font-size: 18px;
          opacity: 0.95;
          line-height: 1.7;
        }

        .contact-content {
          padding: 80px 0;
        }

        .contact-info-card {
          background: white;
          border-radius: 20px;
          padding: 32px;
          text-align: center;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
          transition: all 0.3s ease;
          border: 2px solid transparent;
          height: 100%;
        }

        .contact-info-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
          border-color: var(--card-color);
        }

        .contact-icon-wrapper {
          width: 64px;
          height: 64px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          font-size: 28px;
          color: white;
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
        }

        .contact-info-title {
          font-size: 18px;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 8px;
        }

        .contact-info-content {
          font-size: 15px;
          color: #64748b;
          text-decoration: none;
          transition: color 0.2s ease;
        }

        .contact-info-content:hover {
          color: #3b82f6;
        }

        .form-section {
          background: white;
          border-radius: 24px;
          padding: 48px;
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.08);
        }

        .form-title {
          font-size: 32px;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 12px;
        }

        .form-description {
          font-size: 16px;
          color: #64748b;
          margin-bottom: 40px;
        }

        .form-group {
          margin-bottom: 24px;
        }

        .form-label {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: #0f172a;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .form-control-custom {
          width: 100%;
          padding: 14px 18px;
          font-size: 15px;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          transition: all 0.3s ease;
          background: #f8fafc;
        }

        .form-control-custom:focus {
          outline: none;
          border-color: #3b82f6;
          background: white;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
        }

        .form-control-custom.error {
          border-color: #ef4444;
        }

        .error-message {
          color: #ef4444;
          font-size: 13px;
          margin-top: 6px;
          display: block;
        }

        .submit-button {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
          border: none;
          padding: 16px 40px;
          font-size: 16px;
          font-weight: 700;
          border-radius: 50px;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 8px 16px rgba(59, 130, 246, 0.3);
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .submit-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 24px rgba(59, 130, 246, 0.4);
        }

        .submit-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .success-message {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          padding: 20px;
          border-radius: 16px;
          margin-bottom: 30px;
          display: flex;
          align-items: center;
          gap: 12px;
          font-weight: 600;
          box-shadow: 0 8px 16px rgba(16, 185, 129, 0.3);
        }

        .faq-section {
          margin-top: 60px;
        }

        .section-badge {
          display: inline-block;
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
          padding: 8px 20px;
          border-radius: 50px;
          font-size: 13px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 20px;
        }

        .section-title {
          font-size: 36px;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 16px;
        }

        .faq-card {
          background: white;
          border-radius: 16px;
          padding: 32px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          transition: all 0.3s ease;
          border: 2px solid transparent;
          height: 100%;
        }

        .faq-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
          border-color: #3b82f6;
        }

        .faq-icon {
          width: 56px;
          height: 56px;
          background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
          font-size: 24px;
          color: #2563eb;
        }

        .faq-title {
          font-size: 18px;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 10px;
        }

        .faq-description {
          font-size: 14px;
          color: #64748b;
          line-height: 1.6;
        }

        .social-section {
          background: white;
          border-radius: 20px;
          padding: 40px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
          margin-top: 40px;
        }

        .social-title {
          font-size: 20px;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 20px;
          text-align: center;
        }

        .social-links {
          display: flex;
          justify-content: center;
          gap: 16px;
          flex-wrap: wrap;
        }

        .social-icon {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          color: white;
          transition: all 0.3s ease;
          text-decoration: none;
        }

        .social-icon:hover {
          transform: translateY(-4px) scale(1.1);
        }

        .social-facebook {
          background: #1877f2;
        }

        .social-twitter {
          background: #1da1f2;
        }

        .social-linkedin {
          background: #0a66c2;
        }

        .social-instagram {
          background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%);
        }

        @media (max-width: 768px) {
          .contact-title {
            font-size: 36px;
          }

          .form-section {
            padding: 32px 24px;
          }

          .form-title {
            font-size: 28px;
          }

          .contact-content {
            padding: 50px 0;
          }
        }
      `}</style>
      <div className="contact-hero">
        <div className="container">
          <motion.div
            className="contact-hero-content"
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            transition={{ duration: 0.8 }}
          >
            <h1 className="contact-title">Get In Touch</h1>
            <p className="contact-subtitle">
              Have questions or need assistance? We're here to help! Reach out
              to our team and we'll get back to you as soon as possible.
            </p>
          </motion.div>
        </div>
      </div>
      <div className="contact-content">
        <div className="container">
          <motion.div
            className="row g-4 mb-5"
            initial="hidden"
            whileInView="visible"
            variants={staggerContainer}
            viewport={{ once: true }}
          >
            {contactInfo.map((info, index) => (
              <motion.div
                key={index}
                className="col-md-6 col-lg-3"
                variants={fadeUp}
              >
                <div
                  className="contact-info-card"
                  style={{ "--card-color": info.color }}
                >
                  <div
                    className="contact-icon-wrapper"
                    style={{ background: info.color }}
                  >
                    {info.icon}
                  </div>
                  <h3 className="contact-info-title">{info.title}</h3>
                  <a
                    href={info.link}
                    className="contact-info-content"
                    onClick={(e) => {
                      if (info.link === "#") e.preventDefault();
                    }}
                  >
                    {info.content}
                  </a>
                </div>
              </motion.div>
            ))}
          </motion.div>
          <div className="row g-5">
            <div className="col-lg-8">
              <motion.div
                className="form-section"
                initial="hidden"
                whileInView="visible"
                variants={fadeUp}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                <h2 className="form-title">Send Us a Message</h2>
                <p className="form-description">
                  Fill out the form below and our team will respond within 24
                  hours.
                </p>

                {submitted && (
                  <motion.div
                    className="success-message"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <FaCheckCircle size={24} />
                    <span>
                      Thank you! Your message has been sent successfully. We'll
                      get back to you soon.
                    </span>
                  </motion.div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="row g-4">
                    <div className="col-md-6">
                      <div className="form-group">
                        <label className="form-label">Your Name *</label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          className={`form-control-custom ${
                            errors.name ? "error" : ""
                          }`}
                          placeholder="Firstname Lastname"
                        />
                        {errors.name && (
                          <span className="error-message">{errors.name}</span>
                        )}
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="form-group">
                        <label className="form-label">Email Address *</label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          className={`form-control-custom ${
                            errors.email ? "error" : ""
                          }`}
                          placeholder="xyz@example.com"
                        />
                        {errors.email && (
                          <span className="error-message">{errors.email}</span>
                        )}
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="form-group">
                        <label className="form-label">Phone Number</label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          className="form-control-custom"
                          placeholder="+91 XXXXXXXXXX"
                        />
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="form-group">
                        <label className="form-label">Category</label>
                        <select
                          name="category"
                          value={formData.category}
                          onChange={handleChange}
                          className="form-control-custom"
                        >
                          <option>General Inquiry</option>
                          <option>Technical Support</option>
                          <option>Service Provider</option>
                          <option>Billing Question</option>
                          <option>Partnership</option>
                          <option>Other</option>
                        </select>
                      </div>
                    </div>

                    <div className="col-12">
                      <div className="form-group">
                        <label className="form-label">Subject *</label>
                        <input
                          type="text"
                          name="subject"
                          value={formData.subject}
                          onChange={handleChange}
                          className={`form-control-custom ${
                            errors.subject ? "error" : ""
                          }`}
                          placeholder="How can we help you?"
                        />
                        {errors.subject && (
                          <span className="error-message">
                            {errors.subject}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="col-12">
                      <div className="form-group">
                        <label className="form-label">Message *</label>
                        <textarea
                          name="message"
                          value={formData.message}
                          onChange={handleChange}
                          className={`form-control-custom ${
                            errors.message ? "error" : ""
                          }`}
                          rows={6}
                          placeholder="Tell us more about your inquiry..."
                        />
                        {errors.message && (
                          <span className="error-message">
                            {errors.message}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="col-12">
                      <button
                        type="submit"
                        className="submit-button"
                        disabled={submitted}
                      >
                        <FaPaperPlane />
                        {submitted ? "Message Sent!" : "Send Message"}
                      </button>
                    </div>
                  </div>
                </form>
              </motion.div>
            </div>
            <div className="col-lg-4">
              <motion.div
                initial="hidden"
                whileInView="visible"
                variants={fadeUp}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <h3 className="section-title mb-4" style={{ fontSize: "24px" }}>
                  Quick Help
                </h3>
                <div className="d-flex flex-column gap-3">
                  {faqCategories.map((category, index) => (
                    <div key={index} className="faq-card">
                      <div className="faq-icon">{category.icon}</div>
                      <h4 className="faq-title">{category.title}</h4>
                      <p className="faq-description">{category.description}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
              <motion.div
                className="social-section"
                initial="hidden"
                whileInView="visible"
                variants={fadeUp}
                transition={{ duration: 0.6, delay: 0.3 }}
                viewport={{ once: true }}
              >
                <h3 className="social-title">Connect With Us</h3>
                <div className="social-links">
                  <a
                    href="https://facebook.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-icon social-facebook"
                  >
                    <FaFacebook />
                  </a>
                  <a
                    href="https://twitter.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-icon social-twitter"
                  >
                    <FaTwitter />
                  </a>
                  <a
                    href="https://linkedin.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-icon social-linkedin"
                  >
                    <FaLinkedin />
                  </a>
                  <a
                    href="https://instagram.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-icon social-instagram"
                  >
                    <FaInstagram />
                  </a>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
