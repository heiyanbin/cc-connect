import api from './client';

export interface LastMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface Session {
  id: string;
  name?: string;
  created_at: string;
  updated_at?: string;
  last_message?: LastMessage | null;
  live?: boolean;
}

export interface SessionsResponse {
  sessions: Session[];
}

export interface HistoryEntry {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface HistoryResponse {
  history: HistoryEntry[];
}

export interface SendMessageRequest {
  session_key: string;
  message: string;
}

export interface SendMessageResponse {
  message: string;
}

// List sessions for a project
export const listSessions = (project: string): Promise<SessionsResponse> =>
  api.get<SessionsResponse>(`/projects/${project}/sessions`);

// Get session history
export const getSessionHistory = (project: string, sessionId: string): Promise<HistoryResponse> =>
  api.get<HistoryResponse>(`/projects/${project}/sessions/${sessionId}/history`);

// Send a message
export const sendMessage = (project: string, body: SendMessageRequest): Promise<SendMessageResponse> =>
  api.post<SendMessageResponse>(`/projects/${project}/send`, body);