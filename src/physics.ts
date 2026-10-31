import { RouteData, TrainState, StopScoreResult } from './types';

export class TrainPhysics {
  public state: TrainState;
  private route: RouteData;
  private readonly g = 9.81;

  constructor(route: RouteData) {
    this.route = route;
    this.state = this.createInitialState();
  }

  public createInitialState(): TrainState {
    return {
      s: this.route.startDistance,
      v: 0,
      n: 0,
      bc: 0,
      b: 0,
      t: 0,
      os: 0,
      done: false,
      run: false,
      em: false,
      dir: 1
    };
  }

  public reset(): void {
    this.state = this.createInitialState();
  }

  public toggleReverser(): boolean {
    if (Math.abs(this.state.v) <= 0.3) {
      this.state.dir = this.state.dir === 1 ? -1 : 1;
      return true;
    }
    return false;
  }

  public getGrade(s: number): number {
    // Traverse gradients in descending order of distance
    for (let i = this.route.gradients.length - 1; i >= 0; i--) {
      if (s >= this.route.gradients[i].s) {
        return this.route.gradients[i].grade;
      }
    }
    return 0;
  }

  public getSpeedLimitKmh(s: number): number {
    for (let i = this.route.speedLimits.length - 1; i >= 0; i--) {
      if (s >= this.route.speedLimits[i].s) {
        return this.route.speedLimits[i].limitKmh;
      }
    }
    return 100;
  }

  public notchUp(): void {
    if (!this.state.done) {
      // Auto-release brakes if driver demands tractive notch
      if (this.state.bc > 0 || this.state.b > 0) {
        this.state.bc = 0;
        this.state.b = 0;
      }
      this.state.n = Math.min(this.route.train.maxNotch, this.state.n + 1);
    }
  }

  public notchDown(): void {
    if (this.state.n > 0) {
      this.state.n--;
    } else {
      // If throttle is already idle, tapping notch down applies service brake
      this.applyBrakeStep();
    }
  }

  public applyBrakeStep(): void {
    if (!this.state.done) {
      // Immediate traction interlock cut-off
      this.state.n = 0;
      if (this.state.bc < 0.3) {
        this.state.bc = 0.40; // Initial service reduction (BP 4.4 kg/cm²)
      } else if (this.state.bc < 0.7) {
        this.state.bc = 0.75; // Service application (BP 3.8 kg/cm²)
      } else {
        this.state.bc = 1.0;  // Full service application (BP 3.4 kg/cm²)
      }
    }
  }

  public releaseBrakeStep(): void {
    if (this.state.bc > 0.7) {
      this.state.bc = 0.35;
    } else {
      this.state.bc = 0;
    }
  }

  public triggerEmergency(): void {
    if (!this.state.done) {
      this.state.em = true;
      this.state.n = 0;
      this.state.bc = 1.0;
    }
  }

  public update(dt: number, applyBrakeKey: boolean, releaseBrakeKey: boolean): boolean {
    const st = this.state;
    if (st.done) return false;

    const m = this.route.train.massKg;
    const v = st.v;
    const absV = Math.abs(v);

    // Continuous brake handle control (while holding Q or E)
    if (applyBrakeKey) {
      st.n = 0; // Cut throttle whenever brake key is held
      st.bc = Math.min(1, st.bc + 1.2 * dt);
    }
    if (releaseBrakeKey) {
      st.bc = Math.max(0, st.bc - 1.5 * dt);
    }

    // Emergency brake logic
    if (st.em) {
      st.bc = 1.0;
      st.n = 0;
      if (absV < 0.05) {
        st.em = false;
        st.bc = 0;
      }
    }

    // Brake cylinder lag (0.6s emergency, 1.2s service apply, 2.0s graduated release)
    const tau = st.em ? 0.6 : (st.bc > st.b ? 1.2 : 2.0);
    st.b += (st.bc - st.b) * (1 - Math.exp(-dt / tau));
    if (st.bc === 0 && st.b < 0.01) {
      st.b = 0;
    }

    // Tractive effort: power limited, locked out when brake is active
    const maxTraction = Math.min(
      this.route.train.maxStartingTractiveEffortN,
      this.route.train.maxPowerWatts / Math.max(absV, 1)
    );
    const tractionInterlock = (st.b > 0.04 || st.bc > 0.04) ? 0 : 1;
    const F = st.dir * (st.n / this.route.train.maxNotch) * maxTraction * tractionInterlock;

    // Resistance: Davis formula tuned for broad-gauge passenger consist
    const Rr = 4500 + 350 * absV + 6 * absV * absV;

    // Gradient force: m * g * sin(theta) ≈ m * g * grade
    const Fg = m * this.g * this.getGrade(st.s);

    // Braking force magnitude (RDSO full service / emergency deceleration: 1.15 to 1.35 m/s²)
    const Fb = st.b * m * (st.em ? 1.35 : 1.15);

    // Acceleration with static breakaway friction threshold and directional braking
    if (absV > 0.01) {
      const netForce = F - Fg - Math.sign(v) * (Rr + Fb);
      const a = netForce / m;
      const nextV = v + a * dt;

      // When deceleration causes velocity to reverse direction, the train has come to a COMPLETE STOP!
      if ((v > 0 && nextV <= 0) || (v < 0 && nextV >= 0)) {
        st.v = 0;
      } else {
        st.v = nextV;
      }
    } else {
      // Stopped stationary state: check if net applied motive force overcomes static breakaway resistance + brakes
      const netApplied = F - Fg;
      const breakawayThreshold = Rr + Fb;
      if (Math.abs(netApplied) > breakawayThreshold) {
        const a = (netApplied - Math.sign(netApplied) * breakawayThreshold) / m;
        st.v = a * dt;
      } else {
        st.v = 0;
      }
    }

    // Velocity & distance integration (bounded within track limits)
    st.s = Math.max(-50, st.s + st.v * dt);

    // Run timer initialization
    if (!st.run && Math.abs(st.v) > 0.1) {
      st.run = true;
    }
    if (st.run) {
      st.t += dt;
    }

    // Overspeed check (+2 km/h buffer)
    const currentLimit = this.getSpeedLimitKmh(st.s);
    if (Math.abs(st.v) * 3.6 > currentLimit + 2) {
      st.os += dt;
    }

    // Finish condition: overran platform or stopped inside platform area after driving
    const finished = st.s > this.route.platformEndDistance ||
      (st.s > 3000 && Math.abs(st.v) < 0.05 && st.t > 5);

    if (finished) {
      st.done = true;
      return true;
    }

    return false;
  }

  public getStopScore(): StopScoreResult {
    const st = this.state;
    const e = st.s - this.route.stopTargetDistance;
    const sc = Math.max(
      0,
      1000 - Math.round(st.os * 15) - Math.round(Math.abs(e) * 6) - Math.max(0, Math.round(st.t - 240)) * 2
    );

    let r = '';
    if (st.s > this.route.platformEndDistance) {
      r = 'Overran the platform';
    } else if (Math.abs(e) <= 26) {
      r = 'Perfect stop on the platform';
    } else if (e < 0) {
      r = `Stopped ${Math.round(-e)} m short`;
    } else {
      r = `Overshot by ${Math.round(e)} m`;
    }

    const min = Math.floor(st.t / 60);
    const sec = String(Math.floor(st.t % 60)).padStart(2, '0');

    return {
      done: st.done,
      score: sc,
      timeFormatted: `${min}:${sec}`,
      overspeedSeconds: st.os,
      errorMeters: e,
      statusText: r
    };
  }
}
