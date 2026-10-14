import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera,
  VideoOff,
  Play,
  Square,
  Volume2,
  VolumeX,
  Copy,
  Trash2,
  Check,
  AlertCircle,
  Sparkles,
  Activity,
  MessageSquare,
  Info,
  RefreshCw,
  Server,
  Zap,
} from 'lucide-react';
import {
  captureVideoFrameBlob,
  sendFrameForRecognition,
  checkBackendConnection,
  DEFAULT_API_URL,
} from '../services/recognitionService';
import './TranslatePage.css';

export default function TranslatePage() {
  // Camera state
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [cameraStatus, setCameraStatus] = useState('Camera Off'); // 'Camera Off' | 'Camera On' | 'Camera Error'
  const [cameraErrorMessage, setCameraErrorMessage] = useState('');

  // Translation / Recognition state
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [recognitionStatus, setRecognitionStatus] = useState('Idle'); // 'Idle' | 'Processing' | 'Ready' | 'Error' | 'Model Disconnected'
  const [recognitionNotice, setRecognitionNotice] = useState('');
  const recognitionIntervalRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Output text state
  const [translatedText, setTranslatedText] = useState('');
  const [textLog, setTextLog] = useState([]);
  const [isDemoText, setIsDemoText] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);

  // Voice synthesis state
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [speechAvailable, setSpeechAvailable] = useState(true);
  const lastSpokenTextRef = useRef('');

  // Backend connection status
  const [backendHealth, setBackendHealth] = useState({
    checked: false,
    available: false,
    message: 'Backend API connection not verified',
  });
  const [isCheckingBackend, setIsCheckingBackend] = useState(false);

  // Check speech synthesis availability
  useEffect(() => {
    if (!('speechSynthesis' in window)) {
      setSpeechAvailable(false);
    }
  }, []);

  // Initial backend check
  useEffect(() => {
    checkBackend();
  }, []);

  const checkBackend = async () => {
    setIsCheckingBackend(true);
    const result = await checkBackendConnection();
    setBackendHealth({
      checked: true,
      available: result.available,
      message: result.message,
    });
    setIsCheckingBackend(false);
  };

  // Safe Speech Synthesis Runner
  const speakText = useCallback(
    (textToSpeak) => {
      if (!voiceEnabled || !('speechSynthesis' in window) || !textToSpeak.trim()) {
        return;
      }

      // Avoid repeating the exact same utterance continuously
      if (lastSpokenTextRef.current === textToSpeak && window.speechSynthesis.speaking) {
        return;
      }

      try {
        window.speechSynthesis.cancel(); // Stop overlapping speech
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.rate = 0.95;
        utterance.pitch = 1.0;
        utterance.onend = () => {
          lastSpokenTextRef.current = textToSpeak;
        };
        utterance.onerror = () => {
          lastSpokenTextRef.current = '';
        };
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn('Speech synthesis error:', err);
      }
    },
    [voiceEnabled]
  );

  // Toggle Voice Output
  const toggleVoiceOutput = () => {
    if (!speechAvailable) return;

    if (voiceEnabled) {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setVoiceEnabled(false);
    } else {
      setVoiceEnabled(true);
      if (translatedText.trim()) {
        speakText(translatedText);
      }
    }
  };

  // Synchronize stream with videoRef element whenever stream changes
  useEffect(() => {
    if (videoRef.current) {
      if (stream) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch((err) => {
          console.warn('Video play interrupted or muted required:', err);
        });
      } else {
        videoRef.current.srcObject = null;
      }
    }
  }, [stream]);

  // Turn Camera On
  const turnCameraOn = async () => {
    setCameraErrorMessage('');

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraStatus('Camera Error');
      setCameraErrorMessage(
        'Your browser does not support camera access or the page is not running in a secure context (HTTPS or localhost).'
      );
      return false;
    }

    try {
      let mediaStream;
      try {
        // Preferred high-resolution user-facing constraints
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user',
          },
          audio: false,
        });
      } catch (constraintErr) {
        console.warn('High-res constraints rejected, falling back to basic video:', constraintErr);
        // Fallback for devices without 720p or strict constraints
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      setStream(mediaStream);
      setCameraStatus('Camera On');
      setCameraErrorMessage('');

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch((err) => console.warn('Play error:', err));
      }
      return true;
    } catch (err) {
      console.error('Camera access error:', err);
      setCameraStatus('Camera Error');

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraErrorMessage(
          'Camera access was denied. Please click the camera or lock icon in your browser address bar, choose "Allow" for camera permissions, and click "Turn Camera On" again.'
        );
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraErrorMessage('No camera device was detected on your computer.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setCameraErrorMessage(
          'Your camera may be in use by another application. Please close other camera tabs and try again.'
        );
      } else {
        setCameraErrorMessage(`Unable to access camera: ${err.message || 'Unknown error'}`);
      }
      return false;
    }
  };

  // Turn Camera Off
  const turnCameraOff = useCallback(() => {
    // If recognition is active, stop it first
    if (isRecognizing) {
      stopTranslation();
    }

    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraStatus('Camera Off');
    setCameraErrorMessage('');
  }, [stream, isRecognizing]);

  // Clean unmount: Stop tracks and speech
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (recognitionIntervalRef.current) {
        clearInterval(recognitionIntervalRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [stream]);

  // Start Translation

  // Start Translation
  const startTranslation = async () => {
    if (isRecognizing) return;

    if (cameraStatus !== 'Camera On' || !stream) {
      const ok = await turnCameraOn();
      if (!ok) return;
    }

    setIsRecognizing(true);
    setRecognitionStatus('Processing');
    setRecognitionNotice('Collecting webcam frames for prediction...');

    // Use recursive timeouts to prevent overlapping API requests.
    let stopped = false;

    const processFrame = async () => {
      if (stopped) return;

      const video = videoRef.current;

      if (!video || video.readyState < 2) {
        recognitionIntervalRef.current = setTimeout(processFrame, 250);
        return;
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const frameBlob = await captureVideoFrameBlob(video, 0.85);

        if (stopped) return;

        const result = await sendFrameForRecognition(
          frameBlob,
          DEFAULT_API_URL,
          controller.signal
        );

        if (stopped) return;

        if (!result.success) {
          setRecognitionStatus('Model Disconnected');
          setRecognitionNotice(
            result.error || 'The recognition API returned an error.'
          );
        } else if (result.ready === false) {
          setRecognitionStatus('Processing');
          setRecognitionNotice(
            `Collecting frames: ${result.frames_collected ?? 0}/${
              result.frames_required ?? 64
            }`
          );
        } else {
          setRecognitionStatus('Ready');
          setRecognitionNotice('');

          const word = result.recognized_text;
          setIsDemoText(false);

          if (
            word &&
            word !== 'Uncertain' &&
            word !== 'Collecting frames...'
          ) {
            setTranslatedText(word);

            setTextLog((prev) =>
              prev[prev.length - 1] !== word
                ? [...prev, word]
                : prev
            );

            speakText(word);
          } else if (word === 'Uncertain') {
            setRecognitionNotice('Sign unclear. Try showing your hand clearly.');
          }
        }
      } catch (err) {
        if (err.name !== 'AbortError' && !stopped) {
          setRecognitionStatus('Error');
          setRecognitionNotice(
            'Recognition failed. Check the backend terminal for errors.'
          );
          console.warn('Recognition cycle error:', err);
        }
      } finally {
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
        }

        if (!stopped) {
          recognitionIntervalRef.current = setTimeout(processFrame, 100);
        }
      }
    };

    // Store a stop handle so Stop Translation can cancel future requests.
    recognitionIntervalRef.current = setTimeout(processFrame, 0);

    // Keep the stop handle aware of this particular translation run.
    abortControllerRef.current = {
      abort() {
        stopped = true;
      },
    };
  };


  // Stop Translation
  const stopTranslation = () => {
    if (recognitionIntervalRef.current) {
      clearTimeout(recognitionIntervalRef.current);
      recognitionIntervalRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsRecognizing(false);
    setRecognitionStatus('Idle');
  };

  // Copy text to clipboard
  const handleCopyText = async () => {
    if (!translatedText.trim()) return;

    try {
      await navigator.clipboard.writeText(translatedText);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2400);
    } catch {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = translatedText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2400);
    }
  };

  // Clear text
  const handleClearText = () => {
    setTranslatedText('');
    setTextLog([]);
    setIsDemoText(false);
    lastSpokenTextRef.current = '';
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  // Insert clearly identified demo phrase for UI evaluation
  const handleInsertDemoSample = () => {
    const sample = 'Hello! How are you today?';
    setTranslatedText(sample);
    setIsDemoText(true);
    setTextLog(['Hello!', 'How are you today?']);
    speakText(sample);
  };

  return (
    <div className="translate-page-root">
      <div className="container translate-container">
        {/* =========================================================
            3. PAGE HEADER
           ========================================================= */}
        <section className="translate-header-section" aria-labelledby="translate-page-title">
          <div className="translate-header-content text-center">
            <h1 id="translate-page-title" className="translate-main-heading">
              Sign Language Translator
            </h1>
            <p className="translate-main-description">
              Show a supported sign in front of your camera and view the recognized text in real
              time.
            </p>

            {/* Three Information Chips */}
            <div className="translate-info-chips">
              <div className="info-chip">
                <Camera size={14} className="chip-icon" />
                <span>Camera-Based Input</span>
              </div>
              <div className="info-chip">
                <Activity size={14} className="chip-icon" />
                <span>Live Recognition</span>
              </div>
              <div className="info-chip">
                <Volume2 size={14} className="chip-icon" />
                <span>Optional Voice Output</span>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================
            4. MAIN CAMERA PREVIEW CARD
           ========================================================= */}
        <section className="camera-card" aria-label="Camera Video Preview Area">
          {/* Card Header */}
          <div className="card-header">
            <div className="card-header-left">
              <Camera size={20} className="card-header-icon" />
              <h2 className="card-title">Live Camera</h2>
            </div>

            {/* Status Badge: Camera Off | Camera On | Camera Error */}
            <div className="card-header-right">
              {cameraStatus === 'Camera On' && (
                <div className="badge badge-camera-on" role="status">
                  <span className="live-dot" aria-hidden="true"></span>
                  <span>Camera On</span>
                </div>
              )}
              {cameraStatus === 'Camera Off' && (
                <div className="badge badge-camera-off" role="status">
                  <span className="off-dot" aria-hidden="true"></span>
                  <span>Camera Off</span>
                </div>
              )}
              {cameraStatus === 'Camera Error' && (
                <div className="badge badge-camera-error" role="status">
                  <AlertCircle size={14} />
                  <span>Camera Error</span>
                </div>
              )}
            </div>
          </div>

          {/* Camera Viewport (Aspect ratio 16:9) */}
          <div className="camera-viewport-container">
            {/* The video element is ALWAYS rendered in DOM so videoRef is never null */}
            <div
              className="camera-feed-wrapper"
              style={{ display: cameraStatus === 'Camera On' ? 'block' : 'none' }}
            >
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="camera-video-stream"
                aria-label="Active webcam stream"
              />

              {/* Subtle camera status information overlay when active */}
              <div className="camera-overlay-bar" aria-hidden="true">
                <div className="overlay-tag overlay-live">
                  <span className="pulse-dot"></span> LIVE
                </div>
                {isRecognizing && (
                  <div className="overlay-tag overlay-scanning">
                    <Sparkles size={12} />
                    <span>RECOGNITION ACTIVE</span>
                  </div>
                )}
                <div className="overlay-tag overlay-res">720p HD</div>
              </div>

              {/* Corner guide reticles */}
              <div className="camera-reticle reticle-tl" aria-hidden="true"></div>
              <div className="camera-reticle reticle-tr" aria-hidden="true"></div>
              <div className="camera-reticle reticle-bl" aria-hidden="true"></div>
              <div className="camera-reticle reticle-br" aria-hidden="true"></div>
            </div>

            {/* Centered placeholder illustration when inactive */}
            {cameraStatus !== 'Camera On' && (
              <div className="camera-placeholder-stage">
                <div className="placeholder-icon-circle">
                  <Camera size={44} className="placeholder-camera-icon" />
                </div>
                <h3 className="placeholder-title">Camera preview will appear here.</h3>
                <p className="placeholder-subtitle">Enable your camera to begin.</p>
                <button
                  type="button"
                  className="btn-placeholder-camera"
                  onClick={turnCameraOn}
                >
                  <Camera size={18} />
                  <span>Turn Camera On</span>
                </button>
                <div className="placeholder-badge">
                  <Info size={14} />
                  <span>Video is processed locally in browser session</span>
                </div>
              </div>
            )}
          </div>

          {/* Camera Error Message */}
          {cameraErrorMessage && (
            <div className="camera-error-banner" role="alert">
              <AlertCircle size={18} className="error-banner-icon" />
              <span>{cameraErrorMessage}</span>
            </div>
          )}

          {/* =========================================================
              5. CAMERA CONTROLS
             ========================================================= */}
          <div className="camera-controls-bar">
            <div className="controls-button-group">
              {/* Primary Button: Start Translation / Stop Translation */}
              {isRecognizing ? (
                <button
                  type="button"
                  className="btn-control btn-stop-translation"
                  onClick={stopTranslation}
                  aria-label="Stop Translation"
                >
                  <Square size={18} fill="currentColor" />
                  <span>Stop Translation</span>
                </button>
              ) : (
                <button
                  type="button"
                  className="btn-control btn-start-translation"
                  onClick={startTranslation}
                  aria-label="Start Translation"
                >
                  <Play size={18} fill="currentColor" />
                  <span>Start Translation</span>
                </button>
              )}

              {/* Secondary Button: Turn Camera On / Turn Camera Off */}
              {cameraStatus === 'Camera On' ? (
                <button
                  type="button"
                  className="btn-control btn-toggle-camera btn-camera-active"
                  onClick={turnCameraOff}
                  aria-label="Turn Camera Off"
                >
                  <VideoOff size={18} />
                  <span>Turn Camera Off</span>
                </button>
              ) : (
                <button
                  type="button"
                  className="btn-control btn-toggle-camera"
                  onClick={turnCameraOn}
                  aria-label="Turn Camera On"
                >
                  <Camera size={18} />
                  <span>Turn Camera On</span>
                </button>
              )}
            </div>

            {/* Concise Helper Text */}
            <p className="camera-helper-text">
              Keep your hands inside the frame and use good lighting.
            </p>
          </div>
        </section>

        {/* =========================================================
            6. TRANSLATION OUTPUT CARD
           ========================================================= */}
        <section className="output-card" aria-label="Translation Text Output Area">
          {/* Output Card Header */}
          <div className="card-header">
            <div className="card-header-left">
              <MessageSquare size={20} className="card-header-icon" />
              <h2 className="card-title">Translation Output</h2>
            </div>

            {/* Status Badge: Waiting for signs | Recognizing | Translation ready | Recognition unavailable */}
            <div className="card-header-right">
              {recognitionStatus === 'Idle' && !translatedText && (
                <span className="badge badge-status-waiting">Waiting for signs</span>
              )}
              {recognitionStatus === 'Processing' && (
                <span className="badge badge-status-recognizing">
                  <Activity size={13} className="spin-icon" />
                  <span>Recognizing</span>
                </span>
              )}
              {(recognitionStatus === 'Ready' || (translatedText && !isRecognizing)) && (
                <span className="badge badge-status-ready">
                  <Check size={13} />
                  <span>Translation ready</span>
                </span>
              )}
              {(recognitionStatus === 'Model Disconnected' || recognitionStatus === 'Error') && (
                <span className="badge badge-status-unavailable">
                  <AlertCircle size={13} />
                  <span>Recognition unavailable</span>
                </span>
              )}
            </div>
          </div>

          {/* Main Text Area */}
          <div className="output-body">
            {translatedText ? (
              <div className="recognized-text-display">
                {isDemoText && (
                  <div className="demo-mode-pill">
                    <Info size={12} />
                    <span>Identified Demo Preview (Simulated sample text)</span>
                  </div>
                )}
                <div className="main-translated-string" aria-live="polite">
                  &ldquo;{translatedText}&rdquo;
                </div>

                {textLog.length > 1 && (
                  <div className="recognized-log-flow">
                    <span className="log-label">History:</span>
                    {textLog.map((phrase, idx) => (
                      <span key={idx} className="phrase-pill">
                        {phrase}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* Empty state */
              <div className="output-empty-state">
                <p className="empty-state-text">Your translated text will appear here.</p>
                <p className="empty-state-sub">
                  Start the camera and position supported hand signs inside the frame.
                </p>
              </div>
            )}

            {/* Recognition Notice (e.g. Model Disconnected message) */}
            {recognitionNotice && (
              <div className="recognition-notice-box" role="status">
                <AlertCircle size={16} className="notice-box-icon" />
                <span className="notice-box-text">{recognitionNotice}</span>
              </div>
            )}

            {/* Output Controls */}
            <div className="output-action-row">
              <div className="output-actions-left">
                {/* 1. Voice Output Toggle */}
                <button
                  type="button"
                  className={`btn-action-pill ${voiceEnabled ? 'btn-voice-on' : ''}`}
                  onClick={toggleVoiceOutput}
                  disabled={!speechAvailable}
                  aria-pressed={voiceEnabled}
                  title={
                    speechAvailable
                      ? voiceEnabled
                        ? 'Disable text-to-speech output'
                        : 'Enable text-to-speech output'
                      : 'Speech synthesis is unsupported in this browser'
                  }
                >
                  {voiceEnabled ? (
                    <>
                      <Volume2 size={16} className="voice-active-icon" />
                      <span>Voice Output On</span>
                    </>
                  ) : (
                    <>
                      <VolumeX size={16} />
                      <span>Enable Voice Output</span>
                    </>
                  )}
                </button>

                {/* 2. Copy Text */}
                <button
                  type="button"
                  className="btn-action-pill"
                  onClick={handleCopyText}
                  disabled={!translatedText}
                  aria-label="Copy translated text to clipboard"
                >
                  {copyFeedback ? (
                    <>
                      <Check size={16} className="copy-check-icon" />
                      <span className="copy-success-text">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={16} />
                      <span>Copy Text</span>
                    </>
                  )}
                </button>

                {/* 3. Clear Text */}
                <button
                  type="button"
                  className="btn-action-pill btn-clear"
                  onClick={handleClearText}
                  disabled={!translatedText}
                  aria-label="Clear translated output text"
                >
                  <Trash2 size={16} />
                  <span>Clear Text</span>
                </button>
              </div>

              {/* Sample Demo Helper Button for Testing */}
              <div className="output-actions-right">
                <button
                  type="button"
                  className="btn-demo-sample"
                  onClick={handleInsertDemoSample}
                  title="Loads a clearly identified sample phrase to test speech and copy functionality"
                >
                  <Zap size={14} />
                  <span>Load Sample Demo Phrase</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================
            7. RECOGNITION STATUS CARDS
           ========================================================= */}
        <section
          className="status-cards-row"
          aria-label="Hardware and Pipeline Status Summary"
        >
          {/* Card 1: Camera Status */}
          <div className="status-mini-card">
            <div className="mini-card-icon-wrapper">
              <Camera size={20} className="mini-icon" />
            </div>
            <div className="mini-card-content">
              <span className="mini-card-label">Camera Status</span>
              <div className="mini-card-value">
                <span
                  className={`status-indicator-dot ${
                    cameraStatus === 'Camera On' ? 'dot-active' : 'dot-inactive'
                  }`}
                  aria-hidden="true"
                ></span>
                <span className="status-text">{cameraStatus}</span>
              </div>
            </div>
          </div>

          {/* Card 2: Recognition Status */}
          <div className="status-mini-card">
            <div className="mini-card-icon-wrapper">
              <Activity size={20} className="mini-icon" />
            </div>
            <div className="mini-card-content">
              <span className="mini-card-label">Recognition Status</span>
              <div className="mini-card-value">
                <span
                  className={`status-indicator-dot ${
                    recognitionStatus === 'Processing'
                      ? 'dot-processing'
                      : recognitionStatus === 'Ready'
                      ? 'dot-active'
                      : recognitionStatus === 'Model Disconnected' ||
                        recognitionStatus === 'Error'
                      ? 'dot-warning'
                      : 'dot-inactive'
                  }`}
                  aria-hidden="true"
                ></span>
                <span className="status-text">
                  {recognitionStatus === 'Model Disconnected'
                    ? 'Model Offline'
                    : recognitionStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Voice Status */}
          <div className="status-mini-card">
            <div className="mini-card-icon-wrapper">
              <Volume2 size={20} className="mini-icon" />
            </div>
            <div className="mini-card-content">
              <span className="mini-card-label">Voice Status</span>
              <div className="mini-card-value">
                <span
                  className={`status-indicator-dot ${
                    voiceEnabled ? 'dot-active' : 'dot-inactive'
                  }`}
                  aria-hidden="true"
                ></span>
                <span className="status-text">{voiceEnabled ? 'Voice On' : 'Voice Off'}</span>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================
            8. RECOGNITION ARCHITECTURE & BACKEND CONTRACT CARD
           ========================================================= */}
        <section
          className="backend-info-card"
          aria-label="Recognition Pipeline Architecture Information"
        >
          <div className="backend-info-header">
            <div className="backend-info-title">
              <Server size={18} className="backend-icon" />
              <h3>Flask Backend Pipeline &amp; Service Contract</h3>
            </div>
            <button
              type="button"
              className="btn-health-check"
              onClick={checkBackend}
              disabled={isCheckingBackend}
              aria-label="Check backend service connectivity"
            >
              <RefreshCw
                size={14}
                className={isCheckingBackend ? 'spin-icon' : ''}
              />
              <span>{isCheckingBackend ? 'Checking...' : 'Check Connection'}</span>
            </button>
          </div>

          <div className="backend-info-body">
            <div className="backend-pipeline-flow">
              <span className="pipe-node">Browser Camera</span>
              <span className="pipe-arrow">&rarr;</span>
              <span className="pipe-node">Frame Capture</span>
              <span className="pipe-arrow">&rarr;</span>
              <span className="pipe-node">MediaPipe / OpenCV</span>
              <span className="pipe-arrow">&rarr;</span>
              <span className="pipe-node">Trained Model</span>
              <span className="pipe-arrow">&rarr;</span>
              <span className="pipe-node">SpeechSynthesis</span>
            </div>

            <div className="backend-status-message">
              <div className="endpoint-tag">
                <code>Endpoint: {DEFAULT_API_URL}</code>
              </div>
              <div
                className={`connection-pill ${
                  backendHealth.available ? 'pill-connected' : 'pill-disconnected'
                }`}
              >
                <span
                  className={`dot-status ${
                    backendHealth.available ? 'dot-active' : 'dot-warning'
                  }`}
                ></span>
                <span>{backendHealth.message}</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
