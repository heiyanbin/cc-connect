# User-facing Web Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a user-facing web frontend in `web_user/` that allows WeChat users to view public Agents, scan QR to connect, and chat via web browser.

**Architecture:** Separate frontend from existing admin `web/`. Static React SPA that calls existing Management API via CORS. Project filtering done in frontend code (pattern: `public-*`). No backend changes.

**Tech Stack:** React 18 + TypeScript + Vite + Tailwind CSS + React Router

---

## File Structure

```
web_user/
├── package.json
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── index.html
├── .env.example
├── postcss.config.js
├── src/
│   ├── main.tsx              # Entry point
│   ├── App.tsx               # Router setup
│   ├── index.css             # Tailwind imports
│   ├── lib/
│   │   ├── constants.ts      # PUBLIC_PROJECT_PATTERN, API_BASE
│   │   ├── utils.ts          # timeAgo, cn (classnames)
│   ├── api/
│   │   ├── client.ts         # Fetch wrapper with error handling
│   │   ├── projects.ts       # GET /projects
│   │   ├── sessions.ts       # sessions, history, send APIs
│   │   ├── setup.ts          # weixin QR flow APIs
│   ├── hooks/
│   │   ├── useSessionKey.ts  # localStorage sessionKey management
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Card.tsx      # Card container
│   │   │   ├── Button.tsx    # Button component
│   │   │   ├── Badge.tsx     # Badge/tag component
│   │   │   ├── QRDisplay.tsx # QR code display with status
│   │   │   ├── ChatInput.tsx # Message input + send button
│   │   │   ├── MessageBubble.tsx # Chat message display
│   │   │   ├── EmptyState.tsx # Empty list placeholder
│   ├── pages/
│   │   ├── AgentList.tsx     # / - list public agents
│   │   ├── ConnectQR.tsx     # /connect/:name - QR binding
│   │   ├── ChatView.tsx      # /chat/:name - web chat
```

---

### Task 1: Project Setup

**Files:**
- Create: `web_user/package.json`
- Create: `web_user/vite.config.ts`
- Create: `web_user/tsconfig.json`
- Create: `web_user/tailwind.config.ts`
- Create: `web_user/postcss.config.js`
- Create: `web_user/index.html`
- Create: `web_user/.env.example`
- Create: `web_user/src/index.css`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "cc-connect-user-web",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.22.0",
    "lucide-react": "^0.344.0",
    "qrcode.react": "^3.1.0",
    "clsx": "^2.1.0",
    "react-markdown": "^9.0.1",
    "remark-gfm": "^4.0.0",
    "rehype-highlight": "^7.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "autoprefixer": "^10.4.17",
    "postcss": "^8.4.35",
    "tailwindcss": "^3.4.1",
    "typescript": "^5.3.0",
    "vite": "^5.1.0"
  }
}
```

- [ ] **Step 2: Create vite.config.ts**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://localhost:9820',
        changeOrigin: true,
      },
    },
  },
});
```

- [ ] **Step 3: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 4: Create tsconfig.node.json**

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 5: Create tailwind.config.ts**

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        accent: '#6366f1',
      },
    },
  },
  plugins: [],
};

export default config;
```

- [ ] **Step 6: Create postcss.config.js**

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

- [ ] **Step 7: Create index.html**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>CC-Connect Agents</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 8: Create .env.example**

```
VITE_API_BASE_URL=/api/v1
```

- [ ] **Step 9: Create src/index.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100;
  }
}

@layer utilities {
  .animate-fade-in {
    animation: fadeIn 0.2s ease-out;
  }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

- [ ] **Step 10: Install dependencies**

Run: `cd web_user && pnpm install`
Expected: Dependencies installed successfully

- [ ] **Step 11: Commit**

```bash
git add web_user/package.json web_user/vite.config.ts web_user/tsconfig.json web_user/tsconfig.node.json web_user/tailwind.config.ts web_user/postcss.config.js web_user/index.html web_user/.env.example web_user/src/index.css
git commit -m "feat(user-web): add project setup and configuration"
```

---

### Task 2: Core Utilities and Constants

**Files:**
- Create: `web_user/src/lib/constants.ts`
- Create: `web_user/src/lib/utils.ts`

- [ ] **Step 1: Create constants.ts**

```typescript
// Filter pattern for public projects (Agents visible to users)
export const PUBLIC_PROJECT_PATTERN = /^public-/;

