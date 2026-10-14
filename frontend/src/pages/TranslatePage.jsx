
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
  // Camera
  const videoRef = useRef(null);
  const skeletonCanvasRef = useRef(null);
  const recognitionIntervalRef = useRef(null);
  const abortControllerRef = useRef(null);
  const lastSpokenTextRef = useRef('');
  const stoppedRef = useRef(false);

  const [stream, setStream] = useState(null);
  const [cameraStatus, setCameraStatus] = useState('Camera Off');
  const [cameraErrorMessage, setCameraErrorMessage] = useState('');

  // Recognition
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [recognitionStatus, setRecognitionStatus] = useState('Idle');
  const [recognitionNotice, setRecognitionNotice] = useState('');
  const [handLandmarks, setHandLandmarks] = useState([]);
  const [handConfidence, setHandConfidence] = useState(0);

  // Translation
  const [translatedText, setTranslatedText] = useState('');
  const [textLog, setTextLog] = useState([]);
  const [isDemoText, setIsDemoText] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);

  // Voice
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [speechAvailable, setSpeechAvailable] = useState(true);

  // Backend
  const [backendHealth, setBackendHealth] = useState({
    checked: false,
    available: false,
    message: 'Backend API connection not verified',
  });
  const [isCheckingBackend, setIsCheckingBackend] = useState(false);

  // Speech support
  useEffect(() => {
    if (!('speechSynthesis' in window)) {
      setSpeechAvailable(false);
    }
  }, []);

  // Backend health check
  const checkBackend = useCallback(async () => {
    setIsCheckingBackend(true);

    try {
      const result = await checkBackendConnection();

      setBackendHealth({
        checked: true,
        available: result.available,
        message: result.message,
      });
    } finally {
      setIsCheckingBackend(false);
    }
  }, []);

  useEffect(() => {
    checkBackend();
  }, [checkBackend]);

  // Voice output
  const speakText = useCallback(
    (textToSpeak) => {
      if (
        !voiceEnabled ||
        !('speechSynthesis' in window) ||
        !textToSpeak?.trim()
      ) {
        return;
      }

      if (
        lastSpokenTextRef.current === textToSpeak &&
        window.speechSynthesis.speaking
      ) {
        return;
      }

      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.rate = 0.95;
      utterance.pitch = 1;

      utterance.onend = () => {
        lastSpokenTextRef.current = textToSpeak;
      };

      utterance.onerror = () => {
        lastSpokenTextRef.current = '';
      };

      window.speechSynthesis.speak(utterance);
    },
    [voiceEnabled]
  );

  const toggleVoiceOutput = () => {
    if (!speechAvailable) return;

    if (voiceEnabled) {
      window.speechSynthesis?.cancel();
      setVoiceEnabled(false);
    } else {
      setVoiceEnabled(true);

      if (translatedText.trim()) {
        const utterance = new SpeechSynthesisUtterance(translatedText);
        window.speechSynthesis.speak(utterance);
      }
    }
  };

  // Synchronize the camera stream
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (stream) {
      video.srcObject = stream;
      video.play().catch((err) => {
        console.warn('Video play error:', err);
      });
    } else {
      video.srcObject = null;
    }
  }, [stream]);

  // Camera on
  const turnCameraOn = async () => {
    setCameraErrorMessage('');

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraStatus('Camera Error');
      setCameraErrorMessage(
        'Camera access requires browser permission and HTTPS or localhost.'
      );
      return false;
    }

    try {
      let mediaStream;

      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user',
          },
          audio: false,
        });
      } catch {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      setStream(mediaStream);
      setCameraStatus('Camera On');
      setCameraErrorMessage('');

      return true;
    } catch (err) {
      console.error('Camera access error:', err);
      setCameraStatus('Camera Error');

      if (
        err.name === 'NotAllowedError' ||
        err.name === 'PermissionDeniedError'
      ) {
        setCameraErrorMessage(
          'Camera permission denied. Allow camera access in your browser settings.'
        );
      } else if (err.name === 'NotFoundError') {
        setCameraErrorMessage('No camera was found.');
      } else if (err.name === 'NotReadableError') {
        setCameraErrorMessage(
          'The camera may be in use by another application.'
        );
      } else {
        setCameraErrorMessage(
          `Unable to access camera: ${err.message || 'Unknown error'}`
        );
      }

      return false;
    }
  };

  // Stop recognition
  const stopTranslation = useCallback(() => {
    stoppedRef.current = true;

    if (recognitionIntervalRef.current) {
      clearTimeout(recognitionIntervalRef.current);
      recognitionIntervalRef.current = null;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setIsRecognizing(false);
    setRecognitionStatus('Idle');
    setHandLandmarks([]);
  }, []);

  // Camera off
  const turnCameraOff = () => {
    stopTranslation();

    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    setStream(null);
    setCameraStatus('Camera Off');
    setCameraErrorMessage('');
    setHandLandmarks([]);
    setHandConfidence(0);
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stoppedRef.current = true;

      if (recognitionIntervalRef.current) {
        clearTimeout(recognitionIntervalRef.current);
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      window.speechSynthesis?.cancel();
    };
  }, [stream]);

  // Start recognition
  const startTranslation = async () => {
    if (isRecognizing) return;

    let activeStream = stream;

    if (cameraStatus !== 'Camera On' || !activeStream) {
      const cameraStarted = await turnCameraOn();
      if (!cameraStarted) return;

      // State updates are asynchronous; wait for the video stream to attach.
      activeStream = videoRef.current?.srcObject;
    }

    if (!activeStream) {
      setRecognitionNotice('Waiting for the camera stream. Try again.');
      return;
    }

    stoppedRef.current = false;
    setIsRecognizing(true);
    setRecognitionStatus('Processing');
    setRecognitionNotice('Collecting webcam frames for prediction...');

    const processFrame = async () => {
      if (stoppedRef.current) return;

      const video = videoRef.current;

      if (!video || video.readyState < 2) {
        recognitionIntervalRef.current = setTimeout(processFrame, 250);
        return;
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const frameBlob = await captureVideoFrameBlob(video, 0.85);

        if (stoppedRef.current) return;

        const result = await sendFrameForRecognition(
          frameBlob,
          DEFAULT_API_URL,
          controller.signal
        );

        if (stoppedRef.current) return;

        // Update skeleton and confidence for every API response.
        if (result.success) {
          setHandLandmarks(
            Array.isArray(result.landmarks) ? result.landmarks : []
          );

          setHandConfidence(
            typeof result.confidence === 'number'
              ? Math.max(0, Math.min(1, result.confidence))
              : 0
          );
        } else {
          setHandLandmarks([]);
          setRecognitionStatus('Model Disconnected');
          setRecognitionNotice(
            result.error || 'The recognition API returned an error.'
          );
        }

        if (result.success && result.ready === false) {
          setRecognitionStatus('Processing');
          setRecognitionNotice(
            `Collecting frames: ${result.frames_collected ?? 0}/${
              result.frames_required ?? 64
            }`
          );
        } else if (result.success) {
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

            setTextLog((previous) =>
              previous[previous.length - 1] !== word
                ? [...previous, word]
                : previous
            );

            speakText(word);
          } else if (word === 'Uncertain') {
            setRecognitionNotice(
              'Sign unclear. Try showing your hand clearly.'
            );
          }
        }
      } catch (err) {
        if (err.name !== 'AbortError' && !stoppedRef.current) {
          setRecognitionStatus('Error');
          setRecognitionNotice(
            'Recognition failed. Check the backend terminal.'
          );
          console.warn('Recognition cycle error:', err);
        }
      } finally {
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
        }

        if (!stoppedRef.current) {
          recognitionIntervalRef.current = setTimeout(processFrame, 100);
        }
      }
    };

    recognitionIntervalRef.current = setTimeout(processFrame, 0);
  };

  // Draw the hand skeleton
  useEffect(() => {
    const canvas = skeletonCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawSkeleton = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      if (!rect.width || !rect.height) return;

      const width = rect.width;
      const height = rect.height;

      if (
        canvas.width !== Math.round(width * dpr) ||
        canvas.height !== Math.round(height * dpr)
      ) {
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      const connections = [
        [0, 1], [1, 2], [2, 3], [3, 4],
        [0, 5], [5, 6], [6, 7], [7, 8],
        [5, 9], [9, 10], [10, 11], [11, 12],
        [9, 13], [13, 14], [14, 15], [15, 16],
        [13, 17], [17, 18], [18, 19], [19, 20],
        [0, 17],
      ];

      handLandmarks.forEach((hand) => {
        if (!Array.isArray(hand) || hand.length < 21) return;

        // Accept either [x, y] pairs or MediaPipe-style {x, y} points.
        const points = hand.map((point) => {
          const x = Array.isArray(point) ? point[0] : point?.x;
          const y = Array.isArray(point) ? point[1] : point?.y;

          return {
            x: Number(x) * width,
            y: Number(y) * height,
          };
        });

        if (
          points.some(
            (point) =>
              !Number.isFinite(point.x) ||
              !Number.isFinite(point.y)
          )
        ) {
          return;
        }

        ctx.strokeStyle = '#35e0c1';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        connections.forEach(([start, end]) => {
          const a = points[start];
          const b = points[end];

          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        });

        points.forEach(({ x, y }) => {
          ctx.beginPath();
          ctx.arc(x, y, 3, 0, Math.PI * 2);
          ctx.fillStyle = '#b9fff0';
          ctx.fill();

          ctx.beginPath();
          ctx.arc(x, y, 4.5, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(53, 224, 193, 0.65)';
          ctx.lineWidth = 1;
          ctx.stroke();
        });
      });
    };

    drawSkeleton();

    const observer = new ResizeObserver(drawSkeleton);
    observer.observe(canvas);

    return () => observer.disconnect();
  }, [handLandmarks]);

  // Copy translation
  const handleCopyText = async () => {
    if (!translatedText.trim()) return;

    try {
      await navigator.clipboard.writeText(translatedText);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = translatedText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }

    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  // Clear translation
  const handleClearText = () => {
    setTranslatedText('');
    setTextLog([]);
    setIsDemoText(false);
    lastSpokenTextRef.current = '';
    window.speechSynthesis?.cancel();
  };

  // Demo sample
  const handleInsertDemoSample = () => {
    const sample = 'Hello! How are you today?';
    setTranslatedText(sample);
    setIsDemoText(true);
    setTextLog(['Hello!', 'How are you today?']);

    if (voiceEnabled) {
      speakText(sample);
    }
  };

  return (
    <div className="translate-page-root">
      <div className="container translate-container">
        <section
          className="translate-header-section"
          aria-labelledby="translate-page-title"
        >
          <div className="translate-header-content text-center">
            <h1 id="translate-page-title" className="translate-main-heading">
              Sign Language Translator
            </h1>

            <p className="translate-main-description">
              Show a supported sign in front of your camera and view the
              recognized text in real time.
            </p>

            <div className="translate-info-chips">
              <div className="info-chip">
                <Camera size={14} />
                <span>Camera-Based Input</span>
              </div>
              <div className="info-chip">
                <Activity size={14} />
                <span>Live Recognition</span>
              </div>
              <div className="info-chip">
                <Volume2 size={14} />
                <span>Optional Voice Output</span>
              </div>
            </div>
          </div>
        </section>

        <section className="camera-card" aria-label="Camera preview">
          <div className="card-header">
            <div className="card-header-left">
              <Camera size={20} className="card-header-icon" />
              <h2 className="card-title">Live Camera</h2>
            </div>

            <div className="card-header-right">
              <span
                className={`badge ${
                  cameraStatus === 'Camera On'
                    ? 'badge-camera-on'
                    : cameraStatus === 'Camera Error'
                    ? 'badge-camera-error'
                    : 'badge-camera-off'
                }`}
                role="status"
              >
                {cameraStatus}
              </span>
            </div>
          </div>

          <div className="camera-viewport-container">
            <div
              className="camera-feed-wrapper"
              style={{
                display: cameraStatus === 'Camera On' ? 'block' : 'none',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="camera-video-stream"
                aria-label="Live webcam"
              />

              <canvas
                ref={skeletonCanvasRef}
                className="hand-skeleton-overlay"
                aria-label="Detected hand skeleton"
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  pointerEvents: 'none',
                  zIndex: 2,
                }}
              />

              <div
                style={{
                  position: 'absolute',
                  left: 16,
                  bottom: 16,
                  zIndex: 4,
                  color: '#b9fff0',
                  background: 'rgba(0, 20, 20, 0.82)',
                  padding: '9px 12px',
                  borderRadius: 8,
                  fontSize: 13,
                }}
              >
                <div>
                  Confidence: {(handConfidence * 100).toFixed(1)}%
                </div>

                <div
                  style={{
                    width: 150,
                    height: 4,
                    marginTop: 7,
                    background: 'rgba(255,255,255,0.2)',
                    borderRadius: 4,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${handConfidence * 100}%`,
                      height: '100%',
                      background: '#35e0c1',
                      transition: 'width 0.2s ease',
                    }}
                  />
                </div>
              </div>

              <div className="camera-overlay-bar" aria-hidden="true">
                <div className="overlay-tag overlay-live">
                  <span className="pulse-dot" /> LIVE
                </div>

                {isRecognizing && (
                  <div className="overlay-tag overlay-scanning">
                    <Sparkles size={12} />
                    <span>RECOGNITION ACTIVE</span>
                  </div>
                )}

                <div className="overlay-tag overlay-res">720p HD</div>
              </div>

              <div className="camera-reticle reticle-tl" />
              <div className="camera-reticle reticle-tr" />
              <div className="camera-reticle reticle-bl" />
              <div className="camera-reticle reticle-br" />
            </div>

            {cameraStatus !== 'Camera On' && (
              <div className="camera-placeholder-stage">
                <div className="placeholder-icon-circle">
                  <Camera size={44} className="placeholder-camera-icon" />
                </div>

                <h3 className="placeholder-title">
                  Camera preview will appear here.
                </h3>

                <p className="placeholder-subtitle">
                  Enable your camera to begin.
                </p>

                <button
                  type="button"
                  className="btn-placeholder-camera"
                  onClick={turnCameraOn}
                >
                  <Camera size={18} />
                  <span>Turn Camera On</span>
                </button>
              </div>
            )}
          </div>

          {cameraErrorMessage && (
            <div className="camera-error-banner" role="alert">
              <AlertCircle size={18} />
              <span>{cameraErrorMessage}</span>
            </div>
          )}

          <div className="camera-controls-bar">
            <div className="controls-button-group">
              {isRecognizing ? (
                <button
                  type="button"
                  className="btn-control btn-stop-translation"
                  onClick={stopTranslation}
                >
                  <Square size={18} fill="currentColor" />
                  <span>Stop Translation</span>
                </button>
              ) : (
                <button
                  type="button"
                  className="btn-control btn-start-translation"
                  onClick={startTranslation}
                >
                  <Play size={18} fill="currentColor" />
                  <span>Start Translation</span>
                </button>
              )}

              {cameraStatus === 'Camera On' ? (
                <button
                  type="button"
                  className="btn-control btn-toggle-camera btn-camera-active"
                  onClick={turnCameraOff}
                >
                  <VideoOff size={18} />
                  <span>Turn Camera Off</span>
                </button>
              ) : (
                <button
                  type="button"
                  className="btn-control btn-toggle-camera"
                  onClick={turnCameraOn}
                >
                  <Camera size={18} />
                  <span>Turn Camera On</span>
                </button>
              )}
            </div>

            <p className="camera-helper-text">
              Keep your hands inside the frame and use good lighting.
            </p>
          </div>
        </section>

        <section className="output-card" aria-label="Translation output">
          <div className="card-header">
            <div className="card-header-left">
              <MessageSquare size={20} className="card-header-icon" />
              <h2 className="card-title">Translation Output</h2>
            </div>

            <div className="card-header-right">
              <span className="badge">
                {recognitionStatus === 'Ready'
                  ? 'Translation ready'
                  : recognitionStatus === 'Processing'
                  ? 'Recognizing'
                  : recognitionStatus === 'Error' ||
                    recognitionStatus === 'Model Disconnected'
                  ? 'Recognition unavailable'
                  : 'Waiting for signs'}
              </span>
            </div>
          </div>

          <div className="output-body">
            {translatedText ? (
              <div className="recognized-text-display">
                {isDemoText && (
                  <div className="demo-mode-pill">
                    <Info size={12} />
                    <span>Demo sample — not model output</span>
                  </div>
                )}

                <div className="main-translated-string" aria-live="polite">
                  “{translatedText}”
                </div>

                {textLog.length > 1 && (
                  <div className="recognized-log-flow">
                    <span className="log-label">History:</span>
                    {textLog.map((phrase, index) => (
                      <span key={`${phrase}-${index}`} className="phrase-pill">
                        {phrase}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="output-empty-state">
                <p className="empty-state-text">
                  Your translated text will appear here.
                </p>
                <p className="empty-state-sub">
                  Start the camera and show a supported sign.
                </p>
              </div>
            )}

            {recognitionNotice && (
              <div className="recognition-notice-box" role="status">
                <AlertCircle size={16} />
                <span>{recognitionNotice}</span>
              </div>
            )}

            <div className="output-action-row">
              <div className="output-actions-left">
                <button
                  type="button"
                  className={`btn-action-pill ${voiceEnabled ? 'btn-voice-on' : ''}`}
                  onClick={toggleVoiceOutput}
                  disabled={!speechAvailable}
                >
                  {voiceEnabled ? (
                    <>
                      <Volume2 size={16} />
                      <span>Voice Output On</span>
                    </>
                  ) : (
                    <>
                      <VolumeX size={16} />
                      <span>Enable Voice Output</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  className="btn-action-pill"
                  onClick={handleCopyText}
                  disabled={!translatedText}
                >
                  {copyFeedback ? (
                    <>
                      <Check size={16} />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={16} />
                      <span>Copy Text</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  className="btn-action-pill btn-clear"
                  onClick={handleClearText}
                  disabled={!translatedText}
                >
                  <Trash2 size={16} />
                  <span>Clear Text</span>
                </button>
              </div>

              <div className="output-actions-right">
                <button
                  type="button"
                  className="btn-demo-sample"
                  onClick={handleInsertDemoSample}
                >
                  <Zap size={14} />
                  <span>Load Sample Demo Phrase</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="status-cards-row" aria-label="System status">
          <div className="status-mini-card">
            <div className="mini-card-icon-wrapper">
              <Camera size={20} />
            </div>
            <div className="mini-card-content">
              <span className="mini-card-label">Camera Status</span>
              <span className="status-text">{cameraStatus}</span>
            </div>
          </div>

          <div className="status-mini-card">
            <div className="mini-card-icon-wrapper">
              <Activity size={20} />
            </div>
            <div className="mini-card-content">
              <span className="mini-card-label">Recognition Status</span>
              <span className="status-text">{recognitionStatus}</span>
            </div>
          </div>

          <div className="status-mini-card">
            <div className="mini-card-icon-wrapper">
              <Volume2 size={20} />
            </div>
            <div className="mini-card-content">
              <span className="mini-card-label">Voice Status</span>
              <span className="status-text">
                {voiceEnabled ? 'Voice On' : 'Voice Off'}
              </span>
            </div>
          </div>
        </section>

        <section className="backend-info-card" aria-label="Backend status">
          <div className="backend-info-header">
            <div className="backend-info-title">
              <Server size={18} />
              <h3>Recognition Backend</h3>
            </div>

            <button
              type="button"
              className="btn-health-check"
              onClick={checkBackend}
              disabled={isCheckingBackend}
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
              <span className="pipe-arrow">→</span>
              <span className="pipe-node">Frame Capture</span>
              <span className="pipe-arrow">→</span>
              <span className="pipe-node">MediaPipe</span>
              <span className="pipe-arrow">→</span>
              <span className="pipe-node">Trained Model</span>
              <span className="pipe-arrow">→</span>
              <span className="pipe-node">Text Output</span>
            </div>

            <div className="backend-status-message">
              <div className="endpoint-tag">
                <code>Endpoint: {DEFAULT_API_URL}</code>
              </div>

              <div
                className={`connection-pill ${
                  backendHealth.available
                    ? 'pill-connected'
                    : 'pill-disconnected'
                }`}
              >
                <span
                  className={`dot-status ${
                    backendHealth.available ? 'dot-active' : 'dot-warning'
                  }`}
                />
                <span>{backendHealth.message}</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
