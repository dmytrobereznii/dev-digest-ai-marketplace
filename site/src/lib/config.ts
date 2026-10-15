/** GitHub repository the marketplace is added from (docs/RELEASES.md → Channels). */
export const REPO_SLUG = 'dmytrobereznii/dev-digest-ai-marketplace';
export const REPO_URL = `https://github.com/${REPO_SLUG}`;

/** Generated data lives next to index.html, under Vite's `base`. */
export const dataUrl = (file: string): string => `${import.meta.env.BASE_URL}${file}`;