// API base URL (from env or default)
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

// SessionKey storage key format
export const SESSION_KEY_STORAGE_KEY = (agentName: string) => `cc_user_session_${agentName}`;

// Poll interval for QR scanning (ms)
export const QR_POLL_INTERVAL = 2000;
```

- [ ] **Step 2: Create utils.ts**

```typescript
import { clsx, type ClassValue } from 'clsx';

// Classname utility (same as admin web)
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

// Time ago formatter
export function timeAgo(iso: string): string {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

// Strip "public-" prefix for display
export function displayAgentName(name: string): string {
  return name.replace(PUBLIC_PROJECT_PATTERN, '');
}

// Wait helper
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Import pattern for displayAgentName
import { PUBLIC_PROJECT_PATTERN } from './constants';
```

- [ ] **Step 3: Commit**

```bash
git add web_user/src/lib/constants.ts web_user/src/lib/utils.ts
git commit -m "feat(user-web): add core utilities and constants"
```

---

### Task 3: API Client Setup

**Files:**
- Create: `web_user/src/api/client.ts`

- [ ] **Step 1: Create client.ts**

```typescript
import { API_BASE_URL } from '@/lib/constants';

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
    return { 'Content-Type': 'application/json' };
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

    return res.json();
  }

  get<T>(path: string): Promise<T> {
    return this.request<T>('GET', path);
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
```

- [ ] **Step 2: Commit**

```bash
git add web_user/src/api/client.ts
git commit -m "feat(user-web): add API client"
```

---

### Task 4: Projects API

**Files:**
- Create: `web_user/src/api/projects.ts`

- [ ] **Step 1: Create projects.ts**

```typescript
import api from './client';

export interface ProjectSummary {
  name: string;
  agent_type: string;
  platforms?: string[];
  sessions_count?: number;
}

export interface ProjectsResponse {
  projects: ProjectSummary[];
}

export const listProjects = (): Promise<ProjectsResponse> =>
  api.get<ProjectsResponse>('/projects');
```

- [ ] **Step 2: Commit**

```bash
git add web_user/src/api/projects.ts
git commit -m "feat(user-web): add projects API"
```

---

### Task 5: Sessions API

**Files:**
- Create: `web_user/src/api/sessions.ts`

- [ ] **Step 1: Create sessions.ts**

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add web_user/src/api/sessions.ts
git commit -m "feat(user-web): add sessions/chat API"
```

---

### Task 6: Setup API (Weixin QR Flow)

**Files:**
- Create: `web_user/src/api/setup.ts`

- [ ] **Step 1: Create setup.ts**

```typescript
import api from './client';

// Weixin Begin response
export interface WeixinBeginResponse {
  qr_key: string;
  qr_url: string;
}

// Weixin Poll response
export interface WeixinPollResponse {
  status: 'wait' | 'scaned' | 'confirmed' | 'expired';
  bot_token?: string;
  ilink_bot_id?: string;
  base_url?: string;
  ilink_user_id?: string;
}

// Weixin Save request
export interface WeixinSaveRequest {
  project: string;
  token: string;
  base_url?: string;
  ilink_bot_id?: string;
  ilink_user_id?: string;
}

// Weixin Save response
export interface WeixinSaveResponse {
  message: string;
  restart_required: boolean;
}

// Start QR flow
export const setupWeixinBegin = (): Promise<WeixinBeginResponse> =>
  api.post<WeixinBeginResponse>('/setup/weixin/begin');

// Poll QR status
export const setupWeixinPoll = (qrKey: string): Promise<WeixinPollResponse> =>
  api.post<WeixinPollResponse>('/setup/weixin/poll', { qr_key: qrKey });

// Save binding after confirmed
export const setupWeixinSave = (body: WeixinSaveRequest): Promise<WeixinSaveResponse> =>
  api.post<WeixinSaveResponse>('/setup/weixin/save', body);
```

- [ ] **Step 2: Commit**

```bash
git add web_user/src/api/setup.ts
git commit -m "feat(user-web): add Weixin QR setup API"
```

---

### Task 7: SessionKey Hook

**Files:**
- Create: `web_user/src/hooks/useSessionKey.ts`

- [ ] **Step 1: Create useSessionKey.ts**

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add web_user/src/hooks/useSessionKey.ts
git commit -m "feat(user-web): add sessionKey management hook"
```

---

### Task 8: UI Components - Card, Button, Badge, EmptyState

**Files:**
- Create: `web_user/src/components/ui/Card.tsx`
- Create: `web_user/src/components/ui/Button.tsx`
- Create: `web_user/src/components/ui/Badge.tsx`
- Create: `web_user/src/components/ui/EmptyState.tsx`

- [ ] **Step 1: Create Card.tsx**

```typescript
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export function Card({ children, className, hover, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4',
        hover && 'cursor-pointer hover:border-accent hover:shadow-md transition-all',
        className
      )}
    >
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Create Button.tsx**

```typescript
import { cn } from '@/lib/utils';
import { ReactNode, ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-accent/50',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variant === 'primary' && 'bg-accent text-white hover:bg-accent/90',
        variant === 'secondary' && 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600',
        variant === 'ghost' && 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700',
        size === 'sm' && 'px-3 py-1.5 text-sm',
        size === 'md' && 'px-4 py-2 text-sm',
        size === 'lg' && 'px-6 py-3 text-base',
        className
      )}
      {...props}
    >
      {loading ? 'Loading...' : children}
    </button>
  );
}
```

- [ ] **Step 3: Create Badge.tsx**

```typescript
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  className?: string;
}

export function Badge({ children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium',
        'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
        className
      )}
    >
      {children}
    </span>
  );
}
```

- [ ] **Step 4: Create EmptyState.tsx**

```typescript
import { ReactNode, LucideIcon } from 'react';

interface EmptyStateProps {
  message: string;
  icon?: LucideIcon;
}

export function EmptyState({ message, icon }: EmptyStateProps) {
  const IconComponent = icon;
  return (
    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
      {IconComponent && <IconComponent size={48} className="mb-4 opacity-50" />}
      <p className="text-sm">{message}</p>
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add web_user/src/components/ui/Card.tsx web_user/src/components/ui/Button.tsx web_user/src/components/ui/Badge.tsx web_user/src/components/ui/EmptyState.tsx
git commit -m "feat(user-web): add basic UI components"
```

---

### Task 9: UI Components - QRDisplay

**Files:**
- Create: `web_user/src/components/ui/QRDisplay.tsx`

- [ ] **Step 1: Create QRDisplay.tsx**

```typescript
import { QRCodeSVG } from 'qrcode.react';
import { Loader2, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

type QRStatus = 'loading' | 'scanning' | 'scanned' | 'confirmed' | 'expired' | 'error';

interface QRDisplayProps {
  qrUrl: string;
  status: QRStatus;
  error?: string;
  onRetry?: () => void;
}

export function QRDisplay({ qrUrl, status, error, onRetry }: QRDisplayProps) {
  return (
    <div className="flex flex-col items-center">
      {/* QR Code */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        {status === 'loading' ? (
          <div className="w-[200px] h-[200px] flex items-center justify-center">
            <Loader2 size={32} className="animate-spin text-gray-400" />
          </div>
        ) : (
          <QRCodeSVG value={qrUrl} size={200} level="H" />
        )}
      </div>

      {/* Status */}
      <div className="mt-4 text-center">
        {status === 'loading' && (
          <p className="text-gray-500">Generating QR code...</p>
        )}
        {status === 'scanning' && (
          <p className="text-gray-500">Scan with WeChat to connect</p>
        )}
        {status === 'scanned' && (
          <div className="flex items-center gap-2 text-amber-500">
            <CheckCircle2 size={16} />
            <span>Scanned! Confirm on phone...</span>
          </div>
        )}
        {status === 'confirmed' && (
          <div className="flex items-center gap-2 text-emerald-500">
            <CheckCircle2 size={16} />
            <span>Connected!</span>
          </div>
        )}
        {status === 'expired' && (
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-2 text-red-500">
              <XCircle size={16} />
              <span>QR expired</span>
            </div>
            {onRetry && (
              <Button variant="secondary" size="sm" onClick={onRetry}>
                <RefreshCw size={14} className="mr-1" />
                Retry
              </Button>
            )}
          </div>
        )}
        {status === 'error' && (
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-2 text-red-500">
              <XCircle size={16} />
              <span>{error || 'Error'}</span>
            </div>
            {onRetry && (
              <Button variant="secondary" size="sm" onClick={onRetry}>
                <RefreshCw size={14} className="mr-1" />
                Retry
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add web_user/src/components/ui/QRDisplay.tsx
git commit -m "feat(user-web): add QR display component"
```

---

### Task 10: UI Components - ChatInput and MessageBubble

**Files:**
- Create: `web_user/src/components/ui/ChatInput.tsx`
- Create: `web_user/src/components/ui/MessageBubble.tsx`

- [ ] **Step 1: Create ChatInput.tsx**

```typescript
import { useState, KeyboardEvent } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Button } from './Button';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  loading?: boolean;
  placeholder?: string;
}

export function ChatInput({ onSend, disabled, loading, placeholder = 'Type a message...' }: ChatInputProps) {
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim() || disabled || loading) return;
    onSend(input.trim());
    setInput('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex items-end gap-2 p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={placeholder}
        rows={1}
        className={cn(
          'flex-1 resize-none rounded-lg border border-gray-200 dark:border-gray-600',
          'px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50',
          'bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      />
      <Button
        size="sm"
        onClick={handleSend}
        disabled={disabled || loading || !input.trim()}
        className="px-3"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
      </Button>
    </div>
  );
}
```

- [ ] **Step 2: Create MessageBubble.tsx**

```typescript
import { cn } from '@/lib/utils';
import { User, Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export function MessageBubble({ role, content, timestamp }: MessageBubbleProps) {
  const isUser = role === 'user';

  return (
    <div className={cn('flex gap-3 mb-4', isUser && 'flex-row-reverse')}>
      {/* Avatar */}
      <div
        className={cn(
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
          isUser ? 'bg-accent text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'
        )}
      >
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </div>

      {/* Content */}
      <div
        className={cn(
          'flex-1 max-w-[80%] rounded-xl px-4 py-3',
          isUser
            ? 'bg-accent text-white'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
        )}
      >
        {isUser ? (
          <p className="text-sm whitespace-pre-wrap">{content}</p>
        ) : (
          <div className="text-sm prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </div>
        )}
        {timestamp && (
          <p className={cn('text-xs mt-1 opacity-50', isUser ? 'text-right' : 'text-left')}>
            {timestamp}
          </p>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add web_user/src/components/ui/ChatInput.tsx web_user/src/components/ui/MessageBubble.tsx
git commit -m "feat(user-web): add chat input and message bubble components"
```

---

### Task 11: Entry Point and Router

**Files:**
- Create: `web_user/src/main.tsx`
- Create: `web_user/src/App.tsx`

- [ ] **Step 1: Create main.tsx**

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
```

- [ ] **Step 2: Create App.tsx**

```typescript
import { Routes, Route, Navigate } from 'react-router-dom';
import AgentList from '@/pages/AgentList';
import ConnectQR from '@/pages/ConnectQR';
import ChatView from '@/pages/ChatView';

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Routes>
        <Route index element={<AgentList />} />
        <Route path="connect/:name" element={<ConnectQR />} />
        <Route path="chat/:name" element={<ChatView />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add web_user/src/main.tsx web_user/src/App.tsx
git commit -m "feat(user-web): add entry point and router"
```

---

### Task 12: Agent List Page

**Files:**
- Create: `web_user/src/pages/AgentList.tsx`

- [ ] **Step 1: Create AgentList.tsx**

```typescript
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bot, MessageSquare, ArrowRight } from 'lucide-react';
import { Card, Badge, EmptyState } from '@/components/ui';
import { listProjects, type ProjectSummary } from '@/api/projects';
import { PUBLIC_PROJECT_PATTERN, displayAgentName } from '@/lib/constants';
import { timeAgo } from '@/lib/utils';

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
```

- [ ] **Step 2: Commit**

```bash
git add web_user/src/pages/AgentList.tsx
git commit -m "feat(user-web): add agent list page"
```

---

### Task 13: Connect QR Page

**Files:**
- Create: `web_user/src/pages/ConnectQR.tsx`

- [ ] **Step 1: Create ConnectQR.tsx**

```typescript
import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { QRDisplay } from '@/components/ui/QRDisplay';
import { Button } from '@/components/ui/Button';
import { setupWeixinBegin, setupWeixinPoll, setupWeixinSave } from '@/api/setup';
import { setSessionKey } from '@/hooks/useSessionKey';
import { displayAgentName } from '@/lib/constants';
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
          status={phase === 'done' ? 'confirmed' : phase === 'saving' ? 'scanned' : phase}
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
```

- [ ] **Step 2: Commit**

```bash
git add web_user/src/pages/ConnectQR.tsx
git commit -m "feat(user-web): add connect QR page"
```

---

### Task 14: Chat View Page

**Files:**
- Create: `web_user/src/pages/ChatView.tsx`

- [ ] **Step 1: Create ChatView.tsx**

```typescript
import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ChatInput } from '@/components/ui/ChatInput';
import { MessageBubble } from '@/components/ui/MessageBubble';
import { EmptyState } from '@/components/ui/EmptyState';
import { listSessions, getSessionHistory, sendMessage, type Session, type HistoryEntry } from '@/api/sessions';
import { getSessionKey } from '@/hooks/useSessionKey';
import { displayAgentName } from '@/lib/constants';
import { timeAgo } from '@/lib/utils';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export default function ChatView() {
  const { name } = useParams<{ name: string }>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [sessionKey, setSessionKeyState] = useState<string | null>(null);

  useEffect(() => {
    if (!name) return;
    const sk = getSessionKey(name);
    setSessionKeyState(sk);
    if (sk) {
      loadHistory(sk);
    } else {
      setLoading(false);
    }
  }, [name]);

  async function loadHistory(sk: string) {
    setLoading(true);
    setError('');
    try {
      const { sessions } = await listSessions(name!);
      if (sessions.length === 0) {
        setLoading(false);
        return;
      }
      // Use most recent session
      const session = sessions.sort((a, b) => 
        (b.updated_at || b.created_at).localeCompare(a.updated_at || a.created_at)
      )[0];
      
      const { history } = await getSessionHistory(name!, session.id);
      const chatMessages: ChatMessage[] = history.map((h, i) => ({
        id: `${i}`,
        role: h.role as 'user' | 'assistant',
        content: h.content,
        timestamp: h.timestamp,
      }));
      setMessages(chatMessages);
    } catch (e: any) {
      setError(e.message || 'Failed to load history');
    } finally {
      setLoading(false);
    }
  }

  const handleSend = useCallback(async (message: string) => {
    if (!sessionKey || !name || sending) return;

    setSending(true);
    setError('');

    // Add user message immediately
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);

    try {
      await sendMessage(name, { session_key: sessionKey, message });
      // Reload history to get assistant response
      await loadHistory(sessionKey);
    } catch (e: any) {
      setError(e.message || 'Failed to send');
    } finally {
      setSending(false);
    }
  }, [name, sessionKey, sending]);

  // No sessionKey - redirect to connect
  if (!sessionKey) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <EmptyState message="Not connected. Please scan QR first." />
        <Link to={`/connect/${name}`}>
          <Button>Connect</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-gray-500 hover:text-gray-700">
          <ArrowLeft size={16} />
          <span>Back</span>
        </Link>
        <h1 className="font-semibold">{displayAgentName(name || '')}</h1>
        <div className="text-xs text-gray-400">
          {messages.length} messages
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 size={24} className="animate-spin text-gray-400" />
          </div>
        ) : error ? (
          <div className="text-center text-red-500 py-4">{error}</div>
        ) : messages.length === 0 ? (
          <EmptyState message="No messages yet. Say something!" />
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              role={msg.role}
              content={msg.content}
              timestamp={timeAgo(msg.timestamp)}
            />
          ))
        )}
      </div>

      {/* Input */}
      <ChatInput
        onSend={handleSend}
        disabled={loading}
        loading={sending}
      />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add web_user/src/pages/ChatView.tsx
