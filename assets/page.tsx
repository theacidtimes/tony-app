"use client";

import { useUser } from "@clerk/nextjs";
import { createClient } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

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
  nanobanana: "NB",
};

export default function AssetsPage() {
  const { user } = useUser();
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function fetchGenerations() {
      const { data, error } = await supabase
        .from("generations")
        .select("*")
        .eq("clerk_id", user!.id)
        .not("image_url", "is", null)
        .order("created_at", { ascending: false });

      if (!error && data) setGenerations(data);
      setLoading(false);
    }

    fetchGenerations();
  }, [user]);

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

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "#0a0a0a",
        color: "#f5f0e8",
        fontFamily: "var(--font-geist-sans, sans-serif)",
        padding: "40px 24px",
      }}
    >
      {/* Header */}
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto 40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 600,
              letterSpacing: "-0.02em",
              margin: 0,
            }}
          >
            My Assets
          </h1>
          <p style={{ color: "#888", fontSize: 14, marginTop: 6 }}>
            {loading
              ? "Loading..."
              : `${generations.length} image${generations.length !== 1 ? "s" : ""} generated`}
          </p>
        </div>
        <a
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 16px",
            backgroundColor: "#1a1a1a",
            border: "1px solid #2a2a2a",
            borderRadius: 8,
            color: "#f5f0e8",
            textDecoration: "none",
            fontSize: 14,
          }}
        >
          ← Generate
        </a>
      </div>

      {/* Grid */}
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {loading ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: 16,
            }}
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                style={{
                  aspectRatio: "1",
                  backgroundColor: "#1a1a1a",
                  borderRadius: 12,
                  animation: "pulse 1.5s ease-in-out infinite",
                }}
              />
            ))}
          </div>
        ) : generations.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "80px 0",
              color: "#555",
            }}
          >
            <p style={{ fontSize: 18 }}>No images yet.</p>
            <p style={{ fontSize: 14, marginTop: 8 }}>
              Generate your first Toni on the{" "}
              <a href="/" style={{ color: "#c49a45", textDecoration: "none" }}>
                main page
              </a>
              .
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: 16,
            }}
          >
            {generations.map((gen) => (
              <div
                key={gen.id}
                style={{
                  position: "relative",
                  borderRadius: 12,
                  overflow: "hidden",
                  backgroundColor: "#1a1a1a",
                  border: "1px solid #2a2a2a",
                  cursor: "pointer",
                  transition: "border-color 0.2s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor =
                    "#c49a45";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor =
                    "#2a2a2a";
                }}
              >
                {/* Image */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={gen.image_url}
                  alt={gen.scene}
                  style={{
                    width: "100%",
                    aspectRatio: "1",
                    objectFit: "cover",
                    display: "block",
                  }}
                />

                {/* Overlay */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 50%)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-end",
                    padding: 12,
                    opacity: 0,
                    transition: "opacity 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.opacity = "1";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.opacity = "0";
                  }}
                >
                  <p
                    style={{
                      fontSize: 12,
                      color: "#ccc",
                      margin: "0 0 8px",
                      lineClamp: 2,
                      WebkitLineClamp: 2,
                      display: "-webkit-box",
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {gen.scene}
                  </p>
                  <button
                    onClick={() => handleDownload(gen.image_url, gen.id)}
                    style={{
                      width: "100%",
                      padding: "6px 0",
                      backgroundColor: "#c49a45",
                      border: "none",
                      borderRadius: 6,
                      color: "#000",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Download
                  </button>
                </div>

                {/* Model Badge */}
                <div
                  style={{
                    position: "absolute",
                    top: 10,
                    right: 10,
                    backgroundColor: "rgba(0,0,0,0.7)",
                    border: "1px solid #333",
                    borderRadius: 4,
                    padding: "2px 6px",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#c49a45",
                    letterSpacing: "0.05em",
                  }}
                >
                  {MODEL_BADGE[gen.model] || gen.model?.toUpperCase() || "F1"}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </main>
  );
}
