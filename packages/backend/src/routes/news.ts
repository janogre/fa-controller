import { Router } from "express";
import { db } from "../db/index.js";
import { newsSources, newsArticles, activityLog } from "../db/schema.js";
import { eq, desc, and, sql } from "drizzle-orm";
import { authenticateToken, AuthRequest } from "../middleware/auth.js";
import RSSParser from "rss-parser";
import * as cheerio from "cheerio";

const router = Router();
router.use(authenticateToken);

const parser = new RSSParser();

// Extract readable title from a sitemap URL slug
function titleFromUrl(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const segments = pathname.split("/").filter(Boolean);
    // Telecomrevy URLs: /tags/article-title/id
    // The article title is the segment just before the numeric ID
    const nonNumeric = segments.filter(s => !/^\d+$/.test(s));
    // Take the last non-numeric segment (closest to the ID = actual title)
    const titleSegment = nonNumeric.length > 0 ? nonNumeric[nonNumeric.length - 1] : null;
    if (!titleSegment) return url;
    return titleSegment
      .replace(/-/g, " ")
      .replace(/\b\w/g, c => c.toUpperCase());
  } catch {
    return url;
  }
}

// Fetch articles from a sitemap XML
async function fetchSitemap(source: typeof newsSources.$inferSelect): Promise<number> {
  const response = await fetch(source.url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const xml = await response.text();
  const $ = cheerio.load(xml, { xmlMode: true });

  // Collect all URLs from sitemap (limit to most recent 100)
  const entries: { loc: string; lastmod: string }[] = [];
  $("url").each((_, el) => {
    const loc = $(el).find("loc").text();
    const lastmod = $(el).find("lastmod").text();
    if (loc) entries.push({ loc, lastmod });
  });

  // Get existing GUIDs for this source to avoid N+1 queries
  const existingArticles = await db.select({ guid: newsArticles.guid })
    .from(newsArticles)
    .where(eq(newsArticles.sourceId, source.id));
  const existingGuids = new Set(existingArticles.map(a => a.guid));

  let newCount = 0;
  for (const entry of entries.slice(0, 100)) {
    if (existingGuids.has(entry.loc)) continue;

    const title = titleFromUrl(entry.loc);
    await db.insert(newsArticles).values({
      sourceId: source.id,
      title,
      link: entry.loc,
      description: null,
      content: null,
      author: null,
      category: source.category,
      publishedAt: entry.lastmod || null,
      guid: entry.loc,
    });
    newCount++;
  }

  return newCount;
}

// Fetch articles from an RSS feed
async function fetchRss(source: typeof newsSources.$inferSelect): Promise<number> {
  const feed = await parser.parseURL(source.url);
  let newCount = 0;

  // Get existing GUIDs for this source to avoid N+1 queries
  const existingArticles = await db.select({ guid: newsArticles.guid })
    .from(newsArticles)
    .where(eq(newsArticles.sourceId, source.id));
  const existingGuids = new Set(existingArticles.map(a => a.guid));

  for (const item of feed.items || []) {
    const guid = item.guid || item.link || item.title;
    if (!guid || existingGuids.has(guid)) continue;

    await db.insert(newsArticles).values({
      sourceId: source.id,
      title: item.title || "Uten tittel",
      link: item.link,
      description: item.contentSnippet || item.content?.slice(0, 500),
      content: item.content,
      author: item.creator || item.author,
      category: source.category,
      publishedAt: item.isoDate || item.pubDate,
      guid,
    });
    newCount++;
  }

  return newCount;
}

// Fetch a single source (RSS or sitemap)
async function fetchSource(source: typeof newsSources.$inferSelect): Promise<number> {
  const newCount = source.sourceType === "sitemap"
    ? await fetchSitemap(source)
    : await fetchRss(source);

  await db.update(newsSources)
    .set({ lastFetchedAt: new Date().toISOString() })
    .where(eq(newsSources.id, source.id));

  return newCount;
}

// === SOURCES ===

router.get("/sources", async (_req, res) => {
  const result = await db.select().from(newsSources).orderBy(newsSources.name);
  res.json(result);
});

router.post("/sources", async (req: AuthRequest, res) => {
  try {
    const { name, url, category } = req.body;
    const [result] = await db.insert(newsSources).values({ name, url, category }).returning();

    await db.insert(activityLog).values({
      action: "created", entityType: "news_source", entityId: result.id,
      entityName: name, userId: req.userId,
    });

    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to create news source" });
  }
});

router.put("/sources/:id", async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id as string);
    const { name, url, category, enabled } = req.body;
    const [result] = await db.update(newsSources)
      .set({ name, url, category, enabled })
      .where(eq(newsSources.id, id))
      .returning();

    if (!result) {
      res.status(404).json({ error: "Source not found" });
      return;
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to update news source" });
  }
});

