// app/lib/ico.ts

export interface PngIconInput {
  width: number;
  height: number;
  bytes: Uint8Array;
}

/**
 * Packs multiple PNG buffers into a valid multi-resolution Windows ICO binary.
 */
export function createIcoFromPngs(pngList: PngIconInput[]): Uint8Array {
  const numImages = pngList.length;
  const headerSize = 6;
  const dirEntrySize = 16;
  const totalDirSize = numImages * dirEntrySize;

  let totalDataSize = 0;
  for (const img of pngList) {
    totalDataSize += img.bytes.length;
  }

  const out = new Uint8Array(headerSize + totalDirSize + totalDataSize);
  const view = new DataView(out.buffer);

  // 1. ICO Header (6 bytes)
  view.setUint16(0, 0, true); // Reserved (must be 0)
  view.setUint16(2, 1, true); // Image type (1 = Icon .ico)
  view.setUint16(4, numImages, true); // Number of images

  let currentOffset = headerSize + totalDirSize;
  let dirOffset = headerSize;

  // 2. Directory Entries (16 bytes per image)
  for (let i = 0; i < numImages; i++) {
    const img = pngList[i];
    const w = img.width >= 256 ? 0 : img.width;
    const h = img.height >= 256 ? 0 : img.height;

    view.setUint8(dirOffset + 0, w); // Width
    view.setUint8(dirOffset + 1, h); // Height
    view.setUint8(dirOffset + 2, 0); // Palette count
    view.setUint8(dirOffset + 3, 0); // Reserved
    view.setUint16(dirOffset + 4, 1, true); // Color planes
    view.setUint16(dirOffset + 6, 32, true); // Bits per pixel
    view.setUint32(dirOffset + 8, img.bytes.length, true); // Image data size
    view.setUint32(dirOffset + 12, currentOffset, true); // Image data offset

    // 3. Write image payload
    out.set(img.bytes, currentOffset);

    dirOffset += dirEntrySize;
    currentOffset += img.bytes.length;
  }

  return out;
}
