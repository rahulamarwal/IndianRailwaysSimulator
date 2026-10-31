import * as THREE from 'three';
import { RendererContext } from './renderer';
import { TrackConfig } from './types';
import { getTrackCurve } from './curve';

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
  // SECTION A: WESTERN GHATS NATURE & SAHYADRI HILLS (LONAVALA TO PUNE: Z < 3900)
  // =========================================================================

  // 1. Sahyadri Basalt Mountain Mesas (Flat-topped Trappean Cliffs)
  const mountainCount = 65;
  const basaltColors = [0x333b2f, 0x414736, 0x2b3325, 0x4a4d38, 0x262d22];
  const mountainGeo = new THREE.CylinderGeometry(28, 48, 45, 7);
  const mountainMat = createMaterial(0x384030, { roughness: 0.95, metalness: 0.05 });
  const mountains = new THREE.InstancedMesh(mountainGeo, mountainMat, mountainCount);
  mountains.castShadow = true;
  mountains.receiveShadow = true;

  for (let i = 0; i < mountainCount; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const xDist = side === -1 ? -110 - rnd() * 95 : 105 + rnd() * 95;
    const z = startZ + 60 + (i / mountainCount) * 3650 + (rnd() - 0.5) * 80;
    const scaleY = 0.8 + rnd() * 0.9;
    const scaleXZ = 0.85 + rnd() * 0.6;
    const pos = getCurvePos(xDist, z, 22 * scaleY);

    dummy.position.set(pos.x, pos.y, pos.z);
    dummy.scale.set(scaleXZ, scaleY, scaleXZ);
    dummy.rotation.set(0, rnd() * Math.PI * 2, 0);
    dummy.updateMatrix();
    mountains.setMatrixAt(i, dummy.matrix);
    mountains.setColorAt(i, new THREE.Color(basaltColors[i % basaltColors.length]));
  }
  mountains.instanceMatrix.needsUpdate = true;
  if (mountains.instanceColor) mountains.instanceColor.needsUpdate = true;
  sceneryGroup.add(mountains);

  // 2. Rolling Green Foothills along Railway Corridor
  const hillCount = 90;
  const hillGeo = new THREE.SphereGeometry(18, 9, 8);
  const hillMat = createMaterial(0x4d6339, { roughness: 0.9 });
  const foothills = new THREE.InstancedMesh(hillGeo, hillMat, hillCount);
  foothills.receiveShadow = true;

  for (let i = 0; i < hillCount; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const xDist = side === -1 ? -42 - rnd() * 45 : 45 + rnd() * 45;
    const z = startZ + 40 + (i / hillCount) * 3700;
    const pos = getCurvePos(xDist, z, -2 + rnd() * 3);
    const sx = 1.0 + rnd() * 0.8;
    const sy = 0.5 + rnd() * 0.5;

    dummy.position.set(pos.x, pos.y, pos.z);
    dummy.scale.set(sx, sy, sx * 1.3);
    dummy.rotation.set(0, rnd() * Math.PI, 0);
    dummy.updateMatrix();
    foothills.setMatrixAt(i, dummy.matrix);
  }
  foothills.instanceMatrix.needsUpdate = true;
  sceneryGroup.add(foothills);

  // 3. Dense Western Ghats Nature Trees (Banyans, Neems & Blooming Gulmohars)
  const natureTreeCount = 380;
  const trunkMat = createMaterial(0x3e3226, { roughness: 0.9 });
  const foliageBaseMat = createMaterial(0x235327, { roughness: 0.85 });

  const natureTrunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.28, 0.44, 4.2, 6), trunkMat, natureTreeCount);
  const natureCrowns = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(3.2, 1), foliageBaseMat, natureTreeCount);
  natureTrunks.castShadow = true;
  natureCrowns.castShadow = true;

  const crownColors = [
    new THREE.Color(0x1e4e24), // Deep rainforest green
    new THREE.Color(0x2d6a2f), // Lush neem green
    new THREE.Color(0x3f7832), // Mango canopy
    new THREE.Color(0xc2410c), // Blazing orange Gulmohar blossom
    new THREE.Color(0xb91c1c)  // Red flame tree bloom
  ];

  for (let i = 0; i < natureTreeCount; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const xDist = side === -1 ? -16 - rnd() * 65 : 22 + rnd() * 65;
    const z = startZ + 20 + (i / natureTreeCount) * 3780 + (rnd() - 0.5) * 20;
    const s = 0.8 + rnd() * 0.7;
    const pos = getCurvePos(xDist, z, 2.1 * s);

    dummy.position.set(pos.x, pos.y, pos.z);
    dummy.scale.set(s, s, s);
    dummy.rotation.set(0, rnd() * Math.PI * 2, 0);
    dummy.updateMatrix();
    natureTrunks.setMatrixAt(i, dummy.matrix);

    dummy.position.set(pos.x, pos.y + 3.2 * s, pos.z);
    dummy.updateMatrix();
    natureCrowns.setMatrixAt(i, dummy.matrix);
    natureCrowns.setColorAt(i, crownColors[Math.floor(rnd() * crownColors.length)]);
  }
  natureTrunks.instanceMatrix.needsUpdate = true;
  natureCrowns.instanceMatrix.needsUpdate = true;
  if (natureCrowns.instanceColor) natureCrowns.instanceColor.needsUpdate = true;
  sceneryGroup.add(natureTrunks, natureCrowns);

  // 4. Coconut & Betel Nut Palms along Ghat Streams & Valleys
  const palmCount = 110;
  const palmTrunkMat = createMaterial(0x574a3b, { roughness: 0.85 });
  const palmFrondMat = createMaterial(0x2f6b2f, { roughness: 0.75 });
  const palmTrunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.16, 0.28, 9.5, 7), palmTrunkMat, palmCount);
  const palmCrowns = new THREE.InstancedMesh(new THREE.ConeGeometry(3.6, 2.2, 7), palmFrondMat, palmCount);
  palmTrunks.castShadow = true;
  palmCrowns.castShadow = true;

  for (let i = 0; i < palmCount; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const xDist = side === -1 ? -18 - rnd() * 45 : 24 + rnd() * 45;
    const z = startZ + 80 + (i / palmCount) * 3650;
    const pos = getCurvePos(xDist, z, 4.75);

    dummy.position.set(pos.x, pos.y, pos.z);
    dummy.scale.set(1, 1, 1);
    dummy.rotation.set(0.06 * (rnd() - 0.5), rnd() * Math.PI * 2, 0.08 * (rnd() - 0.5));
    dummy.updateMatrix();
    palmTrunks.setMatrixAt(i, dummy.matrix);

    dummy.position.set(pos.x, 9.4, pos.z);
    dummy.rotation.set(0, rnd() * Math.PI * 2, 0);
    dummy.updateMatrix();
    palmCrowns.setMatrixAt(i, dummy.matrix);
  }
  palmTrunks.instanceMatrix.needsUpdate = true;
  palmCrowns.instanceMatrix.needsUpdate = true;
  sceneryGroup.add(palmTrunks, palmCrowns);

  // 5. Mula-Mutha River Rail Bridge Crossing (between Shivaji Nagar & Pune: z = 3100 to 3350)
  const riverGroup = new THREE.Group();
  const riverWaterMat = new THREE.MeshStandardMaterial({
    color: 0x1a4668,
    metalness: 0.45,
    roughness: 0.12
  });

  // Glistening River Surface
  const riverGeo = new THREE.PlaneGeometry(380, 240);
  const riverMesh = new THREE.Mesh(riverGeo, riverWaterMat);
  riverMesh.rotation.x = -Math.PI / 2;
  const riverPos = getCurvePos(2.65, 3225, -0.6);
  riverMesh.position.set(riverPos.x, -0.6, riverPos.z);
  riverMesh.rotation.z = riverPos.yaw;
  riverGroup.add(riverMesh);

  // River Bank Sand / Rock Slopes
  const bankMat = createMaterial(0x574837, { roughness: 0.95 });
  [-110, 110].forEach(bz => {
    const bank = new THREE.Mesh(new THREE.BoxGeometry(380, 1.4, 25), bankMat);
    bank.position.set(riverPos.x, 0.1, riverPos.z + bz);
    riverGroup.add(bank);
  });

  // Massive Concrete Bridge Piers plunging into the river beneath tracks
  const pierMat = createMaterial(0x8c857b, { roughness: 0.9 });
  const pierGeo = new THREE.BoxGeometry(14, 4.2, 4.0);
  [3140, 3190, 3240, 3290].forEach(pz => {
    const pPos = getCurvePos(2.65, pz, 1.6);
    const pier = new THREE.Mesh(pierGeo, pierMat);
    pier.position.set(pPos.x, 1.2, pPos.z);
    pier.rotation.y = pPos.yaw;
    pier.castShadow = true;
    riverGroup.add(pier);
  });

  // Steel Railing Girders along the bridge deck
  const bridgeRailingMat = createMaterial(0x3e454d, { metalness: 0.7, roughness: 0.3 });
  [-4.2, 9.6].forEach(rx => {
    const railing = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.1, 240), bridgeRailingMat);
    const rPos = getCurvePos(rx, 3225, 1.2);
    railing.position.set(rPos.x, 1.2, rPos.z);
    railing.rotation.y = rPos.yaw;
    riverGroup.add(railing);
  });
  sceneryGroup.add(riverGroup);

  // 6. Rustic Konkan / Ghat Clay Huts with Mangalore Tile Roofs
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
    const xDist = side === -1 ? -58 - rnd() * 50 : 50 + rnd() * 60;
    const z = 4250 + (i / shedCount) * 4400;
    const pos = getCurvePos(xDist, z, 4.5);

    dummy.position.set(pos.x, pos.y, pos.z);
    dummy.scale.set(1, 1, 1);
    dummy.rotation.set(0, pos.yaw + (rnd() - 0.5) * 0.2, 0);
    dummy.updateMatrix();
    sheds.setMatrixAt(i, dummy.matrix);

    dummy.position.set(pos.x, 9.2, pos.z);
    dummy.updateMatrix();
    shedRoofs.setMatrixAt(i, dummy.matrix);
  }
  sheds.instanceMatrix.needsUpdate = true;
  shedRoofs.instanceMatrix.needsUpdate = true;
  sceneryGroup.add(sheds, shedRoofs);

  // 4. Industrial Smokestacks / Factory Chimneys (Red & White hazard rings)
  const chimneyCount = 18;
  const chimneyMat = createMaterial(0xdcdcdc, { roughness: 0.6 });
  const chimneys = new THREE.InstancedMesh(new THREE.CylinderGeometry(1.6, 2.5, 36, 16), chimneyMat, chimneyCount);
  chimneys.castShadow = true;

  for (let i = 0; i < chimneyCount; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const xDist = side === -1 ? -75 - rnd() * 65 : 75 + rnd() * 70;
    const z = 4400 + (i / chimneyCount) * 4300;
    const pos = getCurvePos(xDist, z, 18);

    dummy.position.set(pos.x, pos.y, pos.z);
    dummy.scale.set(1, 1, 1);
    dummy.rotation.set(0, pos.yaw, 0);
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

    // Asphalt Road crossing perpendicular to tracks
    const roadMat = createMaterial(0x27272a, { roughness: 0.95 });
    const road = new THREE.Mesh(new THREE.PlaneGeometry(80, 10), roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0.08, 0);

    const roadStripe = new THREE.Mesh(new THREE.PlaneGeometry(80, 0.25), createMaterial(0xfef08a));
    roadStripe.rotation.x = -Math.PI / 2;
    roadStripe.position.set(0, 0.09, 0);

    // Gateman Cabin
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(4.2, 3.2, 3.4), createMaterial(0xfafaf9));
    cabin.position.set(-6.8, 2.0, -8);
    const cabinRoof = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.35, 3.8), createMaterial(0x991b1b));
    cabinRoof.position.set(-6.8, 3.75, -8);

    // Boom Barriers with Red Stop Discs
    [-4.5, 9.8].forEach((bx, sideIdx) => {
      const barrierPost = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.4, 8), createMaterial(0x18181b));
      barrierPost.position.set(bx, 1.1, -4.2);

      const boom = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 8.5), createMaterial(0xdc2626));
      boom.position.set(bx, 1.6, 0);
      boom.rotation.x = Math.PI / 2;

      const stopDisc = new THREE.Mesh(new THREE.CircleGeometry(0.35, 16), createMaterial(0xdc2626));
      stopDisc.position.set(bx + (sideIdx === 0 ? 0.1 : -0.1), 1.6, 0);
      stopDisc.rotation.y = sideIdx === 0 ? Math.PI / 2 : -Math.PI / 2;

      lcGroup.add(barrierPost, boom, stopDisc);
    });

    // Parked Indian Auto-Rickshaws
    [-18, 22].forEach(autoX => {
      const autoRickshaw = new THREE.Group();
      autoRickshaw.position.set(autoX, 0.45, 2.2);

      const lowerBody = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.8, 2.6), createMaterial(0x15803d));
      lowerBody.position.y = 0.55;
      const upperCanopy = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.9, 2.2), createMaterial(0xfacc15));
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

  // 8. Crossing Indian Railways Freight Train on Track 2 (Up Line) at Loni sidings (z = 5750)
  const freightGroup = new THREE.Group();
  const fPos = getCurvePos(5.30, 5750, 0);
  freightGroup.position.set(fPos.x, 0, fPos.z);
  freightGroup.rotation.y = fPos.yaw;

  // WAG-9 Heavy Freight Locomotive (Emerald Green Livery #047857)
  const wag9Body = new THREE.Mesh(
    new THREE.BoxGeometry(3.2, 3.8, 20.5),
    createMaterial(0x047857, { roughness: 0.5, metalness: 0.3 })
  );
  wag9Body.position.set(0, 2.9, 0);
  wag9Body.castShadow = true;

  const wag9Stripe = new THREE.Mesh(new THREE.BoxGeometry(3.22, 0.4, 20.6), createMaterial(0xfacc15));
  wag9Stripe.position.set(0, 2.7, 0);

  const wag9Roof = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.4, 18.0), createMaterial(0x71717a));
  wag9Roof.position.set(0, 4.9, 0);
  freightGroup.add(wag9Body, wag9Stripe, wag9Roof);

  // 10 BTPN Petroleum Oil Tankers
  const btpnTankMat = createMaterial(0x1c3829, { roughness: 0.45, metalness: 0.25 });
  const btpnStripeMat = createMaterial(0xf59e0b);
  const bogieMat = createMaterial(0x18181b);

  for (let w = 0; w < 10; w++) {
    const wagonZ = 22.0 + w * 14.5;
    const wagon = new THREE.Group();
    wagon.position.set(0, 0, wagonZ);

    const tankMesh = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 12.0, 16), btpnTankMat);
    tankMesh.rotation.x = Math.PI / 2;
    tankMesh.position.set(0, 2.6, 0);
    tankMesh.castShadow = true;

    const domeMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.4, 10), btpnStripeMat);
    domeMesh.position.set(0, 4.1, 0);

    const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.35, 12.8), bogieMat);
    chassis.position.set(0, 1.15, 0);

    [-4.2, 4.2].forEach(bz => {
      const bogie = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.65, 2.2), bogieMat);
      bogie.position.set(0, 0.65, bz);
      wagon.add(bogie);
    });

    wagon.add(tankMesh, domeMesh, chassis);
    freightGroup.add(wagon);
  }
  sceneryGroup.add(freightGroup);

  // 9. Urban Trees along Industrial Corridor (z >= 3900)
  const urbanTreeCount = 140;
  const urbanTrunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.24, 0.36, 4.0, 6), trunkMat, urbanTreeCount);
  const urbanCrowns = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(2.8, 1), foliageBaseMat, urbanTreeCount);
  urbanTrunks.castShadow = true;
  urbanCrowns.castShadow = true;

  for (let i = 0; i < urbanTreeCount; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const xDist = side === -1 ? -22 - rnd() * 45 : 24 + rnd() * 45;
    const z = 3920 + (i / urbanTreeCount) * 4980;
    const s = 0.75 + rnd() * 0.6;
    const pos = getCurvePos(xDist, z, 2.0 * s);

    dummy.position.set(pos.x, pos.y, pos.z);
    dummy.scale.set(s, s, s);
    dummy.rotation.set(0, rnd() * Math.PI * 2, 0);
    dummy.updateMatrix();
    urbanTrunks.setMatrixAt(i, dummy.matrix);

    dummy.position.set(pos.x, pos.y + 3.0 * s, pos.z);
    dummy.updateMatrix();
    urbanCrowns.setMatrixAt(i, dummy.matrix);
    urbanCrowns.setColorAt(i, rnd() > 0.7 ? new THREE.Color(0xc2410c) : new THREE.Color(0x2d6a2f));
  }
  urbanTrunks.instanceMatrix.needsUpdate = true;
  urbanCrowns.instanceMatrix.needsUpdate = true;
  if (urbanCrowns.instanceColor) urbanCrowns.instanceColor.needsUpdate = true;
  sceneryGroup.add(urbanTrunks, urbanCrowns);

  scene.add(sceneryGroup);
  return sceneryGroup;
}
