// Filter pattern for public projects (Agents visible to users)
export const PUBLIC_PROJECT_PATTERN = /^public-/;

// API base URL (from env or default)
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

// SessionKey storage key format
export const SESSION_KEY_STORAGE_KEY = (agentName: string) => `cc_user_session_${agentName}`;

// Poll interval for QR scanning (ms)
export const QR_POLL_INTERVAL = 2000;