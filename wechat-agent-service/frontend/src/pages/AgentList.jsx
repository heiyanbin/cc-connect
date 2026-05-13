import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bot, ArrowRight, MessageCircle } from 'lucide-react';
import { listAgents } from '../api/agents';
import { getUserProjects } from '../api/projects';

export default function AgentList() {
  const navigate = useNavigate();
  const [agents, setAgents] = useState([]);
  const [connectedProjects, setConnectedProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const savedUserId = localStorage.getItem('wechat_agent_user_id');

  useEffect(() => {
    loadData();
  }, [savedUserId]);

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const { agents: list } = await listAgents();
      setAgents(list);

      if (savedUserId) {
        const { projects } = await getUserProjects(savedUserId);
        setConnectedProjects(projects || []);
      }
    } catch (e) {
      setError(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  function goToChat(project) {
    navigate(`/chat/${project.name}`);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400 animate-pulse">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-red-500">{error}</p>
        <button onClick={loadData} className="text-blue-500 hover:underline">Retry</button>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Connected Projects Section */}
      {connectedProjects.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 text-gray-700">Connected Projects</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {connectedProjects.map((project) => (
              <button
                key={project.name}
                onClick={() => goToChat(project)}
                className="block p-4 bg-green-50 rounded-lg border border-green-200 hover:border-green-500 hover:shadow-md transition text-left"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MessageCircle className="text-green-500" size={24} />
                    <div>
                      <h3 className="font-semibold text-green-700">{project.name}</h3>
                      <p className="text-sm text-green-600">Click to chat</p>
                    </div>
                  </div>
                  <ArrowRight className="text-green-400" size={20} />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Available Agents Section */}
      <h2 className="text-lg font-semibold mb-4 text-gray-700">Available Agents</h2>
      {agents.length === 0 ? (
        <p className="text-gray-500">No agents available</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent) => (
            <Link
              key={agent.name}
              to={`/connect/${agent.name}`}
              className="block p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-500 hover:shadow-md transition"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bot className="text-blue-500" size={24} />
                  <div>
                    <h3 className="font-semibold">{agent.name}</h3>
                    <p className="text-sm text-gray-500">{agent.description}</p>
                  </div>
                </div>
                <ArrowRight className="text-gray-400" size={20} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}