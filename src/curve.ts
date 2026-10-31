export interface TrackPoint {
  x: number;     // Lateral offset in meters (Track 1 centerline)
  dx: number;    // First derivative dx/dz
  yaw: number;   // Heading angle in radians (atan2(dx, 1))
  cant: number;  // Superelevation / banking angle in radians
}

export interface CurveSegment {
  z0: number;
  z1: number;
  amp: number;   // Lateral peak deviation in meters (+ for right, - for left)
}

// Track curve segments placed between tangent station platforms
// Station Platform Tangents:
// Lonavala: 0 - 280 m (x = 0)
// Shivaji Nagar: 2400 - 2680 m (x = 0)
// Pune Jn: 3900 - 4200 m (x = 0)
// Uruli: 6300 - 6580 m (x = 0)
// Daund Jn: 8500 - 8800 m (x = 0)
export const CURVE_SEGMENTS: CurveSegment[] = [
  // 1. Western Ghats descent curve (Rich nature / Sahyadri cliffs)
  { z0: 500, z1: 1400, amp: 35.0 },
  // 2. Sahyadri valley S-turn (Nature forest & rolling green hills)
  { z0: 1550, z1: 2320, amp: -30.0 },
  // 3. Mula-Mutha River sweep before Pune (Bridge over river)
  { z0: 2800, z1: 3750, amp: 26.0 },
  // 4. Hadapsar Industrial sweep (Warehouses, logistics, oil depot)
  { z0: 4400, z1: 5450, amp: -36.0 },
  // 5. Loni mainline turn (Petroleum tank farm)
  { z0: 5650, z1: 6180, amp: 22.0 },
  // 6. Deccan Plain high-speed curve towards Daund
  { z0: 6800, z1: 8300, amp: 40.0 }
];

/**
 * Returns the track centerline offset, yaw angle, and cant banking for any distance z.
 * Uses sin^4(pi*u) transition curves ensuring C2 continuity (x=0, dx=0, d2x=0 at boundaries).
 */
export function getTrackCurve(z: number): TrackPoint {
  for (let i = 0; i < CURVE_SEGMENTS.length; i++) {
    const seg = CURVE_SEGMENTS[i];
    if (z >= seg.z0 && z <= seg.z1) {
      const L = seg.z1 - seg.z0;
      const u = (z - seg.z0) / L; // 0 to 1
      const sinU = Math.sin(Math.PI * u);
      const cosU = Math.cos(Math.PI * u);

      // x = A * sin^4(pi * u)
      const x = seg.amp * Math.pow(sinU, 4);

      // dx/dz = (4 * pi * A / L) * sin^3(pi * u) * cos(pi * u)
      const dx = (4 * Math.PI * seg.amp / L) * Math.pow(sinU, 3) * cosU;

      // d2x/dz2 = (4 * pi^2 * A / L^2) * sin^2(pi * u) * (3 * cos^2(pi * u) - sin^2(pi * u))
      const d2x = (4 * Math.PI * Math.PI * seg.amp / (L * L)) * (sinU * sinU) * (3 * cosU * cosU - sinU * sinU);

      const yaw = Math.atan2(dx, 1);
      // Superelevation (cant) proportional to curvature (RDSO max cant ~165 mm on BG, ~0.035 rad in simulation)
      const cant = -Math.max(-0.035, Math.min(0.035, d2x * 18.0));

      return { x, dx, yaw, cant };
    }
  }

  return { x: 0, dx: 0, yaw: 0, cant: 0 };
}
