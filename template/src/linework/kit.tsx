// 线描叙事的基础件：深蓝夜空 + 暖金线描、红色章节印、章节卡、年份里程表、标签、逐笔画线。红色只用在印章上。
import React from 'react';
import {AbsoluteFill, interpolate, Easing, random} from 'remotion';
import {SERIF_ZH, SERIF_LA} from '../cinematic/data';

export const GOLD = '#d9a54a';
export const GOLD_L = '#f3d590';
export const IVORY = '#efe6d6';
export const DIM = '#8a93b8'; // 夜空里的冷灰字
export const SEAL = '#b8322a';
export const NAVY = '#0a1130';
export {SERIF_ZH, SERIF_LA};

export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
export const ease = Easing.bezier(0.22, 1, 0.36, 1);
export const easeIO = Easing.bezier(0.65, 0, 0.35, 1);
// 0→1 缓动进度
// a、b 相同时 interpolate 会报错（inputRange 必须严格递增），这里退化成阶跃
export const k = (f: number, a: number, b: number, e = ease) => (b <= a ? (f >= a ? 1 : 0) : interpolate(f, [a, b], [0, 1], {...clamp, easing: e}));
// 出现—停留—消失的窗口
export const win = (f: number, a: number, b: number, fin = 10, fout = 10) => Math.min(k(f, a, a + fin), 1 - k(f, b - fout, b));
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;
// 回弹落下：0→1，略过冲
export const drop = (f: number, a: number, d = 12) => {
	const t = Math.max(0, Math.min(1, (f - a) / d));
	if (t <= 0) return 0;
	const c = 1.70158 * 1.4;
	return 1 + (c + 1) * (t - 1) ** 3 + c * (t - 1) ** 2;
};

export const goldText: React.CSSProperties = {
	backgroundImage: `linear-gradient(180deg, #fff3cf 0%, ${GOLD_L} 32%, ${GOLD} 64%, #9c6a24 100%)`,
	WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
};

// 线描逐笔画出：pathLength=1 后用 dashoffset 控制
export const drawn = (p: number): {pathLength: number; strokeDasharray: number; strokeDashoffset: number} => ({pathLength: 1, strokeDasharray: 1, strokeDashoffset: 1 - Math.max(0, Math.min(1, p))});

// 深蓝夜空 + 星星 + 地平线微光
export const Sky: React.FC<{f: number; warm?: number}> = ({f, warm = 0}) => (
	<AbsoluteFill>
		<AbsoluteFill style={{background: 'radial-gradient(ellipse 90% 75% at 50% 42%, #18234d 0%, #0c1434 48%, #05081a 100%)'}} />
		<AbsoluteFill style={{background: 'radial-gradient(ellipse 60% 30% at 50% 82%, rgba(217,150,70,0.16), rgba(0,0,0,0) 70%)', opacity: 0.5 + warm * 0.5}} />
		<svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
			<defs><filter id="starGlow"><feGaussianBlur stdDeviation="1.6" /></filter></defs>
			{Array.from({length: 230}, (_, i) => {
				const x = random(`sx${i}`) * 1920, y = random(`sy${i}`) * 1000;
				const s = random(`ss${i}`), ph = random(`sp${i}`) * 6.28;
				const tw = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(f / (14 + s * 30) + ph));
				const big = s > 0.94;
				return <circle key={i} cx={x} cy={y} r={big ? 1.8 : 0.6 + s * 0.9} fill={big ? '#fff2d6' : '#cfd7ff'} opacity={(big ? 0.9 : 0.55) * tw * (1 - y / 1400)} filter={big ? 'url(#starGlow)' : undefined} />;
			})}
		</svg>
	</AbsoluteFill>
);

export const Vignette: React.FC = () => (
	<AbsoluteFill style={{background: 'radial-gradient(ellipse 85% 78% at 50% 48%, rgba(0,0,0,0) 55%, rgba(2,3,10,0.6) 100%)', pointerEvents: 'none'}} />
);

export const Grain: React.FC<{f: number}> = ({f}) => (
	<AbsoluteFill style={{opacity: 0.06, mixBlendMode: 'overlay', pointerEvents: 'none'}}>
		<svg width="1920" height="1080">
			<filter id={`gr${f % 6}`}><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={f % 6} /></filter>
			<rect width="1920" height="1080" filter={`url(#gr${f % 6})`} />
		</svg>
	</AbsoluteFill>
);

// 红色印章：方框 + 大写数字
export const Seal: React.FC<{ch: string; size: number; stamp?: number; style?: React.CSSProperties}> = ({ch, size, stamp = 1, style}) => {
	const s = 1 + (1 - stamp) * 1.6;
	return (
		<div style={{width: size, height: size, background: SEAL, borderRadius: size * 0.1, display: 'flex', alignItems: 'center', justifyContent: 'center',
			boxShadow: `inset 0 0 0 ${size * 0.06}px #e0b48a33, inset 0 0 0 ${size * 0.1}px ${SEAL}, inset 0 0 0 ${size * 0.13}px #f2d2b066, 0 6px 24px rgba(120,20,10,0.45)`,
			fontFamily: SERIF_ZH, fontWeight: 900, fontSize: size * 0.56, color: '#f6dcc2', opacity: Math.min(1, stamp * 3), transform: `scale(${s}) rotate(${(1 - stamp) * -8}deg)`, ...style}}>{ch}</div>
	);
};

