// Keywords that indicate off-topic questions
const OFF_TOPIC_PATTERNS = [
  // Weather
  /天気|天候|気温|気象|weather|forecast|雨|晴れ|曇り|snow|rain/i,
  // News & current events
  /ニュース|news|時事|選挙|政治|政治家|大統領|総理/i,
  // Entertainment
  /映画|movie|ドラマ|drama|アニメ|anime|ゲーム|game|音楽|music|歌手|俳優|芸能人/i,
  // Sports
  /スポーツ|sports|野球|サッカー|tennis|basketball|オリンピック/i,
  // Food & recipes
  /レシピ|recipe|料理|cooking|レストラン|restaurant|おすすめの店/i,
  // Travel
  /旅行|travel|観光|tourist|ホテル|hotel|航空券|flight/i,
  // Health (general)
  /健康|health|ダイエット|diet|病気|disease|症状|symptom/i,
  // Stock market (unless part of company data)
  /株価|stock price|為替|投資|investment|仮想通貨|cryptocurrency|bitcoin/i,
  // General knowledge
  /歴史|history|科学|science|数学|math|物理|physics|化学|chemistry/i,
  // Personal assistant tasks
  /翻訳して|translate|要約して|summarize|作文|essay|詩を書いて|poem/i,
  // Jokes & fun
  /冗談|joke|面白い話|funny|笑い話/i,
];

// Patterns that suggest data-related questions (whitelist)
const DATA_RELATED_PATTERNS = [
  /顧客|customer|取引先|client|会社|company|企業/i,
  /データ|data|情報|information|レコード|record/i,
  /検索|search|探して|find|調べて|look up/i,
  /いくつ|何件|数|count|合計|total|集計|aggregate/i,
  /一覧|list|リスト|表示|show|見せて/i,
  /比較|compare|違い|difference/i,
  /最大|最小|平均|max|min|average|多い|少ない/i,
  /誰|who|どの|which|何|what/i,
  /売上|revenue|金額|amount|契約|contract/i,
  /担当|responsible|営業|sales|部署|department/i,
  /住所|address|電話|phone|メール|email|連絡先|contact/i,
  /登録|registered|作成|created|更新|updated/i,
];

export function isLikelyOffTopic(message: string): boolean {
  // First, check if it matches data-related patterns (whitelist)
  for (const pattern of DATA_RELATED_PATTERNS) {
    if (pattern.test(message)) {
      return false; // Likely data-related, not off-topic
    }
  }

  // Then check if it matches off-topic patterns
  for (const pattern of OFF_TOPIC_PATTERNS) {
    if (pattern.test(message)) {
      return true;
    }
  }

  return false;
}

// Check if the message is a greeting or simple interaction
export function isSimpleGreeting(message: string): boolean {
  const greetingPatterns = [
    /^(こんにちは|こんばんは|おはよう|はじめまして|hello|hi|hey)[\s。！!]?$/i,
    /^(ありがとう|thank you|thanks)[\s。！!]?$/i,
    /^(さようなら|bye|goodbye)[\s。！!]?$/i,
  ];

  const trimmedMessage = message.trim();
  return greetingPatterns.some(pattern => pattern.test(trimmedMessage));
}

export function getGreetingResponse(): string {
  return `こんにちは！顧客データアシスタント「Agentforce」です。

アップロードされたデータについてご質問ください。例えば：
- 「〇〇会社の情報を教えて」
- 「売上が高い顧客は？」
- 「東京の顧客を一覧表示して」

どのようなことをお調べしますか？`;
}
