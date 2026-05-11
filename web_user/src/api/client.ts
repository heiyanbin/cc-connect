import { API_BASE_URL } from '@/lib/constants';

// Management token from environment (set in .env)
const MANAGEMENT_TOKEN = import.meta.env.VITE_MANAGEMENT_TOKEN || '';

class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private headers(): HeadersInit {
    const h: HeadersInit = { 'Content-Type': 'application/json' };
    if (MANAGEMENT_TOKEN) {
      h['Authorization'] = `Bearer ${MANAGEMENT_TOKEN}`;
    }
    return h;
  }

  async request<T = unknown>(method: string, path: string, body?: unknown): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const res = await fetch(url, {
      method,
      headers: this.headers(),
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new ApiError(text || `HTTP ${res.status}`, res.status);
    }

    const json = await res.json();
    if (!json.ok) {
      throw new ApiError(json.error || 'Unknown error', res.status);
    }
    return json.data as T;
  }

  get<T>(path: string, params?: Record<string, string>): Promise<T> {
    const url = params ? `${path}?${new URLSearchParams(params)}` : path;
    return this.request<T>('GET', url);
  }

  post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('POST', path, body);
  }

  put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('PUT', path, body);
  }

  delete<T>(path: string): Promise<T> {
    return this.request<T>('DELETE', path);
  }
}

const api = new ApiClient(API_BASE_URL);
export default api;
export { ApiError };