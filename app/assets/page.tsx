"use client";

import { useUser, useClerk } from "@clerk/nextjs";
import { createClient } from "@supabase/supabase-js";
import { useEffect, useState, useRef } from "react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Generation {
  id: string;
  model: string;
  scene: string;
  image_url: string;
  created_at: string;
}

const MODEL_BADGE: Record<string, string> = {
  flux1: "F1",
  flux2: "F2",
  nano: "NB",
  nanobanana: "NB",
};

export default function AssetsPage() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Generation | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Generation | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("generations")
      .select("*")
      .eq("clerk_id", user.id)
      .not("image_url", "is", null)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) {
          setGenerations(data as Generation[]);
          if (data.length > 0) setSelected(data[0] as Generation);
        }
        setLoading(false);
      });
  }, [user]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function handleDownload(url: string, id: string) {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = `toni-${id.slice(0, 8)}.webp`;
      a.click();
      URL.revokeObjectURL(objectUrl);
    } catch {
      window.open(url, "_blank");
    }
  }

  async function confirmDeleteAction() {
    if (!confirmDelete) return;
    setIsDeleting(true);
    const gen = confirmDelete;
    setConfirmDelete(null);

    try {
      await fetch("/api/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: gen.id, imageUrl: gen.image_url }),
      });
    } catch (err) {
      console.error("Delete error:", err);
    }

    setGenerations(prev => prev.filter(g => g.id !== gen.id));
    if (selected?.id === gen.id) setSelected(null);
    setIsDeleting(false);
  }

  const firstName =
    user?.firstName ||
    user?.fullName?.split(" ")[0] ||
    user?.emailAddresses?.[0]?.emailAddress?.split("@")[0] ||
    "User";

  if (!isLoaded) return null;

  return (
    <main>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@300;400;500&family=Syne+Mono&family=IBM+Plex+Sans:wght@300;400&display=swap');
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
        .acid-logo { display: flex; align-items: center; gap: 12px; flex-shrink: 0; }
        .acid-letters { font-family: 'Libre Caslon Text', serif; font-weight: 400; font-size: 20px; letter-spacing: 0.02em; }
        .acid-tm { font-family: 'IBM Plex Sans', sans-serif; font-size: 8px; font-weight: 300; vertical-align: super; color: var(--text-dim); margin-left: 1px; }
        .acid-sub { font-family: 'IBM Plex Sans', sans-serif; font-weight: 300; font-size: 10px; letter-spacing: 0.12em; color: var(--text-dim); text-transform: uppercase; margin-left: 12px; align-self: center; }
        .header-right { display: flex; align-items: center; gap: 8px; position: relative; }
        .status-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--green); animation: blink 2.5s ease-in-out infinite; flex-shrink: 0; }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.25; } }
        .user-btn { display: flex; align-items: center; gap: 8px; background: transparent; border: 1px solid var(--border); color: var(--text-dim); font-family: var(--mono); font-size: 10px; letter-spacing: 0.08em; padding: 6px 12px; cursor: pointer; border-radius: 2px; transition: all 0.15s; }
        .user-btn:hover { border-color: var(--border-hover); color: var(--text); }
        .user-btn svg { opacity: 0.4; }
        .dropdown-menu { position: absolute; top: calc(100% + 8px); right: 0; background: var(--surface); border: 1px solid var(--border); border-radius: 2px; min-width: 180px; z-index: 100; overflow: hidden; }
        .dropdown-header { padding: 12px 14px; border-bottom: 1px solid var(--border); }
        .dropdown-name { font-family: var(--sans); font-size: 12px; color: var(--text); }
        .dropdown-item { display: block; width: 100%; text-align: left; background: transparent; border: none; padding: 10px 14px; font-family: var(--mono); font-size: 10px; color: var(--text-dim); letter-spacing: 0.08em; cursor: pointer; transition: background 0.15s, color 0.15s; text-decoration: none; }
        .dropdown-item:hover { background: var(--surface-2); color: var(--text); }
        .dropdown-item.danger:hover { color: #ff6b6b; }
        .assets-layout { display: grid; grid-template-columns: 1fr 320px; min-height: calc(100vh - 65px); }
        .assets-grid-wrap { padding: 28px 36px; overflow-y: auto; }
        .assets-header { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 20px; }
        .assets-title { font-family: var(--mono); font-size: 9px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--text-dimmer); }
        .assets-count { font-family: var(--mono); font-size: 9px; color: var(--text-dimmer); }
        .assets-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 8px; }
        .asset-thumb { position: relative; border: 1px solid var(--border); border-radius: 2px; overflow: hidden; cursor: pointer; transition: border-color 0.15s; aspect-ratio: 1; background: var(--surface); }
        .asset-thumb:hover { border-color: var(--border-hover); }
        .asset-thumb.active { border-color: var(--accent); }
        .asset-skeleton { position: absolute; inset: 0; background: var(--surface); animation: pulse 1.5s ease-in-out infinite; z-index: 1; }
        .asset-thumb img { position: relative; z-index: 2; width: 100%; height: 100%; object-fit: cover; display: block; }
        .asset-badge { position: absolute; bottom: 4px; left: 4px; font-family: var(--mono); font-size: 7px; background: rgba(0,0,0,0.75); color: rgba(255,255,255,0.6); padding: 1px 4px; border-radius: 1px; letter-spacing: 0.04em; z-index: 3; }
        .asset-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 50%); opacity: 0; transition: opacity 0.15s; display: flex; align-items: flex-end; padding: 8px; z-index: 3; }
        .asset-thumb:hover .asset-overlay { opacity: 1; }
        .asset-scene { font-family: var(--mono); font-size: 9px; color: rgba(255,255,255,0.7); letter-spacing: 0.04em; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .preview-panel { border-left: 1px solid var(--border); display: flex; flex-direction: column; }
        .preview-header { padding: 13px 20px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; }
        .preview-label { font-family: var(--mono); font-size: 9px; color: var(--text-dimmer); letter-spacing: 0.2em; text-transform: uppercase; }
        .preview-canvas { flex: 1; display: flex; align-items: center; justify-content: center; padding: 20px; position: relative; }
        .preview-canvas::before { content: ''; position: absolute; inset: 0; background-image: linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px); background-size: 40px 40px; opacity: 0.5; }
        .preview-img { position: relative; z-index: 1; max-width: 100%; max-height: 400px; object-fit: contain; display: block; border-radius: 2px; }
        .preview-empty { position: relative; z-index: 1; font-family: var(--mono); font-size: 9px; color: var(--text-dimmer); letter-spacing: 0.15em; text-transform: uppercase; }
        .preview-actions { padding: 14px 20px; border-top: 1px solid var(--border); display: flex; flex-direction: column; gap: 8px; }
        .preview-scene { font-family: var(--mono); font-size: 9px; color: var(--text-dim); letter-spacing: 0.06em; line-height: 1.6; margin-bottom: 4px; }
        .icon-btn { background: transparent; border: 1px solid var(--border); color: var(--text-dim); font-family: var(--mono); font-size: 10px; letter-spacing: 0.08em; padding: 8px 14px; cursor: pointer; border-radius: 2px; transition: all 0.15s; width: 100%; text-align: center; }
        .icon-btn:hover { border-color: var(--border-hover); color: var(--text); }
        .icon-btn.danger { border-color: rgba(255,107,107,0.25); color: rgba(255,107,107,0.6); }
        .icon-btn.danger:hover { border-color: rgba(255,107,107,0.5); color: #ff6b6b; background: rgba(255,107,107,0.06); }
        .back-btn { font-family: var(--mono); font-size: 9px; color: var(--text-dimmer); letter-spacing: 0.1em; text-decoration: none; padding: 6px 12px; border: 1px solid var(--border); border-radius: 2px; transition: all 0.15s; }
        .back-btn:hover { border-color: var(--border-hover); color: var(--text); }
        .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 300px; gap: 12px; }
        .empty-crosshair { width: 28px; height: 28px; position: relative; opacity: 0.15; }
        .empty-crosshair::before, .empty-crosshair::after { content: ''; position: absolute; background: var(--text); }
        .empty-crosshair::before { width: 1px; height: 100%; left: 50%; top: 0; }
        .empty-crosshair::after { height: 1px; width: 100%; top: 50%; left: 0; }
        .empty-text { font-family: var(--mono); font-size: 9px; color: var(--text-dimmer); letter-spacing: 0.2em; text-transform: uppercase; }
        .skeleton { background: var(--surface); animation: pulse 1.5s ease-in-out infinite; border-radius: 2px; }
        @keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.8; } }
        /* Confirm dialog */
        .confirm-overlay { position: fixed; inset: 0; z-index: 200; display: flex; align-items: flex-end; justify-content: center; padding-bottom: 32px; pointer-events: none; }
        .confirm-box { pointer-events: all; background: var(--surface); border: 1px solid var(--border); border-radius: 4px; padding: 16px 20px; display: flex; align-items: center; gap: 16px; box-shadow: 0 8px 32px rgba(0,0,0,0.5); animation: slideUp 0.15s ease; }
        @keyframes slideUp { from { transform: translateY(12px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .confirm-text { font-family: var(--mono); font-size: 10px; color: var(--text-dim); letter-spacing: 0.08em; }
        .confirm-actions { display: flex; gap: 8px; }
        .confirm-cancel { background: transparent; border: 1px solid var(--border); color: var(--text-dim); font-family: var(--mono); font-size: 10px; letter-spacing: 0.08em; padding: 5px 12px; cursor: pointer; border-radius: 2px; transition: all 0.15s; }
        .confirm-cancel:hover { border-color: var(--border-hover); color: var(--text); }
        .confirm-ok { background: transparent; border: 1px solid rgba(255,107,107,0.35); color: #ff6b6b; font-family: var(--mono); font-size: 10px; letter-spacing: 0.08em; padding: 5px 12px; cursor: pointer; border-radius: 2px; transition: all 0.15s; }
        .confirm-ok:hover { background: rgba(255,107,107,0.08); border-color: rgba(255,107,107,0.6); }
        .confirm-ok:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>

      <header className="header">
        <div style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
          <div className="acid-logo">
            <img src="/logo.svg" alt="ACID" style={{ height: 28, width: "auto", display: "block" }} />
            <span className="acid-sub">Tony Character Studio ©</span>
          </div>
        </div>

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
              </div>
              <a href="/" className="dropdown-item">← Generate</a>
              <button className="dropdown-item danger" onClick={() => signOut({ redirectUrl: "/sign-in" })}>→ Sign out</button>
            </div>
          )}
        </div>
      </header>

      <div className="assets-layout">
        <div className="assets-grid-wrap">
          <div className="assets-header">
            <span className="assets-title">Assets</span>
            <span className="assets-count">
              {loading ? "—" : `${generations.length} image${generations.length !== 1 ? "s" : ""}`}
            </span>
          </div>

          {loading ? (
            <div className="assets-grid">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ aspectRatio: "1" }} />
              ))}
            </div>
          ) : generations.length === 0 ? (
            <div className="empty-state">
              <div className="empty-crosshair" />
              <span className="empty-text">No assets yet</span>
            </div>
          ) : (
            <div className="assets-grid">
              {generations.map(gen => (
                <div
                  key={gen.id}
                  className={`asset-thumb ${selected?.id === gen.id ? "active" : ""}`}
                  onClick={() => setSelected(gen)}
                >
                  <div className="asset-skeleton" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={gen.image_url}
                    alt={gen.scene}
                    loading="lazy"
                    onLoad={e => {
                      const skeleton = (e.currentTarget as HTMLImageElement).previousSibling as HTMLElement;
                      if (skeleton) skeleton.style.display = "none";
                    }}
                  />
                  <span className="asset-badge">{MODEL_BADGE[gen.model] || gen.model?.toUpperCase() || "F1"}</span>
                  <div className="asset-overlay">
                    <span className="asset-scene">{gen.scene}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="preview-panel">
          <div className="preview-header">
            <span className="preview-label">Preview</span>
            <a href="/" className="back-btn">← generate</a>
          </div>

          <div className="preview-canvas">
            {selected ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="preview-img" src={selected.image_url} alt={selected.scene} />
            ) : (
              <span className="preview-empty">select an image</span>
            )}
          </div>

          {selected && (
            <div className="preview-actions">
              <p className="preview-scene">{selected.scene}</p>
              <button className="icon-btn" onClick={() => handleDownload(selected.image_url, selected.id)}>
                ↓ download
              </button>
              <button className="icon-btn danger" onClick={() => setConfirmDelete(selected)}>
                ✕ remove
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Confirm delete dialog */}
      {confirmDelete && (
        <div className="confirm-overlay">
          <div className="confirm-box">
            <span className="confirm-text">remove this image? this cannot be undone.</span>
            <div className="confirm-actions">
              <button className="confirm-cancel" onClick={() => setConfirmDelete(null)}>cancel</button>
              <button className="confirm-ok" onClick={confirmDeleteAction} disabled={isDeleting}>
                {isDeleting ? "removing..." : "remove"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
