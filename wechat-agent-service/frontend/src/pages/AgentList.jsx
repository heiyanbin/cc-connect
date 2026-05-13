import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bot, ArrowRight, Sun, Moon, Monitor } from 'lucide-react';
import { listAgents } from '../api/agents';
import { useThemeStore } from '../store/theme';

export default function AgentList() {
  const { theme, setTheme } = useThemeStore();
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const themeIcons = { light: Sun, dark: Moon, system: Monitor };
  const nextTheme = { light: 'dark', dark: 'system', system: 'light' };
  const ThemeIcon = themeIcons[theme];

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const { agents: list } = await listAgents();
      setAgents(list);
    } catch (e) {
      setError(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-950">
        <p className="text-gray-400 dark:text-gray-500 animate-pulse">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 bg-gray-50 dark:bg-gray-950">
        <p className="text-red-500 dark:text-red-400">{error}</p>
        <button onClick={loadData} className="text-blue-500 dark:text-blue-400 hover:underline">Retry</button>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 dark:bg-gray-950">
      {/* Header with theme toggle */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setTheme(nextTheme[theme])}
          className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <ThemeIcon size={20} />
        </button>
      </div>

      {/* Available Agents Section */}
      <h2 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">Available Agents</h2>
      {agents.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">No agents available</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent) => (
            <Link
              key={agent.name}
              to={`/agent/${agent.name}`}
              className="block p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-md transition"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bot className="text-blue-500 dark:text-blue-400" size={24} />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{agent.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{agent.description}</p>
                  </div>
                </div>
                <ArrowRight className="text-gray-400 dark:text-gray-500" size={20} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}