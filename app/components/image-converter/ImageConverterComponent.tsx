// app/components/image-converter/ImageConverterComponent.tsx
"use client";

import {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
  type DragEvent,
} from "react";
import { useTranslations } from "next-intl";
import {
  centerCrop,
  makeAspectCrop,
  type Crop,
  type PixelCrop,
} from "react-image-crop";
import ToolHeader from "@/app/components/ui/ToolHeaderComponent";
import {
  processImageClient,
  type TransformOptions,
  type TargetFormat,
} from "@/app/lib/image-processor";
import { downloadZip } from "client-zip";

import ImageDropzone from "./ImageDropzone";
import StudioViewport from "./studio/StudioViewport";
import StudioControls from "./studio/StudioControls";
import BatchQueueView from "./batch/BatchQueueView";
import type {
  ImageItem,
  EditState,
  AspectPreset,
  FormatOption,
  AspectOption,
} from "./types";

export default function ImageConverterComponent() {
  const t = useTranslations("tools.imageConverter");

  const [items, setItems] = useState<ImageItem[]>([]);
  const [activeMode, setActiveMode] = useState<"studio" | "batch">("studio");
  const [studioView, setStudioView] = useState<"framing" | "result">("framing");
  const [isDragging, setIsDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processProgress, setProcessProgress] = useState(0);

  // Settings
  const [targetFormat, setTargetFormat] = useState<TargetFormat>("image/webp");
  const [quality, setQuality] = useState(85);
  const [batchScale, setBatchScale] = useState<number>(100);

  // Active Single-Image State
  const [selectedIdx, setSelectedIdx] = useState(0);
  const activeItem = items[selectedIdx] || null;

  // Track previous item ID to sync state during render (avoids cascading render warning)
  const [prevActiveId, setPrevActiveId] = useState<string | null>(null);

  // History Stack
  const [history, setHistory] = useState<EditState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Transforms & Dimensions
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [aspectPreset, setAspectPreset] = useState<AspectPreset>("free");
  const [rotate, setRotate] = useState<0 | 90 | 180 | 270>(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [targetWidth, setTargetWidth] = useState<number>(0);
  const [targetHeight, setTargetHeight] = useState<number>(0);
  const [lockAspect, setLockAspect] = useState(true);

  // Live Result Preview
  const [livePreviewUrl, setLivePreviewUrl] = useState<string | null>(null);
  const [estimatedSize, setEstimatedSize] = useState<number>(0);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);

  const imgRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetEdits = (w?: number, h?: number) => {
    const initW = w ?? activeItem?.width ?? 0;
    const initH = h ?? activeItem?.height ?? 0;
    setRotate(0);
    setFlipH(false);
    setFlipV(false);
    setCrop(undefined);
    setCompletedCrop(undefined);
    setAspectPreset("free");
    setTargetWidth(initW);
    setTargetHeight(initH);
    setLockAspect(true);
    setHistory([]);
    setHistoryIndex(-1);
  };

  // Idiomatic React 18 state adjustment during render when active item changes
  if (activeItem && activeItem.id !== prevActiveId) {
    setPrevActiveId(activeItem.id);
    resetEdits(activeItem.width, activeItem.height);
  }

  const formatOptions = useMemo<FormatOption[]>(
    () => [
      {
        id: "image/webp",
        label: t("formatWebp"),
        ext: "webp",
        hasQuality: true,
      },
      {
        id: "image/avif",
        label: t("formatAvif"),
        ext: "avif",
        hasQuality: true,
      },
      { id: "image/png", label: t("formatPng"), ext: "png", hasQuality: false },
      {
        id: "image/jpeg",
        label: t("formatJpeg"),
        ext: "jpg",
        hasQuality: true,
      },
      {
        id: "image/x-icon",
        label: t("formatIco"),
        ext: "ico",
        hasQuality: false,
      },
      { id: "image/bmp", label: t("formatBmp"), ext: "bmp", hasQuality: false },
      {
        id: "image/tiff",
        label: t("formatTiff"),
        ext: "tiff",
        hasQuality: false,
      },
      { id: "image/gif", label: t("formatGif"), ext: "gif", hasQuality: false },
    ],
    [t],
  );

  const aspectPresets = useMemo<AspectOption[]>(
    () => [
      { id: "free", label: t("aspectFree") },
      { id: "1:1", label: t("aspect1x1"), value: 1 },
      { id: "16:9", label: t("aspect16x9"), value: 16 / 9 },
      { id: "4:3", label: t("aspect4x3"), value: 4 / 3 },
      { id: "9:16", label: t("aspect9x16"), value: 9 / 16 },
    ],
    [t],
  );

  useEffect(() => {
    return () => {
      items.forEach((item) => URL.revokeObjectURL(item.previewUrl));
      if (livePreviewUrl) URL.revokeObjectURL(livePreviewUrl);
    };
  }, [items, livePreviewUrl]);

  const getNaturalCrop = useCallback(():
    { x: number; y: number; width: number; height: number } | undefined => {
    if (!completedCrop || !imgRef.current) return undefined;
    const img = imgRef.current;
    const scaleX = img.naturalWidth / img.width;
    const scaleY = img.naturalHeight / img.height;
    return {
      x: Math.round(completedCrop.x * scaleX),
      y: Math.round(completedCrop.y * scaleY),
      width: Math.round(completedCrop.width * scaleX),
      height: Math.round(completedCrop.height * scaleY),
    };
  }, [completedCrop]);

  // Real-time debounced output generator
  useEffect(() => {
    if (!activeItem) return;
    let isMounted = true;
    const timer = setTimeout(async () => {
      try {
        setIsGeneratingPreview(true);
        const naturalCrop = getNaturalCrop();
        const blob = await processImageClient(activeItem.file, {
          width: targetWidth || activeItem.width,
          height: targetHeight || activeItem.height,
          crop: naturalCrop,
          rotate,
          flipHorizontal: flipH,
          flipVertical: flipV,
          format: targetFormat,
          quality: quality / 100,
        });

        if (isMounted) {
          const newUrl = URL.createObjectURL(blob);
          setLivePreviewUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return newUrl;
          });
          setEstimatedSize(blob.size);
        }
      } catch (err) {
        console.error("Live preview error:", err);
      } finally {
        if (isMounted) setIsGeneratingPreview(false);
      }
    }, 180);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [
    activeItem,
    completedCrop,
    rotate,
    flipH,
    flipV,
    targetWidth,
    targetHeight,
    targetFormat,
    quality,
    getNaturalCrop,
  ]);

  const saveState = useCallback(
    (newState: EditState) => {
      setHistory((prev) => [...prev.slice(0, historyIndex + 1), newState]);
      setHistoryIndex((prev) => prev + 1);
    },
    [historyIndex],
  );

  const applyState = (state: EditState) => {
    setRotate(state.rotate);
    setFlipH(state.flipH);
    setFlipV(state.flipV);
    setCrop(state.crop);
    setCompletedCrop(state.completedCrop);
    setAspectPreset(state.aspectPreset);
    setTargetWidth(state.targetWidth);
    setTargetHeight(state.targetHeight);
    setLockAspect(state.lockAspect);
  };

  const undo = () => {
    if (historyIndex > 0) {
      applyState(history[historyIndex - 1]);
      setHistoryIndex((prev) => prev - 1);
    } else if (historyIndex === 0 && activeItem) {
      resetEdits(activeItem.width, activeItem.height);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      applyState(history[historyIndex + 1]);
      setHistoryIndex((prev) => prev + 1);
    }
  };

  const handleCropComplete = (c: PixelCrop) => {
    setCompletedCrop(c);
    if (c.width > 0 && c.height > 0 && imgRef.current) {
      const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
      const scaleY = imgRef.current.naturalHeight / imgRef.current.height;
      const newTargetW = Math.round(c.width * scaleX);
      const newTargetH = Math.round(c.height * scaleY);

      setTargetWidth(newTargetW);
      setTargetHeight(newTargetH);

      saveState({
        rotate,
        flipH,
        flipV,
        crop,
        completedCrop: c,
        aspectPreset,
        targetWidth: newTargetW,
        targetHeight: newTargetH,
        lockAspect,
      });
    }
  };

  const handleRotate = (dir: -90 | 90) => {
    const newRot = ((rotate + dir + 360) % 360) as 0 | 90 | 180 | 270;
    setRotate(newRot);
    saveState({
      rotate: newRot,
      flipH,
      flipV,
      crop,
      completedCrop,
      aspectPreset,
      targetWidth,
      targetHeight,
      lockAspect,
    });
  };

  const handleFlip = (axis: "H" | "V") => {
    const newH = axis === "H" ? !flipH : flipH;
    const newV = axis === "V" ? !flipV : flipV;
    setFlipH(newH);
    setFlipV(newV);
    saveState({
      rotate,
      flipH: newH,
      flipV: newV,
      crop,
      completedCrop,
      aspectPreset,
      targetWidth,
      targetHeight,
      lockAspect,
    });
  };

  const applyAspectPreset = (presetId: AspectPreset) => {
    setAspectPreset(presetId);
    if (presetId === "free" || !imgRef.current) {
      setCrop(undefined);
      setCompletedCrop(undefined);
      if (activeItem) {
        setTargetWidth(activeItem.width);
        setTargetHeight(activeItem.height);
      }
      saveState({
        rotate,
        flipH,
        flipV,
        crop: undefined,
        completedCrop: undefined,
        aspectPreset: presetId,
        targetWidth: activeItem?.width ?? 0,
        targetHeight: activeItem?.height ?? 0,
        lockAspect,
      });
      return;
    }

    const { width, height } = imgRef.current;
    const aspectVal = aspectPresets.find((p) => p.id === presetId)?.value || 1;
    const newCrop = centerCrop(
      makeAspectCrop({ unit: "%", width: 90 }, aspectVal, width, height),
      width,
      height,
    );

    setCrop(newCrop);
    saveState({
      rotate,
      flipH,
      flipV,
      crop: newCrop,
      completedCrop,
      aspectPreset: presetId,
      targetWidth,
      targetHeight,
      lockAspect,
    });
  };

  const handleWidthChange = (val: number) => {
    setTargetWidth(val);
    if (lockAspect && activeItem && activeItem.width > 0) {
      const baseRatio =
        (completedCrop?.height ?? activeItem.height) /
        (completedCrop?.width ?? activeItem.width);
      setTargetHeight(Math.round(val * baseRatio));
    }
  };

  const handleHeightChange = (val: number) => {
    setTargetHeight(val);
    if (lockAspect && activeItem && activeItem.height > 0) {
      const baseRatio =
        (completedCrop?.width ?? activeItem.width) /
        (completedCrop?.height ?? activeItem.height);
      setTargetWidth(Math.round(val * baseRatio));
    }
  };

  const commitDimensionChange = () => {
    saveState({
      rotate,
      flipH,
      flipV,
      crop,
      completedCrop,
      aspectPreset,
      targetWidth,
      targetHeight,
      lockAspect,
    });
  };

  const applyScaleMultiplier = (multiplier: number) => {
    if (!activeItem) return;
    const baseW = completedCrop ? targetWidth : activeItem.width;
    const baseH = completedCrop ? targetHeight : activeItem.height;
    const newW = Math.round(baseW * multiplier);
    const newH = Math.round(baseH * multiplier);

    setTargetWidth(newW);
    setTargetHeight(newH);
    saveState({
      rotate,
      flipH,
      flipV,
      crop,
      completedCrop,
      aspectPreset,
      targetWidth: newW,
      targetHeight: newH,
      lockAspect,
    });
  };

  const handleFilesIngest = async (fileList: FileList | File[]) => {
    const rawFiles = Array.from(fileList).filter((f) =>
      f.type.startsWith("image/"),
    );
    if (!rawFiles.length) return;

    const newItems: ImageItem[] = await Promise.all(
      rawFiles.map(async (file) => {
        const previewUrl = URL.createObjectURL(file);
        const dimensions = await new Promise<{ width: number; height: number }>(
          (resolve) => {
            const img = new Image();
            img.onload = () =>
              resolve({ width: img.naturalWidth, height: img.naturalHeight });
            img.onerror = () => resolve({ width: 0, height: 0 });
            img.src = previewUrl;
          },
        );

        return {
          id: Math.random().toString(36).substring(2, 9),
          file,
          previewUrl,
          name: file.name,
          size: file.size,
          width: dimensions.width,
          height: dimensions.height,
        };
      }),
    );

    setItems((prev) => {
      const combined = [...prev, ...newItems];
      if (prev.length === 0) {
        setActiveMode(combined.length === 1 ? "studio" : "batch");
        setSelectedIdx(0);
      }
      return combined;
    });
  };

  const handleSingleExport = async () => {
    if (!activeItem) return;
    setProcessing(true);
    try {
      const naturalCrop = getNaturalCrop();
      const options: TransformOptions = {
        width: targetWidth || activeItem.width,
        height: targetHeight || activeItem.height,
        crop: naturalCrop,
        rotate,
        flipHorizontal: flipH,
        flipVertical: flipV,
        format: targetFormat,
        quality: quality / 100,
      };

      const resultBlob = await processImageClient(activeItem.file, options);
      const ext =
        formatOptions.find((f) => f.id === targetFormat)?.ext || "webp";
      const baseName = activeItem.name.replace(/\.[^/.]+$/, "");
      const fileName = `${baseName}-0w.${ext}`;

      const link = document.createElement("a");
      link.href = URL.createObjectURL(resultBlob);
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } finally {
      setProcessing(false);
    }
  };

  const handleBatchExport = async () => {
    if (!items.length) return;
    setProcessing(true);
    setProcessProgress(0);

    const ext = formatOptions.find((f) => f.id === targetFormat)?.ext || "webp";
    const zipEntries: { name: string; input: Blob }[] = [];

    try {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const scaleMultiplier = batchScale / 100;
        const targetW = Math.round(item.width * scaleMultiplier);
        const targetH = Math.round(item.height * scaleMultiplier);

        const options: TransformOptions = {
          width: targetW > 0 ? targetW : item.width,
          height: targetH > 0 ? targetH : item.height,
          format: targetFormat,
          quality: quality / 100,
        };

        const resultBlob = await processImageClient(item.file, options);
        const baseName = item.name.replace(/\.[^/.]+$/, "");
        zipEntries.push({ name: `${baseName}-0w.${ext}`, input: resultBlob });
        setProcessProgress(Math.round(((i + 1) / items.length) * 100));
      }

      const zipBlob = await downloadZip(zipEntries).blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(zipBlob);
      link.download = `0w-batch-export-${Date.now()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } finally {
      setProcessing(false);
      setProcessProgress(0);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  return (
    <div className="relative w-full max-w-5xl mx-auto flex flex-col gap-6 isolate">
      <div
        aria-hidden="true"
        className="absolute top-1/6 left-1/2 -translate-x-1/2 -translate-y-1/2 size-96 bg-primary/10 rounded-full blur-3xl pointer-events-none -z-1"
      />

      <ToolHeader
        title={t("title")}
        description={t("desc")}
        icon="icon-[lucide--image]"
        badge={
          <span className="badge badge-sm badge-soft badge-primary font-mono font-semibold px-2.5 py-1">
            {t("badge")}
          </span>
        }
      />

      {items.length === 0 ? (
        <ImageDropzone
          isDragging={isDragging}
          onDragOver={(e: DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e: DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files) handleFilesIngest(e.dataTransfer.files);
          }}
          onFilesIngest={handleFilesIngest}
        />
      ) : (
        <div className="card card-border bg-base-200/50 backdrop-blur-md border-base-content/10 p-4 sm:p-6 rounded-3xl shadow-sm flex flex-col gap-6">
          {/* Header Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-base-content/5">
            <div className="flex items-center gap-2">
              <div className="join bg-base-300/40 p-0.5 rounded-xl border border-base-content/5">
                <button
                  type="button"
                  onClick={() => setActiveMode("studio")}
                  className={`btn btn-xs sm:btn-sm join-item rounded-lg ${
                    activeMode === "studio"
                      ? "btn-primary shadow-xs font-semibold"
                      : "btn-ghost text-base-content/60"
                  }`}
                >
                  <span className="icon-[lucide--crop] size-3.5"></span>
                  <span>{t("tabStudio")}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMode("batch")}
                  className={`btn btn-xs sm:btn-sm join-item rounded-lg ${
                    activeMode === "batch"
                      ? "btn-primary shadow-xs font-semibold"
                      : "btn-ghost text-base-content/60"
                  }`}
                >
                  <span className="icon-[lucide--layers] size-3.5"></span>
                  <span>{t("tabBatch", { count: items.length })}</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn btn-xs sm:btn-sm btn-ghost rounded-lg text-base-content/70 gap-1.5"
                title={t("addFiles")}
              >
                <span className="icon-[lucide--plus] size-3.5"></span>
                <span className="hidden sm:inline">{t("addFiles")}</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) =>
                  e.target.files && handleFilesIngest(e.target.files)
                }
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-base-content/40 hidden sm:inline">
                {t("filesLoaded", { count: items.length })}
              </span>
              <button
                type="button"
                onClick={() => {
                  setItems([]);
                  setSelectedIdx(0);
                }}
                className="btn btn-xs btn-ghost text-error/80 hover:text-error rounded-lg"
              >
                {t("clearAll")}
              </button>
            </div>
          </div>

          {activeMode === "studio" && activeItem && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <StudioViewport
                activeItem={activeItem}
                items={items}
                selectedIdx={selectedIdx}
                onSelectIdx={setSelectedIdx}
                imgRef={imgRef}
                studioView={studioView}
                setStudioView={setStudioView}
                crop={crop}
                setCrop={setCrop}
                onCropComplete={handleCropComplete}
                aspectPreset={aspectPreset}
                aspectPresets={aspectPresets}
                rotate={rotate}
                flipH={flipH}
                flipV={flipV}
                livePreviewUrl={livePreviewUrl}
                estimatedSize={estimatedSize}
                isGeneratingPreview={isGeneratingPreview}
                showOriginal={showOriginal}
                setShowOriginal={setShowOriginal}
                targetWidth={targetWidth}
                targetHeight={targetHeight}
                undo={undo}
                redo={redo}
                resetEdits={() =>
                  resetEdits(activeItem.width, activeItem.height)
                }
                canUndo={historyIndex >= 0}
                canRedo={historyIndex < history.length - 1}
                formatBytes={formatBytes}
              />

              <StudioControls
                aspectPreset={aspectPreset}
                aspectPresets={aspectPresets}
                onApplyAspectPreset={applyAspectPreset}
                onRotate={handleRotate}
                onFlip={handleFlip}
                flipH={flipH}
                flipV={flipV}
                lockAspect={lockAspect}
                setLockAspect={setLockAspect}
                targetWidth={targetWidth}
                targetHeight={targetHeight}
                onWidthChange={handleWidthChange}
                onHeightChange={handleHeightChange}
                onCommitDimensions={commitDimensionChange}
                onScaleMultiplier={applyScaleMultiplier}
                targetFormat={targetFormat}
                setTargetFormat={setTargetFormat}
                formatOptions={formatOptions}
                quality={quality}
                setQuality={setQuality}
                processing={processing}
                onExport={handleSingleExport}
              />
            </div>
          )}

          {activeMode === "batch" && (
            <BatchQueueView
              items={items}
              targetFormat={targetFormat}
              setTargetFormat={setTargetFormat}
              formatOptions={formatOptions}
              batchScale={batchScale}
              setBatchScale={setBatchScale}
              quality={quality}
              setQuality={setQuality}
              processing={processing}
              processProgress={processProgress}
              onEditInStudio={(idx) => {
                setSelectedIdx(idx);
                setActiveMode("studio");
              }}
              onRemoveItem={(id) => {
                setItems((prev) => {
                  const filtered = prev.filter((i) => i.id !== id);
                  if (selectedIdx >= filtered.length) {
                    setSelectedIdx(Math.max(0, filtered.length - 1));
                  }
                  return filtered;
                });
              }}
              onBatchExport={handleBatchExport}
              formatBytes={formatBytes}
            />
          )}
        </div>
      )}
    </div>
  );
}
