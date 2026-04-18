import { ImageResponse } from "next/og";

export const alt = "Qexur Autonomous AI Security";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background:
            "radial-gradient(circle at 20% 20%, rgba(34,211,238,0.25), rgba(2,6,23,1) 45%), linear-gradient(145deg, #020617 0%, #0f172a 55%, #111827 100%)",
          color: "#e2e8f0",
          padding: "56px",
          border: "2px solid rgba(34,211,238,0.5)",
        }}
      >
        <div style={{ fontSize: 28, letterSpacing: 8, textTransform: "uppercase", color: "#67e8f9" }}>
          Qexur AI Security
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 74, lineHeight: 1.02, fontWeight: 800, textTransform: "uppercase" }}>
            Autonomous AI Security
          </div>
          <div style={{ fontSize: 34, color: "#cbd5e1", lineHeight: 1.25 }}>
            Pentesting AI Squad | Real-time Web Attack Simulation | AI Code Audit
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div
            style={{
              fontSize: 24,
              letterSpacing: 3,
              textTransform: "uppercase",
              padding: "12px 18px",
              border: "1px solid rgba(34,211,238,0.65)",
              borderRadius: 999,
              color: "#a5f3fc",
            }}
          >
            AI-driven Cybersecurity Orchestrator
          </div>
          <div style={{ fontSize: 26, color: "#67e8f9" }}>qexur.me</div>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
