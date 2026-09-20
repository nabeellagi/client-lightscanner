"use client";

import { computeContainFit } from "@/lib/fitToPage";
import CropPreview from "./CropPreview";

export default function PagePreview({
    pageWidthIn,
    pageHeightIn,
    src,
    imgWidth,
    imgHeight,
    croppedAreaPercent,
    cropWidthPx,
    cropHeightPx,
    className,
}) {
    const fit = computeContainFit(cropWidthPx, cropHeightPx, pageWidthIn, pageHeightIn);
    const widthPct = (fit.renderedWidthIn / pageWidthIn) * 100;
    const heightPct = (fit.renderedHeightIn / pageHeightIn) * 100;

    return (
        <div
            className={`relative bg-white shadow-[0_2px_10px_rgba(0,0,0,0.25)] mx-auto ${className ?? ""}`}
            style={{ aspectRatio: `${pageWidthIn} / ${pageHeightIn}`, width: "100%" }}
        >
            <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                style={{ width: `${widthPct}%`, height: `${heightPct}%` }}
            >
                <CropPreview
                    src={src}
                    imgWidth={imgWidth}
                    imgHeight={imgHeight}
                    croppedAreaPercent={croppedAreaPercent}
                    className="w-full h-full"
                />
            </div>
        </div>
    )
}