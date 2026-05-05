"use client";

import { useRef, useState } from "react";
import type { LoadedDocumentImage } from "@/lib/utils";

type UploadZoneProps = {
  label: string;
  file: LoadedDocumentImage | null;
  error: string | null;
  isProcessing: boolean;
  onFileSelect: (file: File | null) => void;
};

export function UploadZone({
  label,
  file,
  error,
  isProcessing,
  onFileSelect,
}: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = (files: FileList | null) => {
    onFileSelect(files?.[0] ?? null);
  };

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-slate-700">{label}</div>
      <button
        type="button"
        disabled={isProcessing}
        className={[
          "w-full rounded-2xl border border-dashed p-5 text-left transition",
          isProcessing ? "cursor-wait opacity-80" : "",
          isDragging
            ? "border-blue-500 bg-blue-50 shadow-sm"
            : "border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50/60",
        ].join(" ")}
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          handleFiles(event.dataTransfer.files);
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg"
          className="hidden"
          onChange={(event) => {
            handleFiles(event.target.files);
            event.target.value = "";
          }}
        />
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-slate-900">
              {isProcessing ? "Processing image..." : file ? file.name : "Drop image here or browse"}
            </div>
            <div className="mt-1 text-sm text-slate-500">
              {isProcessing
                ? "Preparing an optimized local preview"
                : file
                ? `${file.width} x ${file.height}px`
                : "Sensitive files stay on your device"}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700">
            {isProcessing ? "Working" : file ? "Replace" : "Select"}
          </div>
        </div>
      </button>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
