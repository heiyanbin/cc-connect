import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, X } from 'lucide-react';
import SessionItem from './SessionItem';

export default function Sidebar({ agent, sessions, currentSession, onSelectSession, onNewSession, open, onClose }) {
  const navigate = useNavigate();

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:relative inset-y-0 left-0 z-50 md:z-auto w-[280px] bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col transform transition-transform duration-200 ${
          open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Header */}
        <header className="p-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/')}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"
            >
              <ArrowLeft size={18} />
            </button>
            <h2 className="font-semibold text-gray-900 dark:text-white">{agent}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 md:hidden"
          >
            <X size={18} />
          </button>
        </header>

        {/* New Session Button */}
        <div className="p-3">
          <button
            onClick={onNewSession}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2 justify-center"
          >
            <Plus size={16} />
            <span>New Chat</span>
          </button>
        </div>

        {/* Session List */}
        <div className="flex-1 overflow-y-auto">
          {sessions.length === 0 ? (
            <p className="text-center text-gray-400 dark:text-gray-500 p-4 text-sm">No sessions yet</p>
          ) : (
            sessions.map((s) => (
              <SessionItem
                key={s.id}
                session={s}
                active={currentSession?.id === s.id}
                onClick={() => {
                  onSelectSession(s);
                  onClose();
                }}
              />
            ))
          )}
        </div>
      </aside>
    </>
  );
}