import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const posts = await getCollection('posts', ({ data }) => data.published !== false);

  // Sort by date descending
  const sortedPosts = posts.sort(
    (a, b) => b.data.date.valueOf() - a.data.date.valueOf()
  );

  return rss({
    title: "The Ghetto Shoe's",
    description: 'Lanzamientos, sneakers y cultura retro',
    site: context.site,
    items: sortedPosts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.date,
      description: post.data.description || '',
      link: `/posts/${post.id}/`,
      // Include full content as optional field
      content: post.body || '',
    })),
    customData: `<language>es</language>`,
  });
}
