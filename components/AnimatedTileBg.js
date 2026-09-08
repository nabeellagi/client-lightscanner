"use client"

import { useEffect, useRef } from "react"
import gsap from "gsap";

export default function AnimatedTileBg({
    scale = 20,
    speed = 40,
    fileName = 'filename'
}){
    const wrapperRef = useRef(null);
    const tileRef = useRef(null);

    useEffect(() => {
        const wrapper = wrapperRef.current;
        const tile = tileRef.current;

        if(!wrapper || !tile) return;

        const reduceMotionQuery = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        )

        const image = new window.Image();

        let animation;

        const setupAnimation = () => {
            const originalWidth = image.naturalWidth;
            const originalHeight = image.naturalHeight;

            if(!originalWidth || !originalHeight) return null;

            const tileWidth = originalWidth * (scale/100);
            const tileHeight = originalHeight  * (scale/100);

            gsap.set(tile, {
                top: -tileHeight,
                left: -tileWidth,
                right: -tileWidth,
                bottom: -tileHeight,
                backgroundSize: `${tileWidth}px ${tileHeight}px`,
                x: 0,
                y: 0,
                force3D: true
            })

            if (reduceMotionQuery.matches) return null;

            const distance = Math.hypot(tileWidth, tileHeight);
            const duration = distance / speed;

            return gsap.to(tile, {
                x: -tileWidth,
                y: -tileHeight,
                duration,
                ease: "none",
                repeat: -1
            })
        }

        image.onload = () => {
            animation = setupAnimation()
        }

        image.src = fileName;
        if(image.complete){
            animation = setupAnimation();
        }

        // OS FLIP
        const handleMotionPrefChange = () => {
            animation?.kill();
            animation = setupAnimation();
        };
        reduceMotionQuery.addEventListener("change", handleMotionPrefChange);

        return () => {
            image.onload = null;
            reduceMotionQuery.removeEventListener(
                "change",
                handleMotionPrefChange
            );
            animation?.kill();
        };
    }, [scale, speed, fileName])

    return (
         <div
            ref={wrapperRef}
            aria-hidden="true"
            className="fixed inset-0 z-0 pointer-events-none overflow-hidden"
        >
            <div
                ref={tileRef}
                className="absolute will-change-transform [backface-visibility:hidden] [background-repeat:repeat]"
                style={{ backgroundImage: `url("${fileName}")` }}
            />
        </div>
    );
}