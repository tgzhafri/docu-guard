import type { PdfQuality, WatermarkOptions } from "@/lib/utils";

const PREVIEW_MAX_WIDTH = 1400;
const PREVIEW_OFFSET_LIMIT = 240;
const PREVIEW_MAX_FONT_SIZE = 96;
const PREVIEW_ANGLE_SAMPLES = [-90, -75, -60, -45, -30, -15, 0, 15, 30, 45, 60, 75, 90] as const;
const WATERMARK_POSITIONS = [
  "top-left",
  "top-right",
  "bottom-left",
  "bottom-right",
  "center",
] as const;
type RenderLayout = {
  canvasWidth: number;
  canvasHeight: number;
  imageX: number;
  imageY: number;
  imageWidth: number;
  imageHeight: number;
};

type RenderSource = {
  width: number;
  height: number;
  drawable: CanvasImageSource;
};

export function drawWatermark(
  ctx: CanvasRenderingContext2D,
  text: string,
  options: WatermarkOptions,
  bounds?: { x: number; y: number; width: number; height: number },
) {
  const { width, height } = ctx.canvas;
  const area = bounds ?? { x: 0, y: 0, width, height };
  const safeText = text.trim();
  const placement = getWatermarkPlacement(area, options.position, options.offsetX, options.offsetY);

  if (!safeText) {
    return;
  }

  ctx.save();
  ctx.translate(placement.x, placement.y);
  ctx.rotate((options.angle * Math.PI) / 180);
  ctx.globalAlpha = options.opacity;
  ctx.fillStyle = "#dc2626";
  ctx.textAlign = placement.textAlign;
  ctx.textBaseline = placement.textBaseline;
  ctx.font = `700 ${options.fontSize}px Arial, sans-serif`;

  if (options.repeat) {
    const diagonal = Math.sqrt(width * width + height * height);
    const metrics = ctx.measureText(safeText);
    const textWidth = metrics.width;
    const textHeight =
      (metrics.actualBoundingBoxAscent || options.fontSize * 0.8) +
      (metrics.actualBoundingBoxDescent || options.fontSize * 0.2);
    const xStep = Math.max(textWidth + options.fontSize * 1.8, options.fontSize * 6);
    const yStep = Math.max(textHeight + options.fontSize * 1.6, options.fontSize * 3.2);

    for (let y = -diagonal * 0.25; y <= diagonal; y += yStep) {
      for (let x = -diagonal * 0.25; x <= diagonal; x += xStep) {
        ctx.fillText(safeText, x, y);
      }
    }
  } else {
    ctx.fillText(safeText, 0, 0);
  }

  ctx.restore();
}

export function renderWatermarkedImage(
  canvas: HTMLCanvasElement,
  image: HTMLImageElement,
  text: string,
  options: WatermarkOptions,
) {
  const layout = getRenderLayout(image, text, options, "preview");
  const scale = Math.min(1, PREVIEW_MAX_WIDTH / layout.canvasWidth);
  canvas.width = Math.max(1, Math.round(layout.canvasWidth * scale));
  canvas.height = Math.max(1, Math.round(layout.canvasHeight * scale));

  const context = canvas.getContext("2d");

  if (!context) {
    return;
  }

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(
    image,
    Math.round(layout.imageX * scale),
    Math.round(layout.imageY * scale),
    Math.round(layout.imageWidth * scale),
    Math.round(layout.imageHeight * scale),
  );

  drawWatermark(
    context,
    text,
    {
      ...options,
      fontSize: Math.max(18, Math.round(options.fontSize * scale)),
      offsetX: Math.round(options.offsetX * scale),
      offsetY: Math.round(options.offsetY * scale),
    },
    {
      x: Math.round(layout.imageX * scale),
      y: Math.round(layout.imageY * scale),
      width: Math.round(layout.imageWidth * scale),
      height: Math.round(layout.imageHeight * scale),
    },
  );
}

export function getPreviewRenderMetrics(
  image: HTMLImageElement,
  text: string,
  options: WatermarkOptions,
) {
  const layout = getRenderLayout(image, text, options, "preview");
  const scale = Math.min(1, PREVIEW_MAX_WIDTH / layout.canvasWidth);

  return { layout, scale };
}

