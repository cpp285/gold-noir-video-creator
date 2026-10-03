---
name: gold-noir-video-creator
description: 制作暗金、黑金电影感的科普与知识讲解视频（dark-gold explainer videos）。使用 Remotion + Three.js 输出带 3D 物体、金色衬线标题、刻度表盘、数据面板、逐字字幕、程序合成配乐和可选 AI 旁白配音（edge-tts，音画逐句对齐）的 MP4。用户要求制作这种风格的视频、复用 gold-noir-video-creator 模板，或提供相同风格的视频参考时使用。附 1920×1080 太阳系示例；不适用于未指定此风格的普通视频需求、明亮卡通或真人实拍。
---

# 暗金风格视频制作（gold-noir-video-creator）

用同级 `template/` 中的 Remotion + Three.js 项目制作视频。默认示例为 60 秒太阳系科普，1920×1080、30fps，Composition id 为 `Main`。默认输出字幕和程序合成配乐，不含旁白；需要配音时按下文“配音”一节开启，旁白与字幕、画面逐句对齐。

模板支持本地渲染，无需购买素材或调用付费生成 API；Remotion 的适用许可条件见 [官方说明](https://www.remotion.dev/docs/license/pricing)。环境与字体安装见 [README.md](README.md)。

## 何时使用

- 用户明确要暗金、黑金、深色电影感的科普或知识讲解视频。
- 用户要求使用 gold-noir-video-creator，或复用这个视频模板。
- 用户提供这种风格的参考视频；先查看参考，确认视觉风格与需求一致。

只说“做个科普视频”但未指定风格时，不默认套用此模板。尊重用户指定的内容、片长和交付方式。

## 起步

先找到**本次实际加载的 SKILL.md 所在目录**，由此定位同级 `template/`，不要假设安装在某个固定的用户目录。需要 Node.js 22.x（至少 22.18.0）或 24+，建议 24 LTS。

下面的两个变量须替换为实际路径；将模板复制到一个新的项目目录，并保留隐藏文件和锁文件：

```bash
SKILL_DIR="/absolute/path/to/gold-noir-video-creator"
PROJECT_DIR="/absolute/path/to/new-video-project"
mkdir "$PROJECT_DIR"
cp -R "$SKILL_DIR/template/." "$PROJECT_DIR/"
cd "$PROJECT_DIR"
npm ci
npm run check
npm run still -- --frame=470
npm run render
```

Windows 可使用文件管理器复制完整模板，然后在 PowerShell 进入项目目录运行 npm 命令。不要覆盖已有项目文件。

- `npm run voice` 按 `narration.json` 生成旁白和配音时间轴；`npm run voice:samples` 生成多种声音的试听对比；`npm run voice:off` 关闭配音。详见“配音”。
- `npm run master` 对 `out/video.mp4` 做响度标准化（默认 -16 LUFS），可加 `-- --speed=1.25` 整体提速。详见“交付检查”。
- `npm run dev` 启动 Studio，自动生成配乐。
- `npm run still` 和 `npm run render` 都会重新生成配乐、打包，再输出 `out/still.png` 或 `out/video.mp4`。
- 连续抽帧可先 `npm run bundle`，再 `npm run still:cached -- --frame=300`。每次会覆盖同一张图片，需保留时先另存；修改内容后重新打包。
- 首次渲染会下载浏览器。遇到字体、WebGL 或浏览器启动问题时，先检查实际运行环境。

## 文件分工

| 文件（相对项目目录） | 负责什么 |
|---|---|
| `src/cinematic/data.ts` | 内容数组、时长常量 `FPS / HOOK / TITLE / SEG / CLOSE`、字体及配色 |
| `src/cinematic/timeline.ts` | 共用时间线、帧数校验、按内容数量生成收尾布局 |
| `src/cinematic/SolarCinematic.tsx` | 场景编排、开场问题、片名与收尾文案 |
| `src/cinematic/Overlay.tsx` | 字幕、标题卡、表盘、通用信息面板 |
| `src/cinematic/Space3D.tsx` | 相机、灯光、物体、轨道和 3D 到 2D 的投影 |
| `src/cinematic/textures.ts` | 带种子噪声的程序化纹理 |
| `scripts/bgm.mjs` | 读取共用时间线，合成 PCM 配乐、钟声与转场声 |
| `narration.json` | 旁白稿：每个场景的字幕文本、朗读文本、声音、语速和停顿 |
| `scripts/tts.py` | 逐句生成旁白：原始语音存 `public/vo/raw/`，后期处理并裁静音后存 `public/vo/`，实测时长，写出 `voice.ts`；`--samples` 生成试听对比 |
| `scripts/master.mjs` | 交付母带：响度标准化，可选整体变速（画面补帧、声音保调） |
| `src/cinematic/voice.ts` | 生成的配音时间轴；为 `null` 时不配音，使用固定时长 |

## 视觉规范

- **底色**：径向渐变 `#2c1f13 → #150e08 → #070504`，叠加暗角和颗粒。
- **金色**：主金 `#d9a54a`、亮金 `#f3d590`；`goldText` 提供金色文字渐变。
- **字体**：中文优先 Songti SC，回退 Noto Serif CJK SC、思源宋体、宋体；拉丁标题优先 Baskerville，斜体副题优先 Didot。其他平台先确认中文字体可用，字体回退可能改变字宽。
- **字幕**：底部居中，默认 62px 衬线粗体；逐字模糊上浮淡入，`【】` 内文字标金。
- **背景大字**：主题英文或拉丁名，230px，透明度约 0.065，缓慢横移，两侧渐隐。
- **表盘**：3D 物体外画 300° 刻度弧、细圆、环形文字和发光标记。
- **信息面板**：左上编号与标题，右上副题与注释，右侧 0–3 行数据配圆形徽章和 12 段进度条。

## 时长与内容数量

默认结构：封面（`HOOK = 120` + `TITLE = 120` 帧，合并为一个场景）→ `PLANETS.length` 个段落，每段 `SEG = 168` 帧 → 收尾 `CLOSE = 216` 帧。

按"一组同类事物"组织的主题直接套用这个结构。按推理一步步展开的主题（例如博弈论、某个机制的原理）更适合"按句组织的时间轴"：每句字幕是一个时间锚点，画面动作都挂在句子上，见 [examples.md](examples.md)。

在 `data.ts` 修改数组及帧数，视频总时长、段落起点、面板总数、收尾布局和配乐时长会同步更新；不需要手工改配乐的秒数。场景内部的入场、退场效果按对应段落时长缩放。随后运行 `npm run still` 或 `npm run render`。

至少保留一个内容项；帧率、各段帧数须为正整数。每项 `id` 唯一，`texture` 独立选择内置纹理，允许多个段落复用同一种纹理。很多项目或很短的段落需要额外检查标签布局与字幕可读性。

## 首帧即封面

第 0 帧必须是完整、可辨认的画面：标题已经显现、主体物体已经点亮，不从黑场淡入。视频未播放时的预览图和平台封面都取首帧，黑首帧会让观众看不出内容。

- 模板的 `CoverScene` 把标题卡放在左侧、主体放在右侧；`TitleCard` 传入 `f={frame + 96}`，入场动画在第 0 帧已经完成。
- 封面只做淡出，不做淡入；开场提问以字幕（或旁白）形式放在封面上。
- 换主题时同步替换封面的标题、副题和主体物体。交付前抽 `--frame=0` 确认。

## 配音（可选）

旁白用 [edge-tts](https://github.com/rany2/edge-tts) 调用微软在线神经网络语音：免费、音质接近真人，需要联网，另需 `uv`（提供 `uvx`）和 `ffprobe`。它使用的是微软 Edge 朗读服务，并非官方付费 API；商用前请让用户自行确认条款。

### 核心原则：时间轴跟着旁白走

**不要**把一整段旁白铺在固定时长的画面上，也不要在渲染后再混音。那样字幕和画面切换点与语音无关，必然不同步。正确流程：

1. 旁白稿按句写进 `narration.json`，每句对应一条字幕。
2. `npm run voice` 逐句生成 `public/vo/<场景>-<序号>.mp3`（先存原始语音，再做后期处理并裁掉首尾静音），用 `ffprobe` 实测时长，按停顿规则排出每个场景的长度和每句的起始帧，写出 `src/cinematic/voice.ts`。
3. 合成读取 `voice.ts`：场景长度、段落起点、配乐钟声都由它决定；每句的 `<Audio>` 与字幕挂在**同一帧**；画面里的关键事件（爆发、高亮、物体变化）也以某句旁白的起始帧为锚点。
4. `npm run render` 在 Remotion 中一次性渲染画面与全部音频。

### narration.json

- `scenes` 顺序固定：`cover` → 与内容数组同序的各段落 `id` → `closing`。不一致时 `createVoicedTimeline` 会报错并给出期望顺序。
- 每句 `text` 是字幕（`【】` 标金）；`speak` 是朗读文本，省略时朗读去掉 `【】` 的 `text`。
- 朗读文本的写法：数字写成汉字（`46 亿` → `四十六亿`），`-260℃` → `零下二百六十摄氏度`，`≈ > ·` 等符号改写成文字或删掉，单位写全称。字幕保留阿拉伯数字。
- 每段 1–2 句，每句约 12–25 字（3–6 秒）。句子过长会拖长场景，字幕也可能超出一行。
- `pitch` 调音调（如 `-4Hz`），默认 `+0Hz`；`polish` 控制人声后期处理，默认 `true`。
- `pacing`（单位：帧）：默认句前 `lead 20`、句间 `gap 20`、句后 `tail 30`；封面 `lead 12 / gap 14 / tail 24 / min 150`；收尾 `tail 96` 留给片名卡。需要更多停顿的场景（如爆发前的静默）可单独加大 `gap`。

### 声音与混音

- **先试听，再定声音。** 运行 `npm run voice:samples`：用旁白稿前 3 句，按 5 个候选声音（晓晓、晓伊、晓臻〔台湾腔〕、云希、云扬）各读一遍，拼成 `out/voice-samples.mp3`，每个声音前有一声提示音。你无法亲耳判断音色，把文件交给用户挑，再把选中的声音写进 `narration.json` 的 `voice`。
- **AI 味**：晓晓（`zh-CN-XiaoxiaoNeural`）是短视频里最常见的 AI 配音，很多观众一听就能认出来。用户要求"不要太 AI 味的女声"时，提供试听对比；一位真实用户最终选了晓伊（`zh-CN-XiaoyiNeural`，`rate -8%`、`pitch -4Hz`）。其他可选：`zh-CN-YunxiNeural`（男声，轻快）、`zh-CN-YunyangNeural`（男声，新闻播报）、`zh-CN-YunjianNeural`（男声，激昂）。完整列表：`uvx edge-tts --list-voices`。
- **后期处理**（`polish`，默认开启，需要 ffmpeg）：去掉 70Hz 以下低频，180Hz 加一点胸腔暖度，3.2kHz 略提清晰度，7.5kHz 压齿音和电子味，2.5:1 轻压缩，再加两次很短的反射制造一点空间感；同时裁掉每句首尾静音，句间停顿统一交给 `pacing`。没有 ffmpeg 时自动退回原始语音。
- **语速与节奏**：短视频观众偏好比"朗读"更快的节奏。实测：`rate -8%`、每句留足阅读停顿的版本被用户评价"有点慢"，整体提速 1.25 倍后才满意。新项目建议 `rate` 在 `+10%` 到 `+20%` 之间，`gap` 缩到 10–14 帧；清晰仍然优先，每一步推理都要讲到，收紧的是语速和停顿，不是内容。已渲染的成片可用 `npm run master -- --speed=1.25` 整体提速（声音不变调），不必重做。
- **配乐闪避**：开启配音后，配乐在说话时压到 0.32，句间回到 0.6，进出各渐变 8 帧（`timeline.ts` 的 `speechWindows` / `musicVolume`）；实测人声比配乐高约 9–10 dB。旁白音量为 1。
- 修改旁白稿、声音、语速或音调后重新运行 `npm run voice`；内容没变的句子会复用已生成的音频。在线服务偶尔断连时，脚本会自动重试。

### 配音交付检查

- `npm run check` 通过，`voice.ts` 中各场景时长合理。
- 抽首帧确认封面；抽每个场景中段的帧，确认字幕不超出一行。
- 渲染后用 `ffprobe` 确认存在音轨、总时长等于 `voice.ts` 的总帧数。用 `volumedetect` 比较几句的“说话区间”和“句前空隙”：说话区间应明显更响（实测高 8–15 dB）。句前若有设计好的音效，空隙也会响，属于正常。
- 无法试听时如实说明，请用户确认语速、音色和音量比例。不要声称已经听过，也不要凭推测宣称“已同步”。可以说明同步的依据：每句音频与字幕挂在同一帧。

## 更换主题

1. **内容**：替换 `PLANETS` 和开场、片名、收尾文案。当前 `Planet` 类型、行星纹理与数值单位属于太阳系示例，新主题需要相应修改类型和模型。
2. **信息面板**：使用通用 `<InfoHUD rows={...}>`。每行 `frac` 为 0–1；跨度大的数据使用开方或对数映射，并保持可比较项目的映射一致。
3. **标题卡**：使用 `<TitleCard f dur title latin subtitle motto />`。
4. **物体**：替换 `PlanetBody`，保留适合主题的主光和金色逆光。没有合适模型时可用几何体（`LatheGeometry` 旋转出棋子、奖杯、瓶子）、程序化纹理或 2D SVG。金属材质（`metalness` 较高）必须在 `<Stage>` 里放 `<Environment />`（`Space3D.tsx`），否则背光的一半会直接发黑。
5. **对位**：`project(camPos, target, point)` 返回屏幕位置和像素缩放系数；表盘半径可设为物体半径乘以系数再加 30。
6. **事实**：为数字和关键事实保存可靠来源。近似值写明“约”；未经核实的数字先核实或删除。太阳系示例的参考入口见 [sources.md](sources.md)，不要把风格化纹理、轨道和尺寸当成真实测绘数据。

更多主题示例见 [examples.md](examples.md)。

## 组件速查（Overlay.tsx）

| 组件 | 关键参数 |
|---|---|
| `Background` | `glowY`：光晕纵向位置（百分比） |
| `Vignette` / `Grain` | `Grain` 接收 `frame` |
| `Fade` | `f`、`dur`、`inF`、`outF` |
| `Dust` | `frame`、`count`、`seed` |
| `LatinBG` | `text`、`frame`、`top` |
| `Dial` | 唯一 `id`、`cx`、`cy`、`r`、`progress`、`rot`、`ring` |
| `Subtitle` | `text`（支持【】）、`f`、`start`、`end`、`bottom`、`size` |
| `InfoHUD` | `f`、`index`、`total`、`title`、`en`、`italic`、`note`、`rows: {badge,label,value,unit,frac}[]` |
| `TitleCard` | `f`、`dur`、`title`、`latin`、`subtitle`、`motto` |

## 渲染约束

- 使用 `@remotion/three` 的 `ThreeCanvas`；渲染脚本已配置 `--gl=angle`。
- 画面必须由帧号确定。随机数使用 `remotion` 的 `random(seed)` 或纹理中的种子噪声；不要使用 `Math.random()`、`Date.now()` 或 CSS 动画驱动画面。
- 透明画布上的 AdditiveBlending 自定义辉光着色器应输出带强度的 alpha，避免固定 alpha 为 1 产生黑环。
- 温度使用 `℃`，减少宋体中 `°C` 的字形间距问题。
- 3D 内容与标签避开底部约 180px 的字幕区域；收尾全景可下调相机 `target.y` 让主体上移。
- 打勾、箭头、标签不要压在数字或文字上：放在格子的角上或格子之间的空隙里，较长的说明移到旁边的图例。
- 吊灯、灯罩这类贴近画面上沿的物体，镜头推近后会被切掉一半、或压到左上角标题，这时把它隐藏，只保留光。
- Remotion 各包保持同一精确版本，保留锁文件；升级依赖后重新检查与抽帧。

## 交付检查

1. 执行 `npm run check`。每个场景抽取代表帧，检查字幕、中文字体、物体与表盘对位和黑边。
2. 渲染完整视频后，使用 ffmpeg 以 0.5fps 抽帧检查全过程；核对总时长和音轨是否存在。抽帧图里偶尔有一帧偏暗或数字只滚了一半，先确认是不是截在淡入淡出或滚动中途，再决定要不要改。
3. 抽 `--frame=0` 确认首帧是完整封面。
4. **响度**：`npm run master` 把成片标准化到 -16 LUFS，输出 `out/video-master.mp4`，交付这个文件。手机平台常见响度在 -14 到 -16 LUFS 之间。实测：模板直出的示例不配音约 -19 LUFS，开启配音后约 -25 LUFS；换了更安静的配乐后，一集只有 -29 LUFS，外放几乎听不清。用 `--lufs=-14` 可以更响。
5. 使用可用音频工具试听。无法实际试听时如实说明，并请用户检查配乐音量、转场钟声和旁白，不能声称已听过。
