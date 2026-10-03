// 线描人物：侧脸（鼻、耳、头发）、衣服结构（领口、门襟、腰带、裤线）、鞋。全部朝右画，朝左用镜像。
import React from 'react';
import {GOLD, mix} from './kit';

const BODY = '#0e1640', FACE = '#18224f', HAIR = '#2c2a3e';
const edge = {stroke: GOLD, strokeWidth: 2.2, strokeLinejoin: 'round', strokeLinecap: 'round'} as const;
const fine = {fill: 'none', stroke: GOLD, strokeWidth: 1.3, strokeOpacity: 0.65, strokeLinecap: 'round', strokeLinejoin: 'round'} as const;

// 带金边的粗线（四肢）：先描金边再填深蓝
const Limb: React.FC<{d: string; w: number}> = ({d, w}) => (
	<>
		<path d={d} fill="none" stroke={GOLD} strokeWidth={w + 4.4} strokeLinecap="round" strokeLinejoin="round" />
		<path d={d} fill="none" stroke={BODY} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
	</>
);

// 侧脸，中心在 (0,0)，约 48 高
export const Head: React.FC<{x: number; y: number; tilt?: number; hat?: 'cap' | 'fedora'}> = ({x, y, tilt = 0, hat}) => (
	<g transform={`translate(${x} ${y}) rotate(${tilt})`}>
		<path d="M-9 24 C -19 20, -23 8, -21 -4 C -19 -18, -7 -26, 5 -24 C 17 -22, 22 -12, 21 -1 L 26 8 L 20 11 C 21 16, 19 21, 13 23 C 7 26, -1 26, -9 24 Z" fill={FACE} {...edge} />
		{!hat && <path d="M-21 -2 C -22 -18, -9 -28, 7 -25 C 17 -23, 21 -16, 21 -8 C 13 -14, 1 -14, -5 -8 C -9 -12, -15 -8, -17 2 Z" fill={HAIR} {...edge} strokeWidth={1.6} />}
		<ellipse cx={-5} cy={2} rx={4} ry={6} {...fine} />
		<path d="M11 -3 L16 -3.5" {...fine} strokeOpacity={0.9} strokeWidth={1.8} />
		<path d="M13 15 L18 14" {...fine} />
		{hat === 'cap' && (
			<g>
				<path d="M-22 -8 C -24 -22, -10 -30, 6 -30 C 20 -30, 26 -22, 24 -12 L 22 -8 Z" fill={BODY} {...edge} />
				<path d="M14 -9 L 34 -6 L 30 -2 L 12 -4 Z" fill={BODY} {...edge} strokeWidth={1.8} />
				<path d="M-21 -12 L 23 -12" {...fine} />
				<circle cx={8} cy={-20} r={3.2} fill={GOLD} />
			</g>
		)}
		{hat === 'fedora' && (
			<g>
				<path d="M-30 -10 C -14 -16, 18 -16, 34 -8" fill="none" {...edge} strokeWidth={2.6} />
				<path d="M-18 -12 C -18 -28, -8 -36, 4 -34 C 16 -36, 22 -28, 20 -13 Z" fill={BODY} {...edge} />
				<path d="M-17 -18 C -4 -21, 10 -21, 20 -18" {...fine} />
			</g>
		)}
	</g>
);

// 坐着的嫌疑人（朝右，房间坐标），手铐着放在桌上，背有点弓
export const SeatedPerson: React.FC<{op: number}> = ({op}) => (
	<g opacity={op}>
		{/* 椅子 */}
		<path d="M224 330 V506 M224 424 H290 V506 M224 330 L230 330" fill="none" stroke={GOLD} strokeWidth={2} strokeOpacity={0.7} />
		{/* 后面那条腿 */}
		<Limb d="M252 424 L316 428 L318 496" w={17} />
		{/* 大腿、小腿、鞋 */}
		<path d="M246 410 L326 410 C 336 412, 338 428, 332 436 L 252 438 C 240 434, 238 416, 246 410 Z" fill={BODY} {...edge} />
		<path d="M314 432 L334 432 L336 498 L316 498 Z" fill={BODY} {...edge} />
		<path d="M310 496 L338 496 C 348 497, 354 502, 354 508 L 310 508 Z" fill={BODY} {...edge} />
		<path d="M262 424 L322 424" {...fine} />
		{/* 外套 */}
		<path d="M248 338 C 256 329, 282 329, 292 338 L 300 380 L 298 420 L 246 424 C 238 400, 238 360, 248 338 Z" fill={BODY} {...edge} />
		<path d="M266 333 L275 352 L284 334 M280 352 L292 418 M248 404 L296 402" {...fine} />
		<rect x={252} y={360} width={14} height={9} {...fine} />
		{/* 脖子、头 */}
		<path d="M262 318 L266 334 L278 334 L278 318 Z" fill={FACE} {...edge} strokeWidth={1.8} />
		<Head x={272} y={300} tilt={9} />
		{/* 胳膊搭在桌上，手铐 */}
		<path d="M268 342 C 284 336, 296 348, 300 366 L 310 388 L 352 388 L 354 400 L 300 402 C 290 398, 286 390, 282 380 L 266 354 Z" fill={BODY} {...edge} />
		<path d="M300 392 L306 400" {...fine} />
		<path d="M352 388 C 362 386, 372 390, 372 396 C 368 401, 358 402, 352 400 Z" fill={FACE} {...edge} strokeWidth={1.8} />
		<circle cx={350} cy={394} r={5.5} fill="none" stroke={GOLD} strokeWidth={1.8} />
		<circle cx={361} cy={394} r={5.5} fill="none" stroke={GOLD} strokeWidth={1.8} />
	</g>
);

