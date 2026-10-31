export type SignalAspect = 'DY' | 'Y' | 'G' | 'R';

export interface GradientEntry {
  s: number;
  grade: number;
}

export interface SpeedLimitEntry {
  s: number;
  limitKmh: number;
}

export interface SignalEntry {
  z: number;
  aspect: SignalAspect;
}

export interface BoardEntry {
  z: number;
  text: string;
  bg: string;
}

export interface StationEntry {
  name: string;
  devanagari: string;
  startZ: number;
  endZ: number;
}

export interface TrackConfig {
  startZ: number;
  endZ: number;
  gauge: number;
  sleeperSpacing: number;
  mastSpacing: number;
  contactWireY: number;
  catenaryWireY: number;
}

export interface TrainConfig {
  massKg: number;
  coaches: number;
  maxNotch: number;
  maxPowerWatts: number;
  maxStartingTractiveEffortN: number;
}

export interface RouteData {
  id: string;
  name: string;
  startDistance: number;
  stopTargetDistance: number;
  platformEndDistance: number;
  track: TrackConfig;
  train: TrainConfig;
  gradients: GradientEntry[];
  speedLimits: SpeedLimitEntry[];
  signals: SignalEntry[];
  boards: BoardEntry[];
  stations: StationEntry[];
}

export interface TrainState {
  s: number;       // position (meters)
  v: number;       // velocity (m/s)
  n: number;       // throttle notch (0 to 8)
  bc: number;      // commanded brake (0 to 1)
  b: number;       // actual brake cylinder pressure (0 to 1)
  t: number;       // active running time (seconds)
  os: number;      // cumulative overspeed time (seconds)
  done: boolean;   // completed / stopped
  run: boolean;    // started motion
  em: boolean;     // emergency brake engaged
  dir: number;     // reverser direction: 1 = Forward, -1 = Reverse
}

export enum CameraMode {
  TRACK = 0,   // Clean forward track view (unobstructed windscreen POV)
  CHASE = 1,   // Third-person exterior chase view
  CAB_3D = 2   // Interactive 3D loco cockpit interior view
}

export interface StopScoreResult {
  done: boolean;
  score: number;
  timeFormatted: string;
  overspeedSeconds: number;
  errorMeters: number;
  statusText: string;
}
