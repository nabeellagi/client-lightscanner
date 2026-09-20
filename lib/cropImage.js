function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new window.Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

export async function getCroppedImage(imageSrc, cropPixels, { maxDimension = 1600, quality = 0.85 } = {}) {
    const image = await loadImage(imageSrc);
    const scale = Math.min(1, maxDimension / Math.max(cropPixels.width, cropPixels.height));
    const outW = Math.max(1, Math.round(cropPixels.width * scale));
    const outH = Math.max(1, Math.round(cropPixels.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported");

    ctx.drawImage(image, cropPixels.x, cropPixels.y, cropPixels.width, cropPixels.height, 0, 0, outW, outH);

    const blob = await new Promise((resolve, reject) =>
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not crop image"))), "image/jpeg", quality)
    );

    return { blob, width: outW, height: outH };
}