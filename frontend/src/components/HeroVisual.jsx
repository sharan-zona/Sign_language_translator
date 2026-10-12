import React, { useState } from 'react';
import { Volume2, Sparkles, Check, Activity, Camera } from 'lucide-react';
import heroImg from '../assets/hero-sign.jpg';
import './HeroVisual.css';

export default function HeroVisual() {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Play text-to-speech audio when user clicks speaker
  const handlePlaySpeech = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance("Hello! How can I help you?");
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.onstart = () => setIsPlayingAudio(true);
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
    } else {
      setIsPlayingAudio(true);
      setTimeout(() => setIsPlayingAudio(false), 1500);
    }
  };

  return (
    <div className="hero-visual-card" aria-label="Sign Language Gesture Recognition Preview">
      {/* Top Card Title / Camera Bar */}
      <div className="preview-top-bar">
        <div className="preview-status-pill">
          <span className="live-pulse-dot" aria-hidden="true"></span>
          <span className="status-label-bold">Gesture Recognition</span>
          <span className="status-divider">•</span>
          <span className="status-model-name">ASL Neural Engine</span>
        </div>
        <div className="camera-spec-badge">
          <Camera size={13} className="spec-icon" />
          <span>720p HD</span>
        </div>
      </div>

      {/* Main Image Stage with Vision Overlays */}
      <div className="preview-image-container">
        <img
          src={heroImg}
          alt="Illustration showing person performing a sign language greeting gesture"
          className="preview-photo"
          loading="eager"
        />

        {/* Camera Recognition Frame / Viewfinder HUD Reticles */}
        <div className="hud-corner hud-top-left" aria-hidden="true"></div>
        <div className="hud-corner hud-top-right" aria-hidden="true"></div>
        <div className="hud-corner hud-bottom-left" aria-hidden="true"></div>
        <div className="hud-corner hud-bottom-right" aria-hidden="true"></div>

        {/* MediaPipe-style Landmark Skeleton Overlay on the elevated hand */}
        <svg
          className="hand-landmarks-svg"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {/* Skeletal Bounding Box */}
          <rect
            x="26"
            y="30"
            width="17"
            height="26"
            rx="2"
            className="landmark-bounding-box"
          />

          {/* Palm lines */}
          <line x1="34" y1="52" x2="31" y2="48" className="skeleton-line" />
          <line x1="34" y1="52" x2="33" y2="44" className="skeleton-line" />
          <line x1="34" y1="52" x2="36" y2="43" className="skeleton-line" />
          <line x1="34" y1="52" x2="38" y2="44" className="skeleton-line" />
          <line x1="34" y1="52" x2="40" y2="47" className="skeleton-line" />

          {/* Thumb */}
          <line x1="40" y1="47" x2="41.5" y2="44" className="skeleton-line" />
          <line x1="41.5" y1="44" x2="42" y2="41.5" className="skeleton-line" />

          {/* Index finger */}
          <line x1="38" y1="44" x2="38.5" y2="39" className="skeleton-line" />
          <line x1="38.5" y1="39" x2="38.5" y2="34" className="skeleton-line" />
          <line x1="38.5" y1="34" x2="38.5" y2="32" className="skeleton-line" />

          {/* Middle finger */}
          <line x1="36" y1="43" x2="36" y2="38" className="skeleton-line" />
          <line x1="36" y1="38" x2="36" y2="33.5" className="skeleton-line" />
          <line x1="36" y1="33.5" x2="36" y2="31.5" className="skeleton-line" />

          {/* Ring finger */}
          <line x1="33" y1="44" x2="33.5" y2="39" className="skeleton-line" />
          <line x1="33.5" y1="39" x2="34" y2="34.5" className="skeleton-line" />
          <line x1="34" y1="34.5" x2="34" y2="32.5" className="skeleton-line" />

          {/* Little finger */}
          <line x1="31" y1="48" x2="30.5" y2="44" className="skeleton-line" />
          <line x1="30.5" y1="44" x2="30" y2="39.5" className="skeleton-line" />
          <line x1="30" y1="39.5" x2="30" y2="37" className="skeleton-line" />

          {/* Key landmark node dots */}
          <circle cx="34" cy="52" r="1.3" className="landmark-node wrist-node" />
          <circle cx="31" cy="48" r="1.1" className="landmark-node" />
          <circle cx="33" cy="44" r="1.1" className="landmark-node" />
          <circle cx="36" cy="43" r="1.1" className="landmark-node" />
          <circle cx="38" cy="44" r="1.1" className="landmark-node" />
          <circle cx="40" cy="47" r="1.1" className="landmark-node" />
          <circle cx="41.5" cy="44" r="1.1" className="landmark-node" />
          <circle cx="42" cy="41.5" r="1.2" className="landmark-node tip-node" />
          <circle cx="38.5" cy="39" r="1.1" className="landmark-node" />
          <circle cx="38.5" cy="34" r="1.1" className="landmark-node" />
          <circle cx="38.5" cy="32" r="1.2" className="landmark-node tip-node" />
          <circle cx="36" cy="38" r="1.1" className="landmark-node" />
          <circle cx="36" cy="33.5" r="1.1" className="landmark-node" />
          <circle cx="36" cy="31.5" r="1.2" className="landmark-node tip-node" />
          <circle cx="33.5" cy="39" r="1.1" className="landmark-node" />
          <circle cx="34" cy="34.5" r="1.1" className="landmark-node" />
          <circle cx="34" cy="32.5" r="1.2" className="landmark-node tip-node" />
          <circle cx="30.5" cy="44" r="1.1" className="landmark-node" />
          <circle cx="30" cy="39.5" r="1.1" className="landmark-node" />
          <circle cx="30" cy="37" r="1.2" className="landmark-node tip-node" />
        </svg>

        {/* Hand Landmark Tag */}
        <div className="hand-detection-tag" aria-hidden="true">
          <Activity size={11} />
          <span>Hand Tracked [98.8%]</span>
        </div>

        {/* Floating Card: Sample Recognized Text */}
        <div className="floating-recognition-card">
          <div className="floating-card-header">
            <span className="detected-label">Recognized Gesture</span>
            <span className="confidence-pill">
              <Check size={11} /> 98.8% match
            </span>
          </div>

          <div className="floating-card-body">
            <p className="recognized-text-quote">
              &ldquo;Hello! How can I help you?&rdquo;
            </p>
            <button
              type="button"
              className={`speaker-action-btn ${isPlayingAudio ? 'is-speaking' : ''}`}
              onClick={handlePlaySpeech}
              title="Listen to speech output"
              aria-label="Listen to translated speech output: Hello! How can I help you?"
            >
              <Volume2 size={16} />
              <span className="sr-only">Read text aloud</span>
            </button>
          </div>

          <div className="floating-card-footer">
            <div className="speech-waveform" aria-hidden="true">
              <span className="wave-bar bar-1"></span>
              <span className="wave-bar bar-2"></span>
              <span className="wave-bar bar-3"></span>
              <span className="wave-bar bar-4"></span>
              <span className="wave-bar bar-5"></span>
            </div>
            <span className="synthesized-note">Text &bull; Voice Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
}
