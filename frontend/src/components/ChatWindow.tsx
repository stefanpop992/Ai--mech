'use client';

import ReactMarkdown from 'react-markdown';
import { useState, useRef, useEffect, useCallback } from 'react';
import { askAI, getAIUsage, getAIHistory, type Car } from '@/lib/api-client';
import { useAuth } from '@/context/AuthContext';

const FREE_LIMIT = 10;

type Message = {
  role: 'user' | 'ai';
  content: string;
};

interface ChatWindowProps {
  car: Car;
}

// ── Usage bar (free users only) ───────────────────────────────────────────────

function UsageBar({ remaining }: { remaining: number }) {
  const pct = Math.max(0, Math.min(100, (remaining / FREE_LIMIT) * 100));
  const color = remaining <= 3 ? 'var(--red)' : remaining <= 5 ? '#f97316' : '#22c55e';

  return (
    <div className="px-4 pt-3 pb-2">
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-dm-mono text-[10px] uppercase tracking-widest" style={{ color: 'var(--dim)' }}>
          Meddelanden kvar idag
        </span>
        <span
          className="font-dm-mono text-[10px] font-bold"
          style={{ color }}
        >
          {remaining} / {FREE_LIMIT}
        </span>
      </div>
      <div
        className="w-full h-1"
        style={{ background: 'var(--steel)' }}
      >
        <div
          className="h-full transition-all duration-300"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

// ── Upgrade banner ────────────────────────────────────────────────────────────

function UpgradeBanner() {
  const [toast, setToast] = useState(false);

  const showToast = () => {
    setToast(true);
    setTimeout(() => setToast(false), 3000);
  };

  // Tomorrow at midnight
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  const resetTime = tomorrow.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });

  return (
    <div
      className="mx-4 mb-3 p-4 flex flex-col gap-3"
      style={{ background: 'var(--carbon)', border: '1px solid var(--red)' }}
    >
      {toast && (
        <div
          className="font-dm-mono text-xs px-3 py-2"
          style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid #22c55e', color: '#22c55e' }}
        >
          Kommer snart — tack för ditt intresse!
        </div>
      )}
      <p className="font-dm-sans text-sm" style={{ color: 'var(--white)' }}>
        Du har använt alla dina gratis meddelanden idag.
      </p>
      <p className="font-dm-mono text-[10px] leading-relaxed" style={{ color: 'var(--dim)' }}>
        Uppgradera till Premium för obegränsad AI-chat, längre svar och sparad chatthistorik.
      </p>
      <button
        onClick={showToast}
        className="font-dm-mono text-xs uppercase tracking-wider px-4 py-2.5 transition-colors w-full"
        style={{ background: 'var(--red)', color: 'var(--white)' }}
      >
        Uppgradera till Premium — 49 kr/mån
      </button>
      <p className="font-dm-mono text-[10px] text-center" style={{ color: 'var(--dim)' }}>
        Återställs imorgon kl {resetTime}
      </p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ChatWindow({ car }: ChatWindowProps) {
  const { user } = useAuth();
  const isPremium = user?.plan === 'premium';

  const greeting: Message = {
    role: 'ai',
    content: `Hej! Jag är din AI-mekaniker. Ställ gärna frågor om din **${car.make} ${car.model} (${car.year})** — jag hjälper dig med felsökning, underhåll och reparationer.`,
  };

  const [messages, setMessages] = useState<Message[]>([greeting]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messagesRemaining, setMessagesRemaining] = useState<number | null>(null);
  const [usageLoaded, setUsageLoaded] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Load usage / history on mount
  useEffect(() => {
    const init = async () => {
      if (isPremium) {
        // Load persistent history for premium users
        try {
          const history = await getAIHistory(car.id);
          if (history.length > 0) {
            const loaded: Message[] = history.map((m) => ({
              role: m.role === 'user' ? 'user' : 'ai',
              content: m.content,
            }));
            setMessages([greeting, ...loaded]);
          }
        } catch {
          // silent — history load is best-effort
        }
      } else {
        // Load today's usage for free users
        try {
          const usage = await getAIUsage();
          if (usage.messages_remaining !== null) {
            setMessagesRemaining(usage.messages_remaining);
          }
        } catch {
          // silent
        }
      }
      setUsageLoaded(true);
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [car.id, isPremium]);

  const isLimitReached = !isPremium && messagesRemaining === 0;
  const inputDisabled = isLoading || isLimitReached;

  const handleSend = async () => {
    if (!input.trim() || inputDisabled) return;

    const userMsg: Message = { role: 'user', content: input };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    try {
      const history = updatedMessages
        .slice(1)   // skip greeting
        .slice(-20) // max 20 for context
        .map((m) => ({ role: m.role, content: m.content }));

      const response = await askAI(car.id, userMsg.content, history);

      setMessages((prev) => [...prev, { role: 'ai', content: response.answer }]);

      if (response.messages_remaining !== null && response.messages_remaining !== undefined) {
        setMessagesRemaining(response.messages_remaining);
      }
    } catch (err: unknown) {
      let errorMessage = 'Ursäkta, något gick fel. Försök igen om en stund.';

      if (err instanceof Error && 'status' in err) {
        const status = (err as { status: number }).status;
        if (status === 429) {
          setMessagesRemaining(0);
          return; // The upgrade banner handles the UI
        } else if (status === 401) {
          errorMessage = 'Din session har gått ut. Ladda om sidan och logga in igen.';
        }
      }

      setMessages((prev) => [...prev, { role: 'ai', content: errorMessage }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="flex flex-col"
      style={{
        background: 'var(--carbon)',
        border: '1px solid var(--border)',
        minHeight: 520,
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 shrink-0"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <span className="text-base">🤖</span>
        <div className="flex items-center gap-2">
          <span className="font-dm-sans text-sm font-semibold" style={{ color: 'var(--white)' }}>
            AI-Mekaniker
          </span>
          {isPremium && (
            <span
              className="font-dm-mono text-[9px] font-bold px-1.5 py-0.5 tracking-widest"
              style={{ background: 'var(--red)', color: 'var(--white)' }}
            >
              PREMIUM
            </span>
          )}
        </div>
        <span className="font-dm-mono text-xs ml-auto" style={{ color: 'var(--dim)' }}>
          {car.make} {car.model} {car.year ? `(${car.year})` : ''}
        </span>
      </div>

      {/* Usage bar — free users only */}
      {!isPremium && usageLoaded && messagesRemaining !== null && messagesRemaining > 0 && (
        <UsageBar remaining={messagesRemaining} />
      )}

      {/* Message list */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3" style={{ minHeight: 320, maxHeight: 420 }}>
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className="max-w-[82%] px-4 py-2.5 text-sm leading-relaxed"
              style={
                msg.role === 'user'
                  ? { background: 'var(--red)', color: 'var(--white)' }
                  : {
                      background: 'var(--steel)',
                      border: '1px solid var(--border)',
                      color: 'var(--white)',
                    }
              }
            >
              {msg.role === 'user' ? (
                <span className="font-dm-sans">{msg.content}</span>
              ) : (
                <div
                  className="font-dm-sans prose-sm"
                  style={{ color: 'var(--white)' }}
                >
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div
              className="px-4 py-3 flex gap-1 items-center"
              style={{ background: 'var(--steel)', border: '1px solid var(--border)' }}
            >
              {[0, 150, 300].map((delay) => (
                <span
                  key={delay}
                  className="w-1.5 h-1.5 rounded-full animate-bounce"
                  style={{ background: 'var(--dim)', animationDelay: `${delay}ms` }}
                />
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Upgrade banner when limit reached */}
      {isLimitReached && <UpgradeBanner />}

      {/* Input area */}
      <div
        className="shrink-0 p-4"
        style={{ borderTop: '1px solid var(--border)' }}
      >
        <form
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="flex gap-2"
        >
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={inputDisabled}
            placeholder={
              isLimitReached
                ? 'Dagsgränsen är nådd — uppgradera för att fortsätta'
                : `Beskriv felet med din ${car.make ?? 'bil'}...`
            }
            className="flex-1 px-3 py-2.5 text-sm font-dm-sans transition-colors disabled:opacity-40"
            style={{
              background: 'var(--steel)',
              border: '1px solid var(--border)',
              color: 'var(--white)',
              outline: 'none',
            }}
            onFocus={(e) => { if (!inputDisabled) e.currentTarget.style.borderColor = 'var(--red)'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
          />
          <button
            type="submit"
            disabled={inputDisabled || !input.trim()}
            className="font-dm-mono text-xs uppercase tracking-wider px-4 py-2.5 transition-opacity disabled:opacity-40 shrink-0"
            style={{ background: 'var(--red)', color: 'var(--white)' }}
          >
            Skicka
          </button>
        </form>

        {/* Live remaining counter below input for free users */}
        {!isPremium && usageLoaded && messagesRemaining !== null && messagesRemaining > 0 && (
          <p
            className="font-dm-mono text-[10px] mt-2 text-right"
            style={{ color: messagesRemaining <= 3 ? 'var(--red)' : 'var(--dim)' }}
          >
            {messagesRemaining} meddelande{messagesRemaining === 1 ? '' : 'n'} kvar idag
          </p>
        )}
      </div>
    </div>
  );
}
