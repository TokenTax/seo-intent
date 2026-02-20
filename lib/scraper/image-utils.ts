import sharp from 'sharp';

/**
 * Compress an image buffer and encode as base64 JPEG
 *
 * @param buffer - Raw image buffer (PNG from ScrapingBee)
 * @param maxWidth - Maximum width to resize to (default 800px)
 * @param quality - JPEG quality 1-100 (default 80)
 * @returns Base64 encoded JPEG string
 */
export async function compressAndEncode(
  buffer: Buffer,
  maxWidth: number = 800,
  quality: number = 80
): Promise<string> {
  try {
    const compressed = await sharp(buffer)
      .resize(maxWidth, null, {
        withoutEnlargement: true,
        fit: 'inside',
      })
      .jpeg({
        quality,
        progressive: true,
      })
      .toBuffer();

    console.log(`[ImageUtils] Compressed ${buffer.length} bytes -> ${compressed.length} bytes`);
    return compressed.toString('base64');
  } catch (error) {
    console.error('[ImageUtils] Compression failed:', error);
    throw error;
  }
}

/**
 * Get image dimensions from a buffer
 */
export async function getImageDimensions(
  buffer: Buffer
): Promise<{ width: number; height: number }> {
  const metadata = await sharp(buffer).metadata();
  return {
    width: metadata.width || 0,
    height: metadata.height || 0,
  };
}
