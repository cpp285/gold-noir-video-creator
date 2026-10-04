// 抽线描演示的关键帧：node scripts/demo-stills.mjs 100 140 150
import {renderStill, selectComposition, openBrowser} from '@remotion/renderer';
import {mkdirSync} from 'node:fs';
const serveUrl = process.env.SERVE ?? 'build';
mkdirSync('out/stills', {recursive: true});
const browser = await openBrowser('chrome', {chromiumOptions: {gl: 'angle'}});
const composition = await selectComposition({serveUrl, id: 'Linework', puppeteerInstance: browser});
for (const fr of process.argv.slice(2).map(Number)) {
	await renderStill({serveUrl, composition, frame: fr, output: `out/stills/linework-${fr}.png`, puppeteerInstance: browser, scale: Number(process.env.SCALE ?? 0.6), chromiumOptions: {gl: 'angle'}});
	console.log('frame', fr);
}
await browser.close({silent: true});
