import React, {useMemo} from 'react';
import * as THREE from 'three';
import {useThree} from '@react-three/fiber';
import {ThreeCanvas} from '@remotion/three';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import type {Planet} from './data';
import {planetTextures, ringTexture, ringGeometry, glowTexture} from './textures';

export type Vec3 = [number, number, number];
export const FOV = 30;

// 相机：每帧直接设定位置，画面只由帧号决定
export const Rig: React.FC<{pos: Vec3; target: Vec3}> = ({pos, target}) => {
	const {camera} = useThree();
	camera.position.set(...pos);
	camera.lookAt(...target);
	camera.updateMatrixWorld();
	return null;
};

export const Stage: React.FC<{children: React.ReactNode}> = ({children}) => (
	<ThreeCanvas
		width={1920}
		height={1080}
		flat
		gl={{antialias: true, alpha: true}}
		camera={{fov: FOV, near: 0.1, far: 300, position: [0, 0, 9]}}
		style={{position: 'absolute', inset: 0}}
	>
		{children}
	</ThreeCanvas>
);

// 柔和的环境反射。金属材质（棋子、硬币、奖杯等 metalness 较高的物体）没有环境可反射时，
// 背光的一半会直接发黑；放进 <Stage> 即可。行星这类非金属物体不需要。
export const Environment: React.FC<{intensity?: number}> = ({intensity = 0.22}) => {
	const {gl, scene} = useThree();
	const tex = useMemo(() => {
		const pm = new THREE.PMREMGenerator(gl);
		const t = pm.fromScene(new RoomEnvironment(), 0.04).texture;
		pm.dispose();
		return t;
	}, [gl]);
	scene.environment = tex;
	scene.environmentIntensity = intensity;
	return null;
};

export const Lights: React.FC<{key1?: number; rim?: number}> = ({key1 = 3.2, rim = 1.6}) => (
	<>
		<ambientLight intensity={0.05} />
		<directionalLight position={[-5, 2.4, 4]} intensity={key1} color="#fff0d8" />
		<directionalLight position={[4.5, 1.2, -5]} intensity={rim} color="#ffb257" />
	</>
);

const vert = `varying vec3 vN; varying vec3 vV;
void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`;

// 金色描边（正面菲涅尔）
function rimMaterial(color: string, strength: number) {
	return new THREE.ShaderMaterial({
		uniforms: {c: {value: new THREE.Color(color)}, k: {value: strength}},
		vertexShader: vert,
		fragmentShader: `uniform vec3 c; uniform float k; varying vec3 vN; varying vec3 vV;
void main(){ float f = pow(1.0 - max(dot(vN, vV), 0.0), 3.5); gl_FragColor = vec4(c, clamp(f * k, 0.0, 1.0)); }`,
		blending: THREE.AdditiveBlending, transparent: true, depthWrite: false,
	});
}
// 大气辉光（背面）
function atmoMaterial(color: string, strength: number) {
	return new THREE.ShaderMaterial({
		uniforms: {c: {value: new THREE.Color(color)}, k: {value: strength}},
		vertexShader: vert,
		fragmentShader: `uniform vec3 c; uniform float k; varying vec3 vN; varying vec3 vV;
void main(){ float f = pow(clamp(0.78 + dot(vN, vV), 0.0, 1.0), 5.0); gl_FragColor = vec4(c, clamp(f * k, 0.0, 1.0)); }`,
		blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, side: THREE.BackSide,
	});
}

