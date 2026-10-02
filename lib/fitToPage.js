export function computeContainFit(contentWidth, contentHeight, pageWidthIn, pageHeightIn) {
  const contentAspect = contentWidth / contentHeight;
  const pageAspect = pageWidthIn / pageHeightIn;

  let renderedWidthIn;
  let renderedHeightIn;

  if (contentAspect > pageAspect) {
    // Content is relatively wider than the page -> width-constrained.
    renderedWidthIn = pageWidthIn;
    renderedHeightIn = pageWidthIn / contentAspect;
  } else {
    // Content is relatively taller than the page -> height-constrained.
    renderedHeightIn = pageHeightIn;
    renderedWidthIn = pageHeightIn * contentAspect;
  }

  return {
    renderedWidthIn,
    renderedHeightIn,
    marginXIn: (pageWidthIn - renderedWidthIn) / 2,
    marginYIn: (pageHeightIn - renderedHeightIn) / 2,
  };
}

// "Fit to page" page size

export const FIT_TARGET_AREA_IN2 = 8.27 * 11.69; // area of one A4 sheet
export const FIT_MAX_LONG_SIDE_IN = 16.54; // A3 long side, about 42 cm

export function computeFitPageSize(contentWidth, contentHeight) {
  const aspect =
    Number.isFinite(contentWidth) &&
    Number.isFinite(contentHeight) &&
    contentWidth > 0 &&
    contentHeight > 0
      ? contentWidth / contentHeight
      : 1;

  let pageWidthIn = Math.sqrt(FIT_TARGET_AREA_IN2 * aspect);
  let pageHeightIn = pageWidthIn / aspect;

  const longSide = Math.max(pageWidthIn, pageHeightIn);
  if (longSide > FIT_MAX_LONG_SIDE_IN) {
    const shrink = FIT_MAX_LONG_SIDE_IN / longSide;
    pageWidthIn *= shrink;
    pageHeightIn *= shrink;
  }

  return {
    pageWidthIn: Math.round(pageWidthIn * 1000) / 1000,
    pageHeightIn: Math.round(pageHeightIn * 1000) / 1000,
  };
}