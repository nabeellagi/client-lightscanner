import gsap from "gsap";
import { useEffect, useRef } from "react";
import AnimatedTileBg from "@/components/AnimatedTileBg";

export default function Convert() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <AnimatedTileBg scale={30} speed={25} fileName="/bgs/checker1.png" />
      <main
        className="relative z-10 min-h-screen w-full flex flex-col items-center justify-center  
                text-brand-primary p-4 sm:p-8 text-center"
      >
        <div className="bg-[#ffcc83] border-[#803c17] border-4 rounded-xl w-[80vw] h-[85vh] rotate-1">
            <div>

            </div>
            <div>
                
            </div>
        </div>
      </main>
    </div>
  );
}
