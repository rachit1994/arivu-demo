This is a [Next.js](https://nextjs.org) app for **ARIVU web**.

## Package manager (Yarn only)

Use **Yarn 4** only. Do not use `npm install` (no `package-lock.json`).

```bash
corepack enable
yarn install
```

This repo uses `.yarnrc.yml` with `nodeLinker: node-modules` so **Next.js Turbopack** can resolve `next` correctly. Yarn PnP alone breaks Turbopack’s lookup of `next/package.json`.

## Scripts

```bash
yarn dev      # Next dev (Turbopack)
yarn build    # static export → `out/` (no Node server)
yarn lint
yarn test
```

This app uses **`output: "export"`** so it can ship to **GitHub Pages** and other static hosts. There is no `next start` server; preview the export with `npx serve out` (or any static file server).

Open [http://localhost:3000](http://localhost:3000) after `yarn dev`.

Edit `src/app/page.tsx` and components under `src/components/` — the app hot-reloads.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Kalshi (real market data)

Calls go **directly from the browser** to the Kalshi Trade API (signed with **Web Crypto**).

**GitHub Pages security:** Authenticated Kalshi requests require a private signing key. In a static export, anything in `NEXT_PUBLIC_*` is embedded into the client-side JS, so it is not safe to treat it like a secret. The GitHub Pages deployment workflow intentionally does **not** inject `NEXT_PUBLIC_KALSHI_*`, so the app uses the existing **mock** realtime data by default.
- `NEXT_PUBLIC_KALSHI_ACCESS_KEY_ID`
- `NEXT_PUBLIC_KALSHI_PRIVATE_KEY_PEM` — demo-only PKCS#8 PEM; newlines can be `\n` in a single-line env value

**Optional:**
- `NEXT_PUBLIC_KALSHI_BASE_URL` — default demo: `https://demo-api.kalshi.co/trade-api/v2`
- `NEXT_PUBLIC_BASE_PATH` — e.g. `/arivu-demo` for GitHub Pages project sites (must match `next.config` at build time)

**Security note:** `NEXT_PUBLIC_*` values are **public** in a static export. Treat them as demo-only data embedded into JS.

**CORS:** If the browser blocks Kalshi responses, you will need a host that allows your origin or a small backend proxy (out of scope here).

If credentials are missing or requests fail, the UI falls back to **mock** realtime data where applicable.
