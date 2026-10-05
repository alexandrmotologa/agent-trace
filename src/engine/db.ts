import { openDB, type IDBPDatabase } from 'idb'
import type { AgentRun } from '../types/trace'

export interface SavedTraceRecord {
  runId: string
  name: string
  timestamp: number
  framework?: string
  totalTokens: number
  totalCostUsd: number
  durationMs: number
  status: 'success' | 'error' | 'in_progress'
  tags: string[]
  isFavorite: boolean
  notes?: string
  run: AgentRun
}

const DB_NAME = 'agent-trace-db'
const DB_VERSION = 1
const STORE_NAME = 'saved_traces'

let dbPromise: Promise<IDBPDatabase> | null = null

function getDB(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'runId' })
          store.createIndex('timestamp', 'timestamp')
          store.createIndex('isFavorite', 'isFavorite')
        }
      },
    })
  }
  return dbPromise
}

export async function saveTraceRecord(
  run: AgentRun,
  tags: string[] = [],
  notes = ''
): Promise<void> {
  const db = await getDB()
  const existing = await db.get(STORE_NAME, run.runId)

  const record: SavedTraceRecord = {
    runId: run.runId,
    name: run.name,
    timestamp: existing?.timestamp || Date.now(),
    framework: run.framework || 'custom',
    totalTokens: run.totalTokens,
    totalCostUsd: run.totalCostUsd,
    durationMs: run.durationMs,
    status: run.status,
    tags: existing?.tags && existing.tags.length > 0 ? existing.tags : tags,
    isFavorite: existing?.isFavorite || false,
    notes: notes || existing?.notes || '',
    run,
  }

  await db.put(STORE_NAME, record)
}

export async function getAllTraceRecords(): Promise<SavedTraceRecord[]> {
  const db = await getDB()
  const all = await db.getAll(STORE_NAME)
  return all.sort((a, b) => b.timestamp - a.timestamp)
}

export async function deleteTraceRecord(runId: string): Promise<void> {
  const db = await getDB()
  await db.delete(STORE_NAME, runId)
}

export async function toggleFavoriteTraceRecord(runId: string): Promise<boolean> {
  const db = await getDB()
  const record = await db.get(STORE_NAME, runId)
  if (!record) return false

  record.isFavorite = !record.isFavorite
  await db.put(STORE_NAME, record)
  return record.isFavorite
}

export async function updateTraceTags(runId: string, tags: string[]): Promise<void> {
  const db = await getDB()
  const record = await db.get(STORE_NAME, runId)
  if (!record) return

  record.tags = tags
  await db.put(STORE_NAME, record)
}
