export interface CustomerRecord {
  [key: string]: string | number | boolean | null | undefined;
}

export interface DataSchema {
  columns: {
    name: string;
    type: 'string' | 'number' | 'date' | 'boolean';
    sampleValues: string[];
  }[];
  totalRows: number;
}

export interface DataStore {
  records: CustomerRecord[];
  schema: DataSchema;
  uploadedAt: Date;
  fileName: string;
}

export interface UploadResponse {
  success: boolean;
  sessionId: string;
  schema: DataSchema;
  recordCount: number;
  message: string;
}

export interface SearchResult {
  records: CustomerRecord[];
  totalMatches: number;
}
