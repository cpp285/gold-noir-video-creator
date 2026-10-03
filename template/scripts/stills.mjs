// 一次打开浏览器，批量抽帧：node scripts/stills.mjs 0 300 470（帧号）→ out/stills/<id>-<帧号>.png
// 先 npm run bundle。环境变量：COMP=Linework 换 Composition，SCALE=1 出全分辨率（默认 0.5，适合拼成总览图）。
import {renderStill, selectComposition, openBrowser} from '@remotion/renderer';
import {mkdirSync} from 'node:fs';

const frames = process.argv.slice(2).map(Number).filter((n) => Number.isInteger(n) && n >= 0);
if (!frames.length) {
	console.error('用法：node scripts/stills.mjs <帧号> [帧号...]');
	process.exit(1);
}
const serveUrl = 'build', id = process.env.COMP ?? 'Main', scale = Number(process.env.SCALE ?? 0.5);
const chromiumOptions = {gl: 'angle'};
mkdirSync('out/stills', {recursive: true});
const browser = await openBrowser('chrome', {chromiumOptions});
try {
	const composition = await selectComposition({serveUrl, id, puppeteerInstance: browser});
	for (const frame of frames) {
		const output = `out/stills/${id}-${frame}.png`;
		await renderStill({serveUrl, composition, frame: Math.min(frame, composition.durationInFrames - 1), output, puppeteerInstance: browser, scale, chromiumOptions});
		console.log(output);
	}
} finally {
	await browser.close({silent: true});
}
