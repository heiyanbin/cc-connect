import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Send, ChevronDown, MessageSquare, Copy, Check, User, Bot, Sun, Moon, Monitor } from 'lucide-react';
import { listSessions, getSession } from '../api/ccConnect';
import { useBridgeSocket, fetchBridgeConfig } from '../hooks/useBridgeSocket';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { useThemeStore } from '../store/theme';

// Markdown rendering components (same as admin web)
function CopyButton({ code }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="absolute top-2 right-2 p-1.5 rounded-md bg-gray-200/80 hover:bg-gray-300 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity z-10"
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
    </button>
  );
}

function PreBlock({ children, ...props }) {
  const codeEl = children?.props;
  const lang = codeEl?.className?.replace(/^language-/, '') || '';
  const code = typeof codeEl?.children === 'string' ? codeEl.children.replace(/\n$/, '') : '';
  return (
    <div className="not-prose relative group my-4">
      {lang && (
        <div className="absolute top-0 left-0 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 rounded-tl-lg rounded-br-lg border-b border-r border-gray-200 dark:border-gray-700 font-mono">
          {lang}
        </div>
      )}
      <CopyButton code={code} />
      <pre className="overflow-x-auto rounded-lg bg-[#fafafa] dark:bg-[#0d1117] border border-gray-200 dark:border-gray-700/60 p-4 pt-8 text-[13px] leading-[1.6] font-mono" {...props}>
        {children}
      </pre>
    </div>
  );
}

function InlineCode({ children, className, ...props }) {
  if (className) return <code className={className} {...props}>{children}</code>;
  return (
    <code className="px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-pink-600 dark:text-pink-400 text-[0.875em] font-mono border border-gray-200/60 dark:border-gray-700/40" {...props}>
      {children}
    </code>
  );
}

function RenderMarkdown({ content }) {
  return (
    <div className="prose max-w-none dark:prose-invert prose-headings:font-semibold prose-headings:tracking-tight prose-h1:text-xl prose-h1:mt-5 prose-h1:mb-3 prose-h1:pb-1.5 prose-h1:border-b prose-h1:border-gray-200 dark:prose-h1:border-gray-700 prose-h2:text-lg prose-h2:mt-5 prose-h2:mb-2 prose-h3:text-base prose-h3:mt-4 prose-h3:mb-2 prose-p:my-2.5 prose-p:leading-relaxed prose-li:my-0.5 prose-ul:my-2 prose-ol:my-2 prose-a:text-blue-500 dark:prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline prose-strong:text-gray-900 dark:prose-strong:text-white prose-strong:font-semibold prose-blockquote:border-l-[3px] prose-blockquote:border-blue-400/40 prose-blockquote:bg-blue-50 dark:prose-blockquote:bg-blue-900/20 prose-blockquote:rounded-r-lg prose-blockquote:py-0.5 prose-blockquote:px-4 prose-blockquote:my-3 prose-blockquote:italic prose-blockquote:text-gray-600 dark:prose-blockquote:text-gray-300 prose-hr:my-5 prose-hr:border-gray-200 dark:prose-hr:border-gray-700 prose-table:text-sm prose-th:bg-gray-50 dark:prose-th:bg-gray-800 prose-th:px-3 prose-th:py-2 prose-td:px-3 prose-td:py-2 prose-img:rounded-lg prose-img:shadow-sm">
      <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]} components={{ pre: PreBlock, code: InlineCode }}>
        {content}
      </Markdown>
    </div>
  );
}
function CardBlock({ card, onAction }) {
  if (!card) return null;
  return (
    <div className="space-y-3">
      {card.header?.title && (
        <div className="font-semibold text-gray-900 dark:text-white">{card.header.title}</div>
      )}
      {card.elements?.map((el, i) => (
        <CardElement key={i} el={el} onAction={onAction} />
      ))}
    </div>
  );
}

