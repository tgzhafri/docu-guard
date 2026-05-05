"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ControlsPanel } from "@/components/ControlsPanel";
import { PreviewCanvas } from "@/components/PreviewCanvas";
import { UploadZone } from "@/components/UploadZone";
import { exportWatermarkedPdf } from "@/lib/pdf";
import {
  generatePdfPassword,
  MIN_IMAGE_HEIGHT,
  MIN_IMAGE_WIDTH,
  type ExportOptions,
  type LoadedDocumentImage,
  type WatermarkOptions,
  loadAndPrepareImage,
} from "@/lib/utils";

const INITIAL_OPTIONS: WatermarkOptions = {
  opacity: 0.5,
  fontSize: 40,
  angle: -32,
  repeat: false,
  position: "top-left",
  offsetX: 0,
  offsetY: 0,
};

function createInitialExportOptions(): ExportOptions {
  return {
    mode: "single",
    quality: "balanced",
    lockPdf: false,
    password: generatePdfPassword(),
  };
}

const PRESETS = [
  "FOR BANK USE ONLY",
  "FOR HR USE ONLY",
  "FOR TELCO USE ONLY",
] as const;
const MAX_OFFSET = 240;

const DOCUMENT_SLOTS = [
  { key: "front", label: "Front image" },
  { key: "back", label: "Back image" },
] as const;

