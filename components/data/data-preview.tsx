'use client';

import { Database } from 'lucide-react';
import type { DataSchema } from '@/lib/data/types';

interface DataPreviewProps {
  schema: DataSchema;
}

export function DataPreview({ schema }: DataPreviewProps) {
  if (schema.columns.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 space-y-3">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Database className="h-4 w-4" />
        <span>{schema.totalRows}件のデータ</span>
      </div>

      <div className="space-y-1">
        <p className="text-xs font-medium text-gray-500">カラム:</p>
        <div className="flex flex-wrap gap-1">
          {schema.columns.map((col) => (
            <span
              key={col.name}
              className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700"
              title={`型: ${col.type}, サンプル: ${col.sampleValues.join(', ')}`}
            >
              {col.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
