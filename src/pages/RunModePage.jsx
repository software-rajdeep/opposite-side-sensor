import { useState, useRef, useEffect } from "react";
import { Ic } from "../icons/Icons";
import { ROLE_ACCESS } from "../constants/roles";
import AccessDenied from "../components/AccessDenied";
import { SERVER, SENSOR_CONFIGS } from "../constants/config";

export default function RunModePage({
  user,
  rows,
  live,
  connected,
  onToggle,
  thicknessState,
  onSetupReady,
  setupReadyBusy,
}) {
  if (!ROLE_ACCESS[user.role]?.includes("run-mode")) return <AccessDenied />;

  const [minLimit,    setMinLimit]    = useState("");
  const [maxLimit,    setMaxLimit]    = useState("");
  const [limitActive, setLimitActive] = useState(false);
  const setupReady = Boolean(thicknessState?.setup_ready);
  const referenceReadings = thicknessState?.reference_readings || {};
  const capturedAt = thicknessState?.captured_at;
  const sensorOrder = Object.keys(SENSOR_CONFIGS);
  const sensorKeys = { A: "a", B: "b", C: "c" };

  const canvasA = useRef(null);
  const canvasB = useRef(null);
  const canvasC = useRef(null);

  const WINDOW = 100;

  function getColor(v) {
    if (v === null || v === undefined) return "var(--text-3)";
    if (!limitActive) return "var(--blue)";
    const n  = parseFloat(v);
    const mn = parseFloat(minLimit);
    const mx = parseFloat(maxLimit);
    if (!isNaN(mn) && n < mn) return "var(--red)";
    if (!isNaN(mx) && n > mx) return "var(--red)";
    return "var(--blue)";
  }

  function fmtVal(v) {
    if (v === null || v === undefined)
      return <span style={{ color: "var(--text-3)" }}>—</span>;
    return <span style={{ color: getColor(v) }}>{v}</span>;
  }

  function isOnline(key) {
    if (!rows || rows.length === 0) return false;
    const latest = rows[0];
    return latest[key] !== null && latest[key] !== undefined;
  }

  function drawGraph(canvas, dataKey) {
    if (!canvas) return;
    const ctx   = canvas.getContext("2d");
    const W     = canvas.width;
    const H     = canvas.height;
    const slice = [...rows].reverse().slice(0, WINDOW);
    const vals  = slice.map(r => parseFloat(r[dataKey])).filter(n => !isNaN(n));

    ctx.clearRect(0, 0, W, H);

    if (vals.length < 2) {
      ctx.fillStyle = "#475569";
      ctx.font      = "11px monospace";
      ctx.textAlign = "center";
      ctx.fillText("Waiting for data…", W / 2, H / 2);
      return;
    }

    const mn    = parseFloat(minLimit);
    const mx    = parseFloat(maxLimit);
    const min   = Math.min(...vals) - 0.5;
    const max   = Math.max(...vals) + 0.5;
    const pad   = { top: 10, bottom: 20, left: 36, right: 10 };
    const gW    = W - pad.left - pad.right;
    const gH    = H - pad.top - pad.bottom;
    const total = vals.length;

    function xPos(i) { return pad.left + (i / (total - 1)) * gW; }
    function yPos(v) { return pad.top + (1 - (v - min) / (max - min)) * gH; }

    // Grid lines
    ctx.strokeStyle = "#30363d";
    ctx.lineWidth   = 1;
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + (i / 4) * gH;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(W - pad.right, y);
      ctx.stroke();
      const label = (max - (i / 4) * (max - min)).toFixed(2);
      ctx.fillStyle  = "#475569";
      ctx.font       = "9px monospace";
      ctx.textAlign  = "right";
      ctx.fillText(label, pad.left - 4, y + 3);
    }

    // Min limit line
    if (limitActive && !isNaN(mn) && mn >= min && mn <= max) {
      ctx.strokeStyle = "rgba(239,68,68,0.6)";
      ctx.lineWidth   = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(pad.left, yPos(mn));
      ctx.lineTo(W - pad.right, yPos(mn));
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Max limit line
    if (limitActive && !isNaN(mx) && mx >= min && mx <= max) {
      ctx.strokeStyle = "rgba(239,68,68,0.6)";
      ctx.lineWidth   = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(pad.left, yPos(mx));
      ctx.lineTo(W - pad.right, yPos(mx));
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Line
    ctx.beginPath();
    vals.forEach((v, i) => {
      const x = xPos(i);
      const y = yPos(v);
      if (i === 0) ctx.moveTo(x, y);
      else         ctx.lineTo(x, y);
    });
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth   = 1.5;
    ctx.stroke();

    // Dots
    vals.forEach((v, i) => {
      const inLimit = !limitActive || (
        (isNaN(mn) || v >= mn) && (isNaN(mx) || v <= mx)
      );
      ctx.beginPath();
      ctx.arc(xPos(i), yPos(v), 2, 0, Math.PI * 2);
      ctx.fillStyle = inLimit ? "#3b82f6" : "#ef4444";
      ctx.fill();
    });
  }

  useEffect(() => {
    const canvasMap = { A: canvasA, B: canvasB, C: canvasC };
    sensorOrder.forEach((sid) => {
      const key = sensorKeys[sid];
      if (key) drawGraph(canvasMap[sid]?.current, key);
    });
  }, [rows, limitActive, minLimit, maxLimit, sensorOrder]);

  const latest = rows[0];

  return (
    <div className="fade-up" style={{ display: "flex", flexDirection: "column", flex: 1 }}>

      {/* PAGE HEADER */}
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <div className="page-title">Live Run Mode</div>
            <div className="page-sub">REAL-TIME THICKNESS · mm</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {live && connected && (
              <div className="live-dot"><div className="dot" /> LIVE</div>
            )}
            <button
              className={`btn ${live ? "btn-red" : "btn-green"}`}
              onClick={onToggle}
            >
              {live ? <><Ic.X /> Stop</> : <><Ic.Refresh /> Start Live</>}
            </button>
          </div>
        </div>
      </div>

      {/* CONNECTION STATUS */}
      <div style={{ padding: "0 32px", marginBottom: 16 }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background:   connected ? "var(--green-ghost)" : "var(--bg2)",
          border:       `1px solid ${connected ? "rgba(34,197,94,0.3)" : "var(--border)"}`,
          borderRadius: "var(--r)", padding: "6px 12px",
          fontSize: 12, fontFamily: "var(--mono)",
          color: connected ? "var(--green)" : "var(--text-3)",
        }}>
          <span style={{
            width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
            background: connected ? "var(--green)" : "var(--text-3)",
          }} />
          {connected
            ? `Connected · ${SERVER}`
            : `Disconnected · Press "Start Live" to connect`
          }
        </div>
      </div>

        {/* SETUP READY */}
        <div className="section">
          <div className="section-header">
            <span className="section-title">Is the setup ready?</span>
            <span style={{ fontSize: 11, color: setupReady ? "var(--green)" : "var(--text-3)", fontFamily: "var(--mono)" }}>
              {setupReady ? "Baseline captured" : "Waiting for confirmation"}
            </span>
          </div>
          <div style={{
            background: "linear-gradient(135deg, rgba(59,130,246,0.08), rgba(34,197,94,0.06))",
            border: "1px solid var(--border)",
            borderRadius: "var(--r2)",
            padding: "16px 18px",
            display: "flex",
            gap: 16,
            alignItems: "flex-start",
            justifyContent: "space-between",
            flexWrap: "wrap",
          }}>
            <div style={{ minWidth: 240, flex: 1 }}>
              <div style={{ fontSize: 13, color: "var(--text)", marginBottom: 6, fontWeight: 600 }}>
                Capture the starting readings once the object is in position.
              </div>
              <div style={{ fontSize: 12, color: "var(--text-2)", fontFamily: "var(--mono)", lineHeight: 1.6 }}>
                The backend saves this baseline, then calculates thickness as starting reading minus the live reading for each sensor.
              </div>
              {setupReady && (
                <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
                  <div style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "var(--mono)" }}>
                    Captured at {capturedAt ? new Date(capturedAt).toLocaleString() : "—"}
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {Object.entries(referenceReadings).map(([sid, value]) => (
                      <span
                        key={sid}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          borderRadius: 999,
                          padding: "6px 10px",
                          background: "var(--bg3)",
                          border: "1px solid var(--border)",
                          fontFamily: "var(--mono)",
                          fontSize: 12,
                          color: "var(--text)",
                        }}
                      >
                        Sensor {sid}: {value ?? "—"} mm
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button
              className={`btn ${setupReady ? "btn-outline" : "btn-green"}`}
              onClick={onSetupReady}
              disabled={setupReadyBusy}
              style={{ minWidth: 220 }}
            >
              {setupReadyBusy
                ? "Capturing starting readings..."
                : setupReady
                ? "Re-capture starting readings"
                : "Yes, capture starting readings"}
            </button>
          </div>
        </div>

      {/* THICKNESS LIMIT */}
      <div className="section">
        <div className="section-header">
          <span className="section-title">Thickness Limit</span>
          <button
            className={`btn btn-sm ${limitActive ? "btn-red" : "btn-outline"}`}
            onClick={() => setLimitActive(l => !l)}
          >
            {limitActive ? "Disable Limit" : "Enable Limit"}
          </button>
        </div>
        <div style={{
          background: "var(--bg2)", border: "1px solid var(--border)",
          borderRadius: "var(--r2)", padding: "16px 18px",
          display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap",
        }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 5, fontFamily: "var(--mono)" }}>
              MIN (mm)
            </div>
            <input
              type="number"
              className="form-input"
              placeholder="e.g. 4"
              value={minLimit}
              onChange={e => setMinLimit(e.target.value)}
              style={{ width: 100, fontFamily: "var(--mono)" }}
            />
          </div>
          <div style={{ color: "var(--text-3)", fontSize: 18, marginTop: 16 }}>—</div>
          <div>
            <div style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 5, fontFamily: "var(--mono)" }}>
              MAX (mm)
            </div>
            <input
              type="number"
              className="form-input"
              placeholder="e.g. 8"
              value={maxLimit}
              onChange={e => setMaxLimit(e.target.value)}
              style={{ width: 100, fontFamily: "var(--mono)" }}
            />
          </div>
          {limitActive && (
            <div style={{
              marginLeft: "auto",
              background: "var(--blue-ghost)",
              border: "1px solid rgba(59,130,246,0.2)",
              borderRadius: "var(--r)", padding: "8px 14px",
              fontSize: 12, fontFamily: "var(--mono)", color: "var(--blue)",
            }}>
              Active: {minLimit || "—"} mm → {maxLimit || "—"} mm
            </div>
          )}
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="stats-grid">
        {sensorOrder.map((sid) => {
          const key = sensorKeys[sid];
          const v = key ? latest?.[key] : undefined;
          const online = key ? isOnline(key) : false;
          return (
            <div key={sid} className="stat-card">
              <div className="stat-label">
                <span
                  className={`s-dot ${connected && online ? "on" : "off"}`}
                  style={{ display: "inline-block" }}
                />
                &nbsp;Sensor {sid}
              </div>
              <div className="stat-val" style={{ fontSize: 28, color: getColor(v) }}>
                {v ?? "—"}
              </div>
              <div className="stat-sub">mm · latest thickness</div>
            </div>
          );
        })}
      </div>

      {/* LIVE GRAPHS */}
      <div className="section">
        <div className="section-header">
          <span className="section-title">Live Graph — Last {WINDOW} Thickness Samples</span>
        </div>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px,1fr))",
          gap: 14,
        }}>
          {sensorOrder.map((sid) => {
            const key = sensorKeys[sid];
            const v = key ? latest?.[key] : undefined;
            const online = key ? isOnline(key) : false;
            const ref = sid === "A" ? canvasA : sid === "B" ? canvasB : canvasC;
            const label = `Sensor ${sid}`;
            return (
              <div key={label} style={{
                background: "var(--bg2)", border: "1px solid var(--border)",
                borderRadius: "var(--r2)", overflow: "hidden",
              }}>
                <div style={{
                  padding: "10px 14px",
                  borderBottom: "1px solid var(--border)",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                  <span style={{
                    fontSize: 13, fontWeight: 600, color: "var(--text)",
                    display: "flex", alignItems: "center", gap: 8,
                  }}>
                    <span
                      className={`s-dot ${connected && online ? "on" : "off"}`}
                      style={{ display: "inline-block" }}
                    />
                    {label}
                  </span>
                  <span style={{
                    fontSize: 13, fontFamily: "var(--mono)",
                    fontWeight: 700, color: getColor(v),
                  }}>
                    {v ?? "—"} mm thickness
                  </span>
                </div>
                <canvas
                  ref={ref}
                  width={400}
                  height={120}
                  style={{ width: "100%", height: 120, display: "block" }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* READING HISTORY TABLE */}
      <div className="section">
        <div className="section-header">
          <span className="section-title">Reading History</span>
          <span style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "var(--mono)" }}>
            {rows.length} records
          </span>
        </div>

        {rows.length === 0 ? (
          <div style={{
            background: "var(--bg2)", border: "1px solid var(--border)",
            borderRadius: "var(--r2)", padding: "48px 32px",
            textAlign: "center", color: "var(--text-3)",
            fontFamily: "var(--mono)", fontSize: 13,
          }}>
            No thickness data yet — capture starting readings and press "Start Live" to begin streaming
          </div>
        ) : (
          <div className="table-wrap scroll-table">
            <table>
              <thead>
                <tr>
                  <th style={{ width: 60 }}>#</th>
                  <th>Timestamp</th>
                  {sensorOrder.map((sid) => (
                    <th key={sid} className="td-r">Sensor {sid} Thickness (mm)</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.id}>
                    <td className="td-mono td-dim">{r.id}</td>
                    <td className="td-mono td-dim" style={{ fontSize: 11 }}>{r.ts}</td>
                    {sensorOrder.map((sid) => (
                      <td key={sid} className="td-mono td-r">
                        {fmtVal(r[sensorKeys[sid]])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}