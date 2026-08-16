# Security Model

## Current Authentication

This application uses a **shared API key** to authenticate requests between the PWA frontend and the Google Apps Script backend.

### How it works

1. A random key is generated and stored in two places:
   - **Server:** Google Apps Script → Project Settings → Script Properties → `API_KEY`
   - **Client:** GitHub repository secret `PUBLIC_API_KEY`, injected at build time into the static frontend
2. Every API request from the frontend includes the key as a `?key=` query parameter.
3. The Apps Script `validateApiKey()` function compares the provided key against the stored Script Property.
4. Requests without a valid key receive a `{ "error": "Forbidden" }` response.

### Deployment configuration

| Setting | Value | Reason |
|---------|-------|--------|
| Execute as | Me | Script runs with the owner's Google account permissions to read/write the Sheet |
| Who has access | Anyone | Required for CORS to work with cross-origin `fetch()` from GitHub Pages |

### What this protects against

- Casual discovery: someone finding the deployment URL cannot use it without the key
- Automated scanning: bots hitting the endpoint get rejected
- Accidental exposure: the URL alone (visible in public repo config) is not sufficient

### What this does NOT protect against

- A determined user inspecting the built JavaScript can extract the API key
- The key travels in the URL query string and request body (visible in server logs, browser history)
- There is no per-user identity — all authenticated requests are equivalent
- No rate limiting beyond what Google Apps Script provides by default

### Why this is acceptable

This is a personal household shopping list. The data has negligible value to an attacker. The threat model is:

- **Asset value:** Low (grocery items, not financial or health data)
- **Attacker motivation:** None (no incentive to target a shopping list)
- **Blast radius:** Limited to one household's shopping data
- **Recovery:** Trivial (data is in a Google Sheet with version history)

The shared key provides a proportionate access gate without the complexity of OAuth flows or user management.

---

## Future Options for Improved Security

If requirements change (e.g., sharing with others outside the household, storing sensitive data), consider these upgrades in order of complexity:

### 1. Key rotation

Periodically generate a new API key, update Script Properties and the GitHub secret, and redeploy. This limits the window of exposure if a key is compromised.

### 2. IP allowlisting (Apps Script)

Add validation in `doGet`/`doPost` to check the request's source IP against a whitelist. Limited usefulness for mobile devices with dynamic IPs, but viable for home-network-only access.

### 3. Google Identity Services (OAuth popup)

- User signs in with Google via a popup in the PWA
- Frontend receives an OAuth access token
- Token is passed to Apps Script via the Apps Script Execution API (not the web app URL)
- Apps Script validates the caller's Google identity
- Only whitelisted Google accounts are permitted

**Trade-offs:** Requires enabling the Apps Script API in Google Cloud Console, configuring an OAuth consent screen, and managing a list of authorised email addresses. Adds a sign-in step to the user experience.

### 4. Firebase Authentication + Cloud Functions proxy

- Replace the direct Apps Script endpoint with a Firebase Cloud Function
- Use Firebase Auth for user identity (Google sign-in, email/password, etc.)
- Cloud Function validates the Firebase ID token, then calls Apps Script or Sheets API directly

**Trade-offs:** Adds infrastructure (Firebase project), but provides proper per-user auth, token refresh, and session management. Overkill for a household app.

### 5. Move off Apps Script entirely

- Use a proper backend (Cloud Run, Vercel serverless, etc.) with standard auth
- Keep Google Sheets as storage via the Sheets API with a service account

**Trade-offs:** Full control over security, but significantly more infrastructure to maintain.
