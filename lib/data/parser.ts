import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import type { CustomerRecord, DataSchema } from './types';

export async function parseFile(file: File): Promise<CustomerRecord[]> {
  const extension = file.name.split('.').pop()?.toLowerCase();

  if (extension === 'csv') {
    return parseCSV(file);
  } else if (extension === 'xlsx' || extension === 'xls') {
    return parseExcel(file);
  }

  throw new Error('サポートされていないファイル形式です。CSV または Excel ファイルをアップロードしてください。');
}

async function parseCSV(file: File): Promise<CustomerRecord[]> {
  const text = await file.text();
  const result = Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
  });

  if (result.errors.length > 0) {
    console.warn('CSV parse warnings:', result.errors);
  }

  return result.data as CustomerRecord[];
}

async function parseExcel(file: File): Promise<CustomerRecord[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json<CustomerRecord>(worksheet);
}

function inferType(values: (string | number | boolean | null | undefined)[]): 'string' | 'number' | 'date' | 'boolean' {
  const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');

  if (nonNullValues.length === 0) return 'string';

  // Check if all values are numbers
  if (nonNullValues.every(v => typeof v === 'number' || !isNaN(Number(v)))) {
    return 'number';
  }

  // Check if all values are booleans
  if (nonNullValues.every(v => typeof v === 'boolean' || v === 'true' || v === 'false')) {
    return 'boolean';
  }

  // Check if values look like dates
  const datePattern = /^\d{4}[-/]\d{1,2}[-/]\d{1,2}/;
  if (nonNullValues.every(v => typeof v === 'string' && datePattern.test(v))) {
    return 'date';
  }

  return 'string';
}

export function generateSchema(records: CustomerRecord[]): DataSchema {
  if (records.length === 0) {
    return { columns: [], totalRows: 0 };
  }

  const firstRecord = records[0];
  const columns = Object.keys(firstRecord).map(key => ({
    name: key,
    type: inferType(records.slice(0, 100).map(r => r[key])),
    sampleValues: records.slice(0, 3).map(r => String(r[key] ?? '')),
  }));

  return { columns, totalRows: records.length };
}