export function renderWatermarkedDataUrl(
  image: HTMLImageElement,
  text: string,
  options: WatermarkOptions,
  _mimeType: "image/jpeg" | "image/png",
  quality: PdfQuality,
) {
  const pdfSettings = getPdfQualitySettings(quality);
  const normalizedForPdf = getPdfExportImage(image, pdfSettings.maxEdge, pdfSettings.jpegQuality);
  const exportMimeType: "image/jpeg" = "image/jpeg";
  const canvas = document.createElement("canvas");
  const layout = getRenderLayout(normalizedForPdf, text, options, "export");
  canvas.width = layout.canvasWidth;
  canvas.height = layout.canvasHeight;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Your browser does not support canvas export.");
  }

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(
    normalizedForPdf.drawable,
    layout.imageX,
    layout.imageY,
    layout.imageWidth,
    layout.imageHeight,
  );
  drawWatermark(context, text, options, {
    x: layout.imageX,
    y: layout.imageY,
    width: layout.imageWidth,
    height: layout.imageHeight,
  });

  return {
    dataUrl: canvas.toDataURL(exportMimeType, pdfSettings.jpegQuality),
    width: canvas.width,
    height: canvas.height,
    mimeType: exportMimeType,
  };
}

function getRenderLayout(
  image: { naturalWidth: number; naturalHeight: number },
  text: string,
  options: WatermarkOptions,
  mode: "preview" | "export",
): RenderLayout {
  if (!text.trim() || (mode === "export" && options.repeat)) {
    return {
      canvasWidth: image.naturalWidth,
      canvasHeight: image.naturalHeight,
      imageX: 0,
      imageY: 0,
      imageWidth: image.naturalWidth,
      imageHeight: image.naturalHeight,
    };
  }

  const measuredBounds = getLayoutBounds(textMeasureCanvas(), text, image, options, mode);
  const imageBounds = {
    left: 0,
    top: 0,
    right: image.naturalWidth,
    bottom: image.naturalHeight,
  };
  const extraLeft = Math.max(
    0,
    ...measuredBounds.map((bounds) => Math.ceil(imageBounds.left - bounds.left)),
  );
  const extraTop = Math.max(
    0,
    ...measuredBounds.map((bounds) => Math.ceil(imageBounds.top - bounds.top)),
  );
  const extraRight = Math.max(
    0,
    ...measuredBounds.map((bounds) => Math.ceil(bounds.right - imageBounds.right)),
  );
  const extraBottom = Math.max(
    0,
    ...measuredBounds.map((bounds) => Math.ceil(bounds.bottom - imageBounds.bottom)),
  );
  const safety = Math.max(12, Math.round(options.fontSize * 0.35));
  const paddingLeft = extraLeft + safety;
  const paddingTop = extraTop + safety;
  const paddingRight = extraRight + safety;
  const paddingBottom = extraBottom + safety;

  return {
    canvasWidth: image.naturalWidth + paddingLeft + paddingRight,
    canvasHeight: image.naturalHeight + paddingTop + paddingBottom,
    imageX: paddingLeft,
    imageY: paddingTop,
    imageWidth: image.naturalWidth,
    imageHeight: image.naturalHeight,
  };
}

function getLayoutBounds(
  ctx: CanvasRenderingContext2D,
  text: string,
  image: { naturalWidth: number; naturalHeight: number },
  options: WatermarkOptions,
  mode: "preview" | "export",
) {
  if (mode === "export") {
    return [measureSingleWatermarkBounds(ctx, text, image, options)];
  }

  const previewOffsets = [-PREVIEW_OFFSET_LIMIT, PREVIEW_OFFSET_LIMIT];

  return WATERMARK_POSITIONS.flatMap((position) =>
    PREVIEW_ANGLE_SAMPLES.flatMap((angle) =>
      previewOffsets.flatMap((offsetX) =>
        previewOffsets.map((offsetY) =>
          measureSingleWatermarkBounds(ctx, text, image, {
            ...options,
            position,
            angle,
            fontSize: PREVIEW_MAX_FONT_SIZE,
            offsetX,
            offsetY,
          }),
        ),
      ),
    ),
  );
}

function getWatermarkPlacement(
  area: { x: number; y: number; width: number; height: number },
  position: WatermarkOptions["position"],
  offsetX = 0,
  offsetY = 0,
) {
  const inset = Math.max(18, Math.min(area.width, area.height) * 0.035);

  switch (position) {
    case "top-left":
      return {
        x: area.x + inset + offsetX,
        y: area.y + inset + offsetY,
        textAlign: "center" as const,
        textBaseline: "middle" as const,
      };
    case "top-right":
      return {
        x: area.x + area.width - inset + offsetX,
        y: area.y + inset + offsetY,
        textAlign: "center" as const,
        textBaseline: "middle" as const,
      };
    case "bottom-left":
      return {
        x: area.x + inset + offsetX,
        y: area.y + area.height - inset + offsetY,
        textAlign: "center" as const,
        textBaseline: "middle" as const,
      };
    case "bottom-right":
      return {
        x: area.x + area.width - inset + offsetX,
        y: area.y + area.height - inset + offsetY,
        textAlign: "center" as const,
        textBaseline: "middle" as const,
      };
    case "center":
      return {
        x: area.x + area.width / 2 + offsetX,
        y: area.y + area.height / 2 + offsetY,
        textAlign: "center" as const,
        textBaseline: "middle" as const,
      };
  }
}

