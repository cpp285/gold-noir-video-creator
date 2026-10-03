#!/usr/bin/env python3
"""逐句生成旁白，并按每句实测时长排出配音时间轴。

读取 narration.json，用 edge-tts（微软在线神经网络语音，免费，需要联网）
为每一句生成原始语音 public/vo/raw/<场景>-<序号>.mp3，经 ffmpeg 后期处理
（去低频、加暖、压齿音、轻压缩、淡空间感、裁掉首尾静音）得到 public/vo/<场景>-<序号>.mp3，
用 ffprobe 测量时长，写出 src/cinematic/voice.ts。画面、字幕、旁白都从 voice.ts 取帧位置。

运行：npm run voice（等同于 uvx --with edge-tts python scripts/tts.py）
试听对比：npm run voice:samples（用旁白稿前几句，按候选声音各读一遍，输出 out/voice-samples.mp3）
关闭配音：npm run voice:off
"""
import asyncio, json, math, shutil, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
NARRATION = ROOT / "narration.json"
VO = ROOT / "public" / "vo"
RAW = VO / "raw"
OUT = ROOT / "src" / "cinematic" / "voice.ts"
HEADER = "import type {VoiceData} from './timeline.ts';\n\n// 由 scripts/tts.py（npm run voice）根据 narration.json 生成，不要手改。\n// null 表示不配音：时间轴和字幕使用 data.ts 中的固定值。\n"

# 让合成语音更像录音棚人声：去 70Hz 以下的低频、180Hz 加一点胸腔暖度、3.2kHz 略提清晰度、
# 7.5kHz 压齿音和电子味、2.5:1 轻压缩、两次很短的反射制造一点空间感。
POLISH = ("highpass=f=70,equalizer=f=180:t=q:w=1:g=2,equalizer=f=3200:t=q:w=1.5:g=1,equalizer=f=7500:t=q:w=2:g=-3.5,"
          "acompressor=threshold=-20dB:ratio=2.5:attack=8:release=140,aecho=0.85:0.6:28|41:0.07|0.04")
# 裁掉开头静音；结尾裁掉后补 0.12 秒，句间停顿统一交给 pacing 控制
TRIM_HEAD = "silenceremove=start_periods=1:start_threshold=-50dB"
TRIM_TAIL = "areverse,silenceremove=start_periods=1:start_threshold=-50dB,adelay=120,areverse"
SAMPLE_VOICES = [
    ("zh-CN-XiaoxiaoNeural", "女声 · 晓晓 · 温暖平稳"),
    ("zh-CN-XiaoyiNeural", "女声 · 晓伊 · 年轻活泼"),
    ("zh-TW-HsiaoChenNeural", "女声 · 晓臻 · 台湾腔"),
    ("zh-CN-YunxiNeural", "男声 · 云希 · 轻快"),
    ("zh-CN-YunyangNeural", "男声 · 云扬 · 新闻播报"),
]


def disable():
    OUT.write_text(HEADER + "export const VOICE: VoiceData | null = null;\n")
    print("配音已关闭：voice.ts 恢复为 null")


def duration(path: Path) -> float:
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", str(path)],
                         capture_output=True, text=True, check=True)
    return float(out.stdout.strip())


async def synth(text: str, voice: str, rate: str, pitch: str, path: Path):
    """生成原始语音；文本、声音、语速、音调都没变时复用。返回是否新生成。"""
    from edge_tts import Communicate
    stamp = path.with_suffix(".txt")
    key = f"{voice}|{rate}|{pitch}|{text}"
    if path.exists() and stamp.exists() and stamp.read_text(encoding="utf-8") == key:
        return False
    for attempt in range(8):
        try:
            await Communicate(text, voice, rate=rate, pitch=pitch).save(str(path))
            stamp.write_text(key, encoding="utf-8")
            return True
        except Exception as e:  # 在线服务偶尔断连，退避重试
            if attempt == 7:
                raise
            print(f"  重试 {path.name}（{type(e).__name__}）")
            await asyncio.sleep(2 + attempt * 2)


def finish(raw: Path, out: Path, polish: bool, force: bool):
    """后期处理并裁静音。没有 ffmpeg 时直接使用原始语音。"""
    stamp = out.with_suffix(".txt")
    key = f"{polish}|{raw.with_suffix('.txt').read_text(encoding='utf-8')}"
    if not force and out.exists() and stamp.exists() and stamp.read_text(encoding="utf-8") == key:
        return
    if not shutil.which("ffmpeg"):
        shutil.copyfile(raw, out)
        return
    chain = ",".join(x for x in (TRIM_HEAD, POLISH if polish else "", TRIM_TAIL) if x)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(raw), "-af", chain, "-ar", "48000", "-ac", "1", "-b:a", "160k", str(out)], check=True)
    stamp.write_text(key, encoding="utf-8")


def load():
    cfg = json.loads(NARRATION.read_text(encoding="utf-8"))
    ids = [s["id"] for s in cfg["scenes"]]
    if not ids or ids[0] != "cover" or ids[-1] != "closing" or len(set(ids)) != len(ids):
        sys.exit("narration.json 的 scenes 必须以 cover 开头、closing 结尾，中间是与内容数组同序的段落 id，且不能重复")
    return cfg


