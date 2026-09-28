import { useState, useRef, useEffect, useCallback } from "react";
import { recognizeFrame } from "../recognize.js";

const LANGS = [["en-US", "English"], ["hi-IN", "हिन्दी"], ["ta-IN", "தமிழ்"], ["es-ES", "Español"]];

export default function Translator({ user }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const lastRef = useRef("");
  const [camOn, setCamOn] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState("demo");
  const [lang, setLang] = useState("en-US");
  const [speak, setSpeak] = useState(false);
  const [current, setCurrent] = useState(null);
  const [log, setLog] = useState([]);

  const startCam = async () => {
    setError("");
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      setCamOn(true);
    } catch (e) {
      setError(`Camera unavailable (${e.name || "error"}). Allow access, or use demo mode.`);
    }
  };

  const stopCam = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCamOn(false);
    setRunning(false);
  };

  useEffect(() => {
    if (camOn && videoRef.current && streamRef.current) videoRef.current.srcObject = streamRef.current;
  }, [camOn]);
  useEffect(() => () => stopCam(), []);

  const say = useCallback((text) => {
    try {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang;
      speechSynthesis.cancel();
      speechSynthesis.speak(u);
    } catch { /* speech not supported */ }
  }, [lang]);

  useEffect(() => {
    if (!running) return;
    let busy = false;
    const id = setInterval(async () => {
      if (busy) return;
      busy = true;
      try {
        const r = await recognizeFrame(videoRef.current, mode);
        if (r && r.confidence > 0.6 && r.text !== lastRef.current) {
          lastRef.current = r.text;
          setCurrent(r);
          setLog((l) => [...l, r.text]);
          if (speak) say(r.text);
        }
      } finally { busy = false; }
    }, 1800);
    return () => clearInterval(id);
  }, [running, mode, speak, say]);

  const sentence = log.join(" ");
  const pct = current ? Math.round(current.confidence * 100) : 0;

  return (
    <div className="wrap">
      <div style={{ paddingTop: 20 }}>
        <h2 style={{ margin: 0 }}>Translator</h2>
        <p className="sub" style={{ margin: "2px 0 0" }}>
          {user ? `Signed in as ${user}` : "Guest session – nothing is saved"}
        </p>
      </div>

      <div className="grid">
        <section className="card">
          <div className="video">
            <div className="badge">
              <span className={"dot" + (running ? " on" : "")} />
              {running ? "Translating" : camOn ? "Camera ready" : "Camera off"}
            </div>
            {camOn ? <video ref={videoRef} autoPlay playsInline muted /> : "Turn on the camera and sign within the frame, or try demo mode."}
          </div>
          {error && <div className="err">{error}</div>}
          <div className="row">
            {!camOn ? <button onClick={startCam}>Start camera</button> : <button onClick={stopCam}>Stop camera</button>}
            <button
              className="primary"
              disabled={!(mode === "demo" || camOn)}
              onClick={() => { lastRef.current = ""; setRunning((r) => !r); }}
            >
              {running ? "Pause" : "Start translating"}
            </button>
            <select value={mode} onChange={(e) => setMode(e.target.value)} aria-label="Mode">
              <option value="demo">Demo mode</option>
              <option value="live">Live model</option>
            </select>
          </div>
          <div className="note">
            {mode === "demo" ? "Demo mode shows sample output; no real recognition is running." : "Live mode calls recognizeFrame() in src/recognize.js."}
          </div>
        </section>

        <section className="card">
          <div className="row" style={{ marginTop: 0 }}>
            <select value={lang} onChange={(e) => setLang(e.target.value)} aria-label="Output language">
              {LANGS.map(([v, n]) => <option key={v} value={v}>{n}</option>)}
            </select>
            <label className="c">
              <input type="checkbox" checked={speak} onChange={(e) => setSpeak(e.target.checked)} /> Speak aloud
            </label>
          </div>
          <div className="live" aria-live="polite">
            {current ? current.text : <span style={{ color: "var(--mute)", fontWeight: 400, fontSize: 18 }}>Translation appears here</span>}
            {current && <small>Confidence {pct}%</small>}
          </div>
          {current && <div className="bar"><i style={{ width: pct + "%" }} /></div>}
          <div className="log">
            {log.length ? log.map((w, i) => <span key={i} className="chip">{w}</span>) : <span style={{ color: "var(--mute)" }}>Transcript is empty.</span>}
          </div>
          <div className="row">
            <button disabled={!sentence} onClick={() => say(sentence)}>Speak</button>
            <button disabled={!sentence} onClick={() => navigator.clipboard?.writeText(sentence)}>Copy</button>
            <button disabled={!log.length} onClick={() => { setLog([]); setCurrent(null); lastRef.current = ""; }}>Clear</button>
          </div>
        </section>
      </div>
    </div>
  );
}
