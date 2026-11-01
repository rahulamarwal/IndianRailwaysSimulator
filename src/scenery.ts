import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { RendererContext } from './renderer';
import { TrackConfig } from './types';
import { getTrackCurve } from './curve';

// =========================================================================
// 1. PROCEDURAL SAHYADRI (WESTERN GHATS) MOUNTAIN GEOMETRIES
// Stepped Basalt Terraces (Deccan Traps) & Iconic Nagphani / Duke's Nose Crags
// =========================================================================

/**
 * Creates authentic stepped basalt plateau geometry (Lohagad / Visapur / Rajmachi Mesas)
 * with talus slope, vertical cliff 1, terrace bench, vertical cliff 2, and flat tableland summit.
 */
function createSahyadriMesaGeo(baseRadius = 65, height = 80): THREE.BufferGeometry {
  const radSegs = 32;
  const vertRings = [
    { y: 0.00, r: 1.00 }, // Base ground level
    { y: 0.12, r: 0.88 }, // Talus scree slope
    { y: 0.24, r: 0.82 }, // Lower cliff 1 base
    { y: 0.38, r: 0.79 }, // Lower cliff 1 mid
    { y: 0.52, r: 0.76 }, // Lower cliff 1 top rim
    { y: 0.58, r: 0.62 }, // Intermediate horizontal terrace bench
    { y: 0.64, r: 0.58 }, // Upper cliff 2 base
    { y: 0.78, r: 0.54 }, // Upper cliff 2 mid
    { y: 0.90, r: 0.50 }, // Upper cliff 2 top rim
    { y: 0.96, r: 0.46 }, // Tableland plateau perimeter
    { y: 1.00, r: 0.00 }  // Tableland center apex
  ];

  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let ring = 0; ring < vertRings.length; ring++) {
    const vr = vertRings[ring];
    const y = vr.y * height;
    const rScale = vr.r * baseRadius;

    if (ring === vertRings.length - 1) {
      positions.push(0, y, 0);
      uvs.push(0.5, 0.5);
    } else {
      for (let s = 0; s < radSegs; s++) {
        const theta = (s / radSegs) * Math.PI * 2;
        // Organic harmonic perturbation creating natural spurs, couloirs & ridges
        const pert = 1.0 + 0.22 * Math.sin(3 * theta) + 0.14 * Math.cos(5 * theta + 0.9) + 0.08 * Math.sin(7 * theta - 1.2);
        const r = rScale * pert;
        const x = Math.cos(theta) * r;
        const z = Math.sin(theta) * r;

        positions.push(x, y, z);
        uvs.push((s / radSegs) * 4, vr.y * 6);
      }
    }
  }

  for (let ring = 0; ring < vertRings.length - 2; ring++) {
    const rStart = ring * radSegs;
    const nextStart = (ring + 1) * radSegs;
    for (let s = 0; s < radSegs; s++) {
      const nextS = (s + 1) % radSegs;
      const p1 = rStart + s;
      const p2 = rStart + nextS;
      const p3 = nextStart + s;
      const p4 = nextStart + nextS;

      indices.push(p1, p3, p2);
      indices.push(p2, p3, p4);
    }
  }

  const topCenterIdx = positions.length / 3 - 1;
  const rimStart = (vertRings.length - 2) * radSegs;
  for (let s = 0; s < radSegs; s++) {
    const nextS = (s + 1) % radSegs;
    indices.push(rimStart + s, topCenterIdx, rimStart + nextS);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Creates asymmetric Nagphani / Duke's Nose volcanic pinnacle geometry
 * with sheer vertical drop on one side and jagged pointed apex prow.
 */
function createSahyadriPinnacleGeo(baseRadius = 45, height = 110): THREE.BufferGeometry {
  const radSegs = 28;
  const vertRings = [
    { y: 0.00, r: 1.00, shiftX: 0 },
    { y: 0.15, r: 0.85, shiftX: 3 },
    { y: 0.35, r: 0.72, shiftX: 7 },
    { y: 0.55, r: 0.58, shiftX: 12 },
    { y: 0.75, r: 0.42, shiftX: 18 },
    { y: 0.90, r: 0.25, shiftX: 23 },
    { y: 1.00, r: 0.00, shiftX: 28 }
  ];

  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let ring = 0; ring < vertRings.length; ring++) {
    const vr = vertRings[ring];
    const y = vr.y * height;
    const rScale = vr.r * baseRadius;

    if (ring === vertRings.length - 1) {
      positions.push(vr.shiftX, y, 0);
      uvs.push(0.5, 0.5);
    } else {
      for (let s = 0; s < radSegs; s++) {
        const theta = (s / radSegs) * Math.PI * 2;
        // Sheer vertical drop on western flank
        const asym = Math.cos(theta) < 0 ? 0.72 : 1.28;
        const pert = (1.0 + 0.24 * Math.sin(3 * theta) + 0.14 * Math.cos(4 * theta)) * asym;
        const r = rScale * pert;
        const x = vr.shiftX + Math.cos(theta) * r;
        const z = Math.sin(theta) * r;

        positions.push(x, y, z);
        uvs.push((s / radSegs) * 3, vr.y * 5);
      }
    }
  }

  for (let ring = 0; ring < vertRings.length - 2; ring++) {
    const rStart = ring * radSegs;
    const nextStart = (ring + 1) * radSegs;
    for (let s = 0; s < radSegs; s++) {
      const nextS = (s + 1) % radSegs;
      indices.push(rStart + s, nextStart + s, rStart + nextS);
      indices.push(rStart + nextS, nextStart + s, nextStart + nextS);
    }
  }

  const topCenterIdx = positions.length / 3 - 1;
  const rimStart = (vertRings.length - 2) * radSegs;
  for (let s = 0; s < radSegs; s++) {
    const nextS = (s + 1) % radSegs;
    indices.push(rimStart + s, topCenterIdx, rimStart + nextS);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Rolling green foothill massif with organic ridges
 */
function createSahyadriFoothillGeo(radius = 28, height = 24): THREE.BufferGeometry {
  const geo = new THREE.SphereGeometry(radius, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.52);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const ang = Math.atan2(z, x);
    const dist = Math.sqrt(x * x + z * z);
    const pert = 1.0 + 0.25 * Math.sin(ang * 4) + 0.15 * Math.cos(ang * 6 + 1.2);
    pos.setX(i, x * pert);
    pos.setZ(i, z * pert * 1.3);
    pos.setY(i, (y / radius) * height * (0.85 + 0.15 * Math.sin(dist * 0.2)));
  }
  geo.computeVertexNormals();
  return geo;
}

/**
 * Fractured volcanic basalt rock outcrop boulder for railway cuttings
 */
function createBasaltRockGeo(): THREE.BufferGeometry {
  const geo = new THREE.DodecahedronGeometry(3.6, 1);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const n = Math.sin(x * 2.2) * Math.cos(y * 2.4) * Math.sin(z * 2.6);
    pos.setXYZ(i, x + n * 0.45, Math.max(0, y + n * 0.35), z + n * 0.45);
  }
  geo.computeVertexNormals();
  return geo;
}

// =========================================================================
// 2. INDIGENOUS PUNE - LONAVALA TREE GEOMETRIES (COMPOUND MULTI-CLUMP MODELS)
// =========================================================================

/**
 * 1. Spreading Grand Banyan / Peepal (Ficus benghalensis / Ficus religiosa)
 * Massive gnarled multi-stem trunk + 15m broad spreading umbrella canopy with 7 foliage clumps
 */