def speak_text(cue):
    return cue.get("speak") or cue["text"].replace("【", "").replace("】", "")


async def main():
    cfg = load()
    voice, rate, pitch, fps = cfg["voice"], cfg.get("rate", "+0%"), cfg.get("pitch", "+0Hz"), int(cfg.get("fps", 30))
    polish = cfg.get("polish", True)
    pacing = cfg.get("pacing", {})
    per = pacing.get("scenes", {})
    if polish and not shutil.which("ffmpeg"):
        print("提示：未找到 ffmpeg，跳过人声后期处理，直接使用原始语音")

    RAW.mkdir(parents=True, exist_ok=True)
    scenes, used = [], set()
    for scene in cfg["scenes"]:
        sid = scene["id"]
        p = {**{k: pacing.get(k, d) for k, d in (("lead", 20), ("gap", 20), ("tail", 30))}, **per.get(sid, {})}
        if not scene.get("cues"):
            sys.exit(f"场景 {sid} 至少需要一句旁白")
        cues, f = [], p["lead"]
        for i, cue in enumerate(scene["cues"]):
            cid = f"{sid}-{i}"
            raw, path = RAW / f"{cid}.mp3", VO / f"{cid}.mp3"
            changed = await synth(speak_text(cue), voice, rate, pitch, raw)
            finish(raw, path, polish, changed)
            used.update({path.name, path.with_suffix(".txt").name})
            dur = math.ceil(duration(path) * fps)
            cues.append({"id": cid, "from": f, "dur": dur, "text": cue["text"]})
            f += dur + (p["gap"] if i < len(scene["cues"]) - 1 else 0)
        length = max(f + p["tail"], p.get("min", 0))
        scenes.append({"id": sid, "len": length, "cues": cues})
        print(f"{sid:12s} {length / fps:6.2f}s  " + "  ".join(f"{c['dur'] / fps:.2f}s" for c in cues))

    for folder in (VO, RAW):  # 删除旁白稿里已经不存在的句子
        for stale in folder.iterdir():
            if stale.is_file() and stale.name not in used:
                stale.unlink()

    data = {"fps": fps, "voice": voice, "rate": rate, "scenes": scenes}
    OUT.write_text(HEADER + "export const VOICE: VoiceData | null = " + json.dumps(data, ensure_ascii=False, indent="\t") + ";\n", encoding="utf-8")
    total = sum(s["len"] for s in scenes)
    print(f"共 {total} 帧 = {total / fps:.2f}s，已写入 {OUT.relative_to(ROOT)}")


async def samples(count=3):
    """用旁白稿的前几句，按候选声音各读一遍，拼成一个对比文件，交给用户挑选。"""
    from edge_tts import Communicate
    if not shutil.which("ffmpeg"):
        sys.exit("生成试听对比需要 ffmpeg")
    cfg = load()
    rate, pitch = cfg.get("rate", "+0%"), cfg.get("pitch", "+0Hz")
    lines = [speak_text(c) for s in cfg["scenes"] for c in s["cues"]][:count]
    tmp = ROOT / "out" / "voice-samples"
    tmp.mkdir(parents=True, exist_ok=True)
    gap, beep = tmp / "gap.wav", tmp / "beep.wav"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i", "anullsrc=r=48000:cl=mono", "-t", "0.7", str(gap)], check=True)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i", "sine=f=880:d=0.18,afade=t=out:st=0.02:d=0.16,volume=0.25,aresample=48000", "-ac", "1", str(beep)], check=True)
    parts = []
    for n, (voice, label) in enumerate(SAMPLE_VOICES, 1):
        parts += [beep, gap]
        for i, text in enumerate(lines):
            raw, wav = tmp / f"{n}-{i}.mp3", tmp / f"{n}-{i}.wav"
            for attempt in range(8):
                try:
                    await Communicate(text, voice, rate=rate, pitch=pitch).save(str(raw))
                    break
                except Exception as e:
                    if attempt == 7:
                        raise
                    print(f"  重试 {raw.name}（{type(e).__name__}）")
                    await asyncio.sleep(2 + attempt * 2)
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(raw), "-af", f"{TRIM_HEAD},{POLISH},{TRIM_TAIL}", "-ar", "48000", "-ac", "1", str(wav)], check=True)
            parts += [wav, gap]
        print(f"{n}. {label}（{voice}）")
    listing = tmp / "list.txt"
    listing.write_text("".join(f"file '{p.name}'\n" for p in parts), encoding="utf-8")
    out = ROOT / "out" / "voice-samples.mp3"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(listing), "-af", "loudnorm=I=-16:TP=-1.5", "-b:a", "160k", str(out)], check=True)
    print(f"已写出 {out.relative_to(ROOT)}：每个声音前有一声提示音，按上面的顺序播放。把选中的声音写进 narration.json 的 voice。")


if __name__ == "__main__":
    if "--off" in sys.argv:
        disable()
    elif "--samples" in sys.argv:
        asyncio.run(samples())
    else:
        asyncio.run(main())
