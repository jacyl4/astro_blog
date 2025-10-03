/*
  Cloudflare Worker for GitHub-authenticated comments stored in D1.
*/
import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';

type D1Result<T> = {
  results: T[];
};

type D1PreparedStatement<T = unknown> = {
  bind(...values: unknown[]): D1PreparedStatement<T>;
  first<U = T>(): Promise<U | null>;
  all(): Promise<D1Result<T>>;
};

type D1Database = {
  prepare<T = unknown>(query: string): D1PreparedStatement<T>;
};

type Env = {
  DB: D1Database;
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  JWT_SECRET: string;
  ALLOWED_ORIGINS?: string; // comma-separated
};

type User = {
  id: number;
  github_id: string;
  login: string;
  avatar_url?: string;
};

type Comment = {
  id: number;
  post_id: string;
  user_id: number;
  markdown: string;
  html: string;
  created_at: string;
};

const CORS_HEADERS_BASE = {
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Vary': 'Origin'
};

const SESSION_COOKIE = 'comment_session';
const OAUTH_STATE_COOKIE = 'oauth_state';

function parseAllowedOrigins(env: Env): string[] {
  const raw = env.ALLOWED_ORIGINS || '';
  return raw.split(',').map(s => s.trim()).filter(Boolean);
}

function withCORS(origin: string | null, env: Env, extra?: Record<string,string>) {
  const allowed = parseAllowedOrigins(env);
  const headers: Record<string, string> = { ...CORS_HEADERS_BASE, ...(extra || {}) };
  if (allowed.includes('*')) {
    if (origin) {
      headers['Access-Control-Allow-Origin'] = origin;
      headers['Access-Control-Allow-Credentials'] = 'true';
    } else {
      headers['Access-Control-Allow-Origin'] = '*';
    }
  } else if (origin && allowed.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Credentials'] = 'true';
  }
  return headers;
}

function sanitizeRedirect(target: string, env: Env): string {
  if (!target) return '/';
  try {
    const url = new URL(target);
    const allowed = parseAllowedOrigins(env);
    if (allowed.includes(url.origin)) {
      return url.toString();
    }
    return '/';
  } catch {
    return target.startsWith('/') ? target : '/';
  }
}

function base64UrlEncode(input: ArrayBuffer | Uint8Array): string {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  let str = '';
  for (let i = 0; i < bytes.length; i++) {
    str += String.fromCharCode(bytes[i]);
  }
  return btoa(str).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function base64UrlDecode(input: string): Uint8Array {
  let s = input.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  const bin = atob(s);
  return Uint8Array.from(bin, c => c.charCodeAt(0));
}

async function signJWT(payload: Record<string, unknown>, secret: string, expSec = 60 * 60 * 24 * 7) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const body = { iat: now, exp: now + expSec, ...payload };
  const enc = new TextEncoder();
  const headerB64 = base64UrlEncode(enc.encode(JSON.stringify(header)));
  const payloadB64 = base64UrlEncode(enc.encode(JSON.stringify(body)));
  const data = `${headerB64}.${payloadB64}`;
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  const sigB64 = base64UrlEncode(new Uint8Array(sig));
  return `${data}.${sigB64}`;
}

async function verifyJWT(token: string, secret: string): Promise<Record<string, unknown> | null> {
  const [headerB64, payloadB64, sigB64] = token.split('.');
  if (!headerB64 || !payloadB64 || !sigB64) return null;
  const data = `${headerB64}.${payloadB64}`;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
  const sigBytes = base64UrlDecode(sigB64);
  const valid = await crypto.subtle.verify('HMAC', key, sigBytes as BufferSource, enc.encode(data));
  if (!valid) return null;
  const payloadBytes = base64UrlDecode(payloadB64);
  const payloadStr = new TextDecoder().decode(payloadBytes);
  const payload = JSON.parse(payloadStr);
  if (payload.exp && Math.floor(Date.now()/1000) > payload.exp) return null;
  return payload;
}

function parseCookies(req: Request): Record<string,string> {
  const cookie = req.headers.get('Cookie') || '';
  const out: Record<string,string> = {};
  cookie.split(';').forEach(p => {
    const [k, ...rest] = p.trim().split('=');
    if (k) out[k] = decodeURIComponent(rest.join('='));
  });
  return out;
}

function json(data: unknown, init?: ResponseInit) {
  const headers = new Headers(init?.headers || {});
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  return new Response(JSON.stringify(data), { ...init, headers });
}

function ok(init?: ResponseInit) {
  return new Response(null, init);
}

