import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Info,
  CheckCircle,
  Scan,
  MessageSquare,
  Volume2,
  Sparkles,
  Accessibility,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import HeroVisual from '../components/HeroVisual';
import './LandingPage.css';

export default function LandingPage() {
  return (
    <div className="landing-page-root">
      {/* =========================================================
          2. HERO SECTION
         ========================================================= */}
      <section className="hero-section" aria-labelledby="hero-title">
        <div className="container hero-container">
          {/* Left Column: Text Content */}
          <div className="hero-content-col">
            {/* Small Label */}
            <div className="hero-badge">
              <Sparkles size={14} className="badge-icon" />
              <span>ACCESSIBLE COMMUNICATION</span>
            </div>

            {/* Main Heading */}
            <h1 id="hero-title" className="hero-heading">
              Bridging Communication Through Sign Language
            </h1>

            {/* Description */}
            <p className="hero-description">
              Communicate without barriers. SignBridge helps translate supported sign
              language gestures into readable text and spoken words through an intuitive,
              camera-based experience.
            </p>

            {/* CTA Buttons */}
            <div className="hero-actions">
              <Link to="/translate" className="btn-primary hero-btn-primary">
                <span>Start Translating</span>
                <ArrowRight size={18} className="btn-arrow" />
              </Link>

              <Link to="/about" className="btn-secondary hero-btn-secondary">
                <Info size={17} className="btn-info" />
                <span>Learn More</span>
              </Link>
            </div>

            {/* Supporting line */}
            <div className="hero-supporting-line">
              <CheckCircle size={17} className="supporting-icon" />
              <span>Designed to make everyday communication more accessible.</span>
            </div>
          </div>

          {/* Right Column: Visual Preview Card */}
          <div className="hero-visual-col">
            <HeroVisual />
          </div>
        </div>
      </section>

      {/* =========================================================
          3. FEATURES SECTION
         ========================================================= */}
      <section className="features-section" aria-labelledby="features-title">
        <div className="container">
          <div className="section-header text-center">
            <h2 id="features-title" className="section-title">
              Designed for Seamless Everyday Communication
            </h2>
            <p className="section-subtitle">
              Simple tools that help people connect through accessible technology.
            </p>
          </div>

          <div className="features-grid">
            {/* Card 1: Real-Time Recognition */}
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <Scan size={26} className="feature-icon" />
              </div>
              <h3 className="feature-card-title">Real-Time Recognition</h3>
              <p className="feature-card-desc">
                Capture supported hand gestures and process them using a sign
                recognition model.
              </p>
              <div className="feature-card-footer">
                <span className="feature-metric">Neural Vision Tracking</span>
              </div>
            </div>

            {/* Card 2: Instant Text Output */}
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <MessageSquare size={26} className="feature-icon" />
              </div>
              <h3 className="feature-card-title">Instant Text Output</h3>
              <p className="feature-card-desc">
                View recognized signs as clear, readable text in the translation interface.
              </p>
              <div className="feature-card-footer">
                <span className="feature-metric">High-Contrast Text</span>
              </div>
            </div>

            {/* Card 3: Voice Assistance */}
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <Volume2 size={26} className="feature-icon" />
              </div>
              <h3 className="feature-card-title">Voice Assistance</h3>
              <p className="feature-card-desc">
                Listen to translated text with optional text-to-speech output.
              </p>
              <div className="feature-card-footer">
                <span className="feature-metric">Natural Speech Audio</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          4. ACCESSIBILITY INFORMATION BANNER
         ========================================================= */}
      <section className="accessibility-banner-section" aria-labelledby="a11y-heading">
        <div className="container">
          <div className="accessibility-banner-card">
            <div className="a11y-icon-container">
              <div className="a11y-icon-bubble">
                <Accessibility size={36} className="a11y-icon" />
              </div>
            </div>

            <div className="a11y-content">
              <span className="a11y-tag">Inclusive Design Standard</span>
              <h2 id="a11y-heading" className="a11y-heading">
                Communication should have no barriers.
              </h2>
              <p className="a11y-description">
                Explore a simple interface designed around clarity, accessibility,
                and inclusive communication.
              </p>
            </div>

            <div className="a11y-action">
              <Link to="/about" className="btn-a11y-outline">
                <span>Learn About Our Accessibility</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          5. CALL-TO-ACTION SECTION
         ========================================================= */}
      <section className="cta-section" aria-labelledby="cta-heading">
        <div className="container">
          <div className="cta-card">
            {/* Ambient Background Accents */}
            <div className="cta-ambient-circle-1" aria-hidden="true"></div>
            <div className="cta-ambient-circle-2" aria-hidden="true"></div>

            <div className="cta-content-wrapper">
              <div className="cta-badge">
                <Zap size={14} /> Ready When You Are
              </div>

              <h2 id="cta-heading" className="cta-heading">
                Ready to translate in real time?
              </h2>

              <p className="cta-description">
                Open the translator, enable your camera, and explore supported sign recognition.
              </p>

              <div className="cta-button-row">
                <Link to="/translate" className="btn-cta-white">
                  <span>Try SignBridge</span>
                  <ArrowRight size={18} />
                </Link>
              </div>

              <div className="cta-trust-items">
                <span className="trust-item">
                  <ShieldCheck size={16} /> Privacy-First (Local Processing Support)
                </span>
                <span className="trust-dot">&bull;</span>
                <span className="trust-item">
                  <CheckCircle size={16} /> No Account Required
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