function textMeasureCanvas() {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Your browser does not support canvas measurement.");
  }

  return context;
}

function measureSingleWatermarkBounds(
  ctx: CanvasRenderingContext2D,
  text: string,
  image: { naturalWidth: number; naturalHeight: number },
  options: WatermarkOptions,
) {
  const area = { x: 0, y: 0, width: image.naturalWidth, height: image.naturalHeight };
  const placement = getWatermarkPlacement(area, options.position, options.offsetX, options.offsetY);
  ctx.font = `700 ${options.fontSize}px Arial, sans-serif`;
  const metrics = ctx.measureText(text);
  return rotateTextBounds(
    getLocalTextBounds(metrics, placement.textAlign, placement.textBaseline, options.fontSize),
    placement.x,
    placement.y,
    options.angle,
  );
}

function getLocalTextBounds(
  metrics: TextMetrics,
  textAlign: CanvasTextAlign,
  textBaseline: CanvasTextBaseline,
  fontSize: number,
) {
  const left =
    textAlign === "center"
      ? -metrics.width / 2
      : textAlign === "right" || textAlign === "end"
        ? -metrics.width
        : 0;
  const right = left + metrics.width;
  const ascent = metrics.actualBoundingBoxAscent || fontSize * 0.8;
  const descent = metrics.actualBoundingBoxDescent || fontSize * 0.2;

  let top: number;
  let bottom: number;

  if (textBaseline === "top" || textBaseline === "hanging") {
    top = 0;
    bottom = ascent + descent;
  } else if (textBaseline === "bottom" || textBaseline === "ideographic") {
    top = -(ascent + descent);
    bottom = 0;
  } else if (textBaseline === "middle") {
    top = -(ascent + descent) / 2;
    bottom = (ascent + descent) / 2;
  } else {
    top = -ascent;
    bottom = descent;
  }

  return { left, top, right, bottom };
}

function rotateTextBounds(
  bounds: { left: number; top: number; right: number; bottom: number },
  anchorX: number,
  anchorY: number,
  angle: number,
) {
  const radians = (angle * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const corners = [
    { x: bounds.left, y: bounds.top },
    { x: bounds.right, y: bounds.top },
    { x: bounds.right, y: bounds.bottom },
    { x: bounds.left, y: bounds.bottom },
  ].map((point) => ({
    x: anchorX + point.x * cos - point.y * sin,
    y: anchorY + point.x * sin + point.y * cos,
  }));

  return {
    left: Math.min(...corners.map((point) => point.x)),
    top: Math.min(...corners.map((point) => point.y)),
    right: Math.max(...corners.map((point) => point.x)),
    bottom: Math.max(...corners.map((point) => point.y)),
  };
}

function getPdfExportImage(
  image: HTMLImageElement,
  maxEdge: number,
  jpegQuality: number,
): RenderSource & {
  naturalWidth: number;
  naturalHeight: number;
} {
  const largestEdge = Math.max(image.naturalWidth, image.naturalHeight);

  if (largestEdge <= maxEdge) {
    return {
      drawable: image,
      width: image.naturalWidth,
      height: image.naturalHeight,
      naturalWidth: image.naturalWidth,
      naturalHeight: image.naturalHeight,
    };
  }

  const scale = maxEdge / largestEdge;
  const canvas = document.createElement("canvas");
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");

  if (!context) {
    return {
      drawable: image,
      width: image.naturalWidth,
      height: image.naturalHeight,
      naturalWidth: image.naturalWidth,
      naturalHeight: image.naturalHeight,
    };
  }

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  return {
    drawable: canvas,
    width,
    height,
    naturalWidth: width,
    naturalHeight: height,
  };
}

function getPdfQualitySettings(quality: PdfQuality) {
  switch (quality) {
    case "small":
      return { maxEdge: 1280, jpegQuality: 0.6 };
    case "high":
      return { maxEdge: 1800, jpegQuality: 0.82 };
    case "balanced":
    default:
      return { maxEdge: 1600, jpegQuality: 0.72 };
  }
}
