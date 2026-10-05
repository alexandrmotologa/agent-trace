import type { AgentRun, ModelUsage } from '../types/trace'
import type { ModelCostStats } from '../types/analytics'

export interface ModelPricing {
  promptPricePerMillion: number
  completionPricePerMillion: number
}

export const MODEL_PRICING_TABLE: Record<string, ModelPricing> = {
  // OpenAI
  'gpt-4o': { promptPricePerMillion: 2.5, completionPricePerMillion: 10.0 },
  'gpt-4o-2024-08-06': { promptPricePerMillion: 2.5, completionPricePerMillion: 10.0 },
  'gpt-4o-mini': { promptPricePerMillion: 0.15, completionPricePerMillion: 0.6 },
  'gpt-4-turbo': { promptPricePerMillion: 10.0, completionPricePerMillion: 30.0 },
  'o1': { promptPricePerMillion: 15.0, completionPricePerMillion: 60.0 },
  'o1-mini': { promptPricePerMillion: 3.0, completionPricePerMillion: 12.0 },
  'o3-mini': { promptPricePerMillion: 1.1, completionPricePerMillion: 4.4 },

  // Anthropic
  'claude-3-5-sonnet': { promptPricePerMillion: 3.0, completionPricePerMillion: 15.0 },
  'claude-3-5-sonnet-20241022': { promptPricePerMillion: 3.0, completionPricePerMillion: 15.0 },
  'claude-3-5-haiku': { promptPricePerMillion: 0.8, completionPricePerMillion: 4.0 },
  'claude-3-opus': { promptPricePerMillion: 15.0, completionPricePerMillion: 75.0 },

  // Google Gemini
  'gemini-1.5-pro': { promptPricePerMillion: 1.25, completionPricePerMillion: 5.0 },
  'gemini-1.5-flash': { promptPricePerMillion: 0.075, completionPricePerMillion: 0.3 },
  'gemini-2.0-flash': { promptPricePerMillion: 0.1, completionPricePerMillion: 0.4 },
  'gemini-2.0-flash-exp': { promptPricePerMillion: 0.1, completionPricePerMillion: 0.4 },

  // DeepSeek
  'deepseek-chat': { promptPricePerMillion: 0.14, completionPricePerMillion: 0.28 },
  'deepseek-v3': { promptPricePerMillion: 0.14, completionPricePerMillion: 0.28 },
  'deepseek-reasoner': { promptPricePerMillion: 0.55, completionPricePerMillion: 2.19 },
  'deepseek-r1': { promptPricePerMillion: 0.55, completionPricePerMillion: 2.19 },

  // Local / Self-hosted
  'llama3': { promptPricePerMillion: 0.0, completionPricePerMillion: 0.0 },
  'llama3.1': { promptPricePerMillion: 0.0, completionPricePerMillion: 0.0 },
  'mistral': { promptPricePerMillion: 0.0, completionPricePerMillion: 0.0 },
  'local': { promptPricePerMillion: 0.0, completionPricePerMillion: 0.0 },
}

export function findModelPricing(rawModelName?: string): ModelPricing {
  if (!rawModelName) {
    return { promptPricePerMillion: 1.0, completionPricePerMillion: 3.0 }
  }

  const normalized = rawModelName.toLowerCase().trim()

  for (const [key, pricing] of Object.entries(MODEL_PRICING_TABLE)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return pricing
    }
  }

  if (normalized.includes('gpt-4')) {
    return MODEL_PRICING_TABLE['gpt-4o']
  }
  if (normalized.includes('claude')) {
    return MODEL_PRICING_TABLE['claude-3-5-sonnet']
  }
  if (normalized.includes('gemini')) {
    return MODEL_PRICING_TABLE['gemini-1.5-flash']
  }
  if (normalized.includes('deepseek')) {
    return MODEL_PRICING_TABLE['deepseek-chat']
  }

  return { promptPricePerMillion: 1.0, completionPricePerMillion: 3.0 }
}

export function calculateModelCost(
  modelName: string | undefined,
  promptTokens: number,
  completionTokens: number
): number {
  const pricing = findModelPricing(modelName)
  const promptCost = (promptTokens / 1_000_000) * pricing.promptPricePerMillion
  const completionCost = (completionTokens / 1_000_000) * pricing.completionPricePerMillion
  return Number((promptCost + completionCost).toFixed(6))
}

export function calculateUsageCost(modelName: string | undefined, usage?: ModelUsage): number {
  if (!usage) return 0
  if (usage.costEstimateUsd !== undefined) return usage.costEstimateUsd
  return calculateModelCost(modelName, usage.promptTokens, usage.completionTokens)
}

export function computeRunCostBreakdown(run: AgentRun): ModelCostStats[] {
  const map = new Map<string, ModelCostStats>()

  for (const span of run.spans) {
    if (span.type !== 'llm_call' || !span.modelUsage) continue
    const model = span.modelName || 'unknown'
    const existing = map.get(model) || {
      modelName: model,
      callCount: 0,
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      totalCostUsd: 0,
    }

    const cost = span.modelUsage.costEstimateUsd ?? calculateModelCost(
      model,
      span.modelUsage.promptTokens,
      span.modelUsage.completionTokens
    )

    existing.callCount += 1
    existing.promptTokens += span.modelUsage.promptTokens
    existing.completionTokens += span.modelUsage.completionTokens
    existing.totalTokens += span.modelUsage.totalTokens
    existing.totalCostUsd = Number((existing.totalCostUsd + cost).toFixed(6))

    map.set(model, existing)
  }

  return Array.from(map.values())
}
