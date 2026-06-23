import { useState, useEffect, useRef } from "react";

interface NetworkEntry {
  name: string;
  type: string;
  duration: number;
  size: number;
  status: string;
  time: string;
}

interface WSEvent {
  type: string;
  data: string;
  time: string;
}

interface ConsoleEntry {
  level: string;
  message: string;
  time: string;
}

interface DiagnosticReport {
  network: NetworkEntry[];
  websockets: WSEvent[];
  errors: ConsoleEntry[];
  memory: { used: number; total: number; limit: number } | null;
  storage: { localStorage: number; sessionStorage: number } | null;
  serviceWorkers: string[];
  timing: {
    pageLoad: number;
    domReady: number;
    firstPaint: number;
  };
  timestamp: string;
}

export default function DiagnosticsDashboard() {
  const [report, setReport] = useState<DiagnosticReport | null>(null);
  const [running, setRunning] = useState(false);
  const [wsLog, setWsLog] = useState<WSEvent[]>([]);
  const [consoleLog, setConsoleLog] = useState<ConsoleEntry[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Intercept console errors
  useEffect(() => {
    const origError = console.error;
    const origWarn = console.warn;

    console.error = (...args) => {
      setConsoleLog(prev => [...prev.slice(-49), {
        level: "error",
        message: args.join(" "),
        time: new Date().toLocaleTimeString()
      }]);
      origError(...args);
    };

    console.warn = (...args) => {
      setConsoleLog(prev => [...prev.slice(-49), {
        level: "warn",
        message: args.join(" "),
        time: new Date().toLocaleTimeString()
      }]);
      origWarn(...args);
    };

    return () => {
      console.error = origError;
      console.warn = origWarn;
    };
  }, []);

  const runDiagnostics = () => {
    setRunning(true);

    // Network requests via Performance API
    const networkEntries: NetworkEntry[] = [];
    const entries = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
    entries.slice(-30).forEach(e => {
      networkEntries.push({
        name: e.name.split("/").pop()?.substring(0, 50) || e.name.substring(0, 50),
        type: e.initiatorType,
        duration: Math.round(e.duration),
        size: Math.round((e.transferSize || 0) / 1024),
        status: e.duration > 0 ? "OK" : "FAILED",
        time: new Date().toLocaleTimeString()
      });
    });

    // Memory
    let memory = null;
    if ((performance as any).memory) {
      const mem = (performance as any).memory;
      memory = {
        used: Math.round(mem.usedJSHeapSize / 1024 / 1024),
        total: Math.round(mem.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(mem.jsHeapSizeLimit / 1024 / 1024)
      };
    }

    // Storage
    let storage = null;
    try {
      let lsSize = 0;
      let ssSize = 0;
      for (let k in localStorage) {
        lsSize += (localStorage.getItem(k) || "").length;
      }
      for (let k in sessionStorage) {
        ssSize += (sessionStorage.getItem(k) || "").length;
      }
      storage = {
        localStorage: Math.round(lsSize / 1024),
        sessionStorage: Math.round(ssSize / 1024)
      };
    } catch {}

    // Service Workers
    const swList: string[] = [];
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then(regs => {
        regs.forEach(r => swList.push(r.scope));
      });
    }

    // Page timing
    const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
    const paintEntries = performance.getEntriesByType("paint");
    const firstPaint = paintEntries.find(p => p.name === "first-paint");

    const timing = {
      pageLoad: nav ? Math.round(nav.loadEventEnd - nav.startTime) : 0,
      domReady: nav ? Math.round(nav.domContentLoadedEventEnd - nav.startTime) : 0,
      firstPaint: firstPaint ? Math.round(firstPaint.startTime) : 0
    };

    // WebSocket detection
    const wsEntries = entries.filter(e => e.name.includes("ws") || e.name.includes("websocket") || e.name.includes("socket"));
    const wsEvents: WSEvent[] = wsEntries.map(e => ({
      type: "connection",
      data: e.name.substring(0, 60),
      time: new Date().toLocaleTimeString()
    }));

    setReport({
      network: networkEntries,
      websockets: [...wsLog, ...wsEvents],
      errors: consoleLog,
      memory,
      storage,
      serviceWorkers: swList,
      timing,
      timestamp: new Date().toLocaleString()
    });

    setRunning(false);
  };

  const startLiveMonitor = () => {
    intervalRef.current = setInterval(runDiagnostics, 5000);
    runDiagnostics();
  };

  const stopLiveMonitor = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
  };

  const exportReport = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clearpath-diagnostics-${Date.now()}.json`;
    a.click();
  };

  const statusColor = (status: string) =>
    status === "OK" ? "#00ff87" : "#FF4500";

  const levelColor = (level: string) =>
    level === "error" ? "#FF4500" : "#FFD700";

  return (
    <div style={{
      background: "#020205",
      color: "#e2e2ec",
      minHeight: "100vh",
      padding: "24px",
      fontFamily: "monospace"
    }}>
      {/* Header */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "24px",
        borderBottom: "1px solid #1a1a2e",
        paddingBottom: "16px"
      }}>
        <div>
          <div style={{ color: "#00D9FF", fontSize: "11px", letterSpacing: "0.3em", marginBottom: "4px" }}>
            CLEARPATH DIAGNOSTICS
          </div>
          <h1 style={{ color: "#fff", fontSize: "20px", fontWeight: 900, margin: 0 }}>
            API + NETWORK MONITOR
          </h1>
          {report && (
            <div style={{ color: "#444", fontSize: "11px", marginTop: "4px" }}>
              Last scan: {report.timestamp}
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={runDiagnostics}
            disabled={running}
            style={{
              background: "rgba(0,217,255,0.1)",
              border: "1px solid rgba(0,217,255,0.4)",
              color: "#00D9FF",
              padding: "8px 16px",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: "12px"
            }}
          >
            {running ? "SCANNING..." : "RUN SCAN"}
          </button>
          <button
            onClick={intervalRef.current ? stopLiveMonitor : startLiveMonitor}
            style={{
              background: intervalRef.current ? "rgba(255,69,0,0.1)" : "rgba(0,255,135,0.1)",
              border: `1px solid ${intervalRef.current ? "rgba(255,69,0,0.4)" : "rgba(0,255,135,0.4)"}`,
              color: intervalRef.current ? "#FF4500" : "#00ff87",
              padding: "8px 16px",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: "12px"
            }}
          >
            {intervalRef.current ? "STOP LIVE" : "LIVE MONITOR"}
          </button>
          {report && (
            <button
              onClick={exportReport}
              style={{
                background: "rgba(168,85,247,0.1)",
                border: "1px solid rgba(168,85,247,0.4)",
                color: "#a855f7",
                padding: "8px 16px",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: "12px"
              }}
            >
              EXPORT JSON
            </button>
          )}
        </div>
      </div>

      {!report && (
        <div style={{ textAlign: "center", padding: "80px 0", color: "#444" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔬</div>
          <div style={{ fontSize: "14px" }}>Click RUN SCAN to analyze your browser environment</div>
          <div style={{ fontSize: "12px", marginTop: "8px", color: "#333" }}>
            Checks network requests, API calls, WebSocket connections, errors, memory, and storage
          </div>
        </div>
      )}

      {report && (
        <div style={{ display: "grid", gap: "16px" }}>

          {/* Timing Row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
            {[
              { label: "Page Load", value: `${report.timing.pageLoad}ms`, good: report.timing.pageLoad < 3000 },
              { label: "DOM Ready", value: `${report.timing.domReady}ms`, good: report.timing.domReady < 2000 },
              { label: "First Paint", value: `${report.timing.firstPaint}ms`, good: report.timing.firstPaint < 1500 },
            ].map(t => (
              <div key={t.label} style={{
                background: "rgba(255,255,255,0.02)",
                border: `1px solid ${t.good ? "rgba(0,255,135,0.2)" : "rgba(255,69,0,0.2)"}`,
                borderRadius: "12px",
                padding: "16px",
                textAlign: "center"
              }}>
                <div style={{ color: t.good ? "#00ff87" : "#FF4500", fontSize: "22px", fontWeight: 900 }}>
                  {t.value}
                </div>
                <div style={{ color: "#555", fontSize: "11px", marginTop: "4px" }}>{t.label}</div>
              </div>
            ))}
          </div>

          {/* Memory + Storage */}
          {(report.memory || report.storage) && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              {report.memory && (
                <div style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "12px",
                  padding: "16px"
                }}>
                  <div style={{ color: "#00D9FF", fontSize: "11px", letterSpacing: "0.2em", marginBottom: "12px" }}>
                    MEMORY USAGE
                  </div>
                  <div style={{ background: "#111", borderRadius: "4px", height: "8px", overflow: "hidden", marginBottom: "8px" }}>
                    <div style={{
                      width: `${(report.memory.used / report.memory.limit) * 100}%`,
                      height: "100%",
                      background: report.memory.used / report.memory.limit > 0.8 ? "#FF4500" : "#00D9FF"
                    }} />
                  </div>
                  <div style={{ color: "#ccc", fontSize: "12px" }}>
                    {report.memory.used}MB used of {report.memory.limit}MB limit
                  </div>
                </div>
              )}
              {report.storage && (
                <div style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "12px",
                  padding: "16px"
                }}>
                  <div style={{ color: "#a855f7", fontSize: "11px", letterSpacing: "0.2em", marginBottom: "12px" }}>
                    STORAGE USAGE
                  </div>
                  <div style={{ color: "#ccc", fontSize: "12px", marginBottom: "8px" }}>
                    LocalStorage: <span style={{ color: "#a855f7" }}>{report.storage.localStorage}KB</span>
                  </div>
                  <div style={{ color: "#ccc", fontSize: "12px" }}>
                    SessionStorage: <span style={{ color: "#a855f7" }}>{report.storage.sessionStorage}KB</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Console Errors */}
          <div style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: "12px",
            padding: "16px"
          }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "12px"
            }}>
              <div style={{ color: "#FF4500", fontSize: "11px", letterSpacing: "0.2em" }}>
                CONSOLE ERRORS & WARNINGS
              </div>
              <div style={{ color: "#444", fontSize: "11px" }}>
                {report.errors.length} entries
              </div>
            </div>
            {report.errors.length === 0 ? (
              <div style={{ color: "#00ff87", fontSize: "12px" }}>✓ No errors detected</div>
            ) : (
              <div style={{ maxHeight: "200px", overflowY: "auto" }}>
                {report.errors.map((e, i) => (
                  <div key={i} style={{
                    padding: "8px",
                    borderBottom: "1px solid #111",
                    fontSize: "11px",
                    display: "flex",
                    gap: "12px"
                  }}>
                    <span style={{ color: levelColor(e.level), minWidth: "45px" }}>
                      [{e.level.toUpperCase()}]
                    </span>
                    <span style={{ color: "#888", minWidth: "70px" }}>{e.time}</span>
                    <span style={{ color: "#ccc", wordBreak: "break-all" }}>{e.message}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Network Requests */}
          <div style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: "12px",
            padding: "16px"
          }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "12px"
            }}>
              <div style={{ color: "#00D9FF", fontSize: "11px", letterSpacing: "0.2em" }}>
                NETWORK REQUESTS (LAST 30)
              </div>
              <div style={{ color: "#444", fontSize: "11px" }}>
                {report.network.length} requests
              </div>
            </div>
            <div style={{ maxHeight: "250px", overflowY: "auto" }}>
              {report.network.length === 0 ? (
                <div style={{ color: "#444", fontSize: "12px" }}>No network entries captured yet</div>
              ) : (
                report.network.map((n, i) => (
                  <div key={i} style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 60px 60px 50px 50px",
                    gap: "8px",
                    padding: "6px 0",
                    borderBottom: "1px solid #0a0a0f",
                    fontSize: "11px",
                    alignItems: "center"
                  }}>
                    <span style={{ color: "#aaa", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {n.name}
                    </span>
                    <span style={{ color: "#666" }}>{n.type}</span>
                    <span style={{ color: "#888" }}>{n.duration}ms</span>
                    <span style={{ color: "#666" }}>{n.size}KB</span>
                    <span style={{ color: statusColor(n.status), fontWeight: 700 }}>{n.status}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* WebSocket Status */}
          <div style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: "12px",
            padding: "16px"
          }}>
            <div style={{ color: "#FFD700", fontSize: "11px", letterSpacing: "0.2em", marginBottom: "12px" }}>
              WEBSOCKET CONNECTIONS
            </div>
            {report.websockets.length === 0 ? (
              <div style={{ color: "#FF4500", fontSize: "12px" }}>
                ⚠ No WebSocket connections detected — this is why your candles aren't moving.
                <div style={{ color: "#666", fontSize: "11px", marginTop: "6px" }}>
                  Twelve Data WebSocket needs to be connected to push live price updates.
                </div>
              </div>
            ) : (
              report.websockets.map((ws, i) => (
                <div key={i} style={{
                  padding: "8px",
                  borderBottom: "1px solid #111",
                  fontSize: "11px",
                  color: "#00ff87"
                }}>
                  ● {ws.data} — {ws.time}
                </div>
              ))
            )}
          </div>

          {/* Service Workers */}
          <div style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: "12px",
            padding: "16px"
          }}>
            <div style={{ color: "#a855f7", fontSize: "11px", letterSpacing: "0.2em", marginBottom: "12px" }}>
              SERVICE WORKERS
            </div>
            {report.serviceWorkers.length === 0 ? (
              <div style={{ color: "#666", fontSize: "12px" }}>No service workers registered</div>
            ) : (
              report.serviceWorkers.map((sw, i) => (
                <div key={i} style={{ color: "#a855f7", fontSize: "12px", padding: "4px 0" }}>
                  ● {sw}
                </div>
              ))
            )}
          </div>

        </div>
      )}
    </div>
  );
}
