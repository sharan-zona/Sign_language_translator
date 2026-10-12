import React, { useState, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { Menu, X, ArrowRight, Eye, Volume2 } from 'lucide-react';
import './Navbar.css';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`navbar-header ${scrolled ? 'scrolled' : ''}`}>
      <div className="container navbar-container">
        {/* Left: Brand Logo */}
        <Link to="/" className="navbar-brand" aria-label="SignBridge Home">
          <div className="brand-icon-wrapper" aria-hidden="true">
            <svg
              className="brand-hand-svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Hand outline icon */}
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

        {/* Center/Desktop Navigation Links */}
        <nav className="nav-links-desktop" aria-label="Main Navigation">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `nav-link ${isActive ? 'nav-link-active' : ''}`
            }
          >
            Home
          </NavLink>
          <NavLink
            to="/about"
            className={({ isActive }) =>
              `nav-link ${isActive ? 'nav-link-active' : ''}`
            }
          >
            About
          </NavLink>
          <NavLink
            to="/translate"
            className={({ isActive }) =>
              `nav-link ${isActive ? 'nav-link-active' : ''}`
            }
          >
            Translate
          </NavLink>
        </nav>

        {/* Right Actions */}
        <div className="navbar-actions-desktop">
          {/* Accessible indicator/icon */}
          <div
            className="accessible-badge"
            title="Designed for accessibility and screen reader support"
            aria-label="Accessible Design Verified"
          >
            <Eye className="accessible-icon" size={16} />
            <span className="accessible-text">Accessible</span>
          </div>

          <Link to="/translate" className="btn-start-translating">
            <span>Start Translating</span>
            <ArrowRight size={16} className="btn-icon" />
          </Link>
        </div>

        {/* Mobile Hamburger Toggle Button */}
        <button
          type="button"
          className="mobile-menu-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-expanded={mobileMenuOpen}
          aria-label={mobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      <div className={`mobile-menu-drawer ${mobileMenuOpen ? 'is-open' : ''}`}>
        <nav className="mobile-nav-links" aria-label="Mobile Navigation">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `mobile-nav-link ${isActive ? 'mobile-nav-link-active' : ''}`
            }
          >
            Home
          </NavLink>
          <NavLink
            to="/about"
            className={({ isActive }) =>
              `mobile-nav-link ${isActive ? 'mobile-nav-link-active' : ''}`
            }
          >
            About
          </NavLink>
          <NavLink
            to="/translate"
            className={({ isActive }) =>
              `mobile-nav-link ${isActive ? 'mobile-nav-link-active' : ''}`
            }
          >
            Translate
          </NavLink>

          <div className="mobile-nav-footer">
            <div className="mobile-accessible-info">
              <Eye size={16} />
              <span>Built with high contrast & screen-reader compatibility</span>
            </div>
            <Link to="/translate" className="btn-start-translating mobile-btn-full">
              <span>Start Translating</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
