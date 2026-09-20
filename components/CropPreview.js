"use client";

import { useEffect, useRef, useState } from "react";

export default function CropPreview({ src, imgWidth, imgHeight, croppedAreaPercent, className }) {
    const containerRef = useRef(null);
    const [boxWidth, setBoxWidth] = useState(0);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const measure = () => setBoxWidth(el.clientWidth);
        measure();
        const ro = new ResizeObserver(measure);
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    if (!croppedAreaPercent || !boxWidth) {
        return <div ref={containerRef} className={className} />;
    }

    const { x, y, width } = croppedAreaPercent; // percentages, 0-100
    const scale = 100 / width;
    const originalAspect = imgWidth / imgHeight;

    const displayedWidthPx = boxWidth * scale;
    const displayedHeightPx = displayedWidthPx / originalAspect;

    return (
        <div ref={containerRef} className={`relative overflow-hidden ${className ?? ""}`}>
            {/* eslint-disable-next-line @next/next/no-img-element -- needs raw pixel control next/image doesn't expose */}
            <img
                src={src}
                alt=""
                style={{
                    position: "absolute",
                    width: `${displayedWidthPx}px`,
                    height: `${displayedHeightPx}px`,
                    left: `${-(x / 100) * displayedWidthPx}px`,
                    top: `${-(y / 100) * displayedHeightPx}px`,
                    maxWidth: "none",
                }}
            />
        </div>
    );
}