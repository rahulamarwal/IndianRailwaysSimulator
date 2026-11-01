import { TrainState, StopScoreResult, CameraMode, StationEntry } from './types';
import { SIGNAL_NAMES } from './signals';
import { SignalSystem } from './signals';
import { getTrackCurve } from './curve';

export class HUD {
  private kmhEl: HTMLElement;
  private limEl: HTMLElement;
  private rvEl: HTMLElement;
  private ntEl: HTMLElement;
  private brEl: HTMLElement;
  private grEl: HTMLElement;
  private nxEl: HTMLElement;
  private tmEl: HTMLElement;
  private msgEl: HTMLElement;
  private cabVignetteEl: HTMLElement;
  private eqEl: HTMLElement;
  private vcdAlertEl: HTMLElement;
  private whistleEl: HTMLElement;

  // Mini-Map Elements
  private mapCanvas: HTMLCanvasElement | null;
  private mapCtx: CanvasRenderingContext2D | null;
  private mapNextEl: HTMLElement | null;
  private mapProgEl: HTMLElement | null;

  constructor() {
    this.kmhEl = document.getElementById('kmh')!;
    this.limEl = document.getElementById('lim')!;
    this.rvEl = document.getElementById('rv')!;
    this.ntEl = document.getElementById('nt')!;
    this.brEl = document.getElementById('br')!;
    this.grEl = document.getElementById('gr')!;
    this.nxEl = document.getElementById('nx')!;
    this.tmEl = document.getElementById('tm')!;
    this.msgEl = document.getElementById('msg')!;
    this.cabVignetteEl = document.getElementById('cab')!;
    this.eqEl = document.getElementById('eq')!;
    this.vcdAlertEl = document.getElementById('vcd-alert')!;
    this.whistleEl = document.getElementById('whistle-prompt')!;

    this.mapCanvas = document.getElementById('map-canvas') as HTMLCanvasElement;
    this.mapCtx = this.mapCanvas ? this.mapCanvas.getContext('2d') : null;
    this.mapNextEl = document.getElementById('map-next');
    this.mapProgEl = document.getElementById('map-prog');
  }

  public showStartBanner(routeName = 'Lonavala to Pune & Daund Junction'): void {
    this.msgEl.style.display = 'block';
    this.msgEl.innerHTML =
      `<b>${routeName}</b><br>Press <b>W / ↑</b> to notch up and depart. Stops: Shivaji Nagar, Pune Jn, Uruli, Daund Jn.<br>` +
      `<span style="font-size: 13px; color: var(--mut); margin-top: 4px; display: inline-block;">Stops at stations will NOT end the journey &bull; Press <b>P</b> to Park / End Journey & view score.</span>`;
  }

  public hideBanner(): void {
    this.msgEl.style.display = 'none';
  }

  public showFinishCard(scoreResult: StopScoreResult): void {
    this.msgEl.style.display = 'block';
    this.msgEl.innerHTML =
      `<b>${scoreResult.statusText}</b><br>` +
      `Trip Time: <b>${scoreResult.timeFormatted}</b> &bull; Overspeed: <b>${scoreResult.overspeedSeconds.toFixed(1)} s</b> &bull; Trip Score: <b>${scoreResult.score} / 1000</b><br>` +
      `<span style="font-size: 13px; color: var(--mut); margin-top: 6px; display: inline-block;">Press <b>P</b> or <b>W / ↑</b> to resume journey &bull; Press <b>R</b> to restart route</span>`;
  }

  public setCameraMode(mode: CameraMode): void {
    this.cabVignetteEl.style.display = mode === CameraMode.TRACK ? 'block' : 'none';
  }

