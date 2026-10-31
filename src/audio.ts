export class AudioController {
  private ctx: AudioContext | null = null;
  private rumbleGain: GainNode | null = null;
  private hornGain: GainNode | null = null;
  private isHornPlaying = false;

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

    // Track rumble / traction drone: filtered looping white noise
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
    lowpass.frequency.value = 260;

    const rumbleGain = ctx.createGain();
    rumbleGain.gain.value = 0;

    noiseSource.connect(lowpass);
    lowpass.connect(rumbleGain);
    rumbleGain.connect(ctx.destination);
    noiseSource.start();
    this.rumbleGain = rumbleGain;

    // Authentic Indian Railways Dual-Tone Electric Locomotive Horn (311 Hz & 370 Hz)
    const hornGain = ctx.createGain();
    hornGain.gain.value = 0;
    hornGain.connect(ctx.destination);
    this.hornGain = hornGain;

    [311, 370].forEach(freq => {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = freq;
      osc.connect(hornGain);
      osc.start();
    });
  }

  public update(velocityMps: number): void {
    if (this.rumbleGain) {
      this.rumbleGain.gain.value = Math.min(velocityMps / 30, 1) * 0.35;
    }
  }

  public startHorn(): void {
    if (!this.ctx) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    if (this.hornGain && this.ctx && !this.isHornPlaying) {
      this.hornGain.gain.setTargetAtTime(0.12, this.ctx.currentTime, 0.05);
      this.isHornPlaying = true;
    }
  }

  public stopHorn(): void {
    if (this.hornGain && this.ctx) {
      this.hornGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
      this.isHornPlaying = false;
    }
  }
}
