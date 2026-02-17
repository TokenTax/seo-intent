import { NextResponse } from 'next/server';

export async function GET() {
  const serpApiKey = process.env.SERPAPI_API_KEY;
  const redisUrl = process.env.REDIS_URL;
  const useRedis = !!redisUrl || process.env.USE_REDIS_CACHE === 'true';

  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: {
      hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
      hasOpenAIKey: !!process.env.OPENAI_API_KEY,
      hasSerpAPIKey: !!serpApiKey,
      hasScrapingBeeKey: !!process.env.SCRAPINGBEE_API_KEY,
      serpApiKeyPreview: serpApiKey ? `${serpApiKey.substring(0, 8)}...${serpApiKey.substring(serpApiKey.length - 4)}` : 'NOT SET',
      cacheType: useRedis ? 'redis' : 'file',
      cacheEnabled: process.env.ENABLE_SERP_CACHE !== 'false',
      scrapeCache: process.env.ENABLE_SCRAPE_CACHE !== 'false',
      scrapingBeeEnabled: process.env.USE_SCRAPINGBEE === 'true',
      nodeEnv: process.env.NODE_ENV,
    },
  };

  return NextResponse.json(health);
}