export const PlanetBody: React.FC<{p: Planet; t: number; phase?: number; texSize?: number; detail?: number; simple?: boolean}> = ({p, t, phase = 0, texSize = 1024, detail = 128, simple = false}) => {
	const tex = useMemo(() => planetTextures(p.texture, texSize), [p.texture, texSize]);
	const rim = useMemo(() => rimMaterial('#ffc878', 0.55), []);
	const atmo = useMemo(() => (p.atmo ? atmoMaterial(p.atmo, 0.9) : null), [p.atmo]);
	const ring = useMemo(() => {
		if (p.texture === 'saturn') return {geo: ringGeometry(1.24, 2.27), map: ringTexture('saturn')};
		if (p.texture === 'uranus') return {geo: ringGeometry(1.6, 1.95), map: ringTexture('uranus')};
		return null;
	}, [p.texture]);
	const spin = phase + p.spin * t;
	return (
		<group scale={p.R} rotation={[0, 0, (p.tilt * Math.PI) / 180]}>
			<mesh rotation={[0, spin, 0]}>
				<sphereGeometry args={[1, detail, detail / 2]} />
				<meshStandardMaterial map={tex.map} bumpMap={tex.bump ?? null} bumpScale={tex.bump ? 2.2 : 0} roughness={1} metalness={0} />
			</mesh>
			{tex.clouds && (
				<mesh rotation={[0, spin * 1.25 + 0.6, 0]} scale={1.012}>
					<sphereGeometry args={[1, detail, detail / 2]} />
					<meshStandardMaterial map={tex.clouds} transparent depthWrite={false} roughness={1} />
				</mesh>
			)}
			{!simple && (
				<mesh scale={1.002} material={rim}>
					<sphereGeometry args={[1, 64, 32]} />
				</mesh>
			)}
			{atmo && (
				<mesh scale={1.1} material={atmo}>
					<sphereGeometry args={[1, 64, 32]} />
				</mesh>
			)}
			{ring && (
				<mesh geometry={ring.geo} rotation={[-Math.PI / 2, 0, 0]}>
					<meshStandardMaterial map={ring.map} transparent side={THREE.DoubleSide} depthWrite={false} roughness={1} />
				</mesh>
			)}
		</group>
	);
};

export const Sun: React.FC<{t: number; scale?: number; glow?: number}> = ({t, scale = 1, glow = 1}) => {
	const tex = useMemo(() => planetTextures('sun', 512), []);
	const g = useMemo(() => glowTexture(), []);
	const halos: [number, string, number][] = [[2.6, '#ffd27a', 0.9], [4.6, '#ff9a3c', 0.45], [9, '#c8742a', 0.22]];
	return (
		<group scale={scale}>
			<mesh rotation={[0.2, t * 0.05, 0]}>
				<sphereGeometry args={[1, 96, 48]} />
				<meshBasicMaterial map={tex.map} toneMapped={false} />
			</mesh>
			{halos.map(([s, c, o], i) => (
				<sprite key={i} scale={[s, s, 1]}>
					<spriteMaterial map={g} color={c} transparent opacity={o * glow * (1 + 0.04 * Math.sin(t * 1.3 + i))} blending={THREE.AdditiveBlending} depthWrite={false} />
				</sprite>
			))}
		</group>
	);
};

export const OrbitLine: React.FC<{r: number; opacity?: number}> = ({r, opacity = 0.35}) => {
	const obj = useMemo(() => {
		const pts: THREE.Vector3[] = [];
		for (let i = 0; i < 256; i++) { const a = (i / 256) * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r)); }
		const geo = new THREE.BufferGeometry().setFromPoints(pts);
		return new THREE.LineLoop(geo, new THREE.LineBasicMaterial({color: '#d9a54a', transparent: true, opacity}));
	}, [r, opacity]);
	return <primitive object={obj} />;
};

// 把 3D 点投影到 1920×1080 画面坐标，给 2D 装饰层定位用
export function project(camPos: Vec3, target: Vec3, point: Vec3) {
	const cam = new THREE.PerspectiveCamera(FOV, 16 / 9, 0.1, 300);
	cam.position.set(...camPos); cam.lookAt(...target); cam.updateMatrixWorld(); cam.updateProjectionMatrix();
	const v = new THREE.Vector3(...point).project(cam);
	const dist = new THREE.Vector3(...camPos).distanceTo(new THREE.Vector3(...point));
	return {x: (v.x + 1) * 960, y: (1 - v.y) * 540, k: 540 / (dist * Math.tan((FOV * Math.PI) / 360))};
}
