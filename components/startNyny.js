"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import gsap from "gsap";

// SPRITE DATA
export const NYNY_SPRITE = [
    {
        key: "idle_nyny",
        width: 384,
        height: 630,
        filePath: "/ocs/nyny-1.png",
    },
    {
        key: "click_nyny",
        width: 663,
        height: 630,
        filePath: "/ocs/nyny-2.png",
    },
];

const MOVE_INTERVAL = 5000;
const MOVE_DURATION = 1.4;
const EDGE_PADDING = 12;
const FLOAT_RANGE = 10;

const getViewportScaleFactor = () => {
    if (typeof window === "undefined") return 1;
    const vw = window.innerWidth;
    if (vw < 480) return 0.55;
    if (vw < 768) return 0.75;
    return 1;
}

const prefersReducedMotion = () => {
    return (
        typeof window !== "undefined"
        && window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
}

export default function StartNyny({ scale = 100, href = "/" }) {
    const router = useRouter();
    const containerRef = useRef(null);
    const spriteWrapRef = useRef(null);
    const moveTweenRef = useRef(null);
    const floatTweenRef = useRef(null);
    const moveIntervalRef = useRef(null);

    const [activeKey, setActiveKey] = useState("idle_nyny");
    const [effectiveScale, setEffectiveScale] = useState(scale);

    const activeSprite =
        NYNY_SPRITE.find((sprite) => sprite.key === activeKey) ?? NYNY_SPRITE[0];

    const maxWidth = Math.max(...NYNY_SPRITE.map((sprite) => sprite.width)) *
        (effectiveScale / 100);
    const maxHeight = Math.max(...NYNY_SPRITE.map((sprite) => sprite.height)) *
        (effectiveScale / 100);
    const getRandomPosition = useCallback(() => {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const maxX = Math.max(EDGE_PADDING, vw - maxWidth - EDGE_PADDING);
        const maxY = Math.max(EDGE_PADDING, vh - maxHeight - EDGE_PADDING);
        return {
            x: EDGE_PADDING + Math.random() * (maxX - EDGE_PADDING),
            y: EDGE_PADDING + Math.random() * (maxY - EDGE_PADDING),
        };
    }, [maxWidth, maxHeight]);
    const getBottomPosition = useCallback(() => {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const maxX = Math.max(EDGE_PADDING, vw - maxWidth - EDGE_PADDING);
        const maxY = Math.max(EDGE_PADDING, vh - maxHeight - EDGE_PADDING);
        return {
            x: EDGE_PADDING + Math.random() * (maxX - EDGE_PADDING),
            y: maxY, // pinned to the lowest valid y
        };
    }, [maxWidth, maxHeight]);

    const clampToViewport = useCallback(() => {
        const el = containerRef.current;
        if (!el) return;
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const maxX = Math.max(EDGE_PADDING, vw - maxWidth - EDGE_PADDING);
        const maxY = Math.max(EDGE_PADDING, vh - maxHeight - EDGE_PADDING);
        const currentX = gsap.getProperty(el, "x");
        const currentY = gsap.getProperty(el, "y");
        gsap.set(el, {
            x: gsap.utils.clamp(EDGE_PADDING, maxX, currentX),
            y: gsap.utils.clamp(EDGE_PADDING, maxY, currentY),
        });
    }, [maxWidth, maxHeight]);

    // ORIENTATION CHANGE
    useEffect(() => {
        const updateScale = () =>
            setEffectiveScale(scale * getViewportScaleFactor());
        updateScale();

        window.addEventListener("resize", updateScale);
        return () => window.removeEventListener("resize", updateScale)
    }, [scale])

    // INIT POS
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const start = getBottomPosition(); // was getRandomPosition()
        gsap.set(el, { x: start.x, y: start.y });

        const reposition = () => {
            const { x, y } = getRandomPosition(); // subsequent moves stay random
            moveTweenRef.current?.kill();
            if (prefersReducedMotion()) {
                gsap.set(el, { x, y });
                return;
            }
            moveTweenRef.current = gsap.to(el, {
                x,
                y,
                duration: MOVE_DURATION,
                ease: "power2.inOut",
            });
        };

        moveIntervalRef.current = setInterval(reposition, MOVE_INTERVAL);
        window.addEventListener("resize", clampToViewport);

        return () => {
            clearInterval(moveIntervalRef.current);
            window.removeEventListener("resize", clampToViewport);
            moveTweenRef.current?.kill();
        };
    }, [getRandomPosition, getBottomPosition, clampToViewport]);

    // IDLE FLOAT
    useEffect(() => {
        const el = spriteWrapRef.current;
        if (!el || prefersReducedMotion()) return;

        floatTweenRef.current = gsap.to(el, {
            y: -FLOAT_RANGE,
            duration: 1.6,
            ease: "sine.inOut",
            repeat: -1,
            yoyo: true,
        });
        return () => floatTweenRef.current?.kill();
    }, [])

    const handleEnter = () => {
        setActiveKey("click_nyny");
        gsap.to(spriteWrapRef.current, {
            scale: 1.12,
            duration: 0.25,
            ease: "back.out(2)"
        })
    }
    const handleLeave = () => {
        setActiveKey("idle_nyny");
        gsap.to(spriteWrapRef.current, {
            scale: 1,
            duration: 0.25,
            ease: "power2.out"
        })
    }

    const handleActivate = (event) => {
        event.preventDefault();

        const tl = gsap.timeline({
            onComplete: () => router.push(href)
        });

        tl.to(spriteWrapRef.current, {
            scale: 0.85,
            duration: 0.12,
            ease: "power2.in"
        }).to(spriteWrapRef.current, {
            scale: 1.05,
            duration: 0.18,
            ease: "back.out(3)"
        })
    };

    return (
        <button
            ref={containerRef}
            type="button"
            onClick={handleActivate}
            onMouseEnter={handleEnter}
            onMouseLeave={handleLeave}
            onTouchStart={handleEnter}
            onTouchEnd={handleLeave}
            aria-label="Get started"
            className="fixed top-0 left-0 z-20 flex items-center justify-center
                cursor-pointer touch-manipulation bg-transparent border-none p-0
                will-change-transform focus-visible:outline-2 focus-visible:outline-brand-secondary"
            style={{ width: maxWidth, height: maxHeight }}
        >
            <div
                ref={spriteWrapRef}
                className="relative"
                style={{
                    width: activeSprite.width * (effectiveScale / 100),
                    height: activeSprite.height * (effectiveScale / 100),
                }}
            >
                <Image
                    key={activeSprite.key}
                    src={activeSprite.filePath}
                    alt=""
                    fill
                    unoptimized
                    priority
                    sizes={`${activeSprite.width}px`}
                    style={{ imageRendering: "pixelated" }}
                />
            </div>
        </button>
    );
}