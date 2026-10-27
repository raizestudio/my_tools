"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { PDFDocument, degrees } from "pdf-lib";
import ToolHeader from "@/app/components/ui/ToolHeaderComponent";
import { ActiveTab, MergeFileItem, PageItem } from "@/app/components/pdf/types";
import PdfPreviewModal from "@/app/components/pdf/PdfPreviewModalComponent";
import PdfMergeSection from "@/app/components/pdf/PdfMergeSectionComponent";
import PdfOrganizeSection from "@/app/components/pdf/PdfOrganizeSectionComponent";

export default function PdfToolkitComponent() {
  const t = useTranslations("tools.pdfToolkit");

  const [activeTab, setActiveTab] = useState<ActiveTab>("merge");
  const [isProcessing, setIsProcessing] = useState(false);

  // Modal preview state
  const [previewModalUrl, setPreviewModalUrl] = useState<string | null>(null);
  const [previewModalTitle, setPreviewModalTitle] = useState<string>("");

  // Merge state
  const [mergeFiles, setMergeFiles] = useState<MergeFileItem[]>([]);

  // Organize state
  const [singlePdfFile, setSinglePdfFile] = useState<File | null>(null);
  const [singlePdfBuffer, setSinglePdfBuffer] = useState<ArrayBuffer | null>(null);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [rangeError, setRangeError] = useState<string | null>(null);

  // Revoke URLs on unmount
  useEffect(() => {
    return () => {
      pages.forEach((p) => URL.revokeObjectURL(p.previewUrl));
      mergeFiles.forEach((m) => URL.revokeObjectURL(m.previewUrl));
    };
  }, [pages, mergeFiles]);

  const triggerDownload = (bytes: Uint8Array, filename: string) => {
    const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleOpenPreview = (url: string, title: string) => {
    setPreviewModalUrl(url);
    setPreviewModalTitle(title);
  };

  const handleClosePreview = () => {
    setPreviewModalUrl(null);
    setPreviewModalTitle("");
  };

  // --- MERGE HANDLERS ---
  const handleAddMergeFiles = async (files: FileList | File[]) => {
    setIsProcessing(true);
    const newItems: MergeFileItem[] = [];

    for (const file of Array.from(files)) {
      if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) continue;
      try {
        const buffer = await file.arrayBuffer();
        const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
        const previewUrl = URL.createObjectURL(new Blob([buffer], { type: "application/pdf" }));

        newItems.push({
          id: `${file.name}-${file.size}-${Math.random()}`,
          file,
          pageCount: doc.getPageCount(),
          buffer,
          previewUrl,
        });
      } catch (err: unknown) {
        console.error("Failed to parse PDF for merge:", err);
      }
    }

    setMergeFiles((prev) => [...prev, ...newItems]);
    setIsProcessing(false);
  };

  const handleMoveMergeFile = (index: number, direction: "up" | "down") => {
    setMergeFiles((prev) => {
      const copy = [...prev];
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= copy.length) return prev;
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
  };

  const handleRemoveMergeFile = (index: number) => {
    setMergeFiles((prev) => {
      URL.revokeObjectURL(prev[index].previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleExecuteMerge = async () => {
    if (mergeFiles.length === 0) return;
    setIsProcessing(true);

    try {
      const mergedDoc = await PDFDocument.create();
      for (const item of mergeFiles) {
        const sourceDoc = await PDFDocument.load(item.buffer, { ignoreEncryption: true });
        const copiedPages = await mergedDoc.copyPages(sourceDoc, sourceDoc.getPageIndices());
        copiedPages.forEach((page) => mergedDoc.addPage(page));
      }

      const mergedBytes = await mergedDoc.save();
      triggerDownload(mergedBytes, `merged_${Date.now()}.pdf`);
    } catch (err: unknown) {
      console.error("Merge error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  // --- ORGANIZE HANDLERS ---
  const handleLoadSinglePdf = async (file: File) => {
    if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) return;
    setIsProcessing(true);
    setRangeError(null);

    pages.forEach((p) => URL.revokeObjectURL(p.previewUrl));

    try {
      const buffer = await file.arrayBuffer();
      const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
      const rawPages = doc.getPages();
      const pageItems: PageItem[] = [];

      for (let idx = 0; idx < rawPages.length; idx++) {
        const p = rawPages[idx];
        const { width, height } = p.getSize();

        const singlePageDoc = await PDFDocument.create();
        const [copiedPage] = await singlePageDoc.copyPages(doc, [idx]);
        singlePageDoc.addPage(copiedPage);
        const singleBytes = await singlePageDoc.save();
        const previewBlob = new Blob([singleBytes as BlobPart], { type: "application/pdf" });
        const previewUrl = URL.createObjectURL(previewBlob);

        pageItems.push({
          originalIndex: idx,
          rotation: p.getRotation().angle,
          isDeleted: false,
          isLandscape: width > height,
          width: Math.round(width),
          height: Math.round(height),
          previewUrl,
        });
      }

      setSinglePdfFile(file);
      setSinglePdfBuffer(buffer);
      setPages(pageItems);
    } catch (err: unknown) {
      console.error("Failed to load PDF pages:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRotatePage = (index: number, angleDiff: number) => {
    setPages((prev) => {
      const copy = [...prev];
      const currentAngle = copy[index].rotation;
      let newAngle = (currentAngle + angleDiff) % 360;
      if (newAngle < 0) newAngle += 360;
      copy[index] = { ...copy[index], rotation: newAngle };
      return copy;
    });
  };

  const handleToggleDeletePage = (index: number) => {
    setPages((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], isDeleted: !copy[index].isDeleted };
      return copy;
    });
  };

  const handleMovePage = (index: number, direction: "left" | "right") => {
    setPages((prev) => {
      const copy = [...prev];
      const target = direction === "left" ? index - 1 : index + 1;
      if (target < 0 || target >= copy.length) return prev;
      const temp = copy[index];
      copy[index] = copy[target];
      copy[target] = temp;
      return copy;
    });
  };

  const handleRotateAll = (angleDiff: number) => {
    setPages((prev) =>
      prev.map((p) => {
        let newAngle = (p.rotation + angleDiff) % 360;
        if (newAngle < 0) newAngle += 360;
        return { ...p, rotation: newAngle };
      })
    );
  };

  const handleResetAllPages = () => {
    if (!singlePdfBuffer || !singlePdfFile) return;
    handleLoadSinglePdf(singlePdfFile);
  };

  const handleExportModifiedPdf = async () => {
    if (!singlePdfBuffer) return;
    const activePages = pages.filter((p) => !p.isDeleted);
    if (activePages.length === 0) return;

    setIsProcessing(true);

    try {
      const sourceDoc = await PDFDocument.load(singlePdfBuffer, { ignoreEncryption: true });
      const modifiedDoc = await PDFDocument.create();

      const originalIndices = activePages.map((p) => p.originalIndex);
      const copiedPages = await modifiedDoc.copyPages(sourceDoc, originalIndices);

      copiedPages.forEach((copiedPage, i) => {
        copiedPage.setRotation(degrees(activePages[i].rotation));
        modifiedDoc.addPage(copiedPage);
      });

      const outBytes = await modifiedDoc.save();
      const baseName = singlePdfFile?.name.replace(/\.[^/.]+$/, "") || "document";
      triggerDownload(outBytes, `${baseName}_modified.pdf`);
    } catch (err: unknown) {
      console.error("Export modified PDF error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExtractRange = async (rangeStr: string) => {
    if (!singlePdfBuffer) return;
    setRangeError(null);

    const parsedIndices: number[] = [];
    const parts = rangeStr.split(",").map((p) => p.trim()).filter(Boolean);

    for (const part of parts) {
      if (part.includes("-")) {
        const [startStr, endStr] = part.split("-").map((s) => s.trim());
        const start = parseInt(startStr, 10);
        const end = parseInt(endStr, 10);
        if (isNaN(start) || isNaN(end) || start > end || start < 1 || end > pages.length) {
          setRangeError(t("invalidRange"));
          return;
        }
        for (let i = start; i <= end; i++) parsedIndices.push(i - 1);
      } else {
        const val = parseInt(part, 10);
        if (isNaN(val) || val < 1 || val > pages.length) {
          setRangeError(t("invalidRange"));
          return;
        }
        parsedIndices.push(val - 1);
      }
    }

    if (parsedIndices.length === 0) {
      setRangeError(t("invalidRange"));
      return;
    }

    setIsProcessing(true);

    try {
      const sourceDoc = await PDFDocument.load(singlePdfBuffer, { ignoreEncryption: true });
      const extractDoc = await PDFDocument.create();
      const uniqueIndices = Array.from(new Set(parsedIndices));

      const copied = await extractDoc.copyPages(sourceDoc, uniqueIndices);
      copied.forEach((cp, idx) => {
        const originalIdx = uniqueIndices[idx];
        const pageMeta = pages.find((p) => p.originalIndex === originalIdx);
        if (pageMeta) cp.setRotation(degrees(pageMeta.rotation));
        extractDoc.addPage(cp);
      });

      const outBytes = await extractDoc.save();
      const baseName = singlePdfFile?.name.replace(/\.[^/.]+$/, "") || "document";
      triggerDownload(outBytes, `${baseName}_extracted.pdf`);
    } catch (err: unknown) {
      console.error("Extraction error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLoadDemo = async () => {
    setIsProcessing(true);
    const demoDoc = await PDFDocument.create();

    for (let i = 1; i <= 4; i++) {
      const page = demoDoc.addPage([595, 842]);
      const { height } = page.getSize();
      page.drawText(`0w.lat Privacy Toolkit - Page ${i}`, {
        x: 50,
        y: height - 100,
        size: 24,
      });
      page.drawText("100% Client-Side In-Memory PDF Processing Demonstration.", {
        x: 50,
        y: height - 140,
        size: 14,
      });
    }

    const demoBytes = await demoDoc.save();
    const demoFile = new File([demoBytes as BlobPart], "demo_sample.pdf", {
      type: "application/pdf",
    });

    if (activeTab === "merge") {
      await handleAddMergeFiles([demoFile]);
    } else {
      await handleLoadSinglePdf(demoFile);
    }
    setIsProcessing(false);
  };

  const handleClear = () => {
    mergeFiles.forEach((m) => URL.revokeObjectURL(m.previewUrl));
    pages.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    setMergeFiles([]);
    setSinglePdfFile(null);
    setSinglePdfBuffer(null);
    setPages([]);
    setRangeError(null);
  };

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto w-full">
      <ToolHeader
        title={t("title")}
        description={t("desc")}
        icon="icon-[lucide--file-stack]"
        badge={
          <span className="badge badge-sm badge-soft badge-primary">
            {t("badgeOffline")}
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleLoadDemo}
              disabled={isProcessing}
              className="btn btn-xs btn-outline"
            >
              {t("loadSample")}
            </button>
            {((activeTab === "merge" && mergeFiles.length > 0) ||
              (activeTab === "organize" && singlePdfFile !== null)) && (
              <button
                type="button"
                onClick={handleClear}
                className="btn btn-xs btn-ghost text-base-content/60"
              >
                {t("clear")}
              </button>
            )}
          </div>
        }
      />

      {/* Mode Switcher */}
      <div className="join w-full max-w-lg mx-auto grid grid-cols-2 bg-base-200/50 p-0.5 rounded-xl border border-base-content/5">
        <button
          type="button"
          onClick={() => setActiveTab("merge")}
          className={`btn btn-sm join-item ${
            activeTab === "merge" ? "btn-primary shadow-sm" : "btn-ghost"
          }`}
        >
          <span className="icon-[lucide--files] size-4"></span>
          <span>{t("tabMerge")}</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("organize")}
          className={`btn btn-sm join-item ${
            activeTab === "organize" ? "btn-primary shadow-sm" : "btn-ghost"
          }`}
        >
          <span className="icon-[lucide--layout-grid] size-4"></span>
          <span>{t("tabOrganize")}</span>
        </button>
      </div>

      {/* Main Sections */}
      {activeTab === "merge" ? (
        <PdfMergeSection
          files={mergeFiles}
          isProcessing={isProcessing}
          onAddFiles={handleAddMergeFiles}
          onMoveFile={handleMoveMergeFile}
          onRemoveFile={handleRemoveMergeFile}
          onExecuteMerge={handleExecuteMerge}
          onPreview={handleOpenPreview}
        />
      ) : (
        <PdfOrganizeSection
          file={singlePdfFile}
          pages={pages}
          isProcessing={isProcessing}
          onLoadFile={handleLoadSinglePdf}
          onRotatePage={handleRotatePage}
          onMovePage={handleMovePage}
          onToggleDeletePage={handleToggleDeletePage}
          onRotateAll={handleRotateAll}
          onResetAll={handleResetAllPages}
          onExportModified={handleExportModifiedPdf}
          onExtractRange={handleExtractRange}
          rangeError={rangeError}
          onPreview={handleOpenPreview}
        />
      )}

      {/* Top-Level Fullscreen Modal */}
      <PdfPreviewModal
        url={previewModalUrl}
        title={previewModalTitle}
        onClose={handleClosePreview}
      />
    </div>
  );
}