git commit -m "feat(user-web): add chat view page"
```

---

### Task 15: Create Vite SVG and Public Assets

**Files:**
- Create: `web_user/public/vite.svg`

- [ ] **Step 1: Create vite.svg (simple placeholder)**

```svg
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true" role="img" class="iconify iconify--logos" width="31.88" height="32" preserveAspectRatio="xMidYMid meet" viewBox="0 0 256 257"><defs><linearGradient id="IconifyId1813088fe1fbc01fb466" x1="-.828%" x2="57.636%" y1="7.652%" y2="78.411%"><stop offset="0%" stop-color="#41D1FF"></stop><stop offset="100%" stop-color="#BD34FE"></stop></linearGradient><linearGradient id="IconifyId1813088fe1fbc01fb467" x1="43.376%" x2="50.316%" y1="2.242%" y2="89.03%"><stop offset="0%" stop-color="#FFEA83"></stop><stop offset="8.333%" stop-color="#FFDD35"></stop><stop offset="100%" stop-color="#FFA800"></stop></linearGradient><linearGradient id="IconifyId1813088fe1fbc01fb468" x1="87.231%" x2="10.839%" y1="29.261%" y2="66.077%"><stop offset="0%" stop-color="#FF9E5E"></stop><stop offset="100%" stop-color="#BD34FE"></stop></linearGradient><filter id="IconifyId1813088fe1fbc01fb469" width="1.083" height="1.083" x="-.0415" y="-.0415" color-interpolation-filters="sRGB"><feGaussianBlur in="SourceGraphic" result="blur" stdDeviation="2"></feGaussianBlur><feColorMatrix in="blur" result="colorMatrix" type="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 100 -1"></feColorMatrix><feMerge><feMergeNode in="colorMatrix"></feMergeNode><feMergeNode in="SourceGraphic"></feMergeNode></feMerge></filter></defs><path fill="url(#IconifyId1813088fe1fbc01fb466)" d="M255.153 37.938L132.804 1.826a7.717 7.717 0 00-5.608 0L4.847 37.938a7.717 7.717 0 00-4.847 7.317v161.745a7.717 7.717 0 004.847 7.317l122.357 36.112a7.717 7.717 0 005.608 0l122.357-36.112a7.717 7.717 0 004.847-7.317V45.255a7.717 7.717 0 00-4.847-7.317z" filter="url(#IconifyId1813088fe1fbc01fb469)"></path><path fill="url(#IconifyId1813088fe1fbc01fb467)" d="M255.153 37.938L132.804 1.826a7.717 7.717 0 00-5.608 0L4.847 37.938a7.717 7.717 0 00-4.847 7.317v161.745a7.717 7.717 0 004.847 7.317l122.357 36.112a7.717 7.717 0 005.608 0l122.357-36.112a7.7717 7.717 0 004.847-7.317V45.255a7.717 7.717 0 00-4.847-7.317z"></path><path fill="url(#IconifyId1813088fe1fbc01fb468)" d="M128 32.512L31.826 61.294l96.174 28.782l96.174-28.782z"></path></svg>
```

- [ ] **Step 2: Commit**

```bash
git add web_user/public/vite.svg
git commit -m "feat(user-web): add public assets"
```

---

### Task 16: Build and Test

**Files:**
- No new files - verify build works

- [ ] **Step 1: Build the project**

Run: `cd web_user && pnpm build`
Expected: Build succeeds, `dist/` folder created

- [ ] **Step 2: Test dev server**

Run: `cd web_user && pnpm dev`
Expected: Dev server starts on port 5174, can access at http://localhost:5174

- [ ] **Step 3: Manual smoke test**

1. Open http://localhost:5174
2. Verify Agent List page loads (shows projects starting with "public-")
3. Click on an agent → goes to Connect QR page
4. Verify QR code displays

- [ ] **Step 4: Add .gitignore for web_user**

```gitignore
node_modules
dist
.env
*.local
```

Save to: `web_user/.gitignore`

- [ ] **Step 5: Commit**

```bash
git add web_user/.gitignore
git commit -m "feat(user-web): add gitignore"
```

---

### Task 17: Documentation

**Files:**
- Create: `web_user/README.md`

- [ ] **Step 1: Create README.md**

```markdown
# CC-Connect User Web Frontend

