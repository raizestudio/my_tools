// app/[locale]/opengraph-image.tsx
import { ImageResponse } from "next/og";

export const alt = "0w — Privacy-First Developer & Security Toolbox";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "flex-start",
        backgroundColor: "#602BDE",
        padding: "80px",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          color: "#38bdf8",
          fontSize: 36,
          fontWeight: 700,
          marginBottom: 20,
        }}
      >
        0w.lat
      </div>
      <div
        style={{
          color: "#ffffff",
          fontSize: 64,
          fontWeight: 800,
          lineHeight: 1.1,
          marginBottom: 24,
          maxWidth: 900,
        }}
      >
        Privacy-First Developer & Security Toolbox
      </div>
      <div style={{ color: "#94a3b8", fontSize: 28, fontWeight: 500 }}>
        Client-Side WASM • Zero Telemetry • 100% Stateless
      </div>
    </div>,
    { ...size },
  );
}
