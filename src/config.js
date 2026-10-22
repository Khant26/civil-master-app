// Single source of truth for the CMS API base URL (public site + /admin).
// Set VITE_API_URL at build time (e.g. in Vercel project settings), for example
// https://api.example.com/api . The localhost fallback is only used by `npm run dev`.
const rawApiUrl =
  import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:8000/api' : '');

if (!rawApiUrl) {
  console.error('VITE_API_URL is not set; API requests will fail. Set it at build time.');
}

export const API_BASE_URL = rawApiUrl.replace(/\/+$/, '');
