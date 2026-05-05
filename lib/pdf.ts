import jsPDF from "jspdf";
import { renderWatermarkedDataUrl } from "@/lib/watermark";
import {
  generatePdfPassword,
  type ExportOptions,
  type LoadedDocumentImage,
  type WatermarkOptions,
} from "@/lib/utils";

const PDF_MARGIN = 12;

export async function exportWatermarkedPdf(
  images: LoadedDocumentImage[],
  watermarkText: string,
  options: WatermarkOptions,
  exportOptions: ExportOptions,
) {
  if (exportOptions.mode === "split") {
    images.forEach((image, index) => {
      const pdf = createPdf(exportOptions);
      const rendered = renderWatermarkedDataUrl(
        image.element,
        watermarkText,
        options,
        image.mimeType,
        exportOptions.quality,
      );

      addImagePage(pdf, rendered.dataUrl, rendered.width, rendered.height, rendered.mimeType);
      pdf.save(index === 0 ? "docuguard-front.pdf" : "docuguard-back.pdf");
    });
    return;
  }

  const pdf = createPdf(exportOptions);
  const renderedImages = images.map((image) => ({
    ...renderWatermarkedDataUrl(
      image.element,
      watermarkText,
      options,
      image.mimeType,
      exportOptions.quality,
    ),
  }));

  if (renderedImages.length <= 1) {
    const [single] = renderedImages;

    if (single) {
      addImagePage(pdf, single.dataUrl, single.width, single.height, single.mimeType);
    }
  } else {
    addStackedImagesPage(pdf, renderedImages);
  }

  pdf.save("docuguard-watermarked.pdf");
}

function createPdf(exportOptions: ExportOptions) {
  return new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
    encryption: exportOptions.lockPdf
      ? {
          userPassword: exportOptions.password,
          ownerPassword: generatePdfPassword(18),
          userPermissions: ["print"],
        }
      : undefined,
  });
}

function addImagePage(
  pdf: jsPDF,
  renderedImage: string,
  imageWidth: number,
  imageHeight: number,
  mimeType: "image/jpeg" | "image/png",
) {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const maxWidth = pageWidth - PDF_MARGIN * 2;
  const maxHeight = pageHeight - PDF_MARGIN * 2;
  const aspectRatio = imageWidth / imageHeight;

  let renderWidth = maxWidth;
  let renderHeight = renderWidth / aspectRatio;

  if (renderHeight > maxHeight) {
    renderHeight = maxHeight;
    renderWidth = renderHeight * aspectRatio;
  }

  const offsetX = (pageWidth - renderWidth) / 2;
  const offsetY = (pageHeight - renderHeight) / 2;

  pdf.addImage(
    renderedImage,
    mimeType === "image/png" ? "PNG" : "JPEG",
    offsetX,
    offsetY,
    renderWidth,
    renderHeight,
    undefined,
    "MEDIUM",
  );
}

function addStackedImagesPage(
  pdf: jsPDF,
  images: Array<{
    dataUrl: string;
    width: number;
    height: number;
    mimeType: "image/jpeg" | "image/png";
  }>,
) {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const gap = 8;
  const slotWidth = pageWidth - PDF_MARGIN * 2;
  const slotHeight = (pageHeight - PDF_MARGIN * 2 - gap) / 2;

  images.slice(0, 2).forEach((image, index) => {
    const fitted = fitImage(image.width, image.height, slotWidth, slotHeight);
    const offsetX = (pageWidth - fitted.width) / 2;
    const slotTop = PDF_MARGIN + index * (slotHeight + gap);
    const offsetY = slotTop + (slotHeight - fitted.height) / 2;

    pdf.addImage(
      image.dataUrl,
      image.mimeType === "image/png" ? "PNG" : "JPEG",
      offsetX,
      offsetY,
      fitted.width,
      fitted.height,
      undefined,
      "MEDIUM",
    );
  });
}

function fitImage(imageWidth: number, imageHeight: number, maxWidth: number, maxHeight: number) {
  const aspectRatio = imageWidth / imageHeight;
  let width = maxWidth;
  let height = width / aspectRatio;

  if (height > maxHeight) {
    height = maxHeight;
    width = height * aspectRatio;
  }

  return { width, height };
}
