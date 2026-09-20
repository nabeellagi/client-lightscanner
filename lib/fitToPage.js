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