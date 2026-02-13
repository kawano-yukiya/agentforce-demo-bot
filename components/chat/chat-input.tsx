'use client';

import { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Loader2 } from 'lucide-react';

interface ChatInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  disabled?: boolean;
  isLoading?: boolean;
  placeholder?: string;
}

export function ChatInput({
  value,
  onChange,
  onSubmit,
  disabled,
  isLoading,
  placeholder = 'メッセージを入力...',
}: ChatInputProps) {
  return (
    <form onSubmit={onSubmit} className="flex gap-2 pt-4 border-t border-gray-200">
      <Input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled || isLoading}
        className="flex-1"
        autoComplete="off"
      />
      <Button
        type="submit"
        disabled={disabled || isLoading || !value.trim()}
        size="icon"
        className="shrink-0"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
      </Button>
    </form>
  );
}
