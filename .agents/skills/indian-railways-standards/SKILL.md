---
name: indian-railways-standards
description: >-
  Provides official Indian Railways engineering specifications, RDSO standards, signalling rules (G&SR), locomotive physics (WAP-7), rolling stock (ICF/LHB), and track norms for the simulator.
---

# Indian Railways Standards & Simulation Reference

Use this reference when building physics models, track layouts, signalling systems, and visual assets for Indian Railways simulation scenarios.

## 1. Permanent Way (Track & Civil)
- **Gauge**: Broad Gauge (BG) = 1,676 mm (5 ft 6 in).
- **Rails**: UIC 60 / 60E1 (60 kg/m) or 52 kg/m standard.
- **Sleepers**: Monoblock Pre-stressed Concrete Sleepers (PSC) (RDSO/T-2496).
  - Length: 2,750 mm (2.75 m)
  - Width at rail seat: 250 mm
  - Height at rail seat: 210 mm
  - Nominal sleeper density: 1,540 to 1,660 sleepers/km (~0.60 m to 0.65 m center-to-center).
- **Ballast**: Crushed granite ballast, depth cushion 300 mm to 350 mm beneath sleeper underside.

## 2. 25 kV AC 50 Hz Overhead Electrification (OHE)
- **System**: Single phase 25 kV AC, 50 Hz.
- **Contact Wire**: Hard drawn grooved copper (107 mm²).
  - Normal height above Rail Level (RL): 5.50 m (open line) to 5.80 m.
  - Level crossing / yard height: up to 5.80 m - 6.00 m.
  - Minimum clearance: 4.80 m (rolling stock roof clearance).
- **Catenary Wire**: Stranded cadmium-copper / copper messenger wire (65 mm²), nominal height ~6.70 m.
- **Masts**: Rolled steel joist (RSJ) / B-series steel masts spaced 60 m to 72 m on tangent track, spaced closer on curves (down to 30 m).
- **Cantilever Assembly**: Insulator, stay arm, bracket tube, register arm holding steady arm.

## 3. Locomotive: WAP-7 (Electric Locomotive)
- **Class**: W (Broad Gauge), A (AC 25 kV Electric), P (Passenger), 7 (7th generation high-tech).
- **Manufacturer**: Chittaranjan Locomotive Works (CLW) / Banaras Locomotive Works (BLW).
- **Wheel Arrangement**: Co-Co (2 bogies, 3 powered axles per bogie, total 6 axles).
- **Power Output**: 6,122 HP continuous (4,565 kW / 4.5 MW).
- **Starting Tractive Effort**: 322.6 kN (nominal design ~300 - 322 kN).
- **Continuous Tractive Effort**: 228 kN.
- **Maximum Design Speed**: 140 km/h (cleared up to 160 km/h with modified gear ratio).
- **Loco Weight**: 123 tonnes (axle load ~20.5 tonnes).
- **Length over buffers**: 20,562 mm (~20.56 m).
- **Width**: 3,152 mm (~3.15 m).
- **Height with pantograph locked down**: 4,255 mm (~4.25 m).
- **Braking**:
  - Regenerative dynamic braking: up to 182 kN braking effort.
  - Air brake system: Computer-controlled brake (CCB) / E-70 tri-plate pneumatic brake panel.
  - Independent loco brake (SA-9): direct loco brake cylinder application (up to 3.5 kg/cm²).
  - Auto train brake (A-9): twin-pipe brake pipe reduction (5.0 kg/cm² down to 3.4 kg/cm² full service, 0 for emergency).
- **Safety**:
  - VCD (Vigilance Control Device): 60-second timer cycling through visual flash (8s), audio buzzer (8s), penalty emergency brake.
  - Horns: Dual-tone pneumatic horn (typically tuned around ~311 Hz and ~370 Hz or ~400 Hz).

## 4. Rolling Stock: ICF vs LHB
- **ICF Coaches (Integral Coach Factory, Perambur)**:
  - Construction: Corten steel shell, anti-telescopic design.
  - Length over body: 21,337 mm (~21.34 m); over couplers: 22,297 mm (~22.3 m).
  - Width: 3,245 mm.
  - Tare weight: 38 - 42 tonnes.
  - Maximum speed: 110 km/h (selected trains 120-130 km/h).
- **LHB Coaches (Linke-Hofmann-Busch)**:
  - Construction: Stainless steel shell with anti-climbing CBC couplers.
  - Length over body: 23,540 mm; over couplers: 24,000 mm.
  - Width: 3,240 mm.
  - Tare weight: ~40 - 46 tonnes.
  - Disc brakes with wheel slide protection (WSP).
  - Maximum speed: 130 km/h to 160 km/h.

## 5. Indian Railways Signalling (G&SR)
- **MACLS (Multi-Aspect Colour Light Signalling)**:
  - **Green (Clear)**: Run at maximum sanctioned section speed; two or more blocks clear ahead.
  - **Double Yellow (Attention)**: Run with caution and expect next signal at Yellow or be prepared to take turnout/loop line at restricted speed (typically 30-40 km/h).
  - **Yellow (Caution)**: Pass at restricted speed and be prepared to stop at the next signal.
  - **Red (Danger)**: Stop dead before the signal. Never pass without written authority or automatic signal rules.
- **Trackside Boards**:
  - **Caution Boards**: Circular / rectangular yellow or white with red circle / black letters.
  - **Speed Restriction Boards**: Black letters on yellow background / red border stating sanctioned km/h.
  - **Whistle Boards (W / W/L - Whistle for Level Crossing)**: Black letters on yellow backing.
  - **STOP Board**: At terminal buffer stops or berthing stop indicators.
