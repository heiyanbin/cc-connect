import { MessageSquare } from 'lucide-react';

function getSessionDisplayName(session) {
  // Use displayName if already set (from AgentLayout)
  if (session.displayName) return session.displayName;

  // Try to get first user message from history
  if (session.history && session.history.length > 0) {
    const firstUserMsg = session.history.find(h => h.role === 'user');
    if (firstUserMsg?.content) {
      const content = firstUserMsg.content.trim();
      return content.length > 30 ? content.slice(0, 30) + '...' : content;
    }
  }

  // Fallback to name or id
  return session.name || session.id?.slice(0, 8) || 'New Chat';
}

function getChannelFromSessionKey(sessionKey) {
  if (!sessionKey) return null;
  return sessionKey.split(':')[0];
}

const CHANNEL_STYLES = {
  weixin: 'bg-green-100 text-green-600 dark:bg-green-800/50 dark:text-green-400',
  bridge: 'bg-blue-100 text-blue-600 dark:bg-blue-800/50 dark:text-blue-400',
  feishu: 'bg-orange-100 text-orange-600 dark:bg-orange-800/50 dark:text-orange-400',
};

const CHANNEL_LABELS = {
  weixin: '微信',
  bridge: 'Web',
  feishu: '飞书',
};

export default function SessionItem({ session, active, onClick }) {
  const displayName = getSessionDisplayName(session);
  const channel = getChannelFromSessionKey(session.session_key);

  const timeStr = session.updated_at
    ? new Date(session.updated_at).toLocaleString('zh-CN', {
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    : '';

  return (
    <button
      onClick={onClick}
      className={`w-full px-3 py-2.5 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
        active ? 'bg-blue-50 dark:bg-blue-900/20' : ''
      }`}
    >
      <div className="flex items-center gap-2">
        <MessageSquare size={14} className={active ? 'text-blue-500' : 'text-gray-400'} />
        <span className="text-sm truncate text-gray-900 dark:text-white">
          {displayName}
        </span>
      </div>
      <div className="flex items-center gap-2 mt-0.5 pl-[22px]">
        {timeStr && (
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {timeStr}
          </span>
        )}
        {channel && (
          <span className={`text-xs px-1.5 py-0.5 rounded ${CHANNEL_STYLES[channel] || 'bg-gray-100 text-gray-500'}`}>
            {CHANNEL_LABELS[channel] || channel}
          </span>
        )}
      </div>
    </button>
  );
}