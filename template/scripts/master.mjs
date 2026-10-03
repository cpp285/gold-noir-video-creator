// 交付前的母带处理：响度标准化（默认 -16 LUFS），可选整体变速。
// npm run master                         → out/video-master.mp4，画面流直接复制
// npm run master -- --speed=1.25         → 整体提速 1.25 倍：画面补帧回原帧率，声音保持音调
// npm run master -- --lufs=-14 --in=out/video.mp4 --out=out/final.mp4
// 需要 ffmpeg / ffprobe。
import {execFileSync, spawnSync} from 'node:child_process';

const arg = (name, def) => {
	const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
	return hit ? hit.split('=').slice(1).join('=') : def;
};
const input = arg('in', 'out/video.mp4');
const output = arg('out', 'out/video-master.mp4');
const lufs = Number(arg('lufs', '-16'));
const speed = Number(arg('speed', '1'));
if (!Number.isFinite(lufs) || lufs > -5 || lufs < -40) throw new Error('--lufs 应在 -40 到 -5 之间');
if (!Number.isFinite(speed) || speed < 0.5 || speed > 2) throw new Error('--speed 应在 0.5 到 2 之间');

const fps = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=r_frame_rate', '-of', 'default=nw=1:nk=1', input]).toString().trim();
const loud = `loudnorm=I=${lufs}:TP=-1.5:LRA=11`;
const args = ['-v', 'error', '-y', '-i', input];
if (speed === 1) {
	args.push('-c:v', 'copy', '-af', loud);
} else {
	// framerate 用相邻帧混合补回原帧率，比直接丢帧顺滑；atempo 变速不变调
	args.push('-filter_complex', `[0:v]setpts=PTS/${speed},framerate=fps=${fps}[v];[0:a]atempo=${speed},${loud}[a]`, '-map', '[v]', '-map', '[a]',
		'-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p');
}
args.push('-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-movflags', '+faststart', output);
execFileSync('ffmpeg', args, {stdio: 'inherit'});

const report = spawnSync('ffmpeg', ['-hide_banner', '-i', output, '-af', 'ebur128=peak=true', '-f', 'null', '-'], {encoding: 'utf8'}).stderr;
const integrated = report.match(/Integrated loudness:\s*\n\s*I:\s*(-?[\d.]+) LUFS/);
const duration = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', output]).toString().trim();
console.log(`${output}: ${Number(duration).toFixed(2)}s，响度 ${integrated ? integrated[1] : '?'} LUFS${speed === 1 ? '' : `，已提速 ${speed} 倍`}`);
