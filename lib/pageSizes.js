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