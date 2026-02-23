import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    tag: z.string(),
    readTime: z.string(),
    publishDate: z.coerce.date(),
    gradient: z.string().default('from-brand-500/20 to-emerald-500/20'),
    /** Optional: custom OG image path for social previews (e.g. /images/my-post-og.png) */
    image: z.string().optional(),
  }),
});

export const collections = { blog };
