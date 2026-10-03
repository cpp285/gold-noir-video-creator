import React from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame, interpolate, Easing, Audio, staticFile} from 'remotion';
import {PLANETS, HOOK, TITLE, SEG, CLOSE, FPS, TIMELINE, GOLD, SERIF_ZH, SERIF_LA, type Planet} from './data';
import {Stage, Rig, Lights, PlanetBody, Sun, OrbitLine, project, type Vec3} from './Space3D';
import {Background, Vignette, Grain, Fade, Dust, LatinBG, Dial, Subtitle, PlanetHUD, TitleCard, goldText} from './Overlay';

import {createOverviewLayout} from './timeline';

const clampOpt = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = Easing.bezier(0.33, 0, 0.2, 1);

// 0–4s：黑暗中亮起一颗恒星，抛出问题
const HookScene: React.FC = () => {
	const frame = useCurrentFrame();
	const f = frame * 120 / HOOK;
	const d = interpolate(f, [0, 120], [10.5, 8.8], {easing: ease});
	const pos: Vec3 = [0, -0.35, d], target: Vec3 = [0, -0.35, 0];
	const grow = interpolate(f, [0, 45], [0.4, 1], {...clampOpt, easing: Easing.out(Easing.cubic)});
	const scr = project(pos, target, [0, 0, 0]);
	return (
		<AbsoluteFill>
			<Background glowY={42} />
			<LatinBG text="SOL" frame={f} />
			<Stage>
				<Rig pos={pos} target={target} />
				<Sun t={frame / FPS} scale={0.62 * grow} glow={grow} />
			</Stage>
			<Dial id="hook" cx={scr.x} cy={scr.y} r={0.62 * scr.k + 40} progress={interpolate(f, [10, 60], [0, 1], {...clampOpt, easing: ease})} rot={f * 0.15} ring="SOL · STELLA · 一颗恒星 · 4.6 BILLION YEARS · " />
			<Dust frame={f} seed="hook" />
			<Subtitle text="我们住的地方，到底有【多大】？" f={f} start={20} end={116} />
			<Fade f={f} dur={120} inF={24} outF={14} />
		</AbsoluteFill>
	);
};

const TitleScene: React.FC = () => {
	const f = useCurrentFrame() * 120 / TITLE;
	return (
		<AbsoluteFill>
			<Background glowY={38} />
			<TitleCard f={f} dur={120} title="太阳系漫游" latin="SYSTEMA · SOLARE" subtitle="从太阳出发，一颗一颗看过去" motto={`${PLANETS.length} PLANETAE · I DOMUS`} />
			<Dust frame={f + 200} seed="title" count={90} />
			<Fade f={f} dur={120} inF={10} outF={16} />
		</AbsoluteFill>
	);
};

const PlanetScene: React.FC<{p: Planet; index: number}> = ({p, index}) => {
	const frame = useCurrentFrame();
	const f = frame * 168 / SEG;
	const d = interpolate(f, [0, 168], [9.6, 8.3]);
	const orbitA = interpolate(f, [0, 168], [0.24, -0.08]);
	const elev = p.texture === 'saturn' ? 0.3 : 0.08;
	const ty = -0.28;
	const pos: Vec3 = [Math.sin(orbitA) * Math.cos(elev) * d, ty + Math.sin(elev) * d, Math.cos(orbitA) * Math.cos(elev) * d];
	const target: Vec3 = [0, ty, 0];
	const scr = project(pos, target, [0, 0, 0]);
	const extent = p.texture === 'saturn' ? 2.27 * p.R * 0.92 : p.R;
	const ring = `${p.la} · ${p.en} · ${p.diameter.toLocaleString('en-US')} KM · ${p.dist.toFixed(2)} AU · `;
	return (
		<AbsoluteFill>
			<Background />
			<LatinBG text={p.la} frame={f} />
			<Stage>
				<Rig pos={pos} target={target} />
				<Lights />
				<PlanetBody p={p} t={frame / FPS} phase={index * 1.7} />
			</Stage>
			<Dial id={p.id} cx={scr.x} cy={scr.y} r={extent * scr.k + 30} progress={interpolate(f, [6, 46], [0, 1], {...clampOpt, easing: ease})} rot={f * 0.12 - 20} ring={ring + ring} />
			<PlanetHUD p={p} index={index} f={f} />
			<Dust frame={f + index * 300} seed={p.id} count={55} />
			<Subtitle text={p.line} f={f} start={24} end={160} />
			<Fade f={f} dur={168} />
		</AbsoluteFill>
	);
};

