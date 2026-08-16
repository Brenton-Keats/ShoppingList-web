# Shopping List

An offline-first, installable Progressive Web App (PWA) for managing shared shopping lists. Built with SvelteKit, Dexie (IndexedDB), and Google Apps Script backend.

## Features

- **Offline-First**: Works without internet. All data is stored locally and syncs when connection returns.
- **Installable PWA**: Add to your home screen on iOS, Android, and desktop for a native app experience.
- **Shared Lists**: Collaborate with family members via Google Sheets backend.
- **Smart Organization**: Group items by store or category with drag-and-drop reordering.
- **Shopping Mode**: Clean, focused view for checking off items while shopping.
- **Suggestions**: AI-powered suggestions based on your shopping history.
- **History Tracking**: View past shopping trips and frequently bought items.
- **Export**: Share lists via text, email, or messaging apps.
- **Dark Mode**: Automatic or manual theme switching.

## Tech Stack

- **Frontend**: SvelteKit 5, TypeScript, Tailwind CSS
- **Database**: Dexie (IndexedDB wrapper) for local storage
- **Sync**: Google Apps Script REST API with Google Sheets backend
- **PWA**: vite-plugin-pwa with Workbox for service worker and caching
- **Icons**: Lucide Svelte
- **Build**: Vite with static adapter

## Development Setup

### Prerequisites

- Node.js 18+ and npm
- Google account (for Apps Script backend)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd shoppinglist-web

# Install dependencies
npm install

# Start development server
npm run dev
```

The dev server will start at `http://localhost:5173` with hot reload and PWA dev mode enabled.

## Build and Deployment

### Production Build

```bash
# Create optimized production build
npm run build

# Preview the production build locally
npm run preview
```

The build output is written to the `build/` directory as static files, ready for deployment to any static hosting service.

### Deployment Options

#### GitHub Pages

1. Push to a GitHub repository
2. Enable GitHub Pages in repository settings
3. Set source to deploy from the `build` branch or use GitHub Actions

#### Netlify / Vercel

1. Connect your GitHub repository
2. Set build command: `npm run build`
3. Set publish directory: `build`

#### Static Hosting (Apache/Nginx)

Copy the contents of the `build/` directory to your web server's document root. Ensure `.webmanifest` and service worker files are served with correct MIME types.

## Environment Variables

Create a `.env` file in the project root (not committed to git):

```env
# Google Apps Script API endpoint
PUBLIC_GAS_API_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec

# Optional: Set base path for non-root deployment
# NODE_ENV=production
```

## Google Apps Script Deployment

The backend runs on Google Apps Script with Google Sheets as the data store.

### Setup

1. Open [Google Apps Script](https://script.google.com)
2. Create a new project
3. Copy the code from the `apps-script/` directory:
   - `Code.ts` - Main entry point
   - `Api.ts` - API handlers
   - `Types.ts` - Type definitions
   - `SheetUtils.ts` - Google Sheets helpers
   - `ChangeLog.ts` - Change tracking
   - `Conflict.ts` - Conflict resolution
   - `Config.ts` - Configuration
4. Deploy as a web app (Execute as: Me, Access: Anyone)
5. Copy the deployment URL to your `.env` file

See `apps-script/README.md` for detailed deployment instructions.

## PWA Install Instructions

### iOS (Safari)

1. Open the app in Safari
2. Tap the Share button
3. Scroll down and tap "Add to Home Screen"
4. Tap "Add" in the top right

### Android (Chrome)

1. Open the app in Chrome
2. Tap the menu (three dots)
3. Tap "Add to Home screen" or "Install app"
4. Follow the prompts

### Desktop (Chrome/Edge)

1. Open the app in Chrome or Edge
2. Look for the install icon in the address bar (or menu)
3. Click "Install Shopping List"

## Offline Behavior

- The app caches its shell and assets on first visit
- All shopping list data is stored in IndexedDB (local browser storage)
- Changes made offline are queued and synced automatically when online
- An offline page is shown if you navigate to an uncached page while offline

## Project Structure

```
shoppinglist-web/
├── apps-script/          # Google Apps Script backend code
├── build/               # Production build output
├── scripts/             # Build utilities (icon generation)
├── src/
│   ├── app.html         # HTML template with PWA meta tags
│   ├── app.css          # Global styles and CSS variables
│   ├── service-worker.ts # Custom service worker with caching strategies
│   ├── lib/
│   │   ├── components/  # Svelte UI components
│   │   ├── db/          # Dexie database layer
│   │   ├── stores/      # Svelte 5 runes-based stores
│   │   ├── sync/        # Sync engine and conflict resolution
│   │   ├── view-modes/  # List grouping and projection logic
│   │   └── utils/       # Helper utilities
│   └── routes/          # SvelteKit routes
│       ├── +page.svelte     # Main list view
│       ├── shopping/        # Shopping mode
│       ├── history/         # Purchase history
│       └── settings/        # App settings
├── static/              # Static assets (icons, manifest)
├── svelte.config.js     # SvelteKit configuration
├── tailwind.config.js   # Tailwind CSS configuration
├── tsconfig.json        # TypeScript configuration
└── vite.config.ts       # Vite and PWA configuration
```

## PWA Checklist

- [x] Web App Manifest with required fields
- [x] Service worker with precaching
- [x] Offline fallback page
- [x] Icons (192x192, 512x512, SVG, Apple touch icon, favicon)
- [x] Theme color meta tags (light/dark mode support)
- [x] Apple mobile web app meta tags
- [x] Safe area insets for notched devices
- [x] Touch targets >= 44px
- [x] Install prompt handling
- [x] Works offline after first load

## License

MIT