export type Outfit = 'police' | 'suspect' | 'suit';

// 站着的人（朝右，脚底 y=0）。reach：前臂往前伸（递东西 / 握手）；step：走路摆动 -1..1
export const StandingPerson: React.FC<{outfit: Outfit; reach?: number; step?: number}> = ({outfit, reach = 0, step = 0}) => {
	const s = step;
	const ex = mix(12, 50, reach), ey = mix(-170, -176, reach), hx = mix(14, 104, reach), hy = mix(-128, -112, reach);
	const foot = (fx: number) => `M${fx - 10} -10 L${fx + 10} -10 C ${fx + 20} -9, ${fx + 25} -4, ${fx + 25} 0 L ${fx - 10} 0 Z`;
	return (
		<g>
			{/* 后臂、后腿 */}
			<Limb d={`M-2 -214 L ${-8 - s * 12} -168 L ${-6 - s * 16} -128`} w={12} />
			<Limb d={`M-4 -112 L ${-4 - s * 10} -60 L ${-4 - s * 18} -12`} w={18} />
			<path d={foot(-4 - s * 18)} fill={BODY} {...edge} />
			{/* 前腿 */}
			<Limb d={`M6 -112 L ${6 + s * 10} -60 L ${6 + s * 18} -12`} w={19} />
			<path d={foot(6 + s * 18)} fill={BODY} {...edge} />
			{outfit === 'police' && <path d={`M10 -100 L ${10 + s * 18} -14`} {...fine} />}
			{/* 身体 */}
			<path d="M-20 -222 C -12 -231, 14 -231, 22 -222 L 27 -176 L 25 -112 L -20 -110 C -25 -148, -25 -192, -20 -222 Z" fill={BODY} {...edge} />
			{outfit === 'police' && (
				<g>
					<path d="M2 -226 L 8 -214 L 14 -226 M11 -214 L 15 -206 L 12 -170 L 8 -206 Z" {...fine} strokeOpacity={0.85} />
					<rect x={-21} y={-128} width={47} height={9} fill={BODY} {...edge} strokeWidth={1.6} />
					<rect x={14} y={-129} width={8} height={11} fill={GOLD} opacity={0.8} />
					<path d="M-14 -224 L 4 -224" {...fine} strokeWidth={3} strokeOpacity={0.7} />
					<path d="M18 -200 l 3 6 l 6 1 l -5 4 l 1 6 l -5 -3 l -5 3 l 1 -6 l -5 -4 l 6 -1 Z" fill={GOLD} opacity={0.85} />
					<path d="M2 -190 L 16 -190" {...fine} />
				</g>
			)}
			{outfit === 'suspect' && <path d="M2 -228 L 10 -210 L 18 -228 M12 -210 L 22 -116 M-18 -150 L 24 -150" {...fine} />}
			{outfit === 'suit' && <path d="M0 -228 L 12 -196 L 16 -228 M12 -196 L 24 -150 M10 -226 L 13 -216 L 10 -186 L 7 -216 Z" {...fine} strokeOpacity={0.85} />}
			{/* 脖子、头 */}
			<path d="M-6 -240 L -2 -226 L 10 -226 L 10 -240 Z" fill={FACE} {...edge} strokeWidth={1.8} />
			<Head x={2} y={-258} hat={outfit === 'police' ? 'cap' : outfit === 'suit' ? 'fedora' : undefined} />
			{/* 前臂 + 手 */}
			<Limb d={`M8 -214 L ${ex} ${ey} L ${hx} ${hy}`} w={13} />
			<circle cx={hx + (reach > 0.3 ? 7 : 1)} cy={hy + (reach > 0.3 ? 0 : 7)} r={7} fill={FACE} {...edge} strokeWidth={1.8} />
		</g>
	);
};
