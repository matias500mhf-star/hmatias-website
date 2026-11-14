import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";

const blog = defineCollection({
  loader: glob({ base: "./src/content/blog", pattern: "**/*.md" }),
  schema: z.object({
    title: z.string().min(12).max(90),
    description: z.string().min(80).max(180),
    pubDate: z.coerce.date(),
    category: z.string().min(3).max(40),
    author: z.string().min(2).max(60),
    readingMinutes: z.number().int().min(1).max(20).default(5),
    contentType: z.enum(["guide", "case-study"]).default("guide"),
    language: z.enum(["pt-AO", "en"]),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };
