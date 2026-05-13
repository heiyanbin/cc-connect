import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { setupWeixinBegin, setupWeixinPoll } from '../api/ccConnect';
import { createProject, getUserProjects } from '../api/projects';

export default function ConnectQR() {
  const { agentName } = useParams();
  const navigate = useNavigate();
  const [qrUrl, setQrUrl] = useState('');
  const [qrKey, setQrKey] = useState('');
  const [status, setStatus] = useState('loading'); // loading, scanning, scanned, creating, confirmed, error
  const [error, setError] = useState('');

  useEffect(() => {
    checkExistingConnection();
  }, [agentName]);

  async function checkExistingConnection() {
    const savedUserId = localStorage.getItem('wechat_agent_user_id');
    if (!savedUserId) {
      // No existing session, start scan
      startScan();
      return;
    }

    // Check if project for this specific agent exists
    const expectedProjectName = `${savedUserId}-${agentName}`;
    try {
      const { projects } = await getUserProjects(savedUserId);
      const existingProject = projects?.find(p => p.name === expectedProjectName);

      if (existingProject) {
        // Already connected to this agent, go to chat
        navigate(`/chat/${expectedProjectName}`, { replace: true });
      } else {
        // Connected to other agents, but not this one - need to scan
        startScan();
      }
    } catch (e) {
      // API error - fall back to scan
      console.error('Check existing connection error:', e);
      startScan();
    }
  }

  async function startScan() {
    setStatus('loading');
    setError('');
    try {
      const result = await setupWeixinBegin();
      setQrUrl(result.qr_url);
      setQrKey(result.qr_key);
      setStatus('scanning');
      pollStatus(result.qr_key);
    } catch (e) {
      setError(e.message || 'Failed to generate QR');
      setStatus('error');
    }
  }

  async function pollStatus(key) {
    while (true) {
      try {
        const result = await setupWeixinPoll(key);
        console.log('Poll result:', result);

        if (result.status === 'scaned') {
          setStatus('scanned');
        } else if (result.status === 'confirmed') {
          setStatus('creating');
          setError('');

          console.log('Creating project with:', {
            agent_name: agentName,
            bot_token: result.bot_token,
            ilink_user_id: result.ilink_user_id
          });

          // Create project
          const projectName = `${result.ilink_user_id}-${agentName}`;
          const createResult = await createProject({
            agent_name: agentName,
            bot_token: result.bot_token,
            ilink_bot_id: result.ilink_bot_id,
            ilink_user_id: result.ilink_user_id,
            base_url: result.base_url
          });
          console.log('Create result:', createResult);

          // Store session key
          localStorage.setItem('wechat_agent_user_id', result.ilink_user_id);
          localStorage.setItem('wechat_agent_session_key', `weixin:dm:${result.ilink_user_id}`);

          setStatus('confirmed');
          // Navigate to chat after short delay
          setTimeout(() => navigate(`/chat/${projectName}`), 500);
          return;
        } else if (result.status === 'expired') {
          setError('QR expired, please retry');
          setStatus('error');
          return;
        }

        await new Promise(r => setTimeout(r, 2000));
      } catch (e) {
        console.error('Poll error:', e);
        setError(e.message || 'Poll failed');
        setStatus('error');
        return;
      }
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-white">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-gray-500 hover:text-gray-700">
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <h1 className="text-xl font-bold mb-2">Connect to {agentName}</h1>
        <p className="text-gray-500 mb-8">Scan with WeChat to bind your account</p>

        <div className="bg-white p-6 rounded-lg border">
          {status === 'loading' && (
            <div className="flex items-center gap-2">
              <Loader2 className="animate-spin text-gray-400" size={24} />
              <span className="text-gray-500">Generating QR...</span>
            </div>
          )}

          {status === 'scanning' && qrUrl && (
            <div className="flex flex-col items-center gap-4">
              <QRCodeSVG value={qrUrl} size={256} level="H" />
              <p className="text-sm text-gray-400">Scan with WeChat to connect</p>
            </div>
          )}

          {status === 'scanned' && (
            <div className="text-center text-gray-500">
              <p>Scanned! Please confirm on your phone...</p>
            </div>
          )}

          {status === 'creating' && (
            <div className="flex items-center gap-2">
              <Loader2 className="animate-spin text-gray-400" size={24} />
              <span className="text-gray-500">Creating project...</span>
            </div>
          )}

          {status === 'confirmed' && (
            <div className="flex items-center justify-center gap-2 text-green-500">
              <CheckCircle size={24} />
              <span>Connected! Redirecting...</span>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center">
              <p className="text-red-500">{error}</p>
              <button onClick={startScan} className="mt-4 text-blue-500 hover:underline">
                Retry
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}