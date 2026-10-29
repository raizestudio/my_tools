// app/components/image-converter/studio/StudioControls.tsx
"use client";

import { useTranslations } from "next-intl";
import type { TargetFormat } from "@/app/lib/image-processor";
import type { AspectPreset, AspectOption, FormatOption } from "../types";

interface StudioControlsProps {
  aspectPreset: AspectPreset;
  aspectPresets: AspectOption[];
  onApplyAspectPreset: (preset: AspectPreset) => void;
  onRotate: (deg: -90 | 90) => void;
  onFlip: (axis: "H" | "V") => void;
  flipH: boolean;
  flipV: boolean;
  lockAspect: boolean;
  setLockAspect: (lock: boolean) => void;
  targetWidth: number;
  targetHeight: number;
  onWidthChange: (val: number) => void;
  onHeightChange: (val: number) => void;
  onCommitDimensions: () => void;
  onScaleMultiplier: (scale: number) => void;
  targetFormat: TargetFormat;
  setTargetFormat: (format: TargetFormat) => void;
  formatOptions: FormatOption[];
  quality: number;
  setQuality: (quality: number) => void;
  processing: boolean;
  onExport: () => void;
}

export default function StudioControls({
  aspectPreset,
  aspectPresets,
  onApplyAspectPreset,
  onRotate,
  onFlip,
  flipH,
  flipV,
  lockAspect,
  setLockAspect,
  targetWidth,
  targetHeight,
  onWidthChange,
  onHeightChange,
  onCommitDimensions,
  onScaleMultiplier,
  targetFormat,
  setTargetFormat,
  formatOptions,
  quality,
  setQuality,
  processing,
  onExport,
}: StudioControlsProps) {
  const t = useTranslations("tools.imageConverter");

  return (
    <div className="lg:col-span-4 flex flex-col gap-5 bg-base-100/60 p-5 rounded-2xl border border-base-content/10">
      {/* 1. Aspect Ratio */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold text-base-content flex items-center justify-between">
          <span>{t("aspectTitle")}</span>
          <span className="font-mono text-[10px] text-base-content/40 uppercase">
            {aspectPreset}
          </span>
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          {aspectPresets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => onApplyAspectPreset(preset.id)}
              className={`btn btn-xs rounded-lg font-mono text-[11px] ${
                aspectPreset === preset.id
                  ? "btn-primary shadow-xs font-semibold"
                  : "btn-soft text-base-content/70"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Orientation */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold text-base-content">
          {t("orientationTitle")}
        </label>
        <div className="grid grid-cols-4 gap-1.5">
          <button
            type="button"
            onClick={() => onRotate(-90)}
            title={t("rotateCcwTitle")}
            className="btn btn-sm btn-soft rounded-lg text-base-content/80"
          >
            <span className="icon-[lucide--rotate-ccw] size-4"></span>
          </button>
          <button
            type="button"
            onClick={() => onRotate(90)}
            title={t("rotateCwTitle")}
            className="btn btn-sm btn-soft rounded-lg text-base-content/80"
          >
            <span className="icon-[lucide--rotate-cw] size-4"></span>
          </button>
          <button
            type="button"
            onClick={() => onFlip("H")}
            title={t("flipHTitle")}
            className={`btn btn-sm rounded-lg ${
              flipH
                ? "btn-primary font-bold shadow-xs"
                : "btn-soft text-base-content/80"
            }`}
          >
            <span className="icon-[lucide--flip-horizontal] size-4"></span>
          </button>
          <button
            type="button"
            onClick={() => onFlip("V")}
            title={t("flipVTitle")}
            className={`btn btn-sm rounded-lg ${
              flipV
                ? "btn-primary font-bold shadow-xs"
                : "btn-soft text-base-content/80"
            }`}
          >
            <span className="icon-[lucide--flip-vertical] size-4"></span>
          </button>
        </div>
      </div>

      {/* 3. Output Dimensions */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-base-content">
            {t("dimensionsTitle")}
          </label>
          <button
            type="button"
            onClick={() => setLockAspect(!lockAspect)}
            className={`btn btn-ghost btn-xs gap-1 font-mono text-[10px] ${
              lockAspect ? "text-primary" : "text-base-content/40"
            }`}
          >
            <span
              className={`icon-[lucide--${lockAspect ? "link" : "unlink"}] size-3`}
            ></span>
            <span>{lockAspect ? t("aspectLocked") : t("aspectUnlocked")}</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center rounded-xl bg-base-200/50 border border-base-content/10 px-2.5 py-1 focus-within:border-primary/50">
            <span className="text-[10px] font-mono text-base-content/40 pr-1.5 select-none">
              {t("widthLabel")}
            </span>
            <input
              type="number"
              min="1"
              max="10000"
              value={targetWidth || ""}
              onChange={(e) => onWidthChange(parseInt(e.target.value) || 0)}
              onBlur={onCommitDimensions}
              className="bg-transparent font-mono text-xs w-full outline-none"
            />
          </div>
          <div className="flex items-center rounded-xl bg-base-200/50 border border-base-content/10 px-2.5 py-1 focus-within:border-primary/50">
            <span className="text-[10px] font-mono text-base-content/40 pr-1.5 select-none">
              {t("heightLabel")}
            </span>
            <input
              type="number"
              min="1"
              max="10000"
              value={targetHeight || ""}
              onChange={(e) => onHeightChange(parseInt(e.target.value) || 0)}
              onBlur={onCommitDimensions}
              className="bg-transparent font-mono text-xs w-full outline-none"
            />
          </div>
        </div>

        {/* Quick Multipliers */}
        <div className="flex items-center gap-1 pt-0.5">
          {[1, 0.75, 0.5, 0.25].map((scale) => (
            <button
              key={scale}
              type="button"
              onClick={() => onScaleMultiplier(scale)}
              className="btn btn-xs btn-soft rounded-lg flex-1 font-mono text-[10px]"
            >
              {scale * 100}%
            </button>
          ))}
        </div>
      </div>

      {/* 4. Format & Quality */}
      <div className="flex flex-col gap-3 pt-3 border-t border-base-content/5">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-base-content">
            {t("formatLabel")}
          </label>
          <select
            value={targetFormat}
            onChange={(e) => setTargetFormat(e.target.value as TargetFormat)}
            className="select select-sm w-full font-mono text-xs rounded-xl bg-base-200/50 border-base-content/10"
          >
            {formatOptions.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        {formatOptions.find((f) => f.id === targetFormat)?.hasQuality && (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold">{t("qualityLabel")}</span>
              <span className="font-mono text-primary font-bold">
                {quality}%
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              value={quality}
              onChange={(e) => setQuality(parseInt(e.target.value))}
              className="range range-xs range-primary"
            />
          </div>
        )}
      </div>

      <button
        type="button"
        disabled={processing}
        onClick={onExport}
        className="btn btn-primary btn-md rounded-xl font-semibold gap-2 shadow-sm shadow-primary/20 mt-2"
      >
        {processing ? (
          <>
            <span className="loading loading-spinner size-4"></span>
            <span>{t("processingSingle")}</span>
          </>
        ) : (
          <>
            <span className="icon-[lucide--download] size-4"></span>
            <span>{t("exportSingle")}</span>
          </>
        )}
      </button>
    </div>
  );
}
