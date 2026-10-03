import React from 'react';
import {Composition} from 'remotion';
import {SolarCinematic} from './cinematic/SolarCinematic';
import {TOTAL, FPS} from './cinematic/data';

export const RemotionRoot: React.FC = () => {
	return (
		<Composition id="Main" component={SolarCinematic} durationInFrames={TOTAL} fps={FPS} width={1920} height={1080} defaultProps={{}} />
	);
};
