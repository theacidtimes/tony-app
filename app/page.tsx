"use client";

import { useState } from "react";

const CAMERA_ANGLES = [
  "Frontal shot",
  "Profile shot",
  "3/4 shot",
  "High angle shot",
  "Low angle shot",
  "Extreme low angle shot",
  "Extreme high angle shot",
  "Over the shoulder shot",
  "First Person View",
];

const ASPECT_RATIOS = [
  { label: "1:1", value: "1:1" },
  { label: "4:5", value: "4:5" },
  { label: "9:16", value: "9:16" },
  { label: "16:9", value: "16:9" },
];

const MAX_CHARS = 200;

export default function Home() {
  const [scene, setScene] = useState("");
  const [cameraAngle, setCameraAngle] = useState("Frontal shot");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!scene.trim()) return;
    setIsLoading(true);
    setError(null);
    setImageUrl(null);

    try {
      setLoadingStep("Refining scene...");
      const refineRes = await fetch("/api/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scene }),
      });
      const refineData = await refineRes.json();
      if (!refineRes.ok) throw new Error(refineData.error);

      setLoadingStep("Generating...");
      const generateRes = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          refinedPrompt: refineData.refinedPrompt,
          cameraAngle,
          aspectRatio,
        }),
      });
      const generateData = await generateRes.json();
      if (!generateRes.ok) throw new Error(generateData.error);

      setImageUrl(generateData.imageUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
      setLoadingStep("");
    }
  };

  const handleDownload = async () => {
    if (!imageUrl) return;
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `toni-${Date.now()}.png`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@300;400;500&family=Syne+Mono&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg: #0c0c0c;
          --surface: #111111;
          --surface-2: #161616;
          --border: rgba(255,255,255,0.06);
          --border-hover: rgba(255,255,255,0.12);
          --text: #e8e8e8;
          --text-dim: rgba(232,232,232,0.35);
          --text-dimmer: rgba(232,232,232,0.15);
          --accent: #FF6B00;
          --accent-dim: rgba(255,107,0,0.12);
          --green: #2DCA72;
          --green-dim: rgba(45,202,114,0.1);
          --mono: 'Syne Mono', monospace;
          --sans: 'Syne', sans-serif;
        }

        html, body {
          background: var(--bg);
          color: var(--text);
          font-family: var(--sans);
          font-weight: 300;
          -webkit-font-smoothing: antialiased;
          min-height: 100vh;
        }

        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 28px 48px;
          border-bottom: 1px solid var(--border);
        }

        .logo { display: flex; align-items: baseline; gap: 10px; }

        .logo-name {
          font-family: var(--sans);
          font-weight: 400;
          font-size: 13px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--text);
        }

        .logo-sep {
          width: 1px; height: 12px;
          background: var(--border-hover);
          display: inline-block;
          vertical-align: middle;
        }

        .logo-sub {
          font-family: var(--mono);
          font-size: 10px;
          color: var(--text-dim);
          letter-spacing: 0.1em;
        }

        .header-right { display: flex; align-items: center; gap: 6px; }

        .status-dot {
          width: 5px; height: 5px;
          border-radius: 50%;
          background: var(--green);
          animation: blink 2.5s ease-in-out infinite;
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.25; }
        }

        .status-label {
          font-family: var(--mono);
          font-size: 10px;
          color: var(--text-dim);
          letter-spacing: 0.08em;
        }

        .layout {
          display: grid;
          grid-template-columns: 380px 1fr;
          min-height: calc(100vh - 73px);
        }

        .panel-left {
          border-right: 1px solid var(--border);
          padding: 40px 40px;
          display: flex;
          flex-direction: column;
          gap: 36px;
        }

        .trigger-block { display: flex; flex-direction: column; gap: 14px; }

        .field-label {
          font-family: var(--mono);
          font-size: 9px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--text-dimmer);
        }

        .trigger-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: var(--green-dim);
          border: 1px solid rgba(45,202,114,0.2);
          border-radius: 2px;
          padding: 5px 12px;
          width: fit-content;
        }

        .trigger-dot {
          width: 5px; height: 5px;
          border-radius: 50%;
          background: var(--green);
        }

        .trigger-word {
          font-family: var(--mono);
          font-size: 11px;
          color: var(--green);
          letter-spacing: 0.12em;
        }

        .trigger-hint {
          font-size: 11px;
          color: var(--text-dim);
          line-height: 1.7;
          font-weight: 300;
        }

        .trigger-hint em {
          font-style: normal;
          color: var(--green);
          font-family: var(--mono);
        }

        .divider { height: 1px; background: var(--border); }

        .field-block { display: flex; flex-direction: column; gap: 10px; }

        .field-header { display: flex; justify-content: space-between; align-items: center; }

        .char-counter {
          font-family: var(--mono);
          font-size: 9px;
          color: var(--text-dimmer);
          letter-spacing: 0.05em;
        }

        .char-counter.warn { color: var(--accent); }

        textarea {
          background: var(--surface);
          border: 1px solid var(--border);
          color: var(--text);
          font-family: var(--sans);
          font-size: 13px;
          font-weight: 300;
          line-height: 1.7;
          padding: 14px 16px;
          width: 100%;
          resize: none;
          outline: none;
          border-radius: 2px;
          transition: border-color 0.2s;
        }

        textarea::placeholder { color: var(--text-dimmer); }
        textarea:focus { border-color: var(--border-hover); }

        .select-wrap { position: relative; }

        select {
          background: var(--surface);
          border: 1px solid var(--border);
          color: var(--text);
          font-family: var(--sans);
          font-size: 12px;
          font-weight: 300;
          padding: 11px 36px 11px 14px;
          width: 100%;
          outline: none;
          cursor: pointer;
          appearance: none;
          border-radius: 2px;
          transition: border-color 0.2s;
        }

        select:focus { border-color: var(--border-hover); }

        .select-arrow {
          position: absolute;
          right: 13px; top: 50%;
          transform: translateY(-50%);
          color: var(--text-dimmer);
          pointer-events: none;
          font-size: 9px;
        }

        .ratio-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 6px;
        }

        .ratio-btn {
          background: var(--surface);
          border: 1px solid var(--border);
          color: var(--text-dim);
          font-family: var(--mono);
          font-size: 10px;
          letter-spacing: 0.08em;
          padding: 9px 0;
          cursor: pointer;
          border-radius: 2px;
          transition: all 0.15s;
          text-align: center;
        }

        .ratio-btn:hover { border-color: var(--border-hover); color: var(--text); }

        .ratio-btn.active {
          border-color: rgba(255,107,0,0.4);
          color: var(--accent);
          background: var(--accent-dim);
        }

        .generate-btn {
          background: var(--accent);
          border: none;
          color: #000;
          font-family: var(--sans);
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          padding: 14px;
          width: 100%;
          cursor: pointer;
          border-radius: 2px;
          transition: opacity 0.15s, transform 0.1s;
        }

        .generate-btn:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
        .generate-btn:disabled { background: var(--surface-2); color: var(--text-dimmer); cursor: not-allowed; transform: none; }

        .progress-wrap { height: 1px; background: var(--border); overflow: hidden; border-radius: 1px; }

        .progress-bar {
          height: 100%;
          background: var(--accent);
          animation: progress 1.8s ease-in-out infinite;
        }

        @keyframes progress {
          0% { width: 0%; margin-left: 0%; }
          50% { width: 60%; margin-left: 20%; }
          100% { width: 0%; margin-left: 100%; }
        }

        .loading-label { font-family: var(--mono); font-size: 10px; color: var(--text-dim); letter-spacing: 0.1em; }
        .error-msg { font-family: var(--mono); font-size: 10px; color: #ff5555; letter-spacing: 0.06em; }

        .panel-right { display: flex; flex-direction: column; }

        .output-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 40px;
          border-bottom: 1px solid var(--border);
        }

        .output-label {
          font-family: var(--mono);
          font-size: 9px;
          color: var(--text-dimmer);
          letter-spacing: 0.2em;
          text-transform: uppercase;
        }

        .download-btn {
          background: transparent;
          border: 1px solid var(--border);
          color: var(--text-dim);
          font-family: var(--mono);
          font-size: 10px;
          letter-spacing: 0.1em;
          padding: 7px 16px;
          cursor: pointer;
          border-radius: 2px;
          transition: all 0.15s;
        }

        .download-btn:hover { border-color: var(--border-hover); color: var(--text); }

        .output-canvas {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
        }

        .output-canvas::before {
          content: '';
          position: absolute; inset: 0;
          background-image:
            linear-gradient(var(--border) 1px, transparent 1px),
            linear-gradient(90deg, var(--border) 1px, transparent 1px);
          background-size: 40px 40px;
          opacity: 0.4;
        }

        .output-empty {
          position: relative; z-index: 1;
          text-align: center;
          display: flex; flex-direction: column;
          align-items: center; gap: 16px;
        }

        .output-empty-title {
          font-family: var(--sans);
          font-weight: 300;
          font-size: 11px;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: var(--text-dimmer);
        }

        .output-crosshair { width: 32px; height: 32px; position: relative; opacity: 0.15; }

        .output-crosshair::before,
        .output-crosshair::after { content: ''; position: absolute; background: var(--text); }

        .output-crosshair::before { width: 1px; height: 100%; left: 50%; top: 0; }
        .output-crosshair::after { height: 1px; width: 100%; top: 50%; left: 0; }

        .output-loading {
          position: relative; z-index: 1;
          text-align: center;
          display: flex; flex-direction: column;
          align-items: center; gap: 20px;
        }

        .loading-ring {
          width: 32px; height: 32px;
          border: 1px solid var(--border);
          border-top-color: var(--accent);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        .loading-text { font-family: var(--mono); font-size: 10px; color: var(--text-dim); letter-spacing: 0.12em; }
        .loading-sub { font-family: var(--mono); font-size: 9px; color: var(--text-dimmer); letter-spacing: 0.08em; margin-top: -12px; }

        .output-image {
          position: relative; z-index: 1;
          max-width: 100%;
          max-height: calc(100vh - 140px);
          display: block;
          object-fit: contain;
        }

        .panel-footer {
          font-family: var(--mono);
          font-size: 9px;
          color: var(--text-dimmer);
          line-height: 1.8;
          padding-top: 4px;
          letter-spacing: 0.06em;
        }
      `}</style>

      <header className="header">
        <div className="logo">
          <span className="logo-name">Toni</span>
          <span className="logo-sep" />
          <span className="logo-sub">character studio</span>
        </div>
        <div className="header-right">
          <span className="status-dot" />
          <span className="status-label">model active</span>
        </div>
      </header>

      <div className="layout">
        <aside className="panel-left">

          <div className="trigger-block">
            <span className="field-label">Character</span>
            <div className="trigger-pill">
              <span className="trigger-dot" />
              <span className="trigger-word">toni</span>
            </div>
            <p className="trigger-hint">
              Use <em>toni</em> in your scene to place the character.
              Ex: <em>toni</em> surfando uma onda gigante ao amanhecer.
            </p>
          </div>

          <div className="divider" />

          <div className="field-block">
            <div className="field-header">
              <span className="field-label">Scene</span>
              <span className={`char-counter ${scene.length > MAX_CHARS * 0.85 ? "warn" : ""}`}>
                {scene.length}/{MAX_CHARS}
              </span>
            </div>
            <textarea
              rows={5}
              maxLength={MAX_CHARS}
              placeholder="toni jogando basquete ao pôr do sol..."
              value={scene}
              onChange={(e) => setScene(e.target.value)}
            />
          </div>

          <div className="field-block">
            <span className="field-label">Camera</span>
            <div className="select-wrap">
              <select value={cameraAngle} onChange={(e) => setCameraAngle(e.target.value)}>
                {CAMERA_ANGLES.map((a) => <option key={a}>{a}</option>)}
              </select>
              <span className="select-arrow">▾</span>
            </div>
          </div>

          <div className="field-block">
            <span className="field-label">Format</span>
            <div className="ratio-grid">
              {ASPECT_RATIOS.map((r) => (
                <button
                  key={r.value}
                  className={`ratio-btn ${aspectRatio === r.value ? "active" : ""}`}
                  onClick={() => setAspectRatio(r.value)}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div className="field-block">
            <button
              className="generate-btn"
              onClick={handleGenerate}
              disabled={isLoading || !scene.trim()}
            >
              {isLoading ? loadingStep : "Generate"}
            </button>

            {isLoading && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
                <div className="progress-wrap">
                  <div className="progress-bar" />
                </div>
                <span className="loading-label">30–60s</span>
              </div>
            )}

            {error && <p className="error-msg" style={{ marginTop: 8 }}>{error}</p>}
          </div>

          <p className="panel-footer">
            Scene descriptions are refined automatically.<br />
            Character rules applied behind the scenes.
          </p>
        </aside>

        <section className="panel-right">
          <div className="output-header">
            <span className="output-label">Output</span>
            {imageUrl && (
              <button className="download-btn" onClick={handleDownload}>
                ↓ download
              </button>
            )}
          </div>

          <div className="output-canvas">
            {!imageUrl && !isLoading && (
              <div className="output-empty">
                <div className="output-crosshair" />
                <span className="output-empty-title">Awaiting scene</span>
              </div>
            )}

            {isLoading && (
              <div className="output-loading">
                <div className="loading-ring" />
                <span className="loading-text">{loadingStep}</span>
                <span className="loading-sub">this takes about 30–60 seconds</span>
              </div>
            )}

            {imageUrl && (
              <img className="output-image" src={imageUrl} alt="Generated Toni" />
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
