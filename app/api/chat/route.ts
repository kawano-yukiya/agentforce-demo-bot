import { google } from '@ai-sdk/google';
import { streamText } from 'ai';
import { NextRequest } from 'next/server';
import { getEmbeddedRecords, getEmbeddedSchema } from '@/lib/data/embedded-data';
import type { CustomerRecord } from '@/lib/data/types';

// データの最新日付を取得して基準日とする
function getBaseDate(records: CustomerRecord[]): Date {
  let latestDate = '';
  records.forEach(r => {
    const date = (r['作成日'] as string) || '';
    if (date > latestDate) {
      latestDate = date;
    }
  });

  if (latestDate) {
    const [year, month, day] = latestDate.split('/').map(Number);
    return new Date(year, month - 1, day);
  }
  return new Date();
}

// 今週の日付範囲を取得（月曜始まり）
function getThisWeekRange(baseDate: Date): { start: string; end: string } {
  const dayOfWeek = baseDate.getDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const monday = new Date(baseDate);
  monday.setDate(baseDate.getDate() + diffToMonday);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const format = (d: Date) => `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;

  return { start: format(monday), end: format(sunday) };
}

// 先週の日付範囲を取得（月曜始まり）
function getLastWeekRange(baseDate: Date): { start: string; end: string } {
  const dayOfWeek = baseDate.getDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const thisMonday = new Date(baseDate);
  thisMonday.setDate(baseDate.getDate() + diffToMonday);

  const lastMonday = new Date(thisMonday);
  lastMonday.setDate(thisMonday.getDate() - 7);

  const lastSunday = new Date(lastMonday);
  lastSunday.setDate(lastMonday.getDate() + 6);

  const format = (d: Date) => `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;

  return { start: format(lastMonday), end: format(lastSunday) };
}

