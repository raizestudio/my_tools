export type ActiveTab = "merge" | "organize";

export interface MergeFileItem {
  id: string;
  file: File;
  pageCount: number;
  buffer: ArrayBuffer;
  previewUrl: string;
}

export interface PageItem {
  originalIndex: number;
  rotation: number;
  isDeleted: boolean;
  isLandscape: boolean;
  width: number;
  height: number;
  previewUrl: string;
}
