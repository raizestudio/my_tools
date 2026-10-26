// app/components/qr/QrCodeGeneratorComponent.tsx
"use client";

import { useState, useRef, useMemo } from "react";
import { useTranslations } from "next-intl";
import { QRCodeCanvas } from "qrcode.react";
import { Link } from "@/i18n/routing";

import ToolHeader from "@/app/components/ui/ToolHeaderComponent";

type Mode = "wifi" | "url" | "text";
type AuthType = "WPA" | "WEP" | "nopass";
type ErrorLevel = "L" | "M" | "Q" | "H";

// Limites physiques maximales d'un QR code (Version 40 en mode binaire)
const QR_MAX_BYTES: Record<ErrorLevel, number> = {
  L: 2950, // Faible (~7% de récupération)
  M: 2330, // Moyenne (~15% de récupération)
  Q: 1660, // Quartile (~25% de récupération)
  H: 1270, // Haute (~30% de récupération)
};

export default function QrCodeGeneratorComponent() {
  const t = useTranslations("tools.qrCode");
  const tCommon = useTranslations("common");

  const [mode, setMode] = useState<Mode>("wifi");

  // URL / Plain Text State
  const [textContent, setTextContent] = useState("https://0w.lat");

  // Wi-Fi Specific State
  const [ssid, setSsid] = useState("MyHomeWifi");
  const [password, setPassword] = useState("");
  const [authType, setAuthType] = useState<AuthType>("WPA");
  const [isHidden, setIsHidden] = useState(false);

  // Customization State
  const [fgColor, setFgColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [errorLevel, setErrorLevel] = useState<ErrorLevel>("M");
  const [size, setSize] = useState(256);
  const [includeMargin, setIncludeMargin] = useState(true);

  const qrRef = useRef<HTMLDivElement>(null);

  // Format Wi-Fi standard ZXing
  const getWifiString = () => {
    const escapeWifi = (str: string) => str.replace(/([\\;,:"])/g, "\\$1");
    const escapedSsid = escapeWifi(ssid);
    const escapedPass = escapeWifi(password);
    const hiddenStr = isHidden ? "H:true;" : "";

    if (authType === "nopass") {
      return `WIFI:T:nopass;S:${escapedSsid};${hiddenStr};`;
    }
    return `WIFI:T:${authType};S:${escapedSsid};P:${escapedPass};${hiddenStr};`;
  };

  const qrValue = mode === "wifi" ? getWifiString() : textContent;

  // Calcul réel de la taille en octets
  const byteLength = useMemo(() => {
    return new TextEncoder().encode(qrValue).length;
  }, [qrValue]);

  const maxAllowedBytes = QR_MAX_BYTES[errorLevel];
  const isTooLong = byteLength > maxAllowedBytes;

  const downloadPng = () => {
    if (isTooLong || !qrRef.current) return;
    const canvas = qrRef.current.querySelector("canvas");
    if (!canvas) return;

    const link = document.createElement("a");
    link.download = `qr-${mode}-${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const handlePrint = () => {
    if (isTooLong) return;
    window.print();
  };

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto w-full">
      {/* Header & Fil d'Ariane */}
      <ToolHeader
        title={t("title")}
        description={t("desc")}
        icon="icon-[lucide--qr-code]"
        badge={
          <span className="badge badge-sm badge-soft badge-success">
            {t("offlineBadge")}
          </span>
        }
      />

      {/* Mode Switcher Tabs */}
      <div className="join w-full grid grid-cols-3 bg-base-200/50 p-1 rounded-xl print:hidden">
        <button
          type="button"
          onClick={() => setMode("wifi")}
          className={`btn btn-sm join-item ${
            mode === "wifi" ? "btn-primary shadow-sm" : "btn-ghost text-base-content/70"
          }`}
        >
          <span className="icon-[lucide--wifi] size-4"></span>
          <span>{t("tabWifi")}</span>
        </button>
        <button
          type="button"
          onClick={() => setMode("url")}
          className={`btn btn-sm join-item ${
            mode === "url" ? "btn-primary shadow-sm" : "btn-ghost text-base-content/70"
          }`}
        >
          <span className="icon-[lucide--link] size-4"></span>
          <span>{t("tabUrl")}</span>
        </button>
        <button
          type="button"
          onClick={() => setMode("text")}
          className={`btn btn-sm join-item ${
            mode === "text" ? "btn-primary shadow-sm" : "btn-ghost text-base-content/70"
          }`}
        >
          <span className="icon-[lucide--file-text] size-4"></span>
          <span>{t("tabText")}</span>
        </button>
      </div>

      {/* 2-Columns layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Controls Column */}
        <div className="lg:col-span-7 flex flex-col gap-4 print:hidden">
          {/* Mode-specific Fields */}
          {mode === "wifi" ? (
            <div className="card card-border bg-base-100 p-5 shadow-sm flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-base-content/70">
                  {t("networkSsid")}
                </label>
                <input
                  type="text"
                  value={ssid}
                  onChange={(e) => setSsid(e.target.value)}
                  placeholder={t("networkSsidPlaceholder")}
                  className="input input-sm input-bordered w-full font-mono text-xs focus:outline-primary"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-base-content/70">
                    {t("security")}
                  </label>
                  <select
                    value={authType}
                    onChange={(e) => setAuthType(e.target.value as AuthType)}
                    className="select select-sm select-bordered w-full text-xs"
                  >
                    <option value="WPA">{t("secWpa")}</option>
                    <option value="WEP">{t("secWep")}</option>
                    <option value="nopass">{t("secNone")}</option>
                  </select>
                </div>

                {authType !== "nopass" && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-base-content/70">
                      {t("password")}
                    </label>
                    <input
                      type="text"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t("passwordPlaceholder")}
                      className="input input-sm input-bordered w-full font-mono text-xs focus:outline-primary"
                    />
                  </div>
                )}
              </div>

              <label className="label cursor-pointer justify-start gap-3 pt-1 border-t border-base-content/10">
                <input
                  type="checkbox"
                  checked={isHidden}
                  onChange={(e) => setIsHidden(e.target.checked)}
                  className="checkbox checkbox-sm checkbox-primary"
                />
                <span className="label-text text-xs text-base-content/80 font-medium">
                  {t("hiddenNetwork")}
                </span>
              </label>
            </div>
          ) : (
            <div className="card card-border bg-base-100 p-5 shadow-sm flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-base-content/70">
                  {mode === "url" ? t("targetUrl") : t("targetText")}
                </label>
                <span
                  className={`font-mono text-xs ${
                    isTooLong ? "text-error font-bold" : "text-base-content/50"
                  }`}
                >
                  {t("bytesCount", { count: byteLength, max: maxAllowedBytes })}
                </span>
              </div>
              <textarea
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                rows={mode === "url" ? 2 : 5}
                placeholder={mode === "url" ? "https://0w.lat" : t("textPlaceholder")}
                className={`textarea textarea-bordered w-full font-mono text-xs resize-y focus:outline-primary ${
                  isTooLong ? "border-error focus:border-error" : ""
                }`}
              />
              {isTooLong && (
                <div className="alert alert-soft alert-error text-xs p-2.5 flex items-center gap-2 mt-1">
                  <span className="icon-[lucide--alert-circle] size-4 shrink-0"></span>
                  <span>{t("tooLongAlert")}</span>
                </div>
              )}
            </div>
          )}

          {/* Visual Customization Settings */}
          <div className="card card-border bg-base-100 p-5 shadow-sm flex flex-col gap-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-base-content/70">
              {t("visualSettings")}
            </span>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-base-content/70">
                  {t("fgColor")}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="size-8 rounded cursor-pointer border border-base-content/20 bg-transparent"
                  />
                  <span className="font-mono text-xs uppercase text-base-content/80">
                    {fgColor}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-base-content/70">
                  {t("bgColor")}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="size-8 rounded cursor-pointer border border-base-content/20 bg-transparent"
                  />
                  <span className="font-mono text-xs uppercase text-base-content/80">
                    {bgColor}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-base-content/10">
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-medium text-base-content/70">
                    {t("errorLevel")}
                  </label>
                </div>
                <select
                  value={errorLevel}
                  onChange={(e) => setErrorLevel(e.target.value as ErrorLevel)}
                  className="select select-sm select-bordered w-full text-xs"
                >
                  <option value="L">{t("errorLevelL")}</option>
                  <option value="M">{t("errorLevelM")}</option>
                  <option value="Q">{t("errorLevelQ")}</option>
                  <option value="H">{t("errorLevelH")}</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-base-content/70">
                  {t("exportSize", { size })}
                </label>
                <input
                  type="range"
                  min="128"
                  max="512"
                  step="32"
                  value={size}
                  onChange={(e) => setSize(Number(e.target.value))}
                  className="range range-primary range-xs mt-2"
                />
              </div>
            </div>

            <label className="label cursor-pointer justify-start gap-3 pt-1 border-t border-base-content/10">
              <input
                type="checkbox"
                checked={includeMargin}
                onChange={(e) => setIncludeMargin(e.target.checked)}
                className="checkbox checkbox-sm checkbox-primary"
              />
              <span className="label-text text-xs text-base-content/80">
                {t("marginLabel")}
              </span>
            </label>
          </div>
        </div>

        {/* Preview & Print Column */}
        <div className="lg:col-span-5 flex flex-col items-center gap-4 w-full">
          <div
            id="printable-card"
            className="bg-white text-neutral-900 p-6 rounded-2xl shadow-md border border-neutral-200 flex flex-col items-center gap-4 w-full max-w-sm text-center print:border-none print:shadow-none print:p-0"
          >
            {mode === "wifi" && (
              <div className="flex flex-col items-center gap-1">
                <span className="icon-[lucide--wifi] size-8 text-neutral-900"></span>
                <h3 className="font-bold text-lg leading-tight tracking-tight text-neutral-900">
                  {t("guestWifiTitle")}
                </h3>
                <p className="text-xs text-neutral-500 font-mono">
                  {t("guestWifiHint")}
                </p>
              </div>
            )}

            {/* QR Rendering */}
            <div
              ref={qrRef}
              className="p-2 bg-white rounded-lg inline-flex items-center justify-center min-h-50 w-full"
            >
              {isTooLong ? (
                <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-error/50 rounded-xl bg-error/5 text-error text-center gap-2 w-full">
                  <span className="icon-[lucide--alert-triangle] size-8 shrink-0"></span>
                  <span className="text-xs font-bold">{t("tooLongTitle")}</span>
                  <span className="text-[11px] text-neutral-600 leading-tight">
                    {t("tooLongDesc", {
                      count: byteLength,
                      max: maxAllowedBytes,
                    })}
                  </span>
                </div>
              ) : (
                <QRCodeCanvas
                  value={qrValue || " "}
                  size={size}
                  fgColor={fgColor}
                  bgColor={bgColor}
                  level={errorLevel}
                  includeMargin={includeMargin}
                  className="max-w-full h-auto"
                />
              )}
            </div>

            {mode === "wifi" && (
              <div className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 text-xs flex flex-col gap-1 text-left">
                <div className="flex justify-between items-center gap-2">
                  <span className="font-semibold text-neutral-600">
                    {t("networkLabel")}
                  </span>
                  <span className="font-mono font-bold text-neutral-900 truncate">
                    {ssid || "—"}
                  </span>
                </div>
                {authType !== "nopass" && password && (
                  <div className="flex justify-between items-center gap-2 border-t border-neutral-200 pt-1">
                    <span className="font-semibold text-neutral-600">
                      {t("passwordLabel")}
                    </span>
                    <span className="font-mono font-bold text-neutral-900 truncate">
                      {password}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 justify-center w-full max-w-sm print:hidden">
            <button
              type="button"
              onClick={downloadPng}
              disabled={isTooLong}
              className="btn btn-sm btn-primary flex-1 gap-1.5 disabled:opacity-50"
            >
              <span className="icon-[lucide--download] size-4"></span>
              <span>{t("downloadPng")}</span>
            </button>

            {mode === "wifi" && (
              <button
                type="button"
                onClick={handlePrint}
                disabled={isTooLong}
                className="btn btn-sm btn-outline flex-1 gap-1.5 disabled:opacity-50"
              >
                <span className="icon-[lucide--printer] size-4"></span>
                <span>{t("printCard")}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
