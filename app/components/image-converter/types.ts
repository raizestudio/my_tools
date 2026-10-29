// app/components/image-converter/types.ts
import type { Crop, PixelCrop } from "react-image-crop";
import type { TargetFormat } from "@/app/lib/image-processor";

export type AspectPreset = "free" | "1:1" | "16:9" | "4:3" | "9:16";

export interface ImageItem {
  id: string;
  file: File;
  previewUrl: string;
  name: string;
  size: number;
  width: number;
  height: number;
}

export interface EditState {
  rotate: 0 | 90 | 180 | 270;
  flipH: boolean;
  flipV: boolean;
  crop?: Crop;
  completedCrop?: PixelCrop;
  aspectPreset: AspectPreset;
  targetWidth: number;
  targetHeight: number;
  lockAspect: boolean;
}

export interface FormatOption {
  id: TargetFormat;
  label: string;
  ext: string;
  hasQuality: boolean;
}

export interface AspectOption {
  id: AspectPreset;
  label: string;
  value?: number;
}
