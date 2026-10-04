import React from 'react';
import {AbsoluteFill, interpolate, Easing, random} from 'remotion';
import {GOLD, GOLD_LIGHT, IVORY, SERIF_ZH, SERIF_LA, DIDOT, PLANETS, type Planet} from './data';

const clampOpt = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = Easing.bezier(0.22, 1, 0.36, 1);
export const goldText: React.CSSProperties = {
	backgroundImage: `linear-gradient(180deg, #fff1c8 0%, ${GOLD_LIGHT} 30%, ${GOLD} 62%, #9c6a24 100%)`,
	WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
};

export const Background: React.FC<{glowY?: number}> = ({glowY = 45}) => (
	<AbsoluteFill style={{background: `radial-gradient(ellipse 70% 60% at 50% ${glowY}%, #2c1f13 0%, #150e08 55%, #070504 100%)`}} />
);

export const Vignette: React.FC = () => (
	<AbsoluteFill style={{background: 'radial-gradient(ellipse 85% 75% at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)', pointerEvents: 'none'}} />
);

export const Grain: React.FC<{frame: number}> = ({frame}) => (
	<AbsoluteFill style={{opacity: 0.07, mixBlendMode: 'overlay', pointerEvents: 'none'}}>
		<svg width="1920" height="1080">
			<filter id={`g${frame % 6}`}><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={frame % 6} /></filter>
			<rect width="1920" height="1080" filter={`url(#g${frame % 6})`} />
		</svg>
	</AbsoluteFill>
);

// 从黑场淡入 / 淡出到黑场
export const Fade: React.FC<{f: number; dur: number; inF?: number; outF?: number}> = ({f, dur, inF = 14, outF = 12}) => {
	const o = Math.max(interpolate(f, [0, inF], [1, 0], clampOpt), interpolate(f, [dur - outF, dur], [0, 1], clampOpt));
	return <AbsoluteFill style={{background: '#050302', opacity: o, pointerEvents: 'none'}} />;
};

// 漂浮的金色粒子
export const Dust: React.FC<{frame: number; count?: number; seed?: string}> = ({frame, count = 70, seed = 'd'}) => (
	<AbsoluteFill style={{pointerEvents: 'none'}}>
		<svg width="1920" height="1080">
			<defs><filter id="dustBlur"><feGaussianBlur stdDeviation="3" /></filter></defs>
			{Array.from({length: count}, (_, i) => {
				const rx = random(`${seed}x${i}`), ry = random(`${seed}y${i}`), rs = random(`${seed}s${i}`), rp = random(`${seed}p${i}`);
				const big = rs > 0.9;
				const x = rx * 1920 + Math.sin(frame / 70 + rp * 6) * 24;
				const y = ((ry * 1180 - frame * (0.25 + rs * 0.6)) % 1180 + 1180) % 1180 - 50;
				const o = (0.2 + 0.65 * Math.abs(Math.sin(frame / (18 + rs * 30) + rp * 9))) * (big ? 0.35 : 1);
				return <circle key={i} cx={x} cy={y} r={big ? 6 + rs * 6 : 0.8 + rs * 1.8} fill={GOLD_LIGHT} opacity={o} filter={big ? 'url(#dustBlur)' : undefined} />;
			})}
		</svg>
	</AbsoluteFill>
);

// 背景里很淡的拉丁文大字
export const LatinBG: React.FC<{text: string; frame: number; top?: number}> = ({text, frame, top = 210}) => (
	<div style={{position: 'absolute', top, left: 0, right: 0, display: 'flex', justifyContent: 'center', pointerEvents: 'none',
		WebkitMaskImage: 'linear-gradient(90deg, transparent, #000 18%, #000 82%, transparent)'}}>
		<div style={{fontFamily: SERIF_LA, fontSize: 230, letterSpacing: '0.22em', color: 'rgba(214,170,100,0.065)', whiteSpace: 'nowrap',
			transform: `translateX(${80 - frame * 0.35}px)`}}>{text}</div>
	</div>
);

