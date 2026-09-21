"use client";

import { useEffect, useRef, useState } from "react";
import Cropper from "react-easy-crop";
import gsap from "gsap";
import PagePreview from "./PagePreview";
import { getCroppedImage } from "@/lib/cropImage";
import { computeContainFit } from "@/lib/fitToPage";

const ASPECT_OPTIONS = [
    { id: "original", label: "Original" },
    { id: "page", label: "Match page" },
    { id: "square", label: "Square" },
];

function safeAspect(width, height) {
    return Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0 ? width / height : 1;
}

export default function ImageEditModal({ image, pageWidthIn, pageHeightIn, pushIssue, onSave, onRemove, onClose }) {
    const backdropRef = useRef(null);
    const panelRef = useRef(null);
    const closingRef = useRef(false);

    const [loadState, setLoadState] = useState("checking");
    const [retryTick, setRetryTick] = useState(0);

    const [aspectMode, setAspectMode] = useState("original");
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPercent, setCroppedAreaPercent] = useState(null);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    const aspect =
        aspectMode === "page" ? pageWidthIn / pageHeightIn : aspectMode === "square" ? 1 : safeAspect(image.width, image.height);

    useEffect(() => {
        let cancelled = false;
        setLoadState("checking");

        (async () => {
            try {
                const bitmap = await createImageBitmap(image.file, { imageOrientation: "from-image" });
                bitmap.close?.();
                if (!cancelled) setLoadState("ready");
            } catch (err) {
                console.error("Preflight image check failed:", err);
                if (!cancelled) setLoadState("error");
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [image.id, image.file, retryTick]);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.fromTo(backdropRef.current, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: "power1.out" });
            gsap.fromTo(
                panelRef.current,
                { opacity: 0, y: 40, scale: 0.96 },
                { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: "back.out(1.6)" }
            );
        });
        return () => ctx.revert();
    }, []);

    const requestClose = () => {
        if (closingRef.current) return;
        closingRef.current = true;
        gsap.to(panelRef.current, { opacity: 0, y: 30, scale: 0.97, duration: 0.25, ease: "power2.in" });
        gsap.to(backdropRef.current, { opacity: 0, duration: 0.25, ease: "power1.in", onComplete: onClose });
    };

    const handleRemove = () => {
        onRemove?.(image.id);
        requestClose();
    };

    const handleSave = async () => {
        if (!croppedAreaPixels) return;
        setIsSaving(true);
        try {
            const { blob, width, height } = await getCroppedImage(image.file, croppedAreaPixels);
            onSave(image.id, { blob, width, height, cropPixels: croppedAreaPixels });
            requestClose();
        } catch (err) {
            console.error("Crop failed:", err);
            pushIssue?.("crop-failed", "Couldn't save that crop — try again, or remove the image.");
            setIsSaving(false);
        }
    };

    const fit = computeContainFit(
        croppedAreaPixels?.width ?? image.width,
        croppedAreaPixels?.height ?? image.height,
        pageWidthIn,
        pageHeightIn
    );
    const marginText =
        fit.marginXIn > 0.02
            ? `${fit.marginXIn.toFixed(2)}" margin on the sides`
            : fit.marginYIn > 0.02
                ? `${fit.marginYIn.toFixed(2)}" margin top and bottom`
                : "Fills the page edge to edge";

    return (
        <div
            ref={backdropRef}
            className="fixed inset-0 z-[60] bg-black/50 flex items-end sm:items-center justify-center"
            onClick={(e) => {
                if (e.target === e.currentTarget) requestClose();
            }}
        >
            <div
                ref={panelRef}
                className="bg-[#f5e3ca] border-[#803c17] border-t-[3.5px] sm:border-[3.5px] rounded-t-2xl sm:rounded-2xl
          w-full sm:max-w-lg max-h-[92vh] sm:max-h-[88vh] flex flex-col overflow-hidden"
            >
                <div className="flex items-center justify-between px-4 py-3 border-b-[2.5px] border-[#803c17]/30 shrink-0">
                    <h4 className="font-kavoon text-sm text-[#803c17] truncate pr-2">{image.file.name}</h4>
                    <button onClick={requestClose} aria-label="Close" className="text-[#803c17] text-lg leading-none px-1">
                        ✕
                    </button>
                </div>

                {loadState === "checking" && (
                    <div className="flex-1 flex flex-col items-center justify-center gap-2 px-6 py-16">
                        <div className="w-6 h-6 rounded-full border-[3px] border-[#803c17]/30 border-t-[#803c17] animate-spin" />
                        <p className="text-sm text-[#803c17]">Loading photo…</p>
                    </div>
                )}

                {loadState === "error" && (
                    <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 py-14 text-center">
                        <p className="font-kavoon text-sm text-[#803c17]">This photo couldn't be loaded for editing.</p>
                        <p className="text-xs text-[#803c17]/70 max-w-xs">
                            It may be too large for your device's memory right now. Nothing else you've added is affected — you can
                            try again or just remove this one.
                        </p>
                        <div className="flex gap-2 mt-1">
                            <button
                                type="button"
                                onClick={() => setRetryTick((t) => t + 1)}
                                className="rounded-lg border-[2px] border-[#803c17] text-[#803c17] px-4 py-2 text-sm font-kavoon"
                            >
                                Try again
                            </button>
                            <button
                                type="button"
                                onClick={handleRemove}
                                className="rounded-lg bg-[#803c17] text-[#f5e3ca] px-4 py-2 text-sm font-kavoon"
                            >
                                Remove image
                            </button>
                        </div>
                    </div>
                )}

                {loadState === "ready" && (
                    <>
                        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-5">
                            <div>
                                <div className="flex gap-2 mb-2">
                                    {ASPECT_OPTIONS.map((opt) => (
                                        <button
                                            key={opt.id}
                                            type="button"
                                            onClick={() => setAspectMode(opt.id)}
                                            className={`px-2.5 py-1 rounded-md text-xs border-[1.5px] border-[#803c17] transition-colors ${aspectMode === opt.id ? "bg-[#803c17] text-[#f5e3ca]" : "bg-white text-[#803c17]"
                                                }`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>

                                <div className="relative w-full h-[42vh] sm:h-72 bg-black/80 rounded-lg overflow-hidden">
                                    <Cropper
                                        image={image.previewUrl}
                                        crop={crop}
                                        zoom={zoom}
                                        aspect={aspect}
                                        onCropChange={setCrop}
                                        onZoomChange={setZoom}
                                        onCropComplete={(areaPercent, areaPixels) => {
                                            // react-easy-crop can emit one transitional, zero-size
                                            // rect right as `aspect` changes — never let that
                                            // become "the current crop".
                                            if (areaPixels.width < 1 || areaPixels.height < 1) return;
                                            setCroppedAreaPercent(areaPercent);
                                            setCroppedAreaPixels(areaPixels);
                                        }}
                                    />
                                </div>

                                <input
                                    type="range"
                                    min={1}
                                    max={4}
                                    step={0.01}
                                    value={zoom}
                                    onChange={(e) => setZoom(Number(e.target.value))}
                                    className="w-full mt-3 accent-[#803c17]"
                                    aria-label="Zoom"
                                />
                            </div>

                            <div>
                                <p className="font-kavoon text-xs text-[#803c17] mb-2 text-left">As a printed page</p>
                                <PagePreview
                                    pageWidthIn={pageWidthIn}
                                    pageHeightIn={pageHeightIn}
                                    src={image.previewUrl}
                                    imgWidth={image.width}
                                    imgHeight={image.height}
                                    croppedAreaPercent={croppedAreaPercent}
                                    cropWidthPx={croppedAreaPixels?.width ?? image.width}
                                    cropHeightPx={croppedAreaPixels?.height ?? image.height}
                                    className="max-w-[220px]"
                                />
                                <p className="text-[11px] text-[#803c17]/70 mt-2 text-left">{marginText}</p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2 px-4 py-3 border-t-[2.5px] border-[#803c17]/30 shrink-0">
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={requestClose}
                                    className="flex-1 rounded-lg border-[2px] border-[#803c17] text-[#803c17] py-2 text-sm font-kavoon"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSave}
                                    disabled={isSaving || !croppedAreaPixels}
                                    className="flex-1 rounded-lg bg-[#803c17] text-[#f5e3ca] py-2 text-sm font-kavoon disabled:opacity-50"
                                >
                                    {isSaving ? "Saving…" : "Save changes"}
                                </button>
                            </div>
                            <button
                                type="button"
                                onClick={handleRemove}
                                className="text-[11px] text-[#803c17]/60 underline underline-offset-2 self-center"
                            >
                                Remove this image instead
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}