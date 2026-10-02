export const PAGE_SIZES = [
  { id: "letter", label: "Letter", widthIn: 8.5, heightIn: 11 },
  { id: "legal", label: "Legal", widthIn: 8.5, heightIn: 14 },
  { id: "a4", label: "A4", widthIn: 8.27, heightIn: 11.69 },
  { id: "a3", label: "A3", widthIn: 11.69, heightIn: 16.54 },
  { id: "a5", label: "A5", widthIn: 5.83, heightIn: 8.27 },
  { id: "tabloid", label: "Tabloid", widthIn: 11, heightIn: 17 },
  { id: "f4", label: "F4", widthIn: 8.27, heightIn: 12.99}
];

export function getPageSizeById(id) {
  return PAGE_SIZES.find((size) => size.id === id) ?? PAGE_SIZES[0];
}

/** Returns { widthIn, heightIn } for a page size in the requested orientation. */
export function orientedDimensions(pageSize, orientation) {
  const shortSide = Math.min(pageSize.widthIn, pageSize.heightIn);
  const longSide = Math.max(pageSize.widthIn, pageSize.heightIn);
  return orientation === "landscape"
    ? { widthIn: longSide, heightIn: shortSide }
    : { widthIn: shortSide, heightIn: longSide };
}

export const FIT_PAGE_ID = "fit";

export const CUSTOM_PAGE_ID = "custom";

export const CUSTOM_MIN_CM = 10; //cm
export const CUSTOM_MAX_CM = 60; //cm

const CM_PER_INCH = 2.54;

export const cmToIn = (cm) => cm / CM_PER_INCH;
export const inToCm = (inches) => inches * CM_PER_INCH;

function checkCustomSide(raw) {
  const text = String(raw ?? "").trim();
  const value = Number.parseFloat(text);

  if (!text || !Number.isFinite(value)) {
    return { value: null, error: "Enter a number" };
  }
  if (value < CUSTOM_MIN_CM) {
    return { value, error: `Min ${CUSTOM_MIN_CM} cm` };
  }
  if (value > CUSTOM_MAX_CM) {
    return { value, error: `Max ${CUSTOM_MAX_CM} cm` };
  }
  return { value, error: null };
}

/** Validates the two text inputs of the custom size form. */
export function parseCustomSize(widthCm, heightCm) {
  const w = checkCustomSide(widthCm);
  const h = checkCustomSide(heightCm);
  const valid = !w.error && !h.error;

  return {
    valid,
    widthCm: w.value,
    heightCm: h.value,
    widthIn: valid ? cmToIn(w.value) : null,
    heightIn: valid ? cmToIn(h.value) : null,
    widthError: w.error,
    heightError: h.error,
  };
}

const trimNumber = (n) => Number(n.toFixed(2));

/**
 * Single source of truth for "what page are we making?".
 *
 * Returns:
 *   mode         "preset" | "fit" | "custom"
 *   id           value to send as `pageSizeId`
 *   valid        false only for a custom size that is empty / out of range
 *   label        short text for the UI
 *   orientation  "portrait" | "landscape" (what the API expects)
 *   widthIn / heightIn  the page size. For "fit" this is only a nominal A4
 *                       reference, every image gets its own page size.
 */
export function resolvePageSettings({
  pageSizeId,
  orientation,
  customWidthCm,
  customHeightCm,
}) {
  const a4 = getPageSizeById("a4");

  if (pageSizeId === FIT_PAGE_ID) {
    return {
      mode: "fit",
      id: FIT_PAGE_ID,
      valid: true,
      label: "Fit to page",
      orientation: "portrait",
      widthIn: a4.widthIn,
      heightIn: a4.heightIn,
    };
  }

  if (pageSizeId === CUSTOM_PAGE_ID) {
    const custom = parseCustomSize(customWidthCm, customHeightCm);

    if (!custom.valid) {
      // Placeholder so previews keep working while the user is still typing.
      return {
        mode: "custom",
        id: CUSTOM_PAGE_ID,
        valid: false,
        label: "Custom · enter a size",
        orientation: "portrait",
        widthIn: a4.widthIn,
        heightIn: a4.heightIn,
      };
    }

    return {
      mode: "custom",
      id: CUSTOM_PAGE_ID,
      valid: true,
      label: `Custom · ${trimNumber(custom.widthCm)} × ${trimNumber(custom.heightCm)} cm`,
      orientation: custom.widthIn > custom.heightIn ? "landscape" : "portrait",
      widthIn: custom.widthIn,
      heightIn: custom.heightIn,
    };
  }

  const size = getPageSizeById(pageSizeId);
  const dims = orientedDimensions(size, orientation);

  return {
    mode: "preset",
    id: pageSizeId,
    valid: true,
    label: `${size.label} · ${orientation}`,
    orientation,
    widthIn: dims.widthIn,
    heightIn: dims.heightIn,
  };
}