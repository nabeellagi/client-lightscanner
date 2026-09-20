"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ACCEPTED_TYPES, MAX_IMAGES } from "@/hooks/useImageUploader";

export default function CameraButton({ onFiles, disabled }) {
  const inputRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    gsap.fromTo(
      buttonRef.current,
      { scale: 0, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.4, ease: "back.out(1.8)", delay: 0.15 }
    );
  }, []);

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        capture="environment"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) onFiles(e.target.files);
          e.target.value = ""; // allow capturing another shot right away
        }}
      />

      <button
        ref={buttonRef}
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
        aria-label={disabled ? `Camera unavailable — ${MAX_IMAGES} image limit reached` : "Take a photo"}
        className={`sm:hidden fixed bottom-6 right-5 z-40 w-14 h-14 rounded-full border-[3px] border-[#803c17]
          flex items-center justify-center shadow-[0_4px_14px_rgba(0,0,0,0.35)] transition-transform
          ${disabled ? "bg-[#f5e3ca]/60 opacity-50 cursor-not-allowed" : "bg-[#803c17] active:scale-90"}`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke={disabled ? "#803c17" : "#f5e3ca"}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-6 h-6"
        >
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
          <circle cx="12" cy="13" r="4" />
        </svg>
      </button>
    </>
  );
}