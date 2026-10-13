import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Sparkles, CheckCircle2 } from 'lucide-react';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer-root">
      <div className="container footer-container">
        {/* Main Footer Content */}
        <div className="footer-grid">
          {/* Brand Info */}
          <div className="footer-brand-col">
            <Link to="/" className="footer-brand" aria-label="SignBridge Home">
              <div className="footer-logo-icon" aria-hidden="true">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="brand-hand-svg"
                >
                  <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
                  <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2" />
                  <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8" />
                  <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
                </svg>
              </div>
              <span className="brand-name">
                Sign<span className="brand-accent">Bridge</span>
              </span>
            </Link>
            <p className="footer-description">
              SignBridge empowers barrier-free everyday conversations by translating
              supported sign language gestures into readable text and synthesized speech
              through an accessible, real-time experience.
            </p>
            <div className="footer-badges">
              <span className="footer-pill">
                <Sparkles size={13} className="pill-icon" /> AI-Powered Vision
              </span>
              <span className="footer-pill">
                <CheckCircle2 size={13} className="pill-icon" /> WCAG 2.1 Compliant
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-links-col">
            <h3 className="footer-heading">Quick Links</h3>
            <ul className="footer-nav-list">
              <li>
                <Link to="/" className="footer-link">Home</Link>
              </li>
              <li>
                <Link to="/about" className="footer-link">About</Link>
              </li>
              <li>
                <Link to="/translate" className="footer-link">Translate</Link>
              </li>
              <li>
                <Link to="/about#mission" className="footer-link">Mission & Ethics</Link>
              </li>
            </ul>
          </div>

          {/* Accessibility Statement */}
          <div className="footer-accessibility-col">
            <h3 className="footer-heading">Accessibility Statement</h3>
            <p className="footer-accessibility-text">
              SignBridge is designed from the ground up for universal access. We adhere to
              accessible web standards to provide clear contrast, keyboard navigability,
              and screen-reader friendly interactions for all communicators.
            </p>
            <div className="footer-statement-tag">
              Universal Communication Initiative
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom-bar">
          <p className="footer-copyright">
            &copy; {new Date().getFullYear()} SignBridge. All rights reserved.
          </p>
          <div className="footer-legal-links">
            <span className="legal-item">Privacy Policy</span>
            <span className="legal-dot">&bull;</span>
            <span className="legal-item">Terms of Service</span>
            <span className="legal-dot">&bull;</span>
            <span className="legal-item">Accessibility Help</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
