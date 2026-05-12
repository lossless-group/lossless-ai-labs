/**
 * Static SEO copy + share-image catalog for ai-labs/splash.
 *
 * The image set is generated via the `generate-consistent-og-images` skill
 * using Ideogram v3. See splash/DESIGN.md's `imagery:` block for the locked
 * recipe and splash/public/ for the deliverables.
 *
 * NOTE on hosting: per the `open-graph-share-seo-geo` skill's Rule #1, the
 * canonical OG image *should* live on a CDN, not GitHub Pages. We're shipping
 * the public/ path-deployed version first to unblock; migrating to ImageKit
 * (or equivalent) is a follow-up. The pattern below makes that swap a one-line
 * change to OG_IMAGE_HOST.
 */

export const SITE_TITLE = 'Lossless AI-Labs · applied AI testbed';
export const SITE_DESCRIPTION =
  'Applied AI testbed becoming home to core products. Currently housing Context Vigilance, MemoPop AI, and DidiDecks AI inside The Lossless Group\'s ai-labs pseudomonorepo.';
export const SITE_URL = 'https://lossless-group.github.io/lossless-ai-labs/';
export const SITE_REPO = 'https://github.com/lossless-group/lossless-ai-labs';
export const SITE_NAME = 'Lossless AI-Labs';

/** Override to point share imagery at a CDN. When this is empty, image URLs
 *  are built from Astro.site + BASE_URL (i.e., served from the splash's own
 *  /public/). ImageKit content-negotiates format, so the URL extension may
 *  not match the bytes — `type` on each OgImage must match what's served. */
export const OG_IMAGE_HOST = 'https://ik.imagekit.io/xvpgfijuw/Lossless-AI-Labs';

export interface OgImage {
  /** Filename inside public/ (no leading slash). */
  file: string;
  /** Actual pixel width of the file. Must match bytes per OG/SEO Rule #3. */
  width: number;
  /** Actual pixel height. */
  height: number;
  /** MIME type matching the bytes the unfurler downloads. */
  type: 'image/jpeg' | 'image/png';
  /** One-sentence descriptive alt text — required for OG + accessibility. */
  alt: string;
  /** Aspect-key from DESIGN.md's imagery.aspect_ratios enum. The `messages`
   *  key is for the chat-preview-first share image (square-ish landscape
   *  sized for how iMessage and WhatsApp crop unfurl cards). */
  aspect: 'banner' | 'banner_tall' | 'banner_tall_max' | 'portrait' | 'portrait_tall' | 'square' | 'messages';
}

/**
 * The Messages-format share card. 890×760 — a square-ish landscape sized
 * for how iMessage and WhatsApp crop unfurl previews. Real JPEG bytes
 * (verified: magic FF D8 FF) so the bytes/MIME/URL agreement holds even
 * with ImageKit in front (no WebP content-negotiation surprise here).
 *
 * This is the canonical share image — set as DEFAULT_OG_IMAGE so every
 * page emits it in the og:image sextet. Per-page overrides for other
 * aspects can still pull from OG_IMAGES below.
 */
export const MESSAGES_OG_IMAGE: OgImage = {
  file: 'ogimage__Lossless-AI-Labs--Messages.jpg',
  width: 890,
  height: 760,
  type: 'image/jpeg',
  alt: 'Lossless AI-Labs share card sized for chat-preview unfurls (iMessage, WhatsApp, Slack, Discord).',
  aspect: 'messages',
};

/**
 * The canonical share image. One og:image sextet is what most unfurlers
 * actually read; additional formats below are available for per-page
 * overrides (e.g., a portrait image when the share target is feed-first).
 *
 * Primary is the Messages-format card because chat-preview is the actual
 * surface most readers will see the splash through first — iMessage,
 * WhatsApp, Slack, Discord all do well with square-ish landscape.
 */
export const DEFAULT_OG_IMAGE: OgImage = MESSAGES_OG_IMAGE;

/** Full set of generated formats, indexed by aspect-key. Per-page overrides
 *  (e.g., a portrait share for LinkedIn feed) can pull from here. */
export const OG_IMAGES: Record<OgImage['aspect'], OgImage> = {
  messages: MESSAGES_OG_IMAGE,
  banner: {
    file: 'ogimage__AI-Labs--Banner.jpg',
    width: 1312,
    height: 736,
    type: 'image/jpeg',
    alt: 'Three small isometric instrument modules in a row on a dark matte bench surface — Lossless AI-Labs share image.',
    aspect: 'banner',
  },
  banner_tall: {
    file: 'ogimage__AI-Labs--BannerTall.jpg',
    width: 864,
    height: 1152,
    type: 'image/jpeg',
    alt: 'Three small instrument modules in a row on a dark tiled bench surface, tall composition for WhatsApp / iMessage previews.',
    aspect: 'banner_tall',
  },
  banner_tall_max: {
    file: 'ogimage__AI-Labs--BannerTallMax.jpg',
    width: 832,
    height: 1248,
    type: 'image/jpeg',
    alt: 'Three small instrument modules on a dark bench, dramatic-tall composition.',
    aspect: 'banner_tall_max',
  },
  portrait: {
    file: 'ogimage__AI-Labs--Portrait.jpg',
    width: 896,
    height: 1120,
    type: 'image/jpeg',
    alt: 'Three small instrument modules on a dark tiled bench, portrait composition for LinkedIn and Instagram feed.',
    aspect: 'portrait',
  },
  portrait_tall: {
    file: 'ogimage__AI-Labs--PortraitTall.jpg',
    width: 736,
    height: 1312,
    type: 'image/jpeg',
    alt: 'Three small instrument modules on a dark tiled bench, 9:16 composition for Stories and Reels.',
    aspect: 'portrait_tall',
  },
  square: {
    file: 'ogimage__AI-Labs--Square.jpg',
    width: 1024,
    height: 1024,
    type: 'image/jpeg',
    alt: 'Three small instrument modules on a dark bench, square composition for avatars and square unfurls.',
    aspect: 'square',
  },
};

/**
 * Build the absolute URL for a share image. Per OG/SEO Rule #4, og:image must
 * be a fully-qualified https URL — unfurlers don't know our origin. When
 * OG_IMAGE_HOST is empty we serve from the splash's own /public/ (GitHub Pages
 * path-deployed). When migrated to a CDN, set OG_IMAGE_HOST and this returns
 * the CDN URL instead.
 */
export function ogImageUrl(image: OgImage, site: URL | undefined, base: string): string {
  if (OG_IMAGE_HOST) {
    return `${OG_IMAGE_HOST.replace(/\/$/, '')}/${image.file}`;
  }
  const origin = site?.origin ?? 'https://lossless-group.github.io';
  const prefix = base.endsWith('/') ? base : `${base}/`;
  return `${origin}${prefix}${image.file}`;
}
