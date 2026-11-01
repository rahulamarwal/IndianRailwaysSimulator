import { RouteData, TrainState, StopScoreResult } from './types';

export class TrainPhysics {
  public route: RouteData;
  public state: TrainState;
  private g = 9.81;

  // Active AI Train running on Track 2 (Up Line) towards Lonavala
  public aiTrainZ = 7600;
  public aiTrainSpeedMps = 23.6; // ~85 km/h

  // Station announcement tracking
  public lastAnnouncedStation: string | null = null;
  public justEnteredStation: string | null = null;

  // Pantograph electrical arcing spark timer
  private arcCooldown = 0;

  constructor(route: RouteData) {
    this.route = route;
    this.state = this.createInitialState();
  }

  private createInitialState(): TrainState {
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
      dir: 1,
      bpPressure: 5.0,
      bcPressure: 0.0,
      fpPressure: 6.0,
      mrPressure: 9.8,
      vcdTimer: 0,
      vcdVisual: false,
      vcdAudio: false,
      vcdPenalty: false,
      headlights: true,
      wipers: false,
      pantographArc: false,
      currentStationName: null
    };
  }

  public reset(): void {
    this.state = this.createInitialState();
    this.aiTrainZ = 7600;
    this.lastAnnouncedStation = null;
    this.justEnteredStation = null;
  }

  public acknowledgeVcd(): void {
    this.state.vcdTimer = 0;
    this.state.vcdVisual = false;
    this.state.vcdAudio = false;
    if (this.state.vcdPenalty) {
      this.state.vcdPenalty = false;
      this.state.em = false;
      this.state.bc = 0;
    }
  }

  public toggleHeadlights(): boolean {
    this.state.headlights = !this.state.headlights;
    this.acknowledgeVcd();
    return this.state.headlights;
  }

  public toggleWipers(): boolean {
    this.state.wipers = !this.state.wipers;
    this.acknowledgeVcd();
    return this.state.wipers;
  }

  public toggleReverser(): boolean {
    this.acknowledgeVcd();
    if (Math.abs(this.state.v) <= 0.3) {
      this.state.dir = this.state.dir === 1 ? -1 : 1;
      return true;
    }
    return false;
  }

  public getGrade(s: number): number {
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

  public toggleEndJourney(): boolean {
    this.state.done = !this.state.done;
    if (this.state.done) {
      this.state.n = 0;
      this.state.bc = 0.6;
    }
    this.acknowledgeVcd();
    return this.state.done;
  }

  public notchUp(): void {
    this.acknowledgeVcd();
    if (this.state.done) {
      this.state.done = false;
    }
    if (this.state.bc > 0 || this.state.b > 0) {
      this.state.bc = 0;
      this.state.b = 0;
    }
    this.state.n = Math.min(this.route.train.maxNotch, this.state.n + 1);

    // Trigger momentary pantograph electric arcing spark when accelerating
    if (this.arcCooldown <= 0) {
      this.state.pantographArc = true;
      this.arcCooldown = 1.8;
    }
  }

  public notchDown(): void {
    this.acknowledgeVcd();
    if (this.state.n > 0) {
      this.state.n--;
    } else {
      this.applyBrakeStep();
    }
  }

  public applyBrakeStep(): void {
    this.acknowledgeVcd();
    this.state.n = 0;
    if (this.state.bc < 0.3) {
      this.state.bc = 0.40; // Initial service reduction (BP 4.4 kg/cm²)
    } else if (this.state.bc < 0.7) {
      this.state.bc = 0.75; // Service application (BP 3.8 kg/cm²)
    } else {
      this.state.bc = 1.0;  // Full service application (BP 3.4 kg/cm²)
    }
  }

  public releaseBrakeStep(): void {
    this.acknowledgeVcd();
    if (this.state.bc > 0.7) {
      this.state.bc = 0.35;
    } else {
      this.state.bc = 0;
    }
  }

  public triggerEmergency(): void {
    this.acknowledgeVcd();
    this.state.em = true;
    this.state.n = 0;
    this.state.bc = 1.0;
  }

  public update(dt: number, applyBrakeKey: boolean, releaseBrakeKey: boolean): boolean {
    const st = this.state;
    this.justEnteredStation = null;

    // 1. Advance AI Train on Track 2 (Up Line)
    this.aiTrainZ -= this.aiTrainSpeedMps * dt;
    if (this.aiTrainZ < -150) {
      this.aiTrainZ = 9000;
    }

    if (st.done) return false;

    // 2. Driver Brake Key Handling
    if (applyBrakeKey) {
      this.acknowledgeVcd();
      st.n = 0;
      st.bc = Math.min(1, st.bc + 1.2 * dt);
    }
    if (releaseBrakeKey) {
      this.acknowledgeVcd();
      st.bc = Math.max(0, st.bc - 1.5 * dt);
    }

    // 3. Vigilance Control Device (VCD) 60-Second Cycle
    const absV = Math.abs(st.v);
    if (absV > 0.8 && !st.done) {
      st.vcdTimer += dt;
      st.vcdVisual = st.vcdTimer >= 60.0;
      st.vcdAudio = st.vcdTimer >= 68.0;

      // Penalty emergency brake at 76 seconds of inactivity
      if (st.vcdTimer >= 76.0 && !st.vcdPenalty) {
        st.vcdPenalty = true;
        st.em = true;
        st.n = 0;
        st.bc = 1.0;
      }
    } else {
      st.vcdTimer = 0;
      st.vcdVisual = false;
      st.vcdAudio = false;
    }

    // 4. Pantograph electric arcing cooldown
    if (this.arcCooldown > 0) {
      this.arcCooldown -= dt;
      if (this.arcCooldown <= 1.6) {
        st.pantographArc = false;
      }
    }

    // 5. Graduated pneumatic brake application & release lag
    if (st.em) {
      st.bc = 1.0;
      st.n = 0;
      st.b = Math.min(1, st.b + 1.8 * dt);
    } else {
      if (st.b < st.bc) {
        st.b = Math.min(st.bc, st.b + 0.45 * dt);
      } else if (st.b > st.bc) {
        st.b = Math.max(st.bc, st.b - 0.55 * dt);
      }
    }

    // 6. Realistic RDSO Pneumatic Pressure Telemetry
    // BP: 5.0 kg/cm² normal -> 3.4 kg/cm² full service -> 0.0 kg/cm² emergency
    st.bpPressure = Math.max(0, 5.0 - (st.em ? 5.0 : st.b * 1.6));
    // BC: 0.0 kg/cm² released -> up to 3.5 kg/cm² applied
    st.bcPressure = Math.min(3.5, (st.em ? 3.5 : st.b * 3.5));
    st.fpPressure = 6.0;
    st.mrPressure = 9.8 - st.b * 0.4;

    const m = this.route.train.massKg;
    const v = st.v;

    // 7. Tractive Effort: power limited, locked out when brake is active
    const maxTraction = Math.min(
      this.route.train.maxStartingTractiveEffortN,
      this.route.train.maxPowerWatts / Math.max(absV, 1)
    );
    const tractionInterlock = (st.b > 0.04 || st.bc > 0.04 || st.em) ? 0 : 1;
    const F = st.dir * (st.n / this.route.train.maxNotch) * maxTraction * tractionInterlock;

    // 8. Resistance: Davis formula tuned for broad-gauge passenger consist
    const Rr = 4500 + 350 * absV + 6 * absV * absV;

    // 9. Gradient force: m * g * sin(theta) ≈ m * g * grade
    const Fg = m * this.g * this.getGrade(st.s);

    // 10. Braking force magnitude (RDSO standard deceleration 1.15 to 1.35 m/s²)
    const Fb = st.b * m * (st.em ? 1.35 : 1.15);

    // 11. Acceleration integration with breakaway static friction
    if (absV > 0.01) {
      const netForce = F - Fg - Math.sign(v) * (Rr + Fb);
      const a = netForce / m;
      const nextV = v + a * dt;

      if ((v > 0 && nextV <= 0) || (v < 0 && nextV >= 0)) {
        st.v = 0;
      } else {
        st.v = nextV;
      }
    } else {
      const netApplied = F - Fg;
      const breakawayThreshold = Rr + Fb;
      if (Math.abs(netApplied) > breakawayThreshold) {
        const a = (netApplied - Math.sign(netApplied) * breakawayThreshold) / m;
        st.v = a * dt;
      } else {
        st.v = 0;
      }
    }

    // 12. Distance integration
    st.s = Math.max(-50, st.s + st.v * dt);

    // Yard buffer safety limit
    if (st.s >= this.route.track.endZ - 40) {
      st.s = this.route.track.endZ - 40;
      st.v = 0;
    }

    if (!st.run && Math.abs(st.v) > 0.1) {
      st.run = true;
    }
    if (st.run) {
      st.t += dt;
    }

    // 13. Overspeed check
    const currentLimit = this.getSpeedLimitKmh(st.s);
    if (Math.abs(st.v) * 3.6 > currentLimit + 2) {
      st.os += dt;
    }

    // 14. Station Arrival Detection for Indian Railways Chimes
    let atStation: string | null = null;
    for (const station of this.route.stations) {
      if (st.s >= station.startZ && st.s <= station.endZ) {
        atStation = station.name;
        break;
      }
    }
    st.currentStationName = atStation;

    if (atStation && atStation !== this.lastAnnouncedStation) {
      this.lastAnnouncedStation = atStation;
      this.justEnteredStation = atStation;
    } else if (!atStation) {
      this.lastAnnouncedStation = null;
    }

    return false;
  }

  public getStopScore(): StopScoreResult {
    const st = this.state;
    const e = st.s - this.route.stopTargetDistance;

    let closestStation = this.route.stations[0];
    let minStationDist = Infinity;
    for (const station of this.route.stations) {
      const mid = (station.startZ + station.endZ) / 2;
      const dist = Math.abs(st.s - mid);
      if (dist < minStationDist) {
        minStationDist = dist;
        closestStation = station;
      }
    }

    const isAtStation = minStationDist < 160;
    let r = '';
    if (st.s >= this.route.stopTargetDistance - 40 && st.s <= this.route.platformEndDistance + 50) {
      if (Math.abs(e) <= 26) {
        r = 'Perfect stop at Daund Junction (Terminus)!';
      } else {
        r = `Arrived at Daund Junction (${Math.abs(Math.round(e))} m from stop board)`;
      }
    } else if (isAtStation) {
      r = `Parked at ${closestStation.name} Station (${closestStation.devanagari})`;
    } else {
      r = `Journey Concluded on Mainline at km ${(st.s / 1000).toFixed(2)}`;
    }

    const progressRatio = Math.min(1, Math.max(0, st.s / this.route.stopTargetDistance));
    const distScore = Math.round(progressRatio * 750);
    const stationBonus = isAtStation ? Math.max(50, 250 - Math.round(minStationDist)) : 0;
    const overspeedPenalty = Math.round(st.os * 10);
    const sc = Math.max(0, Math.min(1000, distScore + stationBonus - overspeedPenalty));

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