// 来週の日付範囲を取得（月曜始まり）
function getNextWeekRange(baseDate: Date): { start: string; end: string } {
  const dayOfWeek = baseDate.getDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const thisMonday = new Date(baseDate);
  thisMonday.setDate(baseDate.getDate() + diffToMonday);

  const nextMonday = new Date(thisMonday);
  nextMonday.setDate(thisMonday.getDate() + 7);

  const nextSunday = new Date(nextMonday);
  nextSunday.setDate(nextMonday.getDate() + 6);

  const format = (d: Date) => `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;

  return { start: format(nextMonday), end: format(nextSunday) };
}

// 日付範囲でフィルタ
function filterByDateRange(records: CustomerRecord[], start: string, end: string): CustomerRecord[] {
  return records.filter(r => {
    const date = (r['作成日'] as string) || '';
    return date >= start && date <= end;
  });
}

// 作成者別集計
function aggregateByCreator(records: CustomerRecord[]): Record<string, number> {
  const result: Record<string, number> = {};
  records.forEach(r => {
    const creator = (r['作成者'] as string) || '不明';
    result[creator] = (result[creator] || 0) + 1;
  });
  return result;
}

// 部署別集計
function aggregateByDept(records: CustomerRecord[]): Record<string, number> {
  const result: Record<string, number> = {};
  records.forEach(r => {
    const dept = (r['部署'] as string) || '不明';
    result[dept] = (result[dept] || 0) + 1;
  });
  return result;
}

// 活動種別集計
function aggregateByType(records: CustomerRecord[]): Record<string, number> {
  const result: Record<string, number> = {};
  records.forEach(r => {
    const type = (r['活動 種別'] as string) || '不明';
    result[type] = (result[type] || 0) + 1;
  });
  return result;
}

// 関連先別集計
function aggregateByAccount(records: CustomerRecord[]): Record<string, number> {
  const result: Record<string, number> = {};
  records.forEach(r => {
    const account = (r['関連先'] as string) || '不明';
    result[account] = (result[account] || 0) + 1;
  });
  return result;
}

// 特定の作成者のレコードを取得
function filterByCreator(records: CustomerRecord[], creatorName: string): CustomerRecord[] {
  return records.filter(r => {
    const creator = ((r['作成者'] as string) || '').toLowerCase();
    return creator.includes(creatorName.toLowerCase());
  });
}

// 特定の関連先のレコードを取得
function filterByAccount(records: CustomerRecord[], accountName: string): CustomerRecord[] {
  return records.filter(r => {
    const account = ((r['関連先'] as string) || '').toLowerCase();
    return account.includes(accountName.toLowerCase());
  });
}

// レコードの詳細を構築
function buildRecordDetails(records: CustomerRecord[], maxRecords: number = 30): string {
  if (records.length === 0) return '該当なし';

  let result = '';
  records.slice(0, maxRecords).forEach((r, i) => {
    const comment = (r['コメント(全文)'] as string) || '';
    const shortComment = comment.length > 800 ? comment.substring(0, 800) + '...' : comment;
    result += `\n[${i + 1}] ${r['件名'] || '-'}
  関連先: ${r['関連先'] || '-'}
  作成者: ${r['作成者'] || '-'}, 部署: ${r['部署'] || '-'}
  種別: ${r['活動 種別'] || '-'}, 作成日: ${r['作成日'] || '-'}
  コメント: ${shortComment || 'なし'}
`;
  });

  if (records.length > maxRecords) {
    result += `\n※ 他${records.length - maxRecords}件あり`;
  }

  return result;
}

// 全データコンテキストを構築（フリー回答用）
function buildFullDataContext(records: CustomerRecord[], baseDate: Date): string {
  const thisWeek = getThisWeekRange(baseDate);
  const lastWeek = getLastWeekRange(baseDate);
  const nextWeek = getNextWeekRange(baseDate);

  const thisWeekRecords = filterByDateRange(records, thisWeek.start, thisWeek.end);
  const lastWeekRecords = filterByDateRange(records, lastWeek.start, lastWeek.end);

  let context = '';

  // === 基本情報 ===
  context += `【基本情報】
総活動件数: ${records.length}件
今週（${thisWeek.start}〜${thisWeek.end}）の活動件数: ${thisWeekRecords.length}件
先週（${lastWeek.start}〜${lastWeek.end}）の活動件数: ${lastWeekRecords.length}件
来週の日付範囲: ${nextWeek.start}〜${nextWeek.end}

`;

  // === 先週の集計（想定質問に対応）===
  context += `=== 先週の集計（${lastWeek.start}〜${lastWeek.end}）===\n\n`;

  // 先週の作成者別
  const lastWeekByCreator = aggregateByCreator(lastWeekRecords);
  context += `【先週の作成者別活動件数（人別）】\n`;
  Object.entries(lastWeekByCreator).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
    context += `${k}: ${v}件\n`;
  });

  // 先週の部署別
  const lastWeekByDept = aggregateByDept(lastWeekRecords);
  context += `\n【先週の部署別活動件数】\n`;
  Object.entries(lastWeekByDept).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
    context += `${k}: ${v}件\n`;
  });

  // 先週の活動種別
  const lastWeekByType = aggregateByType(lastWeekRecords);
  context += `\n【先週の活動種別】\n`;
  Object.entries(lastWeekByType).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
    context += `${k}: ${v}件\n`;
  });

  // === 今週の集計 ===
  context += `\n=== 今週の集計（${thisWeek.start}〜${thisWeek.end}）===\n\n`;

  const thisWeekByCreator = aggregateByCreator(thisWeekRecords);
  context += `【今週の作成者別活動件数】\n`;
  Object.entries(thisWeekByCreator).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
    context += `${k}: ${v}件\n`;
  });

  const thisWeekByDept = aggregateByDept(thisWeekRecords);
  context += `\n【今週の部署別活動件数】\n`;
  Object.entries(thisWeekByDept).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
    context += `${k}: ${v}件\n`;
  });

  // === 全期間の集計 ===
  context += `\n=== 全期間の集計 ===\n\n`;

  const byDept = aggregateByDept(records);
  context += `【部署別活動件数】\n`;
  Object.entries(byDept).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
    context += `${k}: ${v}件\n`;
  });

  const byCreator = aggregateByCreator(records);
  context += `\n【作成者別活動件数（上位30名）】\n`;
  Object.entries(byCreator).sort((a, b) => b[1] - a[1]).slice(0, 30).forEach(([k, v]) => {
    context += `${k}: ${v}件\n`;
  });

  const byAccount = aggregateByAccount(records);
  context += `\n【関連先別活動件数（上位30社）】\n`;
  Object.entries(byAccount).sort((a, b) => b[1] - a[1]).slice(0, 30).forEach(([k, v]) => {
    context += `${k}: ${v}件\n`;
  });

  // === 先週のレコード詳細（想定質問に対応）===
  context += `\n=== 先週のレコード詳細 ===\n`;
  context += buildRecordDetails(lastWeekRecords, 50);

  // === 今週のレコード詳細 ===
  context += `\n\n=== 今週のレコード詳細 ===\n`;
  context += buildRecordDetails(thisWeekRecords, 30);

  // === 全期間の直近レコード ===
  const recentRecords = [...records].sort((a, b) => {
    const dateA = (a['作成日'] as string) || '';
    const dateB = (b['作成日'] as string) || '';
    return dateB.localeCompare(dateA);
  }).slice(0, 20);
  context += `\n\n=== 直近の活動（最新20件）===\n`;
  context += buildRecordDetails(recentRecords, 20);

  return context;
}

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    // Get embedded data
    const records = getEmbeddedRecords();

    // データの最新日付を基準にする
    const baseDate = getBaseDate(records);
    const thisWeek = getThisWeekRange(baseDate);
    const lastWeek = getLastWeekRange(baseDate);
    const nextWeek = getNextWeekRange(baseDate);

    // Build comprehensive data context
    const dataContext = buildFullDataContext(records, baseDate);

    // System prompt - フリー回答対応
    const systemPrompt = `あなたはSalesforceの営業活動データアシスタント「Agentforce」です。
ユーザーからの質問に対して、提供されたデータに基づいて回答してください。

【データ】
${dataContext}

【日付の定義】
- 今週: ${thisWeek.start}〜${thisWeek.end}
- 先週: ${lastWeek.start}〜${lastWeek.end}
- 来週: ${nextWeek.start}〜${nextWeek.end}

【回答のガイドライン】
1. 質問の内容を理解し、該当するデータから回答を生成してください
2. 「人別」「作成者別」= 作成者フィールドで集計
3. 「部署別」= 部署フィールドで集計
4. 「提案数」= コメントに「提案」「プレゼン」「ご案内」「提案書」を含むレコードを数えてください
5. 「ネクストアクション（NA）」= コメントに「ネクストアクション」「Next Action」「NA：」「NA:」「次回」を含むレコード
6. 「課題・問題」= コメントに「課題」「問題」「懸念」を含むレコード
7. 「失注」= コメントに「失注」「不採用」「見送り」を含むレコード
8. 「来週のNA予定」= コメントに来週の日付や「次回」「予定」が記載されているレコード
9. 「見積もり」= コメントに「見積」「見積り」「見積もり」「概算」「金額」を含むレコード
10. 特定の人の情報を聞かれた場合は、その人の活動を詳細にレコードから抽出して回答してください
11. 特定の企業の情報を聞かれた場合は、関連先でフィルタして回答してください

【重要】
- 該当するデータがない場合は「該当するデータがありません」と正直に回答してください
- 活動種別の「割合」を聞かれた場合は、件数とパーセンテージを計算して回答してください
- 一覧を求められた場合は、件名、関連先、コメントの要点を含めて回答してください
- データに基づいて回答し、推測で補完しないでください`;

    // Stream response from Gemini
    const result = streamText({
      model: google('gemini-2.0-flash'),
      system: systemPrompt,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(
      JSON.stringify({
        role: 'assistant',
        content: 'エラーが発生しました。もう一度お試しください。',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
