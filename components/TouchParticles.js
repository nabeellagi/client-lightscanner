"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

export const TOUCH_PARTICLES = {
    BURST_COUNT: 7, // particles per tap / click
    DRAG_COUNT: 1, // particles per trail tick while dragging
    DRAG_INTERVAL_MS: 70, // time between trail ticks (higher = fewer particles)
    MAX_ACTIVE: 60, // hard cap on particles alive at once (keeps phones smooth)

    SIZE_PX: [10, 20], // [min, max] glyph size
    SPREAD_PX: 14, // random jitter around the touch point
    FALL_PX: [160, 340], // [min, max] distance they fall
    DRIFT_PX: 60, // max sideways drift (left or right)
    SPIN_DEG: 300, // max rotation while falling (either direction)
    DURATION_S: [1.0, 1.9], // [min, max] fall time in seconds

    GLYPHS: ["★", "✦", "●", "◆"],
    COLORS: ["#803c17", "#f0b93a", "#ff6b6b", "#b98cff", "#ffd84d", "#fff3dc"],

    Z_INDEX: 100, // above modals (they use 60-80); pointer events pass straight through

    IGNORE_SELECTOR: "input, textarea, select, [contenteditable='true'], .reactEasyCrop_Container",
    RESPECT_REDUCED_MOTION: true,
};

const rand = (min, max) => min + Math.random() * (max - min);
const pick = (list) => list[Math.floor(Math.random() * list.length)];

export default function TouchParticles() {
    const layerRef = useRef(null);

    useEffect(() => {
        const layer = layerRef.current;
        if (!layer) return;

        const cfg = TOUCH_PARTICLES;

        if (cfg.RESPECT_REDUCED_MOTION && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            return;
        }

        const pool = []; // idle elements, reused so we don't keep creating DOM nodes
        const timelines = new Set();
        let active = 0;
        let lastTrailAt = 0;

        const createEl = () => {
            const el = document.createElement("span");
            Object.assign(el.style, {
                position: "absolute",
                left: "0",
                top: "0",
                display: "none",
                lineHeight: "1",
                userSelect: "none",
                pointerEvents: "none",
                willChange: "transform, opacity",
            });
            layer.appendChild(el);
            return el;
        };

        const spawn = (clientX, clientY) => {
            if (active >= cfg.MAX_ACTIVE) return;

            const el = pool.pop() ?? createEl();
            active += 1;

            const startX = clientX + rand(-cfg.SPREAD_PX, cfg.SPREAD_PX);
            const startY = clientY + rand(-cfg.SPREAD_PX, cfg.SPREAD_PX);
            const duration = rand(cfg.DURATION_S[0], cfg.DURATION_S[1]);
            const startRotation = rand(-180, 180);

            el.textContent = pick(cfg.GLYPHS);

            gsap.set(el, {
                display: "block",
                x: startX,
                y: startY,
                xPercent: -50,
                yPercent: -50,
                scale: 0,
                opacity: 1,
                rotation: startRotation,
                color: pick(cfg.COLORS),
                fontSize: rand(cfg.SIZE_PX[0], cfg.SIZE_PX[1]),
            });

            const tl = gsap.timeline({
                onComplete: () => {
                    timelines.delete(tl);
                    gsap.set(el, { display: "none" });
                    pool.push(el);
                    active -= 1;
                },
            });
            timelines.add(tl);

            tl.to(el, { scale: 1, duration: 0.15, ease: "back.out(2)" }, 0)
                .to(
                    el,
                    {
                        x: startX + rand(-cfg.DRIFT_PX, cfg.DRIFT_PX),
                        y: startY + rand(cfg.FALL_PX[0], cfg.FALL_PX[1]),
                        rotation: startRotation + rand(-cfg.SPIN_DEG, cfg.SPIN_DEG),
                        duration,
                        ease: "power2.in", // accelerates like gravity
                    },
                    0.05
                )
                .to(el, { opacity: 0, duration: duration * 0.4, ease: "power1.in" }, 0.05 + duration * 0.6);
        };

        const emit = (x, y, count) => {
            for (let i = 0; i < count; i += 1) spawn(x, y);
        };

        const ignored = (target) => target instanceof Element && target.closest(cfg.IGNORE_SELECTOR);

        const onPointerDown = (e) => {
            if (!e.isPrimary || ignored(e.target)) return;

            lastTrailAt = performance.now();
            emit(e.clientX, e.clientY, cfg.BURST_COUNT);
        };

        const onPointerMove = (e) => {
            // buttons === 0 -> plain hover, not pressing/touching
            if (!e.isPrimary || e.buttons === 0 || ignored(e.target)) return;

            const now = performance.now();
            if (now - lastTrailAt < cfg.DRAG_INTERVAL_MS) return;

            lastTrailAt = now;
            emit(e.clientX, e.clientY, cfg.DRAG_COUNT);
        };

        window.addEventListener("pointerdown", onPointerDown, { passive: true });
        window.addEventListener("pointermove", onPointerMove, { passive: true });

        return () => {
            window.removeEventListener("pointerdown", onPointerDown);
            window.removeEventListener("pointermove", onPointerMove);

            timelines.forEach((tl) => tl.kill());
            timelines.clear();
            layer.replaceChildren();
        };
    }, []);

    return (
        <div
            ref={layerRef}
            aria-hidden="true"
            className="pointer-events-none fixed inset-0 overflow-hidden"
            style={{ zIndex: TOUCH_PARTICLES.Z_INDEX }}
        />
    );
}