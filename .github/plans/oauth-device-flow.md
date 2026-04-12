# OAuth Device Flow for GitHub Pages Auth

## Problem

Storyboard's comments system currently requires users to manually create a GitHub PAT, copy it, and paste it into an auth modal. This is high-friction — most users don't know how to create a PAT and the process involves navigating deep into GitHub settings.

## Proposed Approach

Add **GitHub OAuth Device Flow** as the primary auth method, with the existing PAT input as a fallback. The Device Flow works entirely client-side (no backend needed) and gives users a familiar "Login with GitHub" experience:

1. User clicks "Sign in with GitHub"
2. App requests a device code from GitHub
3. User is shown a short code and a link to `github.com/login/device`
4. User enters the code in their browser (where they're already logged into GitHub)
5. App polls GitHub until the user approves → receives an OAuth token
6. Token is stored in localStorage (same as current PAT approach)

## Current Auth Architecture

- **`packages/core/src/comments/auth.js`** — PAT storage (`sb-comments-token`), user cache (`sb-comments-user`), validation via GitHub REST + GraphQL
- **`packages/core/src/comments/graphql.js`** — uses `getToken()` for `Authorization: bearer` header
- **`packages/core/src/comments/ui/authModal.js`** + `AuthModal.svelte` — Svelte modal where users paste a PAT
- **`packages/core/src/comments/config.js`** — reads `storyboard.config.json` for repo/discussion config
- **`storyboard.config.json`** — contains `repository.owner`, `repository.name`, `comments.discussions.category`

The auth layer is cleanly separated — only `auth.js` touches localStorage directly, and only `graphql.js` reads the token for API calls.

## Prerequisites (Manual Steps)

1. **Create a GitHub OAuth App** at `github.com/settings/developers`
   - Set the app name (e.g. "Storyboard Comments")
   - Homepage URL: the GH Pages URL
   - Callback URL: not used by Device Flow, but required — set to the GH Pages URL
   - Note the **Client ID** (public, safe to embed in client code)
   - **Do NOT need** the client secret — Device Flow uses only the client ID

2. **Enable Device Flow** in the OAuth App settings (it's a checkbox)

3. **Add the Client ID** to `storyboard.config.json`

## Implementation Plan

### 1. Config: Add OAuth client ID to storyboard.config.json

Extend the config schema to support an optional `clientId`:

```json
{
  "comments": {
    "discussions": { "category": "General" },
    "auth": {
      "clientId": "Ov23li..."
    }
  }
}
```

When `clientId` is present, the auth modal shows "Sign in with GitHub" as the primary action. When absent, the modal shows only the existing PAT input (backwards compatible).

**Files:** `storyboard.config.json`, `packages/core/src/comments/config.js`

### 2. Device Flow client module

New module: `packages/core/src/comments/deviceFlow.js`

Implements the three-phase Device Flow:

```
requestDeviceCode(clientId, scope)
  → POST https://github.com/login/device/code
  → returns { device_code, user_code, verification_uri, expires_in, interval }

pollForToken(clientId, deviceCode, interval)
  → POST https://github.com/login/oauth/access_token (polling)
  → handles: authorization_pending, slow_down, expired_token, access_denied
  → returns { access_token, token_type, scope }
```

Key details:
- **Scope**: `read:discussion write:discussion read:user` (minimum for comments)
- **Polling interval**: GitHub returns an `interval` (typically 5s); `slow_down` adds 5s
- **CORS**: GitHub's OAuth endpoints support CORS for Device Flow
- **Headers**: Must send `Accept: application/json` to get JSON responses
- The `expires_in` field (typically 900s / 15min) sets a deadline for user approval

**Files:** `packages/core/src/comments/deviceFlow.js`

### 3. Abstract auth.js to support both token types

Extend `auth.js` storage to distinguish between PAT and OAuth tokens:

```
sb-comments-token       → the token string (unchanged)
sb-comments-token-type  → "pat" | "oauth" (new, defaults to "pat" for backwards compat)
sb-comments-user        → cached user info (unchanged)
```

Add:
- `getTokenType()` — returns `"pat"` or `"oauth"`
- `setOAuthToken(token)` — stores token with type `"oauth"`
- Update `clearToken()` to also clear the token type key

The rest of the system (`graphql.js`, `api.js`) doesn't care about the token type — both PAT and OAuth tokens work identically in the `Authorization: bearer` header.

**Files:** `packages/core/src/comments/auth.js`

### 4. Update the auth modal UI

Redesign `AuthModal.svelte` to show two paths:

```
┌──────────────────────────────────────┐
│  Sign in to comment                  │
│                                      │
│  ┌──────────────────────────────┐    │
│  │  🔗 Sign in with GitHub      │    │  ← primary (when clientId configured)
│  └──────────────────────────────┘    │
│                                      │
│  ── or use a Personal Access Token ──│
│                                      │
│  [______________________________]    │  ← PAT input (always available)
│  [  Authenticate  ]                  │
│                                      │
└──────────────────────────────────────┘
```

**Device Flow states in the modal:**

1. **Initial** — "Sign in with GitHub" button
2. **Code shown** — displays `user_code` with copy button + link to `github.com/login/device` + "Waiting for authorization..." spinner
3. **Success** — brief "Signed in as @username" → auto-close
4. **Error** — "Authorization expired / denied" with retry option

If `clientId` is not configured, the modal shows only the PAT input (current behavior).

**Files:** `packages/core/src/comments/ui/AuthModal.svelte`, `packages/core/src/comments/ui/authModal.js`

### 5. Token validation adjustment

Current `validateToken()` fetches `/user` and probes the GraphQL API. This works for both PAT and OAuth tokens — no changes needed to validation logic.

However, add a check: if the OAuth token returns a 401 during normal use (expired/revoked), prompt re-auth via Device Flow instead of showing the PAT modal.

**Files:** `packages/core/src/comments/auth.js`, `packages/core/src/comments/graphql.js`

### 6. Sign-out behavior

Current `signOut()` clears localStorage keys. Extend to also revoke the OAuth token if it's an OAuth session:

```
DELETE https://api.github.com/applications/{client_id}/token
```

Note: This endpoint requires basic auth with `client_id:client_secret`, which we don't have client-side. So for the static site, sign-out just clears localStorage (the token remains valid on GitHub's side until it expires). This is acceptable — same as how most SPAs handle OAuth sign-out.

**Files:** `packages/core/src/comments/auth.js`

### 7. Tests

- **`deviceFlow.test.js`** — mock fetch, test code request, polling states (pending, slow_down, success, expired, denied), timeout handling
- **`auth.test.js`** — extend existing tests for OAuth token type storage/retrieval, backwards compat with existing PAT-only storage
- **`config.test.js`** — test `clientId` parsing from config

**Files:** `packages/core/src/comments/deviceFlow.test.js`, `packages/core/src/comments/auth.test.js`, `packages/core/src/comments/config.test.js`

## Scope Considerations

### OAuth scopes needed

For comments (GitHub Discussions via GraphQL):
- Fine-grained: not applicable (OAuth Apps use classic scopes)
- Classic scope: `repo` (unfortunately, `read:discussion` / `write:discussion` are not separate scopes — discussions access requires `repo`)

This means the OAuth token will have broader access than a fine-grained PAT. Document this tradeoff for users.

**Update:** As of 2024, GitHub added `read:discussion` and `write:discussion` as standalone scopes. Verify this is still available and use the narrowest scope possible.

### Org access caveat

If an org has **OAuth App access restrictions** enabled, an org admin must approve the OAuth App before members' tokens can access that org's discussions. The PAT fallback exists specifically for this case. Consider showing a helpful error message when GraphQL returns a 403 for an org repo, suggesting the user try a PAT instead.

### Branch URL / Base Path

No impact — auth is independent of URL routing. The OAuth callback URL set in the GitHub App settings is only used for the web flow (not Device Flow), so `VITE_BASE_PATH` doesn't matter here.

## Migration

- **Zero breaking changes** — existing PAT users continue working. The `sb-comments-token` key is unchanged.
- **Opt-in** — Device Flow only activates when `comments.auth.clientId` is configured.
- **Graceful** — if a user has an existing PAT stored, it keeps working. They can switch to OAuth by signing out and signing back in.

## Open Questions

- [ ] Should the OAuth App be per-storyboard-instance (each deployer creates their own) or shared (one app for all Storyboard users)? Per-instance is more secure but higher friction. **Recommendation: per-instance**, configured via `storyboard.config.json`.
- [ ] Should we store the OAuth token's expiry and proactively prompt re-auth? GitHub OAuth tokens don't expire by default, but this could change.
- [ ] Worth adding a "Remember me" toggle, or always persist? **Recommendation: always persist** (current PAT behavior, users expect to stay signed in).
