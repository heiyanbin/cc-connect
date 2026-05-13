import { useEffect, useRef, useState, useCallback } from 'react';

export function useBridgeSocket({ bridgeConfig, sessionKey, projectName, onMessage }) {
  const wsRef = useRef(null);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;
  const pingRef = useRef(null);
  const [status, setStatus] = useState('disconnected');

  const send = useCallback((data) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  const sendMessage = useCallback((content) => {
    send({
      type: 'message',
      msg_id: `web-${Date.now()}`,
      session_key: sessionKey,
      user_id: 'web-user',
      user_name: 'Web User',
      content,
      reply_ctx: sessionKey,
      project: projectName || '',
    });
  }, [send, sessionKey, projectName]);

  const sendCardAction = useCallback((action, replyCtx) => {
    send({
      type: 'card_action',
      session_key: sessionKey,
      action,
      reply_ctx: replyCtx || sessionKey,
      project: projectName || '',
    });
  }, [send, sessionKey, projectName]);

  useEffect(() => {
    if (!bridgeConfig) return;

    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${proto}//${window.location.host}${bridgeConfig.path}?token=${encodeURIComponent(bridgeConfig.token)}`;

    let ws;
    let reconnectTimer;
    let alive = true;

    const connect = () => {
      if (!alive) return;
      setStatus('connecting');
      ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setStatus('registering');
        ws.send(JSON.stringify({
          type: 'register',
          platform: 'wechat-web',
          capabilities: ['text', 'card', 'buttons', 'typing', 'update_message', 'preview', 'reconstruct_reply'],
          metadata: { version: '1.0.0', description: 'WeChat Agent Web' },
        }));
      };

      ws.onmessage = (evt) => {
        try {
          const msg = JSON.parse(evt.data);
          if (msg.type === 'register_ack') {
            if (msg.ok) {
              setStatus('connected');
              pingRef.current = setInterval(() => {
                send({ type: 'ping', ts: Date.now() });
              }, 25000);
            } else {
              setStatus('error');
            }
          }
          onMessageRef.current(msg);
        } catch { }
      };

      ws.onclose = () => {
        setStatus('disconnected');
        wsRef.current = null;
        if (pingRef.current) clearInterval(pingRef.current);
        if (alive) reconnectTimer = setTimeout(connect, 3000);
      };

      ws.onerror = () => {
        setStatus('error');
      };
    };

    connect();

    return () => {
      alive = false;
      clearTimeout(reconnectTimer);
      if (pingRef.current) clearInterval(pingRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }
      setStatus('disconnected');
    };
  }, [bridgeConfig, send]);

  return { status, sendMessage, sendCardAction };
}

export async function fetchBridgeConfig() {
  try {
    const res = await fetch('/api/cc-connect/status');
    const status = await res.json();
    if (status.bridge?.enabled) {
      return {
        path: status.bridge.path,
        token: status.bridge.token,
      };
    }
  } catch { }
  return null;
}