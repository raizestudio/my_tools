// app/components/pdf/PdfPageCardComponent.tsx
"use client";

import { useTranslations } from "next-intl";
import { PageItem } from "./types";

interface PdfPageCardProps {
  page: PageItem;
  index: number;
  totalPages: number;
  onRotate: (index: number, diff: number) => void;
  onMove: (index: number, dir: "left" | "right") => void;
  onToggleDelete: (index: number) => void;
  onPreview: (url: string, title: string) => void;
}

export default function PdfPageCard({
  page,
  index,
  totalPages,
  onRotate,
  onMove,
  onToggleDelete,
  onPreview,
}: PdfPageCardProps) {
  const t = useTranslations("tools.pdfToolkit");

  return (
    <div
      className={`card card-border p-3.5 flex flex-col justify-between gap-3 transition-all ${
        page.isDeleted
          ? "opacity-35 grayscale bg-base-200/70 border-error/20"
          : "bg-base-100 hover:shadow-md"
      }`}
    >
      <div className="flex items-center justify-between text-xs">
        <span className="font-bold text-base-content">
          {t("pageNumber", { num: index + 1 })}
        </span>
        <span className="badge badge-xs badge-neutral font-mono">
          {page.rotation}°
        </span>
      </div>

      <div className="aspect-[3/4] rounded-lg bg-base-200/60 border border-base-content/10 flex flex-col items-center justify-center relative overflow-hidden group">
        <div
          style={{ transform: `rotate(${page.rotation}deg)` }}
          className="w-full h-full transition-transform duration-200 flex items-center justify-center overflow-hidden"
        >
          <iframe
            key={`page-preview-${page.originalIndex}-${page.previewUrl}`}
            src={`${page.previewUrl}#page=1&toolbar=0&navpanes=0&scrollbar=0&view=Fit`}
            title={`Page ${index + 1}`}
            className="w-full h-full border-0 select-none bg-white pointer-events-none"
          />
        </div>

        {!page.isDeleted && (
          <button
            type="button"
            onClick={() =>
              onPreview(
                page.previewUrl,
                `Page ${index + 1} (${page.width} × ${page.height})`
              )
            }
            className="absolute inset-0 z-20 cursor-pointer bg-neutral/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 text-neutral-content text-xs font-semibold"
          >
            <span className="icon-[lucide--maximize-2] size-5"></span>
            <span>Preview</span>
          </button>
        )}

        {page.isDeleted && (
          <div className="absolute inset-0 z-20 bg-error/20 backdrop-blur-[1px] flex items-center justify-center">
            <span className="badge badge-sm badge-error font-bold shadow-sm">
              Deleted
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-base-content/10 pt-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onRotate(index, -90)}
            className="btn btn-xs btn-ghost btn-square"
            title={t("rotateCcw")}
          >
            <span className="icon-[lucide--rotate-ccw] size-3.5"></span>
          </button>
          <button
            type="button"
            onClick={() => onRotate(index, 90)}
            className="btn btn-xs btn-ghost btn-square"
            title={t("rotateCw")}
          >
            <span className="icon-[lucide--rotate-cw] size-3.5"></span>
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={index === 0}
            onClick={() => onMove(index, "left")}
            className="btn btn-xs btn-ghost btn-square"
            title={t("moveUp")}
          >
            <span className="icon-[lucide--chevron-left] size-3.5"></span>
          </button>
          <button
            type="button"
            disabled={index === totalPages - 1}
            onClick={() => onMove(index, "right")}
            className="btn btn-xs btn-ghost btn-square"
            title={t("moveDown")}
          >
            <span className="icon-[lucide--chevron-right] size-3.5"></span>
          </button>
          <button
            type="button"
            onClick={() => onToggleDelete(index)}
            className={`btn btn-xs btn-square ${
              page.isDeleted
                ? "btn-success btn-soft"
                : "btn-ghost text-error hover:bg-error/10"
            }`}
            title={page.isDeleted ? t("restorePage") : t("deletePage")}
          >
            <span
              className={
                page.isDeleted
                  ? "icon-[lucide--undo-2] size-3.5"
                  : "icon-[lucide--trash-2] size-3.5"
              }
            ></span>
          </button>
        </div>
      </div>
    </div>
  );
}
