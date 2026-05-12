// @ts-check
import { defineConfig } from 'astro/config';
import pagefind from 'astro-pagefind';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://lossless-group.github.io',
  base: '/lossless-ai-labs/',
  trailingSlash: 'ignore',

  integrations: [
    // astro-pagefind runs Pagefind against `dist/` after `astro build` and
    // copies pagefind/* into the published output. Search runs entirely
    // client-side from the static index — no backend, no cost, mode-pivot-
    // aware via theme tokens. In `astro dev` the index doesn't exist; the
    // search box renders but won't return results (intentional).
    pagefind(),

    sitemap({
      filter: (page) =>
        !page.includes('/llms.txt') &&
        !page.includes('/llms-full.txt') &&
        !page.endsWith('/404/') &&
        !page.endsWith('/404'),
    }),
  ],

  build: {
    // Pagefind needs a stable per-page URL — directory output ensures each
    // entry's data-pagefind-body lives at /changelog/<slug>/index.html.
    format: 'directory',
  },
});
