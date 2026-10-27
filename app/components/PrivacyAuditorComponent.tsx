// app/components/PrivacyAuditorComponent.tsx
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import ToolHeader from "@/app/components/ui/ToolHeaderComponent";
import CopyButton from "@/app/components/ui/CopyButtonComponent";

interface NavigatorExtended extends Navigator {
  deviceMemory?: number;
}

interface WebRtcResult {
  status: "protected" | "leaked" | "unsupported";
  ips: string[];
}

interface AuditReport {
  fingerprints: {
    canvasHash: string;
    audioHash: string;
    webglVendor: string;
    webglRenderer: string;
  };
  webrtc: WebRtcResult;
  hardware: {
    cores: number | string;
    memory: string;
    screen: string;
    colorDepth: number;
    pixelRatio: number;
    touchPoints: number;
  };
  browser: {
    timezone: string;
    doNotTrack: boolean;
    platform: string;
    userAgent: string;
  };
}

async function sha256(message: string): Promise<string> {
  if (typeof window === "undefined" || !window.crypto?.subtle) {
    return "Unavailable";
  }
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export default function PrivacyAuditorComponent() {
  const t = useTranslations("tools.privacyAuditor");

  const [isLoading, setIsLoading] = useState(true);
  const [report, setReport] = useState<AuditReport | null>(null);

  // 1. Audit Canvas 2D
  const getCanvasFingerprint = async (): Promise<string> => {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 240;
      canvas.height = 60;
      const ctx = canvas.getContext("2d");
      if (!ctx) return "Unavailable";

      ctx.textBaseline = "top";
      ctx.font = "14px 'Arial', sans-serif";
      ctx.textBaseline = "alphabetic";
      ctx.fillStyle = "#f60";
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = "#069";
      ctx.fillText("0w.lat Privacy Test 🔒 😃", 2, 15);
      ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
      ctx.fillText("0w.lat Privacy Test 🔒 😃", 4, 17);

      const dataUri = canvas.toDataURL();
      return await sha256(dataUri);
    } catch {
      return "Unavailable";
    }
  };

  // 2. Audit AudioContext
  const getAudioFingerprint = async (): Promise<string> => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return "Unsupported";

      const context = new AudioCtx();
      const oscillator = context.createOscillator();
      const analyser = context.createAnalyser();
      const gain = context.createGain();
      const scriptProcessor = context.createScriptProcessor(4096, 1, 1);

      gain.gain.value = 0; // Mute
      oscillator.type = "triangle";
      oscillator.connect(analyser);
      analyser.connect(scriptProcessor);
      scriptProcessor.connect(gain);
      gain.connect(context.destination);

      oscillator.start(0);

      return new Promise<string>((resolve) => {
        let resolved = false;

        scriptProcessor.onaudioprocess = async (event) => {
          if (resolved) return;
          resolved = true;
          const output = event.inputBuffer.getChannelData(0);
          let sum = 0;
          for (let i = 0; i < output.length; ++i) {
            sum += Math.abs(output[i]);
          }

          oscillator.stop();
          scriptProcessor.disconnect();
          analyser.disconnect();
          gain.disconnect();
          void context.close();

          const hash = await sha256(sum.toString());
          resolve(hash);
        };

        // Fallback si onaudioprocess tarde
        setTimeout(async () => {
          if (!resolved) {
            resolved = true;
            void context.close();
            resolve("Timeout");
          }
        }, 1200);
      });
    } catch {
      return "Unavailable";
    }
  };

  // 3. Démasquage WebGL
  const getWebglInfo = (): { vendor: string; renderer: string } => {
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      if (!gl || !(gl instanceof WebGLRenderingContext)) {
        return { vendor: "Unavailable", renderer: "Unavailable" };
      }

      const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
      if (!debugInfo) {
        return {
          vendor: String(gl.getParameter(gl.VENDOR)),
          renderer: String(gl.getParameter(gl.RENDERER)),
        };
      }

      return {
        vendor: String(gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL)),
        renderer: String(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)),
      };
    } catch {
      return { vendor: "Unavailable", renderer: "Unavailable" };
    }
  };

  // 4. Détection des fuites WebRTC
  const getWebRtcLeak = async (): Promise<WebRtcResult> => {
    if (typeof window === "undefined" || !window.RTCPeerConnection) {
      return { status: "unsupported", ips: [] };
    }

    return new Promise<WebRtcResult>((resolve) => {
      const ips = new Set<string>();
      let isDone = false;

      const finish = () => {
        if (isDone) return;
        isDone = true;
        pc.close();
        const detected = Array.from(ips);
        resolve({
          status: detected.length > 0 ? "leaked" : "protected",
          ips: detected,
        });
      };

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });

      pc.createDataChannel("leak-test");

      pc.onicecandidate = (event) => {
        if (!event || !event.candidate) {
          finish();
          return;
        }

        const cand = event.candidate.candidate;
        // Regex IPv4 standard & IPv6
        const ipRegex = /([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/gi;
        const matches = cand.match(ipRegex);

        if (matches) {
          for (const match of matches) {
            // Ignorer les serveurs STUN de référence
            if (!match.startsWith("127.") && !match.startsWith("0.")) {
              ips.add(match);
            }
          }
        }
      };

      pc.createOffer()
        .then((offer) => pc.setLocalDescription(offer))
        .catch(() => finish());

      // Timeout de sécurité après 2 secondes
      setTimeout(finish, 2000);
    });
  };

  const runAudit = useCallback(async () => {
    setIsLoading(true);

    const [canvasHash, audioHash, webrtcResult] = await Promise.all([
      getCanvasFingerprint(),
      getAudioFingerprint(),
      getWebRtcLeak(),
    ]);

    const webgl = getWebglInfo();
    const nav = typeof window !== "undefined" ? (navigator as NavigatorExtended) : null;
    const scr = typeof window !== "undefined" ? window.screen : null;

    const auditData: AuditReport = {
      fingerprints: {
        canvasHash,
        audioHash,
        webglVendor: webgl.vendor,
        webglRenderer: webgl.renderer,
      },
      webrtc: webrtcResult,
      hardware: {
        cores: nav?.hardwareConcurrency || "Unknown",
        memory: nav?.deviceMemory ? `${nav.deviceMemory} GB` : "Unknown / Blocked",
        screen: scr ? `${scr.width} x ${scr.height}` : "Unknown",
        colorDepth: scr ? scr.colorDepth : 24,
        pixelRatio: typeof window !== "undefined" ? window.devicePixelRatio : 1,
        touchPoints: nav?.maxTouchPoints ?? 0,
      },
      browser: {
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Unknown",
        doNotTrack: nav?.doNotTrack === "1",
        platform: nav?.platform || "Unknown",
        userAgent: nav?.userAgent || "Unknown",
      },
    };

    setReport(auditData);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    runAudit();
  }, [runAudit]);

  const reportJson = useMemo(() => {
    if (!report) return "";
    return JSON.stringify(report, null, 2);
  }, [report]);

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto w-full">
      <ToolHeader
        title={t("title")}
        description={t("desc")}
        icon="icon-[lucide--shield-alert]"
        badge={
          <span className="badge badge-sm badge-soft badge-primary">
            {t("badgeAudit")}
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isLoading}
              onClick={runAudit}
              className="btn btn-xs btn-outline gap-1.5"
            >
              <span
                className={`icon-[lucide--refresh-cw] size-3.5 ${
                  isLoading ? "animate-spin" : ""
                }`}
              ></span>
              <span>{t("reRunAudit")}</span>
            </button>
            <CopyButton
              text={reportJson}
              label={t("exportReport")}
              size="xs"
              variant="primary"
            />
          </div>
        }
      />

      {isLoading && !report && (
        <div className="card card-border bg-base-100 p-12 flex flex-col items-center justify-center gap-3">
          <span className="loading loading-spinner size-8 text-primary"></span>
          <span className="text-xs text-base-content/60 font-medium">
            {t("runningAudit")}
          </span>
        </div>
      )}

      {report && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-200">
          {/* Section 1 : Empreintes Uniques (Fingerprints) */}
          <div className="card card-border bg-base-100 p-5 sm:p-6 shadow-sm flex flex-col gap-4">
            <div className="border-b border-base-content/10 pb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-base-content flex items-center gap-2">
                <span className="icon-[lucide--fingerprint] size-4 text-primary"></span>
                {t("uniqueIdsTitle")}
              </span>
              <p className="text-xs text-base-content/60 mt-0.5">
                {t("uniqueIdsDesc")}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Canvas Hash */}
              <div className="p-3.5 rounded-xl bg-base-200/40 border border-base-content/5 flex flex-col justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-base-content">
                      {t("canvasTitle")}
                    </span>
                    <span className="badge badge-xs badge-neutral font-mono">
                      SHA-256
                    </span>
                  </div>
                  <span className="text-[11px] text-base-content/60 leading-relaxed">
                    {t("canvasDesc")}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 p-2 bg-base-100 rounded-lg border border-base-content/5 font-mono text-xs">
                  <span className="truncate select-all text-primary font-semibold">
                    {report.fingerprints.canvasHash}
                  </span>
                  <CopyButton
                    text={report.fingerprints.canvasHash}
                    size="xs"
                    variant="ghost"
                  />
                </div>
              </div>

              {/* Audio Hash */}
              <div className="p-3.5 rounded-xl bg-base-200/40 border border-base-content/5 flex flex-col justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-base-content">
                      {t("audioTitle")}
                    </span>
                    <span className="badge badge-xs badge-neutral font-mono">
                      SHA-256
                    </span>
                  </div>
                  <span className="text-[11px] text-base-content/60 leading-relaxed">
                    {t("audioDesc")}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 p-2 bg-base-100 rounded-lg border border-base-content/5 font-mono text-xs">
                  <span className="truncate select-all text-primary font-semibold">
                    {report.fingerprints.audioHash}
                  </span>
                  <CopyButton
                    text={report.fingerprints.audioHash}
                    size="xs"
                    variant="ghost"
                  />
                </div>
              </div>
            </div>

            {/* WebGL Unmasked Hardware */}
            <div className="p-3.5 rounded-xl bg-base-200/40 border border-base-content/5 flex flex-col gap-2">
              <span className="text-xs font-bold text-base-content">
                {t("webglTitle")}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2 bg-base-100 rounded-lg border border-base-content/5 flex flex-col gap-0.5">
                  <span className="text-[10px] uppercase font-bold text-base-content/50">
                    Vendor
                  </span>
                  <span className="text-base-content select-all truncate">
                    {report.fingerprints.webglVendor}
                  </span>
                </div>
                <div className="p-2 bg-base-100 rounded-lg border border-base-content/5 flex flex-col gap-0.5">
                  <span className="text-[10px] uppercase font-bold text-base-content/50">
                    Renderer / GPU
                  </span>
                  <span className="text-primary font-bold select-all truncate">
                    {report.fingerprints.webglRenderer}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2 : Fuites Réseau & WebRTC */}
          <div className="card card-border bg-base-100 p-5 sm:p-6 shadow-sm flex flex-col gap-4">
            <div className="border-b border-base-content/10 pb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-base-content flex items-center gap-2">
                <span className="icon-[lucide--network] size-4 text-primary"></span>
                {t("networkTitle")}
              </span>
              <p className="text-xs text-base-content/60 mt-0.5">
                {t("networkDesc")}
              </p>
            </div>

            <div
              className={`alert alert-soft ${
                report.webrtc.status === "leaked"
                  ? "alert-error"
                  : "alert-success"
              } flex items-start sm:items-center justify-between gap-4 p-4`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`size-5 shrink-0 ${
                    report.webrtc.status === "leaked"
                      ? "icon-[lucide--shield-alert] text-error"
                      : "icon-[lucide--shield-check] text-success"
                  }`}
                ></span>
                <div className="flex flex-col">
                  <span className="font-bold text-xs uppercase tracking-wider text-base-content/70">
                    {t("webrtcStatusTitle")}
                  </span>
                  <span className="font-semibold text-sm text-base-content">
                    {report.webrtc.status === "leaked"
                      ? t("webrtcLeaked")
                      : report.webrtc.status === "protected"
                      ? t("webrtcProtected")
                      : t("webrtcUnsupported")}
                  </span>
                </div>
              </div>

              <span
                className={`badge badge-sm font-bold ${
                  report.webrtc.status === "leaked"
                    ? "badge-error"
                    : "badge-success"
                }`}
              >
                {report.webrtc.status.toUpperCase()}
              </span>
            </div>

            {report.webrtc.ips.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-base-content/70">
                  {t("detectedIps")} :
                </span>
                <div className="flex flex-wrap gap-2">
                  {report.webrtc.ips.map((ip, idx) => (
                    <span
                      key={idx}
                      className="badge badge-sm badge-soft badge-error font-mono px-3 py-2 select-all"
                    >
                      {ip}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Section 3 : Télémétrie Matérielle & Signaux Navigateur (2 Colonnes) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Télémétrie Matérielle */}
            <div className="card card-border bg-base-100 p-5 shadow-sm flex flex-col gap-3">
              <div className="border-b border-base-content/10 pb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-base-content flex items-center gap-2">
                  <span className="icon-[lucide--cpu] size-4 text-primary"></span>
                  {t("hardwareTitle")}
                </span>
                <p className="text-[11px] text-base-content/60 mt-0.5">
                  {t("hardwareDesc")}
                </p>
              </div>

              <div className="flex flex-col gap-2 text-xs">
                <div className="flex justify-between items-center py-1.5 border-b border-base-content/5">
                  <span className="text-base-content/60">{t("cpuCores")}</span>
                  <span className="font-mono font-bold text-base-content">
                    {report.hardware.cores}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-base-content/5">
                  <span className="text-base-content/60">{t("ramEstimate")}</span>
                  <span className="font-mono font-bold text-base-content">
                    {report.hardware.memory}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-base-content/5">
                  <span className="text-base-content/60">{t("screenRes")}</span>
                  <span className="font-mono text-base-content">
                    {report.hardware.screen}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-base-content/5">
                  <span className="text-base-content/60">{t("colorDepth")}</span>
                  <span className="font-mono text-base-content">
                    {report.hardware.colorDepth}-bit
                  </span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-base-content/5">
                  <span className="text-base-content/60">{t("pixelRatio")}</span>
                  <span className="font-mono text-base-content">
                    {report.hardware.pixelRatio}x
                  </span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-base-content/60">{t("touchSupport")}</span>
                  <span className="font-mono text-base-content">
                    {report.hardware.touchPoints}
                  </span>
                </div>
              </div>
            </div>

            {/* Signaux Navigateur & DNT */}
            <div className="card card-border bg-base-100 p-5 shadow-sm flex flex-col gap-3">
              <div className="border-b border-base-content/10 pb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-base-content flex items-center gap-2">
                  <span className="icon-[lucide--globe] size-4 text-primary"></span>
                  {t("browserSignalsTitle")}
                </span>
                <p className="text-[11px] text-base-content/60 mt-0.5">
                  {t("browserSignalsDesc")}
                </p>
              </div>

              <div className="flex flex-col gap-2 text-xs">
                <div className="flex justify-between items-center py-1.5 border-b border-base-content/5">
                  <span className="text-base-content/60">{t("timezone")}</span>
                  <span className="font-mono font-bold text-primary select-all">
                    {report.browser.timezone}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-base-content/5">
                  <span className="text-base-content/60">{t("doNotTrack")}</span>
                  <span
                    className={`badge badge-xs font-semibold ${
                      report.browser.doNotTrack
                        ? "badge-success"
                        : "badge-neutral"
                    }`}
                  >
                    {report.browser.doNotTrack ? t("enabled") : t("disabled")}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-base-content/5">
                  <span className="text-base-content/60">{t("platform")}</span>
                  <span className="font-mono text-base-content">
                    {report.browser.platform}
                  </span>
                </div>
                <div className="flex flex-col gap-1 py-1.5">
                  <span className="text-base-content/60">{t("userAgent")}</span>
                  <span className="font-mono text-[11px] p-2 bg-base-200/50 rounded-lg break-all select-all text-base-content/80 leading-relaxed border border-base-content/5">
                    {report.browser.userAgent}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
