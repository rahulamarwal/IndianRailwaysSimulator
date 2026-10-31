# Indian Railways Engineering Specifications & Architecture Guide

## 1. Route Data Architecture
The simulator route is completely data-driven via structured JSON (`src/data/*.json`). This decoupling separates track layout and scenario logic from the rendering and physics engine:

```json
{
  "id": "pune-lonavala",
  "name": "Pune Jn to Lonavala",
  "startDistance": 240,
  "stopTargetDistance": 3230,
  "platformEndDistance": 3290,
  "track": {
    "startZ": -100,
    "endZ": 3500,
    "gauge": 1.676,
    "sleeperSpacing": 0.65,
    "mastSpacing": 60,
    "contactWireY": 6.0,
    "catenaryWireY": 6.7
  },
  "train": {
    "massKg": 560000,
    "coaches": 8,
    "maxNotch": 8,
    "maxPowerWatts": 4500000,
    "maxStartingTractiveEffortN": 300000
  },
  "gradients": [...],
  "speedLimits": [...],
  "signals": [...],
  "boards": [...],
  "stations": [...]
}
```

## 2. Physics Equations
### A. Tractive Effort (WAP-7 Locomotive)
At lower speeds, tractive effort is adhesion-limited to the maximum starting tractive effort:
$$F_{\text{start}} = 300\text{ kN} \text{ (RDSO WAP-7 limit: up to } 322\text{ kN)}$$
At higher speeds, tractive effort is limited by the rated power output of the 6-phase asynchronous traction motors (4.5 MW continuous rating):
$$F(v) = \frac{P_{\text{rated}}}{\max(v, 1)}$$
The net traction applied by the locomotive at throttle notch $n \in [0, 8]$ is:
$$F_{\text{traction}} = \frac{n}{8} \min(F_{\text{start}}, F(v)) \cdot \mathbb{I}(\text{brake} \le 0.15)$$
*(Traction cutoff interlock engages when brake cylinder pressure exceeds 15%)*

### B. Train Resistance (Modified Davis Equation)
The total rolling resistance of the 8-coach rake plus locomotive is calculated as:
$$R_r(v) = A + Bv + Cv^2 = 8000 + 500v + 7v^2 \quad [\text{N}]$$
where $v$ is train velocity in m/s.

### C. Gradient Force
On a track gradient of inclination $G$ (where positive is rising, e.g., $+0.006$ for 1 in 167):
$$F_g = m \cdot g \cdot G \quad [\text{N}]$$
where $m = 560,000\text{ kg}$ (123t WAP-7 loco + 8 $\times$ ~54t coaches with passenger payload).

### D. Braking Dynamics & Air Pipe Propagation Lag
Pneumatic twin-pipe graduated release air brakes experience propagation delay along the brake pipe:
$$\frac{db}{dt} = \frac{b_{\text{cmd}} - b}{\tau}$$
where:
- $\tau = 1.2\text{ s}$ during emergency venting (BP dropped directly to 0 kg/cm² via driver emergency valve).
- $\tau = 3.0\text{ s}$ during application.
- $\tau = 6.0\text{ s}$ during recharge / release (compressor recharge and triple-valve/distributor release cycle).

## 3. Real-World RDSO & Indian Railways Source Documents
- **RDSO Specification MP.0.24.00.26**: Specification for Three Phase AC-AC Electric Locomotives Class WAP-7.
- **Indian Railways Permanent Way Manual (IRPWM)**: Chapter on Rails, Sleepers, Ballast Profile and Points & Crossings.
- **Indian Railways General and Subsidiary Rules (G&SR)**: Chapter III - Signals and Block Working.
- **RDSO Guidelines for Air Brake System in Coaching Stock**: Twin Pipe Air Brake System Operation and Maintenance.
