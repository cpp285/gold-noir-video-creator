---
name: gold-noir-video-creator
description: 制作暗金、黑金电影感的科普与知识讲解视频（dark-gold explainer videos）。使用 Remotion + Three.js 输出带 3D 物体、金色衬线标题、刻度表盘、数据面板、逐字字幕和程序合成配乐的 MP4。用户要求制作这种风格的视频、复用 gold-noir-video-creator 模板，或提供相同风格的视频参考时使用。附 1920×1080 太阳系示例；不适用于未指定此风格的普通视频需求、明亮卡通或真人实拍。
---

# 暗金风格视频制作（gold-noir-video-creator）

用同级 `template/` 中的 Remotion + Three.js 项目制作视频。默认示例为 60 秒太阳系科普，1920×1080、30fps，Composition id 为 `Main`。输出含字幕和程序合成配乐，不含旁白配音。

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

## 视觉规范

- **底色**：径向渐变 `#2c1f13 → #150e08 → #070504`，叠加暗角和颗粒。
- **金色**：主金 `#d9a54a`、亮金 `#f3d590`；`goldText` 提供金色文字渐变。
- **字体**：中文优先 Songti SC，回退 Noto Serif CJK SC、思源宋体、宋体；拉丁标题优先 Baskerville，斜体副题优先 Didot。其他平台先确认中文字体可用，字体回退可能改变字宽。
- **字幕**：底部居中，默认 62px 衬线粗体；逐字模糊上浮淡入，`【】` 内文字标金。
- **背景大字**：主题英文或拉丁名，230px，透明度约 0.065，缓慢横移，两侧渐隐。
- **表盘**：3D 物体外画 300° 刻度弧、细圆、环形文字和发光标记。
- **信息面板**：左上编号与标题，右上副题与注释，右侧 0–3 行数据配圆形徽章和 12 段进度条。

## 时长与内容数量

默认结构：开场 `HOOK = 120` 帧 → 标题 `TITLE = 120` 帧 → `PLANETS.length` 个段落，每段 `SEG = 168` 帧 → 收尾 `CLOSE = 216` 帧。

在 `data.ts` 修改数组及帧数，视频总时长、段落起点、面板总数、收尾布局和配乐时长会同步更新；不需要手工改配乐的秒数。场景内部的入场、退场效果按对应段落时长缩放。随后运行 `npm run still` 或 `npm run render`。

至少保留一个内容项；帧率、各段帧数须为正整数。每项 `id` 唯一，`texture` 独立选择内置纹理，允许多个段落复用同一种纹理。很多项目或很短的段落需要额外检查标签布局与字幕可读性。

## 更换主题

1. **内容**：替换 `PLANETS` 和开场、片名、收尾文案。当前 `Planet` 类型、行星纹理与数值单位属于太阳系示例，新主题需要相应修改类型和模型。
2. **信息面板**：使用通用 `<InfoHUD rows={...}>`。每行 `frac` 为 0–1；跨度大的数据使用开方或对数映射，并保持可比较项目的映射一致。
3. **标题卡**：使用 `<TitleCard f dur title latin subtitle motto />`。
4. **物体**：替换 `PlanetBody`，保留适合主题的主光和金色逆光。没有合适模型时可用几何体、程序化纹理或 2D SVG。
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
- Remotion 各包保持同一精确版本，保留锁文件；升级依赖后重新检查与抽帧。

## 交付检查

1. 执行 `npm run check`。每个场景抽取代表帧，检查字幕、中文字体、物体与表盘对位和黑边。
2. 渲染完整视频后，使用 ffmpeg 以 0.5fps 抽帧检查全过程；核对总时长和音轨是否存在。
3. 使用可用音频工具试听。无法实际试听时如实说明，并请用户检查配乐音量与转场钟声，不能声称已听过。