export function DocuGuardApp() {
  const [frontImage, setFrontImage] = useState<LoadedDocumentImage | null>(null);
  const [backImage, setBackImage] = useState<LoadedDocumentImage | null>(null);
  const [watermarkText, setWatermarkText] = useState<string>(PRESETS[0]);
  const [options, setOptions] = useState<WatermarkOptions>(INITIAL_OPTIONS);
  const [errors, setErrors] = useState<Record<"front" | "back", string | null>>({
    front: null,
    back: null,
  });
  const [isProcessing, setIsProcessing] = useState<Record<"front" | "back", boolean>>({
    front: false,
    back: false,
  });
  const [isExporting, setIsExporting] = useState(false);
  const [exportOptions, setExportOptions] = useState<ExportOptions>(createInitialExportOptions);

  const handleResetDefaults = useCallback(() => {
    setWatermarkText(PRESETS[0]);
    setOptions(INITIAL_OPTIONS);
    setExportOptions(createInitialExportOptions());
  }, []);

  const handleOffsetChange = useCallback((offsetX: number, offsetY: number) => {
    setOptions((current) => ({
      ...current,
      offsetX: clampOffset(offsetX),
      offsetY: clampOffset(offsetY),
    }));
  }, []);

  const handleRegeneratePassword = useCallback(() => {
    setExportOptions((current) => ({
      ...current,
      password: generatePdfPassword(),
    }));
  }, []);

  useEffect(() => {
    return () => {
      frontImage?.objectUrl && URL.revokeObjectURL(frontImage.objectUrl);
      backImage?.objectUrl && URL.revokeObjectURL(backImage.objectUrl);
    };
  }, [frontImage, backImage]);

  const handleImageSelect = useCallback(
    async (slot: "front" | "back", file: File | null) => {
      if (!file) {
        return;
      }

      setErrors((current) => ({ ...current, [slot]: null }));
      setIsProcessing((current) => ({ ...current, [slot]: true }));

      try {
        const prepared = await loadAndPrepareImage(file);

        if (slot === "front") {
          frontImage?.objectUrl && URL.revokeObjectURL(frontImage.objectUrl);
          setFrontImage(prepared);
        } else {
          backImage?.objectUrl && URL.revokeObjectURL(backImage.objectUrl);
          setBackImage(prepared);
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unable to process the selected image.";
        setErrors((current) => ({ ...current, [slot]: message }));
      } finally {
        setIsProcessing((current) => ({ ...current, [slot]: false }));
      }
    },
    [backImage, frontImage],
  );

  const handleExport = useCallback(async () => {
    const images = [frontImage, backImage].filter(Boolean) as LoadedDocumentImage[];

    if (images.length === 0) {
      return;
    }

    setIsExporting(true);

    try {
      await exportWatermarkedPdf(images, watermarkText, options, exportOptions);
    } finally {
      setIsExporting(false);
    }
  }, [backImage, exportOptions, frontImage, options, watermarkText]);

  const isReadyToExport = useMemo(() => {
    const hasPassword = !exportOptions.lockPdf || exportOptions.password.trim().length > 0;

    return (
      Boolean(frontImage || backImage) &&
      watermarkText.trim().length > 0 &&
      hasPassword &&
      !isExporting
    );
  }, [backImage, exportOptions.lockPdf, exportOptions.password, frontImage, isExporting, watermarkText]);

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <section className="mx-auto mb-6 max-w-3xl text-center">
        <div className="mb-4 inline-flex items-center rounded-full border border-blue-100 bg-white/90 px-4 py-2 text-sm font-medium text-blue-900 shadow-sm">
          All processing happens in your browser. No data is uploaded.
        </div>
        <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
          DocuGuard
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">
          Add clear usage watermarks to your IC, passport, driving licence, and other sensitive
          documents before sharing them.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(360px,420px)_minmax(0,1fr)]">
        <div className="order-2 space-y-5 lg:order-1">
          <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-soft">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Upload documents</h2>
              <p className="mt-1 text-sm text-slate-500">
                JPG or PNG only, max 5MB each, minimum {MIN_IMAGE_WIDTH} x {MIN_IMAGE_HEIGHT}px.
              </p>
            </div>
            <div className="grid gap-4">
              {DOCUMENT_SLOTS.map((slot) => (
                <UploadZone
                  key={slot.key}
                  label={slot.label}
                  file={slot.key === "front" ? frontImage : backImage}
                  error={errors[slot.key]}
                  isProcessing={isProcessing[slot.key]}
                  onFileSelect={(file) => handleImageSelect(slot.key, file)}
                />
              ))}
            </div>
          </div>

          <ControlsPanel
            value={watermarkText}
            options={options}
            presets={PRESETS}
            exportOptions={exportOptions}
            onValueChange={setWatermarkText}
            onOptionsChange={setOptions}
            onPresetSelect={setWatermarkText}
            onExportOptionsChange={setExportOptions}
            onResetDefaults={handleResetDefaults}
            onRegeneratePassword={handleRegeneratePassword}
            onExport={handleExport}
            exportDisabled={!isReadyToExport}
            isExporting={isExporting}
          />
        </div>

        <div className="order-1 space-y-5 lg:order-2">
          <PreviewCanvas
            title="Front preview"
            image={frontImage}
            watermarkText={watermarkText}
            options={options}
            onOffsetChange={handleOffsetChange}
          />
          <PreviewCanvas
            title="Back preview"
            image={backImage}
            watermarkText={watermarkText}
            options={options}
            onOffsetChange={handleOffsetChange}
          />
        </div>
      </section>

      <section className="mx-auto mt-10 max-w-4xl rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-soft">
        <h2 className="text-2xl font-semibold text-slate-950">Why watermark documents</h2>
        <div className="mt-4 space-y-4 text-sm leading-7 text-slate-600 sm:text-base">
          <p>
            Watermarking helps reduce misuse when you need to share identity documents for bank
            onboarding, hiring, telco registration, or internal verification. A visible purpose
            mark makes it much harder for copied documents to be reused out of context.
          </p>
          <p>
            Identity theft risks increase when clean scans of passports, ICs, and driving licences
            are forwarded across email, chat, or support channels. A clear watermark signals
            intended use and adds friction against fraudulent reuse.
          </p>
          <p>
            Common use cases include account opening, HR onboarding, SIM registration, vendor due
            diligence, and internal compliance reviews. DocuGuard keeps that process private by
            rendering everything locally in your browser.
          </p>
        </div>
      </section>
    </main>
  );
}

function clampOffset(value: number) {
  return Math.max(-MAX_OFFSET, Math.min(MAX_OFFSET, value));
}
