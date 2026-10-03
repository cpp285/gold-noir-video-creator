import assert from 'node:assert/strict';
import {test} from 'node:test';
import {PLANETS, TIMELINE} from '../src/cinematic/data.ts';
import {createOverviewLayout, createTimeline} from '../src/cinematic/timeline.ts';
import {scoreEvents, synthesizeScore} from '../scripts/bgm.mjs';

test('the supplied example remains a 60-second composition', () => {
  const example = createTimeline(8, {fps: 30, hook: 120, title: 120, segment: 168, closing: 216});
  assert.equal(example.totalFrames / example.fps, 60);
  assert.equal(TIMELINE.segmentStarts.length, PLANETS.length);
  assert.equal(new Set(PLANETS.map((p) => p.id)).size, PLANETS.length);
});

test('a ninth segment extends the video and receives its own musical cue', () => {
  const timeline = createTimeline(9, {fps: 30, hook: 120, title: 120, segment: 168, closing: 216});
  assert.equal(timeline.totalFrames, 1968);
  assert.equal(timeline.closingStart / timeline.fps, 58.4);
  const bells = scoreEvents(timeline).filter((e) => e.kind === 'bell');
  assert.equal(bells.length, 15);
  assert.ok(bells.some((e) => Math.abs(e.at - 52.95) < 1e-9));
  assert.ok(bells.every((e) => e.at >= 0 && e.at < 65.6 && Number.isFinite(e.note)));
});

test('overview coordinates remain finite for one, three, and nine items', () => {
  for (const count of [1, 3, 9]) {
    const items = Array.from({length: count}, (_, i) => ({...PLANETS[i % PLANETS.length], id: `item-${i}`}));
    const layout = createOverviewLayout(items);
    assert.equal(layout.length, count);
    for (const item of layout) {
      assert.ok(Number.isFinite(item.orbit) && Number.isFinite(item.radius));
      assert.ok(item.orbit >= 2.1 && item.orbit <= 10.6);
      assert.ok(item.radius > 0);
    }
    assert.equal(new Set(layout.map((p) => p.orbit)).size, count);
  }
});

test('generated WAV follows edited timing, is deterministic and fades to silence', () => {
  const timing = {fps: 24, hook: 6, title: 6, segment: 12, closing: 12};
  const small = createTimeline(1, timing);
  const large = createTimeline(3, timing);
  const shortAudio = synthesizeScore(small);
  const audio = synthesizeScore(large);
  assert.equal(audio.toString('ascii', 0, 4), 'RIFF');
  assert.equal(audio.toString('ascii', 8, 12), 'WAVE');
  assert.equal(audio.readUInt32LE(24), 44100);
  assert.equal(audio.readUInt32LE(40) / 2 / 44100, 2.5);
  assert.equal(shortAudio.readUInt32LE(40) / 2 / 44100, 1.5);
  assert.equal(audio.length, 44 + audio.readUInt32LE(40));
  assert.deepEqual(audio, synthesizeScore(large));
  assert.equal(audio.readInt16LE(44), 0);
  assert.equal(audio.readInt16LE(audio.length - 2), 0);
  let peak = 0;
  for (let offset = 44; offset < audio.length; offset += 2) peak = Math.max(peak, Math.abs(audio.readInt16LE(offset)));
  assert.ok(peak > 1000 && peak < 32767);
});

test('empty content and invalid timing are rejected before rendering', () => {
  assert.throws(() => createTimeline(0, {fps: 30, hook: 120, title: 120, segment: 168, closing: 216}), /count/);
  assert.throws(() => createTimeline(1, {fps: 0, hook: 120, title: 120, segment: 168, closing: 216}), /fps/);
  assert.throws(() => createTimeline(1, {fps: 30, hook: 120, title: 120, segment: -1, closing: 216}), /segment/);
});
