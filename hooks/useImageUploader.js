"use client";

import { useCallback } from "react";

export const MAX_FILE_BYTES = 10 * 1024 * 1024; // MAX = 10MB per Images
export const MAX_IMAGES = 25;
export const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"];

const THUMB_MAX_DIMENSION = 320; // longest edge of the compressed preview
const THUMB_QUALITY = 0.6;

let uid = 0;
const nextId = () => `img_${Date.now()}_${uid++}`;

// ============== THUMBNAIL MAKER ===========
async function buildThumbnail(file) {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, THUMB_MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    const width = w;
    const height = h;

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas not supported!");

    ctx.drawImage(bitmap, 0, 0, w, h);

    const blob = await new Promise((resolve, reject) =>
        canvas.toBlob(
            (b) => (b ? resolve(b) : reject(new Error("Could not compress image"))),
            "image/jpeg",
            THUMB_QUALITY
        )
    );

    return {
        thumbUrl: URL.createObjectURL(blob),
        compressedSize: blob.size,
        width: bitmap.width,
        height: bitmap.height,
    };
}

export function useImageUploader(pushIssue) {
    const [images, setImages] = useState([]);
    const imageRef = useRef([]);
    imageRef.current = images;

    const addFiles = useCallback(
        async (incoming) => {
            const files = Array.from(incoming);
            const currentCount = imageRef.current.length;

            // FULL CASE
            if (currentCount >= MAX_IMAGES) {
                pushIssue(
                    "cap-reached",
                    `You're already holding ${MAX_IMAGES} images — the max. Remove some before adding more.`
                );
                return;
            }

            // PARTIAL OR BEFORE MAX
            const room = MAX_IMAGES - currentCount;
            let candidates = files;
            if (files.length > room) {
                candidates = files.slice(0, room);
                pushIssue(
                    "cap-partial",
                    `Only room for ${room} more — the rest were left out to stay under ${MAX_IMAGES}.`
                );
            }

            const accepted = [];
            for (const file of candidates) {
                if (!ACCEPTED_TYPES.includes(file.type)) {
                    pushIssue("invalid-type", `${file.name} isn't a supported image — skipped.`);
                    continue;
                }
                if (file.size > MAX_FILE_BYTES) {
                    pushIssue(
                        "oversize",
                        `${file.name} is ${(file.size / (1024 * 1024)).toFixed(1)}MB, over the 10MB limit — skipped.`
                    );
                    continue;
                }
                accepted.push(file);
            }

            const built = await Promise.all(
                accepted.map(async (file) => {
                    try {
                        const { thumbUrl, compressedSize, width, height } = await buildThumbnail(file);
                        return {
                            id: nextId(),
                            file,
                            previewUrl: URL.createObjectURL(file),
                            thumbUrl,
                            originalSize: file.size,
                            compressedSize,
                            width,
                            height,
                        };
                    } catch {
                        pushIssue("invalid-type", `${file.name} couldn't be read as an image — skipped.`);
                        return null;
                    }
                })
            );

            const valid = built.filter((v) => v !== null);
            if (valid.length) setImages((prev) => [...prev, ...valid]);
        },
        [pushIssue]
    );

    const removeImage = useCallback((id) => {
        setImages((prev) => {
            const target = prev.find((p) => p.id === id);
            if (target) {
                URL.revokeObjectURL(target.previewUrl);
                URL.revokeObjectURL(target.thumbUrl);
            }
            return prev.filter((p) => p.id !== id);
        });
    }, []);

    const reorder = useCallback((fromIndex, toIndex) => {
        setImages((prev) => {
            if (fromIndex === toIndex) return prev;
            const next = [...prev];
            const [moved] = next.splice(fromIndex, 1);
            next.splice(toIndex, 0, moved);
            return next;
        });
    }, []);

    return { images, addFiles, removeImage, reorder };
}