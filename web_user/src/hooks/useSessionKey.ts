import { useCallback } from 'react';
import { SESSION_KEY_STORAGE_KEY } from '@/lib/constants';

// Get sessionKey for an agent from localStorage
export function getSessionKey(agentName: string): string | null {
  const key = SESSION_KEY_STORAGE_KEY(agentName);
  return localStorage.getItem(key);
}

// Set sessionKey for an agent
export function setSessionKey(agentName: string, sessionKey: string): void {
  const key = SESSION_KEY_STORAGE_KEY(agentName);
  localStorage.setItem(key, sessionKey);
}

// Clear sessionKey for an agent
export function clearSessionKey(agentName: string): void {
  const key = SESSION_KEY_STORAGE_KEY(agentName);
  localStorage.removeItem(key);
}

// Hook to manage sessionKey
export function useSessionKey(agentName: string) {
  const get = useCallback(() => getSessionKey(agentName), [agentName]);
  const set = useCallback((sk: string) => setSessionKey(agentName, sk), [agentName]);
  const clear = useCallback(() => clearSessionKey(agentName), [agentName]);

  return { get, set, clear, sessionKey: get() };
}