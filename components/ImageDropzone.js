"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import { ACCEPTED_TYPES, MAX_FILE_BYTES, MAX_IMAGES } from "@/hooks/useImageUploader";

export default function ImageDropzone({ onFiles, disabled, compact }) {
    const inputRef = useRef(null);
    const [isOver, setIsOver] = useState(false);
    const dragDepth = useRef(0);

    const handleDrop = useCallback(
        (e) => {
            e.preventDefault();
            dragDepth.current = 0;
            setIsOver(false);
            if (disabled) return;
            if (e.dataTransfer.files?.length) onFiles(e.dataTransfer.files);
        },
        [onFiles, disabled]
    );

    const handleDragEnter = (e) => {
        e.preventDefault();
        if (disabled) return;
        dragDepth.current += 1;
        setIsOver(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        dragDepth.current -= 1;
        if (dragDepth.current <= 0) setIsOver(false);
    };

    return (
        <div
            onDragEnter={handleDragEnter}
            onDragOver={(e) => e.preventDefault()}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !disabled && inputRef.current?.click()}
            role="button"
            tabIndex={0}
            aria-disabled={disabled}
            onKeyDown={(e) => {
                if (!disabled && (e.key === "Enter" || e.key === " ")) inputRef.current?.click();
            }}
            className={`relative flex flex-col items-center justify-center gap-3 w-full rounded-xl border-[3px] border-dashed
        select-none transition-colors
        ${compact ? "py-4 px-3" : "h-full py-10 px-4"}
        ${disabled ? "opacity-40 cursor-not-allowed border-[#803c17]/30" : "cursor-pointer border-[#803c17]/50"}
        ${isOver && !disabled ? "border-[#803c17] bg-[#eddab7]" : "bg-transparent"}`}
        >
            <input
                ref={inputRef}
                type="file"
                accept={ACCEPTED_TYPES.join(",")}
                multiple
                disabled={disabled}
                className="hidden"
                onChange={(e) => {
                    if (e.target.files?.length) onFiles(e.target.files);
                    e.target.value = ""; // allow re-selecting the same file later
                }}
            />

            <p className={`font-kavoon text-[#803c17] ${compact ? "text-sm" : "text-lg sm:text-xl"}`}>
                {compact ? "Add more images" : "Drop all your images here"}
            </p>

            {!compact && (
                <div className="relative w-28 sm:w-36" style={{ aspectRatio: "1080 / 900" }}>
                    <Image
                        src="/ocs/nyny-upload.png"
                        alt="NyNy, waiting for images"
                        fill
                        unoptimized
                        priority
                        style={{ imageRendering: "pixelated", objectFit: "contain" }}
                    />
                </div>
            )}

            <p className="text-xs text-[#803c17]/70">
                PNG, JPG, or WEBP — up to {(MAX_FILE_BYTES / (1024 * 1024)).toFixed(0)}MB each, {MAX_IMAGES} images total
            </p>
        </div>
    );
}