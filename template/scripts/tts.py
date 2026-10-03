#!/usr/bin/env python3
"""逐句生成旁白，并按每句实测时长排出配音时间轴。

读取 narration.json，用 edge-tts（微软在线神经网络语音，免费，需要联网）
为每一句生成 public/vo/<场景>-<序号>.mp3，用 ffprobe 测量时长，
写出 src/cinematic/voice.ts。画面、字幕、旁白都从 voice.ts 取帧位置。

运行：npm run voice（等同于 uvx --with edge-tts python scripts/tts.py）
关闭配音：npm run voice:off
"""
import asyncio, json, math, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
NARRATION = ROOT / "narration.json"
VO = ROOT / "public" / "vo"
OUT = ROOT / "src" / "cinematic" / "voice.ts"
HEADER = "import type {VoiceData} from './timeline.ts';\n\n// 由 scripts/tts.py（npm run voice）根据 narration.json 生成，不要手改。\n// null 表示不配音：时间轴和字幕使用 data.ts 中的固定值。\n"


def disable():
    OUT.write_text(HEADER + "export const VOICE: VoiceData | null = null;\n")
    print("配音已关闭：voice.ts 恢复为 null")


def duration(path: Path) -> float:
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", str(path)],
                         capture_output=True, text=True, check=True)
    return float(out.stdout.strip())


async def synth(text: str, voice: str, rate: str, path: Path):
    from edge_tts import Communicate
    stamp = path.with_suffix(".txt")
    key = f"{voice}|{rate}|{text}"
    if path.exists() and stamp.exists() and stamp.read_text(encoding="utf-8") == key:
        return  # 文本、声音、语速都没变，复用已生成的音频
    for attempt in range(6):
        try:
            await Communicate(text, voice, rate=rate).save(str(path))
            stamp.write_text(key, encoding="utf-8")
            return
        except Exception as e:  # 在线服务偶尔断连，退避重试
            if attempt == 5:
                raise
            print(f"  重试 {path.name}（{type(e).__name__}）")
            await asyncio.sleep(2 + attempt * 2)


async def main():
    cfg = json.loads(NARRATION.read_text(encoding="utf-8"))
    voice, rate, fps = cfg["voice"], cfg.get("rate", "+0%"), int(cfg.get("fps", 30))
    pacing = cfg.get("pacing", {})
    per = pacing.get("scenes", {})
    ids = [s["id"] for s in cfg["scenes"]]
    if not ids or ids[0] != "cover" or ids[-1] != "closing" or len(set(ids)) != len(ids):
        sys.exit("narration.json 的 scenes 必须以 cover 开头、closing 结尾，中间是与内容数组同序的段落 id，且不能重复")

    VO.mkdir(parents=True, exist_ok=True)
    scenes, used = [], set()
    for scene in cfg["scenes"]:
        sid = scene["id"]
        p = {**{k: pacing.get(k, d) for k, d in (("lead", 20), ("gap", 20), ("tail", 30))}, **per.get(sid, {})}
        if not scene.get("cues"):
            sys.exit(f"场景 {sid} 至少需要一句旁白")
        cues, f = [], p["lead"]
        for i, cue in enumerate(scene["cues"]):
            cid = f"{sid}-{i}"
            path = VO / f"{cid}.mp3"
            text = cue.get("speak") or cue["text"].replace("【", "").replace("】", "")
            await synth(text, voice, rate, path)
            used.update({path.name, path.with_suffix(".txt").name})
            dur = math.ceil(duration(path) * fps)
            cues.append({"id": cid, "from": f, "dur": dur, "text": cue["text"]})
            f += dur + (p["gap"] if i < len(scene["cues"]) - 1 else 0)
        length = max(f + p["tail"], p.get("min", 0))
        scenes.append({"id": sid, "len": length, "cues": cues})
        print(f"{sid:12s} {length / fps:6.2f}s  " + "  ".join(f"{c['dur'] / fps:.2f}s" for c in cues))

    for stale in VO.iterdir():  # 删除旁白稿里已经不存在的句子
        if stale.name not in used:
            stale.unlink()

    data = {"fps": fps, "voice": voice, "rate": rate, "scenes": scenes}
    OUT.write_text(HEADER + "export const VOICE: VoiceData | null = " + json.dumps(data, ensure_ascii=False, indent="\t") + ";\n", encoding="utf-8")
    total = sum(s["len"] for s in scenes)
    print(f"共 {total} 帧 = {total / fps:.2f}s，已写入 {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    if "--off" in sys.argv:
        disable()
    else:
        asyncio.run(main())
