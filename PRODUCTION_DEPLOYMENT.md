# Production Deployment Guide

## Caching Strategy for Production

⚠️ **IMPORTANT**: The file-based cache (`CACHE_DIR=.cache`) **only works in local development**. For production hosting, you **must use Redis**.

## Why File Cache Doesn't Work in Production

### Serverless Platforms (Vercel, Netlify, AWS Lambda)
- ❌ **Ephemeral filesystem** - Files written during execution are deleted after the function completes
- ❌ **Read-only filesystem** - Can't write to most directories
- ❌ **No persistence** - Each request starts with a clean slate
- ❌ **No sharing** - Multiple function instances can't share files

### Container Platforms (Docker, Kubernetes)
- ❌ **Container restarts** - Filesystem resets when container is recreated
- ❌ **No shared storage** - Each pod/container has its own filesystem
- ⚠️ **Persistent volumes** - Possible but complex, doesn't scale horizontally

### Multi-Server Deployments
- ❌ **Isolated caches** - Each server has its own cache
- ❌ **Cache misses** - Users hit different servers randomly
- ❌ **No synchronization** - Caches can't communicate

## ✅ Solution: Use Redis

Redis provides:
- ✅ **Persistent storage** across all instances
- ✅ **Shared cache** - All servers access the same cache
- ✅ **Fast** - In-memory storage with millisecond latency
- ✅ **Scalable** - Works with any number of instances
- ✅ **Serverless-friendly** - Works perfectly with Vercel, Lambda, etc.

---

## Redis Setup Options

### Option 1: Upstash Redis (Recommended - Easiest)

**Best for**: Vercel, serverless deployments, hobby projects

**Why Upstash**:
- ✅ Free tier: 10,000 commands/day
- ✅ Serverless-optimized (HTTP REST API)
- ✅ Global edge caching
- ✅ No connection pooling issues
- ✅ Pay-per-request pricing