async function ensureUser(env: Env, gh: { id: number; login: string; avatar_url?: string }): Promise<User> {
  const existing = await env.DB.prepare('SELECT id, github_id, login, avatar_url FROM users WHERE github_id = ?').bind(String(gh.id)).first<User>();
  if (existing) return existing;
  const res = await env.DB.prepare('INSERT INTO users (github_id, login, avatar_url) VALUES (?, ?, ?) RETURNING id, github_id, login, avatar_url')
    .bind(String(gh.id), gh.login, gh.avatar_url || null)
    .first<User>();
  if (!res) throw new Error('Failed to insert user');
  return res;
}

async function getSessionUser(env: Env, req: Request): Promise<User | null> {
  const cookies = parseCookies(req);
  const token = cookies[SESSION_COOKIE];
  if (!token) return null;
  const payload = await verifyJWT(token, env.JWT_SECRET);
  if (!payload || typeof payload.user_id !== 'number') return null;
  const user = await env.DB.prepare('SELECT id, github_id, login, avatar_url FROM users WHERE id = ?').bind(payload.user_id).first<User>();
  return user || null;
}

function buildCommentResponse(comment: Comment, user: User) {
  return {
    id: comment.id,
    html: comment.html,
    markdown: comment.markdown,
    created_at: comment.created_at,
    author: {
      id: user.id,
      login: user.login,
      avatar_url: user.avatar_url
    }
  };
}

function renderMarkdown(md: string) {
  const unsafe = marked.parse(md, { async: false }) as string;
  const clean = sanitizeHtml(unsafe, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img','h1','h2','h3','h4','h5','h6','pre','code','blockquote']),
    allowedAttributes: {
      a: ['href','name','target','rel'],
      img: ['src','alt','title'],
      code: ['class']
    },
    transformTags: {
      a: (_tagName: string, attribs: Record<string, string>) => ({
        tagName: 'a',
        attribs: { ...attribs, rel: 'noopener noreferrer nofollow', target: '_blank' }
      })
    }
  });
  return clean;
}

