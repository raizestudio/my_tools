"use client";

// Local blob previews must bypass the server-side image optimizer.
/* eslint-disable @next/next/no-img-element */

import {
    useEffect,
    useId,
    useRef,
    useState,
} from "react";
import type {
    ChangeEvent,
    DragEvent as ReactDragEvent,
    MouseEvent as ReactMouseEvent,
    PointerEvent as ReactPointerEvent,
} from "react";
import { useTranslations } from "next-intl";
import { degrees, PDFDocument, rgb, StandardFonts } from "pdf-lib";
import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";


interface TextOverlay {
    kind: "text";
    id: string;
    pageNumber: number;
    x: number;
    y: number;
    width: number;
    height: number;
    text: string;
    fontSize: number;
    color: string;
}

interface ImageOverlay {
    kind: "image";
    id: string;
    pageNumber: number;
    x: number;
    y: number;
    width: number;
    height: number;
    aspectRatio: number;
    file: File;
    previewUrl: string;
}

type PdfOverlay = TextOverlay | ImageOverlay;
type EditorTool = "select" | "text";
type DragMode = "move" | "resize";

interface RenderedPageInfo {
    width: number;
    height: number;
    scale: number;
    cssPixelsPerPdfPoint: number;
}

interface DragState {
    id: string;
    mode: DragMode;
    pointerX: number;
    pointerY: number;
    x: number;
    y: number;
    width: number;
    height: number;
}

interface PdfEditSectionProps {
    onPreview: (url: string, title: string) => void;
}

interface PdfLoadingTask {
    promise: Promise<PDFDocumentProxy>;
    destroy: () => Promise<void>;
}

const MAX_PDF_SIZE_BYTES = 100 * 1024 * 1024;
const MAX_IMAGE_SIZE_BYTES = 20 * 1024 * 1024;

function clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, value));
}

function colorFromHex(hex: string) {
    const value = hex.replace("#", "");
    return rgb(
        parseInt(value.slice(0, 2), 16) / 255,
        parseInt(value.slice(2, 4), 16) / 255,
        parseInt(value.slice(4, 6), 16) / 255,
    );
}

function formatBytes(bytes: number) {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function pointDistance(a: [number, number], b: [number, number]) {
    return Math.hypot(b[0] - a[0], b[1] - a[1]);
}

function pointAngle(a: [number, number], b: [number, number]) {
    return (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;
}

export default function PdfEditSection({ onPreview }: PdfEditSectionProps) {
    const t = useTranslations("tools.pdfToolkit");
    const fileInputId = useId();
    const imageInputId = useId();

    const [file, setFile] = useState<File | null>(null);
    const [sourceBuffer, setSourceBuffer] = useState<ArrayBuffer | null>(null);
    const [pdfDocument, setPdfDocument] = useState<PDFDocumentProxy | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [items, setItems] = useState<PdfOverlay[]>([]);
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
    const [activeTool, setActiveTool] = useState<EditorTool>("select");
    const [fontSize, setFontSize] = useState(24);
    const [textColor, setTextColor] = useState("#111827");
    const [outputUrl, setOutputUrl] = useState<string | null>(null);
    const [renderedPage, setRenderedPage] = useState<RenderedPageInfo | null>(null);
    const [availableWidth, setAvailableWidth] = useState(760);
    const [error, setError] = useState<string | null>(null);
    const [isDraggingFile, setIsDraggingFile] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isRendering, setIsRendering] = useState(false);
    const renderErrorMessage = t("failedRenderPage");

    const fileInputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const pageAreaRef = useRef<HTMLDivElement>(null);
    const pageFrameRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const dragStateRef = useRef<DragState | null>(null);
    const imageUrlsRef = useRef(new Set<string>());
    const pdfLoadingTaskRef = useRef<PdfLoadingTask | null>(null);

    const selectedItem = items.find((item) => item.id === selectedItemId) ?? null;
    const pageItems = items.filter((item) => item.pageNumber === currentPage);
    const exportableItems = items.filter(
        (item) => item.kind === "image" || item.text.trim().length > 0,
    );

    useEffect(() => {
        if (!outputUrl) return;
        return () => URL.revokeObjectURL(outputUrl);
    }, [outputUrl]);

    useEffect(() => {
        const imageUrls = imageUrlsRef.current;
        return () => {
            imageUrls.forEach((url) => URL.revokeObjectURL(url));
            imageUrls.clear();
        };
    }, []);

    useEffect(() => {
        const loadingTaskRef = pdfLoadingTaskRef;
        return () => {
            if (loadingTaskRef.current) {
                void loadingTaskRef.current.destroy().catch(() => undefined);
            }
        };
    }, []);

    useEffect(() => {
        const element = pageAreaRef.current;
        if (!element || !pdfDocument) return;

        const observer = new ResizeObserver(([entry]) => {
            if (entry) setAvailableWidth(entry.contentRect.width);
        });
        observer.observe(element);
        setAvailableWidth(element.clientWidth);
        return () => observer.disconnect();
    }, [pdfDocument]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!pdfDocument || !canvas) return;

        let cancelled = false;
        let renderTask: { cancel: () => void } | null = null;
        setRenderedPage(null);
        setIsRendering(true);

        const renderPage = async () => {
            const page: PDFPageProxy = await pdfDocument.getPage(currentPage);
            const baseViewport = page.getViewport({ scale: 1 });
            const scale = clamp((availableWidth - 24) / baseViewport.width, 0.2, 1.5);
            const viewport = page.getViewport({ scale });
            const outputScale = Math.min(window.devicePixelRatio || 1, 2);

            canvas.width = Math.ceil(viewport.width * outputScale);
            canvas.height = Math.ceil(viewport.height * outputScale);
            canvas.style.width = `${viewport.width}px`;
            canvas.style.height = `${viewport.height}px`;

            const context = canvas.getContext("2d", { alpha: false });
            if (!context) throw new Error("Canvas rendering is unavailable");

            const task = page.render({
                canvas,
                canvasContext: context,
                viewport,
                transform:
                    outputScale === 1
                        ? undefined
                        : [outputScale, 0, 0, outputScale, 0, 0],
            });
            renderTask = task;
            await task.promise;

            if (cancelled) return;
            const displayedPdfWidth =
                page.rotate % 180 === 0
                    ? page.view[2] - page.view[0]
                    : page.view[3] - page.view[1];
            setRenderedPage({
                width: viewport.width,
                height: viewport.height,
                scale,
                cssPixelsPerPdfPoint: baseViewport.width / displayedPdfWidth,
            });
            setError(null);
            setIsRendering(false);
        };

        void renderPage().catch((renderError: unknown) => {
            const name = renderError instanceof Error ? renderError.name : "";
            if (!cancelled && name !== "RenderingCancelledException") {
                setError(renderErrorMessage);
                setIsRendering(false);
            }
        });

        return () => {
            cancelled = true;
            renderTask?.cancel();
        };
    }, [availableWidth, currentPage, pdfDocument, renderErrorMessage]);

    const revokeImageUrls = () => {
        imageUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
        imageUrlsRef.current.clear();
    };

    const handleLoadFile = async (selectedFile: File) => {
        setError(null);
        if (
            selectedFile.type !== "application/pdf" &&
            !selectedFile.name.toLowerCase().endsWith(".pdf")
        ) {
            setError(t("invalidPdf"));
            return;
        }
        if (selectedFile.size > MAX_PDF_SIZE_BYTES) {
            setError(t("fileTooLarge"));
            return;
        }

        setIsProcessing(true);
        let pendingLoadingTask: PdfLoadingTask | null = null;
        try {
            const buffer = await selectedFile.arrayBuffer();
            const pdfjs = await import("pdfjs-dist");
            pdfjs.GlobalWorkerOptions.workerSrc = new URL(
                "pdfjs-dist/build/pdf.worker.min.mjs",
                import.meta.url,
            ).toString();
            pendingLoadingTask = pdfjs.getDocument({
                data: new Uint8Array(buffer.slice(0)),
                useSystemFonts: true,
                enableXfa: false,
            });
            const loadedDocument = await pendingLoadingTask.promise;
            const previousLoadingTask = pdfLoadingTaskRef.current;
            pdfLoadingTaskRef.current = pendingLoadingTask;
            pendingLoadingTask = null;
            if (previousLoadingTask) {
                void previousLoadingTask.destroy().catch(() => undefined);
            }

            setFile(selectedFile);
            setSourceBuffer(buffer);
            setPdfDocument(loadedDocument);
            setCurrentPage(1);
            setItems([]);
            setSelectedItemId(null);
            setActiveTool("select");
            setOutputUrl(null);
            setRenderedPage(null);
            revokeImageUrls();
        } catch {
            if (pendingLoadingTask) {
                void pendingLoadingTask.destroy().catch(() => undefined);
            }
            setError(t("failedLoadPdf"));
        } finally {
            setIsProcessing(false);
        }
    };

    const getNormalizedPoint = (clientX: number, clientY: number) => {
        const rect = pageFrameRef.current?.getBoundingClientRect();
        if (!rect || rect.width === 0 || rect.height === 0) return null;
        return {
            x: clamp((clientX - rect.left) / rect.width, 0, 1),
            y: clamp((clientY - rect.top) / rect.height, 0, 1),
        };
    };

    const addTextAt = (point: { x: number; y: number }) => {
        if (!renderedPage) return;

        const width = 0.34;
        const height = clamp(
            (fontSize * renderedPage.cssPixelsPerPdfPoint * renderedPage.scale * 2.2) /
                renderedPage.height,
            0.08,
            0.3,
        );
        const id = `${Date.now()}-${Math.random()}`;
        const newItem: TextOverlay = {
            kind: "text",
            id,
            pageNumber: currentPage,
            x: clamp(point.x, 0, 1 - width),
            y: clamp(point.y, 0, 1 - height),
            width,
            height,
            text: t("defaultOverlayText"),
            fontSize,
            color: textColor,
        };
        setItems((current) => [...current, newItem]);
        setSelectedItemId(id);
        setActiveTool("select");
        setOutputUrl(null);
    };

    const handlePageClick = (event: ReactMouseEvent<HTMLDivElement>) => {
        if (activeTool !== "text" || !renderedPage) {
            if (activeTool === "select") setSelectedItemId(null);
            return;
        }

        const point = getNormalizedPoint(event.clientX, event.clientY);
        if (point) addTextAt(point);
    };

    const addImageAt = async (
        imageFile: File,
        point: { x: number; y: number },
    ) => {
        const isPng = imageFile.type === "image/png" || /\.png$/i.test(imageFile.name);
        const isJpeg =
            imageFile.type === "image/jpeg" || /\.(jpe?g)$/i.test(imageFile.name);
        if (!isPng && !isJpeg) {
            setError(t("invalidImage"));
            return;
        }
        if (imageFile.size > MAX_IMAGE_SIZE_BYTES) {
            setError(t("imageTooLarge"));
            return;
        }
        if (!renderedPage) return;

        setError(null);
        setIsProcessing(true);
        const previewUrl = URL.createObjectURL(imageFile);
        imageUrlsRef.current.add(previewUrl);

        try {
            const image = new Image();
            await new Promise<void>((resolve, reject) => {
                image.onload = () => resolve();
                image.onerror = () => reject(new Error("Image decoding failed"));
                image.src = previewUrl;
            });

            const aspectRatio = image.naturalHeight / image.naturalWidth;
            const width = Math.min(
                0.35,
                (0.72 * renderedPage.height) /
                    (renderedPage.width * aspectRatio),
            );
            const height =
                (width * renderedPage.width * aspectRatio) / renderedPage.height;
            const id = `${Date.now()}-${Math.random()}`;
            const newItem: ImageOverlay = {
                kind: "image",
                id,
                pageNumber: currentPage,
                x: clamp(point.x - width / 2, 0, 1 - width),
                y: clamp(point.y - height / 2, 0, 1 - height),
                width,
                height,
                aspectRatio,
                file: imageFile,
                previewUrl,
            };
            setItems((current) => [...current, newItem]);
            setSelectedItemId(id);
            setOutputUrl(null);
        } catch {
            imageUrlsRef.current.delete(previewUrl);
            URL.revokeObjectURL(previewUrl);
            setError(t("imageLoadError"));
        } finally {
            setIsProcessing(false);
        }
    };

    const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
        const imageFile = event.currentTarget.files?.[0];
        event.currentTarget.value = "";
        if (imageFile) addImageAt(imageFile, { x: 0.5, y: 0.5 });
    };

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.currentTarget.files?.[0];
        event.currentTarget.value = "";
        if (selectedFile) handleLoadFile(selectedFile);
    };

    const handleFileDrop = (event: ReactDragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsDraggingFile(false);
        const droppedFile = event.dataTransfer.files?.[0];
        if (droppedFile) handleLoadFile(droppedFile);
    };

    const handleEditorDropOnPage = (event: ReactDragEvent<HTMLDivElement>) => {
        event.preventDefault();
        const point = getNormalizedPoint(event.clientX, event.clientY);
        if (!point) return;

        if (event.dataTransfer.getData("application/x-local-pdf-text-tool") === "text") {
            addTextAt(point);
            return;
        }

        const imageFile = event.dataTransfer.files?.[0];
        if (imageFile) addImageAt(imageFile, point);
    };

    const beginOverlayDrag = (
        event: ReactPointerEvent<HTMLButtonElement>,
        item: PdfOverlay,
        mode: DragMode,
    ) => {
        event.preventDefault();
        event.stopPropagation();
        const frame = pageFrameRef.current;
        if (!frame) return;
        frame.setPointerCapture(event.pointerId);
        dragStateRef.current = {
            id: item.id,
            mode,
            pointerX: event.clientX,
            pointerY: event.clientY,
            x: item.x,
            y: item.y,
            width: item.width,
            height: item.height,
        };
        setSelectedItemId(item.id);
    };

    const handlePagePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
        const drag = dragStateRef.current;
        const frame = pageFrameRef.current;
        if (!drag || !frame || !renderedPage) return;

        const rect = frame.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;
        const dx = (event.clientX - drag.pointerX) / rect.width;
        const dy = (event.clientY - drag.pointerY) / rect.height;

        setItems((current) =>
            current.map((item) => {
                if (item.id !== drag.id) return item;
                if (drag.mode === "move") {
                    return {
                        ...item,
                        x: clamp(drag.x + dx, 0, 1 - item.width),
                        y: clamp(drag.y + dy, 0, 1 - item.height),
                    };
                }

                if (item.kind === "image") {
                    const aspect =
                        (renderedPage.width * item.aspectRatio) / renderedPage.height;
                    let width = clamp(drag.width + dx, 0.06, 1 - drag.x);
                    let height = width * aspect;
                    if (height > 1 - drag.y) {
                        height = 1 - drag.y;
                        width = height / aspect;
                    }
                    return { ...item, width, height };
                }

                return {
                    ...item,
                    width: clamp(drag.width + dx, 0.1, 1 - drag.x),
                    height: clamp(drag.height + dy, 0.06, 1 - drag.y),
                };
            }),
        );
        setOutputUrl(null);
    };

    const endOverlayDrag = () => {
        dragStateRef.current = null;
    };

    const handleTextChange = (item: TextOverlay, value: string) => {
        setItems((current) =>
            current.map((candidate) =>
                candidate.id === item.id && candidate.kind === "text"
                    ? { ...candidate, text: value }
                    : candidate,
            ),
        );
        setOutputUrl(null);
    };

    const handleFontSizeChange = (value: number) => {
        if (!Number.isFinite(value)) return;
        const nextSize = clamp(value, 4, 96);
        setFontSize(nextSize);
        if (selectedItem?.kind === "text") {
            setItems((current) =>
                current.map((item) =>
                    item.id === selectedItem.id && item.kind === "text"
                        ? { ...item, fontSize: nextSize }
                        : item,
                ),
            );
            setOutputUrl(null);
        }
    };

    const handleColorChange = (value: string) => {
        setTextColor(value);
        if (selectedItem?.kind === "text") {
            setItems((current) =>
                current.map((item) =>
                    item.id === selectedItem.id && item.kind === "text"
                        ? { ...item, color: value }
                        : item,
                ),
            );
            setOutputUrl(null);
        }
    };

    const handleRemoveItem = (item: PdfOverlay) => {
        setItems((current) => current.filter((candidate) => candidate.id !== item.id));
        if (item.kind === "image") {
            URL.revokeObjectURL(item.previewUrl);
            imageUrlsRef.current.delete(item.previewUrl);
        }
        setSelectedItemId(null);
        setOutputUrl(null);
    };

    const handleClearItems = () => {
        setItems([]);
        setSelectedItemId(null);
        setOutputUrl(null);
        revokeImageUrls();
    };

    const handlePageChange = (nextPage: number) => {
        setCurrentPage(nextPage);
        setSelectedItemId(null);
        setRenderedPage(null);
    };

    const handleCreatePdf = async () => {
        if (!sourceBuffer || !pdfDocument || exportableItems.length === 0) return;

        setError(null);
        setIsProcessing(true);
        try {
            const outputDocument = await PDFDocument.load(sourceBuffer);
            const font = await outputDocument.embedFont(StandardFonts.Helvetica);

            for (const item of exportableItems) {
                const outputPage = outputDocument.getPage(item.pageNumber - 1);
                const sourcePage = await pdfDocument.getPage(item.pageNumber);
                const viewport = sourcePage.getViewport({ scale: 1 });

                if (item.kind === "text") {
                    const displayedPdfWidth =
                        sourcePage.rotate % 180 === 0
                            ? sourcePage.view[2] - sourcePage.view[0]
                            : sourcePage.view[3] - sourcePage.view[1];
                    const cssPixelsPerPdfPoint = viewport.width / displayedPdfWidth;
                    const xPx = item.x * viewport.width;
                    const topPx = item.y * viewport.height;
                    const baselinePx = topPx + item.fontSize * cssPixelsPerPdfPoint;
                    const left = viewport.convertToPdfPoint(xPx, baselinePx) as [number, number];
                    const right = viewport.convertToPdfPoint(
                        xPx + item.width * viewport.width,
                        baselinePx,
                    ) as [number, number];

                    outputPage.drawText(item.text, {
                        x: left[0],
                        y: left[1],
                        size: item.fontSize,
                        font,
                        color: colorFromHex(item.color),
                        rotate: degrees(pointAngle(left, right)),
                        maxWidth: Math.max(1, pointDistance(left, right)),
                        lineHeight: item.fontSize * 1.2,
                    });
                    continue;
                }

                const imageBytes = new Uint8Array(await item.file.arrayBuffer());
                const embeddedImage =
                    item.file.type === "image/png" || /\.png$/i.test(item.file.name)
                        ? await outputDocument.embedPng(imageBytes)
                        : await outputDocument.embedJpg(imageBytes);
                const xPx = item.x * viewport.width;
                const yTopPx = item.y * viewport.height;
                const yBottomPx = (item.y + item.height) * viewport.height;
                const leftBottom = viewport.convertToPdfPoint(xPx, yBottomPx) as [number, number];
                const rightBottom = viewport.convertToPdfPoint(
                    (item.x + item.width) * viewport.width,
                    yBottomPx,
                ) as [number, number];
                const leftTop = viewport.convertToPdfPoint(xPx, yTopPx) as [number, number];

                outputPage.drawImage(embeddedImage, {
                    x: leftBottom[0],
                    y: leftBottom[1],
                    width: pointDistance(leftBottom, rightBottom),
                    height: pointDistance(leftBottom, leftTop),
                    rotate: degrees(pointAngle(leftBottom, rightBottom)),
                });
            }

            const bytes = await outputDocument.save();
            const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
            setOutputUrl(URL.createObjectURL(blob));
        } catch {
            setError(t("failedApplyText"));
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownload = () => {
        if (!outputUrl || !file) return;
        const link = document.createElement("a");
        link.href = outputUrl;
        link.download = `${file.name.replace(/\.pdf$/i, "")}_edited.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
    };

    const handleClear = () => {
        setFile(null);
        setSourceBuffer(null);
        setPdfDocument(null);
        if (pdfLoadingTaskRef.current) {
            void pdfLoadingTaskRef.current.destroy().catch(() => undefined);
            pdfLoadingTaskRef.current = null;
        }
        setCurrentPage(1);
        setItems([]);
        setSelectedItemId(null);
        setOutputUrl(null);
        setRenderedPage(null);
        setError(null);
        setActiveTool("select");
        revokeImageUrls();
        if (fileInputRef.current) fileInputRef.current.value = "";
        if (imageInputRef.current) imageInputRef.current.value = "";
    };

    return (
        <div className="flex flex-col gap-5 animate-in fade-in duration-200">
            {!file ? (
                <div
                    onDragOver={(event) => {
                        event.preventDefault();
                        setIsDraggingFile(true);
                    }}
                    onDragLeave={() => setIsDraggingFile(false)}
                    onDrop={handleFileDrop}
                    className={`card card-border border-2 border-dashed p-10 flex flex-col items-center justify-center gap-3 text-center transition-all ${
                        isDraggingFile
                            ? "border-primary bg-primary/5 scale-[0.99]"
                            : "border-base-content/20 hover:border-primary/50 hover:bg-base-200/30"
                    }`}
                >
                    <input
                        ref={fileInputRef}
                        id={fileInputId}
                        type="file"
                        accept="application/pdf,.pdf"
                        onChange={handleFileChange}
                        disabled={isProcessing}
                        className="sr-only"
                    />
                    <label
                        htmlFor={fileInputId}
                        className="flex flex-col items-center gap-2.5 cursor-pointer w-full"
                    >
                        <div className="size-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                            {isProcessing ? (
                                <span className="loading loading-spinner size-7"></span>
                            ) : (
                                <span className="icon-[lucide--file-pen] size-7"></span>
                            )}
                        </div>
                        <span className="font-semibold text-sm text-base-content">
                            {isProcessing ? t("loadingPdf") : t("editDropzone")}
                        </span>
                        <span className="text-xs text-base-content/60">
                            {t("editDropzoneHint")}
                        </span>
                    </label>
                </div>
            ) : (
                <>
                    <div className="card card-border bg-base-100 p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                            <span className="icon-[lucide--file-check-2] size-6 text-primary shrink-0"></span>
                            <div className="min-w-0">
                                <p className="text-sm font-semibold truncate">{file.name}</p>
                                <p className="text-xs text-base-content/60">
                                    {t("pagesCount", { count: pdfDocument?.numPages ?? 0 })} · {formatBytes(file.size)}
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={handleClear}
                            disabled={isProcessing}
                            className="btn btn-xs btn-ghost"
                        >
                            {t("clear")}
                        </button>
                    </div>

                    <div className="card card-border bg-base-100 p-4 shadow-sm flex flex-col gap-4">
                        <div>
                            <h3 className="font-bold text-sm">{t("addTextTitle")}</h3>
                            <p className="mt-1 text-xs text-base-content/60">{t("addTextDescription")}</p>
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex flex-wrap items-center gap-2">
                                <button
                                    type="button"
                                    aria-pressed={activeTool === "select"}
                                    onClick={() => setActiveTool("select")}
                                    className={`btn btn-sm gap-2 ${activeTool === "select" ? "btn-primary" : "btn-outline"}`}
                                >
                                    <span className="icon-[lucide--mouse-pointer-2] size-4"></span>
                                    {t("selectMoveTool")}
                                </button>
                                <button
                                    type="button"
                                    draggable
                                    aria-pressed={activeTool === "text"}
                                    onClick={() => setActiveTool("text")}
                                    onDragStart={(event) => {
                                        event.dataTransfer.setData("application/x-local-pdf-text-tool", "text");
                                        event.dataTransfer.effectAllowed = "copy";
                                        setActiveTool("text");
                                    }}
                                    onDragEnd={() => setActiveTool("select")}
                                    className={`btn btn-sm gap-2 ${activeTool === "text" ? "btn-primary" : "btn-outline"}`}
                                >
                                    <span className="icon-[lucide--type] size-4"></span>
                                    {t("addTextTool")}
                                </button>
                                <input
                                    ref={imageInputRef}
                                    id={imageInputId}
                                    type="file"
                                    accept="image/png,image/jpeg,.png,.jpg,.jpeg"
                                    onChange={handleImageChange}
                                    className="sr-only"
                                />
                                <button
                                    type="button"
                                    onClick={() => imageInputRef.current?.click()}
                                    disabled={isProcessing || isRendering}
                                    className="btn btn-sm btn-outline gap-2"
                                >
                                    <span className="icon-[lucide--image-plus] size-4"></span>
                                    {t("addImageTool")}
                                </button>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage <= 1 || isRendering}
                                    className="btn btn-sm btn-ghost btn-square"
                                    aria-label={t("previousPage")}
                                    title={t("previousPage")}
                                >
                                    <span className="icon-[lucide--chevron-left] size-4"></span>
                                </button>
                                <span className="min-w-16 text-center text-xs font-mono">
                                    {t("pageCounter", {
                                        page: currentPage,
                                        total: pdfDocument?.numPages ?? 0,
                                    })}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage >= (pdfDocument?.numPages ?? 0) || isRendering}
                                    className="btn btn-sm btn-ghost btn-square"
                                    aria-label={t("nextPage")}
                                    title={t("nextPage")}
                                >
                                    <span className="icon-[lucide--chevron-right] size-4"></span>
                                </button>
                            </div>
                        </div>

                        {(activeTool === "text" || selectedItem?.kind === "text") && (
                            <div className="flex flex-wrap items-end gap-3 border-t border-base-content/10 pt-3">
                                <label className="form-control gap-1">
                                    <span className="label-text text-xs font-semibold">{t("fontSizeLabel")}</span>
                                    <input
                                        type="number"
                                        min={4}
                                        max={96}
                                        value={fontSize}
                                        onChange={(event) => handleFontSizeChange(Number(event.target.value))}
                                        className="input input-sm input-bordered w-24"
                                    />
                                </label>
                                <label className="form-control gap-1">
                                    <span className="label-text text-xs font-semibold">{t("textColorLabel")}</span>
                                    <input
                                        type="color"
                                        value={textColor}
                                        onChange={(event) => handleColorChange(event.target.value)}
                                        className="input input-sm input-bordered w-16 p-1"
                                    />
                                </label>
                                {selectedItem?.kind === "text" && (
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveItem(selectedItem)}
                                        className="btn btn-sm btn-ghost text-error gap-2"
                                    >
                                        <span className="icon-[lucide--trash-2] size-4"></span>
                                        {t("removeOverlay")}
                                    </button>
                                )}
                            </div>
                        )}

                        <p className="text-xs text-base-content/60">
                            {activeTool === "text" ? t("placeTextHint") : t("dragObjectsHint")}
                        </p>

                        <div
                            ref={pageAreaRef}
                            className="min-h-90 max-h-[75vh] overflow-auto rounded-xl bg-base-200/70 p-3 flex items-start justify-center"
                        >
                            <div
                                ref={pageFrameRef}
                                onClick={handlePageClick}
                                onDragOver={(event) => {
                                    event.preventDefault();
                                    event.dataTransfer.dropEffect = "copy";
                                }}
                                onDrop={handleEditorDropOnPage}
                                onPointerMove={handlePagePointerMove}
                                onPointerUp={endOverlayDrag}
                                onPointerCancel={endOverlayDrag}
                                onLostPointerCapture={endOverlayDrag}
                                className={`relative shrink-0 bg-white shadow-xl touch-none ${activeTool === "text" ? "cursor-crosshair" : ""}`}
                                style={{
                                    width: renderedPage?.width ?? 0,
                                    height: renderedPage?.height ?? 0,
                                }}
                            >
                                <canvas ref={canvasRef} className="absolute inset-0 block" />

                                {renderedPage &&
                                    pageItems.map((item) => {
                                        const isSelected = selectedItemId === item.id;
                                        return (
                                            <div
                                                key={item.id}
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    setSelectedItemId(item.id);
                                                }}
                                                className={`absolute group ${isSelected ? "z-20" : "z-10"}`}
                                                style={{
                                                    left: `${item.x * 100}%`,
                                                    top: `${item.y * 100}%`,
                                                    width: `${item.width * 100}%`,
                                                    height: `${item.height * 100}%`,
                                                }}
                                            >
                                                {item.kind === "text" ? (
                                                    <textarea
                                                        value={item.text}
                                                        onChange={(event) => handleTextChange(item, event.target.value)}
                                                        onFocus={() => {
                                                            setSelectedItemId(item.id);
                                                            setFontSize(item.fontSize);
                                                            setTextColor(item.color);
                                                        }}
                                                        onPointerDown={(event) => event.stopPropagation()}
                                                        onClick={(event) => event.stopPropagation()}
                                                        onFocusCapture={(event) => {
                                                            if (item.text === t("defaultOverlayText")) {
                                                                event.currentTarget.select();
                                                            }
                                                        }}
                                                        autoFocus={isSelected}
                                                        aria-label={t("textOverlayLabel")}
                                                        className={`h-full w-full resize-none overflow-hidden bg-transparent p-0 outline-none ${isSelected ? "border-2 border-primary" : "border border-dashed border-primary/40"}`}
                                                        style={{
                                                            color: item.color,
                                                            fontFamily: "Helvetica, Arial, sans-serif",
                                                            fontSize: `${item.fontSize * renderedPage.cssPixelsPerPdfPoint * renderedPage.scale}px`,
                                                            lineHeight: 1.2,
                                                        }}
                                                    />
                                                ) : (
                                                    <img
                                                        src={item.previewUrl}
                                                        alt={t("imageOverlayLabel")}
                                                        draggable={false}
                                                        onPointerDown={() => setSelectedItemId(item.id)}
                                                        className={`h-full w-full select-none object-fill ${isSelected ? "outline-2 outline-primary" : "outline-1 outline-dashed outline-primary/40"}`}
                                                    />
                                                )}

                                                {isSelected && (
                                                    <>
                                                        <button
                                                            type="button"
                                                            onPointerDown={(event) => beginOverlayDrag(event, item, "move")}
                                                            className="absolute -top-7 left-0 btn btn-xs btn-primary btn-square cursor-move touch-none"
                                                            aria-label={t("moveOverlay")}
                                                            title={t("moveOverlay")}
                                                        >
                                                            <span className="icon-[lucide--move] size-3.5"></span>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onPointerDown={(event) => beginOverlayDrag(event, item, "resize")}
                                                            className="absolute -bottom-2 -right-2 btn btn-xs btn-primary btn-square cursor-nwse-resize touch-none"
                                                            aria-label={t("resizeOverlay")}
                                                            title={t("resizeOverlay")}
                                                        >
                                                            <span className="icon-[lucide--move-diagonal-2] size-3"></span>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={(event) => {
                                                                event.stopPropagation();
                                                                handleRemoveItem(item);
                                                            }}
                                                            className="absolute -top-7 -right-1 btn btn-xs btn-error btn-square"
                                                            aria-label={t("removeOverlay")}
                                                            title={t("removeOverlay")}
                                                        >
                                                            <span className="icon-[lucide--x] size-3.5"></span>
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>

                        {isRendering && (
                            <div className="flex items-center justify-center gap-2 text-xs text-base-content/60">
                                <span className="loading loading-spinner size-4"></span>
                                {t("renderingPage")}
                            </div>
                        )}
                    </div>

                    <div className="card card-border bg-base-100 p-5 shadow-sm flex flex-col gap-4">
                        <div className="flex items-center justify-between gap-3">
                            <h3 className="font-bold text-sm">{t("pendingEditsTitle", { count: items.length })}</h3>
                            {items.length > 0 && (
                                <button
                                    type="button"
                                    onClick={handleClearItems}
                                    disabled={isProcessing}
                                    className="btn btn-xs btn-ghost"
                                >
                                    {t("clearPendingEdits")}
                                </button>
                            )}
                        </div>
                        {items.length === 0 ? (
                            <p className="text-xs text-base-content/60">{t("noPendingEdits")}</p>
                        ) : (
                            <ul className="flex flex-col gap-2">
                                {items.map((item) => (
                                    <li
                                        key={item.id}
                                        className="flex items-center justify-between gap-3 rounded-lg bg-base-200/40 p-3"
                                    >
                                        <button
                                            type="button"
                                            onClick={() => {
                                                handlePageChange(item.pageNumber);
                                                setSelectedItemId(item.id);
                                            }}
                                            className="min-w-0 flex-1 text-left"
                                        >
                                            <span className="text-sm font-medium truncate block">
                                                {item.kind === "text" ? item.text : item.file.name || t("imageOverlayLabel")}
                                            </span>
                                            <span className="block text-[11px] text-base-content/60">
                                                {t("editItemDetails", {
                                                    type: item.kind === "text" ? t("textItemType") : t("imageItemType"),
                                                    page: item.pageNumber,
                                                })}
                                            </span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveItem(item)}
                                            disabled={isProcessing}
                                            className="btn btn-xs btn-ghost btn-square text-error"
                                            aria-label={t("removeOverlay")}
                                            title={t("removeOverlay")}
                                        >
                                            <span className="icon-[lucide--trash-2] size-3.5"></span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}

                        {items.length > 0 && (
                            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-base-content/10 pt-3">
                                <button
                                    type="button"
                                    onClick={handleCreatePdf}
                                    disabled={isProcessing || isRendering || exportableItems.length === 0}
                                    className="btn btn-sm btn-primary gap-2"
                                >
                                    {isProcessing ? (
                                        <span className="loading loading-spinner size-4"></span>
                                    ) : (
                                        <span className="icon-[lucide--file-check] size-4"></span>
                                    )}
                                    {isProcessing ? t("preparingPdf") : t("applyText")}
                                </button>
                            </div>
                        )}

                        {outputUrl && file && (
                            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-success/20 bg-success/5 p-3">
                                <span className="text-xs text-success font-medium">{t("editedPdfReady")}</span>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => onPreview(outputUrl, `${file.name} — ${t("previewEditedPdf")}`)}
                                        className="btn btn-xs btn-outline"
                                    >
                                        {t("previewEditedPdf")}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleDownload}
                                        className="btn btn-xs btn-success"
                                    >
                                        {t("downloadEditedPdf")}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}

            {error && <p role="alert" className="text-sm text-error">{error}</p>}
            <p className="text-center text-xs text-base-content/60">{t("editPrivacyNote")}</p>
        </div>
    );
}
