import type {VoiceData} from './timeline.ts';

// 由 scripts/tts.py（npm run voice）根据 narration.json 生成，不要手改。
// null 表示不配音：时间轴和字幕使用 data.ts 中的固定值。
export const VOICE: VoiceData | null = null;
