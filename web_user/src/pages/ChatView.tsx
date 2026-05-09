import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ChatInput } from '@/components/ui/ChatInput';
import { MessageBubble } from '@/components/ui/MessageBubble';
import { EmptyState } from '@/components/ui/EmptyState';
import { listSessions, getSession, sendMessage } from '@/api/sessions';
import { getSessionKey } from '@/hooks/useSessionKey';
import { displayAgentName } from '@/lib/utils';
import { timeAgo } from '@/lib/utils';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export default function ChatView() {
  const { name } = useParams<{ name: string }>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [sessionKey, setSessionKeyState] = useState<string | null>(null);

  useEffect(() => {
    if (!name) return;
    const sk = getSessionKey(name);
    setSessionKeyState(sk);
    if (sk) {
      loadHistory(sk);
    } else {
      setLoading(false);
    }
  }, [name]);

  async function loadHistory(_sk: string) {
    setLoading(true);
    setError('');
    try {
      const { sessions } = await listSessions(name!);
      if (sessions.length === 0) {
        setLoading(false);
        return;
      }
      // Use most recent session
      const session = sessions.sort((a, b) =>
        (b.updated_at || b.created_at).localeCompare(a.updated_at || a.created_at)
      )[0];

      const detail = await getSession(name!, session.id);
      const chatMessages: ChatMessage[] = detail.history.map((h, i) => ({
        id: `${i}`,
        role: h.role as 'user' | 'assistant',
        content: h.content,
        timestamp: h.timestamp,
      }));
      setMessages(chatMessages);
    } catch (e: any) {
      setError(e.message || 'Failed to load history');
    } finally {
      setLoading(false);
    }
  }

  const handleSend = useCallback(async (message: string) => {
    if (!sessionKey || !name || sending) return;

    setSending(true);
    setError('');

    // Add user message immediately
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);

    try {
      await sendMessage(name, { session_key: sessionKey, message });
      // Reload history to get assistant response
      await loadHistory(sessionKey);
    } catch (e: any) {
      setError(e.message || 'Failed to send');
    } finally {
      setSending(false);
    }
  }, [name, sessionKey, sending]);

  // No sessionKey - redirect to connect
  if (!sessionKey) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <EmptyState message="Not connected. Please scan QR first." />
        <Link to={`/connect/${name}`}>
          <Button>Connect</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-gray-500 hover:text-gray-700">
          <ArrowLeft size={16} />
          <span>Back</span>
        </Link>
        <h1 className="font-semibold">{displayAgentName(name || '')}</h1>
        <div className="text-xs text-gray-400">
          {messages.length} messages
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 size={24} className="animate-spin text-gray-400" />
          </div>
        ) : error ? (
          <div className="text-center text-red-500 py-4">{error}</div>
        ) : messages.length === 0 ? (
          <EmptyState message="No messages yet. Say something!" />
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              role={msg.role}
              content={msg.content}
              timestamp={timeAgo(msg.timestamp)}
            />
          ))
        )}
      </div>

      {/* Input */}
      <ChatInput
        onSend={handleSend}
        disabled={loading}
        loading={sending}
      />
    </div>
  );
}