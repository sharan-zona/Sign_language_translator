import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera, VideoOff, Play, Square, Volume2, VolumeX, Copy, Trash2,
  Check, AlertCircle, Sparkles, Activity, MessageSquare, Info,
  RefreshCw, Server, Zap,
} from 'lucide-react';
import {
  captureVideoFrameBlob, sendFrameForRecognition, resetRecognitionSession,
  checkBackendConnection, DEFAULT_API_URL,
} from '../services/recognitionService';
import './TranslatePage.css';

export default function TranslatePage() {
  const videoRef = useRef(null);
  const skeletonCanvasRef = useRef(null);
  const recognitionIntervalRef = useRef(null);
  const abortControllerRef = useRef(null);
  const lastSpokenTextRef = useRef('');
  const lastRecognizedWordRef = useRef('');
  const stoppedRef = useRef(false);

  const [stream, setStream] = useState(null);
  const [cameraStatus, setCameraStatus] = useState('Camera Off');
  const [cameraErrorMessage, setCameraErrorMessage] = useState('');
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [recognitionStatus, setRecognitionStatus] = useState('Idle');
  const [recognitionNotice, setRecognitionNotice] = useState('');
  const [handLandmarks, setHandLandmarks] = useState([]);
  const [handConfidence, setHandConfidence] = useState(0);
  const [translatedText, setTranslatedText] = useState('');
  const [textLog, setTextLog] = useState([]);
  const [isDemoText, setIsDemoText] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [speechAvailable, setSpeechAvailable] = useState(true);
  const [backendHealth, setBackendHealth] = useState({
    checked: false, available: false, message: 'Backend API connection not verified',
  });
  const [isCheckingBackend, setIsCheckingBackend] = useState(false);

  useEffect(() => {
    if (!('speechSynthesis' in window)) setSpeechAvailable(false);
  }, []);

  const checkBackend = useCallback(async () => {
    setIsCheckingBackend(true);
    try {
      const result = await checkBackendConnection();
      setBackendHealth({
        checked: true, available: Boolean(result.available),
        message: result.message || (result.available ? 'Backend connected' : 'Backend unavailable'),
      });
    } catch (error) {
      setBackendHealth({ checked: true, available: false, message: error.message || 'Backend connection failed' });
    } finally {
      setIsCheckingBackend(false);
    }
  }, []);

  useEffect(() => { checkBackend(); }, [checkBackend]);

  const speakText = useCallback((value) => {
    if (!voiceEnabled || !('speechSynthesis' in window) || !value?.trim()) return;
    if (lastSpokenTextRef.current === value && window.speechSynthesis.speaking) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(value);
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.onend = () => { lastSpokenTextRef.current = value; };
    utterance.onerror = () => { lastSpokenTextRef.current = ''; };
    window.speechSynthesis.speak(utterance);
  }, [voiceEnabled]);

  const toggleVoiceOutput = () => {
    if (!speechAvailable) return;
    if (voiceEnabled) {
      window.speechSynthesis?.cancel();
      lastSpokenTextRef.current = '';
      setVoiceEnabled(false);
    } else {
      setVoiceEnabled(true);
      if (translatedText.trim()) window.speechSynthesis.speak(new SpeechSynthesisUtterance(translatedText));
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (stream) {
      video.srcObject = stream;
      video.play().catch((error) => console.warn('Video play error:', error));
    } else video.srcObject = null;
  }, [stream]);

  const turnCameraOn = async () => {
    setCameraErrorMessage('');
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraStatus('Camera Error');
      setCameraErrorMessage('Camera access requires browser permission and HTTPS or localhost.');
      return false;
    }
    try {
      let mediaStream;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' }, audio: false,
        });
      } catch {
        mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }
      setStream(mediaStream);
      setCameraStatus('Camera On');
      setCameraErrorMessage('');
      return true;
    } catch (error) {
      console.error('Camera access error:', error);
      setCameraStatus('Camera Error');
      if (['NotAllowedError', 'PermissionDeniedError'].includes(error.name)) {
        setCameraErrorMessage('Camera permission denied. Allow camera access in your browser settings.');
      } else if (error.name === 'NotFoundError') {
        setCameraErrorMessage('No camera was found.');
      } else if (error.name === 'NotReadableError') {
        setCameraErrorMessage('The camera may be in use by another application.');
      } else setCameraErrorMessage(`Unable to access camera: ${error.message || 'Unknown error'}`);
      return false;
    }
  };

  const stopTranslation = useCallback(() => {
    stoppedRef.current = true;
    if (recognitionIntervalRef.current) clearTimeout(recognitionIntervalRef.current);
    recognitionIntervalRef.current = null;
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = null;
    setIsRecognizing(false);
    setRecognitionStatus('Idle');
    setHandLandmarks([]);
  }, []);

  const turnCameraOff = () => {
    stopTranslation();
    if (stream) stream.getTracks().forEach((track) => track.stop());
    setStream(null);
    setCameraStatus('Camera Off');
    setCameraErrorMessage('');
    setHandLandmarks([]);
    setHandConfidence(0);
  };

  useEffect(() => () => {
    stoppedRef.current = true;
    if (recognitionIntervalRef.current) clearTimeout(recognitionIntervalRef.current);
    if (abortControllerRef.current) abortControllerRef.current.abort();
    if (stream) stream.getTracks().forEach((track) => track.stop());
    window.speechSynthesis?.cancel();
  }, [stream]);

  const handleCopyText = async () => {
    if (!translatedText) return;
    try {
      await navigator.clipboard.writeText(translatedText);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 1500);
    } catch (error) {
      console.error('Unable to copy text:', error);
      setRecognitionNotice('Could not copy text. Check clipboard permissions.');
    }
  };

  const handleClearText = () => {
    setTranslatedText('');
    setTextLog([]);
    setIsDemoText(false);
    setCopyFeedback(false);
    lastRecognizedWordRef.current = '';
    lastSpokenTextRef.current = '';
    setRecognitionNotice('');
  };

  const handleInsertDemoSample = () => {
    const sample = 'Hello, how are you?';
    setTranslatedText(sample);
    setTextLog([sample]);
    setIsDemoText(true);
    setRecognitionNotice('Demo phrase inserted. This is sample text, not a model prediction.');
  };

  const startTranslation = async () => {
    if (isRecognizing) return;
    let activeStream = stream;
    if (cameraStatus !== 'Camera On' || !activeStream) {
      const started = await turnCameraOn();
      if (!started) return;
      activeStream = videoRef.current?.srcObject;
    }
    if (!activeStream) {
      setRecognitionNotice('Waiting for the camera stream. Try again.');
      return;
    }

    stoppedRef.current = false;
    setIsRecognizing(true);
    setRecognitionStatus('Processing');
    setRecognitionNotice('Resetting recognition session...');

    try {
      await resetRecognitionSession(DEFAULT_API_URL);
      if (stoppedRef.current) return;
      lastRecognizedWordRef.current = '';
      setHandConfidence(0);
      setHandLandmarks([]);
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
          const blob = await captureVideoFrameBlob(video, 0.85);
          if (stoppedRef.current) return;
          const result = await sendFrameForRecognition(blob, DEFAULT_API_URL, controller.signal);
          if (stoppedRef.current) return;

          if (!result?.success) {
            setRecognitionStatus('Model Disconnected');
            setRecognitionNotice(result?.error || 'The recognition API returned an error.');
            setHandLandmarks([]);
          } else {
            setHandLandmarks(Array.isArray(result.landmarks) ? result.landmarks : []);
            const confidence = typeof result.confidence === 'number' ? result.confidence : 0;
            setHandConfidence(Math.max(0, Math.min(1, confidence)));
            if (result.ready === false) {
              setRecognitionStatus('Processing');
              setRecognitionNotice(`Collecting frames: ${result.frames_collected ?? 0}/${result.frames_required ?? 64}`);
            } else {
              setRecognitionStatus('Ready');
              setRecognitionNotice('');
              const prediction = result.prediction ?? result.label ?? result.text ?? result.sign;
              if (typeof prediction === 'string' && prediction.trim() && confidence >= 0.65) {
                const word = prediction.trim();
                if (lastRecognizedWordRef.current !== word) {
                  lastRecognizedWordRef.current = word;
                  setTranslatedText((old) => old ? `${old} ${word}` : word);
                  setTextLog((old) => old[old.length - 1] === word ? old : [...old, word]);
                  setIsDemoText(false);
                  speakText(word);
                }
              } else if (confidence < 0.65) lastRecognizedWordRef.current = '';
            }
          }
        } catch (error) {
          if (error.name !== 'AbortError' && !stoppedRef.current) {
            console.error('Recognition error:', error);
            setRecognitionStatus('Error');
            setRecognitionNotice(error.message || 'Unable to process the camera frame.');
          }
        } finally {
          if (abortControllerRef.current === controller) abortControllerRef.current = null;
          if (!stoppedRef.current) recognitionIntervalRef.current = setTimeout(processFrame, 150);
        }
      };
      processFrame();
    } catch (error) {
      if (!stoppedRef.current) {
        console.error('Unable to start recognition:', error);
        setRecognitionStatus('Error');
        setRecognitionNotice(error.message || 'Could not reset recognition session. Check the backend.');
        setIsRecognizing(false);
      }
    }
  };

  return (
    <div className="translate-page-root">
      <div className="container translate-container">
        <section className="translate-header-section" aria-labelledby="translate-page-title">
          <div className="translate-header-content text-center">
            <h1 id="translate-page-title" className="translate-main-heading">Sign Language Translator</h1>
            <p className="translate-main-description">Show a supported sign in front of your camera and view the recognized text in real time.</p>
            <div className="translate-info-chips">
              <div className="info-chip"><Camera size={14} /><span>Camera-Based Input</span></div>
              <div className="info-chip"><Activity size={14} /><span>Live Recognition</span></div>
              <div className="info-chip"><Volume2 size={14} /><span>Optional Voice Output</span></div>
            </div>
          </div>
        </section>

        <section className="camera-card" aria-label="Camera preview">
          <div className="card-header">
            <div className="card-header-left"><Camera size={20} className="card-header-icon" /><h2 className="card-title">Live Camera</h2></div>
            <div className="card-header-right"><span className={`badge ${cameraStatus === 'Camera On' ? 'badge-camera-on' : cameraStatus === 'Camera Error' ? 'badge-camera-error' : 'badge-camera-off'}`} role="status">{cameraStatus}</span></div>
          </div>
          <div className="camera-viewport-container">
            <div className="camera-feed-wrapper" style={{ display: cameraStatus === 'Camera On' ? 'block' : 'none', position: 'relative', overflow: 'hidden' }}>
              <video ref={videoRef} autoPlay playsInline muted className="camera-video-stream" aria-label="Live webcam" />
              <canvas ref={skeletonCanvasRef} className="hand-skeleton-overlay" aria-label="Detected hand skeleton" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 2 }} />
              <div style={{ position: 'absolute', left: 16, bottom: 16, zIndex: 4, color: '#b9fff0', background: 'rgba(0, 20, 20, 0.82)', padding: '9px 12px', borderRadius: 8, fontSize: 13 }}>
                <div>Confidence: {(handConfidence * 100).toFixed(1)}%</div>
                <div style={{ width: 150, height: 4, marginTop: 7, background: 'rgba(255,255,255,0.2)', borderRadius: 4, overflow: 'hidden' }}><div style={{ width: `${handConfidence * 100}%`, height: '100%', background: '#35e0c1', transition: 'width 0.2s ease' }} /></div>
              </div>
              <div className="camera-overlay-bar" aria-hidden="true">
                <div className="overlay-tag overlay-live"><span className="pulse-dot" /> LIVE</div>
                {isRecognizing && <div className="overlay-tag overlay-scanning"><Sparkles size={12} /><span>RECOGNITION ACTIVE</span></div>}
                <div className="overlay-tag overlay-res">720p HD</div>
              </div>
              <div className="camera-reticle reticle-tl" /><div className="camera-reticle reticle-tr" /><div className="camera-reticle reticle-bl" /><div className="camera-reticle reticle-br" />
            </div>
            {cameraStatus !== 'Camera On' && <div className="camera-placeholder-stage">
              <div className="placeholder-icon-circle"><Camera size={44} className="placeholder-camera-icon" /></div>
              <h3 className="placeholder-title">Camera preview will appear here.</h3><p className="placeholder-subtitle">Enable your camera to begin.</p>
              <button type="button" className="btn-placeholder-camera" onClick={turnCameraOn}><Camera size={18} /><span>Turn Camera On</span></button>
            </div>}
          </div>
          {cameraErrorMessage && <div className="camera-error-banner" role="alert"><AlertCircle size={18} /><span>{cameraErrorMessage}</span></div>}
          <div className="camera-controls-bar">
            <div className="controls-button-group">
              {isRecognizing ? <button type="button" className="btn-control btn-stop-translation" onClick={stopTranslation}><Square size={18} fill="currentColor" /><span>Stop Translation</span></button> : <button type="button" className="btn-control btn-start-translation" onClick={startTranslation}><Play size={18} fill="currentColor" /><span>Start Translation</span></button>}
              {cameraStatus === 'Camera On' ? <button type="button" className="btn-control btn-toggle-camera btn-camera-active" onClick={turnCameraOff}><VideoOff size={18} /><span>Turn Camera Off</span></button> : <button type="button" className="btn-control btn-toggle-camera" onClick={turnCameraOn}><Camera size={18} /><span>Turn Camera On</span></button>}
            </div>
            <p className="camera-helper-text">Keep your hands inside the frame and use good lighting.</p>
          </div>
        </section>

        <section className="output-card" aria-label="Translation output">
          <div className="card-header">
            <div className="card-header-left"><MessageSquare size={20} className="card-header-icon" /><h2 className="card-title">Translation Output</h2></div>
            <div className="card-header-right"><span className="badge">{recognitionStatus === 'Ready' ? 'Translation ready' : recognitionStatus === 'Processing' ? 'Recognizing' : ['Error', 'Model Disconnected'].includes(recognitionStatus) ? 'Recognition unavailable' : 'Waiting for signs'}</span></div>
          </div>
          <div className="output-body">
            {translatedText ? <div className="recognized-text-display">
              {isDemoText && <div className="demo-mode-pill"><Info size={12} /><span>Demo sample — not model output</span></div>}
              <div className="main-translated-string" aria-live="polite">“{translatedText}”</div>
              {textLog.length > 1 && <div className="recognized-log-flow"><span className="log-label">History:</span>{textLog.map((phrase, index) => <span key={`${phrase}-${index}`} className="phrase-pill">{phrase}</span>)}</div>}
            </div> : <div className="output-empty-state"><p className="empty-state-text">Your translated text will appear here.</p><p className="empty-state-sub">Start the camera and show a supported sign.</p></div>}
            {recognitionNotice && <div className="recognition-notice-box" role="status"><AlertCircle size={16} /><span>{recognitionNotice}</span></div>}
            <div className="output-action-row">
              <div className="output-actions-left">
                <button type="button" className={`btn-action-pill ${voiceEnabled ? 'btn-voice-on' : ''}`} onClick={toggleVoiceOutput} disabled={!speechAvailable}>{voiceEnabled ? <><Volume2 size={16} /><span>Voice Output On</span></> : <><VolumeX size={16} /><span>Enable Voice Output</span></>}</button>
                <button type="button" className="btn-action-pill" onClick={handleCopyText} disabled={!translatedText}>{copyFeedback ? <><Check size={16} /><span>Copied!</span></> : <><Copy size={16} /><span>Copy Text</span></>}</button>
                <button type="button" className="btn-action-pill btn-clear" onClick={handleClearText} disabled={!translatedText}><Trash2 size={16} /><span>Clear Text</span></button>
              </div>
              <div className="output-actions-right"><button type="button" className="btn-demo-sample" onClick={handleInsertDemoSample}><Zap size={14} /><span>Load Sample Demo Phrase</span></button></div>
            </div>
          </div>
        </section>

        <section className="status-cards-row" aria-label="System status">
          <div className="status-mini-card"><div className="mini-card-icon-wrapper"><Camera size={20} /></div><div className="mini-card-content"><span className="mini-card-label">Camera Status</span><span className="status-text">{cameraStatus}</span></div></div>
          <div className="status-mini-card"><div className="mini-card-icon-wrapper"><Activity size={20} /></div><div className="mini-card-content"><span className="mini-card-label">Recognition Status</span><span className="status-text">{recognitionStatus}</span></div></div>
          <div className="status-mini-card"><div className="mini-card-icon-wrapper"><Volume2 size={20} /></div><div className="mini-card-content"><span className="mini-card-label">Voice Status</span><span className="status-text">{voiceEnabled ? 'Voice On' : 'Voice Off'}</span></div></div>
        </section>

        <section className="backend-info-card" aria-label="Backend status">
          <div className="backend-info-header">
            <div className="backend-info-title"><Server size={18} /><h3>Recognition Backend</h3></div>
            <button type="button" className="btn-health-check" onClick={checkBackend} disabled={isCheckingBackend}><RefreshCw size={14} className={isCheckingBackend ? 'spin-icon' : ''} /><span>{isCheckingBackend ? 'Checking...' : 'Check Connection'}</span></button>
          </div>
          <div className="backend-info-body">
            <div className="backend-pipeline-flow"><span className="pipe-node">Browser Camera</span><span className="pipe-arrow">→</span><span className="pipe-node">Frame Capture</span><span className="pipe-arrow">→</span><span className="pipe-node">MediaPipe</span><span className="pipe-arrow">→</span><span className="pipe-node">Trained Model</span><span className="pipe-arrow">→</span><span className="pipe-node">Text Output</span></div>
            <div className="backend-status-message">
              <div className="endpoint-tag"><code>Endpoint: {DEFAULT_API_URL}</code></div>
              <div className={`connection-pill ${backendHealth.available ? 'pill-connected' : 'pill-disconnected'}`}><span className={`dot-status ${backendHealth.available ? 'dot-active' : 'dot-warning'}`} /><span>{backendHealth.message}</span></div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