// 刻度表盘 + 环形文字
export const Dial: React.FC<{cx: number; cy: number; r: number; progress: number; rot: number; ring: string; opacity?: number; id: string}> = ({cx, cy, r, progress, rot, ring, opacity = 1, id}) => {
	const a0 = -80, span = 300, n = 120;
	const ticks = [];
	for (let i = 0; i <= n; i++) {
		if (i / n > progress) break;
		const a = ((a0 + (span * i) / n) * Math.PI) / 180, major = i % 10 === 0, r1 = r + 16, r2 = r1 + (major ? 20 : 8);
		ticks.push(<line key={i} x1={Math.cos(a) * r1} y1={Math.sin(a) * r1} x2={Math.cos(a) * r2} y2={Math.sin(a) * r2} stroke={GOLD} strokeOpacity={major ? 0.85 : 0.4} strokeWidth={major ? 2 : 1.2} />);
	}
	const end = ((a0 + span * progress) * Math.PI) / 180, s0 = (a0 * Math.PI) / 180, rr = r + 16;
	const arc = progress > 0 ? `M ${Math.cos(s0) * rr} ${Math.sin(s0) * rr} A ${rr} ${rr} 0 ${span * progress > 180 ? 1 : 0} 1 ${Math.cos(end) * rr} ${Math.sin(end) * rr}` : '';
	const tr = r + 70;
	const markA = ((rot * 2.2 + 30) * Math.PI) / 180;
	return (
		<svg width="1920" height="1080" style={{position: 'absolute', inset: 0, opacity, pointerEvents: 'none'}}>
			<defs>
				<path id={`ring-${id}`} d={`M ${-tr} 0 A ${tr} ${tr} 0 1 1 ${tr} 0 A ${tr} ${tr} 0 1 1 ${-tr} 0`} />
				<filter id={`glow-${id}`}><feGaussianBlur stdDeviation="2.5" /></filter>
			</defs>
			<g transform={`translate(${cx} ${cy})`}>
				<circle r={r + 48} fill="none" stroke={GOLD} strokeOpacity={0.22 * progress} strokeWidth={1} />
				<circle r={r + 100} fill="none" stroke={GOLD} strokeOpacity={0.1 * progress} strokeWidth={1} strokeDasharray="2 7" />
				<g transform={`rotate(${rot})`}>
					<path d={arc} fill="none" stroke={GOLD} strokeOpacity={0.6} strokeWidth={1.5} />
					{ticks}
				</g>
				<g transform={`rotate(${-rot * 0.6 - 90})`} opacity={progress}>
					<text fontFamily={SERIF_LA} fontSize={15} letterSpacing={7} fill={GOLD} fillOpacity={0.6}>
						<textPath href={`#ring-${id}`}>{ring}</textPath>
					</text>
				</g>
				<g transform={`translate(${Math.cos(markA) * (r + 48)} ${Math.sin(markA) * (r + 48)})`} opacity={progress}>
					<circle r={7} fill={GOLD_LIGHT} filter={`url(#glow-${id})`} />
					<circle r={3} fill="#fff4d6" />
				</g>
			</g>
		</svg>
	);
};

// 宋体字幕：逐字模糊淡入，【】内为金色关键词
export const Subtitle: React.FC<{text: string; f: number; start: number; end: number; bottom?: number; size?: number; en?: string}> = ({text, f, start, end, bottom = 78, size = 62, en}) => {
	const parts: {ch: string; gold: boolean}[] = [];
	let gold = false;
	for (const ch of text) {
		if (ch === '【') { gold = true; continue; }
		if (ch === '】') { gold = false; continue; }
		parts.push({ch, gold});
	}
	const out = interpolate(f, [end - 12, end], [1, 0], clampOpt);
	const enOut = interpolate(f, [start + 26, start + 44], [0, 1], clampOpt) * out;
	return (
		<div style={{position: 'absolute', left: 0, right: 0, bottom, textAlign: 'center',
			color: IVORY, opacity: out, filter: 'drop-shadow(0 4px 18px rgba(0,0,0,0.85))'}}>
		<div style={{fontFamily: SERIF_ZH, fontWeight: 700, fontSize: size, letterSpacing: '0.06em'}}>
			{parts.map((p, i) => {
				const t = interpolate(f, [start + i * 1.3, start + i * 1.3 + 10], [0, 1], {...clampOpt, easing: ease});
				return (
					<span key={i} style={{display: 'inline-block', opacity: t, filter: `blur(${(1 - t) * 8}px)`, transform: `translateY(${(1 - t) * 14}px)`, ...(p.gold ? goldText : {})}}>
						{p.ch === ' ' ? ' ' : p.ch}
					</span>
				);
			})}
		</div>
		{en && (
			<div style={{marginTop: 14, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 14, opacity: enOut}}>
				<span style={{height: 1, width: 42, background: `${GOLD}88`, display: 'inline-block'}} />
				<span style={{fontFamily: SERIF_LA, fontStyle: 'italic', fontSize: size * 0.36, letterSpacing: '0.06em', color: '#c9b48a'}}>{en}</span>
				<span style={{height: 1, width: 42, background: `${GOLD}88`, display: 'inline-block'}} />
			</div>
		)}
		</div>
	);
};

