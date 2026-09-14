import React from "react";
import { Link } from "react-router-dom";
import "./Footer.css";

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-top">
          {/* About Column */}
          <div className="footer-about">
            <Link to="/" className="footer-brand">
              <span className="brand-icon">አ</span>
              <span>ABUGIDA</span>
            </Link>
            <p className="footer-desc">
              ABUGIDA connects students with qualified, passionate tutors for
              personalized 1-on-1 learning and self-paced mastery courses.
            </p>
          </div>

          {/* Navigation Column */}
          <div className="footer-col">
            <h4 className="footer-heading">Platform</h4>
            <ul className="footer-links">
              <li>
                <Link to="/" className="footer-link">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/tutors" className="footer-link">
                  Find Tutors
                </Link>
              </li>
              <li>
                <Link to="/courses" className="footer-link">
                  Courses
                </Link>
              </li>
            </ul>
          </div>

          {/* Account Column */}
          <div className="footer-col">
            <h4 className="footer-heading">Account</h4>
            <ul className="footer-links">
              <li>
                <Link to="/login" className="footer-link">
                  Login
                </Link>
              </li>
              <li>
                <Link to="/register" className="footer-link">
                  Register
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Column */}
          <div className="footer-col">
            <h4 className="footer-heading">Contact</h4>
            <p className="contact-info">
              Have questions or feedback?
            </p>
            <p className="footer-desc">
              Contact information coming soon.
            </p>
            <span className="contact-tag">Support Hours: 8:00 AM - 6:00 PM</span>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="footer-bottom">
          <p>© {currentYear} ABUGIDA. All rights reserved.</p>
          <div className="footer-legal">
            <span className="footer-link-disabled">Terms of Service</span>
            <span className="footer-link-disabled">Privacy Policy</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
