import gsap from "gsap";
import { useEffect, useRef, useState } from "react";
import AnimatedTileBg from "@/components/AnimatedTileBg";
import Image from "next/image";

export default function Convert() {
    const [phase, setPhase] = useState({
        title: "LightScanner - Drag and Drop your Images",
        tab: "Upload"
    })
    return (
        <div className="relative min-h-screen w-full overflow-hidden">
            <title>{phase.title}</title>
            <AnimatedTileBg scale={30} speed={25} fileName="/bgs/checker1.png" />
            <main
                className="relative z-10 min-h-screen w-full flex flex-col items-center justify-center  
                text-brand-primary p-4 sm:p-8 text-center"
            >
                <div className="relative w-full flex flex-col items-center">
                    <div className="relative z-0 bg-[#f5e3ca] border-[#803c17] border-[3.5px] rounded-t-2xl w-[70vw] sm:w-[40vw] h-[8vh]
                    mt-8 flex flex-col items-center justify-center
                    translate-y-2">
                        <h3 className="font-kavoon text-lg sm:text-2xl">
                            ᯓ★★{phase.tab} ★★彡
                        </h3>
                    </div>
                    <div className="relative z-10 bg-[#f5e3ca] border-[#803c17] border-[3.5px] rounded-xl w-[80vw] h-[85vh]
                    flex-col items-center justify-center">
                        <div
                            className="relative
                            w-[70%]
                            sm:w-[50%]
                            md:w-[35%]
                            lg:w-[25%]"
                            style={{
                                aspectRatio: "1080 / 900",
                            }}
                        >
                            <Image
                                src="/ocs/nyny-upload.png"
                                alt=""
                                fill
                                unoptimized
                                priority
                                style={{
                                    imageRendering: "pixelated",
                                    objectFit: "contain",
                                }}
                            />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
