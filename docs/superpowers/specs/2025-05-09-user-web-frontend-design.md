# User-facing Web Frontend Design

## Purpose

Build a user-facing web frontend that allows WeChat users to:
1. View available Agents (public projects)
2. Scan QR code to connect their WeChat to an Agent
3. Chat with Agents via web browser (session shared with WeChat app)

## Scope

**What we build:**
- New `web_user/` folder - separate frontend from existing admin `web/`
- Three pages: Agent List, Connect QR, Chat

**What we don't touch:**
- No backend code changes
- No changes to existing `web/` admin dashboard
- Only uses existing Management API endpoints

**Constraints:**
- Only Personal WeChat platform (not WeChat Work)
- Only Claude Code agent (but UI doesn't filter, shows whatever project has)
- No authentication required

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    cc-connect backend                        │
│  ┌─────────────────┐  ┌─────────────────────────────────┐  │
│  │ Management API  │  │ Projects, Sessions, Chat        │  │
│  │ (existing)      │←→│ (no changes)                     │  │
│  │ Port: 9820      │  │                                  │  │
│  └─────────────────┘  └─────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
          │
          │ Same API endpoints (via CORS)
          ▼
┌─────────────────────────────────────────────────────────────┐
│                   web_user/ (new frontend)                   │
│                                                              │
│  Pages:                                                      │
│  ├── /              → Agent List                             │
│  ├── /connect/:id   → QR scan to bind WeChat                 │
│  ├── /chat/:id      → Web chat interface                     │
│                                                              │
│  Static hosting (nginx/CDN/separate process)                 │
│  No authentication                                           │
└─────────────────────────────────────────────────────────────┘
```

---

## Pages

### 1. Agent List (`/`)

**Purpose:** Show available Agents (public projects) for user to pick.

**API call:**
```
GET /projects → list all projects
```

**Frontend filtering:**
```typescript
const PUBLIC_PROJECT_PATTERN = /^public-/;

function filterPublicProjects(projects) {
  return projects.filter(p => PUBLIC_PROJECT_PATTERN.test(p.name));
}
```

**Display:**
- Card/list view of Agents
- Each card shows: Agent name (strip "public-" prefix), agent type, description
- Click → navigate to Connect page

**Naming convention:**
- Internal: "project"
- User-facing: "Agent"
- UI displays "Agent" throughout

### 2. Connect QR (`/connect/:agentName`)

**Purpose:** Display QR code for user to scan with WeChat, binding their account to the Agent.

**Flow:**

```
User clicks "Connect" on Agent "public-assistant"
         │
         ▼
POST /setup/weixin/begin { project: "public-assistant" }
         │
         ▼
Returns: { qr_key, qr_url }
         │
         ▼
Show QR code (qr_url), poll status
         │
         ▼
POST /setup/weixin/poll { qr_key } (repeat every 2s)
         │
         ▼
Status: wait → scaned → confirmed
         │
         ▼ (confirmed)
POST /setup/weixin/save { project, token, ilink_user_id, ... }
         │
         ▼
Backend writes binding, returns success
         │
         ▼
Store sessionKey = "weixin:dm:<ilink_user_id>"
         │
         ▼
Redirect to /chat/public-assistant
```

**SessionKey storage:**
- localStorage: `{ agentName: sessionKey }`
- Used for subsequent chat API calls

**Error handling:**
- QR expired → show "expired" message, offer restart
- Scan failed → show error, offer retry

### 3. Chat (`/chat/:agentName`)

**Purpose:** Web chat interface for messaging with Agent. Session shared with WeChat app.

**SessionKey:**
```
sessionKey = localStorage.getItem(`${agentName}:sessionKey`)
           = "weixin:dm:<ilink_user_id>"
```

**API calls:**

| Action | API |
|--------|-----|
| Load sessions | `GET /projects/:name/sessions` |
| Load history | `GET /projects/:name/sessions/:id/history` |
| Send message | `POST /projects/:name/send { session_key, message }` |

**Features:**

| Feature | Description |
|---------|-------------|
| Message input | Text box + send button |
| Message display | User messages (right) + Assistant replies (left) |
| History loading | Load previous messages on page load |
| Session indicator | Show session ID/name |
| Back button | Return to Agent List |

**Commands:**
- User can type slash commands: `/new`, `/list`, `/switch`, `/history`
- Admin commands filtered: no `/restart`, `/upgrade`, `/shell`, `/dir`, `/provider`
- Use project's `disabled_commands` field from API for filtering

**If no sessionKey (not bound):**
- Show message: "Please connect WeChat first"
- Button → redirect to Connect page

---

## Tech Stack

Same as existing admin web:
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS (styling)
- React Router (routing)
- i18next (internationalization, optional)

---

## Project Structure

```
web_user/
├── src/
│   ├── App.tsx              # Router setup
│   ├── main.tsx             # Entry point
│   ├── index.css            # Tailwind imports
│   ├── pages/
│   │   ├── AgentList.tsx    # Agent listing page
│   │   ├── ConnectQR.tsx    # QR binding page
│   │   ├── ChatView.tsx     # Chat interface
│   ├── api/
│   │   ├── client.ts        # API client (base URL from env)
│   │   ├── projects.ts      # Project list API
│   │   ├── sessions.ts      # Session/chat API
│   │   ├── setup.ts         # Weixin QR setup API
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Card.tsx
│   │   │   ├── Button.tsx
│   │   │   ├── QRDisplay.tsx
│   │   │   ├── MessageBubble.tsx
│   │   │   ├── ChatInput.tsx
│   ├── lib/
│   │   ├── utils.ts         # Helpers (timeAgo, etc.)
│   │   ├── constants.ts     # PUBLIC_PROJECT_PATTERN, etc.
│   ├── hooks/
│   │   ├── useSession.ts    # SessionKey management
│   ├── i18n/                # Copy from admin or skip initially
│   ├── store/
│   │   ├── sessionStore.ts  # Zustand for session state (optional)
├── vite.config.ts
├── tailwind.config.ts
├── package.json
├── tsconfig.json
├── index.html
└── .env.example             # API_BASE_URL=http://localhost:9820
```

---

## Deployment

**Option: Static hosting + CORS**

1. Build: `pnpm build` → outputs to `dist/`
2. Host anywhere: nginx, CDN, separate Vite preview server
3. Frontend calls Management API on port 9820
4. CORS config in existing config.toml:

```toml
[management]
port = 9820
token = "your-mgmt-secret"
cors_origins = ["http://localhost:5173", "https://your-user-web.com"]
```

**Environment variable:**
```
VITE_API_BASE_URL=http://localhost:9820/api/v1
```

---

## User Flow Diagram

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Agent List  │────▶│   Connect    │────▶│    Chat      │
│  (page 1)    │     │  (page 2)    │     │  (page 3)    │
│              │     │              │     │              │
│ Show Agents  │     │ Show QR      │     │ Send/receive │
│ Pick one     │     │ Scan w/WeChat│     │ messages     │
│              │     │ Bind         │     │              │
└──────────────┘     └──────────────┘     └──────────────┘
       │                    │                     │
       │                    │                     │
       │◀────────────────────│◀────────────────────│
       │    Back button      │    Back button      │
```

---

## API Endpoints Used (All Existing)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/projects` | GET | List all projects (filter frontend) |
| `/setup/weixin/begin` | POST | Start QR flow |
| `/setup/weixin/poll` | POST | Poll QR status |
| `/setup/weixin/save` | POST | Save WeChat binding |
| `/projects/:name/sessions` | GET | List sessions for project |
| `/projects/:name/sessions/:id/history` | GET | Chat history |
| `/projects/:name/send` | POST | Send message |

---

## Security Considerations

1. **No authentication:** Anyone can access Agent list and Connect pages
2. **QR binding gate:** Users must scan QR before chatting - prevents anonymous spam
3. **SessionKey isolation:** Each WeChat user has separate sessionKey, cannot access others' chats
4. **Admin commands filtered:** Prevents users from running dangerous commands

---

## Open Questions / Decisions Made

| Question | Decision |
|----------|----------|
| Authentication? | No authentication (public) |
| Chat location? | Both web chat and WeChat app, shared session |
| Session model? | Same session as WeChat (Option A) |
| Project visibility? | Filter by `public-*` name pattern |
| Must scan QR first? | Yes, same as admin dashboard |
| Deployment? | Static hosting + CORS (Option C) |

---

## Implementation Notes

1. Copy/adapt components from existing `web/src/pages/Chat/` for ChatView
2. Copy/adapt QR flow from `web/src/pages/Projects/PlatformSetupQR.tsx`
3. Copy API client setup from `web/src/api/client.ts`
4. Strip admin features: no Login, no Provider management, no System config
5. User-facing naming: replace "Project" → "Agent" in UI text

---

## Success Criteria

1. User can view list of public Agents
2. User can scan QR to bind WeChat to an Agent
3. User can send messages via web chat
4. Messages sent via web appear in WeChat app (shared session)
5. Messages sent via WeChat app appear in web chat
6. No changes required to backend code
7. No changes required to existing admin web