router.delete("/sources/:id", async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id as string);
    await db.delete(newsSources).where(eq(newsSources.id, id));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete news source" });
  }
});

// === ARTICLES ===

router.get("/articles", async (req, res) => {
  const { category, bookmarked, limit = "50", offset = "0" } = req.query;

  let result = await db.query.newsArticles.findMany({
    with: { source: true },
    orderBy: [desc(newsArticles.publishedAt), desc(newsArticles.createdAt)],
    limit: parseInt(limit as string),
    offset: parseInt(offset as string),
  });

  // Filter in JS since drizzle query API doesn't support complex where with relations
  if (category) {
    result = result.filter(a => a.category === category || a.source?.category === category);
  }
  if (bookmarked === "true") {
    result = result.filter(a => a.bookmarked);
  }

  res.json(result);
});

// Toggle bookmark
router.patch("/articles/:id/bookmark", async (_req, res) => {
  try {
    const id = parseInt(_req.params.id as string);
    const [article] = await db.select().from(newsArticles).where(eq(newsArticles.id, id));
    if (!article) {
      res.status(404).json({ error: "Article not found" });
      return;
    }
    const [result] = await db.update(newsArticles)
      .set({ bookmarked: !article.bookmarked })
      .where(eq(newsArticles.id, id))
      .returning();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to toggle bookmark" });
  }
});

// Mark as read
router.patch("/articles/:id/read", async (_req, res) => {
  try {
    const id = parseInt(_req.params.id as string);
    const [result] = await db.update(newsArticles)
      .set({ read: true })
      .where(eq(newsArticles.id, id))
      .returning();
    if (!result) {
      res.status(404).json({ error: "Article not found" });
      return;
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to mark as read" });
  }
});

// Update notes on an article
router.patch("/articles/:id/notes", async (req, res) => {
  try {
    const id = parseInt(req.params.id as string);
    const { notes } = req.body;
    const [result] = await db.update(newsArticles)
      .set({ notes })
      .where(eq(newsArticles.id, id))
      .returning();
    if (!result) {
      res.status(404).json({ error: "Article not found" });
      return;
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to update notes" });
  }
});

// === FETCH ===

// Fetch all enabled sources
router.post("/fetch", async (_req, res) => {
  try {
    const sources = await db.select().from(newsSources).where(eq(newsSources.enabled, true));
    let totalNew = 0;

    for (const source of sources) {
      try {
        const newCount = await fetchSource(source);
        totalNew += newCount;
      } catch (feedError) {
        console.error(`Failed to fetch ${source.sourceType} ${source.name} (${source.url}):`, feedError);
      }
    }

    res.json({ success: true, sourcesChecked: sources.length, newArticles: totalNew });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch feeds" });
  }
});

// Fetch a single source
router.post("/fetch/:sourceId", async (req, res) => {
  try {
    const sourceId = parseInt(req.params.sourceId as string);
    const [source] = await db.select().from(newsSources).where(eq(newsSources.id, sourceId));
    if (!source) {
      res.status(404).json({ error: "Source not found" });
      return;
    }

    const newCount = await fetchSource(source);
    res.json({ success: true, source: source.name, newArticles: newCount });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch feed" });
  }
});

export default router;