function createBanyanTreeGeometries(): { trunkGeo: THREE.BufferGeometry; crownGeo: THREE.BufferGeometry } {
  // Gnarled base with buttress roots and angled spreading boughs
  const trunkParts: THREE.BufferGeometry[] = [];
  const baseTrunk = new THREE.CylinderGeometry(0.55, 0.95, 4.2, 8);
  baseTrunk.translate(0, 2.1, 0);
  trunkParts.push(baseTrunk);

  for (let i = 0; i < 4; i++) {
    const ang = (i / 4) * Math.PI * 2;
    const root = new THREE.CylinderGeometry(0.18, 0.42, 2.8, 6);
    root.rotateZ(0.45);
    root.rotateY(ang);
    root.translate(Math.cos(ang) * 0.75, 1.0, Math.sin(ang) * 0.75);
    trunkParts.push(root);
  }

  for (let i = 0; i < 3; i++) {
    const ang = (i / 3) * Math.PI * 2 + 0.5;
    const bough = new THREE.CylinderGeometry(0.22, 0.38, 3.2, 6);
    bough.rotateZ(0.55);
    bough.rotateY(ang);
    bough.translate(Math.cos(ang) * 1.2, 4.2, Math.sin(ang) * 1.2);
    trunkParts.push(bough);
  }
  const trunkGeo = mergeGeometries(trunkParts)!;

  // Sprawling 15m umbrella canopy with 7 interlocking clumps
  const crownParts: THREE.BufferGeometry[] = [];
  const topClump = new THREE.DodecahedronGeometry(4.4, 1);
  topClump.scale(1.2, 0.7, 1.2);
  topClump.translate(0, 5.2, 0);
  crownParts.push(topClump);

  for (let i = 0; i < 4; i++) {
    const ang = (i / 4) * Math.PI * 2 + 0.25;
    const lobe = new THREE.DodecahedronGeometry(3.6, 1);
    lobe.scale(1.15, 0.65, 1.15);
    lobe.translate(Math.cos(ang) * 4.6, 4.4, Math.sin(ang) * 4.6);
    crownParts.push(lobe);
  }

  for (let i = 0; i < 2; i++) {
    const ang = i * Math.PI + 0.8;
    const skirt = new THREE.DodecahedronGeometry(2.8, 1);
    skirt.scale(1.0, 0.55, 1.0);
    skirt.translate(Math.cos(ang) * 6.2, 3.5, Math.sin(ang) * 6.2);
    crownParts.push(skirt);
  }
  const crownGeo = mergeGeometries(crownParts)!;

  return { trunkGeo, crownGeo };
}

/**
 * 2. Flowering Gulmohar / Flame Tree (Delonix regia)
 * Slender branching trunk + tiered flat-topped umbrella crown with vermilion flower clusters
 */
function createGulmoharTreeGeometries(): { trunkGeo: THREE.BufferGeometry; crownGeo: THREE.BufferGeometry } {
  const trunkParts: THREE.BufferGeometry[] = [];
  const baseTrunk = new THREE.CylinderGeometry(0.24, 0.42, 4.4, 7);
  baseTrunk.translate(0, 2.2, 0);
  trunkParts.push(baseTrunk);

  for (let i = 0; i < 3; i++) {
    const ang = (i / 3) * Math.PI * 2;
    const branch = new THREE.CylinderGeometry(0.14, 0.22, 2.8, 6);
    branch.rotateZ(0.65);
    branch.rotateY(ang);
    branch.translate(Math.cos(ang) * 1.0, 4.2, Math.sin(ang) * 1.0);
    trunkParts.push(branch);
  }
  const trunkGeo = mergeGeometries(trunkParts)!;

  // Flat-topped umbrella crown (5 tiered horizontal clumps spanning 11m)
  const crownParts: THREE.BufferGeometry[] = [];
  const centerTop = new THREE.DodecahedronGeometry(3.6, 1);
  centerTop.scale(1.3, 0.48, 1.3);
  centerTop.translate(0, 5.0, 0);
  crownParts.push(centerTop);

  for (let i = 0; i < 4; i++) {
    const ang = (i / 4) * Math.PI * 2 + 0.4;
    const tier = new THREE.DodecahedronGeometry(3.0, 1);
    tier.scale(1.2, 0.42, 1.2);
    tier.translate(Math.cos(ang) * 3.8, 4.6, Math.sin(ang) * 3.8);
    crownParts.push(tier);
  }
  const crownGeo = mergeGeometries(crownParts)!;

  return { trunkGeo, crownGeo };
}

/**
 * 3. Dense Neem (Azadirachta indica) & Mango (Mangifera indica)
 * Sturdy dark trunk + 5 billowing cloud-like leaf masses creating natural deep shadows
 */
function createNeemTreeGeometries(): { trunkGeo: THREE.BufferGeometry; crownGeo: THREE.BufferGeometry } {
  const trunkParts: THREE.BufferGeometry[] = [];
  const baseTrunk = new THREE.CylinderGeometry(0.28, 0.46, 3.8, 7);
  baseTrunk.translate(0, 1.9, 0);
  trunkParts.push(baseTrunk);

  for (let i = 0; i < 3; i++) {
    const ang = (i / 3) * Math.PI * 2 + 0.2;
    const branch = new THREE.CylinderGeometry(0.16, 0.26, 2.2, 6);
    branch.rotateZ(0.48);
    branch.rotateY(ang);
    branch.translate(Math.cos(ang) * 0.7, 3.2, Math.sin(ang) * 0.7);
    trunkParts.push(branch);
  }
  const trunkGeo = mergeGeometries(trunkParts)!;

  // 5 billowing cloud-like masses
  const crownParts: THREE.BufferGeometry[] = [];
  const topMass = new THREE.DodecahedronGeometry(3.2, 1);
  topMass.scale(1.05, 0.95, 1.05);
  topMass.translate(0, 5.2, 0);
  crownParts.push(topMass);

  for (let i = 0; i < 4; i++) {
    const ang = (i / 4) * Math.PI * 2 + 0.35;
    const sideMass = new THREE.DodecahedronGeometry(2.6, 1);
    sideMass.scale(1.1, 0.85, 1.1);
    sideMass.translate(Math.cos(ang) * 2.4, 4.2, Math.sin(ang) * 2.4);
    crownParts.push(sideMass);
  }
  const crownGeo = mergeGeometries(crownParts)!;

  return { trunkGeo, crownGeo };
}

/**
 * 4. Wild Date Palms (Phoenix sylvestris / Shindi) & Coconut Palms
 * Curved, leaning segmented trunk + 10 individual arching, drooping feather fronds in 360° rosette
 */
function createPalmTreeGeometries(): { trunkGeo: THREE.BufferGeometry; crownGeo: THREE.BufferGeometry } {
  // Curved trunk made of 6 chained leaning segments
  const trunkParts: THREE.BufferGeometry[] = [];
  let curX = 0, curY = 0, curZ = 0;
  const segCount = 6;
  const totalH = 9.5;
  const segH = totalH / segCount;
  for (let i = 0; i < segCount; i++) {
    const rTop = 0.22 - (i / segCount) * 0.06;
    const rBot = 0.28 - (i / segCount) * 0.06;
    const seg = new THREE.CylinderGeometry(rTop, rBot, segH, 7);
    const lean = (i / segCount) * 0.12;
    seg.rotateZ(lean);
    curX += Math.sin(lean) * (segH * 0.5);
    curY += Math.cos(lean) * (segH * 0.5);
    seg.translate(curX, curY, curZ);
    curX += Math.sin(lean) * (segH * 0.5);
    curY += Math.cos(lean) * (segH * 0.5);
    trunkParts.push(seg);
  }
  const trunkGeo = mergeGeometries(trunkParts)!;

  // Crown: 10 arching, drooping feather fronds cascading in a rosette
  const frondParts: THREE.BufferGeometry[] = [];
  const frondCount = 10;
  for (let i = 0; i < frondCount; i++) {
    const ang = (i / frondCount) * Math.PI * 2;
    const droop = 0.65 + (i % 2) * 0.2; // alternating natural droop
    const frond = new THREE.PlaneGeometry(0.75, 4.2, 2, 4);
    frond.translate(0, 2.1, 0);
    frond.rotateX(droop);
    frond.rotateY(ang);
    frond.translate(curX, curY, curZ);
    frondParts.push(frond);
  }
  const crownGeo = mergeGeometries(frondParts)!;

  return { trunkGeo, crownGeo };
}

