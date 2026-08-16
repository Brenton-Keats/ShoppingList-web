/**
 * Shopping List PWA — Google Apps Script API Entry Points
 *
 * Authentication model:
 *   Shared API key validated on every request. The key is stored in
 *   Apps Script's Script Properties (server-side, never exposed in source)
 *   and passed by the client as a query parameter or POST body field.
 *
 * Deployment settings:
 *   - Execute as: Me (the script owner's Google account)
 *   - Who has access: Anyone
 *
 * This means Google handles CORS automatically — no custom headers needed.
 * The API key prevents unauthorised callers from reading or writing data.
 *
 * Threat model:
 *   A determined user who inspects the built JS can extract the key.
 *   This is acceptable for a personal/household shopping list. For
 *   stronger guarantees, see SECURITY.md for future options.
 */

// ─── GET handler ─────────────────────────────────────────────────────────────

function doGet(e) {
  // Authenticate before processing any request
  if (!validateApiKey(e)) {
    return jsonResponse({ success: false, error: 'Forbidden' });
  }

  const path = e.parameter.path || '';

  try {
    // Default route (no path) or explicit /api/data returns full dataset
    if (path === 'api/data' || path === '/api/data' || path === '') {
      return handleGetData();
    }

    return jsonResponse({
      success: false,
      error: 'Not found',
      availableEndpoints: ['GET /api/data'],
    });
  } catch (err) {
    return jsonResponse({
      success: false,
      error: err.message || 'Internal error',
    });
  }
}

// ─── POST handler ────────────────────────────────────────────────────────────

function doPost(e) {
  // Authenticate before processing any request
  if (!validateApiKey(e)) {
    return jsonResponse({ success: false, error: 'Forbidden' });
  }

  const path = e.parameter.path || '';

  try {
    let body = {};
    if (e.postData && e.postData.contents) {
      try {
        body = JSON.parse(e.postData.contents);
      } catch (parseErr) {
        return jsonResponse({
          success: false,
          error: 'Invalid JSON body: ' + parseErr.message,
        });
      }
    }

    // Default route (no path) or explicit /api/sync processes batched changes
    if (path === 'api/sync' || path === '/api/sync' || path === '') {
      return handlePostSync(body);
    }

    return jsonResponse({
      success: false,
      error: 'Not found',
      availableEndpoints: ['POST /api/sync'],
    });
  } catch (err) {
    return jsonResponse({
      success: false,
      error: err.message || 'Internal error',
    });
  }
}

// ─── API Key Validation ──────────────────────────────────────────────────────

/**
 * Validates the shared API key from the incoming request.
 *
 * The key can be provided via:
 *   1. Query parameter: ?key=YOUR_KEY  (used by GET and POST)
 *   2. POST body field: { "apiKey": "YOUR_KEY" }  (redundant fallback for POST)
 *
 * The expected value is read from Script Properties → API_KEY.
 * If no API_KEY property exists, validation is skipped (open access)
 * to allow initial setup without locking yourself out.
 */
function validateApiKey(e) {
  const expected = PropertiesService.getScriptProperties().getProperty('API_KEY');

  if (!expected) {
    // No key configured — allow all requests during initial setup.
    // Set Script Properties > API_KEY to enable authentication.
    return true;
  }

  // Primary: check ?key= query parameter (works for both GET and POST)
  const paramKey = e.parameter.key;
  if (paramKey === expected) return true;

  // Fallback: check apiKey field inside POST JSON body
  if (e.postData && e.postData.contents) {
    try {
      const body = JSON.parse(e.postData.contents);
      if (body.apiKey === expected) return true;
    } catch (_) {
      // Parse errors are handled by the main doPost flow
    }
  }

  return false;
}
