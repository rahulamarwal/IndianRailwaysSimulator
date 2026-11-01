export class AudioController {
  private ctx: AudioContext | null = null;

  // Master & Mixer gains
  private masterGain: GainNode | null = null;
  private rumbleGain: GainNode | null = null;
  private inverterGain: GainNode | null = null;
  private flangeGain: GainNode | null = null;
  private airPurgeGain: GainNode | null = null;
  private vcdGain: GainNode | null = null;
  private crossingTrainGain: GainNode | null = null;

  // Oscillators & Filters
  private inverterOsc: OscillatorNode | null = null;
  private inverterHarmonicOsc: OscillatorNode | null = null;
  private flangeFilter: BiquadFilterNode | null = null;
  private crossingTrainFilter: BiquadFilterNode | null = null;

  // Horns (Dual-Tone, High, Low)
  private hornGain: GainNode | null = null;
  private hornOscHigh: OscillatorNode | null = null;
  private hornOscLow: OscillatorNode | null = null;

  public init(): void {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return;
    }

    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    this.ctx = ctx;

    const master = ctx.createGain();
    master.gain.value = 1.0;
    master.connect(ctx.destination);
    this.masterGain = master;

    // ----------------------------------------------------
    // 1. TRACK RUMBLE & RAIL RUNNING NOISE
    // ----------------------------------------------------
    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const channelData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      channelData[i] = Math.random() * 2 - 1;
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 240;

    const rumbleGain = ctx.createGain();
    rumbleGain.gain.value = 0;

    noiseSource.connect(lowpass);
    lowpass.connect(rumbleGain);
    rumbleGain.connect(master);
    noiseSource.start();
    this.rumbleGain = rumbleGain;

    // ----------------------------------------------------
    // 2. 3-PHASE AC TRACTION INVERTER (WAP-7 / WAG-9 GTO-IGBT SCALE)
    // ----------------------------------------------------
    const inverterGain = ctx.createGain();
    inverterGain.gain.value = 0;
    inverterGain.connect(master);
    this.inverterGain = inverterGain;

    // Fundamental inverter switching frequency
    const invOsc = ctx.createOscillator();
    invOsc.type = 'triangle';
    invOsc.frequency.value = 220;
    invOsc.connect(inverterGain);
    invOsc.start();
    this.inverterOsc = invOsc;

    // Second harmonic whine
    const invHarm = ctx.createOscillator();
    invHarm.type = 'sine';
    invHarm.frequency.value = 440;
    const invHarmGain = ctx.createGain();
    invHarmGain.gain.value = 0.45;
    invHarm.connect(invHarmGain);
    invHarmGain.connect(inverterGain);
    invHarm.start();
    this.inverterHarmonicOsc = invHarm;

    // ----------------------------------------------------
    // 3. WHEEL FLANGE SQUEAL ON CURVES
    // ----------------------------------------------------
    const flangeNoiseSource = ctx.createBufferSource();
    flangeNoiseSource.buffer = noiseBuffer;
    flangeNoiseSource.loop = true;

    const flangeFilter = ctx.createBiquadFilter();
    flangeFilter.type = 'bandpass';
    flangeFilter.frequency.value = 2800;
    flangeFilter.Q.value = 8.5; // High metallic resonance

    const flangeGain = ctx.createGain();
    flangeGain.gain.value = 0;

    flangeNoiseSource.connect(flangeFilter);
    flangeFilter.connect(flangeGain);
    flangeGain.connect(master);
    flangeNoiseSource.start();

    this.flangeFilter = flangeFilter;
    this.flangeGain = flangeGain;

    // ----------------------------------------------------
    // 4. AIR BRAKE EXHAUST PURGE (PNEUMATIC HISS)
    // ----------------------------------------------------
    const purgeSource = ctx.createBufferSource();
    purgeSource.buffer = noiseBuffer;
    purgeSource.loop = true;

    const purgeFilter = ctx.createBiquadFilter();
    purgeFilter.type = 'bandpass';
    purgeFilter.frequency.value = 1600;
    purgeFilter.Q.value = 1.8;

    const airPurgeGain = ctx.createGain();
    airPurgeGain.gain.value = 0;

    purgeSource.connect(purgeFilter);
    purgeFilter.connect(airPurgeGain);
    airPurgeGain.connect(master);
    purgeSource.start();
    this.airPurgeGain = airPurgeGain;

    // ----------------------------------------------------
    // 5. VCD (VIGILANCE CONTROL DEVICE) WARNING ALARM BUZZER
    // ----------------------------------------------------
    const vcdOsc = ctx.createOscillator();
    vcdOsc.type = 'square';
    vcdOsc.frequency.value = 1180;

    const vcdGain = ctx.createGain();
    vcdGain.gain.value = 0;

    vcdOsc.connect(vcdGain);
    vcdGain.connect(master);
    vcdOsc.start();
    this.vcdGain = vcdGain;

    // ----------------------------------------------------
    // 6. PASSING AI TRAIN ON TRACK 2 (ROARING CROSSING TRAIN)
    // ----------------------------------------------------
    const crossSource = ctx.createBufferSource();
    crossSource.buffer = noiseBuffer;
    crossSource.loop = true;

    const crossFilter = ctx.createBiquadFilter();
    crossFilter.type = 'lowpass';
    crossFilter.frequency.value = 320;

    const crossGain = ctx.createGain();
    crossGain.gain.value = 0;

    crossSource.connect(crossFilter);
    crossFilter.connect(crossGain);
    crossGain.connect(master);
    crossSource.start();
    this.crossingTrainFilter = crossFilter;
    this.crossingTrainGain = crossGain;

    // ----------------------------------------------------
    // 7. AUTHENTIC DUAL-TONE HORN (311 Hz LOW & 370 Hz HIGH)
    // ----------------------------------------------------
    const hornGain = ctx.createGain();
    hornGain.gain.value = 0;
    hornGain.connect(master);
    this.hornGain = hornGain;

    // Low tone (311 Hz)
    const oscLow = ctx.createOscillator();
    oscLow.type = 'sawtooth';
    oscLow.frequency.value = 311;
    oscLow.connect(hornGain);
    oscLow.start();
    this.hornOscLow = oscLow;

    // High tone (370 Hz)
    const oscHigh = ctx.createOscillator();
    oscHigh.type = 'sawtooth';
    oscHigh.frequency.value = 370;
    oscHigh.connect(hornGain);
    oscHigh.start();
    this.hornOscHigh = oscHigh;
  }

  /**
   * Updates all dynamic audio synthesis parameters in real-time
   */
  public update(
    velocityMps: number,
    throttleNotch: number,
    brakeValue: number,
    curvature: number,
    vcdBuzzerActive: boolean,
    crossingTrainDist?: number
  ): void {
    if (!this.ctx) return;
    const absV = Math.abs(velocityMps);
    const speedKmh = absV * 3.6;

    // 1. Track rumble scales with train speed
    if (this.rumbleGain) {
      const targetRumble = Math.min(absV / 32, 1) * 0.38 + (absV > 0.5 ? 0.04 : 0);
      this.rumbleGain.gain.setTargetAtTime(targetRumble, this.ctx.currentTime, 0.08);
    }

    // 2. WAP-7 Inverter Synthesis: Multi-tier PWM stepping frequency
    if (this.inverterGain && this.inverterOsc && this.inverterHarmonicOsc) {
      const isPowerActive = throttleNotch > 0 && brakeValue < 0.1;
      const isDynamicBraking = brakeValue > 0.15 && absV > 2.0;

      if ((isPowerActive || isDynamicBraking) && absV < 38) {
        // Frequency shifts in tiers like real GTO/IGBT electric locomotives:
        let baseFreq = 210;
        let harmFreq = 420;
        let invVolume = 0.08 + (throttleNotch / 8) * 0.14;

        if (speedKmh < 8) {
          // Tier 1: 0 - 8 km/h low pulse frequency
          baseFreq = 210 + speedKmh * 8;
          harmFreq = baseFreq * 2;
        } else if (speedKmh < 18) {
          // Tier 2: 8 - 18 km/h second step
          baseFreq = 310 + (speedKmh - 8) * 12;
          harmFreq = baseFreq * 2;
        } else if (speedKmh < 32) {
          // Tier 3: 18 - 32 km/h singing high whine
          baseFreq = 430 + (speedKmh - 18) * 14;
          harmFreq = baseFreq * 1.5;
        } else {
          // Tier 4: Synchronous modulation
          baseFreq = 620 + (speedKmh - 32) * 5;
          harmFreq = baseFreq * 1.33;
          invVolume *= 0.6; // Softens at higher track speeds as track rumble takes over
        }

        if (isDynamicBraking) {
          invVolume = 0.12 * Math.min(brakeValue, 1.0);
        }

        this.inverterOsc.frequency.setTargetAtTime(baseFreq, this.ctx.currentTime, 0.06);
        this.inverterHarmonicOsc.frequency.setTargetAtTime(harmFreq, this.ctx.currentTime, 0.06);
        this.inverterGain.gain.setTargetAtTime(invVolume, this.ctx.currentTime, 0.08);
      } else {
        this.inverterGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.12);
      }
    }

    // 3. Flange squeal on sharp track curves at speed
    if (this.flangeGain && this.flangeFilter) {
      const absCurv = Math.abs(curvature);
      if (absCurv > 0.012 && absV > 6) {
        const squealIntensity = Math.min((absCurv - 0.012) * 45, 1.0) * Math.min(absV / 25, 1.0) * 0.18;
        this.flangeGain.gain.setTargetAtTime(squealIntensity, this.ctx.currentTime, 0.1);
        this.flangeFilter.frequency.setTargetAtTime(2600 + Math.sin(this.ctx.currentTime * 8) * 350, this.ctx.currentTime, 0.05);
      } else {
        this.flangeGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.15);
      }
    }

    // 4. VCD Alarm Buzzer
    if (this.vcdGain) {
      if (vcdBuzzerActive) {
        // Pulsing 1180 Hz beep (4 beeps per second)
        const beepPulse = Math.sin(this.ctx.currentTime * 25) > 0 ? 0.22 : 0;
        this.vcdGain.gain.setTargetAtTime(beepPulse, this.ctx.currentTime, 0.02);
      } else {
        this.vcdGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
      }
    }

    // 5. Passing AI Crossing Train Sound
    if (this.crossingTrainGain && this.crossingTrainFilter && crossingTrainDist !== undefined) {
      const absDist = Math.abs(crossingTrainDist);
      if (absDist < 250) {
        const proximity = Math.pow(Math.max(0, 1 - absDist / 250), 2);
        this.crossingTrainGain.gain.setTargetAtTime(proximity * 0.42, this.ctx.currentTime, 0.05);
        this.crossingTrainFilter.frequency.setTargetAtTime(280 + proximity * 340, this.ctx.currentTime, 0.05);
      } else {
        this.crossingTrainGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
      }
    }
  }

  /**
   * Air brake pressure purge sound (pssshhhh)
   */
  public playAirPurge(): void {
    if (!this.ctx) this.init();
    if (!this.ctx || !this.airPurgeGain) return;
    this.airPurgeGain.gain.cancelScheduledValues(this.ctx.currentTime);
    this.airPurgeGain.gain.setValueAtTime(0.24, this.ctx.currentTime);
    this.airPurgeGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.65);
  }

  /**
   * Pantograph high-voltage arcing spark zap sound
   */
  public playPantographArc(): void {
    if (!this.ctx) this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.08);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(this.masterGain || this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.14);
  }

  /**
   * Indian Railways Station Electronic Chimes (Ting-Tong-Ting: C5 -> E5 -> G5)
   */
  public playStationChime(): void {
    if (!this.ctx) this.init();
    if (!this.ctx) return;
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    const now = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      const noteTime = now + idx * 0.28;
      const osc = this.ctx!.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;

      const gain = this.ctx!.createGain();
      gain.gain.setValueAtTime(0, noteTime);
      gain.gain.linearRampToValueAtTime(0.22, noteTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.45);

      osc.connect(gain);
      gain.connect(this.masterGain || this.ctx!.destination);
      osc.start(noteTime);
      osc.stop(noteTime + 0.50);
    });
  }

  /**
   * Blow Locomotive Horn: Dual-Tone, High-Tone, or Low-Tone
   */
  public startHorn(type: 'dual' | 'high' | 'low' = 'dual'): void {
    if (!this.ctx) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    if (!this.ctx || !this.hornGain) return;

    if (type === 'dual') {
      if (this.hornOscLow) this.hornOscLow.frequency.value = 311;
      if (this.hornOscHigh) this.hornOscHigh.frequency.value = 370;
    } else if (type === 'high') {
      if (this.hornOscLow) this.hornOscLow.frequency.value = 370;
      if (this.hornOscHigh) this.hornOscHigh.frequency.value = 370;
    } else {
      if (this.hornOscLow) this.hornOscLow.frequency.value = 311;
      if (this.hornOscHigh) this.hornOscHigh.frequency.value = 311;
    }

    this.hornGain.gain.setTargetAtTime(0.24, this.ctx.currentTime, 0.04);
  }

  public startDualHorn(): void {
    this.startHorn('dual');
  }

  public startHighHorn(): void {
    this.startHorn('high');
  }

  public startLowHorn(): void {
    this.startHorn('low');
  }

  public stopHorn(): void {
    if (this.hornGain && this.ctx) {
      this.hornGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
    }
  }
}
