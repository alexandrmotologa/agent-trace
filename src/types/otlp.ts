export interface OtlpAnyValue {
  stringValue?: string
  boolValue?: boolean
  intValue?: string | number
  doubleValue?: number
  arrayValue?: {
    values: OtlpAnyValue[]
  }
  kvlistValue?: {
    values: OtlpKeyValue[]
  }
}

export interface OtlpKeyValue {
  key: string
  value: OtlpAnyValue
}

export interface OtlpStatus {
  message?: string
  code?: number
}

export interface OtlpSpan {
  traceId: string
  spanId: string
  parentSpanId?: string
  name: string
  kind?: number
  startTimeUnixNano: string | number
  endTimeUnixNano: string | number
  attributes?: OtlpKeyValue[]
  status?: OtlpStatus
  events?: Array<{
    timeUnixNano: string | number
    name: string
    attributes?: OtlpKeyValue[]
  }>
}

export interface OtlpScopeSpans {
  scope?: {
    name?: string
    version?: string
  }
  spans: OtlpSpan[]
}

export interface OtlpResourceSpans {
  resource?: {
    attributes?: OtlpKeyValue[]
  }
  scopeSpans: OtlpScopeSpans[]
}

export interface OtlpTracePayload {
  resourceSpans: OtlpResourceSpans[]
}
