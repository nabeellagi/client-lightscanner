"use client";

import { useRef, useState } from "react";
import Image from "next/image";

function formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ImageGrid({ images, onReorder, onRemove, onEdit }) {
    const dragIndex = useRef(null);
    const [overIndex, setOverIndex] = useState(null);

    if (images.length === 0) return null;

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 w-full">
            {images.map((img, index) => (
                <div
                    key={img.id}
                    draggable
                    onDragStart={() => {
                        dragIndex.current = index;
                    }}
                    onDragEnter={() => setOverIndex(index)}
                    onDragOver={(e) => e.preventDefault()}
                    onDragEnd={() => {
                        if (dragIndex.current !== null && overIndex !== null && dragIndex.current !== overIndex) {
                            onReorder(dragIndex.current, overIndex);
                        }
                        dragIndex.current = null;
                        setOverIndex(null);
                    }}
                    className={`relative group rounded-lg border-[2.5px] border-[#803c17] bg-[#f5e3ca] p-1.5
            cursor-grab active:cursor-grabbing transition-transform
            ${overIndex === index ? "scale-95 ring-2 ring-[#803c17]" : ""}`}
                >
                    <div className="relative w-full aspect-square rounded-md overflow-hidden">
                        <Image
                            src={img.thumbUrl}
                            alt={img.file.name}
                            fill
                            unoptimized
                            draggable={false}
                            style={{ objectFit: "cover" }}
                        />
                        {img.cropPixels && (
                            <span className="absolute bottom-1 right-1 bg-[#803c17] text-[#f5e3ca] text-[9px] rounded px-1">
                                cropped
                            </span>
                        )}
                    </div>

                    <button
                        type="button"
                        draggable={false}
                        onMouseDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit(img.id);
                        }}
                        className="mt-1.5 w-full flex items-center justify-center gap-1 rounded-md border-[1.5px] border-[#803c17]
              bg-white text-[#803c17] text-[11px] font-kavoon py-1.5 hover:bg-[#803c17] hover:text-[#f5e3ca]
              transition-colors"
                    >
                        ✂ Crop (and see Preview)
                    </button>

                    <button
                        type="button"
                        draggable={false}
                        onMouseDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                        onClick={(e) => {
                            e.stopPropagation();
                            onRemove(img.id);
                        }}
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#803c17] text-[#f5e3ca] text-xs
              flex items-center justify-center opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                        aria-label={`Remove ${img.file.name}`}
                    >
                        ✕
                    </button>

                    <div className="mt-1 text-[10px] text-[#803c17]/80 truncate text-left px-0.5">{img.file.name}</div>
                    <div className="text-[10px] text-[#803c17]/60 text-left px-0.5">
                        {formatBytes(img.originalSize)} → {formatBytes(img.compressedSize)}
                    </div>
                </div>
            ))}
        </div>
    );
}