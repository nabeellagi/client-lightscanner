"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import AnimatedTileBg from "@/components/AnimatedTileBg";
import ImageDropzone from "@/components/ImageDropzone";
import ImageGrid from "@/components/ImageGrid";
import UploadToastStack from "@/components/UploadToastStack";
import ImageEditModal from "@/components/ImageEditModal";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import CameraButton from "@/components/CameraButton";
import FilterBackdrop from "@/components/FilterBackdrop";
import ConversionOverlay from "@/components/ConversionOverlay";
import { useUploadIssues } from "@/hooks/useUploadIssues";
import { useImageUploader, MAX_IMAGES } from "@/hooks/useImageUploader";
import { usePageSettings } from "@/hooks/usePageSettings";
import {
    PAGE_SIZES,
    getPageSizeById,
    orientedDimensions,
} from "@/lib/pageSizes";
import { computeContainFit } from "@/lib/fitToPage";
import { API_BASE_URL } from "@/lib/api";

function sanitizeFilename(filename, fallback = "image") {
    const base = filename?.replace(/\.[^/.]+$/, "") || fallback;

    const safe = base.replace(/[^a-zA-Z0-9_-]+/g, "_").replace(/^_+|_+$/g, "");

    return safe || fallback;
}

function buildRequestSettings(images, pageSizeId, orientation) {
    const pageSize = getPageSizeById(pageSizeId);
    const pageDims = orientedDimensions(pageSize, orientation);

    return {
        pageSizeId,
        orientation,
        pageWidthIn: pageDims.widthIn,
        pageHeightIn: pageDims.heightIn,

        images: images.map((image, index) => {
            const widthPx = image.croppedWidth ?? image.width;

            const heightPx = image.croppedHeight ?? image.height;

            const fit = computeContainFit(
                widthPx,
                heightPx,
                pageDims.widthIn,
                pageDims.heightIn,
            );

            return {
                index,
                filename: image.file.name,

                widthPx,
                heightPx,

                renderedWidthIn: fit.renderedWidthIn,

                renderedHeightIn: fit.renderedHeightIn,

                marginXIn: fit.marginXIn,

                marginYIn: fit.marginYIn,
            };
        }),
    };
}

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

    const [filterOpen, setFilterOpen] = useState(false);

    const [selectedMode, setSelectedMode] = useState("normal");

    const [conversionPhase, setConversionPhase] = useState(null);

    const [conversionError, setConversionError] = useState("");

    const [downloadUrl, setDownloadUrl] = useState(null);

    const [downloadName, setDownloadName] = useState("lightscanner.pdf");

    const lastRequestRef = useRef(null);

    useEffect(() => {
        document.title = phase.title;
    }, [phase.title]);

    useEffect(() => {
        return () => {
            if (downloadUrl) {
                URL.revokeObjectURL(downloadUrl);
            }
        };
    }, [downloadUrl]);

    const tabLabel = images.length ? `${images.length}/${MAX_IMAGES}` : "Upload";

    const pageDims = orientedDimensions(getPageSizeById(pageSizeId), orientation);

    const pageLabel = `${getPageSizeById(pageSizeId).label} · ${orientation}`;

    const editingImage = images.find((img) => img.id === editingImageId) ?? null;

    const createConversionRequest = useCallback(
        (mode = selectedMode) => {
            const settings = buildRequestSettings(images, pageSizeId, orientation);

            const files = images.map((image, index) => {
                const source = image.conversionBlob ?? image.file;

                const originalName = sanitizeFilename(
                    image.file.name,
                    `image_${index + 1}`,
                );

                return {
                    file: source,

                    filename: `${String(index + 1).padStart(2, "0")}-${originalName}${image.conversionBlob ? ".jpg" : ""
                        }`,
                };
            });

            return {
                mode,
                settings,
                files,
            };
        },
        [images, pageSizeId, orientation, selectedMode],
    );

    const submitConversion = useCallback(
        async (request) => {
            setConversionPhase("loading");
            setConversionError("");

            if (downloadUrl) {
                URL.revokeObjectURL(downloadUrl);
                setDownloadUrl(null);
            }

            lastRequestRef.current = request;

            const formData = new FormData();

            formData.append("settings", JSON.stringify(request.settings));

            for (const item of request.files) {
                formData.append("files", item.file, item.filename);
            }

            try {
                const response = await fetch(
                    `${API_BASE_URL}/mode/${encodeURIComponent(request.mode)}`,
                    {
                        method: "POST",
                        body: formData,
                    },
                );

                if (!response.ok) {
                    let message = "The API could not create the PDF.";

                    try {
                        const payload = await response.json();

                        if (typeof payload.detail === "string") {
                            message = payload.detail;
                        }
                    } catch {
                        // Keep fallback error.
                    }

                    throw new Error(message);
                }

                const blob = await response.blob();

                if (!blob.size || (blob.type && blob.type !== "application/pdf")) {
                    throw new Error("The API returned an invalid PDF file.");
                }

                const url = URL.createObjectURL(blob);

                setDownloadUrl(url);

                setDownloadName(`lightscanner-${request.mode}.pdf`);

                setConversionPhase("success");
            } catch (error) {
                console.error("PDF conversion failed:", error);

                setConversionError(
                    error instanceof Error
                        ? error.message
                        : "Something went wrong while creating your PDF.",
                );

                setConversionPhase("error");
            }
        },
        [downloadUrl],
    );

    const handleOpenFilters = () => {
        if (!images.length) return;

        setFilterOpen(true);
    };

    const handleConvert = () => {
        const request = createConversionRequest(selectedMode);

        setFilterOpen(false);

        void submitConversion(request);
    };

    const handleRetry = () => {
        if (!lastRequestRef.current) return;

        void submitConversion(lastRequestRef.current);
    };

    const handleCloseConversion = () => {
        if (downloadUrl) {
            URL.revokeObjectURL(downloadUrl);

            setDownloadUrl(null);
        }

        setConversionPhase(null);
        setConversionError("");
    };

    return (
        <div className="relative min-h-screen w-full overflow-hidden">
            <AnimatedTileBg scale={30} speed={25} fileName="/bgs/checker1.png" />

            <main
                className="relative z-10 min-h-screen w-full flex flex-col items-center justify-center
                text-brand-primary p-4 sm:p-8 text-center"
            >
                <div className="relative w-full flex flex-col items-center">
                    <div
                        className="relative z-0 bg-[#f5e3ca] border-[#803c17] border-[3.5px]
                        rounded-t-2xl w-[70vw] sm:w-[40vw] h-[8vh]
                        mt-8 flex flex-col items-center justify-center translate-y-2"
                    >
                        <h3 className="font-kavoon text-lg sm:text-2xl">
                            ᯓ★★{tabLabel} ★★彡
                        </h3>
                    </div>

                    <div
                        className="relative z-10 bg-[#f5e3ca] border-[#803c17] border-[3.5px]
                        rounded-xl w-[80vw] h-[85vh]
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

                                <div
                                    className="w-full flex flex-col sm:flex-row items-stretch
                                    sm:items-end gap-3 border-t-[2.5px]
                                    border-[#803c17]/30 pt-4"
                                >
                                    <label className="flex-1 flex flex-col gap-1 text-left">
                                        <span className="font-kavoon text-xs text-[#803c17]">
                                            Page size
                                        </span>

                                        <select
                                            value={pageSizeId}
                                            onChange={(e) => setPageSizeId(e.target.value)}
                                            className="bg-white border-[2px] border-[#803c17]
                                            rounded-lg px-3 py-2 text-sm text-[#4a2410]
                                            focus:outline-none focus:ring-2 focus:ring-[#803c17]/40"
                                        >
                                            {PAGE_SIZES.map((size) => (
                                                <option key={size.id} value={size.id}>
                                                    {size.label} ({size.widthIn}
                                                    &quot;
                                                    {" × "}
                                                    {size.heightIn}
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
                                        onClick={handleOpenFilters}
                                        className="font-kavoon text-sm sm:self-end
                                        bg-[#803c17] text-[#f5e3ca]
                                        rounded-lg px-6 py-2.5
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

            <FilterBackdrop
                isOpen={filterOpen}
                selectedMode={selectedMode}
                onSelect={setSelectedMode}
                onClose={() => setFilterOpen(false)}
                onConvert={handleConvert}
                imageCount={images.length}
                pageLabel={pageLabel}
            />

            <ConversionOverlay
                phase={conversionPhase}
                errorMessage={conversionError}
                downloadUrl={downloadUrl}
                downloadName={downloadName}
                onRetry={handleRetry}
                onClose={handleCloseConversion}
            />

            {editingImage && (
                <ErrorBoundary
                    onError={() =>
                        pushIssue("crop-failed", "Something went wrong with that image.")
                    }
                    fallback={(reset) => (
                        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
                            <div
                                className="bg-[#f5e3ca] border-[#803c17] border-[3.5px]
                                rounded-2xl w-full sm:max-w-sm p-5 flex flex-col
                                items-center gap-4 text-center"
                            >
                                <p className="font-kavoon text-sm text-[#803c17]">
                                    Something went wrong with this image.
                                </p>

                                <p className="text-xs text-[#803c17]/70">
                                    Nothing else you've added is affected. You can try opening it
                                    again or remove it.
                                </p>

                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={reset}
                                        className="rounded-lg border-[2px] border-[#803c17]
                                        text-[#803c17] px-4 py-2
                                        text-sm font-kavoon"
                                    >
                                        Try again
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            removeImage(editingImage.id);

                                            setEditingImageId(null);
                                        }}
                                        className="rounded-lg bg-[#803c17]
                                        text-[#f5e3ca] px-4 py-2
                                        text-sm font-kavoon"
                                    >
                                        Remove image
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                >
                    <ImageEditModal
                        image={editingImage}
                        pageWidthIn={pageDims.widthIn}
                        pageHeightIn={pageDims.heightIn}
                        pushIssue={pushIssue}
                        onSave={(id, payload) => updateImageCrop(id, payload)}
                        onRemove={removeImage}
                        onClose={() => setEditingImageId(null)}
                    />
                </ErrorBoundary>
            )}
        </div>
    );
}
