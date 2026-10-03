"use client";

import Image from "next/image";

export const NYNY_HANG = {
    SCALE: 1,

    SIZE_MIN_PX: 150,
    SIZE_VW: 52,
    SIZE_MAX_PX: 280,

    EDGE_Y: 0.55,

    ANCHOR_X_PCT: 50,

    OFFSET_X_PX: 0,
    OFFSET_Y_PX: 0,

    SRC_BACK: "/ocs/nyny_hang_0.png",
    SRC_FRONT: "/ocs/nyny_hang_1.png",
};

const {
    SCALE,
    SIZE_MIN_PX,
    SIZE_VW,
    SIZE_MAX_PX,
    EDGE_Y,
    ANCHOR_X_PCT,
    OFFSET_X_PX,
    OFFSET_Y_PX,
    SRC_BACK,
    SRC_FRONT,
} = NYNY_HANG;

const FRAME_VARS = {
    "--nyny-size": `calc(clamp(${SIZE_MIN_PX}px, ${SIZE_VW}vw, ${SIZE_MAX_PX}px) * ${SCALE})`,
    "--nyny-top": `calc(var(--nyny-size) * ${-EDGE_Y} + ${OFFSET_Y_PX}px)`,
    "--nyny-above": `max(0px, calc(var(--nyny-size) * ${EDGE_Y} - ${OFFSET_Y_PX}px))`,
};

function NynyLayer({ src, zIndex, desktopOnly }) {
    return (
        <Image
            src={src}
            alt=""
            aria-hidden="true"
            width={2048}
            height={2048}
            sizes={`${Math.round(SIZE_MAX_PX * SCALE)}px`}
            draggable={false}
            className={`pointer-events-none select-none absolute max-w-none ${desktopOnly ? "hidden sm:block" : ""}`}
            style={{
                width: "var(--nyny-size)",
                height: "var(--nyny-size)",
                top: "var(--nyny-top)",
                left: `calc(${ANCHOR_X_PCT}% + ${OFFSET_X_PX}px)`,
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
    children,
}) {
    return (
        <div ref={frameRef} className={`relative ${className}`} style={FRAME_VARS}>
            <NynyLayer src={SRC_BACK} zIndex={0} desktopOnly={desktopOnly} />

            <div {...panelProps} className={`relative z-10 ${panelClassName}`}>
                {children}
            </div>

            <NynyLayer src={SRC_FRONT} zIndex={20} desktopOnly={desktopOnly} />
        </div>
    );
}