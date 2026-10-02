"use client";

import { useId } from "react";
import { CUSTOM_MAX_CM, CUSTOM_MIN_CM, parseCustomSize } from "@/lib/pageSizes";

function sanitize(raw) {
    const cleaned = raw.replace(",", ".").replace(/[^\d.]/g, "");
    const firstDot = cleaned.indexOf(".");
    if (firstDot === -1) return cleaned.slice(0, 5);
    const head = cleaned.slice(0, firstDot + 1);
    const tail = cleaned.slice(firstDot + 1).replace(/\./g, "");
    return `${head}${tail}`.slice(0, 6);
}

function SizeField({ label, value, onChange, error }) {
    const id = useId();

    return (
        <div className="flex-1 min-w-0 flex flex-col gap-1 text-left">
            <label htmlFor={id} className="font-kavoon text-xs text-[#803c17]">
                {label}
            </label>

            <div className="relative">
                <input
                    id={id}
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    value={value}
                    onChange={(e) => onChange(sanitize(e.target.value))}
                    aria-invalid={error ? "true" : "false"}
                    className={`w-full bg-white border-[2px] rounded-lg pl-3 pr-9 py-2 text-sm text-[#4a2410]
            focus:outline-none focus:ring-2 focus:ring-[#803c17]/40 ${error ? "border-[#a13727]" : "border-[#803c17]"}`}
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#803c17]/60">
                    cm
                </span>
            </div>

            <p className="text-[11px] text-brand min-h-[1em]">{error ?? ""}</p>
        </div>
    );
}

export default function CustomSizeFields({ widthCm, heightCm, onWidthChange, onHeightChange }) {
    const parsed = parseCustomSize(widthCm, heightCm);

    const handleSwap = () => {
        onWidthChange(heightCm);
        onHeightChange(widthCm);
    };

    return (
        <div className="w-full flex flex-col gap-1">
            <div className="flex items-start gap-3">
                <SizeField label="Width" value={widthCm} onChange={onWidthChange} error={parsed.widthError} />
                <SizeField label="Height" value={heightCm} onChange={onHeightChange} error={parsed.heightError} />
            </div>

            <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] text-[#803c17]/70 text-left">
                    {parsed.valid
                        ? `${parsed.widthIn.toFixed(2)}" × ${parsed.heightIn.toFixed(2)}" · each side ${CUSTOM_MIN_CM}–${CUSTOM_MAX_CM} cm`
                        : `Each side must be ${CUSTOM_MIN_CM}–${CUSTOM_MAX_CM} cm`}
                </p>

                <button
                    type="button"
                    onClick={handleSwap}
                    className="shrink-0 flex items-center gap-1 rounded-md border-[1.5px] border-[#803c17]
            bg-white text-[#803c17] text-[11px] font-kavoon px-2 py-1
            hover:bg-[#803c17] hover:text-[#f5e3ca] transition-colors"
                    aria-label="Swap width and height"
                >
                    ⇄ Swap
                </button>
            </div>
        </div>
    );
}