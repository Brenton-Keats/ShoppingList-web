# Shopping List PWA — Google Apps Script Backend

This directory contains the Google Apps Script backend for the Shopping List PWA.

## Architecture

The backend is a single Google Apps Script project bound to a Google Spreadsheet. It exposes a JSON HTTP API via `doGet` and `doPost` web app handlers. All data is stored in the spreadsheet, with a dedicated `Changes` sheet acting as an append-only change log for synchronisation.

## Files

| File | Purpose |
|------|---------|
| `Code.ts` | Main entry point (`doGet`, `doPost`) and API key validation |
| `Config.ts` | Constants: sheet names, headers, default settings, entity types |
| `Types.ts` | JSDoc type definitions for all entities and API payloads |
| `SheetUtils.ts` | Spreadsheet operations: initialise, find, append, update, clear |
| `Api.ts` | API handlers: `GET /api/data`, `POST /api/sync` |
| `ChangeLog.ts` | Revision tracking, change logging, and applying changes to sheets |
| `Conflict.ts` | Deterministic last-write-wins conflict resolution |

## API Endpoints

### GET /api/data

Returns a full data dump for initial sync.

**Query parameter:** `path=api/data`

**Response:**
```json
{
  "serverRevision": 157,
  "lists": [...],
  "sections": [...],
  "stores": [...],
  "products": [...],
  "listItems": [...],
  "settings": [...]
}
```

### POST /api/sync

Submits client changes and receives server changes.

**Query parameter:** `path=api/sync`

**Request body:**
```json
{
  "deviceId": "device-uuid",
  "baseRevision": 142,
  "changes": [
    {
      "id": "change-001",
      "entityType": "ListItem",
      "entityId": "item-001",
      "operation": "update",
      "data": { "completed": true, "completedAt": "2026-08-16T03:42:00Z" }
    }
  ]
}
```

**Response (client up to date):**
```json
{
  "success": true,
  "serverRevision": 157,
  "acceptedChanges": ["change-001"],
  "changes": []
}
```

**Response (client behind):**
```json
{
  "success": true,
  "serverRevision": 157,
  "acceptedChanges": [],
  "changes": [ { ...server changes since baseRevision... } ]
}
```

## Deployment Instructions

### 1. Create the Google Spreadsheet

1. Open [Google Sheets](https://sheets.new) and create a new blank spreadsheet.
2. Note the spreadsheet name (e.g., "Shopping List Data").

### 2. Open the Apps Script Editor

1. In the spreadsheet, click **Extensions > Apps Script**.
2. The Apps Script editor will open in a new tab.

### 3. Copy the Code Files

1. In the Apps Script editor, you will see a default `Code.gs` file.
2. Delete the default file (right-click > Delete).
3. Create the following script files by clicking the **+** next to **Files** and selecting **Script**:
   - `Code`
   - `Config`
   - `Types`
   - `SheetUtils`
   - `Api`
   - `ChangeLog`
   - `Conflict`
4. Copy the contents of each `.ts` file from this directory into the corresponding Apps Script file.
   - Apps Script uses `.gs` extensions internally, but the code is plain JavaScript compatible.

### 4. Initialise the Spreadsheet

1. In the Apps Script editor, select the function `initializeSpreadsheet` in the dropdown next to the **Run** button.
2. Click **Run**.
3. Authorise the script when prompted (click through the permission dialogs).
4. Check the spreadsheet: it should now contain sheets named `Lists`, `Sections`, `Stores`, `Products`, `ListItems`, `Changes`, `Settings`, and `SyncMeta`, each with the correct header row.

### 5. Deploy as a Web App

1. In the Apps Script editor, click **Deploy > New deployment**.
2. Click the gear icon and select **Web app**.
3. Configure the deployment:
   - **Description:** `Shopping List API v1`
   - **Execute as:** `Me`
   - **Who has access:** `Anyone`
4. Click **Deploy**.
5. Copy the **Web app URL** shown in the dialog.

### 6. Set the API Key

1. In the Apps Script editor, go to **Project Settings** (gear icon in the left sidebar).
2. Scroll down to **Script Properties** and click **Add script property**.
3. Add: Key = `API_KEY`, Value = a strong random string (generate with `openssl rand -hex 32` or similar).
4. Click **Save script properties**.

### 7. Configure the Frontend

1. In your GitHub repository, go to **Settings** → **Secrets and variables** → **Actions**.
2. Add repository secrets:
   - `PUBLIC_APPS_SCRIPT_URL`: your Apps Script web app URL (e.g., `https://script.google.com/macros/s/AKfycb.../exec`)
   - `PUBLIC_API_KEY`: the same API key value you set in Script Properties
3. The CI workflow injects these at build time. The frontend passes the key with every request.
4. The frontend appends query parameters for routing:
   - Initial sync: `GET {URL}?path=api/data&key={API_KEY}`
   - Sync changes: `POST {URL}?path=api/sync&key={API_KEY}` (key also in body as `apiKey`)

### 8. Redeploying After Changes

Whenever you modify the Apps Script code:
1. Click **Deploy > Manage deployments**.
2. Click the pencil icon on the existing deployment.
3. Click **Deploy** to update the same URL.

## Security Notes

- The deployment uses a **shared API key** to prevent unauthorised access.
- The key is stored in Apps Script's Script Properties (server-side) and baked into the frontend build via GitHub Secrets (never committed to source).
- This is appropriate for a personal/household shopping list. See `SECURITY.md` in the project root for the full threat model and future hardening options.
- The frontend never sees spreadsheet credentials; all sheet access happens server-side within Apps Script.

## Data Model

### Soft Deletes

All entities use soft deletes. A `deleted_at` timestamp is set instead of removing the row. This prevents offline clients from accidentally resurrecting deleted items.

### Stable IDs

Every entity has a stable UUID in the `id` column. Row numbers are never used as identifiers.

### Revision Numbers

The `Changes` sheet maintains a monotonically increasing `revision` number. The `SyncMeta` sheet stores the current `serverRevision` for quick access.

### Conflict Resolution

The backend uses deterministic last-write-wins:
- For updates: the change with the later `updated_at` timestamp wins.
- For deletes: the tombstone (delete) always wins.
- If timestamps are unavailable, the server change wins by default.

## Troubleshooting

### Script fails to run
- Check the **Executions** tab in Apps Script for error messages.
- Ensure you authorised all required permissions during the first run.

### Spreadsheet not initialised
- Re-run `initializeSpreadsheet()` from the editor.
- Verify the active spreadsheet is the one you created.

### CORS errors in the browser
- Ensure the web app is deployed with **Execute as: Me** and **Who has access: Anyone**.
- Google handles CORS headers automatically for this configuration.
- "Execute as: User accessing the web app" does NOT work with cross-origin `fetch()` and will produce CORS errors.

### Sync not working
- Verify the frontend is sending the correct `path` query parameter.
- Check the **Executions** tab for API request logs.
- Ensure the request body is valid JSON.