/**
 * 5. Trackside Ghat Shrubbery & Lantana Camara Clump
 */
function createBushGeometry(): THREE.BufferGeometry {
  const bushParts: THREE.BufferGeometry[] = [];
  const c0 = new THREE.DodecahedronGeometry(1.6, 1);
  c0.scale(1.2, 0.6, 1.2);
  c0.translate(0, 0.7, 0);
  bushParts.push(c0);

  for (let i = 0; i < 3; i++) {
    const ang = (i / 3) * Math.PI * 2;
    const ci = new THREE.DodecahedronGeometry(1.2, 1);
    ci.scale(1.1, 0.55, 1.1);
    ci.translate(Math.cos(ang) * 1.1, 0.55, Math.sin(ang) * 1.1);
    bushParts.push(ci);
  }
  return mergeGeometries(bushParts)!;
}

// =========================================================================
// 3. MAIN SCENERY BUILDER
// =========================================================================

export function buildScenery(ctx: RendererContext, config: TrackConfig): THREE.Group {
  const sceneryGroup = new THREE.Group();
  const { scene, createMaterial, createCanvasTexture } = ctx;
  const { startZ, endZ } = config;

  let seed = 89;
  const rnd = (): number => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };

  const dummy = new THREE.Object3D();

  // Helper to place any object offset relative to curved track centerline
  const getCurvePos = (lateralX: number, z: number, y = 0) => {
    const pt = getTrackCurve(z);
    const nx = Math.cos(pt.yaw);
    const nz = -Math.sin(pt.yaw);
    return {
      x: pt.x + lateralX * nx,
      y,
      z: z + lateralX * nz,
      yaw: pt.yaw
    };
  };

  // =========================================================================
  // HIGH-RESOLUTION PROCEDURAL NATURAL TEXTURES
  // =========================================================================

  // A. Weathered Deccan Basalt Rock Texture (Volcanic cooling strata, rain streaks & moss patina)
  const basaltTexture = createCanvasTexture(1024, 1024, (c, w, h) => {
    c.fillStyle = '#262923';
    c.fillRect(0, 0, w, h);

    // Basalt mineral noise
    for (let i = 0; i < 45000; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const val = 28 + Math.floor(Math.random() * 34);
      c.fillStyle = `rgb(${val + 2}, ${val + 5}, ${val})`;
      c.fillRect(x, y, 2, 2);
    }

    // Horizontal volcanic flow strata bands
    const bands = 18;
    for (let b = 0; b < bands; b++) {
      const y = (b / bands) * h + (Math.random() - 0.5) * 20;
      const bandH = 14 + Math.random() * 26;
      c.fillStyle = b % 2 === 0 ? 'rgba(18, 20, 16, 0.45)' : 'rgba(54, 60, 48, 0.35)';
      c.fillRect(0, y, w, bandH);

      c.strokeStyle = 'rgba(12, 14, 10, 0.65)';
      c.lineWidth = 2.5;
      c.beginPath();
      c.moveTo(0, y);
      for (let x = 0; x <= w; x += 30) {
        c.lineTo(x, y + (Math.random() - 0.5) * 4);
      }
      c.stroke();
    }

    // Vertical rainwater weathering runoff streaks
    for (let s = 0; s < 50; s++) {
      const sx = Math.random() * w;
      const sw = 6 + Math.random() * 18;
      const grad = c.createLinearGradient(sx, 0, sx + sw, 0);
      grad.addColorStop(0, 'rgba(14, 16, 12, 0)');
      grad.addColorStop(0.5, 'rgba(14, 16, 12, 0.42)');
      grad.addColorStop(1, 'rgba(14, 16, 12, 0)');
      c.fillStyle = grad;
      c.fillRect(sx, 0, sw, h);
    }

    // Green monsoon moss & lichen patches on ledges
    for (let m = 0; m < 140; m++) {
      const mx = Math.random() * w;
      const my = Math.random() * h;
      const rad = 10 + Math.random() * 32;
      const mGrad = c.createRadialGradient(mx, my, 2, mx, my, rad);
      mGrad.addColorStop(0, 'rgba(74, 98, 52, 0.55)');
      mGrad.addColorStop(1, 'rgba(74, 98, 52, 0)');
      c.fillStyle = mGrad;
      c.beginPath();
      c.arc(mx, my, rad, 0, Math.PI * 2);
      c.fill();
    }
  });
  basaltTexture.wrapS = THREE.RepeatWrapping;
  basaltTexture.wrapT = THREE.RepeatWrapping;

  const basaltMat = new THREE.MeshStandardMaterial({
    map: basaltTexture,
    roughness: 0.94,
    metalness: 0.06
  });

  // B. Furrowed Tree Bark Texture
  const barkTexture = createCanvasTexture(256, 512, (c, w, h) => {
    c.fillStyle = '#3a2d20';
    c.fillRect(0, 0, w, h);

    for (let i = 0; i < 18000; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const val = 34 + Math.floor(Math.random() * 40);
      c.fillStyle = `rgb(${val + 10}, ${val + 5}, ${val})`;
      c.fillRect(x, y, 1.5, 3);
    }

    for (let f = 0; f < 28; f++) {
      const fx = (f / 28) * w + (Math.random() - 0.5) * 8;
      c.strokeStyle = 'rgba(16, 12, 8, 0.7)';
      c.lineWidth = 2 + Math.random() * 2;
      c.beginPath();
      c.moveTo(fx, 0);
      for (let y = 0; y <= h; y += 20) {
        c.lineTo(fx + (Math.random() - 0.5) * 5, y);
      }
      c.stroke();
    }
  });
  const barkMat = new THREE.MeshStandardMaterial({
    map: barkTexture,
    roughness: 0.92,
    metalness: 0.04
  });

  // C. Palm Frond Feather Leaf Texture
  const palmFrondTexture = createCanvasTexture(128, 512, (c, w, h) => {
    c.fillStyle = '#1e5422';
    c.fillRect(0, 0, w, h);

    c.fillStyle = '#84cc16';
    c.fillRect(w / 2 - 2, 0, 4, h);

    c.strokeStyle = '#143d18';
    c.lineWidth = 1.6;
    for (let y = 0; y < h; y += 6) {
      c.beginPath();
      c.moveTo(w / 2, y);
      c.lineTo(4, y - 8);
      c.moveTo(w / 2, y);
      c.lineTo(w - 4, y - 8);
      c.stroke();
    }
  });
  const palmFrondMat = new THREE.MeshStandardMaterial({
    map: palmFrondTexture,
    roughness: 0.78,
    metalness: 0.05,
    side: THREE.DoubleSide
  });

  // D. Stippled Organic Canopy Leaf Textures
  const createCanopyTexture = (baseHex: string, highlightHex: string) => {
    return createCanvasTexture(256, 256, (c, w, h) => {
      c.fillStyle = baseHex;
      c.fillRect(0, 0, w, h);
      for (let i = 0; i < 12000; i++) {
        const x = Math.random() * w;
        const y = Math.random() * h;
        c.fillStyle = Math.random() > 0.4 ? highlightHex : 'rgba(10, 24, 10, 0.35)';
        c.fillRect(x, y, 2, 2);
      }
    });
  };

  const banyanMat = new THREE.MeshStandardMaterial({
    map: createCanopyTexture('#1e4620', '#2d6a30'),
    roughness: 0.88,
    metalness: 0.02
  });

  const gulmoharMat = new THREE.MeshStandardMaterial({
    map: createCanopyTexture('#dc2626', '#f97316'), // Vibrant flame-red blossoms
    roughness: 0.82,
    metalness: 0.02
  });

  const neemMat = new THREE.MeshStandardMaterial({
    map: createCanopyTexture('#285c29', '#3b803d'),
    roughness: 0.85,
    metalness: 0.02
  });

  const bushMat = new THREE.MeshStandardMaterial({
    map: createCanopyTexture('#2a5522', '#417d35'),
    roughness: 0.9,
    metalness: 0.02
  });

  const foothillMat = createMaterial(0x3e522d, { roughness: 0.95 });

  // =========================================================================
  // SECTION A: WESTERN GHATS NATURE & SAHYADRI HILLS (LONAVALA TO PUNE: Z < 3900)
  // =========================================================================

  // 1. Sahyadri Stepped Basalt Mesas (Lohagad / Visapur Tableland Plateaus)
  const mesaCount = 48;
  const mesaGeo = createSahyadriMesaGeo(75, 95);
  const mesas = new THREE.InstancedMesh(mesaGeo, basaltMat, mesaCount);
  mesas.castShadow = true;
  mesas.receiveShadow = true;

  for (let i = 0; i < mesaCount; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const xDist = side === -1 ? -110 - rnd() * 140 : 120 + rnd() * 140;
    const z = startZ + 80 + (i / mesaCount) * 3650 + (rnd() - 0.5) * 70;
    const scaleY = 0.85 + rnd() * 0.7;
    const scaleXZ = 0.9 + rnd() * 0.6;
    const pos = getCurvePos(xDist, z, 0);

    dummy.position.set(pos.x, pos.y, pos.z);
    dummy.scale.set(scaleXZ, scaleY, scaleXZ);
    dummy.rotation.set(0, rnd() * Math.PI * 2, 0);
    dummy.updateMatrix();
    mesas.setMatrixAt(i, dummy.matrix);
  }
  mesas.instanceMatrix.needsUpdate = true;
  sceneryGroup.add(mesas);

  // 2. Nagphani / Duke's Nose Volcanic Spire Pinnacles (Iconic Khandala / Lonavala landmark)
  const pinnacleCount = 18;
  const pinnacleGeo = createSahyadriPinnacleGeo(50, 125);
  const pinnacles = new THREE.InstancedMesh(pinnacleGeo, basaltMat, pinnacleCount);
  pinnacles.castShadow = true;
  pinnacles.receiveShadow = true;

  for (let i = 0; i < pinnacleCount; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const xDist = side === -1 ? -140 - rnd() * 160 : 150 + rnd() * 160;
    const z = startZ + 250 + (i / pinnacleCount) * 3350 + (rnd() - 0.5) * 60;
    const s = 0.9 + rnd() * 0.6;
    const pos = getCurvePos(xDist, z, 0);

    dummy.position.set(pos.x, pos.y, pos.z);
    dummy.scale.set(s, s * 1.15, s);
    dummy.rotation.set(0, side === -1 ? Math.PI * 0.4 + rnd() * 0.4 : -Math.PI * 0.4 - rnd() * 0.4, 0);
    dummy.updateMatrix();
    pinnacles.setMatrixAt(i, dummy.matrix);
  }
  pinnacles.instanceMatrix.needsUpdate = true;
  sceneryGroup.add(pinnacles);

  // 3. Sahyadri Rolling Ghat Foothills
  const foothillCount = 85;
  const foothillGeo = createSahyadriFoothillGeo(32, 28);
  const foothills = new THREE.InstancedMesh(foothillGeo, foothillMat, foothillCount);
  foothills.receiveShadow = true;

  for (let i = 0; i < foothillCount; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const xDist = side === -1 ? -45 - rnd() * 55 : 48 + rnd() * 55;
    const z = startZ + 50 + (i / foothillCount) * 3700;
    const pos = getCurvePos(xDist, z, -2 + rnd() * 3);
    const sx = 0.9 + rnd() * 0.8;
    const sy = 0.7 + rnd() * 0.6;

    dummy.position.set(pos.x, pos.y, pos.z);
    dummy.scale.set(sx, sy, sx * 1.25);
    dummy.rotation.set(0, rnd() * Math.PI * 2, 0);
    dummy.updateMatrix();
    foothills.setMatrixAt(i, dummy.matrix);
  }
  foothills.instanceMatrix.needsUpdate = true;
  sceneryGroup.add(foothills);

  // 4. Basalt Railway Cutting Rock Outcrops along Trackside
  const cuttingRockCount = 75;
  const cuttingRockGeo = createBasaltRockGeo();
  const cuttingRocks = new THREE.InstancedMesh(cuttingRockGeo, basaltMat, cuttingRockCount);
  cuttingRocks.castShadow = true;
  cuttingRocks.receiveShadow = true;

  for (let i = 0; i < cuttingRockCount; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const xDist = side === -1 ? -14 - rnd() * 12 : 17 + rnd() * 12;
    const z = 450 + (i / cuttingRockCount) * 2300 + (rnd() - 0.5) * 25;
    const s = 1.0 + rnd() * 1.4;
    const pos = getCurvePos(xDist, z, 0.4);

    dummy.position.set(pos.x, pos.y, pos.z);
    dummy.scale.set(s * 1.4, s * 0.9, s * 1.3);
    dummy.rotation.set((rnd() - 0.5) * 0.4, rnd() * Math.PI * 2, (rnd() - 0.5) * 0.3);
    dummy.updateMatrix();
    cuttingRocks.setMatrixAt(i, dummy.matrix);
  }
  cuttingRocks.instanceMatrix.needsUpdate = true;
  sceneryGroup.add(cuttingRocks);

  // 5. Spreading Grand Banyan & Peepal Trees (Ficus benghalensis / Ficus religiosa)
  const banyanCount = 130;
  const { trunkGeo: bTrunkGeo, crownGeo: bCrownGeo } = createBanyanTreeGeometries();
  const banyanTrunks = new THREE.InstancedMesh(bTrunkGeo, barkMat, banyanCount);
  const banyanCrowns = new THREE.InstancedMesh(bCrownGeo, banyanMat, banyanCount);
  banyanTrunks.castShadow = true;
  banyanCrowns.castShadow = true;

  for (let i = 0; i < banyanCount; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const xDist = side === -1 ? -22 - rnd() * 55 : 26 + rnd() * 55;
    const z = startZ + 35 + (i / banyanCount) * 3720 + (rnd() - 0.5) * 25;
    const s = 0.85 + rnd() * 0.55;
    const pos = getCurvePos(xDist, z, 0);

    dummy.position.set(pos.x, pos.y, pos.z);
    dummy.scale.set(s, s, s);
    dummy.rotation.set(0, rnd() * Math.PI * 2, 0);
    dummy.updateMatrix();
    banyanTrunks.setMatrixAt(i, dummy.matrix);
    banyanCrowns.setMatrixAt(i, dummy.matrix);
  }
  banyanTrunks.instanceMatrix.needsUpdate = true;
  banyanCrowns.instanceMatrix.needsUpdate = true;
  sceneryGroup.add(banyanTrunks, banyanCrowns);

  // 6. Flowering Gulmohar Trees (Delonix regia - Flame of the Forest)
  const gulmoharCount = 140;
  const { trunkGeo: gTrunkGeo, crownGeo: gCrownGeo } = createGulmoharTreeGeometries();
  const gulmoharTrunks = new THREE.InstancedMesh(gTrunkGeo, barkMat, gulmoharCount);
  const gulmoharCrowns = new THREE.InstancedMesh(gCrownGeo, gulmoharMat, gulmoharCount);
  gulmoharTrunks.castShadow = true;
  gulmoharCrowns.castShadow = true;

  for (let i = 0; i < gulmoharCount; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const xDist = side === -1 ? -17 - rnd() * 45 : 22 + rnd() * 45;
    const z = startZ + 60 + (i / gulmoharCount) * 3700 + (rnd() - 0.5) * 20;
    const s = 0.8 + rnd() * 0.5;
    const pos = getCurvePos(xDist, z, 0);

    dummy.position.set(pos.x, pos.y, pos.z);
    dummy.scale.set(s, s, s);
    dummy.rotation.set(0, rnd() * Math.PI * 2, 0);
    dummy.updateMatrix();
    gulmoharTrunks.setMatrixAt(i, dummy.matrix);
    gulmoharCrowns.setMatrixAt(i, dummy.matrix);
  }
  gulmoharTrunks.instanceMatrix.needsUpdate = true;
  gulmoharCrowns.instanceMatrix.needsUpdate = true;
  sceneryGroup.add(gulmoharTrunks, gulmoharCrowns);

  // 7. Dense Neem & Mango Trees (Azadirachta indica / Mangifera indica)
  const neemCount = 190;
  const { trunkGeo: nTrunkGeo, crownGeo: nCrownGeo } = createNeemTreeGeometries();
  const neemTrunks = new THREE.InstancedMesh(nTrunkGeo, barkMat, neemCount);
  const neemCrowns = new THREE.InstancedMesh(nCrownGeo, neemMat, neemCount);
  neemTrunks.castShadow = true;
  neemCrowns.castShadow = true;

  for (let i = 0; i < neemCount; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const xDist = side === -1 ? -16 - rnd() * 60 : 21 + rnd() * 60;
    const z = startZ + 20 + (i / neemCount) * 3780 + (rnd() - 0.5) * 20;
    const s = 0.8 + rnd() * 0.6;
    const pos = getCurvePos(xDist, z, 0);

    dummy.position.set(pos.x, pos.y, pos.z);
    dummy.scale.set(s, s, s);
    dummy.rotation.set(0, rnd() * Math.PI * 2, 0);
    dummy.updateMatrix();
    neemTrunks.setMatrixAt(i, dummy.matrix);
    neemCrowns.setMatrixAt(i, dummy.matrix);
  }
  neemTrunks.instanceMatrix.needsUpdate = true;
  neemCrowns.instanceMatrix.needsUpdate = true;
  sceneryGroup.add(neemTrunks, neemCrowns);

  // 8. Wild Date Palms (Phoenix sylvestris / Shindi) & Coconut Palms with Curved Trunks
  const palmCount = 110;
  const { trunkGeo: pTrunkGeo, crownGeo: pCrownGeo } = createPalmTreeGeometries();
  const palmTrunks = new THREE.InstancedMesh(pTrunkGeo, barkMat, palmCount);
  const palmCrowns = new THREE.InstancedMesh(pCrownGeo, palmFrondMat, palmCount);
  palmTrunks.castShadow = true;
  palmCrowns.castShadow = true;

  for (let i = 0; i < palmCount; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const xDist = side === -1 ? -18 - rnd() * 45 : 24 + rnd() * 45;
    const z = startZ + 80 + (i / palmCount) * 3650 + (rnd() - 0.5) * 30;
    const s = 0.85 + rnd() * 0.4;
    const pos = getCurvePos(xDist, z, 0);

    dummy.position.set(pos.x, pos.y, pos.z);
    dummy.scale.set(s, s, s);
    dummy.rotation.set(0, rnd() * Math.PI * 2, 0);
    dummy.updateMatrix();
    palmTrunks.setMatrixAt(i, dummy.matrix);
    palmCrowns.setMatrixAt(i, dummy.matrix);
  }
  palmTrunks.instanceMatrix.needsUpdate = true;
  palmCrowns.instanceMatrix.needsUpdate = true;
  sceneryGroup.add(palmTrunks, palmCrowns);

  // 9. Ghat Trackside Lantana & Karvi Shrubbery
  const bushCount = 140;
  const bushGeo = createBushGeometry();
  const bushes = new THREE.InstancedMesh(bushGeo, bushMat, bushCount);
  bushes.receiveShadow = true;

  for (let i = 0; i < bushCount; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const xDist = side === -1 ? -9 - rnd() * 12 : 12 + rnd() * 12;
    const z = startZ + 15 + (i / bushCount) * 3800;
    const s = 0.8 + rnd() * 0.6;
    const pos = getCurvePos(xDist, z, 0.2);

    dummy.position.set(pos.x, pos.y, pos.z);
    dummy.scale.set(s, s, s);
    dummy.rotation.set(0, rnd() * Math.PI * 2, 0);
    dummy.updateMatrix();
    bushes.setMatrixAt(i, dummy.matrix);
  }
  bushes.instanceMatrix.needsUpdate = true;
  sceneryGroup.add(bushes);

  // =========================================================================
  // 10. MULA-MUTHA RIVER RAIL BRIDGE CROSSING (BETWEEN SHIVAJI NAGAR & PUNE: z = 3100 to 3340)
  // Completely underneath and outside the tracks (Zero collision with trains!)
  // =========================================================================
  const riverGroup = new THREE.Group();
  const riverWaterMat = new THREE.MeshStandardMaterial({
    color: 0x1a4668,
    metalness: 0.45,
    roughness: 0.12
  });

  const riverGeo = new THREE.PlaneGeometry(420, 260);
  const riverMesh = new THREE.Mesh(riverGeo, riverWaterMat);
  riverMesh.rotation.x = -Math.PI / 2;
  const riverMidPos = getCurvePos(2.65, 3225);
  riverMesh.position.set(riverMidPos.x, -2.2, riverMidPos.z);
  riverMesh.rotation.z = riverMidPos.yaw;
  riverGroup.add(riverMesh);

  // Curved Bridge Deck Girder directly UNDER the trackbed (y = 0.05m to -0.65m)
  const bridgeGirderMat = createMaterial(0x3e454d, { metalness: 0.75, roughness: 0.35 });
  const bridgeDeckStep = 4.0;
  const bridgeSlices = Math.ceil(240 / bridgeDeckStep);
  const girderPos: number[] = [];
  const girderIndices: number[] = [];

  const railingMat = createMaterial(0x64748b, { metalness: 0.8, roughness: 0.3 });
  const leftRailingPos: number[] = [];
  const rightRailingPos: number[] = [];
  const railingIndices: number[] = [];

  for (let i = 0; i <= bridgeSlices; i++) {
    const z = 3100 + i * bridgeDeckStep;
    const pt = getTrackCurve(z);
    const nx = Math.cos(pt.yaw);
    const nz = -Math.sin(pt.yaw);

    const lx = pt.x - 4.4 * nx;
    const lz = z - 4.4 * nz;
    const rx = pt.x + 10.0 * nx;
    const rz = z + 10.0 * nz;

    girderPos.push(lx, 0.05, lz);
    girderPos.push(lx, -0.65, lz);
    girderPos.push(rx, 0.05, rz);
    girderPos.push(rx, -0.65, rz);

    leftRailingPos.push(lx, 0.45, lz);
    leftRailingPos.push(lx, 1.35, lz);

    rightRailingPos.push(rx, 0.45, rz);
    rightRailingPos.push(rx, 1.35, rz);

    if (i < bridgeSlices) {
      const b = i * 4;
      const nb = (i + 1) * 4;
      girderIndices.push(b + 0, b + 2, nb + 2);
      girderIndices.push(b + 0, nb + 2, nb + 0);
      girderIndices.push(b + 1, nb + 3, b + 3);
      girderIndices.push(b + 1, nb + 1, nb + 3);
      girderIndices.push(b + 0, nb + 0, nb + 1);
      girderIndices.push(b + 0, nb + 1, b + 1);
      girderIndices.push(b + 2, b + 3, nb + 3);
      girderIndices.push(b + 2, nb + 3, nb + 2);

      const rb = i * 2;
      const nrb = (i + 1) * 2;
      railingIndices.push(rb + 0, rb + 1, nrb + 1);
      railingIndices.push(rb + 0, nrb + 1, nrb + 0);
    }
  }

  const girderGeo = new THREE.BufferGeometry();
  girderGeo.setAttribute('position', new THREE.Float32BufferAttribute(girderPos, 3));
  girderGeo.setIndex(girderIndices);
  girderGeo.computeVertexNormals();
  const girderMesh = new THREE.Mesh(girderGeo, bridgeGirderMat);
  girderMesh.receiveShadow = true;
  riverGroup.add(girderMesh);

  const lRailGeo = new THREE.BufferGeometry();
  lRailGeo.setAttribute('position', new THREE.Float32BufferAttribute(leftRailingPos, 3));
  lRailGeo.setIndex(railingIndices);
  lRailGeo.computeVertexNormals();
  const lRailMesh = new THREE.Mesh(lRailGeo, railingMat);

  const rRailGeo = new THREE.BufferGeometry();
  rRailGeo.setAttribute('position', new THREE.Float32BufferAttribute(rightRailingPos, 3));
  rRailGeo.setIndex(railingIndices);
  rRailGeo.computeVertexNormals();
  const rRailMesh = new THREE.Mesh(rRailGeo, railingMat);

  riverGroup.add(lRailMesh, rRailMesh);

  const pierMat = createMaterial(0x8c857b, { roughness: 0.9 });
  const pierGeo = new THREE.BoxGeometry(13.6, 3.4, 3.6);
  [3140, 3190, 3240, 3290].forEach(pz => {
    const pPos = getCurvePos(2.65, pz);
    const pier = new THREE.Mesh(pierGeo, pierMat);
    pier.position.set(pPos.x, -2.35, pPos.z);
    pier.rotation.y = pPos.yaw;
    pier.castShadow = true;
    pier.receiveShadow = true;
    riverGroup.add(pier);
  });

  sceneryGroup.add(riverGroup);

  // 11. Rustic Konkan / Ghat Clay Huts with Mangalore Tile Roofs
  const hutCount = 28;
  const hutWallMat = createMaterial(0xd1c7b7, { roughness: 0.9 });
  const hutRoofMat = createMaterial(0xa0421d, { roughness: 0.65 });
  const huts = new THREE.InstancedMesh(new THREE.BoxGeometry(6.5, 3.2, 5.0), hutWallMat, hutCount);
  const hutRoofs = new THREE.InstancedMesh(new THREE.ConeGeometry(5.2, 2.4, 4), hutRoofMat, hutCount);

  for (let i = 0; i < hutCount; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const xDist = side === -1 ? -28 - rnd() * 40 : 34 + rnd() * 40;
    const z = startZ + 120 + (i / hutCount) * 3600;
    const pos = getCurvePos(xDist, z, 1.6);

    dummy.position.set(pos.x, pos.y, pos.z);
    dummy.scale.set(1, 1, 1);
    dummy.rotation.set(0, pos.yaw + (rnd() - 0.5) * 0.4, 0);
    dummy.updateMatrix();
    huts.setMatrixAt(i, dummy.matrix);

    dummy.position.set(pos.x, 3.8, pos.z);
    dummy.rotation.set(0, pos.yaw + Math.PI / 4, 0);
    dummy.updateMatrix();
    hutRoofs.setMatrixAt(i, dummy.matrix);
  }
  huts.instanceMatrix.needsUpdate = true;
  hutRoofs.instanceMatrix.needsUpdate = true;
  sceneryGroup.add(huts, hutRoofs);

  // =========================================================================
  // SECTION B: INDUSTRIAL CORRIDOR & URBAN SETTLEMENTS (PUNE TO DAUND: Z >= 3900)
  // =========================================================================

  // 1. Multi-Storey Residential Colonies, Chawls & Apartments
  const buildingColors = [
    0xd97706, // Indian Ochre
    0xbe123c, // Terracotta Red
    0x059669, // Mint / Olive Green
    0xfef3c7, // Ivory Plaster
    0x0284c7, // Sky Blue
    0xea580c, // Sandstone Orange
    0x475569  // Exposed Concrete Grey
  ];

  const buildingTexture = createCanvasTexture(512, 512, (c, w, h) => {
    c.fillStyle = '#e5e0d8';
    c.fillRect(0, 0, w, h);

    for (let i = 0; i < 4000; i++) {
      const px = Math.random() * w;
      const py = Math.random() * h;
      c.fillStyle = 'rgba(0,0,0,0.03)';
      c.fillRect(px, py, 2, 4);
    }

    const floors = 6;
    const bays = 8;
    const dw = w / bays;
    const dh = h / floors;

    for (let f = 0; f < floors; f++) {
      for (let b = 0; b < bays; b++) {
        const wx = b * dw + 12;
        const wy = f * dh + 16;
        const ww = dw - 24;
        const wh = dh - 32;

        c.fillStyle = '#9e9689';
        c.fillRect(wx - 4, wy - 8, ww + 8, 6);

        c.fillStyle = '#182430';
        c.fillRect(wx, wy, ww, wh);

        c.strokeStyle = '#4a5568';
        c.lineWidth = 1.5;
        c.strokeRect(wx, wy, ww, wh);
      }
    }
  });
  buildingTexture.wrapS = THREE.RepeatWrapping;
  buildingTexture.wrapT = THREE.RepeatWrapping;

  const buildingMat = new THREE.MeshStandardMaterial({
    roughness: 0.85,
    metalness: 0.1,
    map: buildingTexture
  });

  const buildingCount = 160;
  const buildings = new THREE.InstancedMesh(new THREE.BoxGeometry(16, 14, 12), buildingMat, buildingCount);
  buildings.castShadow = true;
  buildings.receiveShadow = true;

  const tankMat = createMaterial(0x18181b, { roughness: 0.7 });
  const waterTanks = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.85, 0.85, 1.6, 12), tankMat, buildingCount * 2);

  const penthouseMat = createMaterial(0xd6d3d1, { roughness: 0.9 });
  const penthouses = new THREE.InstancedMesh(new THREE.BoxGeometry(4.0, 2.6, 3.5), penthouseMat, buildingCount);

  let tankIdx = 0;

  for (let i = 0; i < buildingCount; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const xDist = side === -1 ? -36 - rnd() * 85 : 32 + rnd() * 85;
    const z = 3900 + (i / buildingCount) * 5050 + (rnd() - 0.5) * 60;
    const heightVar = 0.7 + rnd() * 0.7;
    const pos = getCurvePos(xDist, z, 7 * heightVar);

    dummy.position.set(pos.x, pos.y, pos.z);
    dummy.scale.set(0.9 + rnd() * 0.4, heightVar, 0.8 + rnd() * 0.5);
    dummy.rotation.set(0, pos.yaw + (rnd() - 0.5) * 0.35, 0);
    dummy.updateMatrix();
    buildings.setMatrixAt(i, dummy.matrix);
    buildings.setColorAt(i, new THREE.Color(buildingColors[i % buildingColors.length]));

    const roofY = 14 * heightVar;
    dummy.position.set(pos.x + (rnd() - 0.5) * 4, roofY + 1.3, pos.z + (rnd() - 0.5) * 3);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    penthouses.setMatrixAt(i, dummy.matrix);

    [-1.8, 1.8].forEach(dx => {
      dummy.position.set(pos.x + dx, roofY + 0.8, pos.z + (rnd() - 0.5) * 4);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      waterTanks.setMatrixAt(tankIdx++, dummy.matrix);
    });
  }

  buildings.instanceMatrix.needsUpdate = true;
  if (buildings.instanceColor) buildings.instanceColor.needsUpdate = true;
  waterTanks.instanceMatrix.needsUpdate = true;
  penthouses.instanceMatrix.needsUpdate = true;
  sceneryGroup.add(buildings, waterTanks, penthouses);

  // 2. Concrete Security Boundary Walls along Industrial Zone (z >= 3900)
  const wallMat = createMaterial(0x8a8479, { roughness: 0.9 });
  const wallStep = 8.0;
  const wallSlices = Math.floor((endZ - 3900) / wallStep);
  const wallPos: number[] = [];
  const wallIdx: number[] = [];

  [-18, 22].forEach(wx => {
    const baseV = wallPos.length / 3;
    for (let i = 0; i <= wallSlices; i++) {
      const z = Math.min(3900 + i * wallStep, endZ);
      const pos = getCurvePos(wx, z, 0);
      wallPos.push(pos.x, 0, pos.z);
      wallPos.push(pos.x, 2.2, pos.z);
      if (i < wallSlices) {
        const b = baseV + i * 2;
        wallIdx.push(b, b + 1, b + 3);
        wallIdx.push(b, b + 3, b + 2);
      }
    }
  });

  const wallGeo = new THREE.BufferGeometry();
  wallGeo.setAttribute('position', new THREE.Float32BufferAttribute(wallPos, 3));
  wallGeo.setIndex(wallIdx);
  wallGeo.computeVertexNormals();
  const wallMesh = new THREE.Mesh(wallGeo, wallMat);
  wallMesh.castShadow = true;
  sceneryGroup.add(wallMesh);

  // 3. Hadapsar & Loni Industrial Sheds, Godowns & Warehouses
  const shedCount = 55;
  const shedWallMat = createMaterial(0x64748b, { roughness: 0.7 });
  const shedRoofMat = createMaterial(0x991b1b, { roughness: 0.6, metalness: 0.3 });
  const sheds = new THREE.InstancedMesh(new THREE.BoxGeometry(26, 9, 36), shedWallMat, shedCount);
  const shedRoofs = new THREE.InstancedMesh(new THREE.BoxGeometry(28, 0.4, 38), shedRoofMat, shedCount);
  sheds.castShadow = true;
  shedRoofs.castShadow = true;

  for (let i = 0; i < shedCount; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const xDist = side === -1 ? -48 - rnd() * 65 : 44 + rnd() * 65;
    const z = 4050 + (i / shedCount) * 4850;
    const pos = getCurvePos(xDist, z, 4.5);

    dummy.position.set(pos.x, pos.y, pos.z);
    dummy.scale.set(1, 1, 1);
    dummy.rotation.set(0, pos.yaw + (rnd() - 0.5) * 0.25, 0);
    dummy.updateMatrix();
    sheds.setMatrixAt(i, dummy.matrix);

    dummy.position.set(pos.x, 9.2, pos.z);
    dummy.updateMatrix();
    shedRoofs.setMatrixAt(i, dummy.matrix);
  }
  sheds.instanceMatrix.needsUpdate = true;
  shedRoofs.instanceMatrix.needsUpdate = true;
  sceneryGroup.add(sheds, shedRoofs);

  // 4. Brick & Concrete Industrial Factory Chimneys
  const chimneyCount = 18;
  const chimneyMat = createMaterial(0x78350f, { roughness: 0.95 });
  const chimneys = new THREE.InstancedMesh(new THREE.CylinderGeometry(1.4, 2.8, 38, 14), chimneyMat, chimneyCount);
  chimneys.castShadow = true;

  for (let i = 0; i < chimneyCount; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const xDist = side === -1 ? -75 - rnd() * 55 : 72 + rnd() * 55;
    const z = 4150 + (i / chimneyCount) * 4750;
    const pos = getCurvePos(xDist, z, 19);

    dummy.position.set(pos.x, pos.y, pos.z);
    dummy.scale.set(1, 1, 1);
    dummy.rotation.set(0, 0, 0);
    dummy.updateMatrix();
    chimneys.setMatrixAt(i, dummy.matrix);
  }
  chimneys.instanceMatrix.needsUpdate = true;
  sceneryGroup.add(chimneys);

  // 5. Loni Petroleum Oil Depot (BPCL / HPCL Tank Farm: z = 5600 to 6150)
  const tankCount = 20;
  const oilTankMat = createMaterial(0xf1f5f9, { metalness: 0.45, roughness: 0.35 });
  const oilTanks = new THREE.InstancedMesh(new THREE.CylinderGeometry(12, 12, 14, 24), oilTankMat, tankCount);
  oilTanks.castShadow = true;

  for (let i = 0; i < tankCount; i++) {
    const row = Math.floor(i / 10);
    const col = i % 10;
    const xDist = -55 - row * 32;
    const z = 5650 + col * 48;
    const pos = getCurvePos(xDist, z, 7);

    dummy.position.set(pos.x, pos.y, pos.z);
    dummy.scale.set(1, 1, 1);
    dummy.rotation.set(0, pos.yaw, 0);
    dummy.updateMatrix();
    oilTanks.setMatrixAt(i, dummy.matrix);
  }
  oilTanks.instanceMatrix.needsUpdate = true;
  sceneryGroup.add(oilTanks);

  // 6. High-Voltage Steel Transmission Pylons (220 kV Grid: z >= 3900)
  const pylonCount = 22;
  const pylonMat = createMaterial(0x6b7280, { metalness: 0.8, roughness: 0.4 });
  const pylons = new THREE.InstancedMesh(new THREE.BoxGeometry(4.2, 34, 4.2), pylonMat, pylonCount);
  const pylonArms = new THREE.InstancedMesh(new THREE.BoxGeometry(18, 1.2, 1.8), pylonMat, pylonCount);
  pylons.castShadow = true;

  for (let i = 0; i < pylonCount; i++) {
    const xDist = 65 + (i % 2 === 0 ? 0 : 25);
    const z = 4100 + (i / pylonCount) * 4700;
    const pos = getCurvePos(xDist, z, 17);

    dummy.position.set(pos.x, pos.y, pos.z);
    dummy.scale.set(1, 1, 1);
    dummy.rotation.set(0, pos.yaw, 0);
    dummy.updateMatrix();
    pylons.setMatrixAt(i, dummy.matrix);

    dummy.position.set(pos.x, 30, pos.z);
    dummy.updateMatrix();
    pylonArms.setMatrixAt(i, dummy.matrix);
  }
  pylons.instanceMatrix.needsUpdate = true;
  pylonArms.instanceMatrix.needsUpdate = true;
  sceneryGroup.add(pylons, pylonArms);

  // 7. Indian Railways Level Crossing Gates (LC Gates at z = 4800 and 7400)
  [4800, 7400].forEach(lcZ => {
    const lcGroup = new THREE.Group();
    const lcPos = getCurvePos(2.65, lcZ, 0);
    lcGroup.position.set(lcPos.x, 0, lcPos.z);
    lcGroup.rotation.y = lcPos.yaw;

    const roadMat = createMaterial(0x27272a, { roughness: 0.95 });
    const road = new THREE.Mesh(new THREE.PlaneGeometry(80, 8.5), roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0.08, 0);

    const roadStripe = new THREE.Mesh(new THREE.PlaneGeometry(80, 0.25), createMaterial(0xfef08a));
    roadStripe.rotation.x = -Math.PI / 2;
    roadStripe.position.set(0, 0.09, 0);

    const cabin = new THREE.Mesh(new THREE.BoxGeometry(4.2, 3.2, 3.4), createMaterial(0xfafaf9));
    cabin.position.set(-8.5, 2.0, -7.5);
    const cabinRoof = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.35, 3.8), createMaterial(0x991b1b));
    cabinRoof.position.set(-8.5, 3.75, -7.5);

    [-7.2, 12.5].forEach(bx => {
      const barrierPost = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.4, 8), createMaterial(0x18181b));
      barrierPost.position.set(bx, 0.9, -4.25);

      const boomMat = createMaterial(0xfafaf9);
      const boom = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.18, 9.8), boomMat);
      boom.position.set(bx, 1.15, 0.65);

      for (let s = -4.0; s <= 4.0; s += 1.8) {
        const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.19, 0.75), createMaterial(0xdc2626));
        stripe.position.set(bx, 1.15, 0.65 + s);
        lcGroup.add(stripe);
      }

      const warningDisc = new THREE.Mesh(new THREE.CircleGeometry(0.32, 16), createMaterial(0xdc2626));
      warningDisc.position.set(bx, 1.15, 0.65);
      warningDisc.rotation.y = Math.PI / 2;

      lcGroup.add(barrierPost, boom, warningDisc);
    });

    lcGroup.add(road, roadStripe, cabin, cabinRoof);
    sceneryGroup.add(lcGroup);
  });

  // =========================================================================
  // 8. CROSSING INDIAN RAILWAYS FREIGHT TRAIN ON TRACK 2 (UP LINE) AT LONI SIDINGS (z = 5710 to 5890)
  // Standing on Track 2 (Up Line) facing oncoming traffic, snaking smoothly along the curve!
  // =========================================================================
  const wag9Group = new THREE.Group();
  const locoZ = 5710;
  const lPos = getCurvePos(5.30, locoZ);
  wag9Group.position.set(lPos.x, 0, lPos.z);
  wag9Group.rotation.y = lPos.yaw + Math.PI;

  const wag9BodyMat = createMaterial(0x047857, { roughness: 0.5, metalness: 0.3 });
  const wag9StripeMat = createMaterial(0xfacc15);
  const wag9RoofMat = createMaterial(0x71717a);
  const bogieMat = createMaterial(0x18181b);
  const headlightMat = new THREE.MeshBasicMaterial({ color: 0xfffbeb });

  const wag9Body = new THREE.Mesh(new THREE.BoxGeometry(3.2, 3.4, 20.5), wag9BodyMat);
  wag9Body.position.set(0, 2.75, 0);
  wag9Body.castShadow = true;

  const wag9Stripe = new THREE.Mesh(new THREE.BoxGeometry(3.22, 0.42, 20.6), wag9StripeMat);
  wag9Stripe.position.set(0, 2.55, 0);

  const wag9Roof = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.4, 18.0), wag9RoofMat);
  wag9Roof.position.set(0, 4.65, 0);

  [-6.2, 6.2].forEach(bz => {
    const bogie = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.65, 4.8), bogieMat);
    bogie.position.set(0, 0.72, bz);
    wag9Group.add(bogie);
  });

  [-0.65, 0.65].forEach(hx => {
    const headlight = new THREE.Mesh(new THREE.CircleGeometry(0.24, 16), headlightMat);
    headlight.position.set(hx, 3.1, 10.3);
    wag9Group.add(headlight);
  });

  const pantoArm = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, 1.4, 8),
    createMaterial(0xd83a2e, { metalness: 0.7 })
  );
  pantoArm.position.set(0, 5.4, -4.5);
  wag9Group.add(wag9Body, wag9Stripe, wag9Roof, pantoArm);
  sceneryGroup.add(wag9Group);

  // 10 BTPN Cylindrical Petroleum Oil Tanker Wagons individually curved along Track 2
  const btpnTankMat = createMaterial(0x1c3829, { roughness: 0.45, metalness: 0.25 });
  const btpnStripeMat = createMaterial(0xf59e0b);

  for (let w = 0; w < 10; w++) {
    const wz = 5738.5 + w * 14.6;
    const wPos = getCurvePos(5.30, wz);
    const wagon = new THREE.Group();
    wagon.position.set(wPos.x, 0, wPos.z);
    wagon.rotation.y = wPos.yaw;

    const tankMesh = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 11.8, 18), btpnTankMat);
    tankMesh.rotation.x = Math.PI / 2;
    tankMesh.position.set(0, 2.65, 0);
    tankMesh.castShadow = true;

    const bandMesh = new THREE.Mesh(new THREE.CylinderGeometry(1.42, 1.42, 1.2, 18), btpnStripeMat);
    bandMesh.rotation.x = Math.PI / 2;
    bandMesh.position.set(0, 2.65, 0);

    const domeMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.4, 10), btpnStripeMat);
    domeMesh.position.set(0, 4.15, 0);

    const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.35, 12.8), bogieMat);
    chassis.position.set(0, 1.15, 0);

    [-4.2, 4.2].forEach(bz => {
      const bogie = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.65, 2.2), bogieMat);
      bogie.position.set(0, 0.68, bz);
      wagon.add(bogie);
    });

    wagon.add(tankMesh, bandMesh, domeMesh, chassis);
    sceneryGroup.add(wagon);
  }

  // 9. Urban Trees along Industrial Corridor (Deccan Neem & Peepal: z >= 3900)
  const urbanTreeCount = 130;
  const urbanTrunks = new THREE.InstancedMesh(nTrunkGeo, barkMat, urbanTreeCount);
  const urbanCrowns = new THREE.InstancedMesh(nCrownGeo, neemMat, urbanTreeCount);
  urbanTrunks.castShadow = true;
  urbanCrowns.castShadow = true;

  for (let i = 0; i < urbanTreeCount; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const xDist = side === -1 ? -22 - rnd() * 45 : 25 + rnd() * 45;
    const z = 3920 + (i / urbanTreeCount) * 4980;
    const s = 0.75 + rnd() * 0.55;
    const pos = getCurvePos(xDist, z, 0);

    dummy.position.set(pos.x, pos.y, pos.z);
    dummy.scale.set(s, s, s);
    dummy.rotation.set(0, rnd() * Math.PI * 2, 0);
    dummy.updateMatrix();
    urbanTrunks.setMatrixAt(i, dummy.matrix);
    urbanCrowns.setMatrixAt(i, dummy.matrix);
  }
  urbanTrunks.instanceMatrix.needsUpdate = true;
  urbanCrowns.instanceMatrix.needsUpdate = true;
  sceneryGroup.add(urbanTrunks, urbanCrowns);

  scene.add(sceneryGroup);
  return sceneryGroup;
}
