# Shipwright SEO Strategy

## Target Keywords (Priority Order)

| Keyword | Monthly Volume | Competition | Intent |
|---------|---------------|-------------|--------|
| "github repo to vercel" | ~1,200 | Low | High |
| "auto generate readme github" | ~800 | Low | High |
| "deploy github repo automatically" | ~600 | Medium | High |
| "generate vercel config" | ~400 | Low | High |
| "github repo landing page generator" | ~200 | Very Low | High |
| "ship side project fast" | ~150 | Low | Medium |
| "indie dev deployment tool" | ~100 | Low | Medium |

## On-Page SEO (Implement in app/layout.tsx)

```tsx
export const metadata: Metadata = {
  title: "Shipwright — Turn GitHub Repos Into Live Products in Minutes",
  description: "Analyze any GitHub repo and instantly generate Vercel configs, README files, landing pages, and .env templates — packaged as a pull request. $5/repo or $15/month unlimited.",
  openGraph: {
    title: "Shipwright — From GitHub to Deployed in 15 Minutes",
    description: "AI-powered deployment configs, README, and landing page for your GitHub repos. One PR. Done.",
    url: "https://shipwright.app",
    siteName: "Shipwright",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Shipwright — Turn GitHub Repos Into Live Products",
    description: "AI-generated deployment configs, README, and landing page. One PR. Ship your dormant repos.",
    creator: "@vpkdevs",
  },
  keywords: ["github deployment", "vercel config generator", "readme generator", "deploy github repo", "side project tools"],
};
```

## Technical SEO Checklist
- [ ] Add /public/robots.txt (see below)
- [ ] Add /public/sitemap.xml (see below)
- [ ] Add metadata to app/layout.tsx (see above)
- [ ] Create /public/og-image.png (1200×630, dark background with Shipwright logo + tagline)

## robots.txt (save to /public/robots.txt)
```
User-agent: *
Allow: /
Disallow: /api/
Disallow: /repos/

Sitemap: https://shipwright.app/sitemap.xml
```

## sitemap.xml (save to /public/sitemap.xml — update domain)
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://shipwright.app/</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>
  <url><loc>https://shipwright.app/pricing</loc><changefreq>monthly</changefreq><priority>0.9</priority></url>
  <url><loc>https://shipwright.app/terms</loc><changefreq>yearly</changefreq><priority>0.3</priority></url>
  <url><loc>https://shipwright.app/privacy</loc><changefreq>yearly</changefreq><priority>0.3</priority></url>
</urlset>
```

## Content SEO (Future Blog Posts)
1. "How to generate a vercel.json for any Next.js project" — targets "vercel config" searchers
2. "Why your GitHub side projects never get deployed (and how to fix it)" — evergreen
3. "Automated README generation: what works and what doesn't" — technical, backlink-worthy
4. "From npm to deployed: the complete 2026 Next.js deployment guide" — high volume

## Link Building
- Submit to: https://www.producthunt.com (day 1)
- List on: https://www.tooolshunt.com, https://devhunt.org, https://saashub.com
- Add to: awesome-github-tools, awesome-developer-tools curated lists
- Write for: dev.to, Hashnode — "How I built Shipwright" post with backlink
