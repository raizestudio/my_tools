// app/components/image-converter/ImageDropzone.tsx
"use client";

import { useRef, type ChangeEvent, type DragEvent } from "react";
import { useTranslations } from "next-intl";

interface ImageDropzoneProps {
  isDragging: boolean;
  onDragOver: (e: DragEvent<HTMLDivElement>) => void;
  onDragLeave: () => void;
  onDrop: (e: DragEvent<HTMLDivElement>) => void;
  onFilesIngest: (files: FileList | File[]) => void;
}

export default function ImageDropzone({
  isDragging,
  onDragOver,
  onDragLeave,
  onDrop,
  onFilesIngest,
}: ImageDropzoneProps) {
  const t = useTranslations("tools.imageConverter");
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={() => fileInputRef.current?.click()}
      className={`card card-border border-2 border-dashed p-10 sm:p-14 rounded-3xl flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
        isDragging
          ? "border-primary bg-primary/5 scale-[1.008]"
          : "border-base-content/15 bg-base-200/40 hover:border-primary/50"
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={(e: ChangeEvent<HTMLInputElement>) => {
          if (e.target.files) onFilesIngest(e.target.files);
        }}
      />
      <div className="size-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4 shadow-inner">
        <span className="icon-[lucide--upload-cloud] size-8"></span>
      </div>
      <span className="text-base font-bold text-base-content mb-1">
        {t("dropzoneTitle")}
      </span>
      <span className="text-xs text-base-content/50 font-mono mb-4">
        {t("dropzoneHint")}
      </span>
      <span className="btn btn-sm btn-primary rounded-xl font-medium px-4">
        {t("selectImages")}
      </span>
    </div>
  );
}
