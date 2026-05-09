import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bot, ArrowRight } from 'lucide-react';
import { Card, Badge, EmptyState } from '@/components/ui';
import { listProjects, type ProjectSummary } from '@/api/projects';
import { PUBLIC_PROJECT_PATTERN } from '@/lib/constants';
import { displayAgentName } from '@/lib/utils';

export default function AgentList() {
  const [agents, setAgents] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAgents();
  }, []);

  async function loadAgents() {
    setLoading(true);
    setError('');
    try {
      const { projects } = await listProjects();
      // Filter public projects only
      const publicProjects = projects.filter(p => PUBLIC_PROJECT_PATTERN.test(p.name));
      setAgents(publicProjects);
    } catch (e: any) {
      setError(e.message || 'Failed to load agents');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400 animate-pulse">Loading agents...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-red-500">{error}</p>
        <button onClick={loadAgents} className="text-accent hover:underline">Retry</button>
      </div>
    );
  }

  if (agents.length === 0) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-bold mb-6">Agents</h1>
        <EmptyState message="No agents available" icon={Bot} />
      </div>
    );
  }

  return (
    <div className="p-8 animate-fade-in">
      <h1 className="text-xl font-bold mb-6">Agents</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map((agent) => (
          <Link key={agent.name} to={`/connect/${agent.name}`}>
            <Card hover className="h-full">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Bot size={18} className="text-accent" />
                  <h3 className="font-semibold">{displayAgentName(agent.name)}</h3>
                </div>
                <ArrowRight size={16} className="text-gray-400" />
              </div>

              <div className="flex items-center gap-2 mb-3">
                <Badge>{agent.agent_type}</Badge>
                {agent.platforms?.slice(0, 2).map(p => <Badge key={p}>{p}</Badge>)}
              </div>

              <p className="text-xs text-gray-500">
                {agent.sessions_count ?? 0} sessions
              </p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}