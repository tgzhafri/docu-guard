"use client";

type PresetButtonsProps = {
  presets: readonly string[];
  selected: string;
  onSelect: (preset: string) => void;
};

export function PresetButtons({ presets, selected, onSelect }: PresetButtonsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {presets.map((preset) => {
        const isActive = selected === preset;

        return (
          <button
            key={preset}
            type="button"
            className={[
              "rounded-xl border px-3 py-2 text-sm font-medium transition",
              isActive
                ? "border-blue-600 bg-blue-600 text-white"
                : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:text-blue-700",
            ].join(" ")}
            onClick={() => onSelect(preset)}
          >
            {preset}
          </button>
        );
      })}
    </div>
  );
}
