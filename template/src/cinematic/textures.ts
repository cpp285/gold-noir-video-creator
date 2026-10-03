// 程序化行星纹理：全部由带种子的噪声生成，每次渲染结果一致（多个渲染标签页之间不会闪烁）。
import * as THREE from 'three';
import type {PlanetId} from './data';

type RGB = [number, number, number];

const hash = (x: number, y: number, z: number, s: number) => {
	let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 1274126177) ^ Math.imul(s + 1, 1442695041);
	h = Math.imul(h ^ (h >>> 13), 1274126177);
	h ^= h >>> 16;
	return (h >>> 0) / 4294967296;
};
const sm = (t: number) => t * t * (3 - 2 * t);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const mix = (a: RGB, b: RGB, t: number): RGB => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

function noise3(x: number, y: number, z: number, s: number) {
	const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
	const u = sm(x - xi), v = sm(y - yi), w = sm(z - zi);
	const c = (dx: number, dy: number, dz: number) => hash(xi + dx, yi + dy, zi + dz, s);
	const x00 = lerp(c(0, 0, 0), c(1, 0, 0), u), x10 = lerp(c(0, 1, 0), c(1, 1, 0), u);
	const x01 = lerp(c(0, 0, 1), c(1, 0, 1), u), x11 = lerp(c(0, 1, 1), c(1, 1, 1), u);
	return lerp(lerp(x00, x10, v), lerp(x01, x11, v), w);
}
function fbm(x: number, y: number, z: number, s: number, oct = 5) {
	let a = 0.5, f = 1, sum = 0, norm = 0;
	for (let i = 0; i < oct; i++) {
		sum += a * noise3(x * f, y * f, z * f, s + i * 17);
		norm += a; a *= 0.5; f *= 2.03;
	}
	return sum / norm;
}

type Crater = {x: number; y: number; z: number; r: number; lim: number};
function makeCraters(n: number, seed: number, rMin: number, rMax: number): Crater[] {
	const out: Crater[] = [];
	for (let k = 0; k < n; k++) {
		const z = 2 * hash(k, 1, 0, seed) - 1, phi = 2 * Math.PI * hash(k, 2, 0, seed), s = Math.sqrt(1 - z * z);
		const r = rMin + (rMax - rMin) * Math.pow(hash(k, 3, 0, seed), 3);
		out.push({x: s * Math.cos(phi), y: z, z: s * Math.sin(phi), r, lim: 1 - (1.3 * r) ** 2 / 2});
	}
	return out;
}
function craterAt(x: number, y: number, z: number, list: Crater[]) {
	let shade = 0, h = 0;
	for (const c of list) {
		const d = x * c.x + y * c.y + z * c.z;
		if (d < c.lim) continue;
		const a = Math.sqrt(Math.max(0, 2 * (1 - d))) / c.r;
		if (a < 1) { shade -= 0.2 * (1 - a * a); h -= 1 - a * a; }
		const rim = 1 - Math.abs(a - 1) / 0.25;
		if (rim > 0) { shade += 0.14 * rim; h += 0.7 * rim; }
	}
	return [shade, h];
}

// 遍历等距柱状投影的每个像素，回调拿到球面坐标
function paint(w: number, h: number, fn: (x: number, y: number, z: number, lat: number, lon: number) => {c: RGB; a?: number; h?: number}, withBump = false) {
	const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
	const ctx = cv.getContext('2d')!;
	const img = ctx.createImageData(w, h);
	let bumpCv: HTMLCanvasElement | null = null, bumpImg: ImageData | null = null, bumpCtx: CanvasRenderingContext2D | null = null;
	if (withBump) { bumpCv = document.createElement('canvas'); bumpCv.width = w; bumpCv.height = h; bumpCtx = bumpCv.getContext('2d')!; bumpImg = bumpCtx.createImageData(w, h); }
	for (let j = 0; j < h; j++) {
		const lat = (0.5 - (j + 0.5) / h) * Math.PI, cl = Math.cos(lat), sl = Math.sin(lat);
		for (let i = 0; i < w; i++) {
			const lon = ((i + 0.5) / w) * Math.PI * 2;
			const r = fn(cl * Math.cos(lon), sl, cl * Math.sin(lon), lat, lon);
			const k = (j * w + i) * 4;
			img.data[k] = r.c[0]; img.data[k + 1] = r.c[1]; img.data[k + 2] = r.c[2]; img.data[k + 3] = r.a === undefined ? 255 : r.a * 255;
			if (bumpImg) { const v = clamp01(0.5 + (r.h || 0) * 0.5) * 255; bumpImg.data[k] = bumpImg.data[k + 1] = bumpImg.data[k + 2] = v; bumpImg.data[k + 3] = 255; }
		}
	}
	ctx.putImageData(img, 0, 0);
	if (bumpCtx && bumpImg) bumpCtx.putImageData(bumpImg, 0, 0);
	return {color: cv, bump: bumpCv};
}
const toTex = (cv: HTMLCanvasElement, srgb = true) => {
	const t = new THREE.CanvasTexture(cv);
	if (srgb) t.colorSpace = THREE.SRGBColorSpace;
	t.anisotropy = 8; t.needsUpdate = true;
	return t;
};

const bandPalette = (pal: RGB[], v: number): RGB => {
	const x = ((v % 1) + 1) % 1 * pal.length, i = Math.floor(x), t = sm(x - i);
	return mix(pal[i % pal.length], pal[(i + 1) % pal.length], t);
};

export type PlanetTex = {map: THREE.Texture; bump?: THREE.Texture; clouds?: THREE.Texture};
const cache = new Map<string, PlanetTex>();

export function planetTextures(id: PlanetId | 'sun', w = 1024): PlanetTex {
	const key = id + w;
	const hit = cache.get(key);
	if (hit) return hit;
	const h = w / 2;
	let out: PlanetTex;
	switch (id) {
		case 'sun': {
			const p = paint(w, h, (x, y, z) => {
				const n = fbm(x * 9, y * 9, z * 9, 3, 4), m = fbm(x * 2.5, y * 2.5, z * 2.5, 9, 3);
				return {c: mix([235, 110, 20], [255, 228, 140], clamp01(n * 1.25 - 0.1 + (m - 0.5) * 0.4))};
			});
			out = {map: toTex(p.color)};
			break;
		}
		case 'mercury': {
			const cr = makeCraters(110, 11, 0.025, 0.22);
			const p = paint(w, h, (x, y, z) => {
				const n = fbm(x * 3, y * 3, z * 3, 5), fine = fbm(x * 14, y * 14, z * 14, 6, 3);
				const [s, hh] = craterAt(x, y, z, cr);
				const c = mix([92, 86, 80], [176, 166, 154], clamp01(n * 1.1 + (fine - 0.5) * 0.3 + s));
				return {c, h: hh * 0.6 + (fine - 0.5) * 0.4};
			}, true);
			out = {map: toTex(p.color), bump: toTex(p.bump!, false)};
			break;
		}
		case 'venus': {
			const p = paint(w, h, (x, y, z, lat) => {
				const q = fbm(x * 1.6, y * 1.6, z * 1.6, 21);
				const n = fbm(x * 2 + q * 2, y * 5, z * 2 + q * 2, 22);
				const t = clamp01(0.5 + 0.35 * Math.sin(lat * 7 + q * 7) + (n - 0.5) * 0.8);
				return {c: mix([190, 150, 88], [240, 220, 168], t)};
			});
			out = {map: toTex(p.color)};
			break;
		}
		case 'earth': {
			const p = paint(w, h, (x, y, z, lat) => {
				const n = fbm(x * 1.7, y * 1.7, z * 1.7, 31, 6) + 0.12 * (fbm(x * 6, y * 6, z * 6, 32, 3) - 0.5);
				const alat = Math.abs(lat);
				let c: RGB;
				if (n < 0.56) c = mix([6, 22, 62], [26, 80, 140], clamp01((n - 0.32) / 0.24));
				else {
					const dry = clamp01(1 - Math.abs(alat - 0.4) * 3) * 0.8 + (fbm(x * 4, y * 4, z * 4, 33, 3) - 0.5);
					c = mix([38, 72, 34], [164, 136, 90], clamp01(dry));
					c = mix(c, [120, 104, 86], clamp01((n - 0.66) * 5));
				}
				const ice = clamp01((alat - 1.17) * 6 + (fbm(x * 5, y * 5, z * 5, 34, 3) - 0.5) * 2);
				return {c: mix(c, [235, 242, 248], ice)};
			});
			const cl = paint(w, h, (x, y, z) => {
				const q = fbm(x * 2, y * 2, z * 2, 41, 3);
				const c = fbm(x * 3 + q * 1.5, y * 4, z * 3 + q * 1.5, 42, 5);
				return {c: [255, 255, 255], a: clamp01((c - 0.5) * 3.2) * 0.9};
			});
			out = {map: toTex(p.color), clouds: toTex(cl.color)};
			break;
		}
		case 'mars': {
			const cr = makeCraters(40, 51, 0.02, 0.12);
			const p = paint(w, h, (x, y, z, lat) => {
				const n = fbm(x * 2.5, y * 2.5, z * 2.5, 52), m = fbm(x * 1.5, y * 1.5, z * 1.5, 53, 4);
				const [s, hh] = craterAt(x, y, z, cr);
				let c = mix([150, 62, 30], [212, 116, 64], clamp01(n * 1.2 - 0.1 + s * 0.6));
				c = mix(c, [96, 46, 30], clamp01((m - 0.55) * 4) * 0.8);
				const ice = clamp01((Math.abs(lat) - 1.27) * 7 + (n - 0.5) * 2);
				return {c: mix(c, [240, 236, 228], ice), h: hh * 0.5 + (n - 0.5) * 0.6};
			}, true);
			out = {map: toTex(p.color), bump: toTex(p.bump!, false)};
			break;
		}
		case 'jupiter': {
			const pal: RGB[] = [[232, 218, 194], [198, 160, 118], [236, 226, 206], [174, 118, 80], [218, 190, 150], [150, 102, 72], [226, 204, 168]];
			const p = paint(w, h, (x, y, z, lat, lon) => {
				const wv = fbm(x * 2.2, y * 2.2, z * 2.2, 61);
				let c = bandPalette(pal, lat * 1.55 + (wv - 0.5) * 0.35 + 0.05 * fbm(x * 9, y * 9, z * 9, 62, 3));
				let dl = lon - 1.3; dl -= Math.round(dl / (2 * Math.PI)) * 2 * Math.PI;
				const e = (dl / 0.3) ** 2 + ((lat + 0.38) / 0.12) ** 2;
				if (e < 1.6) {
					const core = clamp01(1.25 - e), ring = clamp01(1 - Math.abs(e - 1.1) * 3);
					c = mix(c, [236, 220, 196], ring * 0.7);
					c = mix(c, [196, 92, 58], core * (0.75 + 0.25 * fbm(x * 12, y * 12, z * 12, 63, 3)));
				}
				return {c};
			});
			out = {map: toTex(p.color)};
			break;
		}
		case 'saturn': {
			const pal: RGB[] = [[232, 214, 172], [212, 188, 142], [238, 224, 188], [198, 170, 122], [226, 204, 160]];
			const p = paint(w, h, (x, y, z, lat) => ({c: bandPalette(pal, lat * 1.3 + (fbm(x * 2, y * 2, z * 2, 71) - 0.5) * 0.12)}));
			out = {map: toTex(p.color)};
			break;
		}
		case 'uranus': {
			const p = paint(w, h, (x, y, z, lat) => ({c: mix([150, 206, 216], [190, 232, 238], clamp01(0.5 + 0.25 * Math.sin(lat * 6) + (fbm(x * 2, y * 2, z * 2, 81) - 0.5) * 0.3))}));
			out = {map: toTex(p.color)};
			break;
		}
		case 'neptune':
		default: {
			const p = paint(w, h, (x, y, z, lat, lon) => {
				const q = fbm(x * 2, y * 2, z * 2, 91);
				let c = mix([34, 62, 158], [76, 116, 214], clamp01(0.5 + 0.3 * Math.sin(lat * 5 + q * 3) + (q - 0.5) * 0.6));
				let dl = lon - 2.2; dl -= Math.round(dl / (2 * Math.PI)) * 2 * Math.PI;
				const e = (dl / 0.26) ** 2 + ((lat + 0.36) / 0.1) ** 2;
				if (e < 1) c = mix(c, [20, 34, 100], 1 - e);
				const streak = fbm(x * 3, y * 12, z * 3, 92, 4);
				return {c: mix(c, [235, 242, 255], clamp01((streak - 0.66) * 4) * 0.7)};
			});
			out = {map: toTex(p.color)};
		}
	}
	cache.set(key, out);
	return out;
}

