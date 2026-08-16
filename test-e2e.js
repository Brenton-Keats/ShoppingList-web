import { chromium } from 'playwright';
import { execSync } from 'child_process';

(async () => {
	const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
	const commit = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
	console.log(`Testing branch: ${branch}, commit: ${commit}`);

	const browser = await chromium.launch({ headless: true });

	const context = await browser.newContext();
	await context.clearCookies();

	const appPage = await context.newPage();

	const consoleMessages = [];
	const errorMessages = [];

	appPage.on('console', msg => {
		consoleMessages.push(msg.text());
		if (msg.type() === 'error') {
			errorMessages.push(msg.text());
		}
	});

	appPage.on('pageerror', error => {
		errorMessages.push(error.message);
	});

	const url = 'http://localhost:4173/shoppinglist-web/';
	console.log(`Opening app at ${url}`);
	await appPage.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
	await appPage.waitForTimeout(5000);

	const title = await appPage.title();
	console.log(`Page title: ${title}`);

	const bodyText = await appPage.locator('body').innerText();
	console.log(`Body text length: ${bodyText.length}`);
	console.log(`Body preview: ${bodyText.substring(0, 200)}`);

	const manifest = await appPage.locator('link[rel="manifest"]').getAttribute('href');
	console.log(`Manifest href: ${manifest}`);

	const manifestResponse = await appPage.evaluate(async (href) => {
		try {
			const res = await fetch(href);
			return { status: res.status, ok: res.ok };
		} catch (e) {
			return { status: 0, ok: false, error: e.message };
		}
	}, manifest);
	console.log(`Manifest fetch: ${JSON.stringify(manifestResponse)}`);

	const swRegistration = await appPage.evaluate(async () => {
		if ('serviceWorker' in navigator) {
			const reg = await navigator.serviceWorker.getRegistration();
			return { exists: !!reg, scope: reg?.scope };
		}
		return { exists: false };
	});
	console.log(`Service Worker: ${JSON.stringify(swRegistration)}`);

	const dbInfo = await appPage.evaluate(async () => {
		try {
			const databases = await window.indexedDB.databases();
			return { databases: databases.map(db => db.name) };
		} catch (e) {
			return { error: e.message };
		}
	});
	console.log(`IndexedDB: ${JSON.stringify(dbInfo)}`);

	await appPage.screenshot({ path: '/tmp/shoppinglist-screenshots/app.png', fullPage: true });

	console.log(`\n=== CONSOLE MESSAGES (${consoleMessages.length}) ===`);
	consoleMessages.forEach((msg, i) => console.log(`  [${i}] ${msg}`));

	console.log(`\n=== ERROR MESSAGES (${errorMessages.length}) ===`);
	errorMessages.forEach((msg, i) => console.log(`  [${i}] ${msg}`));

	const hasEnvError = errorMessages.some(msg => msg.includes('APPS_SCRIPT_URL') || msg.includes('APP_NAME') || msg.includes('APP_VERSION'));
	const hasStateError = errorMessages.some(msg => msg.includes('$state') || msg.includes('effect_orphan'));
	const hasManifest404 = !manifestResponse.ok;
	const hasContent = bodyText.length > 100;

	console.log(`\n=== VERIFICATION ===`);
	console.log(`Env error: ${hasEnvError ? 'FAIL' : 'PASS'}`);
	console.log(`State/effect error: ${hasStateError ? 'FAIL' : 'PASS'}`);
	console.log(`Manifest accessible: ${hasManifest404 ? 'FAIL' : 'PASS'}`);
	console.log(`Page has content: ${hasContent ? 'PASS' : 'FAIL'}`);

	const overallPass = !hasEnvError && !hasStateError && !hasManifest404 && hasContent;
	console.log(`\nOverall: ${overallPass ? 'PASS' : 'FAIL'}`);

	await browser.close();
	process.exit(overallPass ? 0 : 1);
})();
