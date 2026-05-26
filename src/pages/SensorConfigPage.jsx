import { useState } from "react";
import { Ic } from "../icons/Icons";
import { ROLE_ACCESS } from "../constants/roles";
import AccessDenied from "../components/AccessDenied";
import Spinner from "../components/Spinner";
import { SERVER } from "../constants/config";

const REG = {
  sampling:  { addr_h: "0x40", addr_l: "0x06" },
  averaging: { addr_h: "0x40", addr_l: "0x0A" },
  polarity:  { addr_h: "0x40", addr_l: "0x08" },
  alarm:     { addr_h: "0x40", addr_l: "0x0C" },
};

const SP_VALS  = ["0x00","0x01","0x02","0x03","0x0A"];
const SP_LABEL = ["500us","1000us","2000us","4000us","AUTO"];
const SP_JSON  = ["500us","1000us","2000us","4000us","AUTO"];

const AV_VALS  = ["0x00","0x01","0x02","0x03"];
const AV_LABEL = ["1","8","64","512"];
const AV_JSON  = ["1","8","64","512"];

const OP_VALS  = ["0x00","0x01"];
const OP_LABEL = ["Light_ON","Dark_ON"];

const AL_VALS  = ["0x00","0x01"];
const AL_LABEL = ["Clamp","Hold"];

