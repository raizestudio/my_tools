// app/components/favicon/FaviconGeneratorComponent.tsx
"use client";

import { useState, useRef, useEffect, useMemo, ChangeEvent, DragEvent } from "react";
import { useTranslations } from "next-intl";
import JSZip from "jszip";
import ToolHeader from "@/app/components/ui/ToolHeaderComponent";
import CopyButton from "@/app/components/ui/CopyButtonComponent";
import { createIcoFromPngs } from "@/app/lib/ico";

interface RenderedAsset {
  fileName: string;
  size: number;
  dataUrl: string;
  bytes: Uint8Array;
}

type CodeTab = "html" | "nextjs" | "manifest";

const TARGET_SIZES = [
  { size: 16, fileName: "favicon-16x16.png" },
  { size: 32, fileName: "favicon-32x32.png" },
  { size: 48, fileName: "favicon-48x48.png" }, // Packed into favicon.ico
  { size: 180, fileName: "apple-touch-icon.png" },
  { size: 192, fileName: "android-chrome-192x192.png" },
  { size: 512, fileName: "android-chrome-512x512.png" },
];

export default function FaviconGeneratorComponent() {
  const t = useTranslations("tools.faviconGenerator");

  const [imageSource, setImageSource] = useState<string | null>(null);
  const [paddingPercent, setPaddingPercent] = useState<number>(5);
  const [bgColor, setBgColor] = useState<string>("transparent");
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [activeCodeTab, setActiveCodeTab] = useState<CodeTab>("html");

  const [renderedAssets, setRenderedAssets] = useState<Map<number, RenderedAsset>>(new Map());
  const [icoBlobUrl, setIcoBlobUrl] = useState<string | null>(null);
  const [icoBytes, setIcoBytes] = useState<Uint8Array | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate SVG sample on demand
  const handleLoadSample = () => {
    const sampleSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#3b82f6" />
            <stop offset="100%" stop-color="#8b5cf6" />
          </linearGradient>
        </defs>
        <rect width="200" height="200" rx="44" fill="url(#grad)" />
        <path d="M100 45 L155 75 L155 125 L100 155 L45 125 L45 75 Z" fill="none" stroke="#ffffff" stroke-width="12" stroke-linejoin="round" />
        <circle cx="100" cy="100" r="22" fill="#ffffff" />
      </svg>
    `.trim();

    const blob = new Blob([sampleSvg], { type: "image/svg+xml" });
    setImageSource(URL.createObjectURL(blob));
  };

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    setImageSource(url);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) handleFile(e.target.files[0]);
  };

  // Render all resolution variants onto in-memory canvases whenever source or settings change
  useEffect(() => {
    if (!imageSource) {
      setRenderedAssets(new Map());
      setIcoBlobUrl(null);
      setIcoBytes(null);
      return;
    }

    let isCancelled = false;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageSource;

    img.onload = () => {
      if (isCancelled) return;
      const assetMap = new Map<number, RenderedAsset>();

      for (const target of TARGET_SIZES) {
        const canvas = document.createElement("canvas");
        canvas.width = target.size;
        canvas.height = target.size;
        const ctx = canvas.getContext("2d");
        if (!ctx) continue;

        // 1. Draw optional background
        if (bgColor !== "transparent") {
          ctx.fillStyle = bgColor;
          ctx.fillRect(0, 0, target.size, target.size);
        } else {
          ctx.clearRect(0, 0, target.size, target.size);
        }

        // 2. Compute aspect ratio and padding margins
        const pad = target.size * (paddingPercent / 100);
        const availWidth = target.size - 2 * pad;
        const availHeight = target.size - 2 * pad;
        const aspect = img.width / img.height;

        let drawW = availWidth;
        let drawH = availHeight;
        if (aspect > 1) {
          drawH = availWidth / aspect;
        } else {
          drawW = availHeight * aspect;
        }

        const drawX = pad + (availWidth - drawW) / 2;
        const drawY = pad + (availHeight - drawH) / 2;

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, drawX, drawY, drawW, drawH);

        const dataUrl = canvas.toDataURL("image/png");
        const b64 = dataUrl.split(",")[1];
        const binary = atob(b64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }

        assetMap.set(target.size, {
          fileName: target.fileName,
          size: target.size,
          dataUrl,
          bytes,
        });
      }

      // 3. Assemble binary multi-resolution .ico from 16, 32, and 48 PNGs
      const p16 = assetMap.get(16);
      const p32 = assetMap.get(32);
      const p48 = assetMap.get(48);

      if (p16 && p32 && p48) {
        const packedIco = createIcoFromPngs([
          { width: 16, height: 16, bytes: p16.bytes },
          { width: 32, height: 32, bytes: p32.bytes },
          { width: 48, height: 48, bytes: p48.bytes },
        ]);

        const icoBlob = new Blob([packedIco as BlobPart], { type: "image/x-icon" });
        setIcoBytes(packedIco);
        setIcoBlobUrl(URL.createObjectURL(icoBlob));
      }

      setRenderedAssets(assetMap);
    };

    return () => {
      isCancelled = true;
    };
  }, [imageSource, paddingPercent, bgColor]);

  // Download individual asset
  const handleDownloadSingle = (dataUrl: string, fileName: string) => {
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = fileName;
    link.click();
  };

  // Generate webmanifest JSON content
  const webManifestContent = useMemo(() => {
    const manifest = {
      name: "My Application",
      short_name: "App",
      icons: [
        {
          src: "/android-chrome-192x192.png",
          sizes: "192x192",
          type: "image/png",
        },
        {
          src: "/android-chrome-512x512.png",
          sizes: "512x512",
          type: "image/png",
        },
      ],
      theme_color: bgColor !== "transparent" ? bgColor : "#ffffff",
      background_color: bgColor !== "transparent" ? bgColor : "#ffffff",
      display: "standalone",
    };
    return JSON.stringify(manifest, null, 2);
  }, [bgColor]);

  // Code snippets
  const htmlSnippet = `<!-- Standard Favicons -->
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">

<!-- Apple Touch Icon -->
<link rel="apple-touch-icon" href="/apple-touch-icon.png">

<!-- PWA WebManifest -->
<link rel="manifest" href="/site.webmanifest">`;

  const nextJsSnippet = `import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Application",
  description: "Built with 0w privacy toolkit",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png" },
    ],
  },
  manifest: "/site.webmanifest",
};`;

  // Package all assets and manifest into a single ZIP file
  const handleDownloadZip = async () => {
    if (!icoBytes || renderedAssets.size === 0) return;
    setIsExporting(true);

    try {
      const zip = new JSZip();

      // 1. Add binary favicon.ico
      zip.file("favicon.ico", icoBytes);

      // 2. Add individual PNG icons
      for (const asset of Array.from(renderedAssets.values())) {
        if (asset.size === 48) continue; // 48x48 is bundled inside favicon.ico
        zip.file(asset.fileName, asset.bytes);
      }

      // 3. Add site.webmanifest
      zip.file("site.webmanifest", webManifestContent);

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const downloadUrl = URL.createObjectURL(zipBlob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = "favicon_pack.zip";
      link.click();
      URL.revokeObjectURL(downloadUrl);
    } catch (err: unknown) {
      console.error("ZIP creation failed:", err);
    } finally {
      setIsExporting(false);
    }
  };

  const preview32 = renderedAssets.get(32)?.dataUrl;
  const preview180 = renderedAssets.get(180)?.dataUrl;
  const preview192 = renderedAssets.get(192)?.dataUrl;

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto w-full">
      <ToolHeader
        title={t("title")}
        description={t("desc")}
        icon="icon-[lucide--sparkles]"
        badge={
          <span className="badge badge-sm badge-soft badge-primary">
            {t("badgeOffline")}
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleLoadSample}
              className="btn btn-xs btn-outline"
            >
              {t("loadSample")}
            </button>
            {imageSource && (
              <button
                type="button"
                onClick={() => {
                  setImageSource(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="btn btn-xs btn-ghost text-base-content/60"
              >
                {t("clear")}
              </button>
            )}
          </div>
        }
      />

      {/* Upload Dropzone */}
      {!imageSource && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`card card-border border-2 border-dashed p-12 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all duration-200 text-center ${
            isDragging
              ? "border-primary bg-primary/5 scale-[0.99]"
              : "border-base-content/20 hover:border-primary/50 hover:bg-base-200/30"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/svg+xml,image/png,image/webp,image/jpeg"
            onChange={handleFileInput}
            className="hidden"
          />

          <div className="size-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <span className="icon-[lucide--image-plus] size-8"></span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="font-semibold text-sm text-base-content">
              {t("dropzoneTitle")}
            </span>
            <span className="text-xs text-base-content/60 max-w-md">
              {t("dropzoneHint")}
            </span>
          </div>

          <span className="badge badge-sm badge-soft badge-success">
            100% In-Memory Processing
          </span>
        </div>
      )}

      {/* Editor & Preview Workspace */}
      {imageSource && (
        <div className="flex flex-col gap-8 animate-in fade-in duration-200">
          {/* Controls Bar */}
          <div className="card card-border bg-base-100 p-5 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              {/* Padding Slider */}
              <div className="flex flex-col gap-1.5 min-w-50">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-base-content/70">
                    {t("paddingLabel")}
                  </span>
                  <span className="font-mono font-bold text-primary">
                    {paddingPercent}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="25"
                  step="1"
                  value={paddingPercent}
                  onChange={(e) => setPaddingPercent(parseInt(e.target.value, 10))}
                  className="range range-xs range-primary"
                />
              </div>

              {/* Background Preset Buttons */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-base-content/70">
                  {t("bgColorLabel")}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setBgColor("transparent")}
                    className={`btn btn-xs ${
                      bgColor === "transparent" ? "btn-primary" : "btn-outline"
                    }`}
                  >
                    {t("transparent")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setBgColor("#ffffff")}
                    className={`btn btn-xs ${
                      bgColor === "#ffffff" ? "btn-primary" : "btn-outline"
                    }`}
                  >
                    {t("white")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setBgColor("#0f172a")}
                    className={`btn btn-xs ${
                      bgColor === "#0f172a" ? "btn-primary" : "btn-outline"
                    }`}
                  >
                    {t("dark")}
                  </button>
                </div>
              </div>
            </div>

            {/* Global ZIP Export Action */}
            <button
              type="button"
              disabled={isExporting}
              onClick={handleDownloadZip}
              className="btn btn-primary btn-sm gap-2 shrink-0"
            >
              {isExporting ? (
                <span className="loading loading-spinner size-4"></span>
              ) : (
                <span className="icon-[lucide--download] size-4"></span>
              )}
              <span>
                {isExporting ? t("generatingZip") : t("downloadAllZip")}
              </span>
            </button>
          </div>

          {/* Real-World Mockup Previews */}
          <div className="flex flex-col gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-base-content/70 flex items-center gap-2">
              <span className="icon-[lucide--eye] size-4 text-primary"></span>
              {t("previewsTitle")}
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 1. Browser Tab Mockup */}
              <div className="card card-border bg-base-100 p-4 shadow-sm flex flex-col justify-between gap-3">
                <span className="text-[11px] font-semibold text-base-content/60">
                  {t("browserTab")}
                </span>
                <div className="w-full bg-base-200/80 rounded-t-lg p-2 flex items-center gap-2 border border-base-content/10">
                  <div className="bg-base-100 rounded-md px-3 py-1.5 flex items-center gap-2 shadow-sm max-w-47.5 w-full">
                    {preview32 && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={preview32} alt="Favicon" className="size-4 shrink-0" />
                    )}
                    <span className="text-[11px] font-medium text-base-content truncate">
                      My Application
                    </span>
                  </div>
                  <div className="flex items-center gap-1 ml-auto opacity-40">
                    <div className="size-2 rounded-full bg-base-content"></div>
                    <div className="size-2 rounded-full bg-base-content"></div>
                  </div>
                </div>
              </div>

              {/* 2. Google Search Result Mockup */}
              <div className="card card-border bg-base-100 p-4 shadow-sm flex flex-col justify-between gap-3">
                <span className="text-[11px] font-semibold text-base-content/60">
                  {t("googleSearch")}
                </span>
                <div className="p-3 bg-base-200/40 rounded-lg border border-base-content/5 flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <div className="size-5 rounded-full bg-base-300 flex items-center justify-center overflow-hidden p-0.5 shrink-0">
                      {preview32 && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={preview32} alt="Favicon" className="size-3.5" />
                      )}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[11px] font-medium text-base-content truncate">
                        myapp.com
                      </span>
                      <span className="text-[9px] text-base-content/50 truncate">
                        https://myapp.com
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-primary truncate hover:underline cursor-pointer mt-0.5">
                    My Application — Official Website
                  </span>
                </div>
              </div>

              {/* 3. iOS Home Screen Mockup */}
              <div className="card card-border bg-base-100 p-4 shadow-sm flex flex-col items-center justify-between gap-3 text-center">
                <span className="text-[11px] font-semibold text-base-content/60 self-start">
                  {t("iosHome")}
                </span>
                <div className="flex flex-col items-center gap-1.5 my-auto">
                  <div className="size-15 rounded-[18px] bg-base-300 shadow-md flex items-center justify-center overflow-hidden border border-black/10">
                    {preview180 && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={preview180} alt="iOS Icon" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <span className="text-[11px] font-medium text-base-content">
                    My App
                  </span>
                </div>
              </div>

              {/* 4. Android Home Screen Mockup */}
              <div className="card card-border bg-base-100 p-4 shadow-sm flex flex-col items-center justify-between gap-3 text-center">
                <span className="text-[11px] font-semibold text-base-content/60 self-start">
                  {t("androidHome")}
                </span>
                <div className="flex flex-col items-center gap-1.5 my-auto">
                  <div className="size-15 rounded-full bg-base-300 shadow-md flex items-center justify-center overflow-hidden border border-black/10">
                    {preview192 && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={preview192} alt="Android Icon" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <span className="text-[11px] font-medium text-base-content">
                    My App
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Generated Assets Grid */}
          <div className="card card-border bg-base-100 p-5 shadow-sm flex flex-col gap-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-base-content/70 flex items-center gap-2 border-b border-base-content/10 pb-3">
              <span className="icon-[lucide--package-check] size-4 text-primary"></span>
              {t("generatedAssetsTitle")}
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {/* Binary favicon.ico row */}
              {icoBlobUrl && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-base-200/40 border border-base-content/5 gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="icon-[lucide--file-box] size-6 text-primary shrink-0"></span>
                    <div className="flex flex-col min-w-0">
                      <span className="font-mono text-xs font-bold text-base-content truncate">
                        favicon.ico
                      </span>
                      <span className="text-[10px] text-base-content/60 truncate">
                        {t("icoDescription")}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDownloadSingle(icoBlobUrl, "favicon.ico")}
                    className="btn btn-xs btn-outline shrink-0"
                  >
                    {t("downloadItem")}
                  </button>
                </div>
              )}

              {/* PNG assets */}
              {Array.from(renderedAssets.values())
                .filter((a) => a.size !== 48)
                .map((asset) => (
                  <div
                    key={asset.fileName}
                    className="flex items-center justify-between p-3 rounded-xl bg-base-200/40 border border-base-content/5 gap-2"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="size-7 rounded bg-base-300/60 p-0.5 flex items-center justify-center shrink-0 overflow-hidden border border-base-content/5">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={asset.dataUrl} alt={asset.fileName} className="max-w-full max-h-full" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-mono text-xs font-bold text-base-content truncate">
                          {asset.fileName}
                        </span>
                        <span className="text-[10px] text-base-content/60">
                          {asset.size} × {asset.size} px
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDownloadSingle(asset.dataUrl, asset.fileName)}
                      className="btn btn-xs btn-outline shrink-0"
                    >
                      {t("downloadItem")}
                    </button>
                  </div>
                ))}
            </div>
          </div>

          {/* Setup Code Snippets */}
          <div className="card card-border bg-base-100 p-5 shadow-sm flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-base-content/10 pb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-base-content/70 flex items-center gap-2">
                <span className="icon-[lucide--code-2] size-4 text-primary"></span>
                {t("codeSnippetTitle")}
              </span>

              <div className="flex items-center gap-2">
                <div className="join">
                  <button
                    type="button"
                    onClick={() => setActiveCodeTab("html")}
                    className={`join-item btn btn-xs ${
                      activeCodeTab === "html" ? "btn-primary" : "btn-ghost"
                    }`}
                  >
                    {t("tabHtml")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveCodeTab("nextjs")}
                    className={`join-item btn btn-xs ${
                      activeCodeTab === "nextjs" ? "btn-primary" : "btn-ghost"
                    }`}
                  >
                    {t("tabNextJs")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveCodeTab("manifest")}
                    className={`join-item btn btn-xs ${
                      activeCodeTab === "manifest" ? "btn-primary" : "btn-ghost"
                    }`}
                  >
                    {t("tabManifest")}
                  </button>
                </div>

                <CopyButton
                  text={
                    activeCodeTab === "html"
                      ? htmlSnippet
                      : activeCodeTab === "nextjs"
                      ? nextJsSnippet
                      : webManifestContent
                  }
                  size="xs"
                  variant="outline"
                />
              </div>
            </div>

            <pre className="p-3 bg-base-200/50 rounded-xl font-mono text-xs overflow-x-auto text-base-content/90 border border-base-content/5 leading-relaxed">
              <code>
                {activeCodeTab === "html" && htmlSnippet}
                {activeCodeTab === "nextjs" && nextJsSnippet}
                {activeCodeTab === "manifest" && webManifestContent}
              </code>
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
