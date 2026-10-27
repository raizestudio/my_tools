"use client";

import { useState, useId, ChangeEvent, DragEvent } from "react";
import { useTranslations } from "next-intl";
import { MergeFileItem } from "./types";

interface PdfMergeSectionProps {
  files: MergeFileItem[];
  isProcessing: boolean;
  onAddFiles: (files: FileList | File[]) => void;
  onMoveFile: (index: number, dir: "up" | "down") => void;
  onRemoveFile: (index: number) => void;
  onExecuteMerge: () => void;
  onPreview: (url: string, title: string) => void;
}

export default function PdfMergeSection({
  files,
  isProcessing,
  onAddFiles,
  onMoveFile,
  onRemoveFile,
  onExecuteMerge,
  onPreview,
}: PdfMergeSectionProps) {
  const t = useTranslations("tools.pdfToolkit");
  const mergeInputId = useId();
  const [isDragging, setIsDragging] = useState(false);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const totalPages = files.reduce((acc, cur) => acc + cur.pageCount, 0);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-200">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e: DragEvent<HTMLDivElement>) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files?.length) {
            onAddFiles(e.dataTransfer.files);
          }
        }}
        className={`card card-border border-2 border-dashed p-10 flex flex-col items-center justify-center gap-3 cursor-pointer text-center transition-all ${
          isDragging
            ? "border-primary bg-primary/5 scale-[0.99]"
            : "border-base-content/20 hover:border-primary/50 hover:bg-base-200/30"
        }`}
      >
        <label
          htmlFor={mergeInputId}
          className="flex flex-col items-center gap-2.5 cursor-pointer w-full"
        >
          <input
            id={mergeInputId}
            type="file"
            multiple
            accept="application/pdf"
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              if (e.target.files?.length) onAddFiles(e.target.files);
            }}
            className="hidden"
          />
          <div className="size-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <span className="icon-[lucide--plus] size-6"></span>
          </div>
          <span className="font-semibold text-sm text-base-content">
            {t("dropzoneMerge")}
          </span>
          <span className="text-xs text-base-content/60">
            {t("dropzoneHint")}
          </span>
        </label>
      </div>

      {files.length > 0 && (
        <div className="card card-border bg-base-100 p-5 shadow-sm flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-base-content/10 gap-2">
            <span className="font-bold text-sm text-base-content">
              {t("mergeFilesCount", {
                count: files.length,
                totalPages,
              })}
            </span>
            <button
              type="button"
              disabled={isProcessing}
              onClick={onExecuteMerge}
              className="btn btn-sm btn-primary gap-2"
            >
              {isProcessing ? (
                <span className="loading loading-spinner size-4"></span>
              ) : (
                <span className="icon-[lucide--download] size-4"></span>
              )}
              <span>{isProcessing ? t("merging") : t("mergeButton")}</span>
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {files.map((item, idx) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-xl bg-base-200/40 border border-base-content/5 gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-mono text-xs font-bold text-base-content/40 w-5">
                    #{idx + 1}
                  </span>
                  <span className="icon-[lucide--file-text] size-5 text-primary shrink-0"></span>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-semibold text-base-content truncate">
                      {item.file.name}
                    </span>
                    <span className="text-[11px] text-base-content/50">
                      {formatBytes(item.file.size)} •{" "}
                      {t("pagesCount", { count: item.pageCount })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => onPreview(item.previewUrl, item.file.name)}
                    className="btn btn-xs btn-ghost btn-square"
                    title="Preview Document"
                  >
                    <span className="icon-[lucide--eye] size-3.5"></span>
                  </button>
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => onMoveFile(idx, "up")}
                    className="btn btn-xs btn-ghost btn-square"
                    title={t("moveUp")}
                  >
                    <span className="icon-[lucide--arrow-up] size-3.5"></span>
                  </button>
                  <button
                    type="button"
                    disabled={idx === files.length - 1}
                    onClick={() => onMoveFile(idx, "down")}
                    className="btn btn-xs btn-ghost btn-square"
                    title={t("moveDown")}
                  >
                    <span className="icon-[lucide--arrow-down] size-3.5"></span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemoveFile(idx)}
                    className="btn btn-xs btn-ghost btn-square text-error hover:bg-error/10"
                    title={t("remove")}
                  >
                    <span className="icon-[lucide--trash-2] size-3.5"></span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
