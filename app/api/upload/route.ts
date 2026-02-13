import { NextRequest, NextResponse } from 'next/server';
import { parseFile } from '@/lib/data/parser';
import { setData, generateSessionId } from '@/lib/data/store';
import type { UploadResponse } from '@/lib/data/types';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'ファイルが必要です' },
        { status: 400 }
      );
    }

    // Validate file type
    const validExtensions = ['csv', 'xlsx', 'xls'];
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !validExtensions.includes(extension)) {
      return NextResponse.json(
        { success: false, error: 'CSV または Excel ファイルをアップロードしてください' },
        { status: 400 }
      );
    }

    // Parse the file
    const records = await parseFile(file);

    if (records.length === 0) {
      return NextResponse.json(
        { success: false, error: 'ファイルにデータが含まれていません' },
        { status: 400 }
      );
    }

    // Store the data
    const sessionId = generateSessionId();
    const schema = setData(sessionId, records, file.name);

    const response: UploadResponse = {
      success: true,
      sessionId,
      schema,
      recordCount: records.length,
      message: `${records.length}件のデータを読み込みました`,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'ファイルの処理に失敗しました',
      },
      { status: 500 }
    );
  }
}
