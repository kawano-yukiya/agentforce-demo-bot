import type { CustomerRecord, SearchResult } from './types';

// Extract keywords from a query string
export function extractKeywords(query: string): string[] {
  // Remove common Japanese particles and question words
  const stopWords = [
    'の', 'は', 'が', 'を', 'に', 'で', 'と', 'から', 'まで', 'より',
    'について', 'として', 'ください', '教えて', '何', 'どの', 'どこ',
    'いつ', 'なぜ', 'どう', 'どんな', 'ありますか', 'ですか', 'ある',
    'いる', 'する', 'できる', 'なる', 'ある', 'これ', 'それ', 'あれ',
    'この', 'その', 'あの', 'ここ', 'そこ', 'あそこ', '何か', 'どれ',
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'must', 'can', 'what', 'which', 'who',
    'whom', 'this', 'that', 'these', 'those', 'am', 'is', 'are', 'was',
    'were', 'been', 'being', 'have', 'has', 'had', 'having', 'do', 'does',
    'did', 'doing', 'and', 'but', 'or', 'nor', 'for', 'yet', 'so', 'of',
    'at', 'by', 'for', 'with', 'about', 'against', 'between', 'into',
    'through', 'during', 'before', 'after', 'above', 'below', 'to', 'from',
    'up', 'down', 'in', 'out', 'on', 'off', 'over', 'under', 'again',
    'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why',
    'how', 'all', 'each', 'few', 'more', 'most', 'other', 'some', 'such',
    'no', 'not', 'only', 'own', 'same', 'than', 'too', 'very', 's', 't',
    'just', 'don', 'now', 'd', 'll', 'm', 'o', 're', 've', 'y',
  ];

  // Split by spaces and Japanese word boundaries
  const words = query
    .toLowerCase()
    .replace(/[。、！？「」『』（）\[\]【】]/g, ' ')
    .split(/[\s　]+/)
    .filter(word => word.length >= 2)
    .filter(word => !stopWords.includes(word));

  // Also extract potential proper nouns (capitalized words, company names, etc.)
  const properNouns = query
    .match(/[A-Z][a-zA-Z]+|[ァ-ヴー]+|[一-龯]+[株式会社|有限会社]?|[株式会社|有限会社][一-龯]+/g)
    ?.map(w => w.toLowerCase()) ?? [];

  return [...new Set([...words, ...properNouns])];
}

// Search records by keywords
export function searchRecords(
  records: CustomerRecord[],
  query: string,
  maxResults: number = 20
): SearchResult {
  const keywords = extractKeywords(query);

  if (keywords.length === 0) {
    // If no keywords extracted, return first N records as context
    return {
      records: records.slice(0, maxResults),
      totalMatches: records.length,
    };
  }

  // Score each record based on keyword matches
  const scoredRecords = records.map(record => {
    let score = 0;
    const recordString = Object.values(record)
      .map(v => String(v ?? '').toLowerCase())
      .join(' ');

    for (const keyword of keywords) {
      if (recordString.includes(keyword)) {
        score += 1;
        // Bonus for exact field match
        for (const value of Object.values(record)) {
          if (String(value ?? '').toLowerCase() === keyword) {
            score += 2;
          }
        }
      }
    }

    return { record, score };
  });

  // Sort by score and filter records with matches
  const matchedRecords = scoredRecords
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map(r => r.record);

  return {
    records: matchedRecords,
    totalMatches: scoredRecords.filter(r => r.score > 0).length,
  };
}

// Format records for AI context
export function formatRecordsForContext(records: CustomerRecord[]): string {
  if (records.length === 0) {
    return 'データが見つかりませんでした。';
  }

  const formatted = records.map((record, index) => {
    const fields = Object.entries(record)
      .filter(([, value]) => value !== null && value !== undefined && value !== '')
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
    return `[${index + 1}] ${fields}`;
  });

  return formatted.join('\n');
}