**Setup**:
1. Sign up at [upstash.com](https://upstash.com/)
2. Create a new Redis database
3. Copy the `UPSTASH_REDIS_REST_URL`
4. Add to `.env`:
   ```env
   REDIS_URL=redis://default:YOUR_PASSWORD@YOUR_HOST:6379
   ```
   Or use Upstash REST API:
   ```env
   REDIS_URL=https://YOUR_ENDPOINT.upstash.io
   ```

**Cost**: Free for 10k requests/day, then $0.20 per 100k requests

---

### Option 2: Vercel KV (For Vercel Deployments)

**Best for**: Projects deployed on Vercel

**Why Vercel KV**:
- ✅ Integrated with Vercel (one-click setup)
- ✅ Powered by Upstash
- ✅ Automatic connection handling
- ✅ Generous free tier

**Setup**:
1. In Vercel project dashboard → Storage → Create KV Database
2. Environment variables are automatically added
3. Use the provided `KV_REST_API_URL` as your `REDIS_URL`

**Cost**: Free tier included with Vercel account

---

### Option 3: Redis Cloud

**Best for**: Production applications, larger scale

**Why Redis Cloud**:
- ✅ Official Redis service
- ✅ Free tier: 30MB storage
- ✅ High availability options
- ✅ Global deployment

**Setup**:
1. Sign up at [redis.com/cloud](https://redis.com/try-free/)
2. Create a new database
3. Get connection string
4. Add to `.env`:
   ```env
   REDIS_URL=redis://default:password@redis-12345.c123.us-east-1-1.ec2.cloud.redislabs.com:12345
   ```

**Cost**: Free 30MB tier, paid plans start at $5/month

---

### Option 4: AWS ElastiCache (For AWS Deployments)

**Best for**: Large-scale production on AWS

**Setup**:
1. Create ElastiCache Redis cluster in AWS Console
2. Note the endpoint URL
3. Add to `.env`:
   ```env
   REDIS_URL=redis://your-cluster.cache.amazonaws.com:6379
   ```

**Cost**: Starts at ~$15/month for cache.t3.micro

---

## Configuration

### Environment Variables

Add to your `.env` or hosting platform environment variables:

```env
# Required: Redis connection URL
REDIS_URL=redis://username:password@host:port

# Optional: Explicitly enable Redis cache (auto-enabled if REDIS_URL is set)
USE_REDIS_CACHE=true

# Cache TTL settings (same for both file and Redis cache)
ENABLE_SERP_CACHE=true
SERP_CACHE_TTL_HOURS=24
ENABLE_SCRAPE_CACHE=true
SCRAPE_CACHE_TTL_HOURS=24
```

### How It Works

The app **automatically detects** which cache to use:

```typescript
// Automatic selection
if (REDIS_URL is set) {
  → Use Redis cache (production)
} else {
  → Use file cache (local development)
}
```

No code changes needed! Just set `REDIS_URL` and deploy.

---

## Deployment Platforms

### Vercel Deployment

1. **Create Vercel KV database**:
   ```bash
   vercel link
   vercel storage create kv
   ```

2. **Environment variables are auto-added** ✅

3. **Deploy**:
   ```bash
   vercel deploy --prod
   ```

### Netlify Deployment

1. **Add Redis URL** in Netlify dashboard → Environment variables:
   ```
   REDIS_URL=your_upstash_or_redis_cloud_url
   ```

2. **Add all other env vars** (API keys, cache settings)

3. **Deploy**:
   ```bash
   netlify deploy --prod
   ```

### Docker/Railway/Render

1. **Add environment variables** in platform dashboard

2. **Redis URL** from Upstash or Redis Cloud

3. **Deploy** as usual

---

## Testing Redis Cache

### Verify Redis Connection

Check the `/api/health` endpoint after deployment:

```bash
curl https://your-app.vercel.app/api/health
```

Should show:
```json
{
  "status": "ok",
  "cache": "redis",
  "cacheConnected": true
}
```

### Test Cache Functionality

1. Run first analysis → Should see:
   ```
   [CacheFactory] Using Redis cache for production
   [SerpAPI] Fetching results...
   [Extractor] Extracting data...
   ```

2. Run same analysis again → Should see:
   ```
   [SerpAPI] Cache hit...
   [Extractor] Cache hit...
   ```

---

## Cost Comparison

### Development (File Cache)
- **Cost**: $0 (free local storage)
- **Works**: ✅ Local only
- **Production**: ❌ Won't work

### Production with Redis

| Provider | Free Tier | Paid Plans | Best For |
|----------|-----------|------------|----------|
| **Upstash** | 10k req/day | $0.20/100k req | Serverless, Vercel |
| **Vercel KV** | Included | Included | Vercel projects |
| **Redis Cloud** | 30MB | $5/mo+ | Production apps |
| **ElastiCache** | None | $15/mo+ | Enterprise AWS |

### Monthly Cost Estimate

**Low usage** (10 analyses/day):
- Cache operations: ~300/day × 30 = 9,000/month
- **Upstash**: Free tier ✅
- **Vercel KV**: Free tier ✅

**Medium usage** (100 analyses/day):
- Cache operations: ~3,000/day × 30 = 90,000/month
- **Upstash**: Free tier ✅
- **Vercel KV**: Free tier ✅

**High usage** (1000 analyses/day):
- Cache operations: ~30,000/day × 30 = 900,000/month
- **Upstash**: ~$1.80/month
- **Redis Cloud**: ~$5/month

---

## Migration from File Cache

If you're already using file cache locally:

1. **Add Redis URL** to `.env`
2. **Restart server** → Automatically switches to Redis
3. **Old file cache** is ignored (`.cache/` directory no longer used in production)
4. **No data migration needed** - Cache rebuilds naturally

---

## Troubleshooting

### "Failed to connect to Redis"
- ✅ Check `REDIS_URL` is correct
- ✅ Check Redis service is running
- ✅ Check firewall/security group allows connections
- ✅ For Upstash: Use REST URL, not connection string

### "Cache not working in production"
- ✅ Verify `REDIS_URL` is set in production environment
- ✅ Check `/api/health` shows Redis cache
- ✅ Look at server logs for Redis errors

### "Redis connection timeout"
- ✅ Use connection pooling (already configured)
- ✅ Increase `maxRetriesPerRequest` in redis-cache.ts
- ✅ Consider upgrading Redis plan for more connections

---

## Summary

### Local Development
```env
# No REDIS_URL = uses file cache automatically
CACHE_DIR=.cache
```

### Production Deployment
```env
# Add REDIS_URL = uses Redis cache automatically
REDIS_URL=redis://your-redis-url
```

**That's it!** The app handles everything else automatically. 🚀

---

## Quick Start Checklist

- [ ] Sign up for Upstash or Vercel KV
- [ ] Create Redis database
- [ ] Copy Redis URL
- [ ] Add `REDIS_URL` to production environment variables
- [ ] Deploy application
- [ ] Test `/api/health` endpoint
- [ ] Run analysis and verify caching works
- [ ] Monitor Redis usage in dashboard

**Need help?** Open an issue on GitHub!
