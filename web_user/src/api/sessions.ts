import api from './client';

export interface LastMessage {
  role: string;
  content: string;
  timestamp: string;
}

export interface Session {
  id: string;
  session_key: string;
  name: string;
  platform: string;
  agent_type: string;
  active: boolean;
  live: boolean;
  created_at: string;
  updated_at: string;
  history_count: number;
  last_message: LastMessage | null;
  user_name?: string;
  chat_name?: string;
}

export interface SessionDetail extends Session {
  agent_session_id: string;
  history: { role: string; content: string; timestamp: string }[];
}

export interface SessionsResponse {
  sessions: Session[];
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

// Get session detail with history
export const getSession = (project: string, sessionId: string, historyLimit?: number): Promise<SessionDetail> =>
  api.get<SessionDetail>(`/projects/${project}/sessions/${sessionId}`, historyLimit ? { history_limit: String(historyLimit) } : undefined);

// Send a message
export const sendMessage = (project: string, body: SendMessageRequest): Promise<SendMessageResponse> =>
  api.post<SendMessageResponse>(`/projects/${project}/send`, body);