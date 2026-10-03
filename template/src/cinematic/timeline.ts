export type Timing = {
	fps: number;
	hook: number;
	title: number;
	segment: number;
	closing: number;
};

// Frame boundaries shared by the composition and the synthesized soundtrack.
export function createTimeline(count: number, timing: Timing) {
	for (const [name, value] of Object.entries({count, ...timing})) {
		if (!Number.isSafeInteger(value) || value <= 0) {
			throw new Error(`${name} must be a positive integer`);
		}
	}
	return layoutTimeline(timing, Array.from({length: count}, () => timing.segment));
}

export type Timeline = ReturnType<typeof layoutTimeline>;

function layoutTimeline(timing: Timing, segmentLengths: number[]) {
	const segmentStart = timing.hook + timing.title;
	const segmentStarts = segmentLengths.map((_, i) => segmentStart + segmentLengths.slice(0, i).reduce((a, b) => a + b, 0));
	const closingStart = segmentStart + segmentLengths.reduce((a, b) => a + b, 0);
	return {
		...timing,
		segmentStarts,
		segmentLengths,
		closingStart,
		totalFrames: closingStart + timing.closing,
	};
}

// 配音模式：由 scripts/tts.py 按每句旁白的实测时长生成。
// 场景顺序固定为 cover（封面，占用 hook + title）→ 各段落（与内容数组同序）→ closing。
export type Cue = {id: string; from: number; dur: number; text: string};
export type VoiceScene = {id: string; len: number; cues: Cue[]};
export type VoiceData = {fps: number; voice: string; rate: string; scenes: VoiceScene[]};

export function createVoicedTimeline(ids: readonly string[], voice: VoiceData, fps: number) {
	if (voice.fps !== fps) throw new Error(`voice.ts was generated at ${voice.fps}fps but the composition uses ${fps}fps; run npm run voice again`);
	const expected = ['cover', ...ids, 'closing'];
	const got = voice.scenes.map((s) => s.id);
	if (got.join('|') !== expected.join('|')) {
		throw new Error(`narration scenes must be [${expected.join(', ')}] but voice.ts has [${got.join(', ')}]; edit narration.json and run npm run voice`);
	}
	for (const s of voice.scenes) {
		if (!Number.isSafeInteger(s.len) || s.len <= 0) throw new Error(`scene ${s.id} must have a positive integer length`);
		for (const c of s.cues) if (c.from < 0 || c.from + c.dur > s.len) throw new Error(`cue ${c.id} does not fit inside scene ${s.id}`);
	}
	const scenes = voice.scenes;
	const timing = {fps, hook: scenes[0].len, title: 0, segment: scenes[1]?.len ?? 0, closing: scenes[scenes.length - 1].len};
	return {...layoutTimeline(timing, scenes.slice(1, -1).map((s) => s.len)), cues: Object.fromEntries(scenes.map((s) => [s.id, s.cues])) as Record<string, Cue[]>};
}

// 旁白在整片中的说话区间（绝对帧）。cover 从 0 开始，各段落从 segmentStarts 开始，closing 从 closingStart 开始。
export function speechWindows(t: {segmentStarts: number[]; closingStart: number; cues: Record<string, Cue[]>}, ids: readonly string[]) {
	const starts: [string, number][] = [['cover', 0], ...ids.map((id, i): [string, number] => [id, t.segmentStarts[i]]), ['closing', t.closingStart]];
	return starts.flatMap(([id, s]) => (t.cues[id] ?? []).map((c): [number, number] => [s + c.from, s + c.from + c.dur]));
}

// 配乐闪避：说话时压到 under，句间回到 between，进出各 ramp 帧渐变。没有旁白时返回 1。
export function musicVolume(frame: number, windows: readonly (readonly [number, number])[], {between = 0.6, under = 0.32, ramp = 8} = {}) {
	if (windows.length === 0) return 1;
	let talk = 0;
	for (const [a, b] of windows) {
		const v = Math.min((frame - (a - ramp)) / ramp, (b + ramp - frame) / ramp);
		talk = Math.max(talk, Math.min(1, Math.max(0, v)));
	}
	return under * talk + between * (1 - talk);
}

// Keep every item inside the overview camera's existing framing, even after
// inserting or removing items. Dense overviews still need a visual layout check.
export function createOverviewLayout(items: readonly {diameter: number; texture: string}[]) {
	const largest = Math.max(1, ...items.map((p) => p.diameter));
	return items.map((p, i) => ({
		orbit: 2.1 + (8.5 * i) / Math.max(1, items.length - 1),
		radius: (0.13 + 0.42 * Math.sqrt(Math.max(0, p.diameter) / largest)) * (p.texture === 'saturn' ? 0.7 : 1),
	}));
}
