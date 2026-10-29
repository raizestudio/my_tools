// lib/image-processor.ts

export type TargetFormat =
  | "image/webp"
  | "image/avif"
  | "image/png"
  | "image/jpeg"
  | "image/x-icon"
  | "image/bmp"
  | "image/tiff"
  | "image/gif";

export interface TransformOptions {
  width?: number;
  height?: number;
  crop?: { x: number; y: number; width: number; height: number };
  rotate?: 0 | 90 | 180 | 270;
  flipHorizontal?: boolean;
  flipVertical?: boolean;
  format: TargetFormat;
  quality?: number; // 0.1 to 1.0
}

/**
 * 1. Windows ICO Encoder (Embeds PNG stream in compliant ICONDIR container)
 */
async function encodeIco(
  pngBlob: Blob,
  width: number,
  height: number,
): Promise<Blob> {
  const pngBytes = new Uint8Array(await pngBlob.arrayBuffer());
  const headerSize = 22; // 6-byte ICONDIR + 16-byte ICONDIRENTRY
  const totalSize = headerSize + pngBytes.byteLength;

  const buffer = new ArrayBuffer(totalSize);
  const view = new DataView(buffer);

  // ICONDIR
  view.setUint16(0, 0, true); // Reserved
  view.setUint16(2, 1, true); // Type: 1 = ICO
  view.setUint16(4, 1, true); // Image count: 1

  // ICONDIRENTRY (0 means 256px in ICO spec)
  view.setUint8(6, width >= 256 ? 0 : width);
  view.setUint8(7, height >= 256 ? 0 : height);
  view.setUint8(8, 0); // Palette count
  view.setUint8(9, 0); // Reserved
  view.setUint16(10, 1, true); // Planes
  view.setUint16(12, 32, true); // 32 bpp
  view.setUint32(14, pngBytes.byteLength, true); // Data size
  view.setUint32(18, headerSize, true); // Data offset

  new Uint8Array(buffer, headerSize).set(pngBytes);
  return new Blob([buffer], { type: "image/x-icon" });
}

/**
 * 2. Uncompressed 32-bit BMP Encoder (Bottom-Up BGRA scanlines)
 */
function encodeBmp(imageData: ImageData): ArrayBuffer {
  const { width, height, data: rgba } = imageData;
  const pixelArraySize = width * height * 4;
  const fileSize = 54 + pixelArraySize;

  const buffer = new ArrayBuffer(fileSize);
  const view = new DataView(buffer);

  // BITMAPFILEHEADER (14 bytes)
  view.setUint16(0, 0x4d42, false); // 'BM'
  view.setUint32(2, fileSize, true);
  view.setUint16(6, 0, true);
  view.setUint16(8, 0, true);
  view.setUint32(10, 54, true); // Offset to pixel array

  // BITMAPINFOHEADER (40 bytes)
  view.setUint32(14, 40, true); // Header size
  view.setInt32(18, width, true);
  view.setInt32(22, height, true); // Bottom-up
  view.setUint16(26, 1, true); // Planes
  view.setUint16(28, 32, true); // 32 bpp
  view.setUint32(30, 0, true); // BI_RGB (uncompressed)
  view.setUint32(34, pixelArraySize, true);
  view.setInt32(38, 2835, true); // 72 DPI (2835 px/m)
  view.setInt32(42, 2835, true);
  view.setUint32(46, 0, true);
  view.setUint32(50, 0, true);

  const bytes = new Uint8Array(buffer);
  let dst = 54;

  for (let y = height - 1; y >= 0; y--) {
    const rowStart = y * width * 4;
    for (let x = 0; x < width; x++) {
      const src = rowStart + x * 4;
      bytes[dst++] = rgba[src + 2]; // B
      bytes[dst++] = rgba[src + 1]; // G
      bytes[dst++] = rgba[src]; // R
      bytes[dst++] = rgba[src + 3]; // A
    }
  }

  return buffer;
}

/**
 * 3. Baseline TIFF 6.0 Encoder (Uncompressed 32-bit RGBA, Little-Endian)
 */
