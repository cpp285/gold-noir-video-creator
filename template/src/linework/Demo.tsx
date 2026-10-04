// 线描组件演示（Composition id: Linework，6 秒）。正片不依赖它；做线描叙事时从这里挑组件。
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Subtitle} from '../cinematic/Overlay';
import {Sky, Vignette, Grain, ChapterCard, ChapterHUD, YearTag, Tag, k, mix, easeIO, drawn, GOLD, PaperGrid, ChartFrame, BoxLabel, Annot, Counter, TitleCard, GOLD_L, type Chapter} from './kit';
import {SeatedPerson, StandingPerson} from './People';

export const LINEWORK_FRAMES = 180;
const CH: Chapter = {seal: '壹', name: '审讯', sub: '两个人，四种结果', note: '线描组件演示'};

export const LineworkDemo: React.FC = () => {
	const f = useCurrentFrame();
	const reach = k(f, 70, 95) * (1 - k(f, 140, 160));
	const walk = Math.sin(f / 7);
	const phase1 = 1 - k(f, 80, 88); // 线描人物段
	return (
		<AbsoluteFill style={{background: '#05081a'}}>
			<Sky f={f} />
			<AbsoluteFill style={{opacity: phase1}}>
			<svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
				<line x1={120} y1={808} x2={1800} y2={808} stroke={GOLD} strokeWidth={2} strokeOpacity={0.7} {...drawn(k(f, 0, 40, easeIO))} />
				{/* 坐着的嫌疑人 + 桌子 + 递条件的警察（房间坐标整体平移） */}
				<g transform="translate(160 300)">
					<SeatedPerson op={k(f, 10, 30)} />
					<rect x={330} y={398} width={230} height={10} fill="#0d1538" stroke={GOLD} strokeWidth={2.4} />
					<path d="M346 408 V508 M544 408 V508" stroke={GOLD} strokeWidth={2.4} />
					<g transform="translate(622 508) scale(-1 1)" opacity={k(f, 20, 40)}>
						<StandingPerson outfit="police" reach={reach} />
					</g>
				</g>
				{/* 戴礼帽的西装人物、走路的人（朝左用镜像） */}
				<g transform="translate(1180 808) scale(1.15)" opacity={k(f, 30, 50)}>
					<StandingPerson outfit="suit" />
				</g>
				<g transform={`translate(${mix(1700, 1500, k(f, 40, 170))} 808) scale(-1.15 1.15)`} opacity={k(f, 40, 60)}>
					<StandingPerson outfit="suspect" step={walk} />
				</g>
			</svg>
			<Tag x={960} y={210} op={k(f, 60, 72) * phase1} size={26}>情形一 · 两人都不开口</Tag>
			<ChapterHUD ch={CH} op={k(f, 50, 62) * phase1} />
			<YearTag year={mix(1945, 1986, k(f, 10, 150, easeIO))} note="年份里程表" op={k(f, 4, 16) * phase1} />
			{f < 50 && <ChapterCard f={f} s={0} d={50} ch={CH} />}
			</AbsoluteFill>
			{/* 版式件：网格承托 + 图表框 + 引线标注 + 角落计数器（后半段演示） */}
			{f >= 90 && <PaperGrid op={k(f, 90, 110) * 0.34} size={64} />}
			{f >= 96 && (
				<svg width={1920} height={1080} style={{position: 'absolute', inset: 0, opacity: k(f, 96, 112)}}>
					<ChartFrame x={560} y={300} w={800} h={420} corner={30} grid gridStep={58} />
					{[0, 1, 2].map((i) => (
						<rect key={i} x={640 + i * 200} y={720 - (120 + i * 70)} width={120} height={120 + i * 70} fill="rgba(217,165,74,0.22)" />
					))}
					<Annot x={520} y={330} to={[700, 600]} side="left" num="A" label="引线标注" sub="label via leader line" />
					<Annot x={1420} y={330} to={[1300, 520]} side="right" num="B" label="标签不压图形" sub="never on top of the marks" />
				</svg>
			)}
			<BoxLabel x={1660} y={180} anchor="right" op={k(f, 104, 120)}>方框注释 · 图表来源或口径说明</BoxLabel>
			<Counter x={76} y={158} value={mix(1, 200, k(f, 100, 178, easeIO))} label="轮" sub="of 200 rounds" op={k(f, 98, 114)} />
			{f >= 132 && f < 166 && <TitleCard f={f} s={132} d={34} seal="叁" name="版式件" series="线描模板演示" en="LAYOUT KIT · grids, callouts, counters" />}
			<Subtitle text="每句字幕都配一个画面动作：警察把【条件】推过桌面。" f={f} start={64} end={88} bottom={62} size={54} />
			{f >= 96 && <Subtitle text="版式件：网格底板、引线标注、图表框、角落计数器。" en="the layout kit: grids, callouts, frames, counters" f={f} start={100} end={LINEWORK_FRAMES} bottom={54} size={54} />}
			<Vignette />
			<Grain f={f} />
		</AbsoluteFill>
	);
};
