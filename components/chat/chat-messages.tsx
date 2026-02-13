'use client';

import { useEffect, useRef } from 'react';
import { MessageBubble } from './message-bubble';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface ChatMessagesProps {
  messages: Message[];
  isLoading?: boolean;
}

export function ChatMessages({ messages, isLoading }: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center text-center p-8">
        <div className="max-w-md">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Agentforce デモ
          </h3>
          <p className="text-sm text-gray-500">
            CSVまたはExcelファイルをアップロードして、データについて質問してください。
          </p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1 -mx-6">
      <div className="divide-y divide-gray-100">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            role={message.role}
            content={message.content}
          />
        ))}
        {isLoading && (
          <div className="flex gap-3 p-4 bg-white">
            <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-green-100 text-green-600">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-500 mb-1">Agentforce</p>
              <p className="text-sm text-gray-400">回答を生成中...</p>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
