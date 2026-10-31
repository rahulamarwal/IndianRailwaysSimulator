import { TrainState, StopScoreResult, CameraMode } from './types';
import { SIGNAL_NAMES } from './signals';
import { SignalSystem } from './signals';

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
  }

  public showStartBanner(routeName = 'Pune Jn to Daund Jn (Double Track Electrified Mainline)'): void {
    this.msgEl.style.display = 'block';
    this.msgEl.innerHTML =
      `<b>${routeName}</b><br>Press W or ↑ to notch up and depart. Stop beside the STOP board at Daund Junction.`;
  }

  public hideBanner(): void {
    this.msgEl.style.display = 'none';
  }

  public showFinishCard(scoreResult: StopScoreResult): void {
    this.msgEl.style.display = 'block';
    this.msgEl.innerHTML =
      `<b>${scoreResult.statusText}</b><br>` +
      `Time ${scoreResult.timeFormatted}. Overspeed ${scoreResult.overspeedSeconds.toFixed(1)} s. ` +
      `Score ${scoreResult.score}.<br>Press R to drive again.`;
  }

  public setCameraMode(mode: CameraMode): void {
    this.cabVignetteEl.style.display = mode === CameraMode.TRACK ? 'block' : 'none';
  }

  public update(
    state: TrainState,
    speedLimitKmh: number,
    grade: number,
    signals: SignalSystem,
    stopTargetDistance: number
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
    if (state.em) {
      this.brEl.innerHTML = `Brake: <b style="color: #ef4444">EMERGENCY (100%)</b>`;
    } else if (bPct > 0 || state.bc > 0) {
      this.brEl.innerHTML = `Brake: <b style="color: ${bPct > 60 ? '#ef4444' : '#f59e0b'}">${bPct}%</b> (Q to Apply, E to Release)`;
    } else {
      this.brEl.innerHTML = `Brake: Released (0%)`;
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
  }
}
