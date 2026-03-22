# Deploy the Arivu web app to GitHub Pages (beginner guide)

This guide assumes you have never used GitHub Pages before. Follow the steps in order.

---

## Part 0: Read this first (important)

### What GitHub Pages is

GitHub Pages is **free static hosting**. It serves HTML, CSS, JavaScript, and images from a folder or branch. It does **not** run a Node.js server.

### How this repo is set up

`arivu-web` already uses **`output: "export"`** (see `next.config.ts`). There are **no** Next.js Route Handlers under `src/app/**/route.ts`; market data goes through **client-side** Kalshi usage (`getKalshiBrowserConfig` in `kalshiBrowserConfig.ts`) or **mock** data when those env vars are absent.

Kalshi can run **in the browser** when you set `NEXT_PUBLIC_KALSHI_ACCESS_KEY_ID`, `NEXT_PUBLIC_KALSHI_PRIVATE_KEY_PEM`, and optionally `NEXT_PUBLIC_KALSHI_BASE_URL` at **build time** (e.g. local `yarn build`). The GitHub Pages workflow **does not** set them: anything `NEXT_PUBLIC_*` is inlined into the shipped JS, so a private signing key would not stay secret. Deployed Pages builds therefore use **mock** Kalshi mode unless you change that architecture (e.g. a server-side proxy).

**Caveats:** If you build with real Kalshi env vars locally, treat them as **public** once embedded. Live browser calls also need the Kalshi API to allow your origin (**CORS**).

### CI in this repository

- **`.github/workflows/ci.yml`** — on push/PR to `main`: `yarn lint` and `yarn build` with `NEXT_PUBLIC_BASE_PATH` set like Pages. The workflow comment documents that **Vitest** can be flaky on the hosted runner for some crypto paths; run **`yarn test`** locally before pushing.
- **`.github/workflows/deploy-github-pages.yml`** — on push to `main` (and manual dispatch): same install/build, then **deploy-pages** for the static `out/` output.

---

## Part 1: Things you need before you start

