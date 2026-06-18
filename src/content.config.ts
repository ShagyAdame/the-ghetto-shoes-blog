import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const posts = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    published: z.boolean().default(true),
    description: z.string().optional(),
    author: z.string().default("The Ghetto Shoe's"),
    image: z.string().optional(),
  }),
});

const pages = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date().optional(),
    order: z.number().optional(),
  }),
});

export const collections = { posts, pages };
