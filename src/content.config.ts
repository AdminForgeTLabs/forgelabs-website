import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishDate: z.coerce.date(),
    author: z.string().default('Forge T Labs'),
    tags: z.array(z.string()).optional(),
    ogImage: z.string().optional(),
  }),
});

export const collections = { blog };
