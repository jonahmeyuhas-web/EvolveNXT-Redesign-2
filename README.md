# EvolveNXT Website

Modern, light, premium marketing site for EvolveNXT (evolvenxt.com): enterprise
distribution management software for insurance carriers.

Homepage only for now, to validate the design direction.

## Stack

- Vite + React
- Motion for React (scroll-linked animation)
- Lenis (smooth scrolling)
- Switzer (self-hosted, Fontshare license)

## Develop

```sh
npm install
npm run dev
```

## Deploy

Pushing to `main` builds and publishes to GitHub Pages via
`.github/workflows/deploy.yml`. The build passes `--base=/<repo-name>/`;
change that to `/` if a custom domain is attached.

All site copy comes verbatim from the live evolvenxt.com. Sources are noted in
`src/content/site.js`.