// 收尾：拉远看到整个太阳系
const OVERVIEW = createOverviewLayout(PLANETS);
const ClosingScene: React.FC = () => {
	const frame = useCurrentFrame();
	const f = frame * 216 / CLOSE;
	const t = frame / FPS;
	const d = interpolate(f, [0, 216], [22, 32], {easing: ease});
	const elev = interpolate(f, [0, 216], [0.32, 0.5]);
	const az = interpolate(f, [0, 216], [0.5, 0.1]);
	const pos: Vec3 = [Math.sin(az) * Math.cos(elev) * d, Math.sin(elev) * d, Math.cos(az) * Math.cos(elev) * d];
	const target: Vec3 = [0, -1.5, 0];
	const planetPos = PLANETS.map((_, i): Vec3 => {
		const phase = i === 0 ? -0.2 : i * 2.1 + 0.6;
		const a = phase + t * (0.4 / Math.pow(OVERVIEW[i].orbit, 1.5));
		return [Math.cos(a) * OVERVIEW[i].orbit, 0, -Math.sin(a) * OVERVIEW[i].orbit];
	});
	const labels = interpolate(f, [30, 60], [0, 1], clampOpt) * interpolate(f, [150, 170], [1, 0], clampOpt);
	const endCard = interpolate(f, [160, 186], [0, 1], {...clampOpt, easing: ease});
	return (
		<AbsoluteFill>
			<Background glowY={50} />
			<LatinBG text="SYSTEMA SOLARE" frame={f} top={120} />
			<Stage>
				<Rig pos={pos} target={target} />
				<Lights key1={0.6} rim={0.5} />
				<pointLight position={[0, 0, 0]} intensity={60} decay={1.2} color="#fff0d0" />
				<Sun t={t} scale={0.85} />
				{OVERVIEW.map((item, i) => <OrbitLine key={i} r={item.orbit} opacity={0.32} />)}
				{PLANETS.map((p, i) => (
					<group key={p.id} position={planetPos[i]}>
						<PlanetBody p={{...p, R: OVERVIEW[i].radius}} t={t} phase={i} texSize={256} detail={48} simple />
					</group>
				))}
			</Stage>
			<svg width="1920" height="1080" style={{position: 'absolute', inset: 0, opacity: labels}}>
				{PLANETS.map((p, i) => {
					const s = project(pos, target, planetPos[i]);
					const off = OVERVIEW[i].radius * s.k + 16;
					return (
						<g key={p.id}>
							<line x1={s.x} y1={s.y + off} x2={s.x} y2={s.y + off + 22} stroke={GOLD} strokeOpacity={0.6} />
							<text x={s.x} y={s.y + off + 46} textAnchor="middle" fontFamily={SERIF_ZH} fontSize={22} fill="#e9dcc4" letterSpacing="0.15em">{p.zh}</text>
						</g>
					);
				})}
			</svg>
			<Dust frame={f + 3000} seed="close" count={60} />
			<Subtitle text="太阳系诞生于约【46 亿年前】。" f={f} start={22} end={160} />
			<AbsoluteFill style={{background: 'rgba(6,4,2,0.72)', opacity: endCard}} />
			<div style={{position: 'absolute', top: 420, left: 0, right: 0, textAlign: 'center', opacity: endCard}}>
				<div style={{fontFamily: SERIF_LA, fontSize: 20, letterSpacing: '0.7em', color: GOLD, opacity: 0.8}}>SYSTEMA · SOLARE</div>
				<div style={{fontFamily: SERIF_ZH, fontWeight: 700, fontSize: 104, letterSpacing: '0.16em', marginTop: 14, ...goldText}}>太阳系漫游</div>
				<div style={{width: 360, height: 1, margin: '24px auto', background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)`}} />
				<div style={{fontFamily: SERIF_ZH, fontSize: 26, letterSpacing: '0.6em', color: '#cbbba0'}}>— 完 —</div>
			</div>
			<Fade f={f} dur={216} inF={14} outF={18} />
		</AbsoluteFill>
	);
};

export const SolarCinematic: React.FC = () => {
	const frame = useCurrentFrame();
	return (
		<AbsoluteFill style={{background: '#050302'}}>
			<Audio src={staticFile('bgm.wav')} />
			<Sequence durationInFrames={HOOK}><HookScene /></Sequence>
			<Sequence from={HOOK} durationInFrames={TITLE}><TitleScene /></Sequence>
			{PLANETS.map((p, i) => (
				<Sequence key={p.id} from={TIMELINE.segmentStarts[i]} durationInFrames={SEG}><PlanetScene p={p} index={i} /></Sequence>
			))}
			<Sequence from={TIMELINE.closingStart} durationInFrames={CLOSE}><ClosingScene /></Sequence>
			<Vignette />
			<Grain frame={frame} />
		</AbsoluteFill>
	);
};
