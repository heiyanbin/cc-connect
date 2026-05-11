import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Circle, WifiOff, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ChatInput } from '@/components/ui/ChatInput';
import { MessageBubble } from '@/components/ui/MessageBubble';
import { EmptyState } from '@/components/ui/EmptyState';
import { listSessions, getSession, type Session } from '@/api/sessions';
import { useBridgeSocket, fetchBridgeConfig, type BridgeConfig, type BridgeIncoming, type BridgeStatus } from '@/hooks/useBridgeSocket';
import { displayAgentName } from '@/lib/utils';
import { timeAgo } from '@/lib/utils';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

function StatusBadge({ status }: { status: BridgeStatus }) {
  if (status === 'connected') {
    return (
      <span className="flex items-center gap-1 text-xs text-emerald-500">
        <Circle size={6} className="fill-current" /> connected
      </span>
    );
  }
  if (status === 'connecting' || status === 'registering') {
    return (
      <span className="flex items-center gap-1 text-xs text-yellow-500">
        <Loader2 size={10} className="animate-spin" /> connecting...
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-xs text-gray-400">
      <WifiOff size={10} /> disconnected
    </span>
  );
}

export default function ChatView() {
  const { name } = useParams<{ name: string }>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [bridgeCfg, setBridgeCfg] = useState<BridgeConfig | null>(null);
  const [typing, setTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load sessions and bridge config on mount
  useEffect(() => {
    if (!name) return;
    loadSessions();
    fetchBridgeConfig().then(setBridgeCfg);
  }, [name]);

  // Load history when session changes
  useEffect(() => {
    if (!currentSessionId || !name) {
      setLoading(false);
      return;
    }
    loadHistory();
  }, [currentSessionId, name]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  async function loadSessions() {
    setLoading(true);
    setError('');
    try {
      const { sessions: sessionList } = await listSessions(name!);
      setSessions(sessionList);
      if (sessionList.length > 0) {
        // Select most recent session by default
        const mostRecent = sessionList.sort((a, b) =>
          (b.updated_at || b.created_at).localeCompare(a.updated_at || a.created_at)
        )[0];
        setCurrentSessionId(mostRecent.id);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  }

  async function loadHistory() {
    if (!currentSessionId) return;
    setLoading(true);
    setError('');
    try {
      const detail = await getSession(name!, currentSessionId);
      const chatMessages: ChatMessage[] = detail.history.map((h, i) => ({
        id: `hist-${i}`,
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

  // Get current session and its session_key
  const currentSession = sessions.find(s => s.id === currentSessionId);
  const sessionKey = currentSession?.session_key || '';

  // Handle incoming WebSocket messages
  const handleBridgeMessage = useCallback((msg: BridgeIncoming) => {
    if (msg.type === 'reply') {
      setMessages(prev => [...prev, {
        id: `reply-${Date.now()}`,
        role: 'assistant',
        content: msg.content,
        timestamp: new Date().toISOString(),
      }]);
      setTyping(false);
      setSending(false);
    } else if (msg.type === 'reply_stream') {
      const stream = msg as Extract<BridgeIncoming, { type: 'reply_stream' }>;
      if (stream.done) {
        setMessages(prev => {
          const idx = prev.findIndex(m => m.id.startsWith('stream-'));
          if (idx >= 0) {
            const updated = [...prev];
            updated[idx] = { ...updated[idx], content: stream.full_text, timestamp: new Date().toISOString() };
            return updated;
          }
          return [...prev, { id: `reply-${Date.now()}`, role: 'assistant', content: stream.full_text, timestamp: new Date().toISOString() }];
        });
        setTyping(false);
        setSending(false);
      } else {
        setMessages(prev => {
          const idx = prev.findIndex(m => m.id.startsWith('stream-'));
          if (idx >= 0) {
            const updated = [...prev];
            updated[idx] = { ...updated[idx], content: stream.full_text };
            return updated;
          }
          return [...prev, { id: `stream-${Date.now()}`, role: 'assistant', content: stream.full_text, timestamp: new Date().toISOString() }];
        });
      }
    } else if (msg.type === 'typing_start') {
      setTyping(true);
    } else if (msg.type === 'typing_stop') {
      setTyping(false);
    }
  }, []);

  // WebSocket connection
  const { status, sendMessage } = useBridgeSocket({
    bridgeCfg,
    platformName: 'web-user',
    sessionKey,
    projectName: name,
    onMessage: handleBridgeMessage,
  });

  const handleSend = useCallback(async (message: string) => {
    if (!sessionKey || !name || status !== 'connected') return;

    setSending(true);
    setError('');

    // Add user message immediately to UI
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);

    // Send via WebSocket
    sendMessage(message);
  }, [name, sessionKey, status, sendMessage]);

  const handleSessionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrentSessionId(e.target.value);
  };

  // No sessions - show connect button
  if (!loading && sessions.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <EmptyState message="No sessions. Please scan QR first." />
        <Link to={`/connect/${name}`}>
          <Button>Connect</Button>
        </Link>
      </div>
    );
  }

  const canSend = status === 'connected' && sessionKey;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-gray-500 hover:text-gray-700">
          <ArrowLeft size={16} />
          <span>Back</span>
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="font-semibold">{displayAgentName(name || '')}</h1>
          {/* Session selector */}
          {sessions.length > 0 && (
            <div className="relative">
              <select
                value={currentSessionId || ''}
                onChange={handleSessionChange}
                className="appearance-none text-xs bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-1.5 pr-6 cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent/50"
              >
                {sessions.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.user_name || s.name || s.id.slice(0, 8)}
                  </option>
                ))}
              </select>
              <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={status} />
          <span className="text-xs text-gray-400">
            {messages.length} messages
          </span>
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
          <>
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                role={msg.role}
                content={msg.content}
                timestamp={timeAgo(msg.timestamp)}
              />
            ))}
            {typing && !messages.some(m => m.id.startsWith('stream-')) && (
              <div className="flex gap-3 justify-start mb-4">
                <div className="rounded-2xl px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        {canSend ? (
          <ChatInput
            onSend={handleSend}
            disabled={loading}
            loading={sending}
          />
        ) : !bridgeCfg ? (
          <div className="flex items-center gap-2 px-4 py-3 text-sm text-amber-500 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
            <WifiOff size={14} />
            <span>Bridge not available. Enable [bridge] in config.toml to chat from web.</span>
          </div>
        ) : !sessionKey ? (
          <div className="flex items-center gap-2 px-4 py-3 text-sm text-amber-500 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
            <WifiOff size={14} />
            <span>No session selected. Choose a session from the dropdown above.</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-4 py-3 text-sm text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
            <Loader2 size={14} className="animate-spin" />
            <span>Connecting...</span>
          </div>
        )}
      </div>
    </div>
  );
}