  public renderRouteMap(trainDistance: number, stations: StationEntry[], totalDistance: number): void {
    if (!this.mapCtx || !this.mapCanvas) return;
    const ctx = this.mapCtx;
    const w = this.mapCanvas.width;   // 520
    const h = this.mapCanvas.height;  // 216

    // 1. Clear & Background
    ctx.fillStyle = '#080d1a';
    ctx.fillRect(0, 0, w, h);

    const padLeft = 32;
    const padRight = 32;
    const trackW = w - padLeft - padRight; // 456
    const baseMidY = 126;
    const lateralScale = 1.15;

    // Helper: convert track distance Z to canvas pixel coordinates
    const toScreen = (z: number) => {
      const norm = Math.max(0, Math.min(1, z / totalDistance));
      const px = padLeft + norm * trackW;
      const pt = getTrackCurve(z);
      const py = baseMidY - pt.x * lateralScale;
      return { px, py, pt };
    };

    // 2. Landscape Zones Tints (Ghats Nature vs Industrial Corridor)
    // Pune Jn is at z = 3900m
    const puneNorm = Math.min(1, 3900 / totalDistance);
    const puneScreenX = padLeft + puneNorm * trackW;

    // Nature Zone (Lonavala to Pune)
    const natureGrad = ctx.createLinearGradient(padLeft, 0, puneScreenX, 0);
    natureGrad.addColorStop(0, 'rgba(16, 75, 40, 0.45)');
    natureGrad.addColorStop(1, 'rgba(16, 75, 40, 0.18)');
    ctx.fillStyle = natureGrad;
    ctx.fillRect(0, 0, puneScreenX, h);

    // Industrial Zone (Pune to Daund)
    const indGrad = ctx.createLinearGradient(puneScreenX, 0, w, 0);
    indGrad.addColorStop(0, 'rgba(180, 83, 9, 0.22)');
    indGrad.addColorStop(1, 'rgba(51, 65, 85, 0.38)');
    ctx.fillStyle = indGrad;
    ctx.fillRect(puneScreenX, 0, w - puneScreenX, h);

    // Zone Header Labels
    ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, Arial';
    ctx.fillStyle = '#4ade80';
    ctx.fillText('🌲 GHATS NATURE', padLeft + 4, 22);

    ctx.fillStyle = '#f59e0b';
    ctx.fillText('🏭 INDUSTRIAL CORRIDOR', puneScreenX + 10, 22);

    // Zone boundary vertical dashed divider
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(puneScreenX, 0);
    ctx.lineTo(puneScreenX, h);
    ctx.stroke();
    ctx.setLineDash([]);

    // 3. Render Curved Double Track
    // Track 2 (Parallel Up Line): Drawn first in subdued grey
    ctx.beginPath();
    for (let z = 0; z <= totalDistance; z += 40) {
      const { px, py } = toScreen(z);
      if (z === 0) ctx.moveTo(px, py + 5.5);
      else ctx.lineTo(px, py + 5.5);
    }
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2.0;
    ctx.stroke();

    // Track 1 (Down Line - Train Path): Glowing Cyan Line
    ctx.beginPath();
    for (let z = 0; z <= totalDistance; z += 40) {
      const { px, py } = toScreen(z);
      if (z === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3.2;
    ctx.stroke();

    // 4. Render Station Stops & Ticks
    const stationCodes: Record<string, string> = {
      'LONAVALA': 'LNL',
      'SHIVAJI NAGAR': 'SVJR',
      'PUNE JN': 'PUNE',
      'URULI': 'URI',
      'DAUND JN': 'DD'
    };

    stations.forEach(st => {
      const midZ = (st.startZ + st.endZ) / 2;
      const { px, py } = toScreen(midZ);
      const isPassed = trainDistance > st.endZ;
      const isCurrent = trainDistance >= st.startZ && trainDistance <= st.endZ;

      // Platform Marker tick
      ctx.strokeStyle = isPassed ? '#22c55e' : isCurrent ? '#f59e0b' : '#94a3b8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(px, py - 9);
      ctx.lineTo(px, py + 12);
      ctx.stroke();

      // Station Circle
      ctx.fillStyle = isPassed ? '#22c55e' : isCurrent ? '#f59e0b' : '#ffffff';
      ctx.beginPath();
      ctx.arc(px, py, 4, 0, Math.PI * 2);
      ctx.fill();

      // Station Code Badge
      const code = stationCodes[st.name] || st.name.substring(0, 4);
      ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, Arial';
      ctx.textAlign = 'center';
      ctx.fillStyle = isPassed ? '#4ade80' : isCurrent ? '#facc15' : '#e2e8f0';
      ctx.fillText(code, px, py - 14);
    });

    // 5. Animated Train Indicator
    const trainScreen = toScreen(trainDistance);
    const pulse = (Date.now() % 1200) / 1200;
    const ringRadius = 5 + pulse * 12;

    // Outer radar ring
    ctx.strokeStyle = `rgba(239, 68, 68, ${1 - pulse})`;
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.arc(trainScreen.px, trainScreen.py, ringRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Inner bright train dot
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(trainScreen.px, trainScreen.py, 5.0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(trainScreen.px, trainScreen.py, 2.0, 0, Math.PI * 2);
    ctx.fill();

    // 6. Next Station & Progress Telemetry Update
    if (this.mapNextEl && this.mapProgEl) {
      let nextSt: StationEntry | null = null;
      let atSt: StationEntry | null = null;

      for (const st of stations) {
        if (trainDistance >= st.startZ && trainDistance <= st.endZ) {
          atSt = st;
          break;
        } else if (trainDistance < st.startZ) {
          nextSt = st;
          break;
        }
      }

      if (atSt) {
        this.mapNextEl.innerHTML = `At Station: <b style="color: #22c55e">${atSt.name}</b>`;
      } else if (nextSt) {
        const dist = Math.max(0, Math.round(nextSt.startZ - trainDistance));
        this.mapNextEl.innerHTML = `Next: <b>${nextSt.name}</b> (${dist} m)`;
      } else {
        this.mapNextEl.innerHTML = `Approaching: <b>Daund Jn Terminus</b>`;
      }

      const progPct = Math.min(100, Math.max(0, Math.round((trainDistance / totalDistance) * 100)));
      const distKm = (trainDistance / 1000).toFixed(1);
      const totKm = (totalDistance / 1000).toFixed(1);
      this.mapProgEl.textContent = `${distKm} / ${totKm} km (${progPct}%)`;
    }
  }

  public update(
    state: TrainState,
    speedLimitKmh: number,
    grade: number,
    signals: SignalSystem,
    stopTargetDistance: number,
    stations?: StationEntry[],
    routeEndZ?: number
  ): void {
    const speedKmh = Math.abs(state.v) * 3.6;
    const isOverspeed = speedKmh > speedLimitKmh + 2;

    this.kmhEl.textContent = Math.round(speedKmh).toString();
    this.kmhEl.className = isOverspeed ? 'bad' : '';

    this.limEl.textContent = `Limit ${speedLimitKmh} km/h`;
    this.limEl.className = isOverspeed ? 'bad' : '';

    const revText = state.dir === 1 ? 'FORWARD' : 'REVERSE';
    this.rvEl.innerHTML = `Reverser: <b style="color: ${state.dir === 1 ? '#4ade80' : '#f59e0b'}">${revText}</b> [F]`;

    this.ntEl.textContent = `Throttle notch ${state.n} of 8`;

    const bPct = Math.round(state.b * 100);
    if (state.vcdPenalty) {
      this.brEl.innerHTML = `Brake: <b style="color: #ef4444">VCD PENALTY EMERGENCY (BP: ${state.bpPressure.toFixed(2)} kg/cm²)</b>`;
    } else if (state.em) {
      this.brEl.innerHTML = `Brake: <b style="color: #ef4444">EMERGENCY (BP: ${state.bpPressure.toFixed(2)} kg/cm²)</b>`;
    } else if (bPct > 0 || state.bc > 0) {
      this.brEl.innerHTML = `Brake: <b style="color: ${bPct > 60 ? '#ef4444' : '#f59e0b'}">${bPct}%</b> &bull; BP: <b>${state.bpPressure.toFixed(2)}</b> &bull; BC: <b>${state.bcPressure.toFixed(2)}</b> kg/cm²`;
    } else {
      this.brEl.innerHTML = `Brake: Released (0%) &bull; BP: <b>${state.bpPressure.toFixed(2)}</b> kg/cm²`;
    }

    // Equipment & Safety status line
    const vcdText = state.vcdPenalty
      ? '<span style="color: #ef4444; font-weight: 700;">PENALTY</span>'
      : state.vcdVisual || state.vcdAudio
      ? '<span style="color: #facc15; font-weight: 700;">ALERT</span>'
      : '<span style="color: #4ade80;">Normal</span>';

    const lightText = state.headlights ? '<span style="color: #facc15;">ON</span>' : 'OFF';
    const wiperText = state.wipers ? '<span style="color: #38bdf8;">ON</span>' : 'OFF';
    this.eqEl.innerHTML = `Headlights: <b>${lightText}</b> [L] &bull; Wipers: <b>${wiperText}</b> [X] &bull; VCD: <b>${vcdText}</b> [V]`;

    // Dynamic VCD Alert Banner
    if (state.vcdPenalty) {
      this.vcdAlertEl.style.display = 'block';
      this.vcdAlertEl.style.background = 'rgba(185, 28, 28, 0.95)';
      this.vcdAlertEl.innerHTML = '🚨 VCD PENALTY EMERGENCY BRAKE APPLIED &bull; PRESS <b>[V]</b> TO RESET';
    } else if (state.vcdAudio) {
      this.vcdAlertEl.style.display = 'block';
      this.vcdAlertEl.style.background = 'rgba(220, 38, 38, 0.95)';
      this.vcdAlertEl.innerHTML = '🚨 VCD VIGILANCE ALARM BUZZER &bull; PRESS <b>[V]</b> TO ACKNOWLEDGE';
    } else if (state.vcdVisual) {
      this.vcdAlertEl.style.display = 'block';
      this.vcdAlertEl.style.background = 'rgba(217, 119, 6, 0.95)';
      this.vcdAlertEl.innerHTML = '⚠️ VCD VIGILANCE LAMP ACTIVE &bull; PRESS <b>[V]</b> TO ACKNOWLEDGE PEDAL';
    } else {
      this.vcdAlertEl.style.display = 'none';
    }

    // Whistle Board Prompt
    const whistle = signals.getApproachingWhistleBoard(state.s);
    if (whistle) {
      this.whistleEl.style.display = 'block';
      const boardLabel = whistle.text === 'W/L' ? 'W/L (सी/फा - फाटक)' : 'W (सी - सीटी)';
      this.whistleEl.innerHTML = `📯 WHISTLE BOARD <b>${boardLabel}</b> IN ${whistle.distanceMeters} m &bull; SOUND HORN <b>[H]</b>`;
    } else {
      this.whistleEl.style.display = 'none';
    }

    if (grade !== 0) {
      const dir = grade > 0 ? 'Rising' : 'Falling';
      const slopeRatio = Math.round(1 / Math.abs(grade));
      this.grEl.textContent = `${dir} 1 in ${slopeRatio}`;
    } else {
      this.grEl.textContent = 'Level track';
    }

    const nextSignal = signals.getNextSignal(state.s);
    if (nextSignal) {
      const aspectName = SIGNAL_NAMES[nextSignal.signal.aspect];
      this.nxEl.textContent = `Signal: ${aspectName}, ${nextSignal.distanceMeters} m`;
    } else {
      this.nxEl.textContent = 'No signal ahead';
    }

    const min = Math.floor(state.t / 60);
    const sec = String(Math.floor(state.t % 60)).padStart(2, '0');
    const toStopMark = Math.max(0, Math.round(stopTargetDistance - state.s));
    this.tmEl.textContent = `Time ${min}:${sec}. To stop mark ${toStopMark} m`;

    // Render Route Map
    if (stations && routeEndZ) {
      this.renderRouteMap(state.s, stations, routeEndZ);
    }
  }
}
