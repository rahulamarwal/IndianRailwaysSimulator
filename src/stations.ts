import * as THREE from 'three';
import { StationEntry } from './types';
import { RendererContext } from './renderer';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// Helper to create geometry parts with vertex colors and baked local transformations
function createColoredPart(
  geo: THREE.BufferGeometry,
  colorHex: number,
  px = 0, py = 0, pz = 0,
  rx = 0, ry = 0, rz = 0,
  sx = 1, sy = 1, sz = 1
): THREE.BufferGeometry {
  const c = new THREE.Color(colorHex);
  const count = geo.attributes.position.count;
  const colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  if (sx !== 1 || sy !== 1 || sz !== 1) geo.scale(sx, sy, sz);
  if (rx !== 0) geo.rotateX(rx);
  if (ry !== 0) geo.rotateY(ry);
  if (rz !== 0) geo.rotateZ(rz);
  if (px !== 0 || py !== 0 || pz !== 0) geo.translate(px, py, pz);
  return geo;
}

// Generates an authentic, detailed 3D human passenger with realistic Indian attire, skin tones, and accessories
function buildRealisticHuman(
  rnd: () => number,
  posX: number,
  posY: number,
  posZ: number,
  facingAngle: number,
  isSitting: boolean,
  parts: THREE.BufferGeometry[]
): void {
  const humanParts: THREE.BufferGeometry[] = [];

  // Authentic Indian skin tones (warm undertones: wheatish, bronze, dusk, ivory)
  const skinTones = [0xc68b59, 0xa86a42, 0xdfb48c, 0x8d5524, 0xb87948];
  const skin = skinTones[Math.floor(rnd() * skinTones.length)];
  const hairColor = 0x14100e;

  const heightScale = isSitting ? 1.0 : 0.94 + rnd() * 0.12;
  const archetype = Math.floor(rnd() * 4); // 0 = Saree, 1 = Kurta-Pajama, 2 = Formal Commuter, 3 = Youth Casuals

  if (isSitting) {
    // ----------------------------------------------------
    // SEATED PASSENGER ON PLATFORM BENCH
    // ----------------------------------------------------
    const clothColors = [0x0284c7, 0xd92638, 0x16a34a, 0xd97706, 0x1e3a8a];
    const cloth = clothColors[Math.floor(rnd() * clothColors.length)];
    const pantColor = 0x1e293b;

    // Head
    humanParts.push(createColoredPart(new THREE.SphereGeometry(0.10, 8, 8), skin, 0, 1.25, 0.02, 0, 0, 0, 0.92, 1.12, 0.95));
    humanParts.push(createColoredPart(new THREE.SphereGeometry(0.105, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.52), hairColor, 0, 1.27, 0.01));
    humanParts.push(createColoredPart(new THREE.CylinderGeometry(0.04, 0.045, 0.07, 8), skin, 0, 1.15, 0.02));

    // Torso upright against backrest
    humanParts.push(createColoredPart(new THREE.BoxGeometry(0.36, 0.42, 0.22), cloth, 0, 0.92, 0.04));

    // Horizontal thighs resting on bench
    humanParts.push(createColoredPart(new THREE.BoxGeometry(0.34, 0.12, 0.36), pantColor, 0, 0.52, 0.18));

    // Vertical calves down to platform floor
    [-0.09, 0.09].forEach(lx => {
      humanParts.push(createColoredPart(new THREE.CylinderGeometry(0.065, 0.055, 0.46, 8), pantColor, lx, 0.26, 0.34));
      humanParts.push(createColoredPart(new THREE.BoxGeometry(0.08, 0.055, 0.20), 0x171717, lx, 0.03, 0.38));
    });

    // Arms resting on lap
    [-0.19, 0.19].forEach(lx => {
      humanParts.push(createColoredPart(new THREE.CylinderGeometry(0.038, 0.032, 0.28, 6), cloth, lx, 0.88, 0.06, 0.3, 0, lx > 0 ? -0.1 : 0.1));
      humanParts.push(createColoredPart(new THREE.CylinderGeometry(0.032, 0.028, 0.26, 6), skin, lx * 0.8, 0.68, 0.22, 0.9, 0, 0));
      humanParts.push(createColoredPart(new THREE.BoxGeometry(0.035, 0.05, 0.05), skin, lx * 0.7, 0.58, 0.30));
    });

  } else if (archetype === 0) {
    // ----------------------------------------------------
    // ARCHETYPE 0: FEMALE IN INDIAN SAREE
    // ----------------------------------------------------
    const sareeColors = [0xd92638, 0x0284c7, 0x059669, 0xd97706, 0x9333ea, 0xdb2777, 0x0d9488];
    const borderColors = [0xf59e0b, 0xfacc15, 0xe2e8f0, 0xd97706];
    const sareeColor = sareeColors[Math.floor(rnd() * sareeColors.length)];
    const borderColor = borderColors[Math.floor(rnd() * borderColors.length)];

    // Head, Hair and Juda (Bun)
    humanParts.push(createColoredPart(new THREE.SphereGeometry(0.10, 8, 8), skin, 0, 1.58, 0, 0, 0, 0, 0.92, 1.12, 0.95));
    humanParts.push(createColoredPart(new THREE.SphereGeometry(0.106, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.55), hairColor, 0, 1.60, -0.01));
    humanParts.push(createColoredPart(new THREE.SphereGeometry(0.048, 8, 6), hairColor, 0, 1.58, -0.10)); // Hair bun
    humanParts.push(createColoredPart(new THREE.CylinderGeometry(0.04, 0.046, 0.07, 8), skin, 0, 1.48, 0));

    // Blouse (Choli) & Bare Midriff
    humanParts.push(createColoredPart(new THREE.BoxGeometry(0.33, 0.22, 0.19), sareeColor, 0, 1.34, 0));
    humanParts.push(createColoredPart(new THREE.BoxGeometry(0.28, 0.08, 0.17), skin, 0, 1.20, 0));

    // Saree Pleated Skirt (Waist to ankles)
    humanParts.push(createColoredPart(new THREE.CylinderGeometry(0.19, 0.26, 0.94, 10), sareeColor, 0, 0.65, 0));
    humanParts.push(createColoredPart(new THREE.CylinderGeometry(0.262, 0.268, 0.06, 10), borderColor, 0, 0.21, 0)); // Gold Zari hem

    // Saree Pallu (Diagonal drape across chest over left shoulder)
    humanParts.push(createColoredPart(new THREE.BoxGeometry(0.14, 0.38, 0.04), sareeColor, -0.06, 1.28, 0.10, 0, 0, -0.42));
    humanParts.push(createColoredPart(new THREE.BoxGeometry(0.18, 0.60, 0.02), sareeColor, -0.14, 1.08, -0.11)); // Pallu falling down back
    humanParts.push(createColoredPart(new THREE.BoxGeometry(0.03, 0.60, 0.022), borderColor, -0.05, 1.08, -0.11)); // Border on pallu

    // Arms & Gold Bangles
    [-1, 1].forEach(side => {
      const lx = side * 0.19;
      humanParts.push(createColoredPart(new THREE.CylinderGeometry(0.038, 0.034, 0.24, 6), sareeColor, lx, 1.30, 0));
      humanParts.push(createColoredPart(new THREE.CylinderGeometry(0.032, 0.028, 0.24, 6), skin, lx * 1.05, 1.08, 0.02));
      humanParts.push(createColoredPart(new THREE.TorusGeometry(0.036, 0.007, 6, 8), 0xf59e0b, lx * 1.05, 0.98, 0.02, Math.PI / 2, 0, 0)); // Gold Bangle
      humanParts.push(createColoredPart(new THREE.BoxGeometry(0.03, 0.06, 0.045), skin, lx * 1.05, 0.93, 0.02));
    });

    // Feet with Sandals
    [-0.08, 0.08].forEach(lx => {
      humanParts.push(createColoredPart(new THREE.BoxGeometry(0.07, 0.03, 0.18), 0x78350f, lx, 0.02, 0.02));
    });

    // Handbag / Purse
    if (rnd() > 0.4) {
      humanParts.push(createColoredPart(new THREE.BoxGeometry(0.16, 0.14, 0.08), 0x991b1b, 0.24, 0.88, 0.04));
    }

  } else if (archetype === 1) {
    // ----------------------------------------------------
    // ARCHETYPE 1: MALE IN KURTA-PAJAMA WITH NEHRU JACKET
    // ----------------------------------------------------
    const kurtaColors = [0xfafaf9, 0xfef3c7, 0xe0f2fe, 0xfce7f3];
    const jacketColors = [0x1e3a8a, 0x881337, 0x14532d, 0x334155, 0x7c2d12];
    const kurtaColor = kurtaColors[Math.floor(rnd() * kurtaColors.length)];
    const jacketColor = jacketColors[Math.floor(rnd() * jacketColors.length)];
    const hasTurban = rnd() > 0.65;

    // Head
    humanParts.push(createColoredPart(new THREE.SphereGeometry(0.11, 8, 8), skin, 0, 1.62, 0, 0, 0, 0, 0.94, 1.14, 0.96));
    if (hasTurban) {
      const turbanColors = [0xf59e0b, 0x9f1239, 0xf8fafc];
      const turbanColor = turbanColors[Math.floor(rnd() * turbanColors.length)];
      humanParts.push(createColoredPart(new THREE.TorusGeometry(0.12, 0.048, 8, 12), turbanColor, 0, 1.66, 0, 0.2, 0, 0));
    } else {
      humanParts.push(createColoredPart(new THREE.SphereGeometry(0.114, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.52), hairColor, 0, 1.64, -0.01));
    }
    humanParts.push(createColoredPart(new THREE.CylinderGeometry(0.042, 0.048, 0.08, 8), skin, 0, 1.51, 0));

    // Kurta Shirt & Long Tunic Skirt
    humanParts.push(createColoredPart(new THREE.BoxGeometry(0.38, 0.34, 0.22), kurtaColor, 0, 1.34, 0));
    humanParts.push(createColoredPart(new THREE.BoxGeometry(0.37, 0.44, 0.23), kurtaColor, 0, 0.94, 0));

    // Nehru Jacket Vest & Mandarin Collar
    humanParts.push(createColoredPart(new THREE.BoxGeometry(0.395, 0.36, 0.235), jacketColor, 0, 1.33, 0));
    humanParts.push(createColoredPart(new THREE.CylinderGeometry(0.055, 0.058, 0.038, 8), jacketColor, 0, 1.50, 0));

    // Pajama Legs
    [-0.10, 0.10].forEach(lx => {
      humanParts.push(createColoredPart(new THREE.CylinderGeometry(0.075, 0.058, 0.72, 8), 0xf8fafc, lx, 0.42, 0));
      // Leather Jutti / Mojari shoes
      humanParts.push(createColoredPart(new THREE.BoxGeometry(0.08, 0.055, 0.21), 0x78350f, lx, 0.03, 0.03));
    });

    // Arms
    [-0.22, 0.22].forEach(lx => {
      humanParts.push(createColoredPart(new THREE.CylinderGeometry(0.044, 0.036, 0.48, 6), kurtaColor, lx, 1.20, 0));
      humanParts.push(createColoredPart(new THREE.BoxGeometry(0.035, 0.065, 0.05), skin, lx, 0.92, 0));
    });

  } else if (archetype === 2) {
    // ----------------------------------------------------
    // ARCHETYPE 2: FORMAL COMMUTER WITH VIP TROLLEY SUITCASE
    // ----------------------------------------------------
    const shirtColors = [0x93c5fd, 0xf8fafc, 0xc7d2fe, 0xdcfce7];
    const trouserColors = [0x334155, 0x1e293b, 0x475569, 0x78350f];
    const suitcaseColors = [0x1e3a8a, 0x991b1b, 0x1f2937, 0x065f46];
    const shirtColor = shirtColors[Math.floor(rnd() * shirtColors.length)];
    const trouserColor = trouserColors[Math.floor(rnd() * trouserColors.length)];
    const suitcaseColor = suitcaseColors[Math.floor(rnd() * suitcaseColors.length)];

    // Head & Hair
    humanParts.push(createColoredPart(new THREE.SphereGeometry(0.11, 8, 8), skin, 0, 1.62, 0));
    humanParts.push(createColoredPart(new THREE.SphereGeometry(0.114, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.52), hairColor, 0, 1.64, -0.01));
    humanParts.push(createColoredPart(new THREE.CylinderGeometry(0.042, 0.048, 0.08, 8), skin, 0, 1.51, 0));

    // Formal Collared Shirt & Belt
    humanParts.push(createColoredPart(new THREE.BoxGeometry(0.38, 0.36, 0.22), shirtColor, 0, 1.32, 0));
    humanParts.push(createColoredPart(new THREE.CylinderGeometry(0.054, 0.058, 0.035, 8), shirtColor, 0, 1.50, 0));
    humanParts.push(createColoredPart(new THREE.BoxGeometry(0.36, 0.045, 0.21), 0x1c1917, 0, 1.12, 0)); // Belt
    humanParts.push(createColoredPart(new THREE.BoxGeometry(0.05, 0.038, 0.01), 0xf59e0b, 0, 1.12, 0.11)); // Brass Buckle

    // Formal Trousers & Oxford Shoes
    humanParts.push(createColoredPart(new THREE.BoxGeometry(0.36, 0.22, 0.21), trouserColor, 0, 1.00, 0));
    [-0.10, 0.10].forEach(lx => {
      humanParts.push(createColoredPart(new THREE.CylinderGeometry(0.078, 0.065, 0.78, 8), trouserColor, lx, 0.50, 0));
      humanParts.push(createColoredPart(new THREE.BoxGeometry(0.085, 0.055, 0.22), 0x171717, lx, 0.03, 0.03));
    });

    // Left Arm (Relaxed at side)
    humanParts.push(createColoredPart(new THREE.CylinderGeometry(0.042, 0.036, 0.46, 6), shirtColor, -0.21, 1.20, 0));
    humanParts.push(createColoredPart(new THREE.BoxGeometry(0.035, 0.065, 0.05), skin, -0.21, 0.93, 0));

    // Right Arm (Angled down holding rolling trolley suitcase handle)
    humanParts.push(createColoredPart(new THREE.CylinderGeometry(0.042, 0.036, 0.26, 6), shirtColor, 0.21, 1.25, 0, 0, 0, -0.22));
    humanParts.push(createColoredPart(new THREE.CylinderGeometry(0.034, 0.030, 0.26, 6), skin, 0.26, 1.02, 0.02));
    humanParts.push(createColoredPart(new THREE.BoxGeometry(0.035, 0.06, 0.05), skin, 0.27, 0.86, 0.02));

    // Rolling VIP Trolley Suitcase beside passenger
    humanParts.push(createColoredPart(new THREE.BoxGeometry(0.26, 0.46, 0.36), suitcaseColor, 0.40, 0.28, 0.02));
    humanParts.push(createColoredPart(new THREE.BoxGeometry(0.02, 0.34, 0.26), 0x111111, 0.53, 0.28, 0.02)); // Front pocket accent
    // Spinner Wheels
    [-0.10, 0.10].forEach(dz => {
      humanParts.push(createColoredPart(new THREE.CylinderGeometry(0.022, 0.022, 0.03, 6), 0x111111, 0.40, 0.02, 0.02 + dz, Math.PI / 2, 0, 0));
    });
    // Chrome Telescoping Handle Tube & Cross Grip
    humanParts.push(createColoredPart(new THREE.CylinderGeometry(0.007, 0.007, 0.36, 6), 0xd1d5db, 0.37, 0.68, 0.02));
    humanParts.push(createColoredPart(new THREE.BoxGeometry(0.03, 0.025, 0.14), 0x111111, 0.37, 0.86, 0.02));

  } else {
    // ----------------------------------------------------
    // ARCHETYPE 3: COMMUTER / YOUTH IN CASUALS WITH BACKPACK & SMARTPHONE
    // ----------------------------------------------------
    const teeColors = [0x0284c7, 0xe11d48, 0x16a34a, 0xf59e0b, 0x4f46e5];
    const jeansColors = [0x1e3a8a, 0x1e293b, 0x3b82f6];
    const teeColor = teeColors[Math.floor(rnd() * teeColors.length)];
    const jeansColor = jeansColors[Math.floor(rnd() * jeansColors.length)];

    // Head tilted slightly forward checking phone
    humanParts.push(createColoredPart(new THREE.SphereGeometry(0.11, 8, 8), skin, 0, 1.62, 0, 0.18, 0, 0));
    humanParts.push(createColoredPart(new THREE.SphereGeometry(0.114, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.52), hairColor, 0, 1.64, -0.01, 0.18, 0, 0));
    humanParts.push(createColoredPart(new THREE.CylinderGeometry(0.042, 0.048, 0.08, 8), skin, 0, 1.51, 0));

    // Casual T-shirt & Backpack on Back
    humanParts.push(createColoredPart(new THREE.BoxGeometry(0.38, 0.42, 0.22), teeColor, 0, 1.30, 0));
    humanParts.push(createColoredPart(new THREE.BoxGeometry(0.28, 0.38, 0.16), 0x0f172a, 0, 1.28, -0.18)); // Main backpack pack
    [-0.12, 0.12].forEach(lx => {
      humanParts.push(createColoredPart(new THREE.BoxGeometry(0.04, 0.34, 0.02), 0x0f172a, lx, 1.32, 0.11)); // Straps
    });

    // Denim Jeans & Sneakers
    [-0.10, 0.10].forEach(lx => {
      humanParts.push(createColoredPart(new THREE.CylinderGeometry(0.08, 0.068, 0.86, 8), jeansColor, lx, 0.48, 0));
      humanParts.push(createColoredPart(new THREE.BoxGeometry(0.09, 0.06, 0.22), 0xf8fafc, lx, 0.03, 0.03));
    });

    // Arms bent forward holding smartphone
    [-1, 1].forEach(side => {
      const lx = side * 0.20;
      humanParts.push(createColoredPart(new THREE.CylinderGeometry(0.04, 0.034, 0.26, 6), teeColor, lx, 1.25, 0.04, 0.3, 0, 0));
      humanParts.push(createColoredPart(new THREE.CylinderGeometry(0.032, 0.028, 0.26, 6), skin, side * 0.14, 1.05, 0.18, 1.1, 0, -side * 0.3));
    });
    humanParts.push(createColoredPart(new THREE.BoxGeometry(0.035, 0.05, 0.05), skin, 0, 1.02, 0.30));

    // Smartphone & Glowing Screen
    humanParts.push(createColoredPart(new THREE.BoxGeometry(0.075, 0.008, 0.14), 0x1e293b, 0, 1.03, 0.30));
    humanParts.push(createColoredPart(new THREE.BoxGeometry(0.065, 0.004, 0.12), 0x93c5fd, 0, 1.036, 0.30)); // Illuminated screen
  }

  // Apply height scaling, orientation angle, and world platform translation
  humanParts.forEach(part => {
    if (heightScale !== 1.0) part.scale(heightScale, heightScale, heightScale);
    if (facingAngle !== 0) part.rotateY(facingAngle);
    part.translate(posX, posY, posZ);
    parts.push(part);
  });
}

