# CC-Connect User Web Frontend

User-facing web frontend for connecting WeChat to Agents and chatting.

## Features

- View public Agents (projects matching `public-*` name pattern)
- Scan QR code to bind WeChat account to an Agent
- Chat via web browser (session shared with WeChat app)

## Development

```bash
npm install
npm run dev
```

Open http://localhost:5174

## Build

```bash
npm run build
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