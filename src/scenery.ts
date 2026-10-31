import * as THREE from 'three';
import { RendererContext } from './renderer';
import { TrackConfig } from './types';

export function buildScenery(ctx: RendererContext, config: TrackConfig): THREE.Group {
  const sceneryGroup = new THREE.Group();
  const { scene, createMaterial, createCanvasTexture } = ctx;
  const { startZ, endZ } = config;
  const trackLength = endZ - startZ;

  let seed = 73;
  const rnd = (): number => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };

  const dummy = new THREE.Object3D();

  // ==========================================
  // 1. INDIAN RESIDENTIAL APARTMENTS & HUMAN HOMES
  // (Multi-storey concrete colonies, flat terraces, Sintex water tanks, satellite dishes)
  // ==========================================
  const buildingColors = [
    0xd97706, // Warm Indian Ochre / Saffron
    0xbe123c, // Terracotta / Dusty Rose
    0x059669, // Mint / Olive Green
    0xfef3c7, // Warm Cream / Ivory
    0x0284c7, // Light Sky Blue
    0xea580c, // Sandstone Orange
    0x475569  // Exposed Concrete Grey
  ];

  // Procedural Window & Balcony Texture for Apartment Blocks
  const buildingTexture = createCanvasTexture(512, 512, (c, w, h) => {
    c.fillStyle = '#e5e0d8';
    c.fillRect(0, 0, w, h);

    // Weathered plaster streaks
    for (let i = 0; i < 4000; i++) {
      const px = Math.random() * w;
      const py = Math.random() * h;
      c.fillStyle = 'rgba(0,0,0,0.03)';
      c.fillRect(px, py, 2, 4);
    }

    // Grid of windows with black security grills and concrete chhajja sunshades
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

        // Concrete chhajja sunshade above window
        c.fillStyle = '#9e9689';
        c.fillRect(wx - 4, wy - 8, ww + 8, 6);

        // Window opening (dark glass)
        c.fillStyle = '#182430';
        c.fillRect(wx, wy, ww, wh);

        // Metal security grill pattern
        c.strokeStyle = '#4a5568';
        c.lineWidth = 1.5;
        c.strokeRect(wx, wy, ww, wh);
        c.beginPath();
        c.moveTo(wx + ww / 2, wy);
        c.lineTo(wx + ww / 2, wy + wh);
        c.moveTo(wx, wy + wh / 2);
        c.lineTo(wx + ww, wy + wh / 2);
        c.stroke();
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

  const buildingCount = 140;
  const buildingGeo = new THREE.BoxGeometry(16, 14, 12);
  const buildings = new THREE.InstancedMesh(buildingGeo, buildingMat, buildingCount);
  buildings.castShadow = true;
  buildings.receiveShadow = true;

  // Terrace Rooftop Details: Sintex black water tanks & stairwell penthouses
  const tankMat = createMaterial(0x18181b, { roughness: 0.7 }); // Black polyethylene
  const tankGeo = new THREE.CylinderGeometry(0.85, 0.85, 1.6, 12);
  const waterTanks = new THREE.InstancedMesh(tankGeo, tankMat, buildingCount * 2);

  const penthouseMat = createMaterial(0xd6d3d1, { roughness: 0.9 });
  const penthouseGeo = new THREE.BoxGeometry(4.0, 2.6, 3.5);
  const penthouses = new THREE.InstancedMesh(penthouseGeo, penthouseMat, buildingCount);

  let tankIdx = 0;

  for (let i = 0; i < buildingCount; i++) {
    // Distribute buildings in suburban clusters outside railway reservation
    const side = i % 2 === 0 ? -1 : 1;
    const x = side === -1
      ? -35 - rnd() * 85
      : 28 + rnd() * 85;
    const z = startZ + 80 + (i / buildingCount) * (trackLength - 160) + (rnd() - 0.5) * 60;

    const heightVar = 0.7 + rnd() * 0.7; // 2 to 4 storeys
    const rot = (rnd() - 0.5) * 0.35;

    // Building Main Structure
    dummy.position.set(x, 7 * heightVar, z);
    dummy.scale.set(0.9 + rnd() * 0.4, heightVar, 0.8 + rnd() * 0.5);
    dummy.rotation.set(0, rot, 0);
    dummy.updateMatrix();
    buildings.setMatrixAt(i, dummy.matrix);
    buildings.setColorAt(i, new THREE.Color(buildingColors[i % buildingColors.length]));

    // Rooftop Staircase Penthouse Room
    const roofY = 14 * heightVar;
    dummy.position.set(x + (rnd() - 0.5) * 4, roofY + 1.3, z + (rnd() - 0.5) * 3);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    penthouses.setMatrixAt(i, dummy.matrix);

    // 2 Sintex Water Tanks on the flat terrace roof
    [-1.8, 1.8].forEach(dx => {
      dummy.position.set(x + dx, roofY + 0.8, z + (rnd() - 0.5) * 4);
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

  // Concrete Boundary Security Walls (separating colony streets from railway corridor)
  const wallMat = createMaterial(0x8a8479, { roughness: 0.9 });
  const wallGeo = new THREE.BoxGeometry(0.3, 2.2, trackLength);
  const leftWall = new THREE.Mesh(wallGeo, wallMat);
  leftWall.position.set(-18, 1.1, (startZ + endZ) / 2);
  leftWall.castShadow = true;
  leftWall.receiveShadow = true;

  const rightWall = new THREE.Mesh(wallGeo, wallMat);
  rightWall.position.set(22, 1.1, (startZ + endZ) / 2);
  rightWall.castShadow = true;
  rightWall.receiveShadow = true;
  sceneryGroup.add(leftWall, rightWall);

  // ==========================================
  // 2. INDUSTRIAL PLANTS, WAREHOUSES & GODOWNS (HADAPSAR / LONI)
  // ==========================================
  const shedCount = 45;
  const shedWallMat = createMaterial(0x64748b, { roughness: 0.7 }); // Industrial slate grey
  const shedRoofMat = createMaterial(0x991b1b, { roughness: 0.6, metalness: 0.3 }); // Corrugated oxide red
  const shedGeo = new THREE.BoxGeometry(26, 9, 36);
  const shedRoofGeo = new THREE.BoxGeometry(28, 0.4, 38);

  const sheds = new THREE.InstancedMesh(shedGeo, shedWallMat, shedCount);
  const shedRoofs = new THREE.InstancedMesh(shedRoofGeo, shedRoofMat, shedCount);
  sheds.castShadow = true;
  sheds.receiveShadow = true;
  shedRoofs.castShadow = true;

  for (let i = 0; i < shedCount; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const x = side === -1 ? -55 - rnd() * 50 : 45 + rnd() * 60;
    const z = startZ + 200 + (i / shedCount) * (trackLength - 400);

    // Industrial Godown Main Body
    dummy.position.set(x, 4.5, z);
    dummy.scale.set(1, 1, 1);
    dummy.rotation.set(0, (rnd() - 0.5) * 0.2, 0);
    dummy.updateMatrix();
    sheds.setMatrixAt(i, dummy.matrix);

    // Pitched Corrugated Roof
    dummy.position.set(x, 9.2, z);
    dummy.updateMatrix();
    shedRoofs.setMatrixAt(i, dummy.matrix);
  }

  sheds.instanceMatrix.needsUpdate = true;
  shedRoofs.instanceMatrix.needsUpdate = true;
  sceneryGroup.add(sheds, shedRoofs);

  // Industrial Smoke Stacks / Factory Chimneys (Red & White hazard rings)
  const chimneyCount = 14;
  const chimneyMat = createMaterial(0xe2e8f0, { roughness: 0.8 });
  const chimneyGeo = new THREE.CylinderGeometry(1.4, 2.2, 36, 16);
  const chimneys = new THREE.InstancedMesh(chimneyGeo, chimneyMat, chimneyCount);
  chimneys.castShadow = true;

  for (let i = 0; i < chimneyCount; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const x = side === -1 ? -85 - rnd() * 40 : 75 + rnd() * 40;
    const z = startZ + 400 + i * 380;
    dummy.position.set(x, 18, z);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    chimneys.setMatrixAt(i, dummy.matrix);
  }
  chimneys.instanceMatrix.needsUpdate = true;
  sceneryGroup.add(chimneys);

  // ==========================================
  // 3. LONI PETROLEUM STORAGE TANK FARM (HPCL / IOCL TERMINAL)
  // ==========================================
  // Massive cylindrical oil tanks around Loni (Z = 2800m to 3600m)
  const oilTankGroup = new THREE.Group();
  const oilTankMat = createMaterial(0xf1f5f9, { roughness: 0.35, metalness: 0.4 }); // High-reflectance white enamel
  const oilTankHazardMat = createMaterial(0x0284c7); // Blue IOCL corporate band

  const tankLocations = [
    { x: -50, z: 2950, r: 12, h: 14 },
    { x: -78, z: 3020, r: 14, h: 14 },
    { x: -54, z: 3120, r: 11, h: 12 },
    { x: -82, z: 3220, r: 15, h: 15 },
    { x: -48, z: 3340, r: 12, h: 14 },
    { x: -75, z: 3450, r: 13, h: 14 }
  ];

  tankLocations.forEach(t => {
    // Cylindrical Storage Tank Body
    const tankMesh = new THREE.Mesh(new THREE.CylinderGeometry(t.r, t.r, t.h, 24), oilTankMat);
    tankMesh.position.set(t.x, t.h / 2, t.z);
    tankMesh.castShadow = true;
    tankMesh.receiveShadow = true;

    // Corporate Identity Color Ring
    const bandMesh = new THREE.Mesh(new THREE.CylinderGeometry(t.r * 1.01, t.r * 1.01, 1.8, 24), oilTankHazardMat);
    bandMesh.position.set(t.x, t.h * 0.75, t.z);

    // Concrete Containment Dyke Bund Wall
    const bundWall = new THREE.Mesh(
      new THREE.BoxGeometry(t.r * 2.6, 1.6, t.r * 2.6),
      createMaterial(0xa8a29e, { roughness: 0.9 })
    );
    bundWall.position.set(t.x, 0.8, t.z);

    oilTankGroup.add(tankMesh, bandMesh, bundWall);
  });
  sceneryGroup.add(oilTankGroup);

  // ==========================================
  // 4. HIGH-VOLTAGE ELECTRICAL TRANSMISSION PYLONS
  // (4-legged steel lattice towers crossing over the countryside)
  // ==========================================
  const pylonMat = createMaterial(0x94a3b8, { metalness: 0.85, roughness: 0.25 });
  const pylonCount = 18;
  const pylonGroup = new THREE.Group();

  for (let i = 0; i < pylonCount; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const x = side * (45 + (i % 3) * 15);
    const z = startZ + 250 + i * 320;

    const pylon = new THREE.Group();
    pylon.position.set(x, 0, z);

    // 4 Tapered Lattice Corner Legs
    const legHeight = 22;
    const legGeo = new THREE.CylinderGeometry(0.08, 0.12, legHeight, 4);
    [-1, 1].forEach(lx => {
      [-1, 1].forEach(lz => {
        const leg = new THREE.Mesh(legGeo, pylonMat);
        leg.position.set(lx * 2.2, legHeight / 2, lz * 2.2);
        leg.rotation.x = -lz * 0.08;
        leg.rotation.z = lx * 0.08;
        pylon.add(leg);
      });
    });

    // 3 Crossarm Gantries for High-Voltage Conductors
    [14, 18, 21].forEach((y, idx) => {
      const armWidth = 10 - idx * 1.8;
      const crossarm = new THREE.Mesh(new THREE.BoxGeometry(armWidth, 0.35, 0.35), pylonMat);
      crossarm.position.set(0, y, 0);
      pylon.add(crossarm);
    });

    pylonGroup.add(pylon);
  }
  sceneryGroup.add(pylonGroup);

  // ==========================================
  // 5. STACKED SHIPPING CONTAINERS & LOGISTICS YARDS
  // ==========================================
  const containerColors = [0x1e3a8a, 0x991b1b, 0x065f46, 0xd97706];
  const containerCount = 60;
  const containerGeo = new THREE.BoxGeometry(2.4, 2.6, 6.0); // Standard 20ft ISO container
  const containers = new THREE.InstancedMesh(containerGeo, createMaterial(0xffffff, { roughness: 0.6, metalness: 0.3 }), containerCount);
  containers.castShadow = true;
  containers.receiveShadow = true;

  for (let i = 0; i < containerCount; i++) {
    const isStackTier2 = i % 3 === 0;
    const clusterX = i < 30 ? -42 : 36;
    const clusterZ = startZ + 1200 + (i % 15) * 8;

    dummy.position.set(clusterX + (i % 2) * 3.0, isStackTier2 ? 3.9 : 1.3, clusterZ);
    dummy.scale.set(1, 1, 1);
    dummy.rotation.set(0, 0, 0);
    dummy.updateMatrix();
    containers.setMatrixAt(i, dummy.matrix);
    containers.setColorAt(i, new THREE.Color(containerColors[i % containerColors.length]));
  }
  containers.instanceMatrix.needsUpdate = true;
  if (containers.instanceColor) containers.instanceColor.needsUpdate = true;
  sceneryGroup.add(containers);

  // ==========================================
  // 6. LEVEL CROSSING (PHATAK / LC GATE) WITH ROAD TRAFFIC
  // ==========================================
  // Level Crossing at Z = 1850m (Manjari) and Z = 4050m (Uruli)
  [1850, 4050].forEach(lcZ => {
    const lcGroup = new THREE.Group();

    // Asphalt Road Crossing both tracks
    const road = new THREE.Mesh(
      new THREE.BoxGeometry(60, 0.08, 9.0),
      createMaterial(0x27272a, { roughness: 0.9 })
    );
    road.position.set(2.65, 0.42, lcZ);
    road.receiveShadow = true;

    // Road White Centerline Markings
    const roadStripe = new THREE.Mesh(
      new THREE.BoxGeometry(60, 0.09, 0.25),
      createMaterial(0xf4f4f5)
    );
    roadStripe.position.set(2.65, 0.425, lcZ);

    // Gatekeeper Cabin / Hut
    const cabin = new THREE.Mesh(
      new THREE.BoxGeometry(4.2, 3.2, 3.4),
      createMaterial(0xfef08a) // Yellow cabin
    );
    cabin.position.set(-6.8, 2.0, lcZ - 8);
    const cabinRoof = new THREE.Mesh(
      new THREE.BoxGeometry(4.6, 0.35, 3.8),
      createMaterial(0x991b1b) // Red roof
    );
    cabinRoof.position.set(-6.8, 3.75, lcZ - 8);

    // Level Crossing Boom Barriers (Red & White Striped Poles)
    [-4.5, 9.8].forEach((bx, sideIdx) => {
      const barrierPost = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.4, 8), createMaterial(0x18181b));
      barrierPost.position.set(bx, 1.1, lcZ - 4.2);

      const boom = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 8.5), createMaterial(0xdc2626)); // Red boom
      boom.position.set(bx, 1.6, lcZ);
      boom.rotation.x = Math.PI / 2;

      // Central Red Stop Disc
      const stopDisc = new THREE.Mesh(new THREE.CircleGeometry(0.35, 16), createMaterial(0xdc2626));
      stopDisc.position.set(bx + (sideIdx === 0 ? 0.1 : -0.1), 1.6, lcZ);
      stopDisc.rotation.y = sideIdx === 0 ? Math.PI / 2 : -Math.PI / 2;

      lcGroup.add(barrierPost, boom, stopDisc);
    });

    // Parked Indian Auto-Rickshaws waiting at the closed level crossing!
    [-18, 22].forEach(autoX => {
      const autoRickshaw = new THREE.Group();
      autoRickshaw.position.set(autoX, 0.45, lcZ + 2.2);

      // Yellow & Green Body
      const lowerBody = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.8, 2.6), createMaterial(0x15803d)); // Green CNG body
      lowerBody.position.y = 0.55;
      const upperCanopy = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.9, 2.2), createMaterial(0xfacc15)); // Yellow canopy
      upperCanopy.position.set(0, 1.35, -0.1);
      const autoWheel = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.14, 8), createMaterial(0x111111));
      autoWheel.rotation.z = Math.PI / 2;
      autoWheel.position.set(0, 0.25, 0);

      autoRickshaw.add(lowerBody, upperCanopy, autoWheel);
      lcGroup.add(autoRickshaw);
    });

    lcGroup.add(road, roadStripe, cabin, cabinRoof);
    sceneryGroup.add(lcGroup);
  });

  // ==========================================
  // 7. CROSSING INDIAN RAILWAYS FREIGHT TRAIN ON TRACK 2 (UP LINE)
  // (Standing WAG-9 Electric Loco + 10 BTPN Petroleum Oil Tankers at Loni sidings)
  // ==========================================
  const freightGroup = new THREE.Group();
  freightGroup.position.set(5.30, 0, 3100); // Placed on Track 2 beside Loni Oil Terminals

  // WAG-9 Heavy Freight Locomotive (Emerald Green Livery #047857)
  const wag9Body = new THREE.Mesh(
    new THREE.BoxGeometry(3.2, 3.8, 20.5),
    createMaterial(0x047857, { roughness: 0.5, metalness: 0.3 })
  );
  wag9Body.position.set(0, 2.9, 0);
  wag9Body.castShadow = true;

  // WAG-9 Yellow Warning Chevron Stripe
  const wag9Stripe = new THREE.Mesh(
    new THREE.BoxGeometry(3.22, 0.4, 20.6),
    createMaterial(0xfacc15)
  );
  wag9Stripe.position.set(0, 2.7, 0);

  // WAG-9 Roof equipment & pantograph
  const wag9Roof = new THREE.Mesh(
    new THREE.BoxGeometry(3.0, 0.4, 18.0),
    createMaterial(0x71717a)
  );
  wag9Roof.position.set(0, 4.9, 0);
  freightGroup.add(wag9Body, wag9Stripe, wag9Roof);

  // 10 BTPN Cylindrical Petroleum Oil Tanker Wagons
  const btpnTankMat = createMaterial(0x1c3829, { roughness: 0.45, metalness: 0.25 }); // Classic IR oil dark green
  const btpnStripeMat = createMaterial(0xf59e0b); // Caution yellow hazmat band
  const bogieMat = createMaterial(0x18181b);

  for (let w = 0; w < 10; w++) {
    const wagonZ = 22.0 + w * 14.5;
    const wagon = new THREE.Group();
    wagon.position.set(0, 0, wagonZ);

    // Cylindrical Tanker Barrel
    const tankMesh = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 12.0, 16), btpnTankMat);
    tankMesh.rotation.x = Math.PI / 2;
    tankMesh.position.set(0, 2.6, 0);
    tankMesh.castShadow = true;

    // Dome Manhole on top
    const domeMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.4, 10), btpnStripeMat);
    domeMesh.position.set(0, 4.1, 0);

    // Chassis Underframe
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.35, 12.8), bogieMat);
    chassis.position.set(0, 1.15, 0);

    // CASNUB Bogies (Wheelsets)
    [-4.2, 4.2].forEach(bz => {
      const bogie = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.65, 2.2), bogieMat);
      bogie.position.set(0, 0.65, bz);
      wagon.add(bogie);
    });

    wagon.add(tankMesh, domeMesh, chassis);
    freightGroup.add(wagon);
  }
  sceneryGroup.add(freightGroup);

  // ==========================================
  // 8. ROADSIDE URBAN TREES (NEEM & GULMOHAR)
  // ==========================================
  const treeCount = 180;
  const treeTrunkMat = createMaterial(0x443729, { roughness: 0.9 });
  const neemFoliageMat = createMaterial(0x2d6a2f, { roughness: 0.8 }); // Foliage base material

  const treeTrunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.24, 0.36, 4.0, 6), treeTrunkMat, treeCount);
  const treeCrowns = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(2.8, 1), neemFoliageMat, treeCount);
  treeTrunks.castShadow = true;
  treeCrowns.castShadow = true;

  for (let i = 0; i < treeCount; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const x = side === -1 ? -22 - rnd() * 45 : 24 + rnd() * 45;
    const z = startZ + 60 + (i / treeCount) * (trackLength - 120);
    const s = 0.75 + rnd() * 0.6;

    dummy.position.set(x, 2.0 * s, z);
    dummy.scale.set(s, s, s);
    dummy.rotation.set(0, rnd() * Math.PI * 2, 0);
    dummy.updateMatrix();
    treeTrunks.setMatrixAt(i, dummy.matrix);

    dummy.position.set(x, 5.0 * s, z);
    dummy.updateMatrix();
    treeCrowns.setMatrixAt(i, dummy.matrix);
    treeCrowns.setColorAt(i, rnd() > 0.7 ? new THREE.Color(0xc2410c) : new THREE.Color(0x2d6a2f));
  }

  treeTrunks.instanceMatrix.needsUpdate = true;
  treeCrowns.instanceMatrix.needsUpdate = true;
  if (treeCrowns.instanceColor) treeCrowns.instanceColor.needsUpdate = true;
  sceneryGroup.add(treeTrunks, treeCrowns);

  scene.add(sceneryGroup);
  return sceneryGroup;
}