const Bar: React.FC<{frac: number; fill: number}> = ({frac, fill}) => {
	const n = 12, on = Math.max(1, Math.round(frac * n));
	return (
		<div style={{display: 'flex', gap: 5, marginTop: 10}}>
			{Array.from({length: n}, (_, i) => {
				const lit = i < on && i < fill * on;
				return <div key={i} style={{width: 20, height: 6, borderRadius: 1, background: lit ? `linear-gradient(180deg, ${GOLD_LIGHT}, ${GOLD})` : 'rgba(255,240,210,0.09)', boxShadow: lit ? '0 0 8px rgba(217,165,74,0.55)' : 'none'}} />;
			})}
		</div>
	);
};

const fmt = (v: number) => v.toLocaleString('en-US');

export type HudRow = {badge: string; label: string; value: string; unit?: string; frac: number};

// 通用信息面板：左上编号+大标题，右上斜体副题+注释，右侧带徽章与进度条的数据行（0–3 行最佳）
export const InfoHUD: React.FC<{f: number; index: number; total: number; title: string; en: string; italic?: string; note?: string; rows?: HudRow[]}> = ({f, index, total, title, en, italic, note, rows = []}) => {
	const a = (s: number, e: number) => interpolate(f, [s, e], [0, 1], {...clampOpt, easing: ease});
	const head = a(8, 30), side = a(26, 48), bars = a(44, 84), line = a(14, 44);
	return (
		<>
			<div style={{position: 'absolute', left: 110, top: 86, opacity: head, transform: `translateY(${(1 - head) * 16}px)`}}>
				<div style={{fontFamily: SERIF_LA, fontSize: 20, letterSpacing: '0.45em', color: GOLD, opacity: 0.8}}>No. {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}</div>
				<div style={{fontFamily: SERIF_ZH, fontWeight: 700, fontSize: 96, lineHeight: 1.15, letterSpacing: '0.08em', ...goldText}}>{title}</div>
				<div style={{width: 280 * line, height: 1, background: `linear-gradient(90deg, ${GOLD}, transparent)`, margin: '10px 0 12px'}} />
				<div style={{fontFamily: SERIF_LA, fontSize: 22, letterSpacing: '0.42em', color: '#bba383'}}>{en}</div>
			</div>
			<div style={{position: 'absolute', right: 110, top: 96, textAlign: 'right', opacity: head}}>
				{italic && <div style={{fontFamily: DIDOT, fontStyle: 'italic', fontSize: 34, color: GOLD_LIGHT, opacity: 0.85}}>{italic}</div>}
				{note && <div style={{fontFamily: SERIF_ZH, fontSize: 20, letterSpacing: '0.2em', color: '#a8957a', marginTop: 6}}>{note}</div>}
			</div>
			<div style={{position: 'absolute', left: 1440, top: 330, opacity: side, transform: `translateX(${(1 - side) * 30}px)`}}>
				{rows.map((r, i) => (
					<div key={i} style={{display: 'flex', alignItems: 'center', gap: 20, marginBottom: 34}}>
						<div style={{width: 46, height: 46, borderRadius: 23, border: `1.5px solid ${GOLD}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
							fontFamily: SERIF_ZH, fontWeight: 700, fontSize: 22, color: GOLD_LIGHT, boxShadow: '0 0 14px rgba(217,165,74,0.35) inset'}}>{r.badge}</div>
						<div>
							<div style={{fontFamily: SERIF_ZH, fontSize: 18, letterSpacing: '0.3em', color: '#a8957a'}}>{r.label}</div>
							<div style={{fontFamily: DIDOT, fontSize: 44, color: IVORY, lineHeight: 1.1}}>
								{r.value}<span style={{fontSize: 20, marginLeft: 8, color: '#bba383', fontFamily: SERIF_ZH}}>{r.unit}</span>
							</div>
							<Bar frac={Math.min(1, Math.max(0, r.frac))} fill={bars} />
						</div>
					</div>
				))}
			</div>
		</>
	);
};

// 示例：行星数据 → 通用面板
export const PlanetHUD: React.FC<{p: Planet; index: number; f: number}> = ({p, index, f}) => (
	<InfoHUD f={f} index={index} total={PLANETS.length} title={p.zh} en={p.en} italic={p.la.charAt(0) + p.la.slice(1).toLowerCase()} note={p.myth} rows={[
		{badge: '径', label: '直径', value: fmt(p.diameter), unit: 'km', frac: Math.sqrt(p.diameter / 139820)},
		{badge: '周', label: '公转', value: p.periodText.split(' ')[0], unit: p.periodText.split(' ')[1], frac: Math.log(p.period / 60) / Math.log(60190 / 60)},
		{badge: '距', label: '距太阳', value: p.dist.toFixed(2), unit: 'AU', frac: Math.log(p.dist / 0.3) / Math.log(30.1 / 0.3)},
	]} />
);

// 标题卡：放射光线 + 金色大标题 + 弧线与光点
export const TitleCard: React.FC<{f: number; dur: number; title: string; latin: string; subtitle: string; motto?: string}> = ({f, title, latin, subtitle, motto}) => {
	const a = (s: number, e: number) => interpolate(f, [s, e], [0, 1], {...clampOpt, easing: ease});
	const curve = a(26, 64), sub = a(46, 72);
	const pathLen = 760;
	const dotT = Math.min(1, curve);
	const qx = (t: number) => (1 - t) ** 2 * 580 + 2 * (1 - t) * t * 960 + t * t * 1340;
	const qy = (t: number) => (1 - t) ** 2 * 600 + 2 * (1 - t) * t * 500 + t * t * 600;
	const shimmer = interpolate(f, [30, 90], [-60, 160], clampOpt);
	return (
		<>
			<svg width="1920" height="1080" style={{position: 'absolute', inset: 0, opacity: a(0, 40) * 0.9}}>
				<defs>
					<radialGradient id="rayMask"><stop offset="0" stopColor="#fff" stopOpacity="0.9" /><stop offset="0.7" stopColor="#fff" stopOpacity="0" /></radialGradient>
					<mask id="rm"><rect width="1920" height="1080" fill="url(#rayMask)" /></mask>
				</defs>
				<g mask="url(#rm)" transform={`rotate(${f * 0.04} 960 400)`}>
					{Array.from({length: 120}, (_, i) => {
						const ang = (i / 120) * Math.PI * 2, len = i % 3 === 0 ? 1100 : 700;
						return <line key={i} x1={960} y1={400} x2={960 + Math.cos(ang) * len} y2={400 + Math.sin(ang) * len} stroke={GOLD} strokeOpacity={i % 3 === 0 ? 0.09 : 0.045} strokeWidth={1} />;
					})}
				</g>
			</svg>
			<div style={{position: 'absolute', top: 270, left: 0, right: 0, textAlign: 'center', fontFamily: SERIF_LA, fontSize: 24, letterSpacing: '0.75em', color: GOLD, opacity: a(4, 30) * 0.85}}>
				{latin}
			</div>
			<div style={{position: 'absolute', top: 318, left: 0, right: 0, textAlign: 'center', fontFamily: SERIF_ZH, fontWeight: 700, fontSize: 168, letterSpacing: '0.16em',
				filter: 'drop-shadow(0 6px 30px rgba(0,0,0,0.8)) drop-shadow(0 0 22px rgba(217,165,74,0.25))'}}>
				{[...title].map((ch, i) => {
					const t = a(8 + i * 4, 30 + i * 4);
					return (
						<span key={i} style={{display: 'inline-block', opacity: t, filter: `blur(${(1 - t) * 14}px)`, transform: `translateY(${(1 - t) * 20}px) scale(${1.08 - 0.08 * t})`,
							backgroundImage: `linear-gradient(105deg, transparent ${shimmer - 30}%, rgba(255,250,230,0.9) ${shimmer}%, transparent ${shimmer + 30}%), linear-gradient(180deg, #fff1c8 0%, ${GOLD_LIGHT} 30%, ${GOLD} 62%, #9c6a24 100%)`,
							WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent'}}>{ch}</span>
					);
				})}
			</div>
			<svg width="1920" height="1080" style={{position: 'absolute', inset: 0}}>
				<defs>
					<linearGradient id="cg" x1="0" x2="1"><stop offset="0" stopColor={GOLD} stopOpacity="0" /><stop offset="0.5" stopColor={GOLD_LIGHT} /><stop offset="1" stopColor={GOLD} stopOpacity="0" /></linearGradient>
					<filter id="dg"><feGaussianBlur stdDeviation="4" /></filter>
				</defs>
				<path d="M 580 600 Q 960 500 1340 600" fill="none" stroke="url(#cg)" strokeWidth={2} strokeDasharray={pathLen} strokeDashoffset={pathLen * (1 - curve)} />
				<line x1={760} y1={612} x2={1160} y2={612} stroke={GOLD} strokeOpacity={0.25 * curve} />
				{curve > 0.02 && (
					<g opacity={curve}>
						<circle cx={qx(dotT)} cy={qy(dotT)} r={9} fill={GOLD_LIGHT} filter="url(#dg)" />
						<circle cx={qx(dotT)} cy={qy(dotT)} r={3.5} fill="#fff6dc" />
					</g>
				)}
			</svg>
			<div style={{position: 'absolute', top: 646, left: 0, right: 0, textAlign: 'center', fontFamily: SERIF_ZH, fontSize: 32, letterSpacing: '0.55em', color: '#d8cab2', opacity: sub}}>
				{subtitle}
			</div>
			{motto && <div style={{position: 'absolute', top: 712, left: 0, right: 0, textAlign: 'center', fontFamily: SERIF_LA, fontSize: 18, letterSpacing: '0.5em', color: GOLD, opacity: sub * 0.7}}>
				— {motto} —
			</div>}
		</>
	);
};
