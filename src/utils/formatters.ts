export function formatDuration(ms?: number): string {
  if (!ms || isNaN(ms) || ms < 1) return '<1ms'
  if (ms < 1000) return `${Math.round(ms)}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`
  const minutes = Math.floor(ms / 60000)
  const seconds = ((ms % 60000) / 1000).toFixed(1)
  return `${minutes}m ${seconds}s`
}

export function formatTokens(tokens?: number): string {
  if (!tokens || isNaN(tokens)) return '0'
  if (tokens >= 1_000_000) {
    return `${(tokens / 1_000_000).toFixed(2)}M`
  }
  if (tokens >= 10_000) {
    return `${(tokens / 1_000).toFixed(1)}k`
  }
  return tokens.toLocaleString()
}

export function formatCost(usd?: number): string {
  if (!usd || isNaN(usd) || usd === 0) return '$0.00'
  if (usd < 0.0001) return `<$0.0001`
  if (usd < 0.01) return `$${usd.toFixed(4)}`
  return `$${usd.toFixed(3)}`
}

export function formatTimestamp(ms?: number): string {
  if (!ms || isNaN(ms) || ms < 1000) return `+${Math.round(ms || 0)}ms`
  return `+${(ms / 1000).toFixed(2)}s`
}