1. A **GitHub account** ([github.com](https://github.com)).
2. Your code **pushed** to a GitHub repository (for example `https://github.com/YOUR_USERNAME/YOUR_REPO`).
3. **Node.js** installed on your computer (LTS version from [nodejs.org](https://nodejs.org)).
4. **Yarn** — this repo uses Yarn 4 (see `arivu-web/package.json`). From the `arivu-web` folder, Corepack can enable it:
   - `corepack enable`
   - `corepack prepare yarn@4.10.3 --activate`

---

## Part 2: Understand your site URL

GitHub Pages gives you one of these URL shapes:

| Repository type | Example URL |
|-----------------|-------------|
| User or org site (`USERNAME.github.io` repo) | `https://USERNAME.github.io/` |
| **Normal** repo (e.g. `arivu-demo`) | `https://USERNAME.github.io/REPO_NAME/` |

If your repo is **not** named `USERNAME.github.io`, your site lives under a **subpath** (`/REPO_NAME/`). Next.js must be told that path with **`basePath`** and **`assetPrefix`**, or assets and links will break.

**Example:** repo `rachit1994/arivu-demo` → site URL is:

`https://rachit1994.github.io/arivu-demo/`

Replace `YOUR_USERNAME` and `YOUR_REPO` everywhere below with your real names.

---

## Part 3: Make Next.js produce a static export

You only do this once per machine (in the `arivu-web` folder).

### Step 1 — Open a terminal

On Mac: **Terminal** app. On Windows: **PowerShell** or **Command Prompt**.

### Step 2 — Go to the app folder

```bash
cd path/to/arivu/arivu-web
```

Use the real path where your project lives.

### Step 3 — Install dependencies

```bash
yarn install
```

### Step 4 — Subpath for a project site (GitHub Pages)

`next.config.ts` reads **`NEXT_PUBLIC_BASE_PATH`** at build time (e.g. `/arivu-demo` for repo `arivu-demo`). Leave it unset for local dev at `/`.

Set it in **GitHub Actions** (repository **Variables** or **Secrets**) when building for Pages, e.g. `NEXT_PUBLIC_BASE_PATH=/arivu-demo`.

If your site is the special `USERNAME.github.io` repo at the root URL, keep `NEXT_PUBLIC_BASE_PATH` empty.

### Step 5 — Confirm static export is possible

Run:

```bash
yarn build
```

- If the build **fails**, read the error. Next.js will refuse static export for some features (certain dynamic server features, etc.). You must fix those errors or remove incompatible features before GitHub Pages can work.
- If it **succeeds**, you should see an `out/` folder inside `arivu-web` with HTML and assets.

### Step 6 — Add a convenience script (optional)

In `arivu-web/package.json`, you can add:

```json
"export": "next build"
```

(`next build` already produces `out/` when `output: 'export'` is set.)

---

## Part 4: Deploy automatically with GitHub Actions (recommended)

This way every push to `main` rebuilds the site and publishes it. You do not upload files by hand.

### Step 1 — Workflow file

**This repo already contains** `.github/workflows/deploy-github-pages.yml` at the monorepo root. If you are copying the pattern into another repository, create the same path there.

The canonical copy is the file in git; the snippet below matches its intent (Yarn 4 via Corepack, immutable install, `NEXT_PUBLIC_BASE_PATH` from the repo name, no `NEXT_PUBLIC_KALSHI_*` in CI).

```yaml
name: Deploy Next.js to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      # Do not use setup-node's cache: yarn — global Yarn 1 runs before Corepack.
      - uses: actions/setup-node@v4
        with:
          node-version: "20"

      - name: Enable Corepack and Yarn 4.10.3
        run: |
          corepack enable
          corepack prepare yarn@4.10.3 --activate
          echo "$(dirname "$(which node)")" >> "$GITHUB_PATH"

      - name: Verify Yarn version
        working-directory: arivu-web
        run: yarn --version

      - name: Cache Yarn Berry global cache
        uses: actions/cache@v4
        with:
          path: /home/runner/.yarn/berry/cache
          key: ${{ runner.os }}-yarn-berry-${{ hashFiles('arivu-web/yarn.lock') }}
          restore-keys: |
            ${{ runner.os }}-yarn-berry-

      - name: Install dependencies
        working-directory: arivu-web
        run: yarn install --immutable

      - name: Build static export
        working-directory: arivu-web
        env:
          NEXT_PUBLIC_BASE_PATH: ${{ format('/{0}', github.event.repository.name) }}
          # Do NOT set NEXT_PUBLIC_KALSHI_* here. Next.js embeds NEXT_PUBLIC_* into the
          # client bundle at build time, so a private signing key would become public in
          # the deployed JS. GitHub Actions "secrets" do not change that. Use mock mode
          # on Pages; for live Kalshi use a server-side proxy or a non-static host.
        run: yarn build

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: arivu-web/out

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

**Important:** Your `next.config.ts` must use the same `basePath` / `assetPrefix` as your real GitHub repo name (see Part 3).

### Step 2 — Commit and push (if you added or changed the workflow)

```bash
git add .github/workflows/deploy-github-pages.yml
git commit -m "Add GitHub Pages deploy workflow"
git push origin main
```

---

## Part 5: Turn on GitHub Pages in the GitHub website

### Step 1 — Open your repository on GitHub

Go to `https://github.com/YOUR_USERNAME/YOUR_REPO`.

### Step 2 — Open Settings

Click the **Settings** tab on the repo.

### Step 3 — Open Pages settings

In the left sidebar, click **Pages** (under “Code and automation”).

### Step 4 — Choose the source

Under **Build and deployment**:

1. **Source:** select **GitHub Actions** (not “Deploy from a branch” if you use the workflow above).
2. Save if prompted.

### Step 5 — Wait for the first run

1. Click the **Actions** tab at the top of the repo.
2. Open the latest **Deploy Next.js to GitHub Pages** run.
3. Wait until it is green (success).

### Step 6 — Open your site

After success, GitHub shows the site URL on the **Settings → Pages** page. It will look like:

`https://YOUR_USERNAME.github.io/YOUR_REPO/`

Open it in a browser. The first deploy can take one to two minutes after the workflow finishes.

---

## Part 6: If something goes wrong

| Problem | What to check |
|--------|----------------|
| White page or 404 on refresh | `basePath` / `assetPrefix` must match the repo name; URLs must include the subpath (e.g. `/arivu-demo/`). |
| Workflow fails on `yarn build` | Read the Actions log; fix Next.js static export errors (see Part 3). |
| Kalshi or market data fails in the browser | On Pages you are in **mock** mode unless you inlined `NEXT_PUBLIC_KALSHI_*` at build (not recommended for secrets). Otherwise check **CORS**, demo vs prod `NEXT_PUBLIC_KALSHI_BASE_URL`, and PEM formatting (`\n` escapes). |
| Old version still showing | Hard refresh (Ctrl+Shift+R / Cmd+Shift+R) or wait for CDN cache. |

---

## Part 7: Optional — custom domain

1. Buy or use a domain and add a `CNAME` or `A` records per [GitHub’s custom domain docs](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site).
2. In the repo: **Settings → Pages → Custom domain**.
3. For Next.js `basePath`, you may switch to the root of the custom domain and adjust `basePath` / `assetPrefix` accordingly (often empty for root).

---

## Quick checklist

- [ ] Understood: GitHub Pages = static only; Kalshi is **client-side** (or mock); no reliance on Next.js Route Handlers for this app’s export.
- [ ] `next.config.ts`: `output: 'export'` + correct `basePath` / `assetPrefix` for your repo.
- [ ] `yarn build` works locally and creates `arivu-web/out/`.
- [ ] `.github/workflows/deploy-github-pages.yml` present and pushed to `main` (this repo includes it).
- [ ] **Settings → Pages → Source: GitHub Actions**.
- [ ] Actions run succeeded; site opens at `https://YOUR_USERNAME.github.io/YOUR_REPO/`.
- [ ] Optional: run **`yarn test`** locally (CI currently runs lint + build; see Part 0 “CI in this repository”).

---

## Official references

- [GitHub Pages documentation](https://docs.github.com/en/pages)
- [Next.js static exports](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)
- [GitHub Actions for Pages](https://github.com/actions/deploy-pages)
