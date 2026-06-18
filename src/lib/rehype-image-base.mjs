/**
 * rehype-image-base.mjs
 *
 * Rehype plugin that prefixes <img src> paths with a base URL.
 *
 * Usage: [rehypeImageBase('/the-ghetto-shoes-blog')]
 */

/**
 * Recursively walk an HTML/rehype tree and prefix image src attributes.
 */
function prefixImages(node, normalizedBase) {
  if (!node || typeof node !== 'object') return;

  if (node.type === 'element' && node.tagName === 'img' && node.properties?.src) {
    const src = node.properties.src;
    if (
      typeof src === 'string' &&
      src.startsWith('/') &&
      !src.startsWith(normalizedBase)
    ) {
      node.properties.src = normalizedBase.replace(/\/$/, '') + src;
    }
  }

  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      prefixImages(child, normalizedBase);
    }
  }
}

/**
 * @param {string} base - The base path, e.g. '/the-ghetto-shoes-blog'
 * @returns {function} rehype plugin
 */
export function rehypeImageBase(base) {
  const normalizedBase = base.replace(/\/?$/, '/');

  if (normalizedBase === '/' || !normalizedBase) {
    return () => () => {};
  }

  // Unified attacher(processor) => transformer(tree, file)
  return () => {
    return (tree) => {
      prefixImages(tree, normalizedBase);
    };
  };
}
