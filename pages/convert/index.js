"use client";

import { useEffect, useState } from "react";
import AnimatedTileBg from "@/components/AnimatedTileBg";
import ImageDropzone from "@/components/ImageDropzone";
import ImageGrid from "@/components/ImageGrid";
import UploadToastStack from "@/components/UploadToastStack";
import ImageEditModal from "@/components/ImageEditModal";
import CameraButton from "@/components/CameraButton";
import { useUploadIssues } from "@/hooks/useUploadIssues";
import { useImageUploader, MAX_IMAGES } from "@/hooks/useImageUploader";
import { usePageSettings } from "@/hooks/usePageSettings";
import {
    PAGE_SIZES,
    getPageSizeById,
    orientedDimensions,
} from "@/lib/pageSizes";

export default function Convert() {
    const [phase] = useState({
        title: "LightScanner - Drag and Drop your Images",
    });

    const { issues, pushIssue, dismissIssue } = useUploadIssues();
    const { images, addFiles, removeImage, reorder, updateImageCrop } =
        useImageUploader(pushIssue);
    const { pageSizeId, setPageSizeId, orientation, setOrientation } =
        usePageSettings();
    const [editingImageId, setEditingImageId] = useState(null);

    useEffect(() => {
        document.title = phase.title;
    }, [phase.title]);

    const tabLabel = images.length ? `${images.length}/${MAX_IMAGES}` : "Upload";
    const pageDims = orientedDimensions(getPageSizeById(pageSizeId), orientation);
    const editingImage = images.find((img) => img.id === editingImageId) ?? null;

    return (
        <div className="relative min-h-screen w-full overflow-hidden">
            <AnimatedTileBg scale={30} speed={25} fileName="/bgs/checker1.png" />

            <main
                className="relative z-10 min-h-screen w-full flex flex-col items-center justify-center
        text-brand-primary p-4 sm:p-8 text-center"
            >
                <div className="relative w-full flex flex-col items-center">
                    <div
                        className="relative z-0 bg-[#f5e3ca] border-[#803c17] border-[3.5px] rounded-t-2xl w-[70vw] sm:w-[40vw] h-[8vh]
            mt-8 flex flex-col items-center justify-center translate-y-2"
                    >
                        <h3 className="font-kavoon text-lg sm:text-2xl">
                            ᯓ★★{tabLabel} ★★彡
                        </h3>
                    </div>

                    <div
                        className="relative z-10 bg-[#f5e3ca] border-[#803c17] border-[3.5px] rounded-xl w-[80vw] h-[85vh]
            flex flex-col items-center gap-4 p-4 sm:p-6 overflow-y-auto"
                    >
                        {images.length === 0 ? (
                            <ImageDropzone
                                onFiles={addFiles}
                                disabled={images.length >= MAX_IMAGES}
                            />
                        ) : (
                            <>
                                <div className="w-full flex-1 overflow-y-auto pr-1">
                                    <ImageGrid
                                        images={images}
                                        onReorder={reorder}
                                        onRemove={removeImage}
                                        onEdit={setEditingImageId}
                                    />
                                </div>

                                <div className="w-full sm:w-72">
                                    <ImageDropzone
                                        onFiles={addFiles}
                                        disabled={images.length >= MAX_IMAGES}
                                        compact
                                    />
                                </div>

                                <div className="w-full flex flex-col sm:flex-row items-stretch sm:items-end gap-3 border-t-[2.5px] border-[#803c17]/30 pt-4">
                                    <label className="flex-1 flex flex-col gap-1 text-left">
                                        <span className="font-kavoon text-xs text-[#803c17]">
                                            Page size
                                        </span>
                                        <select
                                            value={pageSizeId}
                                            onChange={(e) => setPageSizeId(e.target.value)}
                                            className="bg-white border-[2px] border-[#803c17] rounded-lg px-3 py-2 text-sm text-[#4a2410]
                        focus:outline-none focus:ring-2 focus:ring-[#803c17]/40"
                                        >
                                            {PAGE_SIZES.map((size) => (
                                                <option key={size.id} value={size.id}>
                                                    {size.label} ({size.widthIn}&quot; × {size.heightIn}
                                                    &quot;)
                                                </option>
                                            ))}
                                        </select>
                                    </label>

                                    <div className="flex flex-col gap-1 text-left">
                                        <span className="font-kavoon text-xs text-[#803c17]">
                                            Orientation
                                        </span>
                                        <div className="flex rounded-lg border-[2px] border-[#803c17] overflow-hidden">
                                            {["portrait", "landscape"].map((option) => (
                                                <button
                                                    key={option}
                                                    type="button"
                                                    onClick={() => setOrientation(option)}
                                                    className={`px-3 py-2 text-sm capitalize transition-colors ${orientation === option
                                                            ? "bg-[#803c17] text-[#f5e3ca]"
                                                            : "bg-white text-[#803c17]"
                                                        }`}
                                                >
                                                    {option}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            //
                                        }}
                                        className="font-kavoon text-sm sm:self-end bg-[#803c17] text-[#f5e3ca] rounded-lg px-6 py-2.5
                      hover:opacity-90 transition-opacity"
                                    >
                                        NEXT
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </main>

            <CameraButton onFiles={addFiles} disabled={images.length >= MAX_IMAGES} />

            <UploadToastStack issues={issues} onDismiss={dismissIssue} />

            {editingImage && (
                <ImageEditModal
                    image={editingImage}
                    pageWidthIn={pageDims.widthIn}
                    pageHeightIn={pageDims.heightIn}
                    pushIssue={pushIssue}
                    onSave={(id, payload) => updateImageCrop(id, payload)}
                    onClose={() => setEditingImageId(null)}
                />
            )}
        </div>
    );
}
