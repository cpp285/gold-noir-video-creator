import {createTimeline} from './timeline.ts';

export type PlanetId = 'mercury' | 'venus' | 'earth' | 'mars' | 'jupiter' | 'saturn' | 'uranus' | 'neptune';

export type Planet = {
	id: string; // 每个段落的唯一标识，与纹理选择分开
	texture: PlanetId;
	zh: string;
	en: string;
	la: string;
	myth: string;
	diameter: number; // km
	dist: number; // AU
	period: number; // 地球日
	periodText: string;
	tilt: number; // 轴倾角（度）
	spin: number; // 画面里的自转速度（弧度/秒）
	R: number; // 画面里的球体半径
	atmo: string | null;
	line: string; // 【】内为金色关键词
};

// 示例采用近似值；平均直径与公转周期参考 NASA / JPL，详见仓库 sources.md。
export const PLANETS: Planet[] = [
	{id: 'mercury', texture: 'mercury', zh: '水星', en: 'MERCURY', la: 'MERCURIUS', myth: '罗马神话 · 众神的信使', diameter: 4879, dist: 0.39, period: 88, periodText: '88 天', tilt: 0.03, spin: 0.22, R: 1, atmo: null, line: '水星：白天【430℃】，夜晚【-180℃】。'},
	{id: 'venus', texture: 'venus', zh: '金星', en: 'VENUS', la: 'VENUS', myth: '罗马神话 · 爱与美之神', diameter: 12104, dist: 0.72, period: 225, periodText: '225 天', tilt: 177.4, spin: 0.12, R: 1, atmo: '#ffd890', line: '金星自转一圈，比绕太阳一圈【还要久】。'},
	{id: 'earth', texture: 'earth', zh: '地球', en: 'EARTH', la: 'TERRA', myth: '拉丁语 · 大地', diameter: 12742, dist: 1.0, period: 365, periodText: '365 天', tilt: 23.44, spin: 0.25, R: 1, atmo: '#6fb4ff', line: '地球，目前唯一已知有【生命】的星球。'},
	{id: 'mars', texture: 'mars', zh: '火星', en: 'MARS', la: 'MARS', myth: '罗马神话 · 战神', diameter: 6779, dist: 1.52, period: 687, periodText: '687 天', tilt: 25.19, spin: 0.24, R: 1, atmo: '#ff9a6a', line: '火星上有太阳系最大的火山：【奥林匹斯山】。'},
	{id: 'jupiter', texture: 'jupiter', zh: '木星', en: 'JUPITER', la: 'IUPPITER', myth: '罗马神话 · 众神之王', diameter: 139820, dist: 5.2, period: 4333, periodText: '11.9 年', tilt: 3.13, spin: 0.4, R: 1, atmo: '#f0d6a8', line: '木星的体积，能装下【1300 多个】地球。'},
	{id: 'saturn', texture: 'saturn', zh: '土星', en: 'SATURN', la: 'SATURNUS', myth: '罗马神话 · 农神', diameter: 116460, dist: 9.54, period: 10759, periodText: '29.4 年', tilt: 26.73, spin: 0.35, R: 0.55, atmo: '#f3e1b4', line: '土星的平均密度，【比水还小】。'},
	{id: 'uranus', texture: 'uranus', zh: '天王星', en: 'URANUS', la: 'URANUS', myth: '希腊神话 · 天空之神', diameter: 50724, dist: 19.2, period: 30687, periodText: '84 年', tilt: 97.77, spin: 0.3, R: 0.8, atmo: '#a8f0ff', line: '天王星几乎是【躺着】绕太阳转的。'},
	{id: 'neptune', texture: 'neptune', zh: '海王星', en: 'NEPTUNE', la: 'NEPTUNUS', myth: '罗马神话 · 海神', diameter: 49244, dist: 30.1, period: 60190, periodText: '165 年', tilt: 28.32, spin: 0.3, R: 1, atmo: '#6f9dff', line: '海王星的风速，最高超过每小时【2000 公里】。'},
];

export const FPS = 30;
export const HOOK = 120; // 0–4s 开场提问
export const TITLE = 120; // 4–8s 标题
export const SEG = 168; // 每颗行星 5.6s
export const CLOSE = 216; // 收尾 7.2s
export const TIMELINE = createTimeline(PLANETS.length, {fps: FPS, hook: HOOK, title: TITLE, segment: SEG, closing: CLOSE});
export const TOTAL = TIMELINE.totalFrames; // 默认 1800 帧 = 60s

export const GOLD = '#d9a54a';
export const GOLD_LIGHT = '#f3d590';
export const IVORY = '#efe6d6';
export const SERIF_ZH = '"Songti SC", "Noto Serif CJK SC", "Source Han Serif SC", "STSong", SimSun, serif';
export const SERIF_LA = 'Baskerville, "Noto Serif", "Times New Roman", "Liberation Serif", serif';
export const DIDOT = 'Didot, Baskerville, "Noto Serif", "Times New Roman", "Liberation Serif", serif';
