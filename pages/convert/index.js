"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AnimatedTileBg from "@/components/AnimatedTileBg";
import ImageDropzone from "@/components/ImageDropzone";
import ImageGrid from "@/components/ImageGrid";
import UploadToastStack from "@/components/UploadToastStack";
import ImageEditModal from "@/components/ImageEditModal";
import CustomSizeFields from "@/components/CustomSizeFields";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import CameraButton from "@/components/CameraButton";
import FilterBackdrop from "@/components/FilterBackdrop";
import ConversionOverlay from "@/components/ConversionOverlay";
import { useUploadIssues } from "@/hooks/useUploadIssues";
import { useImageUploader, MAX_IMAGES } from "@/hooks/useImageUploader";
import { usePageSettings } from "@/hooks/usePageSettings";
import {
    PAGE_SIZES,
    FIT_PAGE_ID,
    CUSTOM_PAGE_ID,
    CUSTOM_MIN_CM,
    CUSTOM_MAX_CM,
    resolvePageSettings,
} from "@/lib/pageSizes";
import {
    computeContainFit,
    computeFitPageSize,
    FIT_MAX_LONG_SIDE_IN,
} from "@/lib/fitToPage";
import { API_BASE_URL, apiHeaders } from "@/lib/api";
import Head from "next/head";

// Clean pdf name
function cleanPdfName(raw, fallback = "lightscanner") {
    const cleaned = String(raw ?? "")
        .replace(/\.pdf$/i, "")
        .replace(/[\\/:*?"<>|\u0000-\u001f]/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/^\.+|\.+$/g, "")
        .slice(0, 100)
        .trim();

    return cleaned || fallback;
}

function sanitizeFilename(filename, fallback = "image") {
    const base = filename?.replace(/\.[^/.]+$/, "") || fallback;

    const safe = base.replace(/[^a-zA-Z0-9_-]+/g, "_").replace(/^_+|_+$/g, "");

    return safe || fallback;
}

function buildRequestSettings(images, page) {
    const isFit = page.mode === "fit";

    return {
        pageSizeId: page.id,
        orientation: page.orientation,
        pageWidthIn: page.widthIn,
        pageHeightIn: page.heightIn,

        images: images.map((image, index) => {
            const widthPx = image.croppedWidth ?? image.width;

            const heightPx = image.croppedHeight ?? image.height;

            // Fit to page: every image gets a page of its own shape.
            // Other modes share one page size for the whole batch.
            const imagePage = isFit
                ? computeFitPageSize(widthPx, heightPx)
                : { pageWidthIn: page.widthIn, pageHeightIn: page.heightIn };

            const fit = computeContainFit(
                widthPx,
                heightPx,
                imagePage.pageWidthIn,
                imagePage.pageHeightIn,
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

                ...(isFit
                    ? {
                        pageWidthIn: imagePage.pageWidthIn,
                        pageHeightIn: imagePage.pageHeightIn,
                    }
                    : {}),
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

    const {
        pageSizeId,
        setPageSizeId,
        orientation,
        setOrientation,
        customWidthCm,
        setCustomWidthCm,
        customHeightCm,
        setCustomHeightCm,
    } = usePageSettings();

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

    const page = useMemo(
        () =>
            resolvePageSettings({
                pageSizeId,
                orientation,
                customWidthCm,
                customHeightCm,
            }),
        [pageSizeId, orientation, customWidthCm, customHeightCm],
    );

    const pageDims = { widthIn: page.widthIn, heightIn: page.heightIn };

    const pageLabel = page.label;

    const editingImage = images.find((img) => img.id === editingImageId) ?? null;

    const createConversionRequest = useCallback(
        (mode = selectedMode) => {
            const settings = buildRequestSettings(images, page);

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
        [images, page, selectedMode],
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
                        headers: apiHeaders(),
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

                setConversionPhase("naming");
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
        if (!images.length || !page.valid) return;

        setFilterOpen(true);
    };

    const handleConvert = () => {
        const request = createConversionRequest(selectedMode);

        setFilterOpen(false);

        void submitConversion(request);
    };

    const handleConfirmName = (rawName) => {
        const finalName = `${cleanPdfName(rawName)}.pdf`;

        setDownloadName(finalName);

        // Trigger the browser download (we're inside a click handler, so this is allowed).
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = finalName;
        document.body.appendChild(link);
        link.click();
        link.remove();

        setConversionPhase("success");
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
        <>
            <Head>
                Lightscanner - Convert your images into PDF! ★★彡
            </Head>
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
                                    <div className="w-full border-t-[2.5px] border-[#803c17]/30" />
                                    <div className="w-full sm:w-72">
                                        <ImageDropzone
                                            onFiles={addFiles}
                                            disabled={images.length >= MAX_IMAGES}
                                            compact
                                        />
                                    </div>

                                    <div className="w-full flex flex-col gap-3 border-t-[2.5px] border-[#803c17]/30 pt-4">
                                        <div
                                            className="w-full flex flex-col sm:flex-row items-stretch
                                        sm:items-end gap-3"
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
                                                    <option value={FIT_PAGE_ID}>Fit to page (match each image)</option>
                                                    <option value={CUSTOM_PAGE_ID}>
                                                        Custom size ({CUSTOM_MIN_CM}–{CUSTOM_MAX_CM} cm)
                                                    </option>
                                                </select>
                                            </label>

                                            {page.mode === "preset" && (
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
                                            )}

                                            <button
                                                type="button"
                                                onClick={handleOpenFilters}
                                                disabled={!page.valid}
                                                className="font-kavoon text-sm sm:self-end
                                            bg-[#803c17] text-[#f5e3ca]
                                            rounded-lg px-6 py-2.5
                                            hover:opacity-90 transition-opacity
                                            disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                NEXT
                                            </button>
                                        </div>

                                        {page.mode === "fit" && (
                                            <p className="text-[11px] text-[#803c17]/70 text-left">
                                                Each page takes the shape of its image, scaled to roughly A4 size
                                                (longest side capped at {(FIT_MAX_LONG_SIDE_IN * 2.54).toFixed(0)} cm).
                                            </p>
                                        )}

                                        {page.mode === "custom" && (
                                            <CustomSizeFields
                                                widthCm={customWidthCm}
                                                heightCm={customHeightCm}
                                                onWidthChange={setCustomWidthCm}
                                                onHeightChange={setCustomHeightCm}
                                            />
                                        )}
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
                    defaultName={downloadName.replace(/\.pdf$/i, "")}
                    onConfirmName={handleConfirmName}
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
                            fitToPage={page.mode === "fit"}
                            pushIssue={pushIssue}
                            onSave={(id, payload) => updateImageCrop(id, payload)}
                            onRemove={removeImage}
                            onClose={() => setEditingImageId(null)}
                        />
                    </ErrorBoundary>
                )}
            </div>
        </>
    );
}