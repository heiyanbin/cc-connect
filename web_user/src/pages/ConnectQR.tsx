import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { QRDisplay } from '@/components/ui/QRDisplay';
import { setupWeixinBegin, setupWeixinPoll, setupWeixinSave } from '@/api/setup';
import { setSessionKey } from '@/hooks/useSessionKey';
import { displayAgentName } from '@/lib/utils';
import { sleep } from '@/lib/utils';

type Phase = 'idle' | 'loading' | 'scanning' | 'scanned' | 'confirmed' | 'expired' | 'error' | 'saving' | 'done';

export default function ConnectQR() {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>('idle');
  const [qrUrl, setQrUrl] = useState('');
  const [error, setError] = useState('');
  const cancelledRef = useRef(false);
  const qrKeyRef = useRef('');

  useEffect(() => {
    return () => { cancelledRef.current = true; };
  }, []);

  useEffect(() => {
    startFlow();
  }, [name]);

  async function startFlow() {
    if (!name) return;
    setPhase('loading');
    setError('');
    cancelledRef.current = false;

    try {
      const res = await setupWeixinBegin();
      qrKeyRef.current = res.qr_key;
      setQrUrl(res.qr_url);
      setPhase('scanning');
      poll();
    } catch (e: any) {
      setError(e.message || 'Failed to start');
      setPhase('error');
    }
  }

  async function poll() {
    while (!cancelledRef.current) {
      try {
        const res = await setupWeixinPoll(qrKeyRef.current);

        if (cancelledRef.current) break;

        switch (res.status) {
          case 'scaned':
            setPhase('scanned');
            break;
          case 'confirmed':
            setPhase('saving');
            await setupWeixinSave({
              project: name!,
              token: res.bot_token!,
              ilink_bot_id: res.ilink_bot_id,
              ilink_user_id: res.ilink_user_id,
            });
            // Store sessionKey
            const sessionKey = `weixin:dm:${res.ilink_user_id}`;
            setSessionKey(name!, sessionKey);
            setPhase('done');
            // Redirect to chat after short delay
            setTimeout(() => navigate(`/chat/${name}`), 500);
            return;
          case 'expired':
            setPhase('expired');
            return;
        }
      } catch (e: any) {
        setError(e.message || 'Poll failed');
        setPhase('error');
        return;
      }

      await sleep(2000);
    }
  }

  const handleRetry = () => {
    startFlow();
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <Link to="/" className="flex items-center gap-2 text-gray-500 hover:text-gray-700">
          <ArrowLeft size={16} />
          <span>Back to Agents</span>
        </Link>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <h1 className="text-xl font-bold mb-2">
          Connect to {displayAgentName(name || '')}
        </h1>
        <p className="text-gray-500 mb-8">Scan with WeChat to bind your account</p>

        <QRDisplay
          qrUrl={qrUrl}
          status={
            phase === 'done' ? 'confirmed' :
            phase === 'saving' ? 'scanned' :
            phase === 'idle' ? 'loading' :
            phase
          }
          error={error}
          onRetry={handleRetry}
        />

        {phase === 'done' && (
          <p className="mt-4 text-emerald-500">Redirecting to chat...</p>
        )}
      </div>
    </div>
  );
}