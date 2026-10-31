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

  // =========================================================================
  // 5. MULA-MUTHA RIVER RAIL BRIDGE CROSSING (BETWEEN SHIVAJI NAGAR & PUNE: z = 3100 to 3340)
  // Completely underneath and outside the tracks (Zero collision with trains!)
  // =========================================================================
  const riverGroup = new THREE.Group();
  const riverWaterMat = new THREE.MeshStandardMaterial({
    color: 0x1a4668,
    metalness: 0.45,
    roughness: 0.12
  });

  // Glistening River Surface deep below the tracks (y = -2.2m)
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

    // Girder spans from normal offset x = -4.4 to +10.0 (covers Track 1 and Track 2)
    const lx = pt.x - 4.4 * nx;
    const lz = z - 4.4 * nz;
    const rx = pt.x + 10.0 * nx;
    const rz = z + 10.0 * nz;

    // Girder 4 vertices: Top-Left, Bottom-Left, Top-Right, Bottom-Right (all UNDER the ballast!)
    girderPos.push(lx, 0.05, lz);
    girderPos.push(lx, -0.65, lz);
    girderPos.push(rx, 0.05, rz);
    girderPos.push(rx, -0.65, rz);

    // Guard Railing: Top & Bottom lines along outer edges (well clear of trains)
    leftRailingPos.push(lx, 0.45, lz);
    leftRailingPos.push(lx, 1.35, lz);

    rightRailingPos.push(rx, 0.45, rz);
    rightRailingPos.push(rx, 1.35, rz);

    if (i < bridgeSlices) {
      const b = i * 4;
      const nb = (i + 1) * 4;
      // Top face
      girderIndices.push(b + 0, b + 2, nb + 2);
      girderIndices.push(b + 0, nb + 2, nb + 0);
      // Bottom face
      girderIndices.push(b + 1, nb + 3, b + 3);
      girderIndices.push(b + 1, nb + 1, nb + 3);
      // Left side
      girderIndices.push(b + 0, nb + 0, nb + 1);
      girderIndices.push(b + 0, nb + 1, b + 1);
      // Right side
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

  // Railing meshes (left and right outer edges, completely clear of tracks)
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

  // Massive Concrete Bridge Piers plunging into the river beneath tracks (top at y = -0.65m)
  const pierMat = createMaterial(0x8c857b, { roughness: 0.9 });
  const pierGeo = new THREE.BoxGeometry(13.6, 3.4, 3.6);
  [3140, 3190, 3240, 3290].forEach(pz => {
    const pPos = getCurvePos(2.65, pz);
    const pier = new THREE.Mesh(pierGeo, pierMat);
    // Center at y = -2.35m, height 3.4m -> top is at y = -0.65m (under girder, 1.19m BELOW rails!)
    pier.position.set(pPos.x, -2.35, pPos.z);
    pier.rotation.y = pPos.yaw;
    pier.castShadow = true;
    pier.receiveShadow = true;
    riverGroup.add(pier);
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
  // Booms and cabins placed safely outside railway clearance envelope
  [4800, 7400].forEach(lcZ => {
    const lcGroup = new THREE.Group();
    const lcPos = getCurvePos(2.65, lcZ, 0);
    lcGroup.position.set(lcPos.x, 0, lcPos.z);
    lcGroup.rotation.y = lcPos.yaw;

    // Asphalt Road crossing perpendicular to tracks (width 8.5m along Z)
    const roadMat = createMaterial(0x27272a, { roughness: 0.95 });
    const road = new THREE.Mesh(new THREE.PlaneGeometry(80, 8.5), roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0.08, 0);

    const roadStripe = new THREE.Mesh(new THREE.PlaneGeometry(80, 0.25), createMaterial(0xfef08a));
    roadStripe.rotation.x = -Math.PI / 2;
    roadStripe.position.set(0, 0.09, 0);

    // Gateman Cabin (placed far outside tracks on the left)
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(4.2, 3.2, 3.4), createMaterial(0xfafaf9));
    cabin.position.set(-8.5, 2.0, -7.5);
    const cabinRoof = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.35, 3.8), createMaterial(0x991b1b));
    cabinRoof.position.set(-8.5, 3.75, -7.5);

    // Boom Barriers blocking the ROAD (Left at x = -7.2, Right at x = +12.5)
    // Clear of Track 1 (-0.84) and Track 2 (+6.14)
    [-7.2, 12.5].forEach((bx, sideIdx) => {
      const barrierPost = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.4, 8), createMaterial(0x18181b));
      barrierPost.position.set(bx, 0.9, -4.25);

      // Horizontal boom extending across the road along Z
      const boom = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 8.2), createMaterial(0xdc2626));
      boom.position.set(bx, 1.25, 0);

      // Red Stop Disc facing the road
      const stopDisc = new THREE.Mesh(new THREE.CircleGeometry(0.35, 16), createMaterial(0xdc2626));
      stopDisc.position.set(bx + (sideIdx === 0 ? -0.1 : 0.1), 1.25, 0);
      stopDisc.rotation.y = sideIdx === 0 ? -Math.PI / 2 : Math.PI / 2;

      lcGroup.add(barrierPost, boom, stopDisc);
    });

    // Parked Indian Auto-Rickshaws waiting on the road outside the barrier
    [-17, 21].forEach(autoX => {
      const autoRickshaw = new THREE.Group();
      autoRickshaw.position.set(autoX, 0.45, 1.8);
      autoRickshaw.rotation.y = autoX < 0 ? Math.PI / 2 : -Math.PI / 2;

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

  // =========================================================================
  // 8. CROSSING INDIAN RAILWAYS FREIGHT TRAIN ON TRACK 2 (UP LINE) AT LONI SIDINGS (z = 5710 to 5890)
  // Standing on Track 2 (Up Line) facing oncoming traffic, snaking smoothly along the curve!
  // =========================================================================
  const wag9Group = new THREE.Group();
  const locoZ = 5710;
  const lPos = getCurvePos(5.30, locoZ);
  wag9Group.position.set(lPos.x, 0, lPos.z);
  wag9Group.rotation.y = lPos.yaw + Math.PI; // Facing towards oncoming trains from Pune / Lonavala

  const wag9BodyMat = createMaterial(0x047857, { roughness: 0.5, metalness: 0.3 });
  const wag9StripeMat = createMaterial(0xfacc15);
  const wag9RoofMat = createMaterial(0x71717a);
  const bogieMat = createMaterial(0x18181b);
  const headlightMat = new THREE.MeshBasicMaterial({ color: 0xfffbeb });

  // Main Cab Body
  const wag9Body = new THREE.Mesh(new THREE.BoxGeometry(3.2, 3.4, 20.5), wag9BodyMat);
  wag9Body.position.set(0, 2.75, 0);
  wag9Body.castShadow = true;

  // Yellow Warning Chevron Stripe
  const wag9Stripe = new THREE.Mesh(new THREE.BoxGeometry(3.22, 0.42, 20.6), wag9StripeMat);
  wag9Stripe.position.set(0, 2.55, 0);

  // Roof & Pantograph
  const wag9Roof = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.4, 18.0), wag9RoofMat);
  wag9Roof.position.set(0, 4.65, 0);

  // Co-Co Bogies (Wheelsets at rail level y = 0.54)
  [-6.2, 6.2].forEach(bz => {
    const bogie = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.65, 4.8), bogieMat);
    bogie.position.set(0, 0.72, bz);
    wag9Group.add(bogie);
  });

  // Glowing Headlights on the front cab (facing oncoming trains)
  [-0.65, 0.65].forEach(hx => {
    const headlight = new THREE.Mesh(new THREE.CircleGeometry(0.24, 16), headlightMat);
    headlight.position.set(hx, 3.1, 10.3);
    wag9Group.add(headlight);
  });

  // Pantograph touching the Track 2 contact wire (y = 6.0m)
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

    // Tanker Barrel (Radius 1.4m, Center y = 2.65m)
    const tankMesh = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 11.8, 18), btpnTankMat);
    tankMesh.rotation.x = Math.PI / 2;
    tankMesh.position.set(0, 2.65, 0);
    tankMesh.castShadow = true;

    // Yellow Hazmat Warning Band
    const bandMesh = new THREE.Mesh(new THREE.CylinderGeometry(1.42, 1.42, 1.2, 18), btpnStripeMat);
    bandMesh.rotation.x = Math.PI / 2;
    bandMesh.position.set(0, 2.65, 0);

    // Top Dome Manhole
    const domeMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.4, 10), btpnStripeMat);
    domeMesh.position.set(0, 4.15, 0);

    // Chassis Underframe
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.35, 12.8), bogieMat);
    chassis.position.set(0, 1.15, 0);

    // CASNUB Bogies (at rail level y = 0.54)
    [-4.2, 4.2].forEach(bz => {
      const bogie = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.65, 2.2), bogieMat);
      bogie.position.set(0, 0.68, bz);
      wagon.add(bogie);
    });

    wagon.add(tankMesh, bandMesh, domeMesh, chassis);
    sceneryGroup.add(wagon);
  }

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
