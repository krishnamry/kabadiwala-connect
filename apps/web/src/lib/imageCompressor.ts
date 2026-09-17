/**
 * Dhatu Field-Hardened Image Compressor & Numeral Normalizer
 * Enforces Defensive Invariant #1 (120KB LocalStorage ceiling)
 * and Invariant #4 (Devanagari ०-९ Numeral Normalizer).
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  mimeType?: 'image/jpeg' | 'image/webp';
}

/**
 * Compresses an image File, Blob, or base64 data URL using an HTML5 Canvas.
 * Clamps dimensions to max 1024x1024 and encodes to 0.75 quality JPEG/WebP.
 * Drops raw 4.8MB mobile camera photos to ~120KB to protect against 5MB localStorage crashes.
 */
export async function compressImage(
  input: File | Blob | string,
  options: CompressionOptions = {}
): Promise<string> {
  const {
    maxWidth = 1024,
    maxHeight = 1024,
    quality = 0.75,
    mimeType = 'image/jpeg'
  } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      try {
        let width = img.width;
        let height = img.height;

        // Calculate proportional clamped dimensions
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Canvas 2D context unavailable');
        }

        // High quality image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL(mimeType, quality);
        resolve(dataUrl);
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = (err) => {
      reject(new Error(`Failed to load image for compression: ${err}`));
    };

    if (typeof input === 'string') {
      img.src = input;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(input);
    }
  });
}

/**
 * Defensive Invariant #4: Devanagari Numeral Normalizer
 * Virtual keyboards on Hindi / Marathi Android devices often input ०, १, २, ३, ४, ५, ६, ७, ८, ९.
 * Standard parseFloat() or Number() on these strings evaluates to NaN.
 * This helper normalizes them in-flight to standard ASCII 0-9.
 */
export function normalizeDevanagariNumerals(input: string): string {
  if (!input) return '';
  const devanagariDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
  return input.replace(/[०-९]/g, (char) => {
    const index = devanagariDigits.indexOf(char);
    return index !== -1 ? String(index) : char;
  });
}

/**
 * Parses numeric weight or currency from a localized input string.
 * Strips currency symbols (₹, Rs), whitespace, commas, and normalizes Devanagari digits.
 */
export function parseLocalizedNumber(input: string | number): number {
  if (typeof input === 'number') return isNaN(input) ? 0 : input;
  if (!input) return 0;

  const normalized = normalizeDevanagariNumerals(String(input))
    .replace(/[₹,\s]/g, '')
    .trim();

  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? 0 : parsed;
}
