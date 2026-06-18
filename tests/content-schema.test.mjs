import { describe, it, expect } from 'vitest';
import { z } from 'zod';

/**
 * Post schema matching src/content/config.ts
 * Replicated here because astro:content is only available at build time.
 */
const postSchema = z.object({
  title: z.string(),
  date: z.coerce.date(),
  tags: z.array(z.string()).default([]),
  published: z.boolean().default(true),
  description: z.string().optional(),
  author: z.string().default("The Ghetto Shoe's"),
  image: z.string().optional(),
});

// Base valid post data
const validPost = {
  title: 'Nuevo Lanzamiento Jordan',
  date: '2026-06-14',
  tags: ['sneakers', 'nike'],
  published: true,
  description: 'Review exclusivo del nuevo drop.',
  author: "The Ghetto Shoe's",
};

describe('Post content schema', () => {
  it('validates a complete post with all fields', () => {
    const result = postSchema.parse(validPost);
    expect(result.title).toBe('Nuevo Lanzamiento Jordan');
    expect(result.date).toBeInstanceOf(Date);
    expect(result.date.toISOString()).toContain('2026-06-14');
    expect(result.tags).toEqual(['sneakers', 'nike']);
    expect(result.published).toBe(true);
    expect(result.description).toBe('Review exclusivo del nuevo drop.');
    expect(result.author).toBe("The Ghetto Shoe's");
  });

  it('coerces string dates to Date objects', () => {
    const result = postSchema.parse({
      title: 'Test',
      date: '2026-06-14',
    });
    expect(result.date).toBeInstanceOf(Date);
    expect(result.date.getTime()).toBe(new Date('2026-06-14').getTime());
  });

  it('applies defaults for optional fields', () => {
    const result = postSchema.parse({
      title: 'Minimal Post',
      date: '2026-06-14',
    });
    expect(result.tags).toEqual([]);
    expect(result.published).toBe(true);
    expect(result.author).toBe("The Ghetto Shoe's");
    expect(result.description).toBeUndefined();
    expect(result.image).toBeUndefined();
  });

  it('rejects a post without title', () => {
    expect(() =>
      postSchema.parse({ date: '2026-06-14' })
    ).toThrow();
  });

  it('rejects a post without date', () => {
    expect(() =>
      postSchema.parse({ title: 'No date' })
    ).toThrow();
  });

  it('accepts posts with published: false', () => {
    const result = postSchema.parse({
      title: 'Draft Post',
      date: '2026-06-14',
      published: false,
    });
    expect(result.published).toBe(false);
  });

  it('validates tags as string array', () => {
    const result = postSchema.parse({
      title: 'Tagged Post',
      date: '2026-06-14',
      tags: ['urban', 'sneakers'],
    });
    expect(result.tags).toHaveLength(2);
    expect(result.tags[0]).toBe('urban');
  });

  it('rejects non-array tags', () => {
    expect(() =>
      postSchema.parse({
        title: 'Bad Tags',
        date: '2026-06-14',
        tags: 'not-an-array',
      })
    ).toThrow();
  });
});

/**
 * Pages schema matching src/content/config.ts
 */
const pageSchema = z.object({
  title: z.string(),
  date: z.coerce.date().optional(),
  order: z.number().optional(),
});

describe('Pages schema', () => {
  it('validates a minimal page with only title', () => {
    const result = pageSchema.parse({ title: 'About' });
    expect(result.title).toBe('About');
    expect(result.date).toBeUndefined();
    expect(result.order).toBeUndefined();
  });

  it('validates a page with all fields', () => {
    const result = pageSchema.parse({
      title: 'Metas',
      date: '2026-06-14',
      order: 1,
    });
    expect(result.title).toBe('Metas');
    expect(result.date).toBeInstanceOf(Date);
    expect(result.order).toBe(1);
  });
});
