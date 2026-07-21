import "dotenv/config";
import express from "express";
import { createServer as createHttpServer } from "http";
import path from "path";
import fs from "fs";
import compression from "compression";
import helmet from "helmet";
import cron from "node-cron";
import { createServer as createViteServer } from "vite";
import { generateDailyBrief } from "./server/briefGenerator";
import { listBriefDates, listBriefs, loadBrief, loadLatestBrief } from "./server/briefStore";

const ROOT = process.cwd();
const PORT = Number(process.env.PORT) || 3001;
const SITE_URL = (process.env.SITE_URL || "https://marketprophets.io").replace(/\/$/, "");
const isProd = process.env.NODE_ENV === "production";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function injectMeta(html: string, meta: { title: string; description: string; path: string }): string {
  const url = `${SITE_URL}${meta.path}`;
  const tags = `
    <title>${escapeHtml(meta.title)}</title>
    <meta name="description" content="${escapeHtml(meta.description)}" />
    <meta property="og:title" content="${escapeHtml(meta.title)}" />
    <meta property="og:description" content="${escapeHtml(meta.description)}" />
    <meta property="og:url" content="${escapeHtml(url)}" />
    <meta property="og:type" content="article" />
    <link rel="canonical" href="${escapeHtml(url)}" />
  `;
  return html.replace(/<title>.*?<\/title>/i, "").replace("</head>", `${tags}</head>`);
}

async function start() {
  const app = express();
  const httpServer = createHttpServer(app);

  app.use(compression());
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    })
  );
  app.use(express.json({ limit: "256kb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, service: "market-prophets", site: SITE_URL });
  });

  app.get("/api/briefs", (_req, res) => {
    const briefs = listBriefs(60).map((b) => ({
      editionDate: b.editionDate,
      headline: b.headline,
      summary: b.summary,
      generatedAt: b.generatedAt,
    }));
    res.json({ briefs });
  });

  app.get("/api/briefs/latest", (_req, res) => {
    const brief = loadLatestBrief();
    if (!brief) return res.status(404).json({ error: "No editions published yet." });
    res.json(brief);
  });

  app.get("/api/briefs/:date", (req, res) => {
    const brief = loadBrief(req.params.date);
    if (!brief) return res.status(404).json({ error: "Edition not found." });
    res.json(brief);
  });

  app.post("/api/brief/generate", async (req, res) => {
    const secret = process.env.BRIEF_CRON_SECRET?.trim();
    const header = req.get("x-brief-secret") ?? req.get("authorization")?.replace(/^Bearer\s+/i, "");
    if (secret && header !== secret) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const result = await generateDailyBrief();
    if (!result.ok) {
      return res.status(500).json({ error: result.error });
    }
    res.json({ ok: true, editionDate: result.brief.editionDate, headline: result.brief.headline });
  });

  app.get("/sitemap.xml", (_req, res) => {
    const dates = listBriefDates();
    const urls = [
      { loc: "/", priority: "1.0" },
      { loc: "/brief/latest", priority: "0.9" },
      { loc: "/archive", priority: "0.8" },
      ...dates.map((d) => ({ loc: `/brief/${d}`, priority: "0.7" })),
    ];
    const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url><loc>${SITE_URL}${u.loc}</loc><changefreq>daily</changefreq><priority>${u.priority}</priority></url>`
  )
  .join("\n")}
</urlset>`;
    res.type("application/xml").send(body);
  });

  app.get("/robots.txt", (_req, res) => {
    res.type("text/plain").send(`User-agent: *\nAllow: /\nSitemap: ${SITE_URL}/sitemap.xml\n`);
  });

  let templateHtml = "";

  if (!isProd) {
    const vite = await createViteServer({
      root: ROOT,
      server: { middlewareMode: true },
      appType: "custom",
    });
    app.use(vite.middlewares);
    templateHtml = fs.readFileSync(path.resolve(ROOT, "index.html"), "utf8");
    app.use("*", async (req, res, next) => {
      try {
        const url = req.originalUrl;
        let html = templateHtml;
        html = await vite.transformIndexHtml(url, html);
        if (url.startsWith("/brief/")) {
          const date = url.split("/brief/")[1]?.split("?")[0];
          const brief =
            date === "latest" ? loadLatestBrief() : date ? loadBrief(date) : null;
          if (brief) {
            html = injectMeta(html, {
              title: `${brief.headline} | Market Prophets`,
              description: brief.summary.slice(0, 160),
              path: `/brief/${brief.editionDate}`,
            });
          }
        }
        res.status(200).set({ "Content-Type": "text/html" }).end(html);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    const clientDir = path.resolve(ROOT, "dist/client");
    app.use(express.static(clientDir, { index: false }));
    templateHtml = fs.readFileSync(path.join(clientDir, "index.html"), "utf8");
    app.use("*", (req, res) => {
      let html = templateHtml;
      const url = req.originalUrl;
      if (url.startsWith("/brief/")) {
        const date = url.split("/brief/")[1]?.split("?")[0];
        const brief = date === "latest" ? loadLatestBrief() : date ? loadBrief(date) : null;
        if (brief) {
          html = injectMeta(html, {
            title: `${brief.headline} | Market Prophets`,
            description: brief.summary.slice(0, 160),
            path: `/brief/${brief.editionDate}`,
          });
        }
      } else if (url === "/" || url.startsWith("/?")) {
        html = injectMeta(html, {
          title: "Market Prophets — Daily market brief",
          description: "AI-assisted daily market brief from public sources. Educational summaries, not investment advice.",
          path: "/",
        });
      }
      res.status(200).set({ "Content-Type": "text/html" }).end(html);
    });
  }

  if (process.env.BRIEF_INTERNAL_CRON === "true") {
    cron.schedule(
      "0 11 * * *",
      async () => {
        console.log("[Cron] Generating daily Market Prophets brief…");
        const result = await generateDailyBrief();
        if (result.ok) {
          console.log(`[Cron] Published ${result.brief.editionDate}: ${result.brief.headline}`);
        } else {
          console.error("[Cron] Failed:", result.error);
        }
      },
      { timezone: "America/New_York" }
    );
    console.log("[Cron] Internal daily brief scheduled for 6:00 AM ET");
  }

  httpServer.listen(PORT, () => {
    console.log(`Market Prophets running at http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
