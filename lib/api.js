export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export function apiHeaders(extra = {}) {
  return {
    "X-API-Key": process.env.NEXT_PUBLIC_API_KEY,
    ...extra,
  };
}