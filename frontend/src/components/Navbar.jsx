import { useState } from "react";

export default function Navbar({ view, user, go, onLogout }) {
  const [open, setOpen] = useState(false);
  const nav = (v, a) => () => { setOpen(false); go(v, a); };

  return (
    <nav>
      <div className="wrap nav">
        <div className="brand" onClick={nav("home")}>🤟 Sign<b>Bridge</b></div>
        <button className="burger" onClick={() => setOpen(o => !o)} aria-label="Menu">☰</button>
        <div className={"links" + (open ? " open" : "")}>
          <a onClick={nav("home")}>Home</a>
          <a onClick={nav("home", "about")}>About</a>
          <a onClick={nav("home", "features")}>Features</a>
          <a onClick={nav("home", "how")}>How it works</a>
          <a onClick={nav("home", "contact")}>Contact</a>
          {user ? (
            <>
              <span className="who">👤 {user}</span>
              <button onClick={() => { setOpen(false); onLogout(); }}>Logout</button>
            </>
          ) : (
            view !== "app" && <button className="primary" onClick={nav("login")}>Login</button>
          )}
        </div>
      </div>
    </nav>
  );
}
