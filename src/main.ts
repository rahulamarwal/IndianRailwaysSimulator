import { setupRenderer } from './renderer';
import { TrainPhysics } from './physics';
import { buildTrack } from './track';
import { buildScenery } from './scenery';
import { buildStations } from './stations';
import { SignalSystem } from './signals';
import { buildTrain } from './train';
import { AudioController } from './audio';
import { HUD } from './hud';
import { CameraMode, RouteData } from './types';
import { getTrackCurve } from './curve';
import routeDataJson from './data/lonavala-pune-daund.json';

const route: RouteData = routeDataJson as RouteData;

// Setup WebGL Context & Three.js Scene
const container = document.getElementById('c')!;
const ctx = setupRenderer(container);

// Build World Elements
buildTrack(ctx, route.track);
buildScenery(ctx, route.track);
buildStations(ctx, route.stations);
const signalSystem = new SignalSystem(ctx, route.signals, route.boards);
const trainAssembly = buildTrain(ctx, route.train);

// Initialize Systems
const physics = new TrainPhysics(route);
const audio = new AudioController();
const hud = new HUD();

let cameraMode: CameraMode = CameraMode.TRACK;
const keys: Record<string, boolean> = {};

function applyCamera(s: number, v: number): void {
  const { camera } = ctx;
  const headBob = Math.sin(s * 0.9) * 0.012 * Math.min(Math.abs(v) / 20, 1);

  if (cameraMode === CameraMode.TRACK) {
    // POV 1: Clean forward track driver view (unobstructed windscreen with 2D vignette)
    const wsZ = s - 2.2;
    const pt = getTrackCurve(wsZ);
    const nx = Math.cos(pt.yaw);
    const nz = -Math.sin(pt.yaw);

    const camX = pt.x + 0.55 * nx;
    const camZ = wsZ + 0.55 * nz;
    camera.position.set(camX, 3.95 + headBob, camZ);

    const lookAheadZ = s + 65;
    const ptLook = getTrackCurve(lookAheadZ);
    camera.lookAt(ptLook.x + 0.2, 3.6, lookAheadZ);
  } else if (cameraMode === CameraMode.CHASE) {
    // POV 2: Cinematic exterior chase view tracking behind the curving train
    const chaseZ = s - 75;
    const ptChase = getTrackCurve(chaseZ);
    const ptLoco = getTrackCurve(s - 10);
    const nx = Math.cos(ptChase.yaw);
    const nz = -Math.sin(ptChase.yaw);

    const camX = ptChase.x - 13.0 * nx;
    const camZ = chaseZ - 13.0 * nz;
    camera.position.set(camX, 7.0, camZ);
    camera.lookAt(ptLoco.x, 2.5, s - 30);
  } else {
    // POV 3: 3D interactive cab cockpit view following locomotive heading and banking
    const ptLoco = getTrackCurve(s - 10);
    const cosY = Math.cos(ptLoco.yaw);
    const sinY = Math.sin(ptLoco.yaw);

    const localX = -0.72;
    const localZ = 7.85;

    const worldX = ptLoco.x + localX * cosY + localZ * sinY;
    const worldZ = (s - 10) - localX * sinY + localZ * cosY;
    const worldY = 3.70 + headBob - localX * Math.sin(ptLoco.cant);
    camera.position.set(worldX, worldY, worldZ);

    const lookDist = 40;
    const lookLocalZ = localZ + lookDist;
    const lookX = ptLoco.x + localX * cosY + lookLocalZ * sinY;
    const lookZ = (s - 10) - localX * sinY + lookLocalZ * cosY;
    camera.lookAt(lookX, 3.44, lookZ);
  }

  trainAssembly.setCameraMode(cameraMode);
}

function handleReset(): void {
  physics.reset();
  trainAssembly.setPositionZ(physics.state.s);
  applyCamera(physics.state.s, physics.state.v);
  hud.showStartBanner(route.name);
}

// Input Handling
window.addEventListener('keydown', e => {
  audio.init();
  keys[e.code] = true;

  if (e.repeat) return;

  if (e.code === 'Space') {
    e.preventDefault();
    physics.triggerEmergency();
  } else if (e.code === 'KeyW' || e.code === 'ArrowUp') {
    e.preventDefault();
    physics.notchUp();
  } else if (e.code === 'KeyS' || e.code === 'ArrowDown') {
    e.preventDefault();
    physics.notchDown();
  } else if (e.code === 'KeyQ') {
    e.preventDefault();
    physics.applyBrakeStep();
  } else if (e.code === 'KeyE') {
    e.preventDefault();
    physics.releaseBrakeStep();
  } else if (e.code === 'KeyF') {
    e.preventDefault();
    physics.toggleReverser();
  } else if (e.code === 'KeyC') {
    cameraMode = (cameraMode + 1) % 3;
    hud.setCameraMode(cameraMode);
    applyCamera(physics.state.s, physics.state.v);
  } else if (e.code === 'KeyR') {
    handleReset();
  } else if (e.code === 'KeyH') {
    audio.startHorn();
  }
});

window.addEventListener('keyup', e => {
  keys[e.code] = false;
  if (e.code === 'KeyH') {
    audio.stopHorn();
  }
});

// Initial Setup
handleReset();
hud.setCameraMode(cameraMode);

// Main Game Loop
let lastTime = performance.now();

function animate(now: number): void {
  requestAnimationFrame(animate);

  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;

  const prevMoving = physics.state.run;
  const justFinished = physics.update(dt, Boolean(keys['KeyQ']), Boolean(keys['KeyE']));

  if (!prevMoving && physics.state.run) {
    hud.hideBanner();
  }

  if (justFinished) {
    hud.showFinishCard(physics.getStopScore());
  }

  const { s, v } = physics.state;
  const absSpeedKmh = Math.abs(v) * 3.6;

  // Sync 3D train position along track curves
  trainAssembly.setPositionZ(s);

  // Sync Camera
  applyCamera(s, v);

  // Update Dynamic Sun Shadow Frustum & Sky Dome
  ctx.updateSunPosition(s);

  // Update In-Cab 3D Gauges and Instruments
  trainAssembly.updateCabInstruments(physics.state, absSpeedKmh);

  // Audio update
  audio.update(Math.abs(v));

  // HUD and Mini-Map update
  const currentLimit = physics.getSpeedLimitKmh(s);
  const currentGrade = physics.getGrade(s);
  hud.update(physics.state, currentLimit, currentGrade, signalSystem, route.stopTargetDistance, route.stations, route.track.endZ);

  // Render Frame
  ctx.renderer.render(ctx.scene, ctx.camera);
}

requestAnimationFrame(animate);
