# Cloudflare Comments Worker

GitHub-authenticated Markdown comments backed by Cloudflare D1.

This worker exposes:

- `GET /api/comments?postId=...` — list comments
- `POST /api/comments` — create comment (requires GitHub login)
- `GET /auth/github/login` — start GitHub OAuth
- `GET /auth/github/callback` — OAuth callback, sets session cookie
- `GET /auth/session` — current session info
- `GET /auth/logout` — clear session

See `../docs/cloudflare-comments.md` for setup instructions.

