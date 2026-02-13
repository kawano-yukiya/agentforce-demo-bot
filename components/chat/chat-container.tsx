'use client';

import { useState, FormEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChatMessages } from './chat-messages';
import { ChatInput } from './chat-input';
import { FileUploader } from '@/components/data/file-uploader';
import { DataPreview } from '@/components/data/data-preview';
import type { DataSchema, UploadResponse } from '@/lib/data/types';
import { Bot } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export function ChatContainer() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [dataSchema, setDataSchema] = useState<DataSchema | null>(null);
  const [recordCount, setRecordCount] = useState<number>(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleUploadSuccess = (data: UploadResponse) => {
    setSessionId(data.sessionId);
    setDataSchema(data.schema);
    setRecordCount(data.recordCount);
    setMessages([]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || !sessionId || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
          sessionId,
        }),
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const contentType = response.headers.get('content-type');

      let assistantContent = '';

      if (contentType?.includes('text/plain') || contentType?.includes('text/event-stream')) {
        // Handle streaming response
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (reader) {
          const assistantMessageId = `assistant-${Date.now()}`;
          setMessages(prev => [...prev, {
            id: assistantMessageId,
            role: 'assistant',
            content: '',
          }]);

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            assistantContent += chunk;

            setMessages(prev => prev.map(m =>
              m.id === assistantMessageId
                ? { ...m, content: assistantContent }
                : m
            ));
          }
        }
      } else {
        // Handle JSON response
        const data = await response.json();
        assistantContent = data.content || data.message || 'エラーが発生しました';

        setMessages(prev => [...prev, {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: assistantContent,
        }]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'エラーが発生しました。もう一度お試しください。',
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen max-w-6xl mx-auto p-4 gap-4">
      {/* Sidebar: Data Upload */}
      <div className="w-72 flex-shrink-0">
        <Card className="h-full">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Bot className="h-5 w-5 text-green-600" />
              データ読み込み
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FileUploader onSuccess={handleUploadSuccess} />
            {dataSchema && <DataPreview schema={dataSchema} />}
            {recordCount > 0 && (
              <p className="mt-3 text-xs text-green-600 font-medium">
                準備完了！質問してください
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Chat Area */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-base flex items-center gap-2">
            <Bot className="h-5 w-5 text-green-600" />
            Agentforce デモ
            {sessionId && (
              <span className="text-xs font-normal text-gray-500 ml-2">
                ({recordCount}件のデータで回答)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col overflow-hidden p-6">
          <ChatMessages messages={messages} isLoading={isLoading} />
          <ChatInput
            value={input}
            onChange={handleInputChange}
            onSubmit={handleSubmit}
            disabled={!sessionId}
            isLoading={isLoading}
            placeholder={
              sessionId
                ? 'データについて質問してください...'
                : 'まずデータをアップロードしてください'
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
