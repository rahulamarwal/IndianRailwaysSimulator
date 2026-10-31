import * as THREE from 'three';
import { TrackConfig } from './types';
import { RendererContext } from './renderer';

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
      const x0 = (centerNormX - widthNorm / 2) * w;
      const x1 = (centerNormX + widthNorm / 2) * w;
      const oilGrad = c.createLinearGradient(x0, 0, x1, 0);
      oilGrad.addColorStop(0.0, 'rgba(25, 22, 18, 0)');
      oilGrad.addColorStop(0.2, 'rgba(28, 24, 20, 0.55)');
      oilGrad.addColorStop(0.5, 'rgba(18, 15, 12, 0.78)');
      oilGrad.addColorStop(0.8, 'rgba(28, 24, 20, 0.55)');
      oilGrad.addColorStop(1.0, 'rgba(25, 22, 18, 0)');
      c.fillStyle = oilGrad;
      c.fillRect(x0, 0, x1 - x0, h);
    };

    // Oil path for Track 1 (left side of double ballast) & Track 2 (right side)
    paintOilPath(0.28, 0.22);
    paintOilPath(0.72, 0.22);
  });
  ballastTexture.wrapS = THREE.RepeatWrapping;
  ballastTexture.wrapT = THREE.RepeatWrapping;
  ballastTexture.repeat.set(1, Math.floor(trackLength / 12));

  // B. Semi-Urban / Industrial Ground Soil & Trackside Berm Texture
  const groundTexture = createCanvasTexture(1024, 1024, (c, w, h) => {
    // Semi-arid Deccan dry grass and murrum soil
    c.fillStyle = '#6c7255';
    c.fillRect(0, 0, w, h);

    // Industrial gravel and soil patches
    for (let i = 0; i < 400; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const rad = 20 + Math.random() * 90;
      const grad = c.createRadialGradient(x, y, 5, x, y, rad);
      grad.addColorStop(0.0, 'rgba(128, 112, 88, 0.5)');
      grad.addColorStop(1.0, 'rgba(108, 114, 85, 0)');
      c.fillStyle = grad;
      c.beginPath();
      c.arc(x, y, rad, 0, Math.PI * 2);
      c.fill();
    }

    // Organic granular speckle
    for (let i = 0; i < 35000; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const dark = 40 + Math.floor(Math.random() * 45);
      c.fillStyle = `rgba(${dark + 20}, ${dark + 30}, ${dark}, 0.3)`;
      c.fillRect(x, y, 2, 2);
    }
  });
  groundTexture.wrapS = THREE.RepeatWrapping;
  groundTexture.wrapT = THREE.RepeatWrapping;
  groundTexture.repeat.set(32, Math.floor(trackLength / 35));

  // C. Monoblock Pre-Stressed Concrete (PSC) Sleeper Texture (RDSO-T2496)
  const sleeperTexture = createCanvasTexture(256, 128, (c, w, h) => {
    c.fillStyle = '#96928b';
    c.fillRect(0, 0, w, h);

    for (let i = 0; i < 3000; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const v = 110 + Math.floor(Math.random() * 60);
      c.fillStyle = `rgb(${v}, ${v - 3}, ${v - 8})`;
      c.fillRect(x, y, 2, 2);
    }

    // Grooved rubber rail seat pads at rail head seats
    c.fillStyle = '#1e1e1e';
    c.fillRect(w * 0.13, 0, w * 0.15, h);
    c.fillRect(w * 0.72, 0, w * 0.15, h);

    // Red Pandrol ERC (Elastic Rail Clip) representations
    c.fillStyle = '#c53030';
    c.fillRect(w * 0.08, h * 0.15, w * 0.05, h * 0.7);
    c.fillRect(w * 0.28, h * 0.15, w * 0.05, h * 0.7);
    c.fillRect(w * 0.67, h * 0.15, w * 0.05, h * 0.7);
    c.fillRect(w * 0.87, h * 0.15, w * 0.05, h * 0.7);

    // RDSO identification markings embossed on concrete
    c.fillStyle = '#635f58';
    c.font = 'bold 14px Arial';
    c.textAlign = 'center';
    c.fillText('RDSO-T2496', w / 2, h / 2 + 5);
  });

  // ==========================================
  // 2. DOUBLE TRACK PERMANENT WAY (BALLAST PRISM)
  // ==========================================

  // Wide ground plane
  const groundGeo = new THREE.PlaneGeometry(1600, trackLength);
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

  // Ballast Sub-base Embankment (spans across both tracks, width 18m)
  const subgradeGeo = new THREE.BoxGeometry(18, 0.12, trackLength);
  const subgradeMat = createMaterial(0x6e6556, { roughness: 0.95 });
  const subgrade = new THREE.Mesh(subgradeGeo, subgradeMat);
  subgrade.position.set(doubleTrackCenterX, 0.06, centerZ);
  subgrade.receiveShadow = true;
  trackGroup.add(subgrade);

  // Ballast Top Shoulder Prism (spans both Track 1 & Track 2, width 12.8m)
  const ballastGeo = new THREE.BoxGeometry(12.8, 0.32, trackLength);
  const ballastMat = new THREE.MeshStandardMaterial({
    roughness: 0.92,
    metalness: 0.08,
    map: ballastTexture
  });
  const ballast = new THREE.Mesh(ballastGeo, ballastMat);
  ballast.position.set(doubleTrackCenterX, 0.22, centerZ);
  ballast.receiveShadow = true;
  trackGroup.add(ballast);

  // ==========================================
  // 3. BROAD GAUGE RAILS (TRACK 1 & TRACK 2)
  // ==========================================
  const railHeadMat = new THREE.MeshStandardMaterial({
    color: 0xc8d0d8,
    metalness: 0.96,
    roughness: 0.12
  });
  const railWebMat = createMaterial(0x524337, { metalness: 0.65, roughness: 0.6 });

  const buildRail = (xPos: number) => {
    // Rail Head (UIC 60)
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.05, trackLength), railHeadMat);
    head.position.set(xPos, 0.54, centerZ);
    head.castShadow = true;
    head.receiveShadow = true;
    trackGroup.add(head);

    // Rail Web & Base Flange
    const web = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.13, trackLength), railWebMat);
    web.position.set(xPos, 0.45, centerZ);
    web.castShadow = true;
    trackGroup.add(web);
  };

  // Track 1 (Down Line): x = ±0.838m
  buildRail(track1X - halfGauge);
  buildRail(track1X + halfGauge);

  // Track 2 (Up Line): x = 5.30 ± 0.838m
  buildRail(track2X - halfGauge);
  buildRail(track2X + halfGauge);

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

    // Track 1 Sleeper (Down Line)
    dummy.position.set(track1X, 0.37, z);
    dummy.scale.set(1, 1, 1);
    dummy.rotation.set(0, 0, 0);
    dummy.updateMatrix();
    sleeperInstanced.setMatrixAt(slpIdx++, dummy.matrix);

    // Track 2 Sleeper (Up Line)
    dummy.position.set(track2X, 0.37, z);
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

  // Double-track portal gantry components:
  // Two vertical columns: Left at x = -3.2m, Right at x = +8.5m
  // Spanning horizontal lattice truss boom: length = 11.7m at y = 7.6m
  const portalColumns = new THREE.InstancedMesh(new THREE.BoxGeometry(0.28, 7.8, 0.28), galvSteelMat, mastCount * 2);
  const portalFoundations = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.38, 0.42, 0.85, 12), concreteFoundationMat, mastCount * 2);
  const portalBooms = new THREE.InstancedMesh(new THREE.BoxGeometry(12.0, 0.40, 0.32), galvSteelMat, mastCount);
  const dangerPlates = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.42, 0.22), dangerPlateMat, mastCount * 2);

  // Dropper cantilevers suspended from the portal boom over both tracks
  // 2 sets of cantilevers per gantry (Track 1 & Track 2)
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

    // 1. Left & Right Vertical Columns & Foundations
    [leftColX, rightColX].forEach((colX, side) => {
      // Foundation
      dummy.position.set(colX, 0.40, z);
      dummy.scale.set(1, 1, 1);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      portalFoundations.setMatrixAt(colIdx, dummy.matrix);

      // Steel Column
      dummy.position.set(colX, 4.30, z);
      dummy.updateMatrix();
      portalColumns.setMatrixAt(colIdx, dummy.matrix);

      // Danger Plate
      dummy.position.set(colX + (side === 0 ? 0.15 : -0.15), 2.4, z);
      dummy.rotation.set(0, side === 0 ? Math.PI / 2 : -Math.PI / 2, 0);
      dummy.updateMatrix();
      dangerPlates.setMatrixAt(colIdx, dummy.matrix);

      colIdx++;
    });

    // 2. Horizontal Portal Lattice Truss Boom across both tracks
    dummy.position.set(boomCenterX, 7.8, z);
    dummy.rotation.set(0, 0, 0);
    dummy.updateMatrix();
    portalBooms.setMatrixAt(i, dummy.matrix);

    // 3. Cantilevers for Track 1 (x = 0) and Track 2 (x = 5.30)
    [track1X, track2X].forEach(tx => {
      // Top Insulator (vertical standoff beneath boom)
      dummy.position.set(tx, 7.45, z);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      insulatorsMesh.setMatrixAt(insIdx++, dummy.matrix);

      // Main Vertical Drop Bracket Tube
      dummy.position.set(tx, 6.70, z);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      bracketTubes.setMatrixAt(cantIdx, dummy.matrix);

      // Bottom Insulator & Register Arm to contact wire (Y = 6.0m)
      dummy.position.set(tx, 6.25, z);
      dummy.rotation.set(0, 0, Math.PI / 2);
      dummy.updateMatrix();
      insulatorsMesh.setMatrixAt(insIdx++, dummy.matrix);

      dummy.position.set(tx + 0.12, 6.12, z);
      dummy.rotation.set(0, 0, -0.45);
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

  // Track 1 Wires (Down Line)
  const catGeo1 = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(track1X, catenaryWireY, startZ),
    new THREE.Vector3(track1X, catenaryWireY, endZ)
  ]);
  const conGeo1 = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(track1X, contactWireY, startZ),
    new THREE.Vector3(track1X, contactWireY, endZ)
  ]);
  trackGroup.add(new THREE.Line(catGeo1, wireMatCatenary), new THREE.Line(conGeo1, wireMatContact));

  // Track 2 Wires (Up Line)
  const catGeo2 = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(track2X, catenaryWireY, startZ),
    new THREE.Vector3(track2X, catenaryWireY, endZ)
  ]);
  const conGeo2 = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(track2X, contactWireY, startZ),
    new THREE.Vector3(track2X, contactWireY, endZ)
  ]);
  trackGroup.add(new THREE.Line(catGeo2, wireMatCatenary), new THREE.Line(conGeo2, wireMatContact));

  // Top Aerial Feeder Wire (along outer portal mast tops)
  const feederGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(leftColX, 8.3, startZ),
    new THREE.Vector3(leftColX, 8.3, endZ),
    new THREE.Vector3(rightColX, 8.3, startZ),
    new THREE.Vector3(rightColX, 8.3, endZ)
  ]);
  trackGroup.add(new THREE.LineSegments(feederGeo, new THREE.LineBasicMaterial({ color: 0x6e757c })));

  // Vertical Droppers every 8.0 meters over BOTH tracks
  const dropperSpacing = 8.0;
  const dropperCount = Math.floor(trackLength / dropperSpacing);
  const dropperPoints: THREE.Vector3[] = [];

  for (let i = 0; i < dropperCount; i++) {
    const z = startZ + i * dropperSpacing;
    // Track 1 dropper
    dropperPoints.push(new THREE.Vector3(track1X, catenaryWireY, z));
    dropperPoints.push(new THREE.Vector3(track1X, contactWireY, z));
    // Track 2 dropper
    dropperPoints.push(new THREE.Vector3(track2X, catenaryWireY, z));
    dropperPoints.push(new THREE.Vector3(track2X, contactWireY, z));
  }

  const dropperGeo = new THREE.BufferGeometry().setFromPoints(dropperPoints);
  const dropperLines = new THREE.LineSegments(dropperGeo, new THREE.LineBasicMaterial({ color: 0x48423c }));
  trackGroup.add(dropperLines);

  // ==========================================
  // 7. AUTO-TENSIONING DEVICES (ATD PULLEY COUNTERWEIGHTS)
  // ==========================================
  const atdLocations = [600, 1800, 3000, 4200, 5400];
  atdLocations.forEach(z => {
    [-3.5, 8.8].forEach(atdX => {
      const atdGroup = new THREE.Group();
      atdGroup.position.set(atdX, 0, z);

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
