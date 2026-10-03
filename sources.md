# 太阳系示例的事实来源

核对日期：2026-10-04。以下资料用于核对 `template/src/cinematic/data.ts` 和示例字幕，不代表 NASA / JPL 对本项目的认可。仓库没有复制这些网站的照片或模型。

## 数据口径

- **直径**：采用平均直径的近似值，参考 JPL 的 Mean Radius 乘以 2；不要与赤道直径混用。例如地球约 12,742 km。[JPL Planetary Physical Parameters](https://ssd.jpl.nasa.gov/planets/phys_par.html)
- **公转周期**：示例显示近似地球日或地球年，便于阅读；不是精密历表。[JPL Planetary Physical Parameters](https://ssd.jpl.nasa.gov/planets/phys_par.html)
- **距太阳**：示例为近似平均轨道距离，单位 AU；不表示渲染当日的瞬时距离。各行星的 Size and Distance / Orbit and Rotation 段落可用于核对，入口见下表。
- **画面参数**：`R`、`spin`、收尾轨道间距和相机参数为艺术设定。轴倾角仅用于示意，纹理与轨道不构成真实地图或天文模拟。

## 字幕与主题事实

| 内容 | 核对入口 |
|---|---|
| 水星昼夜温差及公转周期 | [NASA Mercury Facts](https://science.nasa.gov/mercury/facts/) |
| 金星的恒星自转周期长于公转周期 | [NASA Venus Facts](https://science.nasa.gov/venus/venus-facts/) |
| 地球是目前唯一已知有生命的星球 | [NASA Earth Facts](https://science.nasa.gov/earth/facts/) |
| 火星的奥林匹斯山是太阳系最大的火山 | [NASA Mars Facts](https://science.nasa.gov/mars/facts/) |
| 木星与地球的大小比较 | [NASA Jupiter Facts](https://science.nasa.gov/jupiter/jupiter-facts/)；体积比也可由 JPL 平均半径的三次方比估算 |
| 土星平均密度低于水 | [NASA Saturn Facts](https://science.nasa.gov/saturn/facts/) |
| 天王星的大轴倾角与侧躺姿态 | [NASA Uranus Facts](https://science.nasa.gov/uranus/facts/) |
| 海王星最高风速可超过 2,000 km/h | [NASA Neptune Facts](https://science.nasa.gov/neptune/neptune-facts/) |
| 太阳系约在 46 亿年前形成 | [NASA Solar System Facts](https://science.nasa.gov/solar-system/solar-system-facts/) |

将模板改为其他主题时，应替换本文件中的来源，并检查统计口径、单位和近似程度。无法核实的数字应删除或继续查证，不能只加一个“约”就当成已核实。
