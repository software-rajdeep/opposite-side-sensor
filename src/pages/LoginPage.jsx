import { useState } from "react";
import { Ic } from "../icons/Icons";
import Spinner from "../components/Spinner";
import { SERVER, DEMO_ACCOUNTS } from "../constants/config";

export default function LoginPage({ onLogin }) {
  const [u,       setU]       = useState("");
  const [p,       setP]       = useState("");
  const [err,     setErr]     = useState("");
  const [loading, setLoading] = useState(false);

  function fetchWithTimeout(url, options = {}, timeoutMs = 8000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    return fetch(url, { ...options, signal: controller.signal })
      .finally(() => clearTimeout(timeoutId));
  }

  async function handleLogin() {
    if (!u || !p) { setErr("Please fill in both fields."); return; }
    setLoading(true);
    setErr("");

    try {
      const res  = await fetchWithTimeout(`${SERVER}/login`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ username: u, password: p }),
      });
      const data = await res.json();

      if (res.ok) {
        onLogin({ username: data.username, role: data.role });
      } else {
        setErr(data.error || "Invalid username or password.");
      }
    } catch {
      setErr("Network error — check backend host and port.");
    }

    setLoading(false);
  }

  function fillDemo(username, password) {
    setU(username);
    setP(password);
  }

  return (
    <div className="login-wrap">
      <div className="login-card">

        {/* HEADER */}
        <div className="login-header">
          <div className="login-logo-wrap">
            <img src="/rajdeep-logo.png" alt="Rajdeep Automation" />
            <span className="login-title">Thickness Monitoring</span>
          </div>
          <div className="login-sub">CD22 OPPOSITE SENSORS SYSTEM</div>
        </div>

        {/* ERROR */}
        {err && (
          <div className="error-box">
            <Ic.AlertTriangle />
            {err}
          </div>
        )}

        {/* USERNAME */}
        <div className="form-field">
          <label className="form-label">Username</label>
          <div className="input-wrap">
            <Ic.User />
            <input
              value={u}
              onChange={e => setU(e.target.value)}
              placeholder="Enter username"
              onKeyDown={e => e.key === "Enter" && handleLogin()}
              autoFocus
            />
          </div>
        </div>

        {/* PASSWORD */}
        <div className="form-field">
          <label className="form-label">Password</label>
          <div className="input-wrap">
            <Ic.Lock />
            <input
              type="password"
              value={p}
              onChange={e => setP(e.target.value)}
              placeholder="Enter password"
              onKeyDown={e => e.key === "Enter" && handleLogin()}
            />
          </div>
        </div>

        {/* SUBMIT */}
        <button
          className="btn-primary"
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? <><Spinner /> Authenticating…</> : "Sign In"}
        </button>

        {/* DEMO ACCOUNTS */}
        <div className="demo-hint">
          <div className="demo-hint-title">Demo Accounts</div>
          <div className="demo-accounts">
            {DEMO_ACCOUNTS.map(acc => (
              <div
                key={acc.username}
                className="demo-row"
                onClick={() => fillDemo(acc.username, acc.password)}
              >
                <div className="demo-row-left">
                  <span className="demo-user">{acc.username}</span>
                </div>
                <span className="demo-pass">{acc.password}</span>
              </div>
            ))}
          </div>
        </div>

        {/* HELP */}
        <div style={{
          marginTop: 20,
          borderTop: "1px solid var(--border)",
          paddingTop: 16,
          textAlign: "center",
        }}>
          <div style={{
            fontSize: 12,
            color: "var(--text-2)",
            marginBottom: 4,
          }}>
            Need Help?
          </div>
          <a
            href="mailto:support@rajdeep.in"
            style={{
              fontSize: 13,
              color: "var(--blue)",
              fontWeight: 500,
              textDecoration: "none",
            }}
          >
            contact your administrator
          </a>
        </div>

      </div>
    </div>
  );
}