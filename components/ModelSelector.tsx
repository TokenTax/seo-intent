'use client';

import { LLMModel } from '@/lib/llm/types';

interface ModelSelectorProps {
  value: LLMModel;
  onChange: (model: LLMModel) => void;
}

export default function ModelSelector({ value, onChange }: ModelSelectorProps) {
  return (
    <div>
      <label htmlFor="model" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        LLM Model
      </label>
      <select
        id="model"
        value={value}
        onChange={(e) => onChange(e.target.value as LLMModel)}
        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
      >
        <optgroup label="Anthropic Claude">
          <option value="claude-opus-4-5">Claude Opus 4.5 (Most Powerful)</option>
          <option value="claude-sonnet-4-5">Claude Sonnet 4.5 (Recommended)</option>
          <option value="claude-haiku-4-5">Claude Haiku 4.5 (Fastest)</option>
        </optgroup>
        <optgroup label="OpenAI GPT">
          <option value="gpt-4-turbo">GPT-4 Turbo</option>
          <option value="gpt-4">GPT-4</option>
          <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
        </optgroup>
      </select>
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        Choose the AI model to analyze your content. Sonnet offers the best balance of quality and speed.
      </p>
    </div>
  );
}
