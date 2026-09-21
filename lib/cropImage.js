function loadImageElement(src) {
    return new Promise((resolve, reject) => {
        const img = new window.Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("Could not load image for cropping."));
        img.src = src;
    });
}

async function cropViaBitmap(file, cropPixels, outW, outH) {
    const bitmap = await createImageBitmap(
        file,
        Math.round(cropPixels.x),
        Math.round(cropPixels.y),
        Math.round(cropPixels.width),
        Math.round(cropPixels.height),
        { resizeWidth: outW, resizeHeight: outH, resizeQuality: "high", imageOrientation: "from-image" }
    );

    const canvas = document.createElement("canvas");
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported");
    ctx.drawImage(bitmap, 0, 0);
    bitmap.close?.();
    return canvas;
}

async function cropViaImgElement(file, cropPixels, outW, outH) {
    const objectUrl = URL.createObjectURL(file);
    try {
        const img = await loadImageElement(objectUrl);
        const canvas = document.createElement("canvas");
        canvas.width = outW;
        canvas.height = outH;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Canvas not supported");
        ctx.drawImage(img, cropPixels.x, cropPixels.y, cropPixels.width, cropPixels.height, 0, 0, outW, outH);
        return canvas;
    } finally {
        URL.revokeObjectURL(objectUrl);
    }
}

export async function getCroppedImage(file, cropPixels, { maxDimension = 1600, quality = 0.85 } = {}) {
    if (cropPixels.width < 1 || cropPixels.height < 1) {
        throw new Error("Crop area is empty — adjust the crop and try again.");
    }

    const scale = Math.min(1, maxDimension / Math.max(cropPixels.width, cropPixels.height));
    const outW = Math.max(1, Math.round(cropPixels.width * scale));
    const outH = Math.max(1, Math.round(cropPixels.height * scale));

    let canvas;
    try {
        canvas = await cropViaBitmap(file, cropPixels, outW, outH);
    } catch (bitmapErr) {
        console.warn("Windowed createImageBitmap crop failed, falling back to <img> decode:", bitmapErr);
        canvas = await cropViaImgElement(file, cropPixels, outW, outH);
    }

    const blob = await new Promise((resolve, reject) =>
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not crop image"))), "image/jpeg", quality)
    );

    return { blob, width: outW, height: outH };
}