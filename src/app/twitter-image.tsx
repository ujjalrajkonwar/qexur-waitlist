import { ImageResponse } from "next/og";

export const alt = "Qexur Pentesting AI Squad";
export const size = {
  width: 1200,
  height: 675,
};
export const contentType = "image/png";

export default function TwitterImage() {
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
            "radial-gradient(circle at 80% 10%, rgba(34,197,94,0.2), rgba(2,6,23,1) 35%), radial-gradient(circle at 10% 90%, rgba(34,211,238,0.18), rgba(2,6,23,0.85) 50%), linear-gradient(160deg, #020617 0%, #0f172a 60%, #111827 100%)",
          color: "#e2e8f0",
          padding: "52px",
          border: "2px solid rgba(34,211,238,0.5)",
        }}
      >
        <div style={{ fontSize: 24, letterSpacing: 7, textTransform: "uppercase", color: "#67e8f9" }}>
          The official site for the Qexur AI security squad
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: 68, lineHeight: 1.05, fontWeight: 800, textTransform: "uppercase" }}>
            Pentesting AI Squad
          </div>
          <div style={{ fontSize: 34, color: "#cbd5e1", lineHeight: 1.2 }}>
            Autonomous Red-Teaming and Live Attack Simulation for modern developers and agencies.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div
            style={{
              fontSize: 22,
              padding: "10px 16px",
              border: "1px solid rgba(34,211,238,0.65)",
              borderRadius: 999,
              color: "#a5f3fc",
              textTransform: "uppercase",
              letterSpacing: 2,
            }}
          >
            AI Code Audit | Real-time Web Attack Simulation
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
