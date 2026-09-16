import React from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";
import "./Footer.css";

function Footer() {
  const currentYear = new Date().getFullYear();
  const { t } = useLanguage();

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
            <p className="footer-desc">{t("footer.description")}</p>
          </div>

          {/* Navigation Column */}
          <div className="footer-col">
            <h4 className="footer-heading">{t("footer.platform")}</h4>
            <ul className="footer-links">
              <li>
                <Link to="/" className="footer-link">
                  {t("nav.home")}
                </Link>
              </li>
              <li>
                <Link to="/tutors" className="footer-link">
                  {t("nav.findTutors")}
                </Link>
              </li>
              <li>
                <Link to="/courses" className="footer-link">
                  {t("nav.courses")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Account Column */}
          <div className="footer-col">
            <h4 className="footer-heading">{t("footer.account")}</h4>
            <ul className="footer-links">
              <li>
                <Link to="/login" className="footer-link">
                  {t("nav.login")}
                </Link>
              </li>
              <li>
                <Link to="/register" className="footer-link">
                  {t("nav.register")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Column */}
          <div className="footer-col">
            <h4 className="footer-heading">{t("footer.contact")}</h4>
            <p className="contact-info">{t("footer.contactQuestion")}</p>
            <p className="footer-desc">{t("footer.contactSoon")}</p>
            <span className="contact-tag">{t("footer.supportHours")}</span>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="footer-bottom">
          <p>© {currentYear} ABUGIDA. {t("footer.rights")}</p>
          <div className="footer-legal">
            <span className="footer-link-disabled">{t("footer.terms")}</span>
            <span className="footer-link-disabled">{t("footer.privacy")}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
