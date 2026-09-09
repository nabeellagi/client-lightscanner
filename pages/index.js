import gsap from "gsap";
import { useEffect, useRef } from "react";
import AnimatedTileBg from "@/components/AnimatedTileBg";
import StartNyny from "@/components/startNyny";

export default function Home() {
  const titleRef = useRef(null);
  const highlightRefs = useRef([]);

  useEffect(() => {
    const letters = titleRef.current.querySelectorAll(".letter");

    gsap.to(letters, {
      y: -20 * (window.innerWidth / 1440),
      rotation: () => gsap.utils.random(-8, 6),
      duration: () => gsap.utils.random(0.4, 0.7),
      ease: "sine.inOut",
      stagger: {
        each: 0.07,
        repeat: -1,
        yoyo: true,
      },
    });

    const highlights = highlightRefs.current;

    gsap.fromTo(
      highlights,
      {
        backgroundSize: "0% 100%",
        color: "#ffffff",
      },
      {
        backgroundSize: "100% 100%",
        duration: 0.8,
        ease: "power2.out",
        stagger: 0.25,
        delay: 0.5,
      }
    );

    return () => {
      gsap.killTweensOf(letters);
      gsap.killTweensOf(highlights);
    };
  }, []);

  return (
    <div className="relative min-h-screen w-full overflow-hidden">

      <AnimatedTileBg
        scale={23}
        speed={40}
        fileName="/bgs/checker1.png"
      />

      <main
        className="relative z-10 min-h-screen w-full flex flex-col items-center justify-center  
        text-brand-primary p-4 sm:p-8 text-center"
      >
        <h1
          ref={titleRef}
          className="text-4xl sm:text-7xl md:text-8xl font-kavoon leading-snug tracking-widest"
          aria-label="LightScanner"
        >
          {"LightScanner".split("").map((letter, index) => (
            <span
              key={index}
              className="letter inline-block"
            >
              {letter}
            </span>
          ))}
        </h1>
        <h4 className="text-xl sm:text-3xl md:text-4xl font-melody">
          Click the character to get started
        </h4>

        <h4 className="text-2xl sm:text-5xl md:text-6xl font-melody leading-normal">
          Capture. Upload. Convert
        </h4>


        <h4 className="text-lg sm:text-2xl font-indie leading-normal tracking-wide">
          Convert{" "}
          <span
            ref={(el) => (highlightRefs.current[0] = el)}
            className=" highlight text-brand-secondary bg-linear-to-r from-brand-secondary to-brand-secondary
            bg-no-repeat px-2 py-1 rounded-sm"
          >
            Images
          </span>{" "}
          into{" "}
          <span
            ref={(el) => (highlightRefs.current[1] = el)}
            className="highlight text-brand-secondary bg-linear-to-r from-brand-secondary to-brand-secondary
            bg-no-repeat px-2 py-1 rounded-sm"
          >
            PDF
          </span>{" "}
          file
        </h4>
        <div className="h-[10vw]"/>

        <StartNyny
          scale={50}
          href="/convert"
        />
      </main>
    </div>
  );
}