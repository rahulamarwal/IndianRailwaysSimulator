# Indian Railways Loco-Pilot Simulator (WebGL / Three.js)

A realistic first-person Indian Railways loco-pilot train simulator running client-side in the browser on Three.js, TypeScript, and Vite.

## Features
- **Authentic Indian Broad Gauge Infrastructure**: 1,676 mm gauge rails, instanced RDSO-style pre-stressed concrete sleepers (0.65 m spacing), and 25 kV AC 50 Hz traction overhead equipment (OHE masts, cantilever assemblies, and contact wires).
- **WAP-7 Electric Locomotive & ICF Coaches**: Modeled WAP-7 electric locomotive with pantograph, cab windshield, twin-beam headlight, and 8 ICF passenger coaches in classic blue livery.
- **Authentic Stations**: Pune Jn and Lonavala with high-level platforms, yellow safety tactile lines, canopy roofing, foot overbridges (FOB), bilingual yellow name boards (English and Devanagari), and passengers in regional attire.
- **Indian Signalling & Caution Boards**: Multi-Aspect Colour Light Signalling (MACLS) displaying Double Yellow (Attention), Yellow (Caution), and Green (Clear) aspects, alongside circular speed restriction boards (100, 40, 15 km/h) and STOP boards.
- **Real-World Train Dynamics**:
  - WAP-7 power-limited tractive effort curve (4.5 MW, 300 kN starting tractive effort).
  - Modified Davis equation train resistance.
  - Realistic gradient forces (rising 1 in 167, falling 1 in 100, and level sections).
  - Twin-pipe air brake simulation with exponential pneumatic apply/release propagation lag.
  - Emergency braking with automatic traction cutoff.
- **Dual Camera Angles**:
  - **First-Person Cab View**: Driving seat viewpoint with speed-dependent vertical track bounce and cab vignette frame.
  - **Third-Person Exterior Chase View**: Trailing view showing full locomotive and train consist.
- **Audio Synthesis**: WebAudio-based track noise and motor rumble with speed-responsive filtering, plus authentic dual-tone Indian electric locomotive horn (311 Hz and 370 Hz).
- **Data-Driven Architecture**: Route geometries, gradients, speed limits, signals, and station positions are driven by JSON (`src/data/pune-lonavala.json`).

## Controls
- **W / S**: Throttle notch up / down (0 to 8 notches)
- **Q / E**: Apply / Release train air brake
- **Space**: Emergency brake
- **H**: Dual-tone locomotive horn
- **C**: Toggle First-Person Cab View / Third-Person Chase View
- **R**: Restart run

## Development & Build

### Install Dependencies
```bash
npm install
```

### Run Local Development Server
```bash
npm run dev
```

### Production Build
```bash
npm run build
```
Build output is generated into `dist/` and can be hosted statically on any web server or GitHub Pages with zero backend requirements.

## Roadmap
1. [x] **Step 1: Refactor to Vite + TypeScript + ES-Module Three.js**
   - Modularized architecture (`renderer`, `track`, `scenery`, `train`, `physics`, `signals`, `stations`, `audio`, `hud`).
   - Route data decoupled into JSON.
   - Behavior, physics, scoring, and visuals 100% identical to prototype.
2. [ ] **Step 2: Curved Track & Alignment**
   - 3D cubic splines with cant/superelevation, gradient curves, and car bogie rotation following curves.
3. [ ] **Step 3: Advanced Physics v2**
   - Continuous tractive effort curve, independent locomotive brake (SA-9), dual brake pipe/feed pipe pressures, wheel slip & adhesion model, coupler slack, and unit tests.
4. [ ] **Step 4: Signalling & Safety Systems**
   - Track circuit blocks, interlocked signals, AI line traffic, SPAD penalty, and Vigilance Control Device (VCD).
5. [ ] **Step 5: Visual Realism & glTF Models**
   - Detailed glTF models of WAP-7, LHB, ICF coaches, realistic PBR materials, overhead wire catenary physics, and Indian station props.
