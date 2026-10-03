// 程序合成氛围配乐：与视频共用时间线，无需另行维护秒数和段落数量。
import {mkdirSync, writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {TIMELINE} from '../src/cinematic/data.ts';

const SR = 44100;
const TAU = Math.PI * 2;
const midi = (m) => 440 * 2 ** ((m - 69) / 12);
const chords = [[45, 52, 57, 60, 64], [41, 48, 53, 57, 60], [48, 55, 60, 64, 67], [43, 50, 55, 59, 62], [45, 52, 57, 60, 64]];
const notes = [76, 74, 72, 79, 69, 76, 74, 72];

export function scoreEvents(timeline) {
  const sec = (frame) => frame / timeline.fps;
  const title = sec(timeline.hook);
  const close = sec(timeline.closingStart);
  const segmentSeconds = sec(timeline.segment);
  return [
    {kind: 'bell', at: sec(timeline.hook) * 0.15, note: 69, amp: 0.12},
    {kind: 'bell', at: title, note: 57, amp: 0.16},
    {kind: 'bell', at: title, note: 64, amp: 0.08},
    {kind: 'whoosh', at: title - 0.6, length: 1.4, amp: 0.6},
    ...timeline.segmentStarts.flatMap((frame, i) => [
      {kind: 'bell', at: sec(frame) + Math.min(0.15, segmentSeconds / 4), note: notes[i % notes.length], amp: 0.08},
      {kind: 'whoosh', at: sec(frame) - 0.5, length: 1, amp: 0.35},
    ]),
    {kind: 'bell', at: close, note: 57, amp: 0.14},
    {kind: 'bell', at: close, note: 64, amp: 0.07},
    {kind: 'bell', at: close + sec(timeline.closing) * 0.75, note: 69, amp: 0.06},
  ];
}

export function synthesizeScore(timeline = TIMELINE) {
  const duration = timeline.totalFrames / timeline.fps;
  const count = Math.round(SR * duration);
  const samples = new Float32Array(count);
  const chordLength = duration / chords.length;
  const crossfade = Math.min(2, chordLength / 2);
  const voice = (chord, t) => chord.reduce((sum, m, j) => {
    const f = midi(m);
    return sum + Math.sin(TAU * f * t + j) * (0.6 + 0.4 * Math.sin(TAU * (0.05 + j * 0.013) * t + j)) + 0.35 * Math.sin(TAU * f * 1.003 * t);
  }, 0);
  for (let i = 0; i < count; i++) {
    const t = i / SR;
    const k = Math.min(chords.length - 1, Math.floor(t / chordLength));
    const mix = Math.min(1, (t - k * chordLength) / crossfade);
    samples[i] = voice(chords[k], t) * mix * 0.05;
    if (k > 0) samples[i] += voice(chords[k - 1], t) * (1 - mix) * 0.05;
    samples[i] += Math.sin(TAU * midi(81) * t) * 0.006 * (0.5 + 0.5 * Math.sin(TAU * 0.2 * t));
  }

  for (const event of scoreEvents(timeline)) {
    const start = Math.floor(event.at * SR);
    const length = event.kind === 'bell' ? 4 : event.length;
    let y = 0, seed = 7;
    for (let i = 0; i < length * SR; i++) {
      const k = start + i;
      if (k >= count) break;
      const t = i / SR;
      if (event.kind === 'bell') {
        if (k < 0) continue;
        const f = midi(event.note);
        samples[k] += event.amp * Math.min(1, t * 400) * (
          Math.sin(TAU * f * t) * Math.exp(-t * 1.2) +
          0.5 * Math.sin(TAU * f * 2.01 * t) * Math.exp(-t * 2) +
          0.25 * Math.sin(TAU * f * 2.76 * t) * Math.exp(-t * 3) +
          0.12 * Math.sin(TAU * f * 5.4 * t) * Math.exp(-t * 5)
        );
      } else {
        seed = (seed * 16807) % 2147483647;
        y += 0.04 * ((seed / 2147483647) * 2 - 1 - y);
        if (k >= 0) samples[k] += event.amp * y * Math.sin(Math.PI * i / (length * SR));
      }
    }
  }

  // Fade the whole mix, including the last bell, to prevent a cut-off ending.
  const fade = Math.min(3, duration / 4);
  let peak = 0;
  for (let i = 0; i < count; i++) {
    samples[i] *= Math.min(1, i / SR / fade, (count - 1 - i) / SR / fade);
    peak = Math.max(peak, Math.abs(samples[i]));
  }
  const out = Buffer.alloc(44 + count * 2);
  out.write('RIFF', 0); out.writeUInt32LE(36 + count * 2, 4); out.write('WAVE', 8);
  out.write('fmt ', 12); out.writeUInt32LE(16, 16); out.writeUInt16LE(1, 20); out.writeUInt16LE(1, 22);
  out.writeUInt32LE(SR, 24); out.writeUInt32LE(SR * 2, 28); out.writeUInt16LE(2, 32); out.writeUInt16LE(16, 34);
  out.write('data', 36); out.writeUInt32LE(count * 2, 40);
  for (let i = 0; i < count; i++) {
    out.writeInt16LE(Math.round(Math.tanh(samples[i] / (peak || 1) * 1.2) * 0.85 * 32767), 44 + i * 2);
  }
  return out;
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  mkdirSync(new URL('../public/', import.meta.url), {recursive: true});
  writeFileSync(new URL('../public/bgm.wav', import.meta.url), synthesizeScore());
  console.log(`bgm.wav: ${TIMELINE.totalFrames / TIMELINE.fps}s, ${TIMELINE.segmentStarts.length} segments`);
}
