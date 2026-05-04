"use client";

import { useState, useRef } from "react";

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

const ASPECT_RATIOS = ["1:1", "4:5", "9:16", "16:9"];
const MAX_CHARS = 200;

export default function Home() {
  const [scene, setScene] = useState("");
  const [cameraAngle, setCameraAngle] = useState("Frontal shot");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [error, setError] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const handleGenerate = async () => {
    if (!scene.trim()) return;
    setIsLoading(true);
    setError(null);
    setImageUrl(null);

    try {
      setLoadingStep("Refining your scene...");
      const refineRes = await fetch("/api/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scene }),
      });
      const refineData = await refineRes.json();
      if (!refineRes.ok) throw new Error(refineData.error);

      setLoadingStep("Generating image...");
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
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500&display=swap');
        :root {
          --orange: #FF6B00;
          --black: #0a0a0a;
          --surface: #141414;
          --border: #222;
          --muted: #555;
          --white: #f5f5f5;
        }
        * { box-sizing: border-box; }
        body { background: var(--black); font-family: 'DM Sans', sans-serif; }
        .heading { font-family: 'Bebas Neue', sans-serif; letter-spacing: 0.04em; }
        .btn-primary {
          background: var(--orange); color: #000;
          font-family: 'Bebas Neue', sans-serif; font-size: 1.1rem;
          letter-spacing: 0.08em; padding: 14px 40px;
          border: none; cursor: pointer; transition: background 0.15s, transform 0.1s; width: 100%;
        }
        .btn-primary:hover:not(:disabled) { background: #ff8c00; transform: translateY(-1px); }
        .btn-primary:disabled { background: var(--muted); cursor: not-allowed; }
        .input-field {
          background: var(--surface); border: 1px solid var(--border);
          color: var(--white); font-family: 'DM Sans', sans-serif;
          font-size: 0.9rem; padding: 12px 16px; width: 100%;
          transition: border-color 0.15s; resize: none; outline: none;
        }
        .input-field:focus { border-color: var(--orange); }
        .select-field {
          background: var(--surface); border: 1px solid var(--border);
          color: var(--white); font-family: 'DM Sans', sans-serif;
          font-size: 0.85rem; padding: 10px 12px; width: 100%;
          outline: none; cursor: pointer; appearance: none; transition: border-color 0.15s;
        }
        .select-field:focus { border-color: var(--orange); }
        .ratio-btn {
          background: var(--surface); border: 1px solid var(--border);
          color: var(--muted); font-family: 'Bebas Neue', sans-serif;
          font-size: 1rem; letter-spacing: 0.06em; padding: 8px 0;
          cursor: pointer; transition: all 0.15s; flex: 1;
        }
        .ratio-btn.active { border-color: var(--orange); color: var(--orange); }
        .ratio-btn:hover:not(.active) { border-color: #444; color: var(--white); }
        .label {
          font-size: 0.7rem; letter-spacing: 0.12em; text-transform: uppercase;
          color: var(--muted); margin-bottom: 8px; display: block;
        }
        .loader-bar { height: 2px; background: var(--border); overflow: hidden; margin-top: 16px; }
        .loader-bar-inner { height: 100%; background: var(--orange); animation: loading 1.5s ease-in-out infinite; }
        @keyframes loading {
          0% { width: 0%; margin-left: 0%; }
          50% { width: 70%; margin-left: 15%; }
          100% { width: 0%; margin-left: 100%; }
        }
        .image-output {
          background: var(--surface); border: 1px solid var(--border);
          display: flex; align-items: center; justify-content: center;
          overflow: hidden; min-height: 380px; position: relative;
        }
        .image-output img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .stripe-pattern {
          position: absolute; inset: 0;
          background-image: repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,107,0,0.03) 10px, rgba(255,107,0,0.03) 20px);
        }
        .download-btn {
          background: transparent; border: 1px solid var(--orange);
          color: var(--orange); font-family: 'Bebas Neue', sans-serif;
          font-size: 0.9rem; letter-spacing: 0.1em; padding: 10px 24px;
          cursor: pointer; transition: all 0.15s;
        }
        .download-btn:hover { background: var(--orange); color: #000; }
        .char-count { font-size: 0.7rem; color: var(--muted); text-align: right; margin-top: 4px; }
        .char-count.near-limit { color: var(--orange); }
        .select-wrapper { position: relative; }
        .select-wrapper::after {
          content: '▾'; position: absolute; right: 12px; top: 50%;
          transform: translateY(-50%); color: var(--muted); pointer-events: none; font-size: 0.8rem;
        }
      `}</style>

      <header style={{ borderBottom: '1px solid #1a1a1a', padding: '24px 40px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ width: 8, height: 32, background: 'var(--orange)' }} />
        <h1 className="heading" style={{ fontSize: '2rem', margin: 0 }}>TONI GENERATOR</h1>
        <span style={{ marginLeft: 'auto', fontSize: '0.7rem', letterSpacing: '0.15em', color: 'var(--muted)', textTransform: 'uppercase' }}>Powered by AI</span>
      </header>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px' }}>

        {/* LEFT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          <div>
            <span className="label">Scene description</span>
            <textarea
              className="input-field"
              rows={5}
              maxLength={MAX_CHARS}
              placeholder="Toni playing basketball at sunset, crowd cheering..."
              value={scene}
              onChange={(e) => setScene(e.target.value)}
            />
            <p className={`char-count ${scene.length > MAX_CHARS * 0.85 ? 'near-limit' : ''}`}>
              {scene.length} / {MAX_CHARS}
            </p>
          </div>

          <div>
            <span className="label">Camera angle</span>
            <div className="select-wrapper">
              <select className="select-field" value={cameraAngle} onChange={(e) => setCameraAngle(e.target.value)}>
                {CAMERA_ANGLES.map((angle) => (
                  <option key={angle} value={angle}>{angle}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <span className="label">Format</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              {ASPECT_RATIOS.map((ratio) => (
                <button
                  key={ratio}
                  className={`ratio-btn ${aspectRatio === ratio ? 'active' : ''}`}
                  onClick={() => setAspectRatio(ratio)}
                >
                  {ratio}
                </button>
              ))}
            </div>
          </div>

          <div>
            <button className="btn-primary" onClick={handleGenerate} disabled={isLoading || !scene.trim()}>
              {isLoading ? loadingStep.toUpperCase() : "GENERATE"}
            </button>
            {isLoading && <div className="loader-bar"><div className="loader-bar-inner" /></div>}
            {error && <p style={{ color: '#ff4444', fontSize: '0.8rem', marginTop: 8 }}>{error}</p>}
          </div>

          <p style={{ fontSize: '0.75rem', color: '#2a2a2a', lineHeight: 1.6 }}>
            Your description is refined automatically before generation. Character attributes, style rules, and consistency parameters are applied behind the scenes.
          </p>
        </div>

        {/* RIGHT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <span className="label">Output</span>
          <div className="image-output">
            {!imageUrl && !isLoading && (
              <>
                <div className="stripe-pattern" />
                <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
                  <div className="heading" style={{ fontSize: '5rem', color: '#161616' }}>TONI</div>
                  <p style={{ color: '#2a2a2a', fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Your image will appear here</p>
                </div>
              </>
            )}
            {isLoading && (
              <div style={{ textAlign: 'center' }}>
                <div className="heading" style={{ fontSize: '1.4rem', color: 'var(--orange)', marginBottom: 8 }}>{loadingStep}</div>
                <p style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>This takes about 30–60 seconds</p>
              </div>
            )}
            {imageUrl && <img ref={imgRef} src={imageUrl} alt="Generated Toni" />}
          </div>

          {imageUrl && (
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="download-btn" onClick={handleDownload}>↓ Download</button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
