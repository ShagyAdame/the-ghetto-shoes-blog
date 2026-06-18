/**
 * rehype-image-base.mjs
 *
 * Rehype plugin that prefixes <img src> paths with a base URL during production builds.
 * Only activates when base is not '/' (i.e., during `astro build`, not `astro dev`).
 */
import { visit } from 'unist-util-visit';

/**
 * @param {string} base - The base path, e.g. '/the-ghetto-shoes-blog'
 * @returns {function} rehype plugin
 */
export function rehypeImageBase(base) {
  const normalizedBase = base.replace(/\/?$/, '/'); // ensure trailing slash

  // Skip if no meaningful base prefix
  if (normalizedBase === '/' || !normalizedBase) {
    return () => {};
  }

  return (tree) => {
    visit(tree, 'element', (node) => {
      if (node.tagName === 'img' && node.properties?.src) {
        const src = node.properties.src;
        // Only prefix absolute paths that start with / and are not already prefixed
        if (
          typeof src === 'string' &&
          src.startsWith('/') &&
          !src.startsWith(normalizedBase)
        ) {
          node.properties.src = normalizedBase.replace(/\/$/, '') + src;
        }
      }
    });
  };
}
