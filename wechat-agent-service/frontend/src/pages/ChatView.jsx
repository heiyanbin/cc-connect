import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Send, ChevronDown, MessageSquare } from 'lucide-react';
import { listSessions, getSession } from '../api/ccConnect';
import { useBridgeSocket, fetchBridgeConfig } from '../hooks/useBridgeSocket';

export default function ChatView() {
  const { projectName } = useParams();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [bridgeConfig, setBridgeConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [sessionKey, setSessionKey] = useState('');
  const [showSessionList, setShowSessionList] = useState(false);
  const messagesEndRef = useRef(null);

  // Web platform uses its own per-project session key by default
  const webSessionKey = projectName ? `bridge:web-user:${projectName}` : '';
  const sessionKeyToUse = sessionKey || webSessionKey;

  // Load project sessions and auto-select latest (same as admin web)
  const fetchData = useCallback(async () => {
    if (!projectName) return;
    setLoading(true);
    try {
      const [{ sessions: allSessions }, cfg] = await Promise.all([
        listSessions(projectName),
        fetchBridgeConfig(),
      ]);
      setBridgeConfig(cfg);
      const sorted = (allSessions || []).sort(
        (a, b) => (b.updated_at || b.created_at || '').localeCompare(a.updated_at || a.created_at || ''),
      );
      setSessions(sorted);

      if (sorted.length > 0) {
        const latest = sorted[0];
        const detail = await getSession(projectName, latest.id, 200);
        setCurrentSession(detail);
        setSessionKey(detail.session_key);
        if (detail.history) {
          setMessages(detail.history.map((h, i) => ({
            id: `hist-${i}`,
            role: h.role,
            content: h.content,
            timestamp: h.timestamp,
          })));
        }
      } else {
        setCurrentSession(null);
        setMessages([]);
      }
    } catch (e) {
      console.error('Failed to load:', e);
    } finally {
      setLoading(false);
    }
  }, [projectName]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Switch to a different session
  const switchToSession = useCallback(async (s) => {
    if (!projectName) return;
    setShowSessionList(false);
    setLoading(true);
    try {
      const detail = await getSession(projectName, s.id, 200);
      setCurrentSession(detail);
      setSessionKey(detail.session_key);
      if (detail.history) {
        setMessages(detail.history.map((h, i) => ({
          id: `hist-${i}`,
          role: h.role,
          content: h.content,
          timestamp: h.timestamp,
        })));
      } else {
        setMessages([]);
      }
    } finally {
      setLoading(false);
    }
  }, [projectName]);

  const { status, sendMessage } = useBridgeSocket({
    bridgeConfig,
    sessionKey: sessionKeyToUse,
    projectName,
    onMessage: (msg) => {
      if (msg.session_key && msg.session_key !== sessionKeyToUse) return;

      if (msg.type === 'reply' || msg.type === 'reply_stream') {
        const content = msg.type === 'reply' ? msg.content : msg.full_text;
        setMessages(prev => [...prev, {
          id: `reply-${Date.now()}`,
          role: 'assistant',
          content
        }]);
        setTyping(false);
      } else if (msg.type === 'typing_start') {
        setTyping(true);
      } else if (msg.type === 'typing_stop') {
        setTyping(false);
      }
    }
  });

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const handleSend = () => {
    if (!input.trim() || status !== 'connected') return;

    const content = input.trim();
    setInput('');

    setMessages(prev => [...prev, {
      id: `user-${Date.now()}`,
      role: 'user',
      content
    }]);

    sendMessage(content);
  };

  if (!sessionKeyToUse) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">No session found. Please connect first.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="sticky top-0 p-4 border-b bg-white flex items-center justify-between">
        <button onClick={() => window.history.back()} className="flex items-center gap-2 text-gray-500">
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>

        {/* Session selector */}
        <div className="flex items-center gap-2 relative">
          <button
            onClick={() => setShowSessionList(!showSessionList)}
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800"
          >
            <MessageSquare size={14} />
            <span className="truncate max-w-[150px]">
              {currentSession?.name || currentSession?.id?.slice(0, 8) || 'New'}
            </span>
            <ChevronDown size={14} />
          </button>

          {showSessionList && sessions.length > 0 && (
            <div className="absolute top-12 right-0 bg-white border rounded-lg shadow-lg z-10 min-w-[200px]">
              {sessions.map(s => (
                <button
                  key={s.id}
                  onClick={() => switchToSession(s)}
                  className={`w-full px-3 py-2 text-left hover:bg-gray-50 ${
                    currentSession?.id === s.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="text-sm font-medium truncate">
                    {s.name || s.id.slice(0, 8)}
                  </div>
                  <div className="text-xs text-gray-400">
                    {s.updated_at ? new Date(s.updated_at).toLocaleDateString() : ''}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <span className="text-sm text-gray-400">
          {status === 'connected' ? 'Connected' : status === 'registering' ? 'Registering...' : status === 'connecting' ? 'Connecting...' : 'Disconnected'}
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="animate-spin text-gray-400" size={24} />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-center text-gray-400">Start a conversation</p>
        ) : (
          <>
            {messages.map(msg => (
              <div key={msg.id} className={`mb-4 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`px-4 py-2 rounded-lg max-w-[80%] ${
                  msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-white border'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {typing && (
              <div className="mb-4 flex justify-start">
                <div className="px-4 py-2 bg-white border rounded-lg">
                  <Loader2 className="animate-spin text-gray-400" size={16} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-white">
        {status === 'connected' ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSend}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              <Send size={16} />
            </button>
          </div>
        ) : (
          <p className="text-center text-gray-400">Connecting...</p>
        )}
      </div>
    </div>
  );
}