import { defineCollection } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Every entry may be flagged `placeholder: true` until the owner writes the real thing;
// the site labels those visibly so a draft never reads as finished content.
const link = z.object({ label: z.string(), href: z.string() });

const site = defineCollection({
  loader: file('src/content/site.json'),
  schema: z.object({
    name: z.string(),
    title: z.string(),
    tagline: z.string(),
    bio: z.array(z.string()).min(1),
    location: z.string().optional(),
    email: z.email(),
    links: z.array(link),
    resume: z.string().startsWith('/'),
    placeholder: z.boolean().default(false),
  }),
});

const projects = defineCollection({
  loader: glob({ base: './src/content/projects', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    summary: z.string().max(90),
    year: z.number().int(),
    role: z.string(),
    stack: z.array(z.string()).min(1),
    cover: z.string().optional(),
    links: z.array(link).default([]),
    order: z.number().default(0),
    placeholder: z.boolean().default(false),
  }),
});

const experience = defineCollection({
  loader: file('src/content/experience.yaml'),
  schema: z.object({
    org: z.string(),
    role: z.string(),
    kind: z.enum(['work', 'school']),
    start: z.string().regex(/^\d{4}(-\d{2})?$/),
    end: z.string().regex(/^\d{4}(-\d{2})?$/).optional(),
    summary: z.string(),
    placeholder: z.boolean().default(false),
  }),
});

export const collections = { site, projects, experience };
