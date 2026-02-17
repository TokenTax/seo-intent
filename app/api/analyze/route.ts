import { NextRequest, NextResponse } from 'next/server';
import { createLLMProvider } from '@/lib/llm/providers/factory';
import { runAnalysis } from '@/lib/analyzer/orchestrator';
import { generateMarkdownReport } from '@/lib/report/markdown';
import { validateAnalysisRequest } from '@/lib/utils/validation';
import { formatErrorResponse } from '@/lib/utils/errors';
import { logger } from '@/lib/utils/logger';

export const maxDuration = 300; // 5 minutes timeout for Vercel

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request
    const body = await request.json();
    const { keyword, targetUrl, model } = validateAnalysisRequest(body);

    logger.info(`Analysis request: keyword="${keyword}", model=${model}`);

    // Create LLM provider
    const llmProvider = createLLMProvider(model);

    // Run analysis
    const report = await runAnalysis(keyword, targetUrl, llmProvider);

    // Generate markdown
    const markdown = generateMarkdownReport(report);

    logger.info(`Analysis completed successfully for keyword="${keyword}"`);

    // Return report
    return NextResponse.json({
      success: true,
      report: {
        ...report,
        markdown,
      },
    });
  } catch (error) {
    logger.error('Analysis failed:', error);

    const errorResponse = formatErrorResponse(error);

    return NextResponse.json(
      {
        success: false,
        ...errorResponse,
      },
      { status: 400 }
    );
  }
}
