import React from 'react';
import { Link } from 'react-router-dom';
import {
  Camera,
  Layers,
  Activity,
  Cpu,
  Server,
  Volume2,
  ArrowRight,
  ArrowDown,
  Sparkles,
  Accessibility,
  Eye,
  Scan,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Video,
  CornerDownRight,
  RotateCcw,
  Check,
  X,
  Play,
  Square,
  Sliders,
  ChevronRight,
  Info
} from 'lucide-react';
import './AboutPage.css';

export default function AboutPage() {
  return (
    <div className="about-page-root">
      <div className="container about-container">
        {/* =========================================================
            2. PAGE INTRODUCTION
           ========================================================= */}
        <section className="about-intro-section" aria-labelledby="about-intro-title">
          <div className="about-intro-grid">
            <div className="about-intro-text">
              <div className="about-eyebrow-badge">
                <Sparkles size={14} className="eyebrow-icon" />
                <span>ABOUT SIGNBRIDGE</span>
              </div>

              <h1 id="about-intro-title" className="about-intro-heading">
                Technology That Brings Communication Closer
              </h1>

              <p className="about-intro-description">
                SignBridge is a sign language translation application designed to support
                accessible communication by recognizing supported hand gestures and presenting
                the results as readable text and optional spoken output.
              </p>

              <div className="about-feature-pills">
                <div className="feature-pill">
                  <Camera size={16} className="pill-icon" />
                  <span>Camera-Based Recognition</span>
                </div>
                <div className="feature-pill">
                  <Volume2 size={16} className="pill-icon" />
                  <span>Text and Voice Output</span>
                </div>
              </div>
            </div>

            {/* Accessibility-Themed Illustration on the Right */}
            <div className="about-intro-visual" aria-hidden="true">
              <div className="intro-illustration-card">
                <div className="illustration-graphic">
                  <div className="illustration-circle-bg">
                    <svg
                      className="illustration-hand-svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
                      <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2" />
                      <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8" />
                      <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
                    </svg>
                  </div>
                  <div className="floating-badge-top">
                    <Accessibility size={14} />
                    <span>Inclusive UX</span>
                  </div>
                  <div className="floating-badge-bottom">
                    <CheckCircle2 size={14} />
                    <span>Real-Time Processing</span>
                  </div>
                </div>
                <div className="illustration-caption">
                  <span>Accessible Computer Vision Interface</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================
            3. OUR MISSION
           ========================================================= */}
        <section className="about-mission-section" aria-labelledby="about-mission-title">
          <div className="mission-card">
            <div className="mission-icon-wrapper">
              <Accessibility size={32} className="mission-icon" />
            </div>
            <div className="mission-content">
              <h2 id="about-mission-title" className="mission-heading">
                Our Mission
              </h2>
              <p className="mission-description">
                Our mission is to make communication more accessible by combining intuitive
                design, computer vision, and machine learning. SignBridge aims to provide a simple
                interface where users can explore supported sign recognition without unnecessary
                complexity.
              </p>
            </div>
          </div>
        </section>

        {/* =========================================================
            4. HOW SIGNBRIDGE WORKS
           ========================================================= */}
        <section className="how-it-works-section" aria-labelledby="how-it-works-title">
          <div className="section-header text-center">
            <h2 id="how-it-works-title" className="section-heading">
              How It Works
            </h2>
            <p className="section-subtitle">
              From camera input to readable communication in four steps.
            </p>
          </div>

          <div className="workflow-steps-container">
            {/* Step 1 */}
            <div className="workflow-step-card">
              <div className="step-header">
                <span className="step-number-badge">1</span>
                <div className="step-icon-bg">
                  <Camera size={22} className="step-icon" />
                </div>
              </div>
              <h3 className="step-title">Camera Input</h3>
              <p className="step-description">
                Request camera permission and capture video frames when the user starts
                the translator.
              </p>
            </div>

            <div className="workflow-arrow-divider" aria-hidden="true">
              <ArrowRight size={20} className="arrow-desktop" />
              <ArrowDown size={20} className="arrow-mobile" />
            </div>

            {/* Step 2 */}
            <div className="workflow-step-card">
              <div className="step-header">
                <span className="step-number-badge">2</span>
                <div className="step-icon-bg">
                  <Scan size={22} className="step-icon" />
                </div>
              </div>
              <h3 className="step-title">Hand Detection</h3>
              <p className="step-description">
                Use a computer vision pipeline to detect hands and extract relevant hand landmarks
                or image features.
              </p>
            </div>

            <div className="workflow-arrow-divider" aria-hidden="true">
              <ArrowRight size={20} className="arrow-desktop" />
              <ArrowDown size={20} className="arrow-mobile" />
            </div>

            {/* Step 3 */}
            <div className="workflow-step-card">
              <div className="step-header">
                <span className="step-number-badge">3</span>
                <div className="step-icon-bg">
                  <Cpu size={22} className="step-icon" />
                </div>
              </div>
              <h3 className="step-title">Sign Recognition</h3>
              <p className="step-description">
                Pass the prepared features to a trained machine learning model to predict a
                supported sign.
              </p>
            </div>

            <div className="workflow-arrow-divider" aria-hidden="true">
              <ArrowRight size={20} className="arrow-desktop" />
              <ArrowDown size={20} className="arrow-mobile" />
            </div>

            {/* Step 4 */}
            <div className="workflow-step-card">
              <div className="step-header">
                <span className="step-number-badge">4</span>
                <div className="step-icon-bg">
                  <Volume2 size={22} className="step-icon" />
                </div>
              </div>
              <h3 className="step-title">Text and Speech</h3>
              <p className="step-description">
                Display the recognized result as text and optionally read the text aloud using
                speech synthesis.
              </p>
            </div>
          </div>
        </section>

        {/* =========================================================
            5. BACKEND FUNCTIONALITY / BEHIND THE TECHNOLOGY
           ========================================================= */}
        <section className="tech-stack-section" aria-labelledby="tech-stack-title">
          <div className="section-header text-center">
            <h2 id="tech-stack-title" className="section-heading">
              Behind the Technology
            </h2>
            <p className="section-subtitle">
              An overview of the components that power the translation experience.
            </p>
          </div>

          <div className="tech-cards-grid">
            {/* Card 1 */}
            <div className="tech-card">
              <div className="tech-card-header">
                <div className="tech-card-icon-box">
                  <Camera size={24} />
                </div>
                <span className="tech-tag">Browser API</span>
              </div>
              <h3 className="tech-card-title">Camera Processing</h3>
              <div className="tech-name">Technology: Browser MediaDevices API</div>
              <p className="tech-card-desc">
                Requests camera access and captures live video through the user&apos;s device.
              </p>
            </div>

            {/* Card 2 */}
            <div className="tech-card">
              <div className="tech-card-header">
                <div className="tech-card-icon-box">
                  <Layers size={24} />
                </div>
                <span className="tech-tag">Vision Processing</span>
              </div>
              <h3 className="tech-card-title">Frame Processing</h3>
              <div className="tech-name">Technology: OpenCV</div>
              <p className="tech-card-desc">
                Can be used to resize, normalize, or otherwise prepare image frames for the
                recognition pipeline.
              </p>
            </div>

            {/* Card 3 */}
            <div className="tech-card">
              <div className="tech-card-header">
                <div className="tech-card-icon-box">
                  <Activity size={24} />
                </div>
                <span className="tech-tag">Feature Extraction</span>
              </div>
              <h3 className="tech-card-title">Hand Landmark Detection</h3>
              <div className="tech-name">Technology: MediaPipe</div>
              <p className="tech-card-desc">
                Detects hand landmarks to represent finger positions and hand geometry when
                supported by the chosen model.
              </p>
            </div>

            {/* Card 4 */}
            <div className="tech-card">
              <div className="tech-card-header">
                <div className="tech-card-icon-box">
                  <Cpu size={24} />
                </div>
                <span className="tech-tag">Inference Model</span>
              </div>
              <h3 className="tech-card-title">Machine Learning</h3>
              <div className="tech-name">Technology: Trained Recognition Model</div>
              <p className="tech-card-desc">
                Analyzes landmarks or visual features and predicts a class from the
                application&apos;s supported sign vocabulary.
              </p>
            </div>

            {/* Card 5 */}
            <div className="tech-card">
              <div className="tech-card-header">
                <div className="tech-card-icon-box">
                  <Server size={24} />
                </div>
                <span className="tech-tag">API Integration</span>
              </div>
              <h3 className="tech-card-title">Backend API</h3>
              <div className="tech-name">Technology: Python Flask</div>
              <p className="tech-card-desc">
                Provides API endpoints for receiving supported inputs, running inference, and
                returning structured recognition results.
              </p>
            </div>

            {/* Card 6 */}
            <div className="tech-card">
              <div className="tech-card-header">
                <div className="tech-card-icon-box">
                  <Volume2 size={24} />
                </div>
                <span className="tech-tag">Speech Synthesis</span>
              </div>
              <h3 className="tech-card-title">Voice Output</h3>
              <div className="tech-name">Technology: Browser SpeechSynthesis API</div>
              <p className="tech-card-desc">
                Reads the recognized text aloud when the user enables speech output.
              </p>
            </div>
          </div>

          {/* Technical Accuracy Notice Box */}
          <div className="tech-accuracy-notice">
            <Info size={18} className="notice-icon" />
            <div className="notice-text">
              <strong>Technical Architecture Note:</strong> The components above reflect the planned,
              modular architecture of SignBridge. Recognition is limited to supported gesture vocabulary
              defined by the trained model, and results correspond to classified gesture labels rather
              than universal natural-language translation.
            </div>
          </div>
        </section>

        {/* =========================================================
            6. APPLICATION FLOWCHART
           ========================================================= */}
        <section className="flowchart-section" aria-labelledby="flowchart-heading">
          <div className="section-header text-center">
            <h2 id="flowchart-heading" className="section-heading">
              Application Workflow
            </h2>
            <p className="section-subtitle">
              Comprehensive logic flow from initial session setup to continuous recognition.
            </p>
          </div>

          <div className="flowchart-card">
            {/* Flowchart Legend */}
            <div className="flowchart-legend">
              <span className="legend-title">Flowchart Key:</span>
              <div className="legend-item">
                <div className="legend-shape shape-process"></div>
                <span>Rectangle = Process</span>
              </div>
              <div className="legend-item">
                <div className="legend-shape shape-decision"></div>
                <span>Diamond = Decision</span>
              </div>
              <div className="legend-item">
                <ArrowDown size={14} className="legend-arrow-icon" />
                <span>Arrows = Direction of Flow</span>
              </div>
            </div>

            {/* Visual Flow Diagram */}
            <div className="flowchart-diagram-container">
              {/* Node 1: Start */}
              <div className="flow-step">
                <div className="flow-node node-terminal">
                  <Play size={13} fill="currentColor" />
                  <span>Start</span>
                </div>
              </div>

              <div className="flow-arrow-down">
                <ArrowDown size={18} />
              </div>

              {/* Node 2: Open Translation Page */}
              <div className="flow-step">
                <div className="flow-node node-process">
                  <div className="node-badge">Process</div>
                  <span className="node-label">Open Translation Page</span>
                </div>
              </div>

              <div className="flow-arrow-down">
                <ArrowDown size={18} />
              </div>

              {/* Node 3: Request Camera Permission */}
              <div className="flow-step">
                <div className="flow-node node-process">
                  <div className="node-badge">Process</div>
                  <span className="node-label">Request Camera Permission</span>
                </div>
              </div>

              <div className="flow-arrow-down">
                <ArrowDown size={18} />
              </div>

              {/* Branch 1: Camera Available? (Decision) */}
              <div className="flow-decision-block">
                <div className="flow-node node-decision">
                  <div className="decision-diamond">
                    <HelpCircle size={15} />
                    <span>Camera Available?</span>
                  </div>
                </div>

                <div className="decision-branches-row">
                  {/* Branch No */}
                  <div className="branch-col branch-no">
                    <div className="branch-tag tag-no">
                      <X size={12} /> No
                    </div>
                    <div className="branch-arrow">
                      <ArrowDown size={16} />
                    </div>
                    <div className="flow-node node-sub-process error-process">
                      <AlertCircle size={15} className="error-icon" />
                      <span>Display Camera Error</span>
                    </div>
                    <div className="branch-arrow">
                      <ArrowDown size={16} />
                    </div>
                    <div className="flow-node node-sub-process action-process">
                      <RotateCcw size={14} />
                      <span>Allow Retry</span>
                    </div>
                  </div>

                  {/* Branch Yes */}
                  <div className="branch-col branch-yes">
                    <div className="branch-tag tag-yes">
                      <Check size={12} /> Yes
                    </div>
                    <div className="branch-arrow">
                      <ArrowDown size={16} />
                    </div>
                    <div className="flow-node node-process">
                      <div className="node-badge">Process</div>
                      <span className="node-label">Capture Video Frames</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flow-arrow-down">
                <ArrowDown size={18} />
              </div>

              {/* Node 5: Detect Hand Landmarks */}
              <div className="flow-step">
                <div className="flow-node node-process">
                  <div className="node-badge">Process</div>
                  <span className="node-label">Detect Hand Landmarks</span>
                </div>
              </div>

              <div className="flow-arrow-down">
                <ArrowDown size={18} />
              </div>

              {/* Node 6: Extract Gesture Features */}
              <div className="flow-step">
                <div className="flow-node node-process">
                  <div className="node-badge">Process</div>
                  <span className="node-label">Extract Gesture Features</span>
                </div>
              </div>

              <div className="flow-arrow-down">
                <ArrowDown size={18} />
              </div>

              {/* Node 7: Run Recognition Model */}
              <div className="flow-step">
                <div className="flow-node node-process">
                  <div className="node-badge">Process</div>
                  <span className="node-label">Run Recognition Model</span>
                </div>
              </div>

              <div className="flow-arrow-down">
                <ArrowDown size={18} />
              </div>

              {/* Branch 2: Supported Sign Recognized? (Decision) */}
              <div className="flow-decision-block">
                <div className="flow-node node-decision">
                  <div className="decision-diamond">
                    <HelpCircle size={15} />
                    <span>Supported Sign Recognized?</span>
                  </div>
                </div>

                <div className="decision-branches-row">
                  {/* Branch No */}
                  <div className="branch-col branch-no">
                    <div className="branch-tag tag-no">
                      <X size={12} /> No
                    </div>
                    <div className="branch-arrow">
                      <ArrowDown size={16} />
                    </div>
                    <div className="flow-node node-sub-process alert-box">
                      <span className="alert-quote">
                        &ldquo;Sign not recognized. Please try again.&rdquo;
                      </span>
                    </div>
                  </div>

                  {/* Branch Yes */}
                  <div className="branch-col branch-yes">
                    <div className="branch-tag tag-yes">
                      <Check size={12} /> Yes
                    </div>
                    <div className="branch-arrow">
                      <ArrowDown size={16} />
                    </div>
                    <div className="flow-node node-process">
                      <div className="node-badge">Output</div>
                      <span className="node-label">Display Recognized Text</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flow-arrow-down">
                <ArrowDown size={18} />
              </div>

              {/* Branch 3: Voice Output Enabled? (Decision) */}
              <div className="flow-decision-block">
                <div className="flow-node node-decision">
                  <div className="decision-diamond">
                    <HelpCircle size={15} />
                    <span>Voice Output Enabled?</span>
                  </div>
                </div>

                <div className="decision-branches-row">
                  {/* Branch Yes */}
                  <div className="branch-col branch-yes">
                    <div className="branch-tag tag-yes">
                      <Check size={12} /> Yes
                    </div>
                    <div className="branch-arrow">
                      <ArrowDown size={16} />
                    </div>
                    <div className="flow-node node-process">
                      <div className="node-badge">Audio Output</div>
                      <span className="node-label">Speak Recognized Text</span>
                    </div>
                  </div>

                  {/* Branch No */}
                  <div className="branch-col branch-no">
                    <div className="branch-tag tag-no">
                      <X size={12} /> No
                    </div>
                    <div className="branch-arrow">
                      <ArrowDown size={16} />
                    </div>
                    <div className="flow-node node-process">
                      <div className="node-badge">Visual Only</div>
                      <span className="node-label">Keep Text Visible</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flow-arrow-down">
                <ArrowDown size={18} />
              </div>

              {/* Branch 4: Continue Recognition? (Decision) */}
              <div className="flow-decision-block">
                <div className="flow-node node-decision">
                  <div className="decision-diamond">
                    <HelpCircle size={15} />
                    <span>Continue Recognition?</span>
                  </div>
                </div>

                <div className="decision-branches-row">
                  {/* Branch Yes -> Loop Next Frame */}
                  <div className="branch-col branch-loop">
                    <div className="branch-tag tag-yes">
                      <Check size={12} /> Yes
                    </div>
                    <div className="branch-arrow">
                      <ArrowDown size={16} />
                    </div>
                    <div className="flow-node node-loop-process">
                      <RotateCcw size={14} className="loop-icon" />
                      <span>Process Next Frame</span>
                      <small className="loop-note">(Loop to Camera Capture)</small>
                    </div>
                  </div>

                  {/* Branch No -> Stop Translation */}
                  <div className="branch-col branch-stop">
                    <div className="branch-tag tag-no">
                      <X size={12} /> No
                    </div>
                    <div className="branch-arrow">
                      <ArrowDown size={16} />
                    </div>
                    <div className="flow-node node-sub-process stop-process">
                      <Square size={13} />
                      <span>Stop Translation</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flow-arrow-down">
                <ArrowDown size={18} />
              </div>

              {/* Node End: Terminal */}
              <div className="flow-step">
                <div className="flow-node node-terminal node-end">
                  <CheckCircle2 size={15} />
                  <span>End</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================
            7. HOW TO USE SIGNBRIDGE / GETTING STARTED
           ========================================================= */}
        <section className="how-to-use-section" aria-labelledby="how-to-use-heading">
          <div className="section-header text-center">
            <h2 id="how-to-use-heading" className="section-heading">
              Getting Started
            </h2>
            <p className="section-subtitle">
              Follow these simple steps to translate sign language gestures accurately.
            </p>
          </div>

          <div className="instructions-card">
            <ol className="instructions-list">
              <li className="instruction-item">
                <div className="item-number">1</div>
                <div className="item-content">
                  <strong>Navigate to the Translate page.</strong>
                  <p>Use the navigation bar or any CTA button to enter the translation workspace.</p>
                </div>
              </li>

              <li className="instruction-item">
                <div className="item-number">2</div>
                <div className="item-content">
                  <strong>Allow camera permission when requested.</strong>
                  <p>Your browser will prompt for camera access so it can capture video frames locally.</p>
                </div>
              </li>

              <li className="instruction-item">
                <div className="item-number">3</div>
                <div className="item-content">
                  <strong>Position your hands clearly inside the camera frame.</strong>
                  <p>Keep your hands and fingers well within the viewfinder boundaries with good illumination.</p>
                </div>
              </li>

              <li className="instruction-item">
                <div className="item-number">4</div>
                <div className="item-content">
                  <strong>Select Start Translation.</strong>
                  <p>Initiate active frame analysis and neural landmark feature extraction.</p>
                </div>
              </li>

              <li className="instruction-item">
                <div className="item-number">5</div>
                <div className="item-content">
                  <strong>Wait for the application to process supported signs.</strong>
                  <p>Hold the gesture steadily while the recognition model evaluates coordinate landmarks.</p>
                </div>
              </li>

              <li className="instruction-item">
                <div className="item-number">6</div>
                <div className="item-content">
                  <strong>Read the recognized text in the Translation Output card.</strong>
                  <p>View the translated phrase and match confidence score update in real time.</p>
                </div>
              </li>

              <li className="instruction-item">
                <div className="item-number">7</div>
                <div className="item-content">
                  <strong>Enable Voice Output to hear the text.</strong>
                  <p>Toggle speech synthesis on to hear clear, natural synthesized speech.</p>
                </div>
              </li>

              <li className="instruction-item">
                <div className="item-number">8</div>
                <div className="item-content">
                  <strong>Stop translation and switch off the camera when finished.</strong>
                  <p>Easily pause recognition or release camera hardware whenever you are done.</p>
                </div>
              </li>
            </ol>

            {/* Note box */}
            <div className="instructions-note-box">
              <AlertCircle size={18} className="note-box-icon" />
              <p className="note-box-text">
                <strong>Note:</strong> Recognition quality depends on lighting, camera quality,
                hand visibility, model accuracy, and the signs supported by the application.
              </p>
            </div>
          </div>
        </section>

        {/* =========================================================
            8. FINAL CALL TO ACTION
           ========================================================= */}
        <section className="about-cta-section" aria-labelledby="about-cta-heading">
          <div className="about-cta-banner">
            <div className="about-cta-content">
              <h2 id="about-cta-heading" className="about-cta-title">
                Ready to explore sign recognition?
              </h2>
              <p className="about-cta-desc">
                Open the translator and try the supported gestures.
              </p>
            </div>

            <div className="about-cta-action">
              <Link to="/translate" className="btn-cta-teal-white">
                <span>Start Translating</span>
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
