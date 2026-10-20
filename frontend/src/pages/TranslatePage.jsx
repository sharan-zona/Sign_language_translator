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
  resetRecognitionSession,
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
  // Real camera aspect ratio, so the hand skeleton lines up with the video.
  const [videoAspect, setVideoAspect] = useState(16 / 9);

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

  // ---------------------------------------------------------
  // Display-only values (no recognition logic lives here)
  // ---------------------------------------------------------
  const isCameraOn = cameraStatus === 'Camera On';
  const confidencePercent = Math.round(handConfidence * 100);
  const confidenceLevel =
    confidencePercent >= 80
      ? 'high'
      : confidencePercent >= 55
      ? 'medium'
      : 'low';

  let outputBadge = {
    label: 'Waiting for signs',
    className: 'badge-status-waiting',
  };

  if (recognitionStatus === 'Ready') {
    outputBadge = {
      label: 'Translation ready',
      className: 'badge-status-ready',
    };
  } else if (recognitionStatus === 'Processing') {
    outputBadge = {
      label: 'Recognizing…',
      className: 'badge-status-recognizing',
    };
  } else if (
    recognitionStatus === 'Error' ||
    recognitionStatus === 'Model Disconnected'
  ) {
    outputBadge = {
      label: 'Recognition unavailable',
      className: 'badge-status-unavailable',
    };
  }

  const currentStep = !isCameraOn ? 1 : !isRecognizing ? 2 : 3;

  const howToSteps = [
    {
      id: 1,
      icon: Camera,
      title: 'Turn on the camera',
      text: 'Allow camera access when your browser asks.',
    },
    {
      id: 2,
      icon: Play,
      title: 'Press Start Translation',
      text: 'The app starts reading your hand movements.',
    },
    {
      id: 3,
      icon: Activity,
      title: 'Show a sign',
      text: 'Keep both hands inside the frame with good light.',
    },
  ];

  return (
    <div className="translate-page-root">
      <div className="container translate-container">
        {/* ---------------- Page header ---------------- */}
        <section
          className="translate-header-section"
          aria-labelledby="translate-page-title"
        >
          <div className="translate-header-content">
            <h1 id="translate-page-title" className="translate-main-heading">
              Sign Language Translator
            </h1>

            <p className="translate-main-description">
              Show a supported sign to your camera and read the translation
              live, right next to you.
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

        {/* ---------------- Workspace: camera LEFT, translation RIGHT ---------------- */}
        <div className="translate-workspace">
          {/* ===== LEFT: camera ===== */}
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

            <div
              className="camera-viewport-container"
              style={{ aspectRatio: videoAspect }}
            >
              <div
                className="camera-feed-wrapper"
                style={{ display: isCameraOn ? 'block' : 'none' }}
              >
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="camera-video-stream"
                  aria-label="Live webcam"
                  onLoadedMetadata={(event) => {
                    const { videoWidth, videoHeight } = event.currentTarget;
                    if (videoWidth && videoHeight) {
                      setVideoAspect(videoWidth / videoHeight);
                    }
                  }}
                />

                <canvas
                  ref={skeletonCanvasRef}
                  className="hand-skeleton-overlay"
                  aria-label="Detected hand skeleton"
                />

                <div className="camera-confidence-box">
                  <div>Confidence: {(handConfidence * 100).toFixed(1)}%</div>
                  <div className="camera-confidence-track">
                    <div
                      className="camera-confidence-fill"
                      style={{ width: `${handConfidence * 100}%` }}
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
                </div>

                <div className="camera-reticle reticle-tl" />
                <div className="camera-reticle reticle-tr" />
                <div className="camera-reticle reticle-bl" />
                <div className="camera-reticle reticle-br" />
              </div>

              {!isCameraOn && (
                <div className="camera-placeholder-stage">
                  <div className="placeholder-icon-circle">
                    <Camera size={40} className="placeholder-camera-icon" />
                  </div>

                  <h3 className="placeholder-title">
                    Camera preview will appear here
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

                {isCameraOn ? (
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
                Tip: keep your hands inside the frame and face a light source.
              </p>
            </div>
          </section>

          {/* ===== RIGHT: translation ===== */}
          <section className="output-card" aria-label="Translation output">
            <div className="card-header">
              <div className="card-header-left">
                <MessageSquare size={20} className="card-header-icon" />
                <h2 className="card-title">Translation</h2>
              </div>

              <div className="card-header-right">
                <span className={`badge ${outputBadge.className}`} role="status">
                  {isRecognizing && <span className="live-dot" />}
                  {outputBadge.label}
                </span>
              </div>
            </div>

            <div className="output-body">
              {/* Current sign */}
              <div className="translation-display" aria-live="polite">
                {translatedText ? (
                  <>
                    {isDemoText && (
                      <div className="demo-mode-pill">
                        <Info size={12} />
                        <span>Demo sample — not model output</span>
                      </div>
                    )}

                    <span className="translation-label">Detected sign</span>

                    <div className="main-translated-string">
                      {translatedText}
                    </div>

                    {isRecognizing && !isDemoText && (
                      <div
                        className={`confidence-meter level-${confidenceLevel}`}
                      >
                        <div className="confidence-meter-top">
                          <span>Confidence</span>
                          <strong>{confidencePercent}%</strong>
                        </div>
                        <div className="confidence-meter-track">
                          <div
                            className="confidence-meter-fill"
                            style={{ width: `${confidencePercent}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="output-empty-state">
                    <p className="empty-state-text">
                      Your translation will appear here.
                    </p>

                    <ol className="how-to-steps">
                      {howToSteps.map(
                        ({ id, icon: StepIcon, title, text }) => (
                          <li
                            key={id}
                            className={`step-item ${
                              id === currentStep
                                ? 'step-active'
                                : id < currentStep
                                ? 'step-done'
                                : ''
                            }`}
                          >
                            <span className="step-icon">
                              {id < currentStep ? (
                                <Check size={16} />
                              ) : (
                                <StepIcon size={16} />
                              )}
                            </span>

                            <span className="step-text">
                              <strong>{title}</strong>
                              <span>{text}</span>
                            </span>
                          </li>
                        )
                      )}
                    </ol>
                  </div>
                )}
              </div>

              {/* Words recognized so far */}
              {textLog.length > 0 && (
                <div className="history-panel">
                  <span className="log-label">Recognized words</span>

                  <div className="recognized-log-flow">
                    {textLog.map((phrase, index) => (
                      <span key={`${phrase}-${index}`} className="phrase-pill">
                        {phrase}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {recognitionNotice && (
                <div className="recognition-notice-box" role="status">
                  <AlertCircle size={16} />
                  <span>{recognitionNotice}</span>
                </div>
              )}

              {/* Actions */}
              <div className="output-action-row">
                <div className="output-actions-grid">
                  <button
                    type="button"
                    className={`btn-action-pill ${
                      voiceEnabled ? 'btn-voice-on' : ''
                    }`}
                    onClick={toggleVoiceOutput}
                    disabled={!speechAvailable}
                  >
                    {voiceEnabled ? (
                      <>
                        <Volume2 size={16} />
                        <span>Voice On</span>
                      </>
                    ) : (
                      <>
                        <VolumeX size={16} />
                        <span>Voice Off</span>
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
                        <span>Copy</span>
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
                    <span>Clear</span>
                  </button>
                </div>

                <button
                  type="button"
                  className="btn-demo-sample"
                  onClick={handleInsertDemoSample}
                >
                  <Zap size={14} />
                  <span>Load sample demo phrase</span>
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* ---------------- System status ---------------- */}
        <section className="status-cards-row" aria-label="System status">
          <div className="status-mini-card">
            <div className="mini-card-icon-wrapper">
              <Camera size={20} />
            </div>
            <div className="mini-card-content">
              <span className="mini-card-label">Camera</span>
              <span className="status-text">{cameraStatus}</span>
            </div>
          </div>

          <div className="status-mini-card">
            <div className="mini-card-icon-wrapper">
              <Activity size={20} />
            </div>
            <div className="mini-card-content">
              <span className="mini-card-label">Recognition</span>
              <span className="status-text">{recognitionStatus}</span>
            </div>
          </div>

          <div className="status-mini-card">
            <div className="mini-card-icon-wrapper">
              <Volume2 size={20} />
            </div>
            <div className="mini-card-content">
              <span className="mini-card-label">Voice</span>
              <span className="status-text">
                {voiceEnabled ? 'Voice On' : 'Voice Off'}
              </span>
            </div>
          </div>
        </section>

        {/* ---------------- Backend connection ---------------- */}
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
              <span>
                {isCheckingBackend ? 'Checking...' : 'Check Connection'}
              </span>
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