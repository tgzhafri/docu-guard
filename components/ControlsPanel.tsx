"use client";

import { PresetButtons } from "@/components/PresetButtons";
import type { ExportOptions, WatermarkOptions } from "@/lib/utils";

type ControlsPanelProps = {
  value: string;
  options: WatermarkOptions;
  presets: readonly string[];
  exportOptions: ExportOptions;
  onValueChange: (value: string) => void;
  onOptionsChange: (options: WatermarkOptions) => void;
  onPresetSelect: (preset: string) => void;
  onExportOptionsChange: (options: ExportOptions) => void;
  onResetDefaults: () => void;
  onRegeneratePassword: () => void;
  onExport: () => void;
  exportDisabled: boolean;
  isExporting: boolean;
};

export function ControlsPanel({
  value,
  options,
  presets,
  exportOptions,
  onValueChange,
  onOptionsChange,
  onPresetSelect,
  onExportOptionsChange,
  onResetDefaults,
  onRegeneratePassword,
  onExport,
  exportDisabled,
  isExporting,
}: ControlsPanelProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-soft">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Watermark controls</h2>
        <p className="mt-1 text-sm text-slate-500">
          Tune the watermark until the preview looks right, then export a PDF.
        </p>
      </div>

      <div className="mt-5 space-y-5">
        <div className="space-y-2">
          <SectionLabel title="Message" description="Choose the purpose statement shown on the document." />
          <label htmlFor="watermarkText" className="text-sm font-medium text-slate-700">
            Watermark text
          </label>
          <input
            id="watermarkText"
            value={value}
            maxLength={80}
            onChange={(event) => onValueChange(event.target.value.toUpperCase())}
            placeholder="FOR BANK USE ONLY"
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
        </div>

        <div className="space-y-2 border-t border-slate-100 pt-5">
          <SectionLabel title="Appearance" description="Adjust readability, placement, and pattern density." />
          <div className="text-sm font-medium text-slate-700">Quick presets</div>
          <PresetButtons presets={presets} selected={value} onSelect={onPresetSelect} />
        </div>

        <SliderControl
          label="Opacity"
          min={0.1}
          max={1}
          step={0.05}
          value={options.opacity}
          displayValue={options.opacity.toFixed(2)}
          onChange={(nextValue) => onOptionsChange({ ...options, opacity: nextValue })}
        />

        <SliderControl
          label="Font size"
          min={18}
          max={96}
          step={2}
          value={options.fontSize}
          displayValue={`${options.fontSize}px`}
          onChange={(nextValue) => onOptionsChange({ ...options, fontSize: nextValue })}
        />

        <SliderControl
          label="Rotation"
          min={-90}
          max={90}
          step={1}
          value={options.angle}
          displayValue={`${options.angle}°`}
          onChange={(nextValue) => onOptionsChange({ ...options, angle: nextValue })}
        />

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-medium text-slate-700">Watermark position</div>
            <button
              type="button"
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-blue-300 hover:text-blue-700"
              onClick={onResetDefaults}
            >
              Reset all
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <PositionButton
              label="Top left"
              active={options.position === "top-left"}
              onClick={() => onOptionsChange({ ...options, position: "top-left" })}
            />
            <PositionButton
              label="Top right"
              active={options.position === "top-right"}
              onClick={() => onOptionsChange({ ...options, position: "top-right" })}
            />
            <PositionButton
              label="Bottom left"
              active={options.position === "bottom-left"}
              onClick={() => onOptionsChange({ ...options, position: "bottom-left" })}
            />
            <PositionButton
              label="Bottom right"
              active={options.position === "bottom-right"}
              onClick={() => onOptionsChange({ ...options, position: "bottom-right" })}
            />
            <PositionButton
              label="Center"
              active={options.position === "center"}
              onClick={() => onOptionsChange({ ...options, position: "center" })}
            />
          </div>
        </div>

        <SliderControl
          label="Adjust X Axis"
          min={-240}
          max={240}
          step={2}
          value={options.offsetX}
          displayValue={`${options.offsetX > 0 ? "+" : ""}${options.offsetX}px`}
          onChange={(nextValue) => onOptionsChange({ ...options, offsetX: nextValue })}
        />

        <SliderControl
          label="Adjust Y Axis"
          min={-240}
          max={240}
          step={2}
          value={options.offsetY}
          displayValue={`${options.offsetY > 0 ? "+" : ""}${options.offsetY}px`}
          onChange={(nextValue) => onOptionsChange({ ...options, offsetY: nextValue })}
        />

        <label className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div>
            <div className="text-sm font-medium text-slate-800">Repeat pattern</div>
            <div className="text-xs text-slate-500">Tile the watermark across the document</div>
          </div>
          <button
            type="button"
            aria-pressed={options.repeat}
            className={[
              "relative h-7 w-12 rounded-full transition",
              options.repeat ? "bg-blue-600" : "bg-slate-300",
            ].join(" ")}
            onClick={() => onOptionsChange({ ...options, repeat: !options.repeat })}
          >
            <span
              className={[
                "absolute top-1 h-5 w-5 rounded-full bg-white transition",
                options.repeat ? "left-6" : "left-1",
              ].join(" ")}
            />
          </button>
        </label>

        <div className="space-y-2 border-t border-slate-100 pt-5">
          <SectionLabel title="Export" description="Set PDF layout, file size, and viewing protection." />
          <div className="text-sm font-medium text-slate-700">PDF export</div>
          <div className="grid grid-cols-2 gap-2">
            <ModeButton
              label="Single PDF"
              active={exportOptions.mode === "single"}
              onClick={() => onExportOptionsChange({ ...exportOptions, mode: "single" })}
            />
            <ModeButton
              label="Split PDFs"
              active={exportOptions.mode === "split"}
              onClick={() => onExportOptionsChange({ ...exportOptions, mode: "split" })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium text-slate-700">PDF quality</div>
          <div className="grid grid-cols-3 gap-2">
            <ModeButton
              label="Smaller"
              active={exportOptions.quality === "small"}
              onClick={() => onExportOptionsChange({ ...exportOptions, quality: "small" })}
            />
            <ModeButton
              label="Balanced"
              active={exportOptions.quality === "balanced"}
              onClick={() => onExportOptionsChange({ ...exportOptions, quality: "balanced" })}
            />
            <ModeButton
              label="Higher"
              active={exportOptions.quality === "high"}
              onClick={() => onExportOptionsChange({ ...exportOptions, quality: "high" })}
            />
          </div>
        </div>

        <label className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div>
            <div className="text-sm font-medium text-slate-800">Lock PDF with password</div>
            <div className="text-xs text-slate-500">Viewer will require a password to open it</div>
          </div>
          <button
            type="button"
            aria-pressed={exportOptions.lockPdf}
            className={[
              "relative h-7 w-12 rounded-full transition",
              exportOptions.lockPdf ? "bg-blue-600" : "bg-slate-300",
            ].join(" ")}
            onClick={() =>
              onExportOptionsChange({ ...exportOptions, lockPdf: !exportOptions.lockPdf })
            }
          >
            <span
              className={[
                "absolute top-1 h-5 w-5 rounded-full bg-white transition",
                exportOptions.lockPdf ? "left-6" : "left-1",
              ].join(" ")}
            />
          </button>
        </label>

        {exportOptions.lockPdf ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="pdfPassword" className="text-sm font-medium text-slate-700">
                PDF password
              </label>
              <button
                type="button"
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-blue-300 hover:text-blue-700"
                onClick={onRegeneratePassword}
              >
                Regenerate
              </button>
            </div>
            <input
              id="pdfPassword"
              value={exportOptions.password}
              maxLength={64}
              onChange={(event) =>
                onExportOptionsChange({ ...exportOptions, password: event.target.value })
              }
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
            <p className="text-xs text-slate-500">
              A random password is generated by default. Replace it if you need something easier
              to share internally.
            </p>
          </div>
        ) : null}

        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Export summary
          </div>
          <div className="mt-2 flex flex-wrap gap-2 text-sm">
            <SummaryPill label={exportOptions.mode === "single" ? "1 page layout" : "Split files"} />
            <SummaryPill
              label={
                exportOptions.quality === "small"
                  ? "Smaller size"
                  : exportOptions.quality === "high"
                    ? "Higher quality"
                    : "Balanced quality"
              }
            />
            <SummaryPill label={exportOptions.lockPdf ? "Password locked" : "No password"} />
          </div>
        </div>

        <button
          type="button"
          disabled={exportDisabled}
          className={[
            "w-full rounded-xl px-4 py-3 text-sm font-semibold transition",
            exportDisabled
              ? "cursor-not-allowed bg-slate-200 text-slate-500"
              : "bg-slate-950 text-white hover:bg-slate-800",
          ].join(" ")}
          onClick={onExport}
        >
          {isExporting ? "Preparing PDF..." : "Download watermarked PDF"}
        </button>
      </div>
    </section>
  );
}

