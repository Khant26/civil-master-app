import typography from '@tailwindcss/typography';

/**
 * Tailwind config for the CMS admin dashboard (src/admin/**) only.
 * Loaded from src/admin/index.css via `@config`, so the public website keeps
 * using tailwind.config.js unchanged. Utilities are scoped under `.admin-root`
 * and preflight is disabled (the public stylesheet already provides it).
 * @type {import('tailwindcss').Config}
 */
export default {
  content: ['./src/admin/**/*.{js,jsx,ts,tsx}'],
  important: '.admin-root',
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {},
  },
  // `admin-prose` instead of `prose`: the public site uses its own .prose styles
  plugins: [typography({ className: 'admin-prose' })],
};
