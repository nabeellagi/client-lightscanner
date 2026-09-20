"use client";

import { useState } from "react";
import { PAGE_SIZES } from "@/lib/pageSizes";

export function usePageSettings() {
  const [pageSizeId, setPageSizeId] = useState(PAGE_SIZES[0].id);
  const [orientation, setOrientation] = useState("portrait");
  return { pageSizeId, setPageSizeId, orientation, setOrientation };
}