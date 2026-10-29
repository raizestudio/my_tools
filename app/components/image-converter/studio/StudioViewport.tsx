// app/components/image-converter/studio/StudioViewport.tsx
"use client";

import { RefObject } from "react";
import { useTranslations } from "next-intl";
import ReactCrop, { type Crop, type PixelCrop } from "react-image-crop";
import type { ImageItem, AspectOption, AspectPreset } from "../types";

interface StudioViewportProps {
  activeItem: ImageItem;
  items: ImageItem[];
  selectedIdx: number;
  onSelectIdx: (index: number) => void;
  imgRef: RefObject<HTMLImageElement | null>;
  studioView: "framing" | "result";
  setStudioView: (view: "framing" | "result") => void;
  crop?: Crop;
  setCrop: (crop: Crop) => void;
  onCropComplete: (crop: PixelCrop) => void;
  aspectPreset: AspectPreset;
  aspectPresets: AspectOption[];
  rotate: 0 | 90 | 180 | 270;
  flipH: boolean;
  flipV: boolean;
  livePreviewUrl: string | null;
  estimatedSize: number;
  isGeneratingPreview: boolean;
  showOriginal: boolean;
  setShowOriginal: (val: boolean) => void;
  targetWidth: number;
  targetHeight: number;
  undo: () => void;
  redo: () => void;
  resetEdits: () => void;
  canUndo: boolean;
  canRedo: boolean;
  formatBytes: (bytes: number) => string;
}

export default function StudioViewport({
  activeItem,
  items,
  selectedIdx,
  onSelectIdx,
  imgRef,
  studioView,
  setStudioView,
  crop,
  setCrop,
  onCropComplete,
  aspectPreset,
  aspectPresets,
  rotate,
  flipH,
  flipV,
  livePreviewUrl,
  estimatedSize,
  isGeneratingPreview,
  showOriginal,
  setShowOriginal,
  // targetWidth,
  // targetHeight,
  undo,
  redo,
  resetEdits,
  canUndo,
  canRedo,
  formatBytes,
}: StudioViewportProps) {
  const t = useTranslations("tools.imageConverter");

  const sizeDeltaPercent = estimatedSize
    ? Math.round(((estimatedSize - activeItem.size) / activeItem.size) * 100)
    : 0;

  return (
    <div className="lg:col-span-8 flex flex-col gap-3">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-base-100/60 p-2 rounded-xl border border-base-content/5">
        <div className="join bg-base-200/80 p-0.5 rounded-lg border border-base-content/5">
          <button
            type="button"
            onClick={() => setStudioView("framing")}
            className={`btn btn-xs join-item rounded-md font-medium gap-1.5 ${
              studioView === "framing"
                ? "btn-primary shadow-xs"
                : "btn-ghost text-base-content/70"
            }`}
          >
            <span className="icon-[lucide--crop] size-3.5"></span>
            <span>{t("tabFraming")}</span>
          </button>
          <button
            type="button"
            onClick={() => setStudioView("result")}
            className={`btn btn-xs join-item rounded-md font-medium gap-1.5 ${
              studioView === "result"
                ? "btn-primary shadow-xs"
                : "btn-ghost text-base-content/70"
            }`}
          >
            <span className="icon-[lucide--eye] size-3.5"></span>
            <span>{t("tabResult")}</span>
            {isGeneratingPreview ? (
              <span className="loading loading-spinner size-3 ml-0.5"></span>
            ) : (
              estimatedSize > 0 && (
                <span className="badge badge-xs badge-neutral font-mono font-bold ml-1">
                  {formatBytes(estimatedSize)}
                </span>
              )
            )}
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={undo}
            disabled={!canUndo}
            className="btn btn-xs btn-ghost rounded-lg text-base-content/70 disabled:opacity-30"
            title={t("undo")}
          >
            <span className="icon-[lucide--undo] size-3.5"></span>
          </button>
          <button
            type="button"
            onClick={redo}
            disabled={!canRedo}
            className="btn btn-xs btn-ghost rounded-lg text-base-content/70 disabled:opacity-30"
            title={t("redo")}
          >
            <span className="icon-[lucide--redo] size-3.5"></span>
          </button>
          <div className="w-px h-4 bg-base-content/10 mx-1"></div>
          <button
            type="button"
            onClick={resetEdits}
            className="btn btn-xs btn-ghost rounded-lg text-warning/80 hover:text-warning gap-1"
            title={t("reset")}
          >
            <span className="icon-[lucide--rotate-ccw] size-3.5"></span>
            <span className="hidden sm:inline">{t("reset")}</span>
          </button>
        </div>
      </div>

      {/* Main View Area */}
      <div className="relative rounded-2xl bg-base-300/40 border border-base-content/10 min-h-105 flex items-center justify-center p-4 overflow-hidden">
        {studioView === "framing" ? (
          <div
            style={{
              transform: `rotate(${rotate}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`,
              transition: "transform 0.2s cubic-bezier(0.2, 0, 0, 1)",
            }}
            className="max-h-115 flex items-center justify-center"
          >
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={onCropComplete}
              aspect={aspectPresets.find((p) => p.id === aspectPreset)?.value}
              className="max-h-115 object-contain rounded-lg shadow-md"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={imgRef}
                src={activeItem.previewUrl}
                alt="Target"
                className="max-h-115 max-w-full object-contain"
              />
            </ReactCrop>
          </div>
        ) : (
          <div className="relative size-full flex flex-col items-center justify-center">
            {livePreviewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={showOriginal ? activeItem.previewUrl : livePreviewUrl}
                alt="Live Output"
                className="max-h-105 max-w-full object-contain rounded-lg shadow-md transition-all"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-base-content/40">
                <span className="loading loading-spinner size-6"></span>
                <span className="font-mono text-xs">
                  {t("generatingPreview")}
                </span>
              </div>
            )}

            <div className="absolute bottom-3 inset-x-4 flex items-center justify-between pointer-events-none">
              <button
                type="button"
                onMouseDown={() => setShowOriginal(true)}
                onMouseUp={() => setShowOriginal(false)}
                onTouchStart={() => setShowOriginal(true)}
                onTouchEnd={() => setShowOriginal(false)}
                className="btn btn-xs btn-neutral/80 backdrop-blur-md rounded-lg pointer-events-auto gap-1 text-[11px] shadow-sm select-none"
              >
                <span className="icon-[lucide--split] size-3.5"></span>
                <span>{t("holdToCompare")}</span>
              </button>

              <div className="badge badge-neutral/80 backdrop-blur-md font-mono text-[11px] px-3 py-2 rounded-lg shadow-sm">
                {formatBytes(activeItem.size)} → {formatBytes(estimatedSize)}
                <span
                  className={`ml-1 font-bold ${sizeDeltaPercent <= 0 ? "text-success" : "text-warning"}`}
                >
                  (
                  {sizeDeltaPercent > 0
                    ? `+${sizeDeltaPercent}`
                    : sizeDeltaPercent}
                  %)
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Thumbnail Filmstrip */}
      {items.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto py-1 px-0.5">
          {items.map((it, idx) => (
            <button
              key={it.id}
              type="button"
              onClick={() => onSelectIdx(idx)}
              className={`size-14 rounded-xl border overflow-hidden shrink-0 transition-all ${
                idx === selectedIdx
                  ? "border-primary ring-2 ring-primary/20 scale-105"
                  : "border-base-content/10 opacity-50 hover:opacity-100"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={it.previewUrl}
                alt={it.name}
                className="size-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
