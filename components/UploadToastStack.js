"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

const DEFAULT_ACCENT = { color: "#803c17", label: "Notice" };

const ACCENTS = {
  oversize: { color: "#b23a2f", label: "Too heavy" },
  "invalid-type": { color: "#7a4b9d", label: "Not an image" },
  "cap-reached": { color: "#803c17", label: "At the limit" },
  "cap-partial": { color: "#803c17", label: "Some left out" },
  "crop-failed": { color: "#b23a2f", label: "Couldn't save" },
};

function Toast({ issue, onDismiss }) {
  const rootRef = useRef(null);
  const barRef = useRef(null);
  const closingRef = useRef(false);

  const requestClose = () => {
    if (closingRef.current) return;
    closingRef.current = true;
    const el = rootRef.current;
    if (!el) {
      onDismiss(issue.id);
      return;
    }
    gsap.to(el, {
      opacity: 0,
      y: -14,
      scale: 0.95,
      duration: 0.3,
      ease: "power2.in",
      onComplete: () => onDismiss(issue.id),
    });
  };

  useEffect(() => {
    const el = rootRef.current;
    const bar = barRef.current;
    if (!el || !bar) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { opacity: 0, y: 26, scale: 0.9 },
        { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: "back.out(1.7)" }
      );
      gsap.fromTo(bar, { scaleX: 1 }, { scaleX: 0, duration: 4.2, ease: "none", transformOrigin: "left" });
    }, rootRef);

    const timer = setTimeout(requestClose, 4200);

    return () => {
      clearTimeout(timer);
      ctx.revert();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const accent = ACCENTS[issue.type] ?? DEFAULT_ACCENT;

  return (
    <div
      ref={rootRef}
      className="pointer-events-auto relative w-72 sm:w-80 bg-[#f5e3ca] border-[3px] border-[#803c17] rounded-xl
        shadow-[3px_3px_0_rgba(128,60,23,0.35)] overflow-hidden"
    >
      <div className="flex items-start gap-3 p-3">
        <span className="mt-1 shrink-0 w-2.5 h-2.5 rounded-full" style={{ backgroundColor: accent.color }} />
        <div className="flex-1 text-left">
          <p className="font-kavoon text-xs" style={{ color: accent.color }}>
            {accent.label}
          </p>
          <p className="text-sm text-[#4a2410] leading-snug mt-0.5">{issue.message}</p>
        </div>
        <button
          onClick={requestClose}
          className="text-[#803c17]/50 hover:text-[#803c17] text-sm leading-none px-1"
          aria-label="Dismiss notification"
        >
          ✕
        </button>
      </div>
      <div className="h-1 bg-[#803c17]/15">
        <div ref={barRef} className="h-full origin-left" style={{ backgroundColor: accent.color }} />
      </div>
    </div>
  );
}

export default function UploadToastStack({ issues, onDismiss }) {
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-100 flex flex-col-reverse gap-2">
      {issues.map((issue) => (
        <Toast key={issue.id} issue={issue} onDismiss={onDismiss} />
      ))}
    </div>
  );
}