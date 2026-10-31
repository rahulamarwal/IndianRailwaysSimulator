# Indian Railways Loco-Pilot Simulator - Project Guidelines & Rules

## 1. Core Engineering Principles
- **Target Performance**: Maintain steady 60 fps on Apple Silicon (M-series) Macs and at least 30 fps on legacy hardware. Use instanced meshes (`InstancedMesh`) for sleepers, masts, trees, and passengers.
- **Pure Client-Side**: Fully static browser execution via WebGL and Three.js with Vite and TypeScript. Zero backend dependencies.
- **Never Break Playability**: The simulator must compile and remain fully playable after every commit or roadmap step.
- **Zero Hallucinated Numbers / Facts**: Real-world specs (loco power curves, braking pressures, train weights, dimensions, signal aspects, track geometry, rules) must be verified against Indian Railways (RDSO / G&SR / Railway Board) documentation. When in doubt or when unverified, flag for user confirmation.

## 2. Indian Railways Technical Standards
- **Track Gauge**: Indian Broad Gauge (1,676 mm / 5 ft 6 in). Rail heads at ±0.838 m from centerline.
- **OHE Traction**: 25 kV AC 50 Hz single-phase.
  - Normal contact wire height: 5.5 m to 5.8 m above rail level (up to 6.0 m at level crossings/yards).
  - Normal catenary messenger wire height: ~6.7 m.
  - Mast spacing: 60 m to 72 m on tangent track.
- **Signalling**: Multi-Aspect Colour Light Signalling (MACLS) following IR General & Subsidiary Rules (G&SR):
  - **Green (Clear)**: Proceed at normal section speed. Minimum 2 blocks ahead clear.
  - **Double Yellow (Attention)**: Proceed and be prepared to pass next signal at restricted speed (typically 40 km/h or turnouts).
  - **Yellow (Caution)**: Proceed with caution, be prepared to stop at next signal.
  - **Red (Danger)**: Absolute STOP before the signal post.
- **Rolling Stock**:
  - **Locomotive**: WAP-7 (Class: Broad gauge, AC electric, Passenger, 7th generation). 6,000 HP / 4,500 kW, 322 kN starting tractive effort, 123 tonnes, Co-Co wheel arrangement.
  - **Coaches**: Classic ICF (Integral Coach Factory) coaches (length ~22.28 m, tare ~38-42 t) and modern LHB (Linke Hofmann Busch) coaches (length 23.54 m, tare ~40-45 t).
  - **Brakes**: Twin-pipe graduated release air brake system. Normal Brake Pipe (BP) pressure: 5.0 kg/cm²; Feed Pipe (FP) pressure: 6.0 kg/cm².

## 3. Architecture & Code Quality
- Modular TypeScript structure under `src/`:
  - `data/`: JSON route definitions (geometry, gradients, limits, signals, stations).
  - `physics.ts`: Vehicle dynamics, tractive effort curves, Davis resistance, pneumatic brake lag, gradient forces.
  - `renderer.ts`: Scene, camera, WebGL renderer configuration, tone mapping, lighting.
  - `track.ts`: 3D procedural track, rails, ballast, sleepers, OHE.
  - `train.ts`: Locomotive and rolling stock assembly.
  - `signals.ts`: Signal posts, aspect logic, caution/speed boards.
  - `stations.ts`: Platforms, FOBs, bilingual signage, ambient passengers.
  - `audio.ts`: WebAudio synthesis for dual-tone horns and rail rumbling.
  - `hud.ts`: Instrument gauges, telemetry, and trip scoring.
