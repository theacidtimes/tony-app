"use client";

import { useState, useRef, useEffect } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { getPlanColor } from "@/lib/plans";

const CAMERA_ANGLES = [
  "Frontal shot", "Profile shot", "3/4 shot", "High angle shot",
  "Low angle shot", "Extreme low angle shot", "Extreme high angle shot",
  "Over the shoulder shot", "First Person View",
];

const ASPECT_RATIOS = [
  { label: "1:1", value: "1:1" },
  { label: "4:5", value: "4:5" },
  { label: "9:16", value: "9:16" },
  { label: "16:9", value: "16:9" },
];

const MODELS = [
  { label: "Fast", value: "flux1" },
  { label: "Quality", value: "flux2" },
];

const MAX_CHARS = 200;
const TRIGGER_REGEX = /\b(toni|tony)\b/gi;

interface Generation {
  id: string;
  url: string;
  scene: string;
  aspectRatio: string;
  model: string;
}

interface UsageData {
  name: string;
  plan: string;
  used: number;
  limit: number;
  remaining: number;
  percentage: number;
}

export default function Home() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();

  const [scene, setScene] = useState("");
  const [cameraAngle, setCameraAngle] = useState("Frontal shot");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [model, setModel] = useState("flux2");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [selected, setSelected] = useState<Generation | null>(null);
  const [isRefining, setIsRefining] = useState(false);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const hasTrigger = TRIGGER_REGEX.test(scene);
  TRIGGER_REGEX.lastIndex = 0;

  // Fetch usage + past generations on mount
  useEffect(() => {
    if (!isLoaded || !user) return;

    fetch("/api/usage")
      .then(r => r.json())
      .then(setUsage)
      .catch(console.error);

    fetch("/api/generations")
      .then(r => r.json())
      .then((data: Array<{ id: string; image_url: string; scene: string; model: string }>) => {
        if (!Array.isArray(data)) return;
        const loaded: Generation[] = data.map(g => ({
          id: g.id,
          url: g.image_url,
          scene: g.scene?.slice(0, 60) + (g.scene?.length > 60 ? "..." : ""),
          aspectRatio: "1:1",
          model: g.model || "flux1",
        }));
        setGenerations(loaded);
        if (loaded.length > 0) setSelected(loaded[0]);
      })
      .catch(console.error);
  }, [isLoaded, user]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const syncScroll = () => {
    if (textareaRef.current && backdropRef.current) {
      backdropRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const getHighlightedHTML = (text: string) =>
    text.replace(/\b(toni|tony)\b/gi, '<mark class="toni-mark">$1</mark>') + " ";

  const handleGenerate = async () => {
    if (!scene.trim()) return;
    if (usage && usage.remaining <= 0) {
      setError("Monthly limit reached. Please contact your administrator.");
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      setLoadingStep("Refining scene...");
      const refineRes = await fetch("/api/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scene, cameraAngle }),
      });
      const refineData = await refineRes.json();
      if (!refineRes.ok) throw new Error(refineData.error);

      setLoadingStep("Generating...");
      const generateRes = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refinedPrompt: refineData.refinedPrompt, aspectRatio, model, scene }),
      });
      const generateData = await generateRes.json();
      if (!generateRes.ok) throw new Error(generateData.error);

      const newGen: Generation = {
        id: Date.now().toString(),
        url: generateData.imageUrl,
        scene: scene.slice(0, 60) + (scene.length > 60 ? "..." : ""),
        aspectRatio,
        model,
      };

      setGenerations(prev => [newGen, ...prev]);
      setSelected(newGen);

      if (usage) {
        setUsage(prev => prev ? { ...prev, used: prev.used + 1, remaining: prev.remaining - 1, percentage: Math.min(100, Math.round(((prev.used + 1) / prev.limit) * 100)) } : prev);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
      setLoadingStep("");
    }
  };

  const handleRefine = async (url: string) => {
    setIsRefining(true);
    try {
      const res = await fetch("/api/refine-character", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const refined: Generation = {
        id: Date.now().toString(),
        url: data.imageUrl,
        scene: (selected?.scene || "") + " ✦refined",
        aspectRatio: selected?.aspectRatio || aspectRatio,
        model: "nano",
      };
      setGenerations(prev => [refined, ...prev]);
      setSelected(refined);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Refine failed");
    } finally {
      setIsRefining(false);
    }
  };

  const handleDownload = async (url: string) => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed");
      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("image")) throw new Error("Not an image");
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = `toni-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(objectUrl);
    } catch {
      window.open(url, "_blank");
    }
  };

  const handleDelete = (id: string) => {
    setGenerations(prev => prev.filter(g => g.id !== id));
    if (selected?.id === id) setSelected(null);
  };

  const activeImage = selected?.url || null;
  const usageColor = usage ? getPlanColor(usage.used, usage.limit) : "#2DCA72";
  const firstName = user?.firstName || user?.fullName?.split(" ")[0] || user?.emailAddresses?.[0]?.emailAddress?.split("@")[0] || "User";

  if (!isLoaded) return null;

  return (
    <main>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@300;400;500&family=Syne+Mono&family=Libre+Caslon+Text:ital,wght@0,400;1,400&family=IBM+Plex+Sans:wght@300;400&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg: #141414; --surface: #1c1c1c; --surface-2: #222222; --surface-3: #282828;
          --border: rgba(255,255,255,0.09); --border-hover: rgba(255,255,255,0.18);
          --text: #ebebeb; --text-dim: rgba(235,235,235,0.45); --text-dimmer: rgba(235,235,235,0.22);
          --accent: #FF6B00; --accent-dim: rgba(255,107,0,0.12);
          --green: #2DCA72; --green-dim: rgba(45,202,114,0.1); --green-border: rgba(45,202,114,0.3);
          --mono: 'Syne Mono', monospace; --sans: 'Syne', sans-serif;
        }
        html, body { background: var(--bg); color: var(--text); font-family: var(--sans); font-weight: 300; -webkit-font-smoothing: antialiased; min-height: 100vh; }
        .header { display: flex; align-items: center; justify-content: space-between; padding: 18px 40px; border-bottom: 1px solid var(--border); gap: 24px; }
        .acid-logo { display: flex; align-items: baseline; flex-shrink: 0; }
        .acid-letters { font-family: 'Libre Caslon Text', serif; font-weight: 400; font-size: 20px; letter-spacing: 0.02em; }
        .acid-tm { font-family: 'IBM Plex Sans', sans-serif; font-size: 8px; font-weight: 300; vertical-align: super; color: var(--text-dim); margin-left: 1px; }
        .acid-sub { font-family: 'IBM Plex Sans', sans-serif; font-weight: 300; font-size: 10px; letter-spacing: 0.12em; color: var(--text-dim); text-transform: uppercase; margin-left: 12px; align-self: center; }
        .header-usage { display: flex; align-items: center; gap: 12px; flex: 1; max-width: 360px; margin: 0 auto; }
        .usage-label { font-family: var(--mono); font-size: 9px; color: var(--text-dimmer); letter-spacing: 0.1em; white-space: nowrap; }
        .usage-bar-wrap { flex: 1; height: 3px; background: rgba(255,255,255,0.08); border-radius: 2px; overflow: hidden; }
        .usage-bar-fill { height: 100%; border-radius: 2px; transition: width 0.5s ease; }
        .usage-count { font-family: var(--mono); font-size: 9px; color: var(--text-dim); white-space: nowrap; letter-spacing: 0.06em; }
        .header-right { display: flex; align-items: center; gap: 8px; position: relative; }
        .status-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--green); animation: blink 2.5s ease-in-out infinite; flex-shrink: 0; }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.25; } }
        .user-btn { display: flex; align-items: center; gap: 8px; background: transparent; border: 1px solid var(--border); color: var(--text-dim); font-family: var(--mono); font-size: 10px; letter-spacing: 0.08em; padding: 6px 12px; cursor: pointer; border-radius: 2px; transition: all 0.15s; }
        .user-btn:hover { border-color: var(--border-hover); color: var(--text); }
        .user-btn svg { opacity: 0.4; }
        .dropdown-menu { position: absolute; top: calc(100% + 8px); right: 0; background: var(--surface); border: 1px solid var(--border); border-radius: 2px; min-width: 180px; z-index: 100; overflow: hidden; }
        .dropdown-header { padding: 12px 14px; border-bottom: 1px solid var(--border); }
        .dropdown-name { font-family: var(--sans); font-size: 12px; color: var(--text); }
        .dropdown-plan { font-family: var(--mono); font-size: 9px; color: var(--text-dimmer); letter-spacing: 0.1em; text-transform: uppercase; margin-top: 2px; }
        .dropdown-item { display: block; width: 100%; text-align: left; background: transparent; border: none; padding: 10px 14px; font-family: var(--mono); font-size: 10px; color: var(--text-dim); letter-spacing: 0.08em; cursor: pointer; transition: background 0.15s, color 0.15s; text-decoration: none; }
        .dropdown-item:hover { background: var(--surface-2); color: var(--text); }
        .dropdown-item.danger:hover { color: #ff6b6b; }
        .layout { display: grid; grid-template-columns: 360px 1fr; min-height: calc(100vh - 65px); }
        .panel-left { border-right: 1px solid var(--border); padding: 28px; display: flex; flex-direction: column; gap: 24px; overflow-y: auto; }
        .field-label { font-family: var(--mono); font-size: 9px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--text-dimmer); }
        .field-block { display: flex; flex-direction: column; gap: 9px; }
        .field-header { display: flex; justify-content: space-between; align-items: center; }
        .divider { height: 1px; background: var(--border); }
        .trigger-status { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border: 1px solid var(--border); border-radius: 2px; transition: border-color 0.3s, background 0.3s; background: var(--surface); }
        .trigger-status.connected { border-color: var(--green-border); background: var(--green-dim); }
        .trigger-indicator { width: 5px; height: 5px; border-radius: 50%; background: var(--text-dimmer); transition: background 0.3s; flex-shrink: 0; }
        .trigger-status.connected .trigger-indicator { background: var(--green); box-shadow: 0 0 6px rgba(45,202,114,0.5); }
        .trigger-text { font-family: var(--mono); font-size: 10px; color: var(--text-dimmer); letter-spacing: 0.08em; transition: color 0.3s; }
        .trigger-status.connected .trigger-text { color: var(--green); }
        .trigger-tag { margin-left: auto; font-family: var(--mono); font-size: 9px; color: var(--text-dimmer); letter-spacing: 0.06em; transition: color 0.3s; }
        .trigger-status.connected .trigger-tag { color: rgba(45,202,114,0.7); }
        .scene-wrap { position: relative; border: 1px solid var(--border); border-radius: 2px; transition: border-color 0.2s; background: var(--surface); }
        .scene-wrap:focus-within { border-color: var(--border-hover); }
        .scene-wrap.has-trigger { border-color: var(--green-border); }
        .scene-backdrop { position: absolute; inset: 0; padding: 12px 14px; font-family: var(--sans); font-size: 13px; font-weight: 300; line-height: 1.7; color: transparent; white-space: pre-wrap; word-wrap: break-word; overflow: hidden; pointer-events: none; border-radius: 2px; }
        .toni-mark { background: transparent; color: transparent; border-radius: 3px; outline: 1.5px solid var(--green); box-shadow: 0 0 8px rgba(45,202,114,0.15); padding: 0 1px; }
        .scene-textarea { position: relative; z-index: 1; background: transparent; border: none; color: var(--text); font-family: var(--sans); font-size: 13px; font-weight: 300; line-height: 1.7; padding: 12px 14px; width: 100%; resize: none; outline: none; caret-color: var(--accent); }
        .scene-textarea::placeholder { color: var(--text-dimmer); }
        .char-counter { font-family: var(--mono); font-size: 9px; color: var(--text-dimmer); }
        .char-counter.warn { color: var(--accent); }
        .hint-text { font-size: 11px; color: var(--text-dimmer); line-height: 1.6; }
        .hint-text em { font-style: normal; color: rgba(45,202,114,0.7); font-family: var(--mono); }
        .select-wrap { position: relative; }
        select { background: var(--surface); border: 1px solid var(--border); color: var(--text); font-family: var(--sans); font-size: 12px; font-weight: 300; padding: 10px 36px 10px 14px; width: 100%; outline: none; cursor: pointer; appearance: none; border-radius: 2px; transition: border-color 0.2s; }
        select:focus { border-color: var(--border-hover); }
        .select-arrow { position: absolute; right: 13px; top: 50%; transform: translateY(-50%); color: var(--text-dimmer); pointer-events: none; font-size: 9px; }
        .model-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
        .model-btn { background: var(--surface); border: 1px solid var(--border); color: var(--text-dim); font-family: var(--mono); font-size: 10px; letter-spacing: 0.06em; padding: 10px 0; cursor: pointer; border-radius: 2px; transition: all 0.15s; text-align: center; line-height: 1.4; }
        .model-btn:hover { border-color: var(--border-hover); color: var(--text); }
        .model-btn.active { border-color: rgba(255,107,0,0.45); color: var(--accent); background: var(--accent-dim); }
        .ratio-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
        .ratio-btn { background: var(--surface); border: 1px solid var(--border); color: var(--text-dim); font-family: var(--mono); font-size: 10px; letter-spacing: 0.08em; padding: 9px 0; cursor: pointer; border-radius: 2px; transition: all 0.15s; text-align: center; }
        .ratio-btn:hover { border-color: var(--border-hover); color: var(--text); }
        .ratio-btn.active { border-color: rgba(255,107,0,0.45); color: var(--accent); background: var(--accent-dim); }
        .generate-btn { background: var(--accent); border: none; color: #000; font-family: var(--sans); font-size: 12px; font-weight: 500; letter-spacing: 0.15em; text-transform: uppercase; padding: 13px; width: 100%; cursor: pointer; border-radius: 2px; transition: opacity 0.15s, transform 0.1s; }
        .generate-btn:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
        .generate-btn:disabled { background: var(--surface-3); color: var(--text-dimmer); cursor: not-allowed; transform: none; }
        .progress-wrap { height: 1px; background: var(--border); overflow: hidden; }
        .progress-bar { height: 100%; background: var(--accent); animation: progress 1.8s ease-in-out infinite; }
        @keyframes progress { 0% { width: 0%; margin-left: 0%; } 50% { width: 60%; margin-left: 20%; } 100% { width: 0%; margin-left: 100%; } }
        .loading-label { font-family: var(--mono); font-size: 10px; color: var(--text-dim); letter-spacing: 0.1em; }
        .error-msg { font-family: var(--mono); font-size: 10px; color: #ff6b6b; }
        .panel-footer { font-family: var(--mono); font-size: 9px; color: var(--text-dimmer); line-height: 1.8; letter-spacing: 0.06em; }
        .panel-right { display: flex; flex-direction: column; }
        .output-header { display: flex; align-items: center; justify-content: space-between; padding: 13px 36px; border-bottom: 1px solid var(--border); }
        .output-label { font-family: var(--mono); font-size: 9px; color: var(--text-dimmer); letter-spacing: 0.2em; text-transform: uppercase; }
        .output-actions { display: flex; align-items: center; gap: 8px; }
        .icon-btn { background: transparent; border: 1px solid var(--border); color: var(--text-dim); font-family: var(--mono); font-size: 10px; letter-spacing: 0.08em; padding: 6px 14px; cursor: pointer; border-radius: 2px; transition: all 0.15s; }
        .icon-btn:hover { border-color: var(--border-hover); color: var(--text); }
        .icon-btn.danger:hover { border-color: rgba(255,107,107,0.4); color: #ff6b6b; }
        .refine-btn { border-color: rgba(235,235,235,0.15); color: rgba(235,235,235,0.5); }
        .refine-btn:hover:not(:disabled) { border-color: rgba(235,235,235,0.35) !important; color: var(--text) !important; }
        .refine-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .refine-overlay { position: absolute; inset: 0; z-index: 2; background: rgba(20,20,20,0.75); backdrop-filter: blur(4px); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 18px; }
        .output-canvas { flex: 1; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; min-height: 400px; }
        .output-canvas::before { content: ''; position: absolute; inset: 0; background-image: linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px); background-size: 40px 40px; opacity: 0.5; }
        .output-empty { position: relative; z-index: 1; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 14px; }
        .output-crosshair { width: 28px; height: 28px; position: relative; opacity: 0.15; }
        .output-crosshair::before, .output-crosshair::after { content: ''; position: absolute; background: var(--text); }
        .output-crosshair::before { width: 1px; height: 100%; left: 50%; top: 0; }
        .output-crosshair::after { height: 1px; width: 100%; top: 50%; left: 0; }
        .output-empty-title { font-family: var(--sans); font-weight: 300; font-size: 10px; letter-spacing: 0.25em; text-transform: uppercase; color: var(--text-dimmer); }
        .output-loading { position: relative; z-index: 1; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 18px; }
        .loading-ring { width: 28px; height: 28px; border: 1px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .loading-text { font-family: var(--mono); font-size: 10px; color: var(--text-dim); letter-spacing: 0.12em; }
        .loading-sub { font-family: var(--mono); font-size: 9px; color: var(--text-dimmer); margin-top: -10px; }
        .output-image { position: relative; z-index: 1; max-width: 100%; max-height: 500px; display: block; object-fit: contain; }
        .gallery-section { border-top: 1px solid var(--border); padding: 14px 36px 18px; }
        .gallery-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
        .gallery-label { font-family: var(--mono); font-size: 9px; color: var(--text-dimmer); letter-spacing: 0.2em; text-transform: uppercase; }
        .gallery-count { font-family: var(--mono); font-size: 9px; color: var(--text-dimmer); }
        .gallery-grid { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px; }
        .gallery-grid::-webkit-scrollbar { height: 2px; }
        .gallery-grid::-webkit-scrollbar-track { background: var(--border); }
        .gallery-grid::-webkit-scrollbar-thumb { background: var(--border-hover); }
        .thumb-wrap { position: relative; flex-shrink: 0; cursor: pointer; border: 1px solid var(--border); border-radius: 2px; overflow: hidden; width: 80px; height: 80px; transition: border-color 0.15s; }
        .thumb-wrap:hover { border-color: var(--border-hover); }
        .thumb-wrap.active { border-color: var(--accent); }
        .thumb-wrap img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .thumb-badge { position: absolute; bottom: 3px; left: 3px; font-family: var(--mono); font-size: 7px; background: rgba(0,0,0,0.75); color: rgba(255,255,255,0.6); padding: 1px 4px; border-radius: 1px; letter-spacing: 0.04em; }
        .thumb-delete { position: absolute; top: 3px; right: 3px; background: rgba(0,0,0,0.7); border: none; color: rgba(255,255,255,0.4); width: 16px; height: 16px; border-radius: 1px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 8px; opacity: 0; transition: opacity 0.15s; }
        .thumb-wrap:hover .thumb-delete { opacity: 1; }
        .thumb-delete:hover { color: #ff6b6b; }
      `}</style>

      <header className="header">
        <div style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
          <div className="acid-logo">
            <span className="acid-letters">
              <span style={{ color: "#F4A233" }}>A</span>
              <span style={{ color: "#7EC8E3" }}>C</span>
              <span style={{ color: "#2DCA72" }}>I</span>
              <span style={{ color: "#E88CBF" }}>D</span>
            </span>
            <span className="acid-tm">™</span>
          </div>
          <span className="acid-sub">Tony Character Studio ©</span>
        </div>

        {usage && (
          <div className="header-usage">
            <span className="usage-label">images</span>
            <div className="usage-bar-wrap">
              <div className="usage-bar-fill" style={{ width: `${usage.percentage}%`, background: usageColor }} />
            </div>
            <span className="usage-count" style={{ color: usageColor }}>{usage.used}/{usage.limit}</span>
          </div>
        )}

        <div className="header-right" ref={dropdownRef}>
          <span className="status-dot" />
          <button className="user-btn" onClick={() => setDropdownOpen(o => !o)}>
            {firstName}
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M2 4L5 7L8 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          {dropdownOpen && (
            <div className="dropdown-menu">
              <div className="dropdown-header">
                <div className="dropdown-name">{user?.fullName || firstName}</div>
                <div className="dropdown-plan">{usage?.plan || "enterprise"} plan · {usage?.remaining || 0} remaining</div>
              </div>
              <a href="/assets" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                ◫ My assets
              </a>
              <button className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                ⚙ Settings
              </button>
              <button className="dropdown-item danger" onClick={() => signOut({ redirectUrl: "/sign-in" })}>
                → Sign out
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="layout">
        <aside className="panel-left">
          <div className={`trigger-status ${hasTrigger ? "connected" : ""}`}>
            <span className="trigger-indicator" />
            <span className="trigger-text">{hasTrigger ? "trigger connected" : "trigger not detected"}</span>
            <span className="trigger-tag">TONI_TIGER</span>
          </div>

          <div className="divider" />

          <div className="field-block">
            <div className="field-header">
              <span className="field-label">Scene</span>
              <span className={`char-counter ${scene.length > MAX_CHARS * 0.85 ? "warn" : ""}`}>{scene.length}/{MAX_CHARS}</span>
            </div>
            <div className={`scene-wrap ${hasTrigger ? "has-trigger" : ""}`}>
              <div ref={backdropRef} className="scene-backdrop" dangerouslySetInnerHTML={{ __html: getHighlightedHTML(scene) }} />
              <textarea ref={textareaRef} className="scene-textarea" rows={5} maxLength={MAX_CHARS} placeholder="toni jogando basquete ao pôr do sol..." value={scene} onChange={e => setScene(e.target.value)} onScroll={syncScroll} />
            </div>
            <p className="hint-text">Use <em>toni</em> ou <em>tony</em> na cena para conectar ao trigger.</p>
          </div>

          <div className="field-block">
            <span className="field-label">Model</span>
            <div className="model-grid">
              {MODELS.map(m => (
                <button key={m.value} className={`model-btn ${model === m.value ? "active" : ""}`} onClick={() => setModel(m.value)}>{m.label}</button>
              ))}
            </div>
          </div>

          <div className="field-block">
            <span className="field-label">Camera</span>
            <div className="select-wrap">
              <select value={cameraAngle} onChange={e => setCameraAngle(e.target.value)}>
                {CAMERA_ANGLES.map(a => <option key={a}>{a}</option>)}
              </select>
              <span className="select-arrow">▾</span>
            </div>
          </div>

          <div className="field-block">
            <span className="field-label">Format</span>
            <div className="ratio-grid">
              {ASPECT_RATIOS.map(r => (
                <button key={r.value} className={`ratio-btn ${aspectRatio === r.value ? "active" : ""}`} onClick={() => setAspectRatio(r.value)}>{r.label}</button>
              ))}
            </div>
          </div>

          <div className="field-block">
            <button className="generate-btn" onClick={handleGenerate} disabled={isLoading || !scene.trim() || (usage ? usage.remaining <= 0 : false)}>
              {isLoading ? loadingStep : usage && usage.remaining <= 0 ? "Limit reached" : "Generate"}
            </button>
            {isLoading && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
                <div className="progress-wrap"><div className="progress-bar" /></div>
                <span className="loading-label">30–60s</span>
              </div>
            )}
            {error && <p className="error-msg" style={{ marginTop: 8 }}>{error}</p>}
          </div>

          <p className="panel-footer">Scene descriptions are refined automatically.<br />Character rules applied behind the scenes.</p>
        </aside>

        <section className="panel-right">
          <div className="output-header">
            <span className="output-label">Output</span>
            {activeImage && (
              <div className="output-actions">
                <button className="icon-btn" onClick={() => handleDownload(activeImage)}>↓ download</button>
                <button className="icon-btn refine-btn" onClick={() => handleRefine(activeImage)} disabled={isRefining}>
                  {isRefining ? "refining..." : "✦ refine"}
                </button>
                {selected && <button className="icon-btn danger" onClick={() => handleDelete(selected.id)}>✕ remove</button>}
              </div>
            )}
          </div>

          <div className="output-canvas">
            {!activeImage && !isLoading && (
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
            {activeImage && !isLoading && <img className="output-image" src={activeImage} alt="Generated Toni" />}
            {isRefining && (
              <div className="refine-overlay">
                <div className="loading-ring" style={{ borderTopColor: "rgba(235,235,235,0.6)" }} />
                <span className="loading-text">refining character...</span>
                <span className="loading-sub">comparing with references</span>
              </div>
            )}
          </div>

          {generations.length > 0 && (
            <div className="gallery-section">
              <div className="gallery-header">
                <span className="gallery-label">Session</span>
                <span className="gallery-count">{generations.length} image{generations.length !== 1 ? "s" : ""}</span>
              </div>
              <div className="gallery-grid">
                {generations.map(gen => (
                  <div key={gen.id} className={`thumb-wrap ${selected?.id === gen.id ? "active" : ""}`} onClick={() => setSelected(gen)} title={gen.scene}>
                    <img src={gen.url} alt={gen.scene} />
                    <span className="thumb-badge">{gen.model === "flux2" ? "F2" : gen.model === "nano" ? "NB" : "F1"}</span>
                    <button className="thumb-delete" onClick={e => { e.stopPropagation(); handleDelete(gen.id); }}>✕</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
