"use client";

import { NYNY_HANG } from "@/lib/nynyHangConfig";
import Image from "next/image";


function buildVars(cfg) {
    const { SCALE, SIZE_MIN_PX, SIZE_VW, SIZE_MAX_PX, EDGE_Y, ANCHOR_X_PCT, OFFSET_X_PX, OFFSET_Y_PX } = cfg;

    return {
        "--nyny-size": `calc(clamp(${SIZE_MIN_PX}px, ${SIZE_VW}vw, ${SIZE_MAX_PX}px) * ${SCALE})`,
        "--nyny-top": `calc(var(--nyny-size) * ${-EDGE_Y} + ${OFFSET_Y_PX}px)`,
        "--nyny-left": `calc(${ANCHOR_X_PCT}% + ${OFFSET_X_PX}px)`,
        "--nyny-above": `max(0px, calc(var(--nyny-size) * ${EDGE_Y} - ${OFFSET_Y_PX}px))`,
    };
}

function NynyLayer({ src, zIndex, desktopOnly, sizes }) {
    return (
        <Image
            src={src}
            alt=""
            aria-hidden="true"
            width={2048}
            height={2048}
            sizes={sizes}
            draggable={false}
            className={`pointer-events-none select-none absolute max-w-none ${desktopOnly ? "hidden sm:block" : ""}`}
            style={{
                width: "var(--nyny-size)",
                height: "var(--nyny-size)",
                top: "var(--nyny-top)",
                left: "var(--nyny-left)",
                transform: "translateX(-50%)",
                zIndex,
            }}
        />
    );
}

export default function NynyHangFrame({
    frameRef,
    className = "",
    panelClassName = "",
    desktopOnly = false,
    panelProps = {},
    nyny = {},
    children,
}) {
    const cfg = { ...NYNY_HANG, ...nyny };

    return (
        <div ref={frameRef} className={`relative ${className}`} style={buildVars(cfg)}>
            <NynyLayer
                src={cfg.SRC_BACK}
                zIndex={0}
                desktopOnly={desktopOnly}
                sizes={`${Math.round(cfg.SIZE_MAX_PX * cfg.SCALE)}px`}
            />

            <div {...panelProps} className={`relative z-10 ${panelClassName}`}>
                {children}
            </div>

            <NynyLayer
                src={cfg.SRC_FRONT}
                zIndex={20}
                desktopOnly={desktopOnly}
                sizes={`${Math.round(cfg.SIZE_MAX_PX * cfg.SCALE)}px`}
            />
        </div>
    );
}