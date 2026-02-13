import { google } from '@ai-sdk/google';
import { streamText } from 'ai';
import { NextRequest } from 'next/server';
import { getRecords, getSchema, hasData } from '@/lib/data/store';
import { searchRecords, formatRecordsForContext } from '@/lib/data/search';
import { buildSystemPrompt, getNoDataPrompt, getOffTopicResponse } from '@/lib/ai/prompts';
import { isLikelyOffTopic, isSimpleGreeting, getGreetingResponse } from '@/lib/ai/topic-guard';

export async function POST(req: NextRequest) {
  try {
    const { messages, sessionId } = await req.json();

    // Validate session
    if (!sessionId || !hasData(sessionId)) {
      return new Response(
        JSON.stringify({
          role: 'assistant',
          content: getNoDataPrompt(),
        }),
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const lastMessage = messages[messages.length - 1]?.content || '';

    // Handle simple greetings
    if (isSimpleGreeting(lastMessage)) {
      return new Response(
        JSON.stringify({
          role: 'assistant',
          content: getGreetingResponse(),
        }),
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Check for off-topic questions
    if (isLikelyOffTopic(lastMessage)) {
      return new Response(
        JSON.stringify({
          role: 'assistant',
          content: getOffTopicResponse(),
        }),
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Get data and schema
    const records = getRecords(sessionId);
    const schema = getSchema(sessionId);

    if (!schema || records.length === 0) {
      return new Response(
        JSON.stringify({
          role: 'assistant',
          content: getNoDataPrompt(),
        }),
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Search for relevant records
    const searchResult = searchRecords(records, lastMessage, 20);
    const dataContext = formatRecordsForContext(searchResult.records);

    // Build system prompt with data context
    const systemPrompt = buildSystemPrompt(schema, dataContext);

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
