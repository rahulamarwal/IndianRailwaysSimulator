import * as THREE from 'three';
import { TrackConfig } from './types';
import { RendererContext } from './renderer';
import { getTrackCurve } from './curve';

export function buildTrack(ctx: RendererContext, config: TrackConfig): THREE.Group {
  const trackGroup = new THREE.Group();
  const { scene, createMaterial, createCanvasTexture } = ctx;

  const {
    startZ,
    endZ,
    gauge,
    sleeperSpacing,
    mastSpacing,
    contactWireY,
    catenaryWireY
  } = config;

  const trackLength = endZ - startZ;
  const centerZ = (startZ + endZ) / 2;
  const halfGauge = gauge / 2;

  // Track 1 (Down Line - Loco Pilot Track): Center at X = 0.0 m
  // Track 2 (Up Line - Opposite Traffic Track): Center at X = 5.3 m (RDSO 5.30m BG double line standard)
  const track1X = 0.0;
  const track2X = 5.30;
  const doubleTrackCenterX = (track1X + track2X) / 2; // 2.65m

  // ==========================================
  // 1. PROCEDURAL ULTRA-REALISTIC TEXTURES
  // ==========================================

  // A. Double-Track Crushed Granite Ballast with Dual Oil Drip Paths
  const ballastTexture = createCanvasTexture(1024, 1024, (c, w, h) => {
    // Base crushed granite background
    c.fillStyle = '#635f58';
    c.fillRect(0, 0, w, h);

    // Multi-layered stone aggregate noise
    for (let i = 0; i < 45000; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const size = 1.5 + Math.random() * 3.5;
      const shade = 70 + Math.floor(Math.random() * 70);
      c.fillStyle = `rgb(${shade + 5}, ${shade}, ${shade - 5})`;
      c.fillRect(x, y, size, size);
    }

    // Granite highlight pebbles
    for (let i = 0; i < 8000; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const size = 1 + Math.random() * 2;
      const light = 160 + Math.floor(Math.random() * 50);
      c.fillStyle = `rgb(${light}, ${light - 5}, ${light - 15})`;
      c.fillRect(x, y, size, size);
    }

    // Helper to paint realistic locomotive oil & grease drip gradient along a track centerline
    const paintOilPath = (centerNormX: number, widthNorm: number) => {
      const cx = w * centerNormX;
      const halfW = (w * widthNorm) / 2;
      const dripGrad = c.createLinearGradient(cx - halfW, 0, cx + halfW, 0);
      dripGrad.addColorStop(0.0, 'rgba(30, 22, 16, 0.0)');
      dripGrad.addColorStop(0.3, 'rgba(24, 18, 12, 0.65)');
      dripGrad.addColorStop(0.5, 'rgba(12, 10, 8, 0.95)');
      dripGrad.addColorStop(0.7, 'rgba(24, 18, 12, 0.65)');
      dripGrad.addColorStop(1.0, 'rgba(30, 22, 16, 0.0)');

      c.fillStyle = dripGrad;
      c.fillRect(cx - halfW, 0, halfW * 2, h);

      // Dropped engine grease specks
      for (let i = 0; i < 900; i++) {
        const ox = cx + (Math.random() - 0.5) * halfW * 1.6;
        const oy = Math.random() * h;
        c.fillStyle = 'rgba(8, 6, 4, 0.7)';
        c.beginPath();
        c.arc(ox, oy, 1 + Math.random() * 2.5, 0, Math.PI * 2);
        c.fill();
      }
    };

    // Track 1 (x = 0) corresponds to ~28% across the 12.8m ballast top
    // Track 2 (x = 5.30m) corresponds to ~72% across the ballast top
    paintOilPath(0.29, 0.15);
    paintOilPath(0.71, 0.15);
  });
  ballastTexture.wrapS = THREE.RepeatWrapping;
  ballastTexture.wrapT = THREE.RepeatWrapping;
  ballastTexture.repeat.set(1, 160);

  // B. Terrain Ground Texture
  const groundTexture = createCanvasTexture(1024, 1024, (c, w, h) => {
    c.fillStyle = '#6e624c';
    c.fillRect(0, 0, w, h);

    // Dry Deccan soil with Maharashtra red clay tones
    for (let i = 0; i < 30000; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const s = 2 + Math.random() * 6;
      const r = 110 + Math.floor(Math.random() * 45);
      const g = 95 + Math.floor(Math.random() * 35);
      const b = 65 + Math.floor(Math.random() * 30);
      c.fillStyle = `rgb(${r}, ${g}, ${b})`;
      c.fillRect(x, y, s, s);
    }

    // Scrub patches
    for (let i = 0; i < 350; i++) {
      const cx = Math.random() * w;
      const cy = Math.random() * h;
      const rad = 8 + Math.random() * 22;
      const grad = c.createRadialGradient(cx, cy, 2, cx, cy, rad);
      grad.addColorStop(0, 'rgba(82, 92, 54, 0.55)');
      grad.addColorStop(1, 'rgba(82, 92, 54, 0)');
      c.fillStyle = grad;
      c.beginPath();
      c.arc(cx, cy, rad, 0, Math.PI * 2);
      c.fill();
    }
  });
  groundTexture.wrapS = THREE.RepeatWrapping;
  groundTexture.wrapT = THREE.RepeatWrapping;
  groundTexture.repeat.set(12, 180);

  // C. Concrete Sleeper Texture (RDSO Monoblock PSC Sleeper)
  const sleeperTexture = createCanvasTexture(256, 128, (c, w, h) => {
    c.fillStyle = '#a8a29a';
    c.fillRect(0, 0, w, h);

    // Weathering pores
    for (let i = 0; i < 3000; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const val = 140 + Math.floor(Math.random() * 40);
      c.fillStyle = `rgb(${val}, ${val - 5}, ${val - 10})`;
      c.fillRect(x, y, 1.5, 1.5);
    }

    // Rail seat pads (ERC clip rubber grooved pad areas)
    c.fillStyle = '#222222';
    c.fillRect(36, 12, 34, h - 24);
    c.fillRect(w - 70, 12, 34, h - 24);

    // RDSO cast lettering imprint
    c.fillStyle = '#635f58';
    c.font = 'bold 14px Arial';
    c.textAlign = 'center';
    c.fillText('RDSO-T2496', w / 2, h / 2 + 5);
  });

  // ==========================================
  // 2. DOUBLE TRACK PERMANENT WAY (BALLAST PRISM)
  // ==========================================

  // Wide ground plane
  const groundGeo = new THREE.PlaneGeometry(1600, trackLength + 600);
  const groundMat = new THREE.MeshStandardMaterial({
    roughness: 0.95,
    metalness: 0.02,
    map: groundTexture
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(doubleTrackCenterX, 0, centerZ);
  ground.receiveShadow = true;
  trackGroup.add(ground);

  // Curved Ballast Prism: Strip following track curves smoothly
  const ballastMat = new THREE.MeshStandardMaterial({
    roughness: 0.92,
    metalness: 0.08,
    map: ballastTexture
  });
  const subgradeMat = createMaterial(0x6e6556, { roughness: 0.95 });

  const ballastStep = 6.0;
  const ballastSlices = Math.ceil(trackLength / ballastStep);

  const ballastPos: number[] = [];
  const ballastUVs: number[] = [];
  const ballastIndices: number[] = [];

  const subgradePos: number[] = [];
  const subgradeIndices: number[] = [];

  for (let i = 0; i <= ballastSlices; i++) {
    const z = Math.min(startZ + i * ballastStep, endZ);
    const pt = getTrackCurve(z);
    const cosY = Math.cos(pt.yaw);
    const sinY = -Math.sin(pt.yaw); // normal x, z

    // Center of double-track prism
    const cx = pt.x + doubleTrackCenterX * cosY;
    const cz = z + doubleTrackCenterX * sinY;

    // Ballast shoulder profile (Top width 12.8m, Base width 15.5m)
    // 4 points across: Base-Left, Top-Left, Top-Right, Base-Right
    const hwTop = 6.4;
    const hwBase = 7.75;
    const yTop = 0.22;
    const yBase = 0.06;

    // 0: Base-Left
    ballastPos.push(cx - hwBase * cosY, yBase, cz - hwBase * sinY);
    ballastUVs.push(0.0, (z - startZ) / 12);

    // 1: Top-Left
    ballastPos.push(cx - hwTop * cosY, yTop, cz - hwTop * sinY);
    ballastUVs.push(0.15, (z - startZ) / 12);

    // 2: Top-Right
    ballastPos.push(cx + hwTop * cosY, yTop, cz + hwTop * sinY);
    ballastUVs.push(0.85, (z - startZ) / 12);

    // 3: Base-Right
    ballastPos.push(cx + hwBase * cosY, yBase, cz + hwBase * sinY);
    ballastUVs.push(1.0, (z - startZ) / 12);

    if (i < ballastSlices) {
      const b = i * 4;
      const nb = (i + 1) * 4;
      // Left shoulder
      ballastIndices.push(b + 0, b + 1, nb + 1);
      ballastIndices.push(b + 0, nb + 1, nb + 0);
      // Top prism
      ballastIndices.push(b + 1, b + 2, nb + 2);
      ballastIndices.push(b + 1, nb + 2, nb + 1);
      // Right shoulder
      ballastIndices.push(b + 2, b + 3, nb + 3);
      ballastIndices.push(b + 2, nb + 3, nb + 2);
    }

    // Subgrade embankment base (width 18m)
    const hwSub = 9.0;
    subgradePos.push(cx - hwSub * cosY, 0.06, cz - hwSub * sinY);
    subgradePos.push(cx + hwSub * cosY, 0.06, cz + hwSub * sinY);

    if (i < ballastSlices) {
      const sb = i * 2;
      const snb = (i + 1) * 2;
      subgradeIndices.push(sb + 0, sb + 1, snb + 1);
      subgradeIndices.push(sb + 0, snb + 1, snb + 0);
    }
  }

  const ballastGeo = new THREE.BufferGeometry();
  ballastGeo.setAttribute('position', new THREE.Float32BufferAttribute(ballastPos, 3));
  ballastGeo.setAttribute('uv', new THREE.Float32BufferAttribute(ballastUVs, 2));
  ballastGeo.setIndex(ballastIndices);
  ballastGeo.computeVertexNormals();

  const ballastMesh = new THREE.Mesh(ballastGeo, ballastMat);
  ballastMesh.receiveShadow = true;
  trackGroup.add(ballastMesh);

  const subgradeGeo = new THREE.BufferGeometry();
  subgradeGeo.setAttribute('position', new THREE.Float32BufferAttribute(subgradePos, 3));
  subgradeGeo.setIndex(subgradeIndices);
  subgradeGeo.computeVertexNormals();
  const subgradeMesh = new THREE.Mesh(subgradeGeo, subgradeMat);
  subgradeMesh.receiveShadow = true;
  trackGroup.add(subgradeMesh);

  // ==========================================
  // 3. BROAD GAUGE RAILS (TRACK 1 & TRACK 2)
  // ==========================================
  const railHeadMat = new THREE.MeshStandardMaterial({
    color: 0xc8d0d8,
    metalness: 0.96,
    roughness: 0.12
  });
  const railWebMat = createMaterial(0x524337, { metalness: 0.65, roughness: 0.6 });

  // Function to build a continuous curved rail ribbon with head and web
  const buildCurvedRail = (railOffsetNormal: number) => {
    const step = 3.0; // 3m interval for smooth track curves
    const steps = Math.ceil(trackLength / step);
    const hw = 0.04; // half head width 80mm
    const headHeight = 0.05;
    const topY = 0.54;
    const webW = 0.06;
    const bottomY = 0.38;

    const headPos: number[] = [];
    const headIndices: number[] = [];

    const webPos: number[] = [];
    const webIndices: number[] = [];

    for (let i = 0; i <= steps; i++) {
      const z = Math.min(startZ + i * step, endZ);
      const pt = getTrackCurve(z);
      const nx = Math.cos(pt.yaw);
      const nz = -Math.sin(pt.yaw);

      // Centerline of this rail in world coordinates
      const cx = pt.x + railOffsetNormal * nx;
      const cz = z + railOffsetNormal * nz;
      const cy = topY + railOffsetNormal * Math.sin(pt.cant);

      // Head: 4 vertices (Top-Left, Top-Right, Bottom-Right, Bottom-Left)
      headPos.push(cx - hw * nx, cy, cz - hw * nz);
      headPos.push(cx + hw * nx, cy, cz + hw * nz);
      headPos.push(cx + hw * nx, cy - headHeight, cz + hw * nz);
      headPos.push(cx - hw * nx, cy - headHeight, cz - hw * nz);

      if (i < steps) {
        const b = i * 4;
        const nb = (i + 1) * 4;
        // Top shiny face
        headIndices.push(b + 0, b + 1, nb + 1);
        headIndices.push(b + 0, nb + 1, nb + 0);
        // Right side
        headIndices.push(b + 1, b + 2, nb + 2);
        headIndices.push(b + 1, nb + 2, nb + 1);
        // Left side
        headIndices.push(b + 3, b + 0, nb + 0);
        headIndices.push(b + 3, nb + 0, nb + 3);
      }

      // Web: 4 vertices
      webPos.push(cx - webW * nx, cy - headHeight, cz - webW * nz);
      webPos.push(cx + webW * nx, cy - headHeight, cz + webW * nz);
      webPos.push(cx + webW * nx, bottomY, cz + webW * nz);
      webPos.push(cx - webW * nx, bottomY, cz - webW * nz);

      if (i < steps) {
        const b = i * 4;
        const nb = (i + 1) * 4;
        webIndices.push(b + 1, b + 2, nb + 2);
        webIndices.push(b + 1, nb + 2, nb + 1);
        webIndices.push(b + 3, b + 0, nb + 0);
        webIndices.push(b + 3, nb + 0, nb + 3);
      }
    }

    const hGeo = new THREE.BufferGeometry();
    hGeo.setAttribute('position', new THREE.Float32BufferAttribute(headPos, 3));
    hGeo.setIndex(headIndices);
    hGeo.computeVertexNormals();
    const hMesh = new THREE.Mesh(hGeo, railHeadMat);
    hMesh.castShadow = true;
    hMesh.receiveShadow = true;

    const wGeo = new THREE.BufferGeometry();
    wGeo.setAttribute('position', new THREE.Float32BufferAttribute(webPos, 3));
    wGeo.setIndex(webIndices);
    wGeo.computeVertexNormals();
    const wMesh = new THREE.Mesh(wGeo, railWebMat);
    wMesh.castShadow = true;

    trackGroup.add(hMesh, wMesh);
  };

  // Track 1 (Down Line): -0.838m, +0.838m
  buildCurvedRail(track1X - halfGauge);
  buildCurvedRail(track1X + halfGauge);

  // Track 2 (Up Line): 5.30 - 0.838m, 5.30 + 0.838m
  buildCurvedRail(track2X - halfGauge);
  buildCurvedRail(track2X + halfGauge);

  // ==========================================
  // 4. INSTANCED PSC SLEEPERS (TRACK 1 & TRACK 2)
  // ==========================================
  const sleepersPerTrack = Math.floor(trackLength / sleeperSpacing);
  const totalSleepers = sleepersPerTrack * 2;
  const sleeperGeo = new THREE.BoxGeometry(2.7, 0.18, 0.28);
  const sleeperMat = new THREE.MeshStandardMaterial({
    roughness: 0.88,
    metalness: 0.05,
    map: sleeperTexture
  });
  const sleeperInstanced = new THREE.InstancedMesh(sleeperGeo, sleeperMat, totalSleepers);
  sleeperInstanced.castShadow = true;
  sleeperInstanced.receiveShadow = true;

  const dummy = new THREE.Object3D();
  let slpIdx = 0;

  for (let i = 0; i < sleepersPerTrack; i++) {
    const z = startZ + i * sleeperSpacing;
    const pt = getTrackCurve(z);
    const nx = Math.cos(pt.yaw);
    const nz = -Math.sin(pt.yaw);

    // Track 1 Sleeper (Down Line)
    dummy.position.set(pt.x + track1X * nx, 0.37, z + track1X * nz);
    dummy.rotation.set(0, pt.yaw, pt.cant);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    sleeperInstanced.setMatrixAt(slpIdx++, dummy.matrix);

    // Track 2 Sleeper (Up Line)
    dummy.position.set(pt.x + track2X * nx, 0.37, z + track2X * nz);
    dummy.rotation.set(0, pt.yaw, pt.cant);
    dummy.updateMatrix();
    sleeperInstanced.setMatrixAt(slpIdx++, dummy.matrix);
  }

  sleeperInstanced.instanceMatrix.needsUpdate = true;
  trackGroup.add(sleeperInstanced);

  // ==========================================
  // 5. AUTHENTIC 25 kV AC OHE PORTAL GANTRIES (DOUBLE TRACK)
  // (RDSO Standard 2-Track Portal Gantry Truss Structure)
  // ==========================================
  const mastCount = Math.floor(trackLength / mastSpacing);

  const galvSteelMat = createMaterial(0x767e87, { metalness: 0.82, roughness: 0.3 });
  const concreteFoundationMat = createMaterial(0xa69f94, { roughness: 0.95 });
  const oheInsulatorMat = createMaterial(0x8a452a, { roughness: 0.35, metalness: 0.1 });

  // 25,000 Volts Danger Warning Plate Texture
  const dangerPlateTex = createCanvasTexture(256, 128, (c, w, h) => {
    c.fillStyle = '#ffffff';
    c.fillRect(0, 0, w, h);
    c.strokeStyle = '#c62828';
    c.lineWidth = 10;
    c.strokeRect(5, 5, w - 10, h - 10);

    c.fillStyle = '#c62828';
    c.font = 'bold 32px Arial';
    c.textAlign = 'center';
    c.fillText('DANGER', w / 2, 40);
    c.font = 'bold 26px Arial';
    c.fillText('25,000 VOLTS', w / 2, 75);
    c.fillStyle = '#111111';
    c.font = 'bold 20px Arial';
    c.fillText('सावधान', w / 2, 110);
  });
  const dangerPlateMat = new THREE.MeshBasicMaterial({ map: dangerPlateTex });

  const portalColumns = new THREE.InstancedMesh(new THREE.BoxGeometry(0.28, 7.8, 0.28), galvSteelMat, mastCount * 2);
  const portalFoundations = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.38, 0.42, 0.85, 12), concreteFoundationMat, mastCount * 2);
  const portalBooms = new THREE.InstancedMesh(new THREE.BoxGeometry(12.0, 0.40, 0.32), galvSteelMat, mastCount);
  const dangerPlates = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.42, 0.22), dangerPlateMat, mastCount * 2);

  const bracketTubes = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.032, 0.032, 1.8, 8), galvSteelMat, mastCount * 2);
  const registerArms = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.022, 0.022, 1.1, 8), galvSteelMat, mastCount * 2);
  const insulatorsMesh = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.075, 0.075, 0.48, 10), oheInsulatorMat, mastCount * 4);

  portalColumns.castShadow = true;
  portalColumns.receiveShadow = true;
  portalBooms.castShadow = true;

  let colIdx = 0;
  let cantIdx = 0;
  let insIdx = 0;

  const leftColX = -3.2;
  const rightColX = 8.5;
  const boomCenterX = (leftColX + rightColX) / 2; // 2.65m

  for (let i = 0; i < mastCount; i++) {
    const z = startZ + i * mastSpacing;
    const pt = getTrackCurve(z);
    const nx = Math.cos(pt.yaw);
    const nz = -Math.sin(pt.yaw);

    // 1. Left & Right Vertical Columns & Foundations
    [leftColX, rightColX].forEach((colOffset, side) => {
      const cx = pt.x + colOffset * nx;
      const cz = z + colOffset * nz;

      // Foundation
      dummy.position.set(cx, 0.40, cz);
      dummy.scale.set(1, 1, 1);
      dummy.rotation.set(0, pt.yaw, 0);
      dummy.updateMatrix();
      portalFoundations.setMatrixAt(colIdx, dummy.matrix);

      // Steel Column
      dummy.position.set(cx, 4.30, cz);
      dummy.updateMatrix();
      portalColumns.setMatrixAt(colIdx, dummy.matrix);

      // Danger Plate
      dummy.position.set(cx + (side === 0 ? 0.15 : -0.15) * nx, 2.4, cz + (side === 0 ? 0.15 : -0.15) * nz);
      dummy.rotation.set(0, pt.yaw + (side === 0 ? Math.PI / 2 : -Math.PI / 2), 0);
      dummy.updateMatrix();
      dangerPlates.setMatrixAt(colIdx, dummy.matrix);

      colIdx++;
    });

    // 2. Horizontal Portal Lattice Truss Boom across both tracks
    const bx = pt.x + boomCenterX * nx;
    const bz = z + boomCenterX * nz;
    dummy.position.set(bx, 7.8, bz);
    dummy.rotation.set(0, pt.yaw, 0);
    dummy.updateMatrix();
    portalBooms.setMatrixAt(i, dummy.matrix);

    // 3. Cantilevers for Track 1 (x = 0) and Track 2 (x = 5.30)
    [track1X, track2X].forEach(tx => {
      const kx = pt.x + tx * nx;
      const kz = z + tx * nz;

      // Top Insulator (vertical standoff beneath boom)
      dummy.position.set(kx, 7.45, kz);
      dummy.rotation.set(0, pt.yaw, 0);
      dummy.updateMatrix();
      insulatorsMesh.setMatrixAt(insIdx++, dummy.matrix);

      // Main Vertical Drop Bracket Tube
      dummy.position.set(kx, 6.70, kz);
      dummy.rotation.set(0, pt.yaw, 0);
      dummy.updateMatrix();
      bracketTubes.setMatrixAt(cantIdx, dummy.matrix);

      // Bottom Insulator & Register Arm to contact wire (Y = 6.0m)
      dummy.position.set(kx, 6.25, kz);
      dummy.rotation.set(0, pt.yaw, Math.PI / 2);
      dummy.updateMatrix();
      insulatorsMesh.setMatrixAt(insIdx++, dummy.matrix);

      dummy.position.set(kx + 0.12 * nx, 6.12, kz + 0.12 * nz);
      dummy.rotation.set(0, pt.yaw, -0.45);
      dummy.updateMatrix();
      registerArms.setMatrixAt(cantIdx, dummy.matrix);

      cantIdx++;
    });
  }

  portalColumns.instanceMatrix.needsUpdate = true;
  portalFoundations.instanceMatrix.needsUpdate = true;
  portalBooms.instanceMatrix.needsUpdate = true;
  dangerPlates.instanceMatrix.needsUpdate = true;
  bracketTubes.instanceMatrix.needsUpdate = true;
  registerArms.instanceMatrix.needsUpdate = true;
  insulatorsMesh.instanceMatrix.needsUpdate = true;

  trackGroup.add(
    portalColumns,
    portalFoundations,
    portalBooms,
    dangerPlates,
    bracketTubes,
    registerArms,
    insulatorsMesh
  );

  // ==========================================
  // 6. CATENARY, CONTACT & DROPPER WIRES (BOTH TRACKS)
  // ==========================================
  const wireMatCatenary = new THREE.LineBasicMaterial({ color: 0x5a554e, linewidth: 2 });
  const wireMatContact = new THREE.LineBasicMaterial({ color: 0x2e2925, linewidth: 2 });

  const wireStep = 4.0;
  const wireSlices = Math.ceil(trackLength / wireStep);

  const catPts1: THREE.Vector3[] = [];
  const conPts1: THREE.Vector3[] = [];
  const catPts2: THREE.Vector3[] = [];
  const conPts2: THREE.Vector3[] = [];
  const feederPts: THREE.Vector3[] = [];

  for (let i = 0; i <= wireSlices; i++) {
    const z = Math.min(startZ + i * wireStep, endZ);
    const pt = getTrackCurve(z);
    const nx = Math.cos(pt.yaw);
    const nz = -Math.sin(pt.yaw);

    // Track 1
    const t1x = pt.x + track1X * nx;
    const t1z = z + track1X * nz;
    catPts1.push(new THREE.Vector3(t1x, catenaryWireY, t1z));
    conPts1.push(new THREE.Vector3(t1x, contactWireY, t1z));

    // Track 2
    const t2x = pt.x + track2X * nx;
    const t2z = z + track2X * nz;
    catPts2.push(new THREE.Vector3(t2x, catenaryWireY, t2z));
    conPts2.push(new THREE.Vector3(t2x, contactWireY, t2z));

    // Feeder along outer masts
    const f1x = pt.x + leftColX * nx;
    const f1z = z + leftColX * nz;
    const f2x = pt.x + rightColX * nx;
    const f2z = z + rightColX * nz;
    if (i % 2 === 0) {
      feederPts.push(new THREE.Vector3(f1x, 8.3, f1z));
      feederPts.push(new THREE.Vector3(f2x, 8.3, f2z));
    }
  }

  trackGroup.add(
    new THREE.Line(new THREE.BufferGeometry().setFromPoints(catPts1), wireMatCatenary),
    new THREE.Line(new THREE.BufferGeometry().setFromPoints(conPts1), wireMatContact),
    new THREE.Line(new THREE.BufferGeometry().setFromPoints(catPts2), wireMatCatenary),
    new THREE.Line(new THREE.BufferGeometry().setFromPoints(conPts2), wireMatContact)
  );

  // Vertical Droppers every 8.0 meters over BOTH tracks
  const dropperSpacing = 8.0;
  const dropperCount = Math.floor(trackLength / dropperSpacing);
  const dropperPoints: THREE.Vector3[] = [];

  for (let i = 0; i < dropperCount; i++) {
    const z = startZ + i * dropperSpacing;
    const pt = getTrackCurve(z);
    const nx = Math.cos(pt.yaw);
    const nz = -Math.sin(pt.yaw);

    const t1x = pt.x + track1X * nx;
    const t1z = z + track1X * nz;
    dropperPoints.push(new THREE.Vector3(t1x, catenaryWireY, t1z));
    dropperPoints.push(new THREE.Vector3(t1x, contactWireY, t1z));

    const t2x = pt.x + track2X * nx;
    const t2z = z + track2X * nz;
    dropperPoints.push(new THREE.Vector3(t2x, catenaryWireY, t2z));
    dropperPoints.push(new THREE.Vector3(t2x, contactWireY, t2z));
  }

  const dropperGeo = new THREE.BufferGeometry().setFromPoints(dropperPoints);
  const dropperLines = new THREE.LineSegments(dropperGeo, new THREE.LineBasicMaterial({ color: 0x48423c }));
  trackGroup.add(dropperLines);

  // ==========================================
  // 7. AUTO-TENSIONING DEVICES (ATD PULLEY COUNTERWEIGHTS)
  // ==========================================
  const atdLocations = [600, 1800, 3000, 4200, 5400, 6800, 8000];
  atdLocations.forEach(z => {
    const pt = getTrackCurve(z);
    const nx = Math.cos(pt.yaw);
    const nz = -Math.sin(pt.yaw);

    [-3.5, 8.8].forEach(atdOffset => {
      const atdGroup = new THREE.Group();
      atdGroup.position.set(pt.x + atdOffset * nx, 0, z + atdOffset * nz);
      atdGroup.rotation.y = pt.yaw;

      const guideRods = new THREE.Mesh(new THREE.BoxGeometry(0.45, 5.2, 0.45), galvSteelMat);
      guideRods.position.set(0, 3.2, 0);

      const weightStack = new THREE.Mesh(
        new THREE.CylinderGeometry(0.22, 0.22, 1.8, 14),
        createMaterial(0x1f1f1f, { roughness: 0.8 })
      );
      weightStack.position.set(0, 2.1, 0);

      const pulleyWheel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.18, 0.08, 16),
        createMaterial(0x3a3f45, { metalness: 0.9 })
      );
      pulleyWheel.rotation.x = Math.PI / 2;
      pulleyWheel.position.set(0, 5.4, 0);

      atdGroup.add(guideRods, weightStack, pulleyWheel);
      trackGroup.add(atdGroup);
    });
  });

  scene.add(trackGroup);
  return trackGroup;
}
