import {
  PoseLandmarker,
  DrawingUtils,
  FilesetResolver,
  PoseLandmarkerResult,
} from '@mediapipe/tasks-vision';

export type LandmarkList = { x: number; y: number; z: number; visibility?: number }[];
export { DrawingUtils, PoseLandmarker };

// Pinned to exact version — prevents silent breakage from CDN `@latest` drift
const MEDIAPIPE_WASM_URL =
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm';

// Full model — significantly better accuracy vs lite, still real-time at 30fps on modern hardware
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task';

export type DetectorState = 'idle' | 'loading' | 'ready' | 'error';

export class PoseDetector {
  private landmarker: PoseLandmarker | null = null;
  private lastVideoTime = -1;
  state: DetectorState = 'idle';
  error: string | null = null;

  async init(): Promise<void> {
    this.state = 'loading';
    try {
      const vision = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_URL);
      this.landmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: MODEL_URL,
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numPoses: 1,
        minPoseDetectionConfidence: 0.6,
        minPosePresenceConfidence: 0.6,
        minTrackingConfidence: 0.6,
      });
      this.state = 'ready';
    } catch (err) {
      this.state = 'error';
      this.error = (err as Error).message;
      throw err;
    }
  }

  /**
   * Returns raw landmarks AND the full result (for DrawingUtils).
   */
  detectFull(video: HTMLVideoElement): PoseLandmarkerResult | null {
    if (this.state !== 'ready' || video.readyState < 2) return null;
    if (video.currentTime === this.lastVideoTime) return null;
    this.lastVideoTime = video.currentTime;
    return this.landmarker!.detectForVideo(video, performance.now());
  }

  detect(video: HTMLVideoElement): LandmarkList | null {
    const result = this.detectFull(video);
    return result?.landmarks?.[0] ?? null;
  }
}
