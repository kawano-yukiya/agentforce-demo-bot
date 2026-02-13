import type { DataStore, CustomerRecord, DataSchema } from './types';
import { generateSchema } from './parser';

// Simple in-memory store for demo purposes
// In production, use a database or Redis
const dataStores = new Map<string, DataStore>();

export function setData(sessionId: string, records: CustomerRecord[], fileName: string): DataSchema {
  const schema = generateSchema(records);

  dataStores.set(sessionId, {
    records,
    schema,
    uploadedAt: new Date(),
    fileName,
  });

  return schema;
}

export function getData(sessionId: string): DataStore | undefined {
  return dataStores.get(sessionId);
}

export function getRecords(sessionId: string): CustomerRecord[] {
  const store = dataStores.get(sessionId);
  return store?.records ?? [];
}

export function getSchema(sessionId: string): DataSchema | undefined {
  const store = dataStores.get(sessionId);
  return store?.schema;
}

export function deleteData(sessionId: string): boolean {
  return dataStores.delete(sessionId);
}

export function hasData(sessionId: string): boolean {
  return dataStores.has(sessionId);
}

// Generate a unique session ID
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
