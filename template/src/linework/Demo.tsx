// 线描组件演示（Composition id: Linework，6 秒）。正片不依赖它；做线描叙事时从这里挑组件。
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Subtitle} from '../cinematic/Overlay';
import {Sky, Vignette, Grain, ChapterCard, ChapterHUD, YearTag, Tag, k, mix, easeIO, drawn, GOLD, type Chapter} from './kit';
import {SeatedPerson, StandingPerson} from './People';

export const LINEWORK_FRAMES = 180;
const CH: Chapter = {seal: '壹', name: '审讯', sub: '两个人，四种结果', note: '线描组件演示'};

export const LineworkDemo: React.FC = () => {
	const f = useCurrentFrame();
	const reach = k(f, 70, 95) * (1 - k(f, 140, 160));
	const walk = Math.sin(f / 7);
	return (
		<AbsoluteFill style={{background: '#05081a'}}>
			<Sky f={f} />
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
			<Tag x={960} y={210} op={k(f, 60, 72)} size={26}>情形一 · 两人都不开口</Tag>
			<ChapterHUD ch={CH} op={k(f, 50, 62)} />
			<YearTag year={mix(1945, 1986, k(f, 10, 150, easeIO))} note="年份里程表" op={k(f, 4, 16)} />
			{f < 50 && <ChapterCard f={f} s={0} d={50} ch={CH} />}
			<Subtitle text="每句字幕都配一个画面动作：警察把【条件】推过桌面。" f={f} start={64} end={LINEWORK_FRAMES} bottom={62} size={54} />
			<Vignette />
			<Grain f={f} />
		</AbsoluteFill>
	);
};
