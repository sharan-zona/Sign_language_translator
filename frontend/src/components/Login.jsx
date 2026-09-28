import { useState } from "react";

export default function Login({ onAuth, go }) {
  const [tab, setTab] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");

  const submit = (e) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) return setErr("Enter a valid email address.");
    if (pw.length < 6) return setErr("Password must be at least 6 characters.");
    if (tab === "signup" && !name.trim()) return setErr("Please enter your name.");
    // TODO: replace with a real API call (Firebase / Express) and store the token
    onAuth(tab === "signup" ? name.trim() : email.split("@")[0]);
  };

  const switchTab = (t) => { setTab(t); setErr(""); };

  return (
    <div className="wrap">
      <div className="card center">
        <h2 style={{ marginTop: 0 }}>{tab === "login" ? "Welcome back" : "Create account"}</h2>
        <div className="tabs">
          <button className={tab === "login" ? "on" : ""} onClick={() => switchTab("login")}>Login</button>
          <button className={tab === "signup" ? "on" : ""} onClick={() => switchTab("signup")}>Sign up</button>
        </div>
        <form onSubmit={submit}>
          {tab === "signup" && (
            <>
              <label className="f">Full name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
            </>
          )}
          <label className="f">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <label className="f">Password</label>
          <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} />
          {err && <div className="err">{err}</div>}
          <button className="primary" style={{ width: "100%" }} type="submit">
            {tab === "login" ? "Login" : "Create account"}
          </button>
        </form>
        <div className="row" style={{ justifyContent: "center" }}>
          <button onClick={() => go("app")}>Continue as guest</button>
        </div>
        <div className="note">Demo form: it only validates input. Connect a backend for real authentication.</div>
      </div>
    </div>
  );
}