export default function SensorConfigPage({ user, onToast }) {
  if (!ROLE_ACCESS[user.role]?.includes("sensor-config")) return <AccessDenied />;

  const [config, setConfig] = useState({
    A: { sampling: "0", averaging: "2", polarity: "0", alarm: "0" },
    B: { sampling: "0", averaging: "2", polarity: "0", alarm: "0" },
    C: { sampling: "0", averaging: "2", polarity: "0", alarm: "0" },
  });

  const [streamRate, setStreamRate] = useState("5");
  const [saving,     setSaving]     = useState(false);
  const [busyStream, setBusyStream] = useState(false);
  const [rawFields,  setRawFields]  = useState({ sensor: "A", addr_h: "", addr_l: "", val_h: "", val_l: "" });
  const [rawLoading, setRawLoading] = useState(false);
  const [log,        setLog]        = useState([{ type: "sys", msg: "System ready." }]);

  function addLog(msg, type = "def") {
    const ts = new Date().toLocaleTimeString("en-GB", { hour12: false });
    setLog(prev => [...prev, { ts, msg, type }]);
  }

  function updateConfig(sid, key, val) {
    setConfig(c => ({ ...c, [sid]: { ...c[sid], [key]: val } }));
  }

  // ── LOAD CONFIG ──────────────────────────────────────────────────────────
  async function loadConfig() {
    try {
      const res = await fetch(`${SERVER}/config/file`);
      if (!res.ok) { addLog("Could not fetch config file", "err"); return; }
      const cfg = await res.json();

      if (cfg.global_settings?.stream_rate_hz)
        setStreamRate(String(cfg.global_settings.stream_rate_hz));

      const SP_MAP = { "500us":"0","1000us":"1","2000us":"2","4000us":"3","AUTO":"4" };
      const AV_MAP = { "1":"0","8":"1","64":"2","512":"3" };
      const OP_MAP = { "Light_ON":"0","Dark_ON":"1" };
      const AL_MAP = { "Clamp":"0","Hold":"1" };

      const newConfig = { ...config };
      for (const sid of ["A","B","C"]) {
        const key = `sensor_${sid}`;
        if (!cfg[key]) continue;
        if (cfg[key].sampling_period)
          newConfig[sid].sampling  = SP_MAP[cfg[key].sampling_period] ?? "0";
        if (cfg[key].averaging !== undefined)
          newConfig[sid].averaging = AV_MAP[String(cfg[key].averaging)] ?? "2";
        if (cfg[key].output_polarity)
          newConfig[sid].polarity  = OP_MAP[cfg[key].output_polarity] ?? "0";
        if (cfg[key].alarm_output)
          newConfig[sid].alarm     = AL_MAP[cfg[key].alarm_output] ?? "0";
      }
      setConfig(newConfig);
      addLog("Config loaded from server", "ok");
      onToast("Configuration loaded", "success");
    } catch (e) {
      addLog(`Load error: ${e.message}`, "err");
      onToast("Failed to load config", "error");
    }
  }

  // ── WRITE HARDWARE ───────────────────────────────────────────────────────
  async function writeHW(sensor, addr_h, addr_l, val_l) {
    const res = await fetch(`${SERVER}/config/write`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ sensor, addr_h, addr_l, val_h: "0x00", val_l }),
    });
    return res.json();
  }

  // ── UPDATE JSON FILE ─────────────────────────────────────────────────────
  async function updateJSON(sid, spIdx, avIdx, opIdx, alIdx) {
    const getRes = await fetch(`${SERVER}/config/file`);
    const cfg    = await getRes.json();
    const key    = `sensor_${sid}`;
    if (!cfg[key]) cfg[key] = {};
    cfg[key].sampling_period = SP_JSON[spIdx];
    cfg[key].averaging       = parseInt(AV_JSON[avIdx]);
    cfg[key].output_polarity = OP_LABEL[opIdx];
    cfg[key].alarm_output    = AL_LABEL[alIdx];
    await fetch(`${SERVER}/config/file`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(cfg),
    });
  }

  // ── APPLY ONE SENSOR ─────────────────────────────────────────────────────
  async function applyOne(sid) {
    const spIdx = parseInt(config[sid].sampling);
    const avIdx = parseInt(config[sid].averaging);
    const opIdx = parseInt(config[sid].polarity);
    const alIdx = parseInt(config[sid].alarm);
    let allOk   = true;

    try {
      addLog(`[${sid}] Writing Sampling → ${SP_LABEL[spIdx]}`, "inf");
      const r1 = await writeHW(sid, REG.sampling.addr_h, REG.sampling.addr_l, SP_VALS[spIdx]);
      if (r1.message) addLog(`[${sid}] ✓ Sampling = ${SP_LABEL[spIdx]}`, "ok");
      else { addLog(`[${sid}] ✗ Sampling failed`, "err"); allOk = false; }

      addLog(`[${sid}] Writing Averaging → ${AV_LABEL[avIdx]}`, "inf");
      const r2 = await writeHW(sid, REG.averaging.addr_h, REG.averaging.addr_l, AV_VALS[avIdx]);
      if (r2.message) addLog(`[${sid}] ✓ Averaging = ${AV_LABEL[avIdx]}`, "ok");
      else { addLog(`[${sid}] ✗ Averaging failed`, "err"); allOk = false; }

      addLog(`[${sid}] Writing Polarity → ${OP_LABEL[opIdx]}`, "inf");
      const r3 = await writeHW(sid, REG.polarity.addr_h, REG.polarity.addr_l, OP_VALS[opIdx]);
      if (r3.message) addLog(`[${sid}] ✓ Polarity = ${OP_LABEL[opIdx]}`, "ok");
      else { addLog(`[${sid}] ✗ Polarity failed`, "err"); allOk = false; }

      addLog(`[${sid}] Writing Alarm → ${AL_LABEL[alIdx]}`, "inf");
      const r4 = await writeHW(sid, REG.alarm.addr_h, REG.alarm.addr_l, AL_VALS[alIdx]);
      if (r4.message) addLog(`[${sid}] ✓ Alarm = ${AL_LABEL[alIdx]}`, "ok");
      else { addLog(`[${sid}] ✗ Alarm failed`, "err"); allOk = false; }

      if (allOk) await updateJSON(sid, spIdx, avIdx, opIdx, alIdx);

    } catch (e) {
      addLog(`[${sid}] ✗ Error: ${e.message}`, "err");
      allOk = false;
    }

    if (allOk) onToast(`Sensor ${sid} configured successfully`, "success");
    else       onToast(`Sensor ${sid} — some writes failed`, "error");
  }

  // ── SAVE ALL ─────────────────────────────────────────────────────────────
  async function handleSave() {
    setSaving(true);
    addLog("──── Save All started ────", "sys");
    let allOk = true;

    for (const sid of ["A","B","C"]) {
      const spIdx = parseInt(config[sid].sampling);
      const avIdx = parseInt(config[sid].averaging);
      const opIdx = parseInt(config[sid].polarity);
      const alIdx = parseInt(config[sid].alarm);

      try {
        addLog(`[${sid}] Writing Sampling → ${SP_LABEL[spIdx]}`, "inf");
        const r1 = await writeHW(sid, REG.sampling.addr_h, REG.sampling.addr_l, SP_VALS[spIdx]);
        if (r1.message) addLog(`[${sid}] ✓ Sampling = ${SP_LABEL[spIdx]}`, "ok");
        else { addLog(`[${sid}] ✗ Sampling failed`, "err"); allOk = false; }

        addLog(`[${sid}] Writing Averaging → ${AV_LABEL[avIdx]}`, "inf");
        const r2 = await writeHW(sid, REG.averaging.addr_h, REG.averaging.addr_l, AV_VALS[avIdx]);
        if (r2.message) addLog(`[${sid}] ✓ Averaging = ${AV_LABEL[avIdx]}`, "ok");
        else { addLog(`[${sid}] ✗ Averaging failed`, "err"); allOk = false; }

        addLog(`[${sid}] Writing Polarity → ${OP_LABEL[opIdx]}`, "inf");
        const r3 = await writeHW(sid, REG.polarity.addr_h, REG.polarity.addr_l, OP_VALS[opIdx]);
        if (r3.message) addLog(`[${sid}] ✓ Polarity = ${OP_LABEL[opIdx]}`, "ok");
        else { addLog(`[${sid}] ✗ Polarity failed`, "err"); allOk = false; }

        addLog(`[${sid}] Writing Alarm → ${AL_LABEL[alIdx]}`, "inf");
        const r4 = await writeHW(sid, REG.alarm.addr_h, REG.alarm.addr_l, AL_VALS[alIdx]);
        if (r4.message) addLog(`[${sid}] ✓ Alarm = ${AL_LABEL[alIdx]}`, "ok");
        else { addLog(`[${sid}] ✗ Alarm failed`, "err"); allOk = false; }

        if (allOk) await updateJSON(sid, spIdx, avIdx, opIdx, alIdx);

      } catch (e) {
        addLog(`[${sid}] ✗ Error: ${e.message}`, "err");
        allOk = false;
      }
      await new Promise(r => setTimeout(r, 300));
    }

    try {
      const hz  = parseFloat(streamRate);
      const res = await fetch(`${SERVER}/stream/config`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ rate: hz }),
      });
      const d = await res.json();
      if (d.message) addLog(`[GLOBAL] ✓ Stream Rate = ${hz} Hz`, "ok");
      else { addLog(`[GLOBAL] ✗ Stream rate failed`, "err"); allOk = false; }
    } catch (e) {
      addLog(`[GLOBAL] ✗ Stream rate error`, "err");
      allOk = false;
    }

    addLog("──── Save All complete ────", "sys");
    setSaving(false);
    onToast(allOk ? "Configuration saved successfully" : "Some writes failed — check log", allOk ? "success" : "error");
  }

  // ── APPLY STREAM RATE ────────────────────────────────────────────────────
  async function applyStreamRate() {
    setBusyStream(true);
    const hz = parseFloat(streamRate);
    try {
      const res  = await fetch(`${SERVER}/stream/config`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ rate: hz }),
      });
      const data = await res.json();
      if (data.message) {
        addLog(`[GLOBAL] ✓ Stream Rate = ${hz} Hz`, "ok");
        const getRes = await fetch(`${SERVER}/config/file`);
        const cfg    = await getRes.json();
        cfg.global_settings.stream_rate_hz = hz;
        await fetch(`${SERVER}/config/file`, {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify(cfg),
        });
        onToast(`Stream rate set to ${hz} Hz`, "success");
      } else {
        addLog(`[GLOBAL] ✗ Failed: ${data.error}`, "err");
        onToast("Stream rate update failed", "error");
      }
    } catch (e) {
      addLog(`[GLOBAL] ✗ Network error`, "err");
      onToast("Network error", "error");
    }
    setBusyStream(false);
  }

  // ── RAW WRITE ────────────────────────────────────────────────────────────
  async function handleExecuteWrite() {
    const { sensor, addr_h, addr_l, val_h, val_l } = rawFields;
    if (!addr_h || !addr_l || !val_h || !val_l) {
      onToast("Please fill all four fields", "error"); return;
    }
    setRawLoading(true);
    try {
      const res  = await fetch(`${SERVER}/config/write`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ sensor, addr_h, addr_l, val_h, val_l }),
      });
      const data = await res.json();
      if (res.ok) {
        addLog(`[RAW] ✓ Write OK — ${data.message}`, "ok");
        onToast("Write executed successfully", "success");
      } else {
        addLog(`[RAW] ✗ Write Failed — ${data.error}`, "err");
        onToast(`Write failed: ${data.error}`, "error");
      }
    } catch {
      onToast("Network error", "error");
    }
    setRawLoading(false);
  }

  function logColor(type) {
    if (type === "ok")  return "var(--green)";
    if (type === "err") return "var(--red)";
    if (type === "inf") return "var(--amber)";
    if (type === "sys") return "var(--text-2)";
    return "var(--text)";
  }

  const sensorRows = [
    { key: "sampling", label: "Sampling Period", opts: SP_LABEL },
    { key: "averaging", label: "Averaging",       opts: AV_LABEL },
    { key: "polarity",  label: "Output Polarity", opts: OP_LABEL },
    { key: "alarm",     label: "Alarm Mode",      opts: AL_LABEL },
  ];

  return (
    <div className="fade-up">

      {/* PAGE HEADER */}
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <div className="page-title">Sensor Configuration</div>
            <div className="page-sub">HARDWARE PARAMETERS · CD22 SERIES</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-outline" onClick={loadConfig}>
              <Ic.Refresh /> Load from File
            </button>
            <button className="btn btn-blue" onClick={handleSave} disabled={saving}>
              {saving ? <><Spinner /> Saving…</> : <><Ic.Check /> Save Changes</>}
            </button>
          </div>
        </div>
      </div>

      <div className="config-grid">

        {/* PER-SENSOR TABLE */}
        <div className="table-wrap">
          <div className="card-header">
            <div className="card-title"><Ic.Sensor /> Per-Sensor Parameters</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Parameter</th>
                <th>Sensor A</th>
                <th>Sensor B</th>
                <th>Sensor C</th>
              </tr>
            </thead>
            <tbody>
              {sensorRows.map(row => (
                <tr key={row.key}>
                  <td style={{ color: "var(--text-2)", fontFamily: "var(--mono)", fontSize: 12 }}>
                    {row.label}
                  </td>
                  {["A","B","C"].map(sid => (
                    <td key={sid}>
                      <select
                        className="form-select"
                        value={config[sid][row.key]}
                        onChange={e => updateConfig(sid, row.key, e.target.value)}
                      >
                        {row.opts.map((o, i) => (
                          <option key={i} value={i}>{o}</option>
                        ))}
                      </select>
                    </td>
                  ))}
                </tr>
              ))}
              <tr>
                <td style={{ color: "var(--blue)", fontFamily: "var(--mono)", fontSize: 12 }}>
                  Apply
                </td>
                {["A","B","C"].map(sid => (
                  <td key={sid}>
                    <button
                      className="btn btn-outline btn-sm"
                      style={{
                        width: "100%",
                        justifyContent: "center",
                        color: "var(--blue)",
                        borderColor: "rgba(59,130,246,0.5)",
                      }}
                      onClick={() => applyOne(sid)}
                      disabled={saving}
                    >
                      Apply Sensor {sid}
                    </button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* GLOBAL STREAM + RAW WRITE */}
        <div className="card">
          <div className="card-header">
            <div className="card-title"><Ic.Activity /> Global Stream Settings</div>
          </div>
          <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            <div>
              <label className="form-label">Stream Rate (Hz)</label>
              <select
                className="form-select"
                value={streamRate}
                onChange={e => setStreamRate(e.target.value)}
                style={{ maxWidth: 200 }}
              >
                {["0.5","1","2","5","10"].map(v => (
                  <option key={v} value={v}>{v} Hz</option>
                ))}
              </select>
              <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 6, fontFamily: "var(--mono)" }}>
                Current: {streamRate} Hz · {Math.round(1000 / parseFloat(streamRate))}ms interval
              </div>
              <button
                className="btn btn-outline btn-sm"
                style={{ marginTop: 8 }}
                onClick={applyStreamRate}
                disabled={busyStream}
              >
                {busyStream ? <><Spinner /> Applying…</> : "Apply Rate"}
              </button>
            </div>

            <div style={{ borderTop: "1px solid var(--border)", paddingTop: 14 }}>
              <div className="section-title" style={{ marginBottom: 10 }}>Raw / Write Command</div>
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 4, fontFamily: "var(--mono)" }}>sensor</div>
                <select
                  className="form-select"
                  value={rawFields.sensor}
                  onChange={e => setRawFields(f => ({ ...f, sensor: e.target.value }))}
                  style={{ maxWidth: 120 }}
                >
                  {["A","B","C"].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                {["addr_h","addr_l","val_h","val_l"].map(f => (
                  <div key={f}>
                    <div style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 4, fontFamily: "var(--mono)" }}>{f}</div>
                    <input
                      className="form-input"
                      placeholder="0x00"
                      value={rawFields[f]}
                      onChange={e => setRawFields(p => ({ ...p, [f]: e.target.value }))}
                      style={{ fontFamily: "var(--mono)" }}
                    />
                  </div>
                ))}
              </div>
              <button
                className="btn btn-outline btn-sm"
                style={{ fontFamily: "var(--mono)" }}
                onClick={handleExecuteWrite}
                disabled={rawLoading}
              >
                {rawLoading ? <><Spinner /> Executing…</> : <><Ic.Code /> Execute Write</>}
              </button>
            </div>

          </div>
        </div>

        {/* ACTIVITY LOG */}
        <div className="card">
          <div className="card-header">
            <div className="card-title"><Ic.Database /> Activity Log</div>
            <button className="btn btn-outline btn-sm" onClick={() => setLog([])}>
              Clear
            </button>
          </div>
          <div style={{
            padding:       "12px 16px",
            maxHeight:     220,
            overflowY:     "auto",
            display:       "flex",
            flexDirection: "column",
            gap:           4,
          }}>
            {log.length === 0 && (
              <span style={{ color: "var(--text-3)", fontFamily: "var(--mono)", fontSize: 12 }}>
                No activity yet
              </span>
            )}
            {log.map((l, i) => (
              <div key={i} style={{ display: "flex", gap: 12, fontFamily: "var(--mono)", fontSize: 12 }}>
                <span style={{ color: "var(--text-3)", flexShrink: 0 }}>{l.ts || "--:--:--"}</span>
                <span style={{ color: logColor(l.type) }}>{l.msg}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}