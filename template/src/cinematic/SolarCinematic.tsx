import React from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame, interpolate, Easing, Audio, staticFile} from 'remotion';
import {PLANETS, FPS, TIMELINE, VOICED, GOLD, SERIF_ZH, SERIF_LA, type Planet} from './data';
import type {Cue} from './timeline';
import {Stage, Rig, Lights, PlanetBody, Sun, OrbitLine, project, type Vec3} from './Space3D';
import {Background, Vignette, Grain, Fade, Dust, LatinBG, Dial, Subtitle, PlanetHUD, TitleCard, goldText} from './Overlay';

import {createOverviewLayout, speechWindows, musicVolume} from './timeline';

const clampOpt = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = Easing.bezier(0.33, 0, 0.2, 1);

// 配音模式：旁白音频与字幕挂在同一帧；字幕在该句说完后稍停再淡出
const Voice: React.FC<{cues: Cue[]; f: number; len: number}> = ({cues, f, len}) => (
	<>
		{cues.map((c, i) => (
			<React.Fragment key={c.id}>
				<Sequence from={c.from} durationInFrames={c.dur + 6} layout="none">
					<Audio src={staticFile(`vo/${c.id}.mp3`)} />
				</Sequence>
				<Subtitle text={c.text} f={f} start={c.from} end={Math.min(c.from + c.dur + 14, i < cues.length - 1 ? cues[i + 1].from - 2 : len - 6)} />
			</React.Fragment>
		))}
	</>
);

// 封面：第 0 帧就是完整画面（标题已显现、主体已点亮），不从黑场淡入。
// 播放前的预览图和平台封面都取首帧，黑首帧会让观众看不出视频内容。
const CoverScene: React.FC<{len: number}> = ({len}) => {
	const frame = useCurrentFrame();
	const pos: Vec3 = [0, 0, 8.8], target: Vec3 = [0, 0, 0], sunAt: Vec3 = [2.15, 0.45, 0];
	const scr = project(pos, target, sunAt);
	return (
		<AbsoluteFill>
			<Background glowY={40} />
			<LatinBG text="SYSTEMA SOLARE" frame={frame + 200} top={150} />
			<Stage>
				<Rig pos={pos} target={target} />
				<group position={sunAt}><Sun t={frame / FPS + 3} scale={1} /></group>
			</Stage>
			<Dial id="cover" cx={scr.x} cy={scr.y} r={scr.k + 36} progress={1} rot={frame * 0.15 + 40} ring="SOL · STELLA · 一颗恒星 · 4.6 BILLION YEARS · " />
			<div style={{position: 'absolute', inset: 0, transform: 'translateX(-390px)'}}>
				<TitleCard f={frame + 96} dur={len} title="太阳系漫游" latin="SYSTEMA · SOLARE" subtitle="从太阳出发，一颗一颗看过去" motto={`${PLANETS.length} PLANETAE · I DOMUS`} />
			</div>
			<Dust frame={frame + 200} seed="cover" count={90} />
			{VOICED
				? <Voice cues={TIMELINE.cues.cover} f={frame} len={len} />
				: <Subtitle text="我们住的地方，到底有【多大】？" f={frame} start={16} end={len - 10} />}
			<AbsoluteFill style={{background: '#050302', opacity: interpolate(frame, [len - 12, len], [0, 1], clampOpt), pointerEvents: 'none'}} />
		</AbsoluteFill>
	);
};

const PlanetScene: React.FC<{p: Planet; index: number; len: number}> = ({p, index, len}) => {
	const frame = useCurrentFrame();
	const f = frame * 168 / len;
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
			{VOICED ? <Voice cues={TIMELINE.cues[p.id]} f={frame} len={len} /> : <Subtitle text={p.line} f={f} start={24} end={160} />}
			<Fade f={f} dur={168} />
		</AbsoluteFill>
	);
};

// 收尾：拉远看到整个太阳系
const OVERVIEW = createOverviewLayout(PLANETS);
const ClosingScene: React.FC<{len: number}> = ({len}) => {
	const frame = useCurrentFrame();
	const f = frame * 216 / len;
	// 配音模式下，片名卡等最后一句旁白说完再出现
	const cues = TIMELINE.cues.closing ?? [];
	const last = cues[cues.length - 1];
	const endF = VOICED && last ? (last.from + last.dur + 6) * 216 / len : 160;
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
	const labels = interpolate(f, [30, 60], [0, 1], clampOpt) * interpolate(f, [endF - 10, endF + 10], [1, 0], clampOpt);
	const endCard = interpolate(f, [endF, endF + 26], [0, 1], {...clampOpt, easing: ease});
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
			{VOICED ? <Voice cues={cues} f={frame} len={len} /> : <Subtitle text="太阳系诞生于约【46 亿年前】。" f={f} start={22} end={160} />}
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

// 有旁白时配乐在说话处自动压低（闪避），句间回升；无旁白时满音量
const SPEECH = VOICED ? speechWindows(TIMELINE, PLANETS.map((p) => p.id)) : [];

export const SolarCinematic: React.FC = () => {
	const frame = useCurrentFrame();
	return (
		<AbsoluteFill style={{background: '#050302'}}>
			<Audio src={staticFile('bgm.wav')} volume={(fr) => musicVolume(fr, SPEECH)} />
			<Sequence durationInFrames={TIMELINE.hook + TIMELINE.title}><CoverScene len={TIMELINE.hook + TIMELINE.title} /></Sequence>
			{PLANETS.map((p, i) => (
				<Sequence key={p.id} from={TIMELINE.segmentStarts[i]} durationInFrames={TIMELINE.segmentLengths[i]}><PlanetScene p={p} index={i} len={TIMELINE.segmentLengths[i]} /></Sequence>
			))}
			<Sequence from={TIMELINE.closingStart} durationInFrames={TIMELINE.closing}><ClosingScene len={TIMELINE.closing} /></Sequence>
			<Vignette />
			<Grain frame={frame} />
		</AbsoluteFill>
	);
};
