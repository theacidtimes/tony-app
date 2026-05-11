import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#141414",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400&display=swap');
        .cl-card { background: #1c1c1c !important; border: 1px solid rgba(255,255,255,0.09) !important; border-radius: 2px !important; box-shadow: none !important; }
        .cl-headerTitle { color: #ebebeb !important; }
        .cl-headerSubtitle { color: rgba(235,235,235,0.45) !important; }
        .cl-formFieldLabel { color: rgba(235,235,235,0.45) !important; font-size: 11px !important; letter-spacing: 0.1em !important; }
        .cl-formFieldInput { background: #222222 !important; border: 1px solid rgba(255,255,255,0.09) !important; color: #ebebeb !important; border-radius: 2px !important; }
        .cl-formFieldInput:focus { border-color: rgba(255,255,255,0.18) !important; }
        .cl-formButtonPrimary { background: #FF6B00 !important; border-radius: 2px !important; letter-spacing: 0.1em !important; box-shadow: none !important; }
        .cl-footerActionLink { color: #FF6B00 !important; }
        .cl-dividerLine { background: rgba(255,255,255,0.09) !important; }
        .cl-dividerText { color: rgba(235,235,235,0.35) !important; }
        .cl-socialButtonsBlockButton { background: #222222 !important; border: 1px solid rgba(255,255,255,0.09) !important; color: #ebebeb !important; border-radius: 2px !important; }
      `}</style>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 32 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          <img src="/logo.svg" alt="ACID" style={{ height: 44, width: "auto", display: "block" }} />
          <span style={{
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontSize: 11,
            color: "rgba(235,235,235,0.3)",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
          }}>
            Tony Character Studio ©
          </span>
        </div>
        <SignUp />
      </div>
    </main>
  );
}