export function buildStations(ctx: RendererContext, stations: StationEntry[]): THREE.Group {
  const stationGroup = new THREE.Group();
  const { scene, createMaterial, createCanvasTexture } = ctx;

  let seed = 42;
  const rnd = (): number => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };

  // 1. High-Resolution Platform Paver Tile Texture
  const platformTexture = createCanvasTexture(512, 512, (c, w, h) => {
    c.fillStyle = '#b8b2a5';
    c.fillRect(0, 0, w, h);

    // Concrete grid paver tile lines
    c.strokeStyle = '#8d877a';
    c.lineWidth = 2;
    const tileSize = 32;
    for (let x = 0; x < w; x += tileSize) {
      c.beginPath();
      c.moveTo(x, 0);
      c.lineTo(x, h);
      c.stroke();
    }
    for (let y = 0; y < h; y += tileSize) {
      c.beginPath();
      c.moveTo(0, y);
      c.lineTo(w, y);
      c.stroke();
    }

    // Concrete speckle texture noise
    for (let i = 0; i < 14000; i++) {
      const px = Math.random() * w;
      const py = Math.random() * h;
      const v = 150 + Math.floor(Math.random() * 50);
      c.fillStyle = `rgb(${v}, ${v - 5}, ${v - 15})`;
      c.fillRect(px, py, 2, 2);
    }
  });
  platformTexture.wrapS = THREE.RepeatWrapping;
  platformTexture.wrapT = THREE.RepeatWrapping;
  platformTexture.repeat.set(2, 20);

  // 2. Platform Tactile Caution Edge Stripe (High-visibility yellow with diagonal black hazard marks)
  const edgeTexture = createCanvasTexture(256, 64, (c, w, h) => {
    c.fillStyle = '#f5c518';
    c.fillRect(0, 0, w, h);

    c.fillStyle = '#111111';
    for (let x = -64; x < w + 64; x += 32) {
      c.beginPath();
      c.moveTo(x, 0);
      c.lineTo(x + 16, 0);
      c.lineTo(x - 8, h);
      c.lineTo(x - 24, h);
      c.closePath();
      c.fill();
    }
  });
  edgeTexture.wrapS = THREE.RepeatWrapping;
  edgeTexture.repeat.set(24, 1);

  // Shared platform materials
  const platformMat = new THREE.MeshStandardMaterial({
    roughness: 0.85,
    metalness: 0.05,
    map: platformTexture
  });
  const edgeMat = new THREE.MeshStandardMaterial({
    roughness: 0.6,
    map: edgeTexture
  });
  const roofMat = createMaterial(0x9fa8b0, { roughness: 0.6, metalness: 0.4 });
  const pillarMat = createMaterial(0x40474e, { metalness: 0.7, roughness: 0.35 });
  const fobDeckMat = createMaterial(0x56606a, { metalness: 0.6, roughness: 0.4 });
  const fobRoofMat = createMaterial(0x828b94, { metalness: 0.5, roughness: 0.5 });
  const benchSteelMat = createMaterial(0x71717a, { metalness: 0.8, roughness: 0.25 });

  stations.forEach(st => {
    const { name, devanagari, startZ, endZ } = st;
    const length = endZ - startZ;
    const centerZ = (startZ + endZ) / 2;

    // Platform configurations:
    // Platform 1 (Left): Center at X = -4.9m, inner edge at X = -1.9m
    // Platform 2 (Right): Center at X = +4.9m, inner edge at X = +1.9m
    const platforms = [
      { pfNum: 1, devPF: '१', posX: -4.9, edgeX: -1.95, canopyX: -5.4, pillarX: -3.2, boardX: -2.5, benchX: -4.5, facingRot: Math.PI / 2 },
      { pfNum: 2, devPF: '२', posX: 4.9, edgeX: 1.95, canopyX: 5.4, pillarX: 3.2, boardX: 2.5, benchX: 4.5, facingRot: -Math.PI / 2 }
    ];

    platforms.forEach(pf => {
      // 1. Platform Base Masonry
      const platformGeo = new THREE.BoxGeometry(6, 0.9, length);
      const platformMesh = new THREE.Mesh(platformGeo, platformMat);
      platformMesh.position.set(pf.posX, 0.45, centerZ);
      platformMesh.receiveShadow = true;
      stationGroup.add(platformMesh);

      // 2. Tactile Caution Edge Stripe
      const edgeGeo = new THREE.BoxGeometry(0.35, 0.05, length);
      const edgeMesh = new THREE.Mesh(edgeGeo, edgeMat);
      edgeMesh.position.set(pf.edgeX, 0.92, centerZ);
      stationGroup.add(edgeMesh);

      // 3. Platform Canopy Roof
      const canopyGeo = new THREE.BoxGeometry(6.4, 0.22, length);
      const canopy = new THREE.Mesh(canopyGeo, roofMat);
      canopy.position.set(pf.canopyX, 5.4, centerZ);
      canopy.castShadow = true;
      canopy.receiveShadow = true;
      stationGroup.add(canopy);

      // Canopy Structural Steel Support Pillars & Angled Brackets
      const pillarGeo = new THREE.BoxGeometry(0.24, 4.5, 0.24);
      for (let z = startZ + 6; z < endZ; z += 12) {
        const pillar = new THREE.Mesh(pillarGeo, pillarMat);
        pillar.position.set(pf.pillarX, 3.15, z);
        pillar.castShadow = true;
        pillar.receiveShadow = true;
        stationGroup.add(pillar);

        const trussBracket = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, 0.08), pillarMat);
        const bracketAngle = pf.pfNum === 1 ? -0.3 : 0.3;
        const bracketOffset = pf.pfNum === 1 ? -0.7 : 0.7;
        trussBracket.position.set(pf.pillarX + bracketOffset, 5.15, z);
        trussBracket.rotation.z = bracketAngle;
        stationGroup.add(trussBracket);
      }

      // 4. Authentic Indian Railways Bilingual Station Board (Yellow plate, black double border)
      const boardTexture = createCanvasTexture(1024, 256, (c, w, h) => {
        c.fillStyle = '#f5c518';
        c.fillRect(0, 0, w, h);

        c.strokeStyle = '#111111';
        c.lineWidth = 14;
        c.strokeRect(8, 8, w - 16, h - 16);
        c.lineWidth = 4;
        c.strokeRect(18, 18, w - 36, h - 36);

        c.fillStyle = '#111111';
        c.textAlign = 'center';
        c.font = 'bold 96px Arial, Helvetica, sans-serif';
        c.fillText(name, w / 2, 110);

        c.font = 'bold 74px "Kohinoor Devanagari", "Devanagari Sangam MN", "Noto Sans Devanagari", sans-serif';
        c.fillText(devanagari, w / 2, 210);
      });

      const boardPostGeo = new THREE.BoxGeometry(0.12, 2.8, 0.12);
      const boardPostMat = createMaterial(0x222222);
      const boardPlaneGeo = new THREE.PlaneGeometry(6, 1.4);
      const boardPlaneMat = new THREE.MeshBasicMaterial({ map: boardTexture, side: THREE.DoubleSide });

      [0.2, 0.55, 0.85].forEach(fraction => {
        const z = startZ + length * fraction;

        const post = new THREE.Mesh(boardPostGeo, boardPostMat);
        post.position.set(pf.boardX, 2.3, z);
        post.castShadow = true;
        stationGroup.add(post);

        const signBoard = new THREE.Mesh(boardPlaneGeo, boardPlaneMat);
        signBoard.rotation.y = pf.facingRot;
        signBoard.position.set(pf.boardX, 3.65, z);
        signBoard.castShadow = true;
        stationGroup.add(signBoard);
      });

      // 5. Platform Number Signs ("PF 1 / १" or "PF 2 / २")
      const pfSignTex = createCanvasTexture(256, 128, (c, w, h) => {
        c.fillStyle = '#1e3a8a'; // Indian Railways deep blue
        c.fillRect(0, 0, w, h);
        c.strokeStyle = '#ffffff';
        c.lineWidth = 6;
        c.strokeRect(4, 4, w - 8, h - 8);
        c.fillStyle = '#ffffff';
        c.textAlign = 'center';
        c.font = 'bold 52px Arial';
        c.fillText(`PF ${pf.pfNum}`, w / 2, 54);
        c.font = 'bold 42px "Kohinoor Devanagari", sans-serif';
        c.fillText(`प्लेटफॉर्म ${pf.devPF}`, w / 2, 106);
      });
      const pfSignMat = new THREE.MeshBasicMaterial({ map: pfSignTex, side: THREE.DoubleSide });
      for (let z = startZ + 18; z < endZ - 18; z += 36) {
        const pfSign = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.8), pfSignMat);
        pfSign.rotation.y = pf.facingRot;
        pfSign.position.set(pf.pillarX, 4.4, z);
        stationGroup.add(pfSign);
      }

      // 6. Stainless Steel 3-Seater Platform Waiting Benches
      const benchPositions: number[] = [];
      for (let z = startZ + 20; z < endZ - 20; z += 24) {
        benchPositions.push(z);

        const benchGroup = new THREE.Group();
        benchGroup.position.set(pf.benchX, 0.9, z);

        // Bench Seat Pan
        const seatPan = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.08, 0.55), benchSteelMat);
        seatPan.position.set(0, 0.45, 0);
        seatPan.castShadow = true;

        // Curved Backrest
        const backrest = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.45, 0.06), benchSteelMat);
        backrest.position.set(0, 0.72, pf.pfNum === 1 ? -0.25 : 0.25);
        backrest.castShadow = true;

        // Support Legs
        [-0.75, 0.75].forEach(lx => {
          const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.45, 0.55), benchSteelMat);
          leg.position.set(lx, 0.225, 0);
          leg.castShadow = true;
          benchGroup.add(leg);
        });

        benchGroup.add(seatPan, backrest);
        stationGroup.add(benchGroup);
      }

      // 7. Realistic 3D Human Passengers Population
      const passengerParts: THREE.BufferGeometry[] = [];
      const passengerCount = 35;

      // Seated passengers on waiting benches
      benchPositions.slice(0, 4).forEach(bz => {
        buildRealisticHuman(rnd, pf.benchX, 0.9, bz, pf.facingRot, true, passengerParts);
      });

      // Standing passengers waiting along the platform
      for (let i = 0; i < passengerCount; i++) {
        const px = pf.pfNum === 1
          ? -2.6 - rnd() * 3.8
          : 2.6 + rnd() * 3.8;
        const pz = startZ + 12 + rnd() * (length - 24);

        // Natural standing orientations (facing track, slightly angled, or in pairs)
        const angleJitter = (rnd() - 0.5) * 0.8;
        const rot = pf.facingRot + angleJitter;

        buildRealisticHuman(rnd, px, 0.9, pz, rot, false, passengerParts);
      }

      // Merge all passenger geometries into a single high-performance mesh per platform
      if (passengerParts.length > 0) {
        const mergedPassengerGeo = mergeGeometries(passengerParts, false);
        const passengerMat = new THREE.MeshStandardMaterial({
          vertexColors: true,
          roughness: 0.7,
          metalness: 0.1
        });
        const passengerMesh = new THREE.Mesh(mergedPassengerGeo, passengerMat);
        passengerMesh.castShadow = true;
        passengerMesh.receiveShadow = true;
        stationGroup.add(passengerMesh);
      }
    });

    // ==========================================
    // FOOT OVER BRIDGE (FOB) SPANNING BOTH PLATFORMS ACROSS TRACKS
    // ==========================================
    // Elevated deck spans from X = -8.5m (Platform 1) to X = +8.5m (Platform 2)
    const fobDeck = new THREE.Mesh(new THREE.BoxGeometry(17.4, 0.35, 3.4), fobDeckMat);
    fobDeck.position.set(0, 8.2, centerZ);
    fobDeck.castShadow = true;
    fobDeck.receiveShadow = true;

    // Safety handrails along both sides of FOB deck
    [-1.6, 1.6].forEach(dz => {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(17.4, 1.15, 0.08), fobDeckMat);
      rail.position.set(0, 8.85, centerZ + dz);
      rail.castShadow = true;
      stationGroup.add(rail);
    });

    // Elevated FOB Roof Canopy
    const fobRoof = new THREE.Mesh(new THREE.BoxGeometry(17.8, 0.22, 3.8), fobRoofMat);
    fobRoof.position.set(0, 10.0, centerZ);
    fobRoof.castShadow = true;
    fobRoof.receiveShadow = true;

    // Staircase Towers connecting to Platform 1 & Platform 2
    const stairTowerGeo = new THREE.BoxGeometry(2.6, 7.8, 3.0);
    const stairPf1 = new THREE.Mesh(stairTowerGeo, fobDeckMat);
    stairPf1.position.set(-8.2, 4.4, centerZ);
    stairPf1.castShadow = true;
    stairPf1.receiveShadow = true;

    const stairPf2 = new THREE.Mesh(stairTowerGeo, fobDeckMat);
    stairPf2.position.set(8.2, 4.4, centerZ);
    stairPf2.castShadow = true;
    stairPf2.receiveShadow = true;

    // Structural portal columns supporting the FOB span over the tracks
    [-2.15, 2.15].forEach(x => {
      const col = new THREE.Mesh(new THREE.BoxGeometry(0.32, 7.8, 0.32), pillarMat);
      col.position.set(x, 4.35, centerZ);
      col.castShadow = true;
      col.receiveShadow = true;
      stationGroup.add(col);
    });

    stationGroup.add(fobDeck, fobRoof, stairPf1, stairPf2);
  });

  scene.add(stationGroup);
  return stationGroup;
}
