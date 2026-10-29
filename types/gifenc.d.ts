// types/gifenc.d.ts
declare module 'gifenc' {
  export function quantize(
    rgba: Uint8ClampedArray | Uint8Array,
    maxColors: number,
    options?: { format?: string; oneBitAlpha?: boolean; clearAlpha?: boolean; clearAlphaColor?: number; clearAlphaThreshold?: number }
  ): Uint8Array<ArrayBuffer>;

  export function applyPalette(
    rgba: Uint8ClampedArray | Uint8Array,
    palette: Uint8Array,
    format?: string
  ): Uint8Array<ArrayBuffer>;

  export function GIFEncoder(opts?: { auto?: boolean }): {
    writeFrame(
      index: Uint8Array,
      width: number,
      height: number,
      opts?: {
        palette?: Uint8Array;
        first?: boolean;
        transparent?: boolean;
        transparentIndex?: number;
        delay?: number;
        repeat?: number;
        dispose?: number;
      }
    ): void;
    finish(): void;
    bytes(): Uint8Array<ArrayBuffer>;
    bytesView(): Uint8Array<ArrayBuffer>;
    writeHeader(): void;
    writeGraphicsControlExt(opts: any): void;
    writeImageDesc(w: number, h: number, opts: any): void;
    writePixels(index: Uint8Array, width: number, height: number, opts: any): void;
  };
}