function encodeTiff(imageData: ImageData): ArrayBuffer {
  const { width, height, data: rgba } = imageData;
  const numEntries = 10;
  const ifdOffset = 8;
  const extraDataOffset = ifdOffset + 2 + numEntries * 12 + 4; // Offset: 134
  const bitsPerSampleOffset = extraDataOffset; // Offset: 134..141
  const pixelDataOffset = extraDataOffset + 8; // Offset: 142
  const pixelByteCount = width * height * 4;
  const totalSize = pixelDataOffset + pixelByteCount;

  const buffer = new ArrayBuffer(totalSize);
  const view = new DataView(buffer);

  // TIFF Header
  view.setUint16(0, 0x4949, false); // 'II' (Little Endian)
  view.setUint16(2, 42, true); // Magic 42
  view.setUint32(4, ifdOffset, true);

  // IFD Entry Count
  view.setUint16(ifdOffset, numEntries, true);

  // IFD Entries (Must be strictly sorted in ascending Tag order)
  const entries: [number, number, number, number][] = [
    [256, 4, 1, width], // ImageWidth (LONG)
    [257, 4, 1, height], // ImageLength (LONG)
    [258, 3, 4, bitsPerSampleOffset], // BitsPerSample (SHORT x 4)
    [259, 3, 1, 1], // Compression = 1 (Uncompressed)
    [262, 3, 1, 2], // PhotometricInterpretation = 2 (RGB)
    [273, 4, 1, pixelDataOffset], // StripOffsets
    [277, 3, 1, 4], // SamplesPerPixel = 4 (RGBA)
    [278, 4, 1, height], // RowsPerStrip
    [279, 4, 1, pixelByteCount], // StripByteCounts
    [284, 3, 1, 1], // PlanarConfiguration = 1 (Chunky)
  ];

  let pos = ifdOffset + 2;
  for (const [tag, type, count, valOrOffset] of entries) {
    view.setUint16(pos, tag, true);
    view.setUint16(pos + 2, type, true);
    view.setUint32(pos + 4, count, true);
    view.setUint32(pos + 8, valOrOffset, true);
    pos += 12;
  }

  view.setUint32(pos, 0, true); // End of IFD chain

  // BitsPerSample values [8, 8, 8, 8]
  view.setUint16(bitsPerSampleOffset, 8, true);
  view.setUint16(bitsPerSampleOffset + 2, 8, true);
  view.setUint16(bitsPerSampleOffset + 4, 8, true);
  view.setUint16(bitsPerSampleOffset + 6, 8, true);

  // Copy raw RGBA pixel data
  new Uint8Array(buffer, pixelDataOffset, pixelByteCount).set(rgba);

  return buffer;
}

/**
 * 4. GIF Encoder (Dynamic import of gifenc)
 */
async function encodeGif(imageData: ImageData): Promise<Blob> {
  const { GIFEncoder, quantize, applyPalette } = await import("gifenc");
  const { data, width, height } = imageData;
  const palette = quantize(data, 256);
  const index = applyPalette(data, palette);
  const gif = GIFEncoder();
  gif.writeFrame(index, width, height, { palette });
  gif.finish();
  return new Blob([gif.bytes()], { type: "image/gif" });
}

async function getCanvasBlob(
  canvas: OffscreenCanvas | HTMLCanvasElement,
  format: string,
  quality?: number,
): Promise<Blob> {
  if (canvas instanceof OffscreenCanvas) {
    return await canvas.convertToBlob({ type: format, quality });
  }
  return new Promise((resolve, reject) => {
    (canvas as HTMLCanvasElement).toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error(`Conversion to ${format} failed`));
      },
      format,
      quality,
    );
  });
}

export async function processImageClient(
  file: File | Blob,
  options: TransformOptions,
): Promise<Blob> {
  const bitmap = await createImageBitmap(file);

  const cropX = options.crop?.x ?? 0;
  const cropY = options.crop?.y ?? 0;
  const cropWidth = options.crop?.width ?? bitmap.width;
  const cropHeight = options.crop?.height ?? bitmap.height;

  const targetWidth = options.width ?? cropWidth;
  const targetHeight = options.height ?? cropHeight;

  const isRotatedSideways = options.rotate === 90 || options.rotate === 270;
  const canvasWidth = isRotatedSideways ? targetHeight : targetWidth;
  const canvasHeight = isRotatedSideways ? targetWidth : targetHeight;

  const canvas =
    typeof OffscreenCanvas !== "undefined"
      ? new OffscreenCanvas(canvasWidth, canvasHeight)
      : Object.assign(document.createElement("canvas"), {
          width: canvasWidth,
          height: canvasHeight,
        });

  const ctx = canvas.getContext("2d") as
    OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;

  if (!ctx) throw new Error("Could not initialize canvas context");

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  ctx.save();
  ctx.translate(canvasWidth / 2, canvasHeight / 2);

  if (options.rotate) {
    ctx.rotate((options.rotate * Math.PI) / 180);
  }

  const scaleX = options.flipHorizontal ? -1 : 1;
  const scaleY = options.flipVertical ? -1 : 1;
  ctx.scale(scaleX, scaleY);

  ctx.drawImage(
    bitmap,
    cropX,
    cropY,
    cropWidth,
    cropHeight,
    -targetWidth / 2,
    -targetHeight / 2,
    targetWidth,
    targetHeight,
  );

  ctx.restore();
  bitmap.close();

  // Export pipeline by format
  switch (options.format) {
    case "image/x-icon": {
      const pngBlob = await getCanvasBlob(canvas, "image/png");
      return await encodeIco(pngBlob, canvasWidth, canvasHeight);
    }
    case "image/bmp": {
      const imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
      const bmpBuffer = encodeBmp(imageData);
      return new Blob([bmpBuffer], { type: "image/bmp" });
    }
    case "image/tiff": {
      const imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
      const tiffBuffer = encodeTiff(imageData);
      return new Blob([tiffBuffer], { type: "image/tiff" });
    }
    case "image/gif": {
      const imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
      return await encodeGif(imageData);
    }
    default: {
      return await getCanvasBlob(
        canvas,
        options.format,
        options.quality ?? 0.85,
      );
    }
  }
}
