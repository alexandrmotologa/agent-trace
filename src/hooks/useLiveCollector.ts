import { useEffect, useState } from 'react'
import { useTraceStore } from '../store/traceStore'
import { normalizeTraceData } from '../engine/normalizer'

export function useLiveCollector() {
  const loadRun = useTraceStore((state) => state.loadRun)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    let eventSource: EventSource | null = null

    try {
      eventSource = new EventSource('http://localhost:4318/events')

      eventSource.onopen = () => {
        setIsConnected(true)
      }

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.type === 'trace' && data.payload) {
            const normalized = normalizeTraceData(data.payload)
            loadRun(normalized)
          }
        } catch (err) {
          console.error('[LiveCollector] Error parsing incoming trace event:', err)
        }
      }

      eventSource.onerror = () => {
        setIsConnected(false)
      }
    } catch {
      setIsConnected(false)
    }

    return () => {
      if (eventSource) {
        eventSource.close()
      }
    }
  }, [loadRun])

  return { isConnected }
}
