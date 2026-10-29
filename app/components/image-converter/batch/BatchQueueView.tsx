// app/components/image-converter/batch/BatchQueueView.tsx
"use client";

import { useTranslations } from "next-intl";
import type { TargetFormat } from "@/app/lib/image-processor";
import type { ImageItem, FormatOption } from "../types";

interface BatchQueueViewProps {
  items: ImageItem[];
  targetFormat: TargetFormat;
  setTargetFormat: (format: TargetFormat) => void;
  formatOptions: FormatOption[];
  batchScale: number;
  setBatchScale: (scale: number) => void;
  quality: number;
  setQuality: (quality: number) => void;
  processing: boolean;
  processProgress: number;
  onEditInStudio: (idx: number) => void;
  onRemoveItem: (id: string) => void;
  onBatchExport: () => void;
  formatBytes: (bytes: number) => string;
}

export default function BatchQueueView({
  items,
  targetFormat,
  setTargetFormat,
  formatOptions,
  batchScale,
  setBatchScale,
  quality,
  setQuality,
  processing,
  processProgress,
  onEditInStudio,
  onRemoveItem,
  onBatchExport,
  formatBytes,
}: BatchQueueViewProps) {
  const t = useTranslations("tools.imageConverter");

  return (
    <div className="flex flex-col gap-6">
      {/* Batch Controls Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-2xl bg-base-100/60 border border-base-content/10">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-base-content">
            {t("batchFormatTitle")}
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

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-base-content flex items-center justify-between">
            <span>{t("batchScaleTitle")}</span>
            <span className="font-mono text-primary text-xs font-bold">
              {batchScale}%
            </span>
          </label>
          <div className="grid grid-cols-4 gap-1">
            {[100, 75, 50, 25].map((scale) => (
              <button
                key={scale}
                type="button"
                onClick={() => setBatchScale(scale)}
                className={`btn btn-xs rounded-lg font-mono ${
                  batchScale === scale
                    ? "btn-primary font-bold shadow-xs"
                    : "btn-soft text-base-content/70"
                }`}
              >
                {scale}%
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold">{t("batchQualityTitle")}</span>
            <span className="font-mono text-primary font-bold">{quality}%</span>
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
      </div>

      {/* Queue List */}
      <div className="flex flex-col gap-2 max-h-95 overflow-y-auto pr-1">
        {items.map((item, idx) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-3 rounded-xl bg-base-100/40 border border-base-content/5 hover:border-base-content/15 transition-all text-xs"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="size-10 rounded-lg overflow-hidden shrink-0 border border-base-content/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.previewUrl}
                  alt={item.name}
                  className="size-full object-cover"
                />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-semibold text-base-content truncate">
                  {item.name}
                </span>
                <span className="font-mono text-[11px] text-base-content/40">
                  {item.width} × {item.height} px • {formatBytes(item.size)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onEditInStudio(idx)}
                className="btn btn-xs btn-ghost rounded-lg gap-1 text-base-content/70"
              >
                <span className="icon-[lucide--crop] size-3"></span>
                <span className="hidden sm:inline">{t("editInStudio")}</span>
              </button>
              <button
                type="button"
                onClick={() => onRemoveItem(item.id)}
                title={t("removeFile")}
                className="btn btn-xs btn-circle btn-ghost text-base-content/40 hover:text-error"
              >
                <span className="icon-[lucide--x] size-3.5"></span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Batch Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-base-content/5">
        <span className="text-xs font-mono text-base-content/40">
          {t("privacyNotice")}
        </span>

        <button
          type="button"
          disabled={processing}
          onClick={onBatchExport}
          className="btn btn-primary btn-md rounded-xl font-semibold px-8 gap-2 shadow-sm shadow-primary/20 w-full sm:w-auto"
        >
          {processing ? (
            <>
              <span className="loading loading-spinner size-4"></span>
              <span>{t("processingBatch", { progress: processProgress })}</span>
            </>
          ) : (
            <>
              <span className="icon-[lucide--archive] size-4"></span>
              <span>{t("exportZip")}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