function CardElement({ el, onAction }) {
  if (el.type === 'markdown') {
    return <RenderMarkdown content={el.content} />;
  }
  if (el.type === 'divider') {
    return <hr className="border-gray-200 dark:border-gray-700" />;
  }
  if (el.type === 'note') {
    return <p className="text-xs text-gray-400 dark:text-gray-500">{el.text}</p>;
  }
  if (el.type === 'actions') {
    return (
      <div className="flex flex-wrap gap-2">
        {el.buttons?.map((btn, j) => (
          <button
            key={j}
            onClick={() => onAction(btn.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              btn.btn_type === 'primary'
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : btn.btn_type === 'danger'
                ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {btn.text}
          </button>
        ))}
      </div>
    );
  }
  return null;
}

function ButtonsBlock({ content, buttons, onAction }) {
  return (
    <div className="space-y-3">
      <div className="whitespace-pre-wrap text-sm">{content}</div>
      {buttons?.map((row, i) => (
        <div key={i} className="flex flex-wrap gap-2">
          {row?.map((btn, j) => (
            <button
              key={j}
              onClick={() => onAction(btn.data)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500 text-white hover:bg-blue-600"
            >
              {btn.text}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

export default function ChatView() {
  const { projectName } = useParams();
  const { theme, setTheme } = useThemeStore();
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

  const themeIcons = { light: Sun, dark: Moon, system: Monitor };
  const nextTheme = { light: 'dark', dark: 'system', system: 'light' };
  const ThemeIcon = themeIcons[theme];

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
            type: 'text',
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
          type: 'text',
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

  const { status, sendMessage, sendCardAction } = useBridgeSocket({
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
          type: 'text',
          content
        }]);
        setTyping(false);
      } else if (msg.type === 'card') {
        setMessages(prev => [...prev, {
          id: `card-${Date.now()}`,
          role: 'assistant',
          type: 'card',
          card: msg.card
        }]);
        setTyping(false);
      } else if (msg.type === 'buttons') {
        setMessages(prev => [...prev, {
          id: `btn-${Date.now()}`,
          role: 'assistant',
          type: 'buttons',
          content: msg.content,
          buttons: msg.buttons
        }]);
        setTyping(false);
      } else if (msg.type === 'typing_start') {
        setTyping(true);
      } else if (msg.type === 'typing_stop') {
        setTyping(false);
      }
    }
  });

  const handleCardAction = useCallback((action) => {
    sendCardAction(action, sessionKeyToUse);
  }, [sendCardAction, sessionKeyToUse]);

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
      type: 'text',
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
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950">
      {/* Header */}
      <div className="sticky top-0 p-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex items-center justify-between">
        <button onClick={() => window.history.back()} className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>

        {/* Session selector */}
        <div className="flex items-center gap-2 relative">
          <button
            onClick={() => setShowSessionList(!showSessionList)}
            className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
          >
            <MessageSquare size={14} />
            <span className="truncate max-w-[150px]">
              {currentSession?.name || currentSession?.id?.slice(0, 8) || 'New'}
            </span>
            <ChevronDown size={14} />
          </button>

          {showSessionList && sessions.length > 0 && (
            <div className="absolute top-12 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 min-w-[200px]">
              {sessions.map(s => (
                <button
                  key={s.id}
                  onClick={() => switchToSession(s)}
                  className={`w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 ${
                    currentSession?.id === s.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                >
                  <div className="text-sm font-medium truncate text-gray-900 dark:text-white">
                    {s.name || s.id.slice(0, 8)}
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500">
                    {s.updated_at ? new Date(s.updated_at).toLocaleDateString() : ''}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <button
            onClick={() => setTheme(nextTheme[theme])}
            className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <ThemeIcon size={16} />
          </button>

          <span className="text-sm text-gray-400 dark:text-gray-500">
            {status === 'connected' ? 'Connected' : status === 'registering' ? 'Registering...' : status === 'connecting' ? 'Connecting...' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="animate-spin text-gray-400" size={24} />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-center text-gray-400 dark:text-gray-500">Start a conversation</p>
        ) : (
          <>
            {messages.map(msg => {
              const isUser = msg.role === 'user';
              return (
                <div key={msg.id} className={`mb-4 flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
                  {!isUser && (
                    <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0 mt-1">
                      <Bot size={16} className="text-blue-500 dark:text-blue-400" />
                    </div>
                  )}
                  <div className={`px-4 py-2.5 rounded-2xl max-w-[80%] ${
                    isUser ? 'bg-blue-500 text-white rounded-br-md' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-bl-md shadow-sm'
                  }`}>
                    {msg.type === 'card' ? (
                      <CardBlock card={msg.card} onAction={handleCardAction} />
                    ) : msg.type === 'buttons' ? (
                      <ButtonsBlock content={msg.content} buttons={msg.buttons} onAction={handleCardAction} />
                    ) : isUser ? (
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    ) : (
                      <RenderMarkdown content={msg.content} />
                    )}
                  </div>
                  {isUser && (
                    <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center shrink-0 mt-1">
                      <User size={16} className="text-gray-500 dark:text-gray-400" />
                    </div>
                  )}
                </div>
              );
            })}
            {typing && (
              <div className="mb-4 flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0 mt-1">
                  <Bot size={16} className="text-blue-500 dark:text-blue-400" />
                </div>
                <div className="px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl rounded-bl-md shadow-sm">
                  <div className="flex gap-1.5">
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
      <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        {status === 'connected' ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />
            <button
              onClick={handleSend}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              <Send size={16} />
            </button>
          </div>
        ) : (
          <p className="text-center text-gray-400 dark:text-gray-500">Connecting...</p>
        )}
      </div>
    </div>
  );
}