import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, CheckCircle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import Sidebar from '../components/Sidebar';
import ChatPanel from './ChatPanel';
import { listSessions, getSession, createSession, setupWeixinBegin, setupWeixinPoll } from '../api/ccConnect';
import { createProject, getUserProjects } from '../api/projects';
import { fetchBridgeConfig } from '../hooks/useBridgeSocket';

export default function AgentLayout() {
  const { agentName } = useParams();
  const [project, setProject] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [bridgeConfig, setBridgeConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // QR connection state
  const [qrUrl, setQrUrl] = useState('');
  const [qrKey, setQrKey] = useState('');
  const [qrStatus, setQrStatus] = useState(''); // loading, scanning, scanned, confirmed, error
  const [qrError, setQrError] = useState('');

  // Check connection on mount
  useEffect(() => {
    checkConnection();
  }, [agentName]);

  // Load sessions when project is set
  useEffect(() => {
    if (project) loadSessions();
  }, [project]);

  async function checkConnection() {
    setLoading(true);
    const userId = localStorage.getItem('wechat_agent_user_id');
    const projectName = userId ? `${userId}-${agentName}` : null;

    try {
      const cfg = await fetchBridgeConfig();
      setBridgeConfig(cfg);

      if (!userId || !projectName) {
        setConnecting(true);
        setLoading(false);
        return;
      }

      const { projects } = await getUserProjects(userId);
      const existing = projects?.find(p => p.name === projectName);

      if (existing) {
        setProject(existing);
        setLoading(false);
      } else {
        setConnecting(true);
        setLoading(false);
      }
    } catch (e) {
      console.error('Check connection error:', e);
      setConnecting(true);
    } finally {
      setLoading(false);
    }
  }

  async function loadSessions() {
    if (!project) return;
    setLoading(true);
    try {
      const { sessions: allSessions } = await listSessions(project.name);
      const sorted = (allSessions || []).sort(
        (a, b) => (b.updated_at || b.created_at || '').localeCompare(a.updated_at || a.created_at || ''),
      );

      // Fetch details for all sessions to get history for display names
      const sessionsWithDetails = await Promise.all(
        sorted.map(async (s) => {
          try {
            const detail = await getSession(project.name, s.id, 50);
            // Extract displayName from first user message
            if (detail.history && detail.history.length > 0) {
              const firstUserMsg = detail.history.find(h => h.role === 'user');
              if (firstUserMsg?.content) {
                return { ...s, displayName: firstUserMsg.content.trim().slice(0, 30), history: detail.history };
              }
            }
            return { ...s, history: detail.history };
          } catch {
            return s;
          }
        })
      );

      setSessions(sessionsWithDetails);

      if (sessionsWithDetails.length > 0) {
        const latest = sessionsWithDetails[0];
        const detail = latest.history ? latest : await getSession(project.name, latest.id, 200);
        setCurrentSession(detail);
      } else {
        // No sessions, create a new one
        await handleNewSession();
      }
    } catch (e) {
      console.error('Load sessions error:', e);
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectSession(s) {
    if (!project) return;
    setLoading(true);
    try {
      const detail = await getSession(project.name, s.id, 200);
      setCurrentSession(detail);

      // Update displayName in sessions list based on first user message
      if (detail.history && detail.history.length > 0) {
        const firstUserMsg = detail.history.find(h => h.role === 'user');
        if (firstUserMsg?.content) {
          const displayName = firstUserMsg.content.trim().slice(0, 30);
          setSessions(prev => prev.map(sess =>
            sess.id === detail.id ? { ...sess, displayName } : sess
          ));
        }
      }
    } catch (e) {
      console.error('Select session error:', e);
    } finally {
      setLoading(false);
    }
  }

  async function handleNewSession() {
    if (!project) return;
    setLoading(true);
    try {
      const sessionKey = `bridge:web-user:${project.name}`;
      await createSession(project.name, sessionKey);
      // Reload sessions list to get real session data from server
      const { sessions: allSessions } = await listSessions(project.name);
      const sorted = (allSessions || []).sort(
        (a, b) => (b.updated_at || b.created_at || '').localeCompare(a.updated_at || a.created_at || ''),
      );
      setSessions(sorted);
      // Select the newest session (first in sorted list)
      if (sorted.length > 0) {
        const detail = await getSession(project.name, sorted[0].id, 200);
        setCurrentSession(detail);
      }
    } catch (e) {
      console.error('New session error:', e);
    } finally {
      setLoading(false);
    }
  }

  // QR Connection Flow
  async function startQRConnection() {
    setQrStatus('loading');
    setQrError('');
    try {
      const result = await setupWeixinBegin();
      setQrUrl(result.qr_url);
      setQrKey(result.qr_key);
      setQrStatus('scanning');
      pollQRStatus(result.qr_key);
    } catch (e) {
      setQrError(e.message || 'Failed to generate QR');
      setQrStatus('error');
    }
  }

  async function pollQRStatus(key) {
    while (true) {
      try {
        const result = await setupWeixinPoll(key);

        if (result.status === 'scaned') {
          setQrStatus('scanned');
        } else if (result.status === 'confirmed') {
          setQrStatus('confirmed');

          // Create project
          const projectName = `${result.ilink_user_id}-${agentName}`;
          await createProject({
            agent_name: agentName,
            bot_token: result.bot_token,
            ilink_bot_id: result.ilink_bot_id,
            ilink_user_id: result.ilink_user_id,
            base_url: result.base_url,
          });

          // Store user ID
          localStorage.setItem('wechat_agent_user_id', result.ilink_user_id);

          // Set project and trigger session loading
          setProject({ name: projectName });
          setConnecting(false);
          return;
        } else if (result.status === 'expired') {
          setQrError('QR expired, please retry');
          setQrStatus('error');
          return;
        }

        await new Promise(r => setTimeout(r, 2000));
      } catch (e) {
        console.error('Poll error:', e);
        setQrError(e.message || 'Poll failed');
        setQrStatus('error');
        return;
      }
    }
  }

  // Start QR connection when connecting mode is set
  useEffect(() => {
    if (connecting && !qrUrl && qrStatus !== 'loading') {
      startQRConnection();
    }
  }, [connecting]);

  if (loading && !connecting) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-950">
        <Loader2 className="animate-spin text-gray-400" size={24} />
      </div>
    );
  }

  // QR Connection View
  if (connecting) {
    return (
      <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-950">
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <h1 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Connect to {agentName}</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-8">Scan with WeChat to bind your account</p>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            {qrStatus === 'loading' && (
              <div className="flex items-center gap-2">
                <Loader2 className="animate-spin text-gray-400" size={24} />
                <span className="text-gray-500 dark:text-gray-400">Generating QR...</span>
              </div>
            )}

            {qrStatus === 'scanning' && qrUrl && (
              <div className="flex flex-col items-center gap-4">
                <QRCodeSVG value={qrUrl} size={256} level="H" />
                <p className="text-sm text-gray-400 dark:text-gray-500">Scan with WeChat to connect</p>
              </div>
            )}

            {qrStatus === 'scanned' && (
              <div className="text-center text-gray-500 dark:text-gray-400">
                <p>Scanned! Please confirm on your phone...</p>
              </div>
            )}

            {qrStatus === 'confirmed' && (
              <div className="flex items-center justify-center gap-2 text-green-500">
                <CheckCircle size={24} />
                <span>Connected!</span>
              </div>
            )}

            {qrStatus === 'error' && (
              <div className="text-center">
                <p className="text-red-500 dark:text-red-400">{qrError}</p>
                <button onClick={startQRConnection} className="mt-4 text-blue-500 dark:text-blue-400 hover:underline">
                  Retry
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Main Layout: Sidebar + ChatPanel
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar
        agent={agentName}
        sessions={sessions}
        currentSession={currentSession}
        onSelectSession={handleSelectSession}
        onNewSession={handleNewSession}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <ChatPanel
        projectName={project?.name}
        session={currentSession}
        bridgeConfig={bridgeConfig}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />
    </div>
  );
}