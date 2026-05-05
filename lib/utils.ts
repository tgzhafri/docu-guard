export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
export const MIN_IMAGE_WIDTH = 900;
export const MIN_IMAGE_HEIGHT = 600;
const MAX_RENDER_EDGE = 2200;

export type WatermarkOptions = {
  opacity: number;
  fontSize: number;
  angle: number;
  repeat: boolean;
  position: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center";
  offsetX: number;
  offsetY: number;
};

export type PdfQuality = "small" | "balanced" | "high";

export type ExportOptions = {
  mode: "single" | "split";
  quality: PdfQuality;
  lockPdf: boolean;
  password: string;
};

export type LoadedDocumentImage = {
  name: string;
  mimeType: "image/jpeg" | "image/png";
  width: number;
  height: number;
  objectUrl: string;
  element: HTMLImageElement;
};

export async function loadAndPrepareImage(file: File): Promise<LoadedDocumentImage> {
  validateFile(file);

  const objectUrl = URL.createObjectURL(file);

  try {
    const loadedImage = await loadImage(objectUrl);

    if (loadedImage.naturalWidth < MIN_IMAGE_WIDTH || loadedImage.naturalHeight < MIN_IMAGE_HEIGHT) {
      throw new Error(
        `Image resolution is too small. Minimum required is ${MIN_IMAGE_WIDTH} x ${MIN_IMAGE_HEIGHT}px.`,
      );
    }

    const normalized = await normalizeImage(file.type as "image/jpeg" | "image/png", loadedImage);

    return {
      name: file.name,
      mimeType: file.type as "image/jpeg" | "image/png",
      width: normalized.naturalWidth,
      height: normalized.naturalHeight,
      objectUrl,
      element: normalized,
    };
  } catch (error) {
    URL.revokeObjectURL(objectUrl);
    throw error;
  }
}

function validateFile(file: File) {
  if (!["image/jpeg", "image/png"].includes(file.type)) {
    throw new Error("Only JPG and PNG files are supported.");
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error("File is too large. Maximum size is 5MB.");
  }
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Failed to load image."));
    image.decoding = "async";
    image.src = src;
  });
}

export function generatePdfPassword(length = 10) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const randomValues = new Uint32Array(length);
  crypto.getRandomValues(randomValues);

  return Array.from(randomValues, (value) => alphabet[value % alphabet.length]).join("");
}

async function normalizeImage(
  mimeType: "image/jpeg" | "image/png",
  image: HTMLImageElement,
): Promise<HTMLImageElement> {
  const largestEdge = Math.max(image.naturalWidth, image.naturalHeight);

  if (largestEdge <= MAX_RENDER_EDGE) {
    return image;
  }

  const scale = MAX_RENDER_EDGE / largestEdge;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(image.naturalWidth * scale);
  canvas.height = Math.round(image.naturalHeight * scale);

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Your browser does not support canvas rendering.");
  }

  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  const dataUrl = canvas.toDataURL(mimeType, mimeType === "image/jpeg" ? 0.9 : undefined);
  return loadImage(dataUrl);
}
