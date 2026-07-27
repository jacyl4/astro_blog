# Comments Decommission Inventory

Captured: 2026-07-27  
Decommission completed: 2026-07-27  
Scope: runtime and infrastructure identifiers only; no secrets are recorded.

## Application and repository

- UI component: `src/components/CommentsPanel.astro`
- browser client: `public/scripts/comments-panel.js`
- styles: `src/styles/modules/comments-panel.css` and selectors in
  `src/styles/modules/animations.css`
- configuration: `COMMENTS_CONFIG`, comment text entries, and
  `PUBLIC_COMMENTS_API_BASE`
- repository backend: `cloudflare/`

## Known Cloudflare resources

- Worker name: `astro-blog-comments`
- D1 database name: `astro-blog-comments-db`
- D1 database ID: `d0dd86fc-8853-4a1d-a366-e0b6777b3205`
- public hostname: `astro-blog-comments.seso.icu`
- D1 binding: `DB`
- Worker variables/bindings declared by source: `ALLOWED_ORIGINS`, `DB`
- runtime secrets referenced by the Worker source: GitHub OAuth client
  credentials and session signing material

Authenticated inventory subsequently confirmed these resources before deletion.

## Public behavior observed before removal

- The production blog rendered the comments panel and loaded
  `/scripts/comments-panel.js`.
- `https://astro-blog-comments.seso.icu/auth/session` responded with an
  unauthenticated session payload.
- `GET /api/comments` was publicly reachable and returned an empty comment list
  for the sampled post.

Authenticated D1 inventory reported zero tables. The owner explicitly chose direct
deletion without export or backup.

## External configuration requiring authenticated cleanup

- Cloudflare Worker, route/custom domain, secrets, D1 database, and DNS record
- GitHub OAuth App and its credentials
- GitHub/GitLab repository variables or secrets named for the comments API
- any comments-specific deployment automation not present in this checkout

No secret values are retained in this inventory.

## Verified removal result

- repository UI, browser client, styles, configuration, environment references,
  backend source, D1 schema and deployment files: deleted
- Cloudflare Worker `astro-blog-comments`: deleted; deployment lookup now returns
  Worker-not-found
- D1 `astro-blog-comments-db`: deleted; authenticated D1 inventory is empty
- custom hostname/DNS `astro-blog-comments.seso.icu`: removed and no longer resolves
- GitHub OAuth App `astro-blog-oauth`: deleted
- GitHub Actions secret `PUBLIC_COMMENTS_API_BASE`: deleted
- GitLab project variables: no comments-specific variable remained in either project
- public `/auth/session` and `/api/comments` on the former comments hostname: no
  longer reachable
- replacement static staging Worker: `/api/comments`, `/auth/session` and an
  arbitrary `/api/*` path all return static `404`

Command evidence is stored under `.build/evidence/` and intentionally excluded from
source control because it is execution-specific.
