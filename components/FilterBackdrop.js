"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { API_BASE_URL } from "@/lib/api";

const FALLBACK_MODES = [
    {
        name: "normal",
        label: "Normal",
        description: "Direct image-to-PDF conversion with no filter applied.",
    },
    {
        name: "black-and-white",
        label: "Black & White",
        description: "High-contrast black and white for text-heavy documents.",
    },
    {
        name: "grayscale",
        label: "Grayscale",
        description: "Keeps photographic detail using 256 shades of gray.",
    },
    {
        name: "enhance",
        label: "Enhance",
        description: "Brightens, cleans and sharpens the page like a scan.",
    },
    {
        name: "vivid",
        label: "Vivid",
        description: "Boosts color and sharpness while keeping the original look.",
    },
];

function prettyName(name) {
    const mode = FALLBACK_MODES.find((item) => item.name === name);
    return mode?.label ?? name.replaceAll("-", " ");
}

export default function FilterBackdrop({
    isOpen,
    selectedMode,
    onSelect,
    onClose,
    onConvert,
    imageCount,
    pageLabel,
}) {
    const backdropRef = useRef(null);
    const panelRef = useRef(null);
    const closingRef = useRef(false);

    const [modes, setModes] = useState(FALLBACK_MODES);

    useEffect(() => {
        if (!isOpen) return;

        let cancelled = false;

        fetch(`${API_BASE_URL}/mode`)
            .then(async (response) => {
                if (!response.ok) {
                    throw new Error("Could not load filters.");
                }

                return response.json();
            })
            .then((data) => {
                if (cancelled || !Array.isArray(data.modes)) return;

                setModes(
                    data.modes.map((mode) => ({
                        name: mode.name,
                        label: prettyName(mode.name),
                        description: mode.description,
                    }))
                );
            })
            .catch(() => {
                
            });

        return () => {
            cancelled = true;
        };
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;

        closingRef.current = false;

        const ctx = gsap.context(() => {
            gsap.fromTo(
                backdropRef.current,
                { opacity: 0 },
                {
                    opacity: 1,
                    duration: 0.25,
                    ease: "power1.out",
                }
            );

            gsap.fromTo(
                panelRef.current,
                {
                    opacity: 0,
                    y: 40,
                    scale: 0.96,
                },
                {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    duration: 0.4,
                    ease: "back.out(1.6)",
                }
            );
        });

        return () => ctx.revert();
    }, [isOpen]);

    if (!isOpen) return null;

    const requestClose = () => {
        if (closingRef.current) return;

        closingRef.current = true;

        gsap.to(panelRef.current, {
            opacity: 0,
            y: 30,
            scale: 0.97,
            duration: 0.2,
            ease: "power2.in",
        });

        gsap.to(backdropRef.current, {
            opacity: 0,
            duration: 0.2,
            ease: "power1.in",
            onComplete: onClose,
        });
    };

    return (
        <div
            ref={backdropRef}
            className="fixed inset-0 z-[70] bg-black/50 flex items-end sm:items-center justify-center"
            onClick={(e) => {
                if (e.target === e.currentTarget) requestClose();
            }}
        >
            <div
                ref={panelRef}
                className="bg-[#f5e3ca] border-[#803c17] border-t-[3.5px] sm:border-[3.5px]
                rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl
                max-h-[92vh] sm:max-h-[88vh] flex flex-col overflow-hidden"
            >
                <div className="flex items-center justify-between px-4 py-3 border-b-[2.5px] border-[#803c17]/30 shrink-0">
                    <div className="text-left">
                        <h4 className="font-kavoon text-base sm:text-lg text-[#803c17]">
                            Choose your filter
                        </h4>

                        <p className="text-[11px] sm:text-xs text-[#803c17]/65 mt-0.5">
                            {imageCount} image{imageCount === 1 ? "" : "s"} ·{" "}
                            {pageLabel}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={requestClose}
                        aria-label="Close"
                        className="text-[#803c17] text-lg leading-none px-1"
                    >
                        ✕
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 sm:p-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {modes.map((mode) => {
                            const selected = selectedMode === mode.name;

                            return (
                                <button
                                    key={mode.name}
                                    type="button"
                                    onClick={() => onSelect(mode.name)}
                                    className={`text-left rounded-xl border-[2.5px] p-4 transition-all ${selected
                                            ? "bg-[#803c17] text-[#f5e3ca] border-[#803c17] shadow-[3px_3px_0_rgba(128,60,23,0.25)]"
                                            : "bg-white text-[#803c17] border-[#803c17]/40 hover:border-[#803c17] hover:-translate-y-0.5"
                                        }`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="font-kavoon text-sm sm:text-base capitalize">
                                                {mode.label}
                                            </p>

                                            <p
                                                className={`text-xs leading-snug mt-1 ${selected
                                                        ? "text-[#f5e3ca]/75"
                                                        : "text-[#803c17]/65"
                                                    }`}
                                            >
                                                {mode.description}
                                            </p>
                                        </div>

                                        <span
                                            className={`shrink-0 w-6 h-6 rounded-full border-[2px] flex items-center justify-center text-xs font-kavoon ${selected
                                                    ? "border-[#f5e3ca] text-[#f5e3ca]"
                                                    : "border-[#803c17]/50 text-transparent"
                                                }`}
                                        >
                                            ✓
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 px-4 py-3 border-t-[2.5px] border-[#803c17]/30 shrink-0">
                    <button
                        type="button"
                        onClick={requestClose}
                        className="flex-1 rounded-lg border-2 border-[#803c17] text-[#803c17] py-2.5 text-sm font-kavoon"
                    >
                        Back
                    </button>

                    <button
                        type="button"
                        onClick={onConvert}
                        className="flex-1 rounded-lg bg-[#803c17] text-[#f5e3ca] py-2.5 text-sm font-kavoon hover:opacity-90 transition-opacity"
                    >
                        SEND · {prettyName(selectedMode)}
                    </button>
                </div>
            </div>
        </div>
    );
}