type ChoiceButtonProps = {
  label: string;
  active: boolean;
  onClick: () => void;
};

function PositionButton({ label, active, onClick }: ChoiceButtonProps) {
  return <ChoiceButton label={label} active={active} onClick={onClick} />;
}

function ModeButton({ label, active, onClick }: ChoiceButtonProps) {
  return <ChoiceButton label={label} active={active} onClick={onClick} />;
}

function ChoiceButton({ label, active, onClick }: ChoiceButtonProps) {
  return (
    <button
      type="button"
      className={[
        "rounded-xl border px-3 py-2 text-sm font-medium transition",
        active
          ? "border-blue-600 bg-blue-600 text-white"
          : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:text-blue-700",
      ].join(" ")}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function SectionLabel({ title, description }: { title: string; description: string }) {
  return (
    <div className="space-y-1">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</div>
      <p className="text-sm text-slate-500">{description}</p>
    </div>
  );
}

function SummaryPill({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-700">
      {label}
    </span>
  );
}

type SliderControlProps = {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  displayValue: string;
  onChange: (value: number) => void;
};

function SliderControl({
  label,
  min,
  max,
  step,
  value,
  displayValue,
  onChange,
}: SliderControlProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="text-slate-500">{displayValue}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        className="w-full"
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  );
}