function setCookie(name: string, value: string, opts: { httpOnly?: boolean; secure?: boolean; sameSite?: 'None'|'Lax'|'Strict'; path?: string; maxAge?: number; }) {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  if (opts.path) parts.push(`Path=${opts.path}`);
  if (opts.httpOnly) parts.push('HttpOnly');
  if (opts.secure) parts.push('Secure');
  if (opts.sameSite) parts.push(`SameSite=${opts.sameSite}`);
  if (opts.maxAge) parts.push(`Max-Age=${opts.maxAge}`);
  return parts.join('; ');
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin');

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return ok({ headers: withCORS(origin, env) });
    }

    try {
      if (url.pathname === '/api/comments' && request.method === 'GET') {
        const postId = url.searchParams.get('postId');
        if (!postId) return json({ error: 'Missing postId' }, { status: 400, headers: withCORS(origin, env, { 'Cache-Control': 'no-store' }) });

        const rows = await env.DB.prepare(
          'SELECT c.id, c.post_id, c.user_id, c.markdown, c.html, c.created_at, u.login, u.avatar_url FROM comments c JOIN users u ON c.user_id = u.id WHERE c.post_id = ? ORDER BY c.created_at ASC'
        ).bind(postId).all();

        const comments = (rows.results || []).map((r: any) => ({
          id: r.id,
          html: r.html,
          markdown: r.markdown,
          created_at: r.created_at,
          author: { id: r.user_id, login: r.login, avatar_url: r.avatar_url }
        }));

        return json({ comments }, { headers: withCORS(origin, env, { 'Cache-Control': 'no-store' }) });
      }

      if (url.pathname === '/api/comments' && request.method === 'POST') {
        const user = await getSessionUser(env, request);
        if (!user) return json({ error: 'Unauthorized' }, { status: 401, headers: withCORS(origin, env, { 'Cache-Control': 'no-store' }) });
        const body = await request.json().catch(() => null);
        if (!body || typeof body.postId !== 'string' || typeof body.markdown !== 'string') {
          return json({ error: 'Invalid body' }, { status: 400, headers: withCORS(origin, env, { 'Cache-Control': 'no-store' }) });
        }
        const postId = body.postId.slice(0, 512).trim();
        if (!postId) {
          return json({ error: 'Invalid body' }, { status: 400, headers: withCORS(origin, env, { 'Cache-Control': 'no-store' }) });
        }
        const markdownInput = body.markdown.slice(0, 8000);
        if (!markdownInput.trim()) {
          return json({ error: 'Empty comment' }, { status: 400, headers: withCORS(origin, env, { 'Cache-Control': 'no-store' }) });
        }
        const html = renderMarkdown(markdownInput);

        const inserted = await env.DB.prepare('INSERT INTO comments (post_id, user_id, markdown, html) VALUES (?, ?, ?, ?) RETURNING *')
          .bind(postId, user.id, markdownInput, html)
          .first<Comment>();
        if (!inserted) throw new Error('Insert failed');

        return json({ comment: buildCommentResponse(inserted, user) }, { status: 201, headers: withCORS(origin, env, { 'Cache-Control': 'no-store' }) });
      }

      if (url.pathname === '/auth/session' && request.method === 'GET') {
        const user = await getSessionUser(env, request);
        const res = user ? { authenticated: true, user } : { authenticated: false };
        return json(res, { headers: withCORS(origin, env, { 'Cache-Control': 'no-store' }) });
      }

      if (url.pathname === '/auth/github/login' && request.method === 'GET') {
        const requestedRedirect = url.searchParams.get('redirect_uri') || '/';
        const redirectUri = sanitizeRedirect(requestedRedirect, env);
        const state = crypto.randomUUID();
        const stateMeta = base64UrlEncode(new TextEncoder().encode(JSON.stringify({ s: state, r: redirectUri })));
        const params = new URLSearchParams({
          client_id: env.GITHUB_CLIENT_ID,
          redirect_uri: new URL('/auth/github/callback', url.origin).toString(),
          scope: 'read:user',
          state
        });
        const ghUrl = `https://github.com/login/oauth/authorize?${params.toString()}`;
        const headers = new Headers({ Location: ghUrl });
        headers.append('Set-Cookie', setCookie(OAUTH_STATE_COOKIE, stateMeta, { path: '/', httpOnly: true, secure: true, sameSite: 'None', maxAge: 600 }));
        return new Response(null, { status: 302, headers });
      }

      if (url.pathname === '/auth/github/callback' && request.method === 'GET') {
        const code = url.searchParams.get('code');
        const state = url.searchParams.get('state');
        if (!code || !state) return new Response('Invalid OAuth response', { status: 400 });

        const cookies = parseCookies(request);
        const stateCookie = cookies[OAUTH_STATE_COOKIE] || '';
        let savedState = '';
        let redirectUri = '/';
        try {
          const metaBytes = base64UrlDecode(stateCookie);
          const metaStr = new TextDecoder().decode(metaBytes);
          const meta = JSON.parse(metaStr);
          savedState = meta.s || '';
          redirectUri = sanitizeRedirect(meta.r || '/', env);
        } catch {
          return new Response('Invalid state cookie', { status: 400 });
        }
        if (savedState !== state) return new Response('State mismatch', { status: 400 });

        const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
          method: 'POST',
          headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
          body: JSON.stringify({ client_id: env.GITHUB_CLIENT_ID, client_secret: env.GITHUB_CLIENT_SECRET, code })
        });
        if (!tokenRes.ok) {
          console.error('OAuth token exchange failed', tokenRes.status, await tokenRes.text());
          return new Response('OAuth failed', { status: 502 });
        }
        const tokenJson = await tokenRes.json();
        if (!tokenJson.access_token) return new Response('OAuth failed', { status: 400 });

        const userRes = await fetch('https://api.github.com/user', {
          headers: { 'Authorization': `Bearer ${tokenJson.access_token}`, 'User-Agent': 'astro-blog-comments-worker' }
        });
        if (!userRes.ok) {
          console.error('Failed to fetch GitHub user', userRes.status, await userRes.text());
          return new Response('OAuth failed', { status: 502 });
        }
        const ghUser = await userRes.json();
        if (!ghUser?.id || !ghUser?.login) {
          return new Response('OAuth failed', { status: 502 });
        }
        const user = await ensureUser(env, { id: ghUser.id, login: ghUser.login, avatar_url: ghUser.avatar_url });
        const jwt = await signJWT({ user_id: user.id }, env.JWT_SECRET);

        const headers = new Headers({ Location: redirectUri });
        headers.append('Set-Cookie', setCookie(SESSION_COOKIE, jwt, { path: '/', httpOnly: true, secure: true, sameSite: 'None', maxAge: 60*60*24*30 }));
        headers.append('Set-Cookie', setCookie(OAUTH_STATE_COOKIE, '', { path: '/', httpOnly: true, secure: true, sameSite: 'None', maxAge: 0 }));
        return new Response(null, { status: 302, headers });
      }

      if (url.pathname === '/auth/logout' && request.method === 'GET') {
        const headers = new Headers(withCORS(origin, env, { 'Cache-Control': 'no-store' }));
        headers.append('Set-Cookie', setCookie(SESSION_COOKIE, '', { path: '/', httpOnly: true, secure: true, sameSite: 'None', maxAge: 0 }));
        return new Response('Logged out', { status: 200, headers });
      }

      return new Response('Not found', { status: 404, headers: withCORS(origin, env, { 'Cache-Control': 'no-store' }) });
    } catch (err: any) {
      console.error(err);
      return json({ error: 'Internal error' }, { status: 500, headers: withCORS(origin, env, { 'Cache-Control': 'no-store' }) });
    }
  }
};
