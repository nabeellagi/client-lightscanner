"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";

export default function ConversionOverlay({
    phase,
    errorMessage,
    downloadUrl,
    downloadName,
    onRetry,
    onClose,
}) {
    const backdropRef = useRef(null);
    const panelRef = useRef(null);

    useEffect(() => {
        if (!phase) return;

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
                    y: 35,
                    scale: 0.96,
                },
                {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    duration: 0.4,
                    ease: "back.out(1.5)",
                }
            );
        });

        return () => ctx.revert();
    }, [phase]);

    if (!phase) return null;

    const isLoading = phase === "loading";
    const isError = phase === "error";
    const isSuccess = phase === "success";

    return (
        <div
            ref={backdropRef}
            className="fixed inset-0 z-80 bg-black/55 flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
            <div
                ref={panelRef}
                className="bg-[#f5e3ca] border-[#803c17] border-t-[3.5px] sm:border-[3.5px]
                rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md p-5 sm:p-6 text-center
                shadow-[5px_5px_0_rgba(128,60,23,0.28)]"
            >
                {isLoading && (
                    <>
                        <div className="relative w-28 h-28 mx-auto mb-4">
                            <Image
                                src="/ocs/nyny-upload.png"
                                alt=""
                                fill
                                unoptimized
                                priority
                                style={{
                                    objectFit: "contain",
                                    imageRendering: "pixelated",
                                }}
                            />
                        </div>

                        <div className="w-8 h-8 mx-auto mb-3 rounded-full border-[3px] border-[#803c17]/25 border-t-[#803c17] animate-spin" />

                        <h4 className="font-kavoon text-lg text-[#803c17]">
                            Making your PDF…
                        </h4>

                        <p className="text-sm text-[#803c17]/70 mt-1">
                            LightScanner is processing your pages and filters.
                        </p>
                    </>
                )}

                {isError && (
                    <>
                        <div className="text-5xl mb-3" aria-hidden="true">
                            ☁
                        </div>

                        <h4 className="font-kavoon text-lg text-[#803c17]">
                            The conversion hit a bump.
                        </h4>

                        <p className="text-sm text-[#803c17]/70 mt-2 leading-snug">
                            {errorMessage ||
                                "Something went wrong while creating your PDF. Nothing has been removed from your upload."}
                        </p>

                        <div className="flex gap-2 mt-5">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 rounded-lg border-[2px] border-[#803c17] text-[#803c17] py-2.5 text-sm font-kavoon"
                            >
                                Back
                            </button>

                            <button
                                type="button"
                                onClick={onRetry}
                                className="flex-1 rounded-lg bg-[#803c17] text-[#f5e3ca] py-2.5 text-sm font-kavoon"
                            >
                                Retry
                            </button>
                        </div>
                    </>
                )}

                {isSuccess && (
                    <>
                        <div className="relative w-28 h-28 mx-auto mb-4">
                            <Image
                                src="/ocs/nyny-upload.png"
                                alt=""
                                fill
                                unoptimized
                                style={{
                                    objectFit: "contain",
                                    imageRendering: "pixelated",
                                }}
                            />
                        </div>

                        <h4 className="font-kavoon text-xl text-[#803c17]">
                            Your file is ready to download!
                        </h4>

                        <p className="text-xs text-[#803c17]/65 mt-1 truncate px-3">
                            {downloadName}
                        </p>

                        <a
                            href={downloadUrl}
                            download={downloadName}
                            className="mt-5 block w-full rounded-lg bg-[#803c17] text-[#f5e3ca] py-2.5 text-sm font-kavoon hover:opacity-90 transition-opacity"
                        >
                            DOWNLOAD PDF
                        </a>

                        <button
                            type="button"
                            onClick={onClose}
                            className="mt-2 text-xs text-[#803c17]/60 underline underline-offset-2"
                        >
                            Done
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}