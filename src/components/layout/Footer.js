export default function Footer() {
  return (
    <footer>
      <style>{`
        .site-footer {
          background: #0f172a;
          color: #e5e7eb;
          padding: 50px 0 30px;
          margin-top: 80px;
        }

        .footer-brand {
          font-size: 22px;
          font-weight: 800;
          color: #60a5fa;
        }

        .footer-text {
          color: #9ca3af;
          font-size: 14px;
          margin-top: 10px;
          max-width: 420px;
        }

        .footer-link {
          color: #9ca3af;
          text-decoration: none;
          font-size: 14px;
          display: block;
          margin-bottom: 8px;
        }

        .footer-link:hover {
          color: #ffffff;
        }

        .footer-divider {
          border-top: 1px solid #1f2937;
          margin: 30px 0 15px;
        }

        .footer-bottom {
          font-size: 13px;
          color: #9ca3af;
        }
      `}</style>

      <div className="site-footer">
        <div className="container">
          <div className="row">
            {/* LEFT */}
            <div className="col-md-6">
              <div className="footer-brand">LocalServe</div>
              <p className="footer-text">
                Discover trusted local service providers with a clean, reliable,
                and user-friendly experience.
              </p>
            </div>

            {/* RIGHT */}
            <div className="col-md-3">
              <a href="/" className="footer-link">
                Home
              </a>
              <a href="/shortlist" className="footer-link">
                Shortlist
              </a>
              <a href="/about" className="footer-link">
                About
              </a>
            </div>

            <div className="col-md-3">
              <span className="footer-link">Contact</span>
              <span className="footer-link">Privacy Policy</span>
              <span className="footer-link">Terms & Conditions</span>
            </div>
          </div>

          <div className="footer-divider"></div>

          <div className="text-center footer-bottom">
            © 2026 LocalServe · Built for Web Development Challenge
          </div>
        </div>
      </div>
    </footer>
  );
}
