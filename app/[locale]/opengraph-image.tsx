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
        alignItems: "center", // Center everything so the crop never cuts off edges
        textAlign: "center",
        backgroundColor: "#602BDE",
        padding: "60px 40px",
        fontFamily: "sans-serif",
      }}
    >
      {/* Brand Pill / Tag */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "rgba(255, 255, 255, 0.15)",
          color: "#ffffff",
          padding: "8px 24px",
          borderRadius: "9999px",
          fontSize: 28,
          fontWeight: 800,
          letterSpacing: "-0.02em",
          marginBottom: 24,
        }}
      >
        0w.lat
      </div>

      {/* Main Headline (Constrained to the 630px crop window) */}
      <div
        style={{
          color: "#ffffff",
          fontSize: 54,
          fontWeight: 800,
          lineHeight: 1.15,
          marginBottom: 24,
          maxWidth: 640, // Keeps text strictly inside Slack's 630px center crop
        }}
      >
        Privacy-First Developer & Security Toolbox
      </div>

      {/* Feature Bullet Strip */}
      <div
        style={{
          color: "#e2e8f0",
          fontSize: 22,
          fontWeight: 500,
          maxWidth: 620,
          lineHeight: 1.4,
        }}
      >
        Client-Side WASM • Zero Telemetry • 100% Stateless
      </div>
    </div>,
    { ...size }
  );
}
