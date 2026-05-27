import { useState, useRef, useEffect } from "react";
import "./styles/global.css";
import { io } from "socket.io-client";

import Topbar  from "./layout/Topbar";
import Sidebar from "./layout/Sidebar";
import Toast   from "./components/Toast";

import LoginPage        from "./pages/LoginPage";
import DashboardPage    from "./pages/DashboardPage";
import SensorConfigPage from "./pages/SensorConfigPage";
import RunModePage      from "./pages/RunModePage";
import DownloadPage     from "./pages/DownloadPage";
import BackendPage      from "./pages/BackendPage";

import { SERVER } from "./constants/config";

export default function App() {
  const [user,       setUser]       = useState(null);
  const [page,       setPage]       = useState("dashboard");
  const [toast,      setToast]      = useState(null);
  const [live,       setLive]       = useState(false);
  const [connected,  setConnected]  = useState(false);
  const [rows,       setRows]       = useState([]);
  const [streamRate, setStreamRate] = useState(null);
  const [thicknessState, setThicknessState] = useState(null);
  const [setupReadyBusy, setSetupReadyBusy] = useState(false);

  const socketRef       = useRef(null);
  const counterRef      = useRef(1);
  const dataBufferRef   = useRef([]);
  const lastReadingTime = useRef(null);

  function showToast(msg, type = "success") {
    setToast({ msg, type, key: Date.now() });
  }

  async function loadThicknessState() {
    try {
      const response = await fetch(`${SERVER}/thickness/state`);
      if (!response.ok) return;
      const data = await response.json();
      setThicknessState(data);
    } catch {
      // Keep the UI usable even if the thickness-state endpoint is unavailable.
    }
  }

  async function handleSetupReady() {
    setSetupReadyBusy(true);
    try {
      const response = await fetch(`${SERVER}/thickness/setup-ready`, {
        method: "POST",
      });
      const data = await response.json();

      if (!response.ok) {
        showToast(data?.error || "Unable to capture starting readings", "error");
        return;
      }

      setThicknessState(data);
      const warningText = data.warnings?.length ? ` ${data.warnings.join(" ")}` : "";
      showToast(`${data.message}${warningText}`, data.warnings?.length ? "error" : "success");
    } catch {
      showToast("Unable to capture starting readings", "error");
    } finally {
      setSetupReadyBusy(false);
    }
  }

  function connectSocket() {
    if (socketRef.current) return;
    const socket = io(SERVER, { transports: ["websocket"] });

    socket.on("connect", () => {
      setConnected(true);
      setLive(true);
    });

    socket.on("disconnect", () => {
      setConnected(false);
      setLive(false);
    });

    socket.on("sensor_reading", (data) => {
      const row = {
        id: counterRef.current++,
        ts: data.timestamp
          ? data.timestamp.replace("T", " ").slice(0, 23)
          : new Date().toISOString().replace("T", " ").slice(0, 23),
        a: data.sensor_A ?? null,
        b: data.sensor_B ?? null,
        c: data.sensor_C ?? null,
      };

      dataBufferRef.current = [row, ...dataBufferRef.current].slice(0, 100000);
      setRows(prev => [row, ...prev.slice(0, 99)]);

      // Stream rate detect
      const now = Date.now();
      if (lastReadingTime.current) {
        const diff = now - lastReadingTime.current;
        const hz   = Math.round(1000 / diff);
        if (hz >= 1 && hz <= 20) setStreamRate(String(hz));
      }
      lastReadingTime.current = now;
    });

    socketRef.current = socket;
  }

  function disconnectSocket() {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setConnected(false);
    setLive(false);
  }

  function handleToggle() {
    if (live) disconnectSocket();
    else connectSocket();
  }

  function handleLogin(u) {
    setUser(u);
    setPage("dashboard");
  }

  function handleLogout() {
    disconnectSocket();
    setUser(null);
    setPage("dashboard");
    setRows([]);
    setStreamRate(null);
    setThicknessState(null);
    setSetupReadyBusy(false);
    dataBufferRef.current   = [];
    counterRef.current      = 1;
    lastReadingTime.current = null;
  }

  useEffect(() => {
    if (!user) return;
    loadThicknessState();
  }, [user]);

  useEffect(() => {
    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  if (!user) return <LoginPage onLogin={handleLogin} />;

  return (
    <div className="app-shell">
      <Topbar user={user} page={page} onLogout={handleLogout} />

      <div className="content-area">
        <Sidebar user={user} page={page} onNavigate={setPage} onLogout={handleLogout} />

        <div className="main">
          {page === "dashboard" && (
            <DashboardPage
              user={user}
              onNavigate={setPage}
              rows={rows}
              streamRate={streamRate}
            />
          )}
          {page === "sensor-config" && (
            <SensorConfigPage user={user} onToast={showToast} />
          )}
          {page === "run-mode" && (
            <RunModePage
              user={user}
              rows={rows}
              live={live}
              connected={connected}
              onToggle={handleToggle}
              thicknessState={thicknessState}
              onSetupReady={handleSetupReady}
              setupReadyBusy={setupReadyBusy}
            />
          )}
          {page === "download" && (
            <DownloadPage
              user={user}
              onToast={showToast}
              dataBufferRef={dataBufferRef}
            />
          )}
          {page === "backend" && (
            <BackendPage user={user} />
          )}
        </div>
      </div>

      {toast && (
        <Toast key={toast.key} msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />
      )}
    </div>
  );
}