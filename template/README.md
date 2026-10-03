# Gold Noir Video Creator · 视频模板

Remotion + Three.js，Composition id `Main`，默认 1920×1080、30fps、60 秒太阳系科普视频。包含字幕与程序合成配乐，无旁白配音。

需要 **Node.js 22.x（至少 22.18.0）或 24+**（建议 24 LTS）和 npm。首次渲染需要联网下载浏览器。macOS 优先使用系统宋体；Linux / Windows 建议安装 Noto Serif CJK SC 或思源宋体。字体回退配置在 `src/cinematic/data.ts`。

```bash
npm ci
npm run check
npm run dev                       # Studio，自动生成配乐
npm run still -- --frame=470       # 自动生成配乐并打包，然后抽帧
npm run render                    # 自动生成配乐并打包，输出 out/video.mp4
```

连续抽帧：先 `npm run bundle`，再 `npm run still:cached -- --frame=300`。输出会覆盖 `out/still.png`，要保留时请先另存；代码或数据变更后需要重新打包。

内容数组、字体和时长在 `src/cinematic/data.ts`。`PLANETS` 的每项 `id` 须唯一，`texture` 可复用内置纹理；至少保留一项。时长以帧为单位，数量、配乐时长、编号和收尾布局自动联动。开场、片名和收尾文字在 `src/cinematic/SolarCinematic.tsx`，换主题时需一并修改。

程序化纹理及轨道仅为示意，不是真实地图或比例模拟。完整仓库另附 `SKILL.md`、`examples.md` 和 `sources.md`。

模板代码采用 [MIT License](LICENSE)。Remotion 和字体使用各自许可证，参见 [Remotion 许可条件](https://www.remotion.dev/docs/license/pricing)。
