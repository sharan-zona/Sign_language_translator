import { useState } from "react";
import Navbar from "./components/Navbar.jsx";
import Home from "./components/Home.jsx";
import Login from "./components/Login.jsx";
import Translator from "./components/Translator.jsx";

export default function App() {
  const [view, setView] = useState("home"); // "home" | "login" | "app"
  const [user, setUser] = useState(null);

  const go = (v, anchor) => {
    setView(v);
    setTimeout(() => {
      if (anchor) document.getElementById(anchor)?.scrollIntoView({ behavior: "smooth" });
      else window.scrollTo({ top: 0 });
    }, 30);
  };

  return (
    <>
      <Navbar view={view} user={user} go={go} onLogout={() => { setUser(null); go("home"); }} />
      {view === "home" && <Home go={go} />}
      {view === "login" && <Login go={go} onAuth={(name) => { setUser(name); go("app"); }} />}
      {view === "app" && <Translator user={user} />}
    </>
  );
}
