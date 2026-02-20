import { NextRequest } from 'next/server';
import { createLLMProvider } from '@/lib/llm/providers/factory';
import { runAnalysis } from '@/lib/analyzer/orchestrator';
import { generateMarkdownReport } from '@/lib/report/markdown';
import { validateAnalysisRequest } from '@/lib/utils/validation';
import { formatErrorResponse } from '@/lib/utils/errors';
import { logger } from '@/lib/utils/logger';
import { LLMModel } from '@/lib/llm/types';

export const maxDuration = 300; // 5 minutes timeout for Vercel

export async function POST(request: NextRequest) {
  // Parse and validate request
  let keyword: string;
  let targetUrl: string;
  let model: LLMModel;

  try {
    const body = await request.json();
    const validated = validateAnalysisRequest(body);
    keyword = validated.keyword;
    targetUrl = validated.targetUrl;
    model = validated.model;
  } catch (error) {
    logger.error('Validation failed:', error);
    const errorResponse = formatErrorResponse(error);
    return new Response(
      JSON.stringify({ success: false, ...errorResponse }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  logger.info(`Analysis request: keyword="${keyword}", model=${model}`);

  // Create a TransformStream for SSE
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  // Helper to send SSE events
  const sendEvent = async (event: string, data: object) => {
    const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    await writer.write(encoder.encode(message));
  };

  // Run analysis in background
  (async () => {
    try {
      // Create LLM provider
      const llmProvider = createLLMProvider(model);

      // Run analysis with progress callback
      const report = await runAnalysis(
        keyword,
        targetUrl,
        llmProvider,
        async (stage: string, progress: number) => {
          await sendEvent('progress', { stage, progress });
        }
      );

      // Generate markdown
      const markdown = generateMarkdownReport(report);

      logger.info(`Analysis completed successfully for keyword="${keyword}"`);

      // Send completion event
      await sendEvent('complete', {
        success: true,
        report: {
          ...report,
          markdown,
        },
      });
    } catch (error) {
      logger.error('Analysis failed:', error);
      const errorResponse = formatErrorResponse(error);
      await sendEvent('error', {
        success: false,
        ...errorResponse,
      });
    } finally {
      await writer.close();
    }
  })();

  // Return SSE stream
  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
