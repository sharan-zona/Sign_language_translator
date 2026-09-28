const FEATURES = [
  ["📷", "Real-time camera input", "Uses your webcam to watch hand gestures and convert them as you sign."],
  ["💬", "Instant text output", "Recognised signs appear as text with a confidence score you can trust."],
  ["🔊", "Speech output", "Turn the translated sentence into spoken words with one tap."],
  ["🌐", "Multiple languages", "Choose the output language: English, Hindi, Tamil or Spanish."],
  ["🔒", "Privacy first", "Video stays in your browser during the demo; nothing is uploaded."],
  ["♿", "Built for accessibility", "Simple, calm interface designed to reduce communication barriers."],
];
const STEPS = [
  ["Open the app", "Try it as a guest or log in to keep your session."],
  ["Turn on your camera", "Allow camera access and sign inside the frame."],
  ["Read or hear the result", "Translation shows as text and can be spoken aloud."],
];

export default function Home({ go }) {
  return (
    <>
      <header className="hero">
        <div className="wrap">
          <span className="pill">Sign language ⇄ text & speech</span>
          <h1>Bridging communication with <span>SignBridge</span></h1>
          <p className="lead">
            A web application that translates sign language gestures into readable text and spoken
            words in real time, helping deaf and hard-of-hearing people communicate with everyone.
          </p>
          <div className="cta">
            <button className="primary big" onClick={() => go("app")}>Try without login</button>
            <button className="big" onClick={() => go("login")}>Login</button>
          </div>
          <div className="hand">🤟</div>
        </div>
      </header>

      <section className="blk" id="about">
        <div className="wrap">
          <h2>About the website</h2>
          <p className="sub">
            Millions of people rely on sign language, yet most people around them do not understand it.
            SignBridge uses a camera and machine learning to recognise hand gestures and translate them
            into text and speech, making everyday conversations easier at schools, hospitals, offices
            and public places.
          </p>
          <div className="cards">
            <div className="card"><div className="ic">🎯</div><h3>Our goal</h3><p>Reduce the communication gap between signers and non-signers.</p></div>
            <div className="card"><div className="ic">🧠</div><h3>Technology</h3><p>React frontend with a gesture-recognition model plugged in on the backend.</p></div>
            <div className="card"><div className="ic">🤝</div><h3>Who it helps</h3><p>Signers, families, teachers, healthcare staff and service providers.</p></div>
          </div>
        </div>
      </section>

      <section className="blk alt" id="features">
        <div className="wrap">
          <h2>Features</h2>
          <p className="sub">Everything you need for simple, everyday translation.</p>
          <div className="cards">
            {FEATURES.map(([icon, title, text]) => (
              <div className="card" key={title}><div className="ic">{icon}</div><h3>{title}</h3><p>{text}</p></div>
            ))}
          </div>
        </div>
      </section>

      <section className="blk" id="how">
        <div className="wrap">
          <h2>How it works</h2>
          <p className="sub">Three simple steps.</p>
          <div className="cards">
            {STEPS.map(([title, text], i) => (
              <div className="card step" key={title}>
                <div className="num">{i + 1}</div>
                <div><h3 style={{ margin: "0 0 4px" }}>{title}</h3><p style={{ margin: 0 }}>{text}</p></div>
              </div>
            ))}
          </div>
          <div className="cta" style={{ justifyContent: "flex-start" }}>
            <button className="primary big" onClick={() => go("app")}>Try without login</button>
          </div>
        </div>
      </section>

      <footer id="contact">
        <div className="wrap">SignBridge – academic project · Contact: signbridge.project@example.com · © 2026</div>
      </footer>
    </>
  );
}
