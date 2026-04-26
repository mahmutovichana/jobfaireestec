export const PUBLIC_MEDIA_CATEGORIES = [
  'event-assets',
  'news-images',
  'partner-logos',
  'team-photos',
  'gallery',
] as const;

export const PRIVATE_MEDIA_CATEGORIES = ['cv-uploads'] as const;

export const ALL_MEDIA_CATEGORIES = [
  ...PUBLIC_MEDIA_CATEGORIES,
  ...PRIVATE_MEDIA_CATEGORIES,
] as const;

export type MediaCategory = (typeof ALL_MEDIA_CATEGORIES)[number];

export function isMediaCategory(category: string): category is MediaCategory {
  return (ALL_MEDIA_CATEGORIES as readonly string[]).includes(category);
}

export function isPublicCategory(category: string): boolean {
  return (PUBLIC_MEDIA_CATEGORIES as readonly string[]).includes(category);
}
