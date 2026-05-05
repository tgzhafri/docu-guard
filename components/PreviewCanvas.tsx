"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { getPreviewRenderMetrics, renderWatermarkedImage } from "@/lib/watermark";
import type { LoadedDocumentImage, WatermarkOptions } from "@/lib/utils";

type PreviewCanvasProps = {
  title: string;
  image: LoadedDocumentImage | null;
  watermarkText: string;
  options: WatermarkOptions;
  onOffsetChange: (offsetX: number, offsetY: number) => void;
};

export function PreviewCanvas({
  title,
  image,
  watermarkText,
  options,
  onOffsetChange,
}: PreviewCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const dragStateRef = useRef<{
    startX: number;
    startY: number;
    startOffsetX: number;
    startOffsetY: number;
    scale: number;
  } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    if (!image) {
      canvas.width = 900;
      canvas.height = 560;
      context.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    setIsRendering(true);
    renderWatermarkedImage(canvas, image.element, watermarkText, options);
    setIsRendering(false);
  }, [image, options, watermarkText]);

  const canDrag = Boolean(image && !options.repeat);

  const handlePointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!image || options.repeat) {
      return;
    }

    const metrics = getPreviewRenderMetrics(image.element, watermarkText, options);
    dragStateRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      startOffsetX: options.offsetX,
      startOffsetY: options.offsetY,
      scale: metrics.scale,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const dragState = dragStateRef.current;

    if (!dragState) {
      return;
    }

    const deltaX = (event.clientX - dragState.startX) / dragState.scale;
    const deltaY = (event.clientY - dragState.startY) / dragState.scale;
    onOffsetChange(
      Math.round(dragState.startOffsetX + deltaX),
      Math.round(dragState.startOffsetY + deltaY),
    );
  };

  const handlePointerEnd = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (dragStateRef.current) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    dragStateRef.current = null;
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-soft">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">
            {canDrag
              ? "Drag the watermark directly in preview or fine-tune with X/Y controls."
              : "Real-time canvas preview rendered entirely on-device."}
          </p>
        </div>
        <span
          className={[
            "rounded-full px-3 py-1 text-xs font-medium",
            isRendering ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-600",
          ].join(" ")}
        >
          {isRendering ? "Updating..." : image ? "Ready" : "Waiting"}
        </span>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
        {image ? null : (
          <div className="flex aspect-[16/10] items-center justify-center px-6 text-center text-sm text-slate-500">
            Upload a document image to see the watermark preview here.
          </div>
        )}
        <canvas
          ref={canvasRef}
          className={image ? ["h-auto w-full", canDrag ? "cursor-move touch-none" : ""].join(" ") : "hidden"}
          aria-label={title}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
        />
      </div>
    </section>
  );
}
