import { motion } from "framer-motion";
import { useMemo } from "react";
import {
  FaRocket,
  FaLightbulb,
  FaCog,
  FaPalette,
  FaUsers,
  FaShieldAlt,
  FaStar,
  FaCheckCircle,
} from "react-icons/fa";

export default function About() {
  const fadeUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0 },
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  // 🔹 read current user
  const authUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("authUser") || "null");
    } catch {
      return null;
    }
  }, []);

  const isVendor = authUser?.role === "vendor";
  const isConsumer = !!authUser && !isVendor;
  const isGuest = !authUser;

  // 🧑‍💻 HERO TEXT
  const heroTitle = isVendor
    ? "About LocalServe for Providers"
    : "About LocalServe";

  const heroSubtitle = isVendor
    ? "Built to help local service providers manage requests, showcase their work, and grow their business with transparent ratings and a modern dashboard."
    : isGuest
    ? "LocalServe connects customers and local service providers on a single modern platform, making it easy to discover, compare, and manage services in a transparent and structured way."
    : "Connecting communities with trusted local service providers through a seamless, modern platform designed for convenience, transparency, and reliability.";

  // 🔢 STATS
  const vendorStats = [
    { value: "500+", label: "Active Customers" },
    { value: "4.8★", label: "Average Provider Rating" },
    { value: "24/7", label: "Request Management" },
  ];

  const consumerStats = [
    { value: "1000+", label: "Service Providers" },
    { value: "50+", label: "Service Categories" },
    { value: "24/7", label: "Availability" },
  ];

  const guestStats = [
    { value: "1000+", label: "Providers & Growing" },
    { value: "2", label: "Roles: Customer & Vendor" },
    { value: "50+", label: "Service Categories" },
  ];

  const statsForRole = isVendor
    ? vendorStats
    : isGuest
    ? guestStats
    : consumerStats;

  // ⭐ FEATURES (grid cards)
  const consumerFeatures = [
    {
      icon: <FaShieldAlt />,
      title: "Trusted Providers",
      description:
        "All service providers are verified and rated by real customers.",
    },
    {
      icon: <FaStar />,
      title: "Quality Ratings",
      description:
        "Transparent rating system helps you make informed decisions.",
    },
    {
      icon: <FaCog />,
      title: "Smart Filters",
      description:
        "Advanced filtering to find exactly what you need, when you need it.",
    },
    {
      icon: <FaCheckCircle />,
      title: "Quick Booking",
      description: "Contact and book services with just a few clicks.",
    },
  ];

  const vendorFeatures = [
    {
      icon: <FaUsers />,
      title: "Quality Leads",
      description:
        "Receive structured, high-intent requests from customers looking specifically for your services.",
    },
    {
      icon: <FaStar />,
      title: "Reputation & Reviews",
      description:
        "Build trust with public ratings and reviews displayed on your profile and dashboard.",
    },
    {
      icon: <FaCog />,
      title: "Smart Dashboard",
      description:
        "Track pending, accepted, and completed requests from one clean, easy-to-use interface.",
    },
    {
      icon: <FaRocket />,
      title: "Grow Your Business",
      description:
        "Stand out in search, reach more local customers, and monitor performance metrics over time.",
    },
  ];

  // 🆕 Guest view shows both sides together
  const guestFeatures = [
    {
      icon: <FaUsers />,
      title: "For Customers",
      description:
        "Discover verified local providers, compare ratings, and send structured service requests without confusion.",
    },
    {
      icon: <FaRocket />,
      title: "For Providers",
      description:
        "Create a profile, receive organized leads, manage requests, and grow your local presence.",
    },
    {
      icon: <FaShieldAlt />,
      title: "Trust & Transparency",
      description:
        "Ratings, reviews, and clear availability help both sides interact with confidence.",
    },
    {
      icon: <FaCog />,
      title: "One Unified Platform",
      description:
        "Customers and vendors use the same platform with dedicated flows tailored to their needs.",
    },
  ];

  const features = isVendor
    ? vendorFeatures
    : isGuest
    ? guestFeatures
    : consumerFeatures;

  // 🕒 TIMELINE STEPS
  const consumerTimelineSteps = [
    {
      title: "Search & Filter",
      description:
        "Browse services by category, location, or availability. Use smart filters to narrow down exactly what you need.",
    },
    {
      title: "Review & Compare",
      description:
        "Check ratings, reviews, and service details. Add providers to your favorites for easy comparison and future reference.",
    },
    {
      title: "Book & Connect",
      description:
        "Send a contact request with your preferred date and time. Providers will respond with availability and pricing details.",
    },
  ];

  const vendorTimelineSteps = [
    {
      title: "Create Your Provider Profile",
      description:
        "Set up your business name, locations, availability and description so customers clearly understand what you offer.",
    },
    {
      title: "Receive & Manage Requests",
      description:
        "Handle pending, accepted, and rejected customer requests from your vendor dashboard in a structured way.",
    },
    {
      title: "Deliver Great Service & Earn Reviews",
      description:
        "Complete jobs, collect ratings and reviews, and use performance insights to continuously grow your local business.",
    },
  ];

  const guestTimelineSteps = [
    {
      title: "Choose How You Want to Use LocalServe",
      description:
        "Join as a customer looking for reliable services, or as a local provider offering your expertise.",
    },
    {
      title: "Create Your Account",
      description:
        "Sign up in a few simple steps. Customers can start searching, and providers can set up their profiles.",
    },
    {
      title: "Connect & Grow",
      description:
        "Customers find trusted services easily. Providers receive organized requests and build a public reputation.",
    },
  ];

  const timelineSteps = isVendor
    ? vendorTimelineSteps
    : isGuest
    ? guestTimelineSteps
    : consumerTimelineSteps;

  return (
    <div className="about-page">
      <style>{`
        .about-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
        }

        .about-hero-section {
          background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
          color: white;
          padding: 100px 0 80px;
          position: relative;
          overflow: hidden;
        }

        .about-hero-section::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml,<svg width="60" height="60" xmlns="http://www.w3.org/2000/svg"><circle cx="30" cy="30" r="1.5" fill="rgba(255,255,255,0.1)"/></svg>');
          opacity: 0.4;
        }

        .about-hero-content {
          position: relative;
          z-index: 1;
          max-width: 800px;
          margin: 0 auto;
          text-align: center;
        }

        .about-title {
          font-size: 56px;
          font-weight: 800;
          margin-bottom: 24px;
          letter-spacing: -1px;
        }

        .about-subtitle {
          font-size: 20px;
          opacity: 0.95;
          line-height: 1.7;
          font-weight: 300;
        }

        .about-stats {
          display: flex;
          gap: 40px;
          justify-content: center;
          margin-top: 50px;
          flex-wrap: wrap;
        }

        .stat-item {
          text-align: center;
        }

        .stat-number {
          font-size: 42px;
          font-weight: 800;
          display: block;
          margin-bottom: 8px;
        }

        .stat-label {
          font-size: 14px;
          opacity: 0.9;
          text-transform: uppercase;
          letter-spacing: 1px;
          font-weight: 500;
        }

        .about-content-section {
          padding: 80px 0;
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
          font-size: 40px;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 20px;
          line-height: 1.2;
        }

        .section-description {
          font-size: 18px;
          color: #64748b;
          line-height: 1.8;
          max-width: 700px;
        }

        .about-card {
          background: white;
          border-radius: 20px;
          padding: 40px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          border: 1px solid rgba(226, 232, 240, 0.8);
          height: 100%;
        }

        .about-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.12);
          border-color: #3b82f6;
        }

        .card-icon {
          width: 64px;
          height: 64px;
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          color: white;
          margin-bottom: 24px;
          box-shadow: 0 8px 16px rgba(59, 130, 246, 0.3);
        }

        .card-title {
          font-size: 22px;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 14px;
        }

        .card-description {
          font-size: 16px;
          color: #64748b;
          line-height: 1.7;
          margin-bottom: 0;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 30px;
          margin-top: 50px;
        }

        .feature-card {
          background: white;
          border-radius: 16px;
          padding: 32px;
          text-align: center;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          transition: all 0.3s ease;
          border: 2px solid transparent;
        }

        .feature-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
          border-color: #3b82f6;
        }

        .feature-icon {
          width: 56px;
          height: 56px;
          background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          font-size: 24px;
          color: #2563eb;
        }

        .feature-title {
          font-size: 18px;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 10px;
        }

        .feature-description {
          font-size: 14px;
          color: #64748b;
          line-height: 1.6;
        }

        .timeline-section {
          background: white;
          padding: 80px 0;
          margin-top: 60px;
        }

        .timeline-item {
          display: flex;
          gap: 30px;
          margin-bottom: 50px;
          align-items: flex-start;
        }

        .timeline-number {
          flex-shrink: 0;
          width: 60px;
          height: 60px;
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          font-weight: 800;
          color: white;
          box-shadow: 0 8px 16px rgba(59, 130, 246, 0.3);
        }

        .timeline-content h3 {
          font-size: 24px;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 12px;
        }

        .timeline-content p {
          font-size: 16px;
          color: #64748b;
          line-height: 1.7;
          margin: 0;
        }

        .cta-section {
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          color: white;
          padding: 80px 0;
          margin-top: 60px;
          text-align: center;
        }

        .cta-title {
          font-size: 40px;
          font-weight: 800;
          margin-bottom: 20px;
        }

        .cta-description {
          font-size: 18px;
          opacity: 0.9;
          margin-bottom: 40px;
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
        }

        .cta-button {
          display: inline-block;
          background: white;
          color: #0f172a;
          padding: 16px 40px;
          border-radius: 50px;
          font-size: 16px;
          font-weight: 700;
          text-decoration: none;
          transition: all 0.3s ease;
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
        }

        .cta-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.3);
          color: #0f172a;
        }

        @media (max-width: 768px) {
          .about-title {
            font-size: 40px;
          }

          .section-title {
            font-size: 32px;
          }

          .about-hero-section {
            padding: 60px 0 50px;
          }

          .about-content-section {
            padding: 50px 0;
          }

          .timeline-item {
            flex-direction: column;
            gap: 20px;
          }
        }
      `}</style>

      {/* HERO SECTION */}
      <div className="about-hero-section">
        <div className="container">
          <motion.div
            className="about-hero-content"
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            transition={{ duration: 0.8 }}
          >
            <h1 className="about-title">{heroTitle}</h1>
            <p className="about-subtitle">{heroSubtitle}</p>

            <motion.div
              className="about-stats"
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
            >
              {statsForRole.map((s, idx) => (
                <motion.div key={idx} className="stat-item" variants={fadeUp}>
                  <span className="stat-number">{s.value}</span>
                  <span className="stat-label">{s.label}</span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="about-content-section">
        <div className="container">
          {/* Problem / Challenge Section */}
          <motion.div
            className="text-center mb-5"
            initial="hidden"
            whileInView="visible"
            variants={fadeUp}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <span className="section-badge">
              <FaLightbulb className="me-2" />
              {isVendor ? "For Providers" : isGuest ? "For Everyone" : "The Challenge"}
            </span>
            <h2 className="section-title">
              {isVendor
                ? "Why LocalServe for Service Providers?"
                : isGuest
                ? "Why LocalServe Exists"
                : "The Problem We Address"}
            </h2>
            <p className="section-description mx-auto">
              {isVendor
                ? "Managing leads across calls, WhatsApp chats and random listings can be messy and hard to track. LocalServe gives providers one clean place to receive, organize and respond to customer requests while building a strong public reputation."
                : isGuest
                ? "LocalServe was built for both sides of the local services journey. Customers need a simple, trusted way to find help. Providers need a structured way to receive and manage real leads. We bring both onto one modern platform."
                : "Finding trusted local services like electricians, plumbers, tutors, or home maintenance professionals has always been fragmented and time-consuming. Users struggle with unstructured listings, multiple platforms, and limited transparency in service quality."}
            </p>
          </motion.div>

          {/* Solution Cards */}
          <div className="row g-4 mb-5">
            <motion.div
              className="col-md-6"
              initial="hidden"
              whileInView="visible"
              variants={fadeUp}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <div className="about-card">
                <div className="card-icon">
                  <FaRocket />
                </div>
                <h3 className="card-title">
                  {isVendor
                    ? "Our Solution for Providers"
                    : isGuest
                    ? "One Platform for Customers & Providers"
                    : "Our Solution"}
                </h3>
                <p className="card-description">
                  {isVendor
                    ? "LocalServe gives you a dedicated profile and dashboard where all customer requests arrive in a structured way. You can manage status, availability and contact details from one place while your public rating grows with every completed job."
                    : isGuest
                    ? "As a customer, you can search and compare verified providers with clear ratings and availability. As a provider, you get a modern profile and dashboard to manage requests. Both sides interact in a transparent, structured environment."
                    : "LocalServe consolidates essential service information into a single, structured platform. Real-time filters, availability indicators, ratings, and favorites functionality empower users to make confident decisions quickly and efficiently."}
                </p>
              </div>
            </motion.div>

            <motion.div
              className="col-md-6"
              initial="hidden"
              whileInView="visible"
              variants={fadeUp}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <div className="about-card">
                <div className="card-icon">
                  <FaCog />
                </div>
                <h3 className="card-title">How It Works</h3>
                <p className="card-description">
                  {isVendor
                    ? "Customers discover your service card, send structured requests with preferred time and details, and you handle them from your dashboard. Status changes, visibility of phone numbers, and upcoming work are all organized for you."
                    : isGuest
                    ? "Create a free account as a customer or provider. Customers browse and send requests; providers manage them in the dashboard. Ratings and reviews help keep the ecosystem transparent and high quality."
                    : "Services are presented in an intuitive card-based layout with key details like category, location, availability, and ratings. Dynamic search and filtering update results instantly without page reloads, ensuring a smooth user experience."}
                </p>
              </div>
            </motion.div>

            <motion.div
              className="col-md-6"
              initial="hidden"
              whileInView="visible"
              variants={fadeUp}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <div className="about-card">
                <div className="card-icon">
                  <FaPalette />
                </div>
                <h3 className="card-title">Design Excellence</h3>
                <p className="card-description">
                  Built with a strong emphasis on clarity, accessibility, and
                  responsiveness. Clean spacing, smooth animations, and
                  mobile-first design principles ensure a professional
                  experience across all devices and screen sizes.
                </p>
              </div>
            </motion.div>

            <motion.div
              className="col-md-6"
              initial="hidden"
              whileInView="visible"
              variants={fadeUp}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
            >
              <div className="about-card">
                <div className="card-icon">
                  <FaUsers />
                </div>
                <h3 className="card-title">Community First</h3>
                <p className="card-description">
                  We prioritize building trust within local communities. Every
                  provider is verified, and user reviews help maintain high
                  standards of service quality, creating a reliable ecosystem
                  for both providers and customers.
                </p>
              </div>
            </motion.div>
          </div>

          {/* Features Grid */}
          <motion.div
            className="text-center mt-5 pt-5"
            initial="hidden"
            whileInView="visible"
            variants={fadeUp}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <span className="section-badge">
              <FaStar className="me-2" />
              {isVendor
                ? "Tools for Providers"
                : isGuest
                ? "For Customers & Providers"
                : "Key Features"}
            </span>
            <h2 className="section-title">
              {isVendor
                ? "Why Providers Choose LocalServe"
                : isGuest
                ? "Why People Choose LocalServe"
                : "Why Choose LocalServe"}
            </h2>
          </motion.div>

          <motion.div
            className="features-grid"
            initial="hidden"
            whileInView="visible"
            variants={staggerContainer}
            viewport={{ once: true }}
          >
            {features.map((feature, index) => (
              <motion.div key={index} variants={fadeUp}>
                <div className="feature-card">
                  <div className="feature-icon">{feature.icon}</div>
                  <h4 className="feature-title">{feature.title}</h4>
                  <p className="feature-description">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* TIMELINE SECTION */}
      <div className="timeline-section">
        <div className="container">
          <motion.div
            className="text-center mb-5"
            initial="hidden"
            whileInView="visible"
            variants={fadeUp}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <span className="section-badge">Process</span>
            <h2 className="section-title">
              {isVendor
                ? "How to Get Started as a Provider"
                : isGuest
                ? "How to Get Started on LocalServe"
                : "How to Get Started"}
            </h2>
          </motion.div>

          <div className="row justify-content-center">
            <div className="col-lg-8">
              {timelineSteps.map((step, index) => (
                <motion.div
                  key={index}
                  className="timeline-item"
                  initial="hidden"
                  whileInView="visible"
                  variants={fadeUp}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <div className="timeline-number">{index + 1}</div>
                  <div className="timeline-content">
                    <h3>{step.title}</h3>
                    <p>{step.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CTA SECTION */}
      <motion.div
        className="cta-section"
        initial="hidden"
        whileInView="visible"
        variants={fadeUp}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        <div className="container">
          <h2 className="cta-title">
            {isVendor
              ? "Ready to grow your local business?"
              : isGuest
              ? "Ready to get started with LocalServe?"
              : "Ready to Find Your Service?"}
          </h2>
          <p className="cta-description">
            {isVendor
              ? "Join providers who use LocalServe to manage bookings, showcase reviews, and serve customers more efficiently."
              : isGuest
              ? "Create a free account as a customer or provider and start using LocalServe to connect, book, and grow within your local community."
              : "Join thousands of satisfied customers who have found reliable local services through LocalServe. Start your search today."}
          </p>
          <a
            href={
              isVendor ? "/vendor/dashboard" : isGuest ? "/signup" : "/"
            }
            className="cta-button"
          >
            {isVendor
              ? "Go to Vendor Dashboard"
              : isGuest
              ? "Sign Up Now"
              : "Explore Services"}
          </a>
        </div>
      </motion.div>
    </div>
  );
}