export type Chapter = {seal: string; name: string; sub: string; note: string};

// 章节卡：居中大印章 + 章名 + 一句引子（约 1.5 秒）
export const ChapterCard: React.FC<{f: number; s: number; d: number; ch: Chapter}> = ({f, s, d, ch}) => {
	const t = f - s;
	const op = win(f, s, s + d, 8, 10);
	const ink = k(t, 2, 14);
	return (
		<AbsoluteFill style={{opacity: op, pointerEvents: 'none'}}>
			<AbsoluteFill style={{background: 'radial-gradient(ellipse 60% 45% at 50% 48%, rgba(5,8,26,0.82), rgba(5,8,26,0.55) 70%, rgba(5,8,26,0.2))'}} />
			<div style={{position: 'absolute', top: 400, left: 0, right: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 34}}>
				<div style={{fontFamily: SERIF_ZH, fontWeight: 700, fontSize: 132, letterSpacing: '0.24em', ...goldText,
					filter: `blur(${(1 - ink) * 10}px) drop-shadow(0 0 30px rgba(217,165,74,0.35))`, opacity: ink, transform: `translateY(${(1 - ink) * 16}px)`}}>{ch.name}</div>
				<Seal ch={ch.seal} size={78} stamp={k(t, 9, 17, Easing.bezier(0.5, 0, 0.75, 0))} style={{marginTop: -50}} />
			</div>
			<div style={{position: 'absolute', top: 590, left: 0, right: 0, textAlign: 'center', fontFamily: SERIF_ZH, fontSize: 34, letterSpacing: '0.2em', color: GOLD_L,
				opacity: k(t, 12, 24) * 0.9}}>{ch.sub}</div>
		</AbsoluteFill>
	);
};

// 左上角章节标识：小印章 + 章名 + 注释
export const ChapterHUD: React.FC<{ch: Chapter | null; op: number}> = ({ch, op}) =>
	ch ? (
		<div style={{position: 'absolute', left: 74, top: 62, display: 'flex', alignItems: 'center', gap: 18, opacity: op}}>
			<Seal ch={ch.seal} size={50} />
			<div style={{fontFamily: SERIF_ZH, fontWeight: 700, fontSize: 44, letterSpacing: '0.18em', ...goldText}}>{ch.name}</div>
			<div style={{fontFamily: SERIF_ZH, fontSize: 22, letterSpacing: '0.16em', color: DIM, marginLeft: 8, marginTop: 6}}>{ch.note}</div>
		</div>
	) : null;

// 年份里程表：每一位像机械表一样滚动
export const Odometer: React.FC<{value: number; size?: number; color?: string; digits?: number}> = ({value, size = 40, color = GOLD_L, digits = 4}) => {
	const cols = [];
	for (let i = digits - 1; i >= 0; i--) {
		const p = 10 ** i;
		const raw = value / p;
		const d = Math.floor(raw) % 10;
		// 低位接近进位时，高位一起转
		const lower = value % p;
		const frac = i === 0 ? raw - Math.floor(raw) : lower > p - 1 ? lower - (p - 1) : 0;
		const pos = d + frac;
		cols.push(
			<div key={i} style={{height: size * 1.15, overflow: 'hidden', width: size * 0.62}}>
				<div style={{transform: `translateY(${-pos * size * 1.15}px)`}}>
					{Array.from({length: 11}, (_, n) => (
						<div key={n} style={{height: size * 1.15, lineHeight: `${size * 1.15}px`, fontFamily: SERIF_LA, fontSize: size, color, textAlign: 'center'}}>{n % 10}</div>
					))}
				</div>
			</div>,
		);
	}
	return <div style={{display: 'flex', WebkitMaskImage: 'linear-gradient(180deg, transparent, #000 25%, #000 75%, transparent)'}}>{cols}</div>;
};

// 右上角年份 + 一行注释
export const YearTag: React.FC<{year: number; note: string; op: number}> = ({year, note, op}) => (
	<div style={{position: 'absolute', right: 78, top: 56, opacity: op, display: 'flex', flexDirection: 'column', alignItems: 'flex-end'}}>
		<Odometer value={year} size={46} />
		<div style={{fontFamily: SERIF_ZH, fontSize: 20, letterSpacing: '0.2em', color: DIM, marginTop: 2}}>{note}</div>
	</div>
);

// 小标签：细金框 + 字
export const Tag: React.FC<{x: number; y: number; op: number; children: React.ReactNode; size?: number; color?: string; anchor?: 'center' | 'left' | 'right'; boxed?: boolean}> = ({x, y, op, children, size = 24, color = GOLD_L, anchor = 'center', boxed = true}) => (
	<div style={{position: 'absolute', left: x, top: y, transform: `translate(${anchor === 'center' ? '-50%' : anchor === 'right' ? '-100%' : '0'}, -50%) translateY(${(1 - op) * 8}px)`, opacity: op,
		fontFamily: SERIF_ZH, fontSize: size, letterSpacing: '0.12em', color, whiteSpace: 'nowrap',
		...(boxed ? {padding: '6px 16px', border: `1px solid ${GOLD}88`, background: 'rgba(8,12,34,0.72)', borderRadius: 4} : {})}}>{children}</div>
);
