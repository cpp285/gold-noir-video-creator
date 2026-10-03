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
	const segmentStart = timing.hook + timing.title;
	const closingStart = segmentStart + count * timing.segment;
	return {
		...timing,
		segmentStarts: Array.from({length: count}, (_, i) => segmentStart + i * timing.segment),
		closingStart,
		totalFrames: closingStart + timing.closing,
	};
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
