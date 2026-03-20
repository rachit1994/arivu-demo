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
yarn build    # production build (Turbopack)
yarn start    # production server
yarn lint
yarn test
```

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

If you provide Kalshi API credentials, the sidebar will fetch real market listings via our authenticated API routes.

Required server environment variables:
- `KALSHI_ACCESS_KEY_ID`: Kalshi API key ID.
- `KALSHI_PRIVATE_KEY_PEM`: RSA private key in PEM format (store as a server secret).

Optional:
- `KALSHI_BASE_URL`: Override the Kalshi Trade API v2 base URL.
  - Default (demo): `https://demo-api.kalshi.co/trade-api/v2`
  - Production: `https://api.elections.kalshi.com/trade-api/v2`

Notes:
- We do not store or log secrets.
- If Kalshi is not configured (or requests fail), the app falls back to the existing mock realtime data.