User-facing web frontend for connecting WeChat to Agents and chatting.

## Features

- View public Agents (projects matching `public-*` name pattern)
- Scan QR code to bind WeChat account to an Agent
- Chat via web browser (session shared with WeChat app)

## Development

```bash
pnpm install
pnpm dev
```

Open http://localhost:5174

## Build

```bash
pnpm build
```

Outputs to `dist/` folder.

## Deployment

This is a static SPA. Deploy the `dist/` folder to any static hosting:
- nginx
- CDN (Cloudflare, etc.)
- Separate Vite preview server

### CORS Configuration

The frontend calls the Management API on port 9820. Add to `config.toml`:

```toml
[management]
cors_origins = ["http://localhost:5174", "https://your-user-domain.com"]
```

## Project Naming Convention

Projects visible to users must be named with `public-` prefix:
- `public-claude-assistant` → visible as "claude-assistant"
- `internal-backend` → not visible (admin only)
```

- [ ] **Step 2: Commit**

```bash
git add web_user/README.md
git commit -m "docs(user-web): add README"
```

---

## Self-Review Checklist

**1. Spec coverage:**
- ✓ Agent List page (Task 12)
- ✓ Connect QR page (Task 13)
- ✓ Chat View page (Task 14)
- ✓ Project filtering by `public-*` pattern (Task 2, Task 12)
- ✓ SessionKey management (Task 7)
- ✓ No backend changes (all tasks use existing APIs)
- ✓ Static hosting deployment (README docs)

**2. Placeholder scan:**
- ✓ No "TBD", "TODO", or vague steps
- ✓ All code shown in each step
- ✓ All commands with expected output

**3. Type consistency:**
- ✓ `sessionKey` format consistent: `weixin:dm:<ilink_user_id>`
- ✓ API types match backend responses (setup.ts, sessions.ts)
- ✓ Component props types defined

---

Plan complete and saved to `docs/superpowers/plans/2025-05-09-user-web-frontend.md`.