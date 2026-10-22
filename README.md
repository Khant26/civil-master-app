# Civil Master Solution

Website for Civil Master Solution (CMS), an industrial flooring specialist in Thailand. One React app contains:

- the **public website** (English/Thai) presenting services, products, project references, news and articles, with content and enquiries served by the CMS backend, and
- the **CMS admin dashboard** at `/admin`, where staff log in and manage that content.

## Product branches

| Branch | Application |
|---|---|
| [`main`](https://github.com/Khant26/civil-master-solution/tree/main) | Public company website |
| [`api`](https://github.com/Khant26/civil-master-solution/tree/api) | Django CMS API contribution |
| `merged` (local) | Public website + CMS admin dashboard (`/admin`) in one app |
| `backend` (local) | Django CMS API (Docker-ready, env-based settings) |

The original frontend repository and backend fork remain available. The combined repository provides one product-level entry point while retaining contribution attribution.

## Live site

https://www.civilmastersolution.com/

## Features

- Responsive company and service pages
- Product catalogue and product enquiry workflow
- News, articles, and rich-content rendering
- Project-reference showcase
- English and Thai language support
- API-backed content with TanStack Query
- Embedded contact information, map, and chatbot interface

## Routes

| Path | Page |
|---|---|
| `/`, `/home` | Home |
| `/product` | Products |
| `/projects-reference` | Project references |
| `/news-article` | News & articles list |
| `/new` | News detail |
| `/article` | Article detail |
| `/admin/login` | Admin login (JWT from `POST {VITE_API_URL}/admin/login/`) |
| `/admin` | Redirects to `/admin/partnerships` (login required) |
| `/admin/partnerships`, `/admin/products`, `/admin/request-forms`, `/admin/project-references`, `/admin/news`, `/admin/articles`, `/admin/articles/upload`, `/admin/articles/edit/:id` | Admin content management (login required) |
| anything else | Not found page |

The admin dashboard lives in `src/admin/` and is lazy-loaded, so public visitors never download it. Its styles are built from `tailwind.admin.config.js` and scoped under `.admin-root` (and `admin-prose` instead of `prose`), so they do not change the public site's look. `vercel.json` rewrites every route (including `/admin/*`) to `index.html`.

## Environment variables

| Variable | Used by | Description |
|---|---|---|
| `VITE_API_URL` | public site and `/admin` | CMS API base URL including `/api`, e.g. `https://<backend-host>/api`. Required for production builds (set it in the Vercel project settings). In `npm run dev` it falls back to `http://localhost:8000/api`. |

`VITE_*` values are embedded in the browser bundle, so never put secrets in them. Copy `.env.example` to `.env` for local work; `.env` files are git-ignored.

## Tech stack

- React 19 and Vite 7
- React Router
- TanStack Query and Axios
- Tailwind CSS
- TipTap HTML rendering (public) and TipTap editor (admin)
- Heroicons / React Icons (admin)
- Swiper

## Local setup

Requirements: Node.js 20 or newer and npm.

```bash
git clone https://github.com/Khant26/civil-master-solution.git
cd civil-master-solution
npm ci
cp .env.example .env
npm run dev
```

Set `VITE_API_URL` to the CMS API base URL. Do not commit `.env` files or credentials.

Open http://localhost:5173/ for the public site and http://localhost:5173/admin for the dashboard (log in with a Django staff account of the CMS backend).

## Available commands

```bash
npm run dev      # Start the development server
npm run lint     # Run ESLint
npm run build    # Create a production build
npm run preview  # Preview the production build
```

## Quality checks

Pull requests and pushes to the default branch run dependency installation, linting, and a production build through GitHub Actions.

## Deployment

The generated static site is written to `dist/`. Configure the production host with the correct `VITE_API_URL` at build time and ensure client-side routes (including `/admin/*`) fall back to `index.html` — `vercel.json` already does this. The backend must allow the site's origin in its CORS settings.

## Current limitations

- No automated component or end-to-end tests are included yet.
- Production behavior depends on a compatible CMS backend and its CORS configuration.
- The build currently reports non-blocking dependency CSS/browser-data maintenance warnings.

## License

No open-source license is currently declared. All rights are reserved unless a license is added by the repository owner.