// 土星环 / 天王星环：沿半径方向的 1D 纹理
export function ringTexture(kind: 'saturn' | 'uranus') {
	const key = 'ring-' + kind;
	const hit = cache.get(key);
	if (hit) return hit.map;
	const w = 1024, cv = document.createElement('canvas'); cv.width = w; cv.height = 4;
	const ctx = cv.getContext('2d')!, img = ctx.createImageData(w, 4);
	for (let i = 0; i < w; i++) {
		const u = i / (w - 1);
		let c: RGB, a: number;
		if (kind === 'saturn') {
			const dens = 0.55 + 0.45 * noise3(u * 60, 0, 0, 101) * noise3(u * 13, 1, 0, 102);
			a = dens * (u < 0.18 ? 0.35 : 0.9) * clamp01(u * 20) * clamp01((1 - u) * 30);
			if (u > 0.69 && u < 0.755) a *= 0.06; // 卡西尼缝
			c = mix([196, 172, 130], [238, 222, 186], noise3(u * 30, 3, 0, 103));
		} else {
			a = (Math.abs(u - 0.85) < 0.04 ? 0.6 : 0.08) * (0.7 + 0.3 * noise3(u * 50, 0, 0, 104));
			c = [190, 220, 230];
		}
		for (let j = 0; j < 4; j++) { const k = (j * w + i) * 4; img.data[k] = c[0]; img.data[k + 1] = c[1]; img.data[k + 2] = c[2]; img.data[k + 3] = a * 255; }
	}
	ctx.putImageData(img, 0, 0);
	const t = toTex(cv);
	cache.set(key, {map: t});
	return t;
}

export function ringGeometry(inner: number, outer: number) {
	const g = new THREE.RingGeometry(inner, outer, 180, 1);
	const pos = g.attributes.position, uv = g.attributes.uv;
	for (let i = 0; i < pos.count; i++) uv.setXY(i, (Math.hypot(pos.getX(i), pos.getY(i)) - inner) / (outer - inner), 0.5);
	return g;
}

export function glowTexture() {
	const hit = cache.get('glow');
	if (hit) return hit.map;
	const cv = document.createElement('canvas'); cv.width = cv.height = 256;
	const ctx = cv.getContext('2d')!, g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
	g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.18, 'rgba(255,255,255,0.45)'); g.addColorStop(0.5, 'rgba(255,255,255,0.08)'); g.addColorStop(1, 'rgba(255,255,255,0)');
	ctx.fillStyle = g; ctx.fillRect(0, 0, 256, 256);
	const t = toTex(cv);
	cache.set('glow', {map: t});
	return t;
}
