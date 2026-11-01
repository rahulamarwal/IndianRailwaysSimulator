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
  bpPressure: number; // Brake Pipe pressure (kg/cm²: 5.0 normal, 3.4 full service, 0 emergency)
  bcPressure: number; // Brake Cylinder pressure (kg/cm²: 0 released, up to 3.5 applied)
  fpPressure: number; // Feed Pipe pressure (kg/cm²: 6.0 constant)
  mrPressure: number; // Main Reservoir pressure (kg/cm²: 9.8 nominal)
  vcdTimer: number;   // Vigilance Control Device timer (0 to 76s)
  vcdVisual: boolean; // VCD yellow warning lamp flash (60s - 76s)
  vcdAudio: boolean;  // VCD loud warning buzzer (68s - 76s)
  vcdPenalty: boolean;// VCD emergency penalty brake applied
  headlights: boolean;// Locomotive high-beam headlights (L toggle)
  wipers: boolean;    // Windshield wipers active (X toggle)
  pantographArc: boolean; // Momentary pantograph electric arc flash
  currentStationName: string | null; // Station name if inside platform
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
