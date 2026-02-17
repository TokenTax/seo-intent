# Caching Summary

## Quick Answer

**Local Development**: File cache (automatic, no setup)
**Production Hosting**: Redis cache (requires setup)

---

## How It Works

The app **automatically selects** the right cache:

```
if REDIS_URL is set:
  → Use Redis (production)
else:
  → Use file cache (development)
```

**No code changes needed!**

---

## Local Development

Your current setup is perfect:

```env
# .env (local)
CACHE_DIR=.cache
ENABLE_SERP_CACHE=true
ENABLE_SCRAPE_CACHE=true
```

**Status**: ✅ Working now
**Cost**: $0
**Setup**: None required

---

## Production (Required for Hosting)

You **must** add Redis:

```env
# .env (production)
REDIS_URL=redis://your-redis-url
ENABLE_SERP_CACHE=true
ENABLE_SCRAPE_CACHE=true
```

**Status**: 🚀 Required for deployment
**Cost**: Free tier available (Upstash: 10k/day free)
**Setup**: 5 minutes

---

## Why Redis for Production?

| Platform | File Cache Works? | Why? |
|----------|-------------------|------|
| **Local** | ✅ Yes | You have a real filesystem |
| **Vercel** | ❌ No | Functions are stateless, no persistent storage |
| **Netlify** | ❌ No | Serverless, ephemeral filesystem |
| **AWS Lambda** | ❌ No | Functions don't share storage |
| **Docker** | ⚠️ Maybe | Works on single instance, fails when scaling |
| **VPS** | ✅ Yes | Only if you run one server (not recommended) |

**Bottom line**: For any serverless or multi-instance deployment → Need Redis

---

## Setup Redis (5 minutes)

### Option 1: Upstash (Easiest)

1. Go to [upstash.com](https://upstash.com/)
2. Create account (free)
3. Create Redis database
4. Copy Redis URL
5. Add to production env: `REDIS_URL=redis://...`

**Free tier**: 10,000 commands/day
**Perfect for**: Vercel, Netlify, hobby projects

### Option 2: Vercel KV (If using Vercel)

1. In Vercel dashboard → Storage → Create KV
2. URL is auto-added to environment variables
3. Done!

**Free tier**: Included with Vercel
**Perfect for**: Vercel deployments

---

## What Gets Cached?

### 1. Search Results (SerpAPI)
- **Key**: `serp:{keyword}:{date}`
- **Size**: ~5KB per keyword
- **TTL**: 24 hours
- **Savings**: $0.01-0.03 per cached search

### 2. Scraped Pages (ScrapingBee)
- **Key**: `page:{url_hash}:{date}`
- **Size**: ~50KB per page
- **TTL**: 24 hours
- **Savings**: $0.01-0.02 per cached page

### Daily Cache Usage Example

100 analyses per day:
- 100 keywords × 5KB = 500KB (search cache)
- 600 pages × 50KB = 30MB (page cache)
- **Total**: ~30MB

**Cost**: Free on all Redis providers! 🎉

---

## Cost Comparison

### Without Caching
- Every analysis: Full API costs
- 100 analyses/day: ~$27/day = $810/month
- **Redis cost**: N/A

### With Caching (Local Only)
- ❌ **Doesn't work in production**
- Only works on your laptop

### With Redis Caching (Production)
- First analysis: Full API costs
- Repeat analyses: Only LLM costs
- 100 analyses/day (50% repeats): ~$14/day = $420/month
- **Redis cost**: $0 (free tier)
- **Savings**: $390/month (48%)

---

## Verification

### Check Current Cache Type

Visit: `http://localhost:3000/api/health` or `https://your-app.com/api/health`

**Local** (file cache):
```json
{
  "status": "ok",
  "env": {
    "cacheType": "file"
  }
}
```

**Production** (Redis cache):
```json
{
  "status": "ok",
  "env": {
    "cacheType": "redis"
  }
}
```

---

## TL;DR

✅ **Local**: File cache works (already set up)
🚀 **Production**: Need Redis (5-min setup)
💰 **Cost**: Free tier available
📖 **Guide**: See [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md)

**Action needed**: Add `REDIS_URL` before deploying to production.
