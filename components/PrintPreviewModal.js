"use client";

import { useEffect, useMemo } from "react";
import { computeContainFit, computeFitPageSize } from "@/lib/fitToPage";
import NynyHangFrame from "@/components/NynyHangFrame";

const PX_PER_INCH = 56;
const toCm = (inches) => (inches * 2.54).toFixed(1);

function buildPages(images, page) {
    const isFit = page.mode === "fit";

    return images.map((image, index) => {
        const widthPx = image.croppedWidth ?? image.width;
        const heightPx = image.croppedHeight ?? image.height;

        const { pageWidthIn, pageHeightIn } = isFit
            ? computeFitPageSize(widthPx, heightPx)
            : { pageWidthIn: page.widthIn, pageHeightIn: page.heightIn };

        const fit = computeContainFit(widthPx, heightPx, pageWidthIn, pageHeightIn);

        return {
            id: image.id,
            index,
            name: image.file?.name ?? `Image ${index + 1}`,
            src: image.conversionBlob ? image.thumbUrl : image.previewUrl,
            pageWidthIn,
            pageHeightIn,
            leftPct: (fit.marginXIn / pageWidthIn) * 100,
            topPct: (fit.marginYIn / pageHeightIn) * 100,
            widthPct: (fit.renderedWidthIn / pageWidthIn) * 100,
            heightPct: (fit.renderedHeightIn / pageHeightIn) * 100,
        };
    });
}

export default function PrintPreviewModal({ isOpen, images, page, onClose, onContinue }) {
    const pages = useMemo(() => (isOpen ? buildPages(images, page) : []), [isOpen, images, page]);

    useEffect(() => {
        if (!isOpen) return;

        const onKey = (e) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKey);

        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            window.removeEventListener("keydown", onKey);
            document.body.style.overflow = prevOverflow;
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[75] bg-black/60 flex items-end sm:items-center justify-center sm:p-4"
            onClick={onClose}
        >
            <NynyHangFrame
                desktopOnly
                className="w-full sm:max-w-2xl"
                panelProps={{
                    role: "dialog",
                    "aria-modal": "true",
                    "aria-label": "Print preview",
                    onClick: (e) => e.stopPropagation(),
                }}
                panelClassName="bg-[#f5e3ca] border-[#803c17] border-t-[3.5px] sm:border-[3.5px]
                sm:rounded-2xl h-[100dvh] sm:h-[calc(100vh_-_2_*_var(--nyny-above))] flex flex-col overflow-hidden
                shadow-[5px_5px_0_rgba(128,60,23,0.28)]"
            >
                {/* Header */}
                <div className="flex items-center justify-between gap-3 px-4 py-3 border-b-[2.5px] border-[#803c17]/30 shrink-0">
                    <div className="min-w-0 text-left">
                        <h4 className="font-kavoon text-lg text-[#803c17] leading-tight">Preview</h4>
                        <p className="text-[11px] text-[#803c17]/70 truncate">
                            {pages.length} {pages.length === 1 ? "page" : "pages"} · {page.label}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close preview"
                        className="shrink-0 w-9 h-9 rounded-lg border-[2px] border-[#803c17] text-[#803c17] bg-white
                        font-kavoon text-base leading-none hover:bg-[#803c17] hover:text-[#f5e3ca] transition-colors"
                    >
                        ✕
                    </button>
                </div>

                {/* Pages (scrollable "desk") */}
                <div className="flex-1 overflow-y-auto overscroll-contain bg-[#d8c2a3] px-3 sm:px-6 py-5">
                    <div className="flex flex-col gap-7">
                        {pages.map((p) => (
                            <figure
                                key={p.id}
                                className="mx-auto w-full"
                                style={{ maxWidth: `${p.pageWidthIn * PX_PER_INCH}px` }}
                            >
                                <div
                                    className="relative bg-white shadow-[0_3px_12px_rgba(0,0,0,0.3)] overflow-hidden"
                                    style={{ aspectRatio: `${p.pageWidthIn} / ${p.pageHeightIn}` }}
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element -- exact percentage positioning */}
                                    <img
                                        src={p.src}
                                        alt={`Page ${p.index + 1}: ${p.name}`}
                                        loading="lazy"
                                        decoding="async"
                                        draggable={false}
                                        className="absolute object-cover select-none"
                                        style={{
                                            left: `${p.leftPct}%`,
                                            top: `${p.topPct}%`,
                                            width: `${p.widthPct}%`,
                                            height: `${p.heightPct}%`,
                                        }}
                                    />
                                </div>

                                <figcaption className="mt-2 flex items-center justify-between gap-2 text-[11px] text-[#4a2410]">
                                    <span className="font-kavoon">
                                        Page {p.index + 1} of {pages.length}
                                    </span>
                                    <span className="opacity-70">
                                        {toCm(p.pageWidthIn)} × {toCm(p.pageHeightIn)} cm
                                    </span>
                                </figcaption>
                            </figure>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div
                    className="flex gap-2 px-4 pt-3 border-t-[2.5px] border-[#803c17]/30 shrink-0"
                    style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
                >
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 rounded-lg border-[2px] border-[#803c17] text-[#803c17] bg-white py-2.5 text-sm font-kavoon"
                    >
                        Keep editing
                    </button>

                    <button
                        type="button"
                        onClick={onContinue}
                        className="flex-1 rounded-lg bg-[#803c17] text-[#f5e3ca] py-2.5 text-sm font-kavoon hover:opacity-90 transition-opacity"
                    >
                        NEXT
                    </button>
                </div>
            </NynyHangFrame>
        </div>
    );
}