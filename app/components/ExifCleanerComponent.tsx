// app/components/ExifCleanerComponent.tsx
"use client";

import { useState, useRef, ChangeEvent, DragEvent } from "react";
import { useTranslations } from "next-intl";
import exifr from "exifr";
import { Link } from "@/i18n/routing";

interface ExifDetails {
    make?: string;
    model?: string;
    dateTime?: string;
    latitude?: number;
    longitude?: number;
    altitude?: number;
    software?: string;
    lensModel?: string;
    iso?: number;
    fNumber?: number;
    exposureTime?: number;
    totalTagsCount: number;
    allRawTags: [string, string][];
}

interface LoadedFile {
    file: File;
    previewUrl: string;
    exif: ExifDetails | null;
}

interface CleanedResult {
    name: string;
    originalSize: number;
    cleanedSize: number;
    downloadUrl: string;
}

export default function ExifCleanerComponent() {
    const t = useTranslations("tools.exifCleaner");
    const tCommon = useTranslations("common");
    const [isDragging, setIsDragging] = useState(false);
    const [isInspecting, setIsInspecting] = useState(false);
    const [isCleaning, setIsCleaning] = useState(false);

    const [loadedFile, setLoadedFile] = useState<LoadedFile | null>(null);
    const [cleanedResult, setCleanedResult] = useState<CleanedResult | null>(
        null,
    );
    const [showRawTags, setShowRawTags] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return "0 B";
        const k = 1024;
        const sizes = ["B", "Ko", "Mo"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
    };

    // Étape 1 : Inspection du fichier original
    const handleInspect = async (file: File) => {
        if (!file.type.startsWith("image/")) return;

        setIsInspecting(true);
        setCleanedResult(null);

        try {
            const buffer = await file.arrayBuffer();

            // exifr.parse(buffer, true) active l'ENSEMBLE des segments (TIFF, EXIF, GPS, IPTC, XMP)
            const parser =
                (exifr as any)?.parse ||
                (exifr as any)?.default?.parse ||
                exifr;
            const rawData = await parser(buffer, true);

            let parsedExif: ExifDetails | null = null;

            if (
                rawData &&
                typeof rawData === "object" &&
                Object.keys(rawData).length > 0
            ) {
                const rawEntries: [string, string][] = [];

                for (const [key, val] of Object.entries(rawData)) {
                    // Filtre les buffers binaires internes (miniatures, etc.)
                    if (
                        val !== null &&
                        val !== undefined &&
                        !(val instanceof Uint8Array)
                    ) {
                        const displayVal =
                            val instanceof Date
                                ? val.toLocaleString()
                                : String(val);
                        rawEntries.push([key, displayVal]);
                    }
                }

                parsedExif = {
                    make: rawData.Make,
                    model: rawData.Model,
                    dateTime: rawData.DateTimeOriginal
                        ? new Date(rawData.DateTimeOriginal).toLocaleString()
                        : rawData.CreateDate
                          ? new Date(rawData.CreateDate).toLocaleString()
                          : undefined,
                    latitude:
                        typeof rawData.latitude === "number"
                            ? rawData.latitude
                            : undefined,
                    longitude:
                        typeof rawData.longitude === "number"
                            ? rawData.longitude
                            : undefined,
                    altitude:
                        typeof rawData.GPSAltitude === "number"
                            ? rawData.GPSAltitude
                            : undefined,
                    software: rawData.Software,
                    lensModel: rawData.LensModel,
                    iso: rawData.ISO,
                    fNumber: rawData.FNumber,
                    exposureTime: rawData.ExposureTime,
                    totalTagsCount: rawEntries.length,
                    allRawTags: rawEntries,
                };
            }

            setLoadedFile({
                file,
                previewUrl: URL.createObjectURL(file),
                exif: parsedExif,
            });
        } catch (err) {
            console.error("Audit error:", err);
            setLoadedFile({
                file,
                previewUrl: URL.createObjectURL(file),
                exif: null,
            });
        } finally {
            setIsInspecting(false);
        }
    };

    // Étape 2 : Nettoyage physique sur Canvas & Déclenchement du téléchargement
    const handleCleanAndDownload = async () => {
        if (!loadedFile) return;

        setIsCleaning(true);

        try {
            const imageBitmap = await createImageBitmap(loadedFile.file);
            const canvas = document.createElement("canvas");
            canvas.width = imageBitmap.width;
            canvas.height = imageBitmap.height;

            const ctx = canvas.getContext("2d");
            if (!ctx) throw new Error("Canvas context inaccessible");

            ctx.drawImage(imageBitmap, 0, 0);

            const outputType =
                loadedFile.file.type === "image/png"
                    ? "image/png"
                    : "image/jpeg";
            const quality = outputType === "image/jpeg" ? 0.95 : undefined;

            canvas.toBlob(
                (blob) => {
                    if (!blob) {
                        setIsCleaning(false);
                        return;
                    }

                    const originalName = loadedFile.file.name;
                    const dotIdx = originalName.lastIndexOf(".");
                    const baseName =
                        dotIdx !== -1
                            ? originalName.slice(0, dotIdx)
                            : originalName;
                    const ext =
                        dotIdx !== -1 ? originalName.slice(dotIdx) : ".jpg";
                    const finalName = `${baseName}${t("cleanedFileNameSuffix")}${ext}`;

                    const downloadUrl = URL.createObjectURL(blob);

                    setCleanedResult({
                        name: finalName,
                        originalSize: loadedFile.file.size,
                        cleanedSize: blob.size,
                        downloadUrl,
                    });

                    // Déclenche automatiquement le téléchargement
                    const link = document.createElement("a");
                    link.href = downloadUrl;
                    link.download = finalName;
                    link.click();

                    setIsCleaning(false);
                },
                outputType,
                quality,
            );
        } catch (err) {
            console.error("Cleaning error:", err);
            setIsCleaning(false);
        }
    };

    const handleReset = () => {
        if (loadedFile?.previewUrl) URL.revokeObjectURL(loadedFile.previewUrl);
        if (cleanedResult?.downloadUrl)
            URL.revokeObjectURL(cleanedResult.downloadUrl);

        setLoadedFile(null);
        setCleanedResult(null);
        setShowRawTags(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files?.[0]) handleInspect(e.dataTransfer.files[0]);
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) handleInspect(e.target.files[0]);
    };

    const exif = loadedFile?.exif;
    const hasGps =
        exif?.latitude !== undefined && exif?.longitude !== undefined;

    return (
        <div className="flex flex-col gap-8 max-w-4xl mx-auto w-full">
            {/* Header */}
            <div className="flex flex-col gap-2 border-b border-base-content/10 pb-6">
                <div className="flex items-center gap-2 mb-1">
                    <Link
                        href="/"
                        className="text-xs text-base-content/60 hover:text-primary transition-colors"
                    >
                        {tCommon("home")}
                    </Link>
                    <span className="text-xs text-base-content/30">/</span>
                    <span className="text-xs text-primary font-medium">
                        {t("title")}
                    </span>
                </div>
                <h1 className="text-2xl font-bold text-base-content flex items-center gap-2.5">
                    <span className="icon-[lucide--image-minus] size-6 text-primary"></span>
                    {t("title")}
                </h1>
                <p className="text-xs text-base-content/60 leading-relaxed">
                    {t("desc")}
                </p>
            </div>

            {/* Zone 1 : Dépôt de fichier */}
            {!loadedFile ? (
                <div
                    onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`card card-border border-2 border-dashed p-12 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all duration-200 text-center ${
                        isDragging
                            ? "border-primary bg-primary/5 scale-[0.99]"
                            : "border-base-content/20 hover:border-primary/50 hover:bg-base-200/30"
                    }`}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleFileChange}
                        className="hidden"
                    />

                    <div className="size-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                        {isInspecting ? (
                            <span className="loading loading-spinner size-8"></span>
                        ) : (
                            <span className="icon-[lucide--scan-eye] size-8"></span>
                        )}
                    </div>

                    <div className="flex flex-col gap-1">
                        <span className="font-semibold text-sm text-base-content">
                            {isInspecting ? t("inspecting") : t("dropzone")}
                        </span>
                        <span className="text-xs text-base-content/60">
                            {t("dropzoneHint")}
                        </span>
                    </div>

                    <span className="badge badge-sm badge-soft badge-success">
                        100% Client-Side Privacy Audit
                    </span>
                </div>
            ) : (
                /* Zone 2 : Résultat de l'Audit de l'image originale */
                <div className="flex flex-col gap-6 animate-in fade-in duration-200">
                    {/* Alerte GPS */}
                    {hasGps && (
                        <div className="alert alert-soft alert-warning flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3">
                                <span className="icon-[lucide--map-pin-off] size-5 text-warning shrink-0 mt-0.5"></span>
                                <div className="flex flex-col gap-0.5">
                                    <span className="font-bold text-sm text-base-content">
                                        {t("gpsAlertTitle")}
                                    </span>
                                    <span className="text-xs text-base-content/70">
                                        {t("gpsAlertDesc")}
                                    </span>
                                    <span className="font-mono text-xs font-semibold mt-1">
                                        {exif.latitude?.toFixed(5)}°,{" "}
                                        {exif.longitude?.toFixed(5)}°
                                        {exif.altitude
                                            ? ` (${Math.round(exif.altitude)}m alt)`
                                            : ""}
                                    </span>
                                </div>
                            </div>
                            <a
                                href={`https://www.openstreetmap.org/?mlat=${exif.latitude}&mlon=${exif.longitude}#map=16/${exif.latitude}/${exif.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-xs btn-outline border-warning/40 hover:bg-warning hover:text-warning-content shrink-0 gap-1.5"
                            >
                                <span className="icon-[lucide--external-link] size-3"></span>
                                <span>{t("viewOnMap")}</span>
                            </a>
                        </div>
                    )}

                    {/* Grille : Aperçu + Rapport EXIF */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                        {/* Colonne gauche : Image originale */}
                        <div className="md:col-span-5 flex flex-col gap-3">
                            <div className="card card-border bg-base-100 p-4 flex flex-col items-center justify-center gap-3">
                                <div className="w-full aspect-square rounded-xl overflow-hidden bg-base-200/50 border border-base-content/10 flex items-center justify-center relative">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={loadedFile.previewUrl}
                                        alt="Original preview"
                                        className="w-full h-full object-contain"
                                    />
                                    <span className="badge badge-sm badge-neutral absolute top-2 right-2 shadow-sm">
                                        {formatBytes(loadedFile.file.size)}
                                    </span>
                                </div>
                                <span className="font-mono text-xs text-base-content/70 truncate w-full text-center">
                                    {loadedFile.file.name}
                                </span>
                            </div>

                            {/* Résultat si déjà nettoyé */}
                            {cleanedResult && (
                                <div className="alert alert-soft alert-success flex items-center justify-between p-3 text-xs">
                                    <div className="flex items-center gap-2">
                                        <span className="icon-[lucide--check-circle-2] size-4 text-success"></span>
                                        <span className="font-medium">
                                            {t("cleanedSuccessTitle")}
                                        </span>
                                    </div>
                                    <span className="font-mono font-semibold text-success">
                                        {formatBytes(cleanedResult.cleanedSize)}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Colonne droite : Rapport d'inspection EXIF */}
                        <div className="md:col-span-7 flex flex-col gap-4">
                            <div className="card card-border bg-base-100 p-5 flex flex-col gap-4">
                                <div className="flex items-center justify-between border-b border-base-content/10 pb-3">
                                    <span className="text-xs font-semibold uppercase tracking-wider text-base-content flex items-center gap-2">
                                        <span className="icon-[lucide--shield-alert] size-4 text-primary"></span>
                                        {exif && exif.totalTagsCount > 0
                                            ? t("metadataFoundTitle", {
                                                  count: exif.totalTagsCount,
                                              })
                                            : t("noMetadataTitle")}
                                    </span>
                                    {exif && exif.totalTagsCount > 0 ? (
                                        <span className="badge badge-xs badge-error">
                                            Exposed
                                        </span>
                                    ) : (
                                        <span className="badge badge-xs badge-success">
                                            Clean
                                        </span>
                                    )}
                                </div>

                                {exif && exif.totalTagsCount > 0 ? (
                                    <div className="flex flex-col gap-3">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                            {(exif.make || exif.model) && (
                                                <div className="bg-base-200/40 p-3 rounded-lg border border-base-content/5">
                                                    <span className="text-base-content/50 block text-[11px] mb-0.5">
                                                        {t("device")}
                                                    </span>
                                                    <span className="font-medium text-base-content">
                                                        {[exif.make, exif.model]
                                                            .filter(Boolean)
                                                            .join(" ")}
                                                    </span>
                                                </div>
                                            )}

                                            {exif.dateTime && (
                                                <div className="bg-base-200/40 p-3 rounded-lg border border-base-content/5">
                                                    <span className="text-base-content/50 block text-[11px] mb-0.5">
                                                        {t("capturedAt")}
                                                    </span>
                                                    <span className="font-medium text-base-content">
                                                        {exif.dateTime}
                                                    </span>
                                                </div>
                                            )}

                                            {exif.lensModel && (
                                                <div className="bg-base-200/40 p-3 rounded-lg border border-base-content/5">
                                                    <span className="text-base-content/50 block text-[11px] mb-0.5">
                                                        {t("lens")}
                                                    </span>
                                                    <span className="font-medium text-base-content">
                                                        {exif.lensModel}
                                                    </span>
                                                </div>
                                            )}

                                            {exif.software && (
                                                <div className="bg-base-200/40 p-3 rounded-lg border border-base-content/5">
                                                    <span className="text-base-content/50 block text-[11px] mb-0.5">
                                                        {t("software")}
                                                    </span>
                                                    <span className="font-medium text-base-content">
                                                        {exif.software}
                                                    </span>
                                                </div>
                                            )}

                                            {(exif.iso ||
                                                exif.fNumber ||
                                                exif.exposureTime) && (
                                                <div className="bg-base-200/40 p-3 rounded-lg border border-base-content/5 sm:col-span-2">
                                                    <span className="text-base-content/50 block text-[11px] mb-0.5">
                                                        {t("exposure")}
                                                    </span>
                                                    <span className="font-mono text-xs text-base-content">
                                                        {[
                                                            exif.iso
                                                                ? `ISO ${exif.iso}`
                                                                : null,
                                                            exif.fNumber
                                                                ? `f/${exif.fNumber}`
                                                                : null,
                                                            exif.exposureTime
                                                                ? exif.exposureTime <
                                                                  1
                                                                    ? `1/${Math.round(1 / exif.exposureTime)}s`
                                                                    : `${exif.exposureTime}s`
                                                                : null,
                                                        ]
                                                            .filter(Boolean)
                                                            .join(" • ")}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Tiroir déroulant pour afficher TOUTES les balises brutes */}
                                        {exif.allRawTags.length > 0 && (
                                            <div className="border-t border-base-content/10 pt-2">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setShowRawTags(
                                                            !showRawTags,
                                                        )
                                                    }
                                                    className="btn btn-xs btn-ghost gap-1.5 text-base-content/60"
                                                >
                                                    <span
                                                        className={`icon-[lucide--chevron-right] size-3.5 transition-transform ${
                                                            showRawTags
                                                                ? "rotate-90"
                                                                : ""
                                                        }`}
                                                    ></span>
                                                    <span>
                                                        {t("rawTags", {
                                                            count: exif
                                                                .allRawTags
                                                                .length,
                                                        })}
                                                    </span>
                                                </button>

                                                {showRawTags && (
                                                    <div className="max-h-52 overflow-y-auto mt-2 p-2 bg-base-200/50 rounded-lg border border-base-content/5 font-mono text-[11px] flex flex-col gap-1">
                                                        {exif.allRawTags.map(
                                                            ([k, v]) => (
                                                                <div
                                                                    key={k}
                                                                    className="flex justify-between gap-4 border-b border-base-content/5 pb-1"
                                                                >
                                                                    <span className="text-primary truncate">
                                                                        {k}
                                                                    </span>
                                                                    <span className="text-base-content/80 text-right break-all">
                                                                        {v}
                                                                    </span>
                                                                </div>
                                                            ),
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="py-8 text-center flex flex-col items-center justify-center gap-2">
                                        <span className="icon-[lucide--check-circle-2] size-8 text-success"></span>
                                        <p className="text-xs text-base-content/70 max-w-xs">
                                            {t("noMetadataDesc")}
                                        </p>
                                    </div>
                                )}

                                {/* Boutons d'action */}
                                <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-base-content/10">
                                    <button
                                        type="button"
                                        disabled={isCleaning}
                                        onClick={handleCleanAndDownload}
                                        className="btn btn-sm btn-primary gap-2"
                                    >
                                        {isCleaning ? (
                                            <span className="loading loading-spinner size-4"></span>
                                        ) : (
                                            <span className="icon-[lucide--shield-check] size-4"></span>
                                        )}
                                        {t("stripAndDownload")}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={handleReset}
                                        className="btn btn-sm btn-ghost text-base-content/70"
                                    >
                                        {t("newImage")}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
