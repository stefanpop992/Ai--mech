'use client';
import ReactMarkdown from 'react-markdown'
import { useState, useRef, useEffect } from 'react';
import { askAI, type Car } from '@/lib/api-client';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

type Message = {
  role: 'user' | 'ai';
  content: string;
};

interface ChatWindowProps {
  car: Car;
}

export default function ChatWindow({ car }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'ai',
      content: `Hej! Jag är din AI-mekaniker. Vad krånglar med din ${car.make} ${car.model} (${car.year})?`,
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await askAI(car.id, userMsg.content);
      setMessages((prev) => [
        ...prev,
        { role: 'ai', content: response.answer },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          content: 'Ursäkta, jag tappade anslutningen till servern. Är backend igång?',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="flex flex-col h-full bg-gray-800 border-gray-700 text-white">
      <CardHeader className="bg-gray-750 border-b border-gray-700 pb-4 rounded-t-xl">
        <CardTitle className="text-base flex items-center gap-2 text-white">
          <span className="text-blue-400">🤖</span>
          <span>
            AI-Mekaniker —{' '}
            <span className="text-blue-300 font-normal">
              {car.make} {car.model}
            </span>
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 p-4 overflow-hidden">
        <ScrollArea className="h-[360px] pr-3">
          <div className="flex flex-col gap-3">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : 'bg-gray-700 text-gray-100 rounded-bl-sm border border-gray-600'
                  }`}
                >
                  {msg.role === 'user' ? (
                    msg.content
                  ) : (
                    <div className="prose prose-invert prose-sm max-w-none">
                      <ReactMarkdown>
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-700 border border-gray-600 px-4 py-3 rounded-2xl rounded-bl-sm flex gap-1 items-center">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </ScrollArea>
      </CardContent>

      <CardFooter className="p-4 border-t border-gray-700 rounded-b-xl">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex w-full gap-2"
        >
          <Input
            placeholder={`Beskriv felet med din ${car.make}...`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            className="flex-1 bg-gray-700 border-gray-600 text-white placeholder:text-gray-500 focus-visible:ring-blue-500"
          />
          <Button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-blue-600 hover:bg-blue-500 text-white"
          >
            Skicka
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}