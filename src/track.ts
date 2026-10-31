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

  // ==========================================
  // 1. PROCEDURAL ULTRA-REALISTIC TEXTURES
  // ==========================================

  // A. Granite Ballast Texture with Indian Railways Centerline Oil Drip Stains
  const ballastTexture = createCanvasTexture(1024, 1024, (c, w, h) => {
    // Base crushed granite background (multi-tonal dark stone)
    c.fillStyle = '#65615a';
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

    // Classic Indian Railways dark locomotive oil & grease drip path along the center of the track
    const oilGrad = c.createLinearGradient(w * 0.35, 0, w * 0.65, 0);
    oilGrad.addColorStop(0.0, 'rgba(25, 22, 18, 0)');
    oilGrad.addColorStop(0.2, 'rgba(28, 24, 20, 0.55)');
    oilGrad.addColorStop(0.5, 'rgba(18, 15, 12, 0.78)');
    oilGrad.addColorStop(0.8, 'rgba(28, 24, 20, 0.55)');
    oilGrad.addColorStop(1.0, 'rgba(25, 22, 18, 0)');
    c.fillStyle = oilGrad;
    c.fillRect(w * 0.32, 0, w * 0.36, h);
  });
  ballastTexture.wrapS = THREE.RepeatWrapping;
  ballastTexture.wrapT = THREE.RepeatWrapping;
  ballastTexture.repeat.set(1, Math.floor(trackLength / 12));

  // B. Deccan Countryside Red-Murrum Soil & Grass Texture
  const groundTexture = createCanvasTexture(1024, 1024, (c, w, h) => {
    c.fillStyle = '#617a42'; // Deccan monsoon grass
    c.fillRect(0, 0, w, h);

    // Red-brown murrum soil patches
    for (let i = 0; i < 350; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const rad = 25 + Math.random() * 85;
      const grad = c.createRadialGradient(x, y, 5, x, y, rad);
      grad.addColorStop(0.0, 'rgba(138, 92, 54, 0.45)');
      grad.addColorStop(1.0, 'rgba(97, 122, 66, 0)');
      c.fillStyle = grad;
      c.beginPath();
      c.arc(x, y, rad, 0, Math.PI * 2);
      c.fill();
    }

    // Fine organic terrain grain
    for (let i = 0; i < 30000; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const dark = 40 + Math.floor(Math.random() * 40);
      c.fillStyle = `rgba(${dark + 30}, ${dark + 50}, ${dark}, 0.25)`;
      c.fillRect(x, y, 2, 2);
    }
  });
  groundTexture.wrapS = THREE.RepeatWrapping;
  groundTexture.wrapT = THREE.RepeatWrapping;
  groundTexture.repeat.set(24, Math.floor(trackLength / 35));

  // C. Concrete Sleeper Texture with Rail Fastening Rubber Pads
  const sleeperTexture = createCanvasTexture(256, 128, (c, w, h) => {
    c.fillStyle = '#949089'; // Weathered PSC concrete
    c.fillRect(0, 0, w, h);

    // Weathered concrete noise
    for (let i = 0; i < 3000; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const v = 110 + Math.floor(Math.random() * 60);
      c.fillStyle = `rgb(${v}, ${v - 3}, ${v - 8})`;
      c.fillRect(x, y, 2, 2);
    }

    // Black rubber rail seat pads at gauge locations
    c.fillStyle = '#1e1e1e';
    c.fillRect(w * 0.14, 0, w * 0.14, h);
    c.fillRect(w * 0.72, 0, w * 0.14, h);

    // RDSO identification markings embossed on concrete
    c.fillStyle = '#635f58';
    c.font = 'bold 14px Arial';
    c.textAlign = 'center';
    c.fillText('RDSO-T2496', w / 2, h / 2 + 5);
  });

  // ==========================================
  // 2. PERMANENT WAY (BALLAST PRISM & GROUND)
  // ==========================================

  // Ground plane (Red soil + grass)
  const groundGeo = new THREE.PlaneGeometry(1200, trackLength);
  const groundMat = new THREE.MeshStandardMaterial({
    roughness: 0.95,
    metalness: 0.02,
    map: groundTexture
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, 0, centerZ);
  ground.receiveShadow = true;
  trackGroup.add(ground);

  // Ballast Sub-base Embankment
  const subgradeGeo = new THREE.BoxGeometry(14, 0.12, trackLength);
  const subgradeMat = createMaterial(0x6e6556, { roughness: 0.95 });
  const subgrade = new THREE.Mesh(subgradeGeo, subgradeMat);
  subgrade.position.set(0, 0.06, centerZ);
  subgrade.receiveShadow = true;
  trackGroup.add(subgrade);

  // Ballast Top Shoulder Prism (Crushed Granite with Oil Stains)
  const ballastGeo = new THREE.BoxGeometry(4.8, 0.32, trackLength);
  const ballastMat = new THREE.MeshStandardMaterial({
    roughness: 0.92,
    metalness: 0.08,
    map: ballastTexture
  });
  const ballast = new THREE.Mesh(ballastGeo, ballastMat);
  ballast.position.set(0, 0.22, centerZ);
  ballast.receiveShadow = true;
  trackGroup.add(ballast);

  // ==========================================
  // 3. BROAD GAUGE RAILS (1,676 mm GAUGE)
  // ==========================================
  // Mirror-polished rail head (high specular sun reflections)
  const railHeadMat = new THREE.MeshStandardMaterial({
    color: 0xc8d0d8,
    metalness: 0.96,
    roughness: 0.12
  });
  // Oxidized weathered rail web & foot
  const railWebMat = createMaterial(0x524337, { metalness: 0.65, roughness: 0.6 });

  const buildRail = (xPos: number) => {
    // Rail Head
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

  buildRail(-halfGauge);
  buildRail(halfGauge);

  // ==========================================
  // 4. INSTANCED PSC SLEEPERS WITH PANDROL CLIPS
  // ==========================================
  const sleeperCount = Math.floor(trackLength / sleeperSpacing);
  const sleeperGeo = new THREE.BoxGeometry(2.7, 0.18, 0.28);
  const sleeperMat = new THREE.MeshStandardMaterial({
    roughness: 0.88,
    metalness: 0.05,
    map: sleeperTexture
  });
  const sleeperInstanced = new THREE.InstancedMesh(sleeperGeo, sleeperMat, sleeperCount);
  sleeperInstanced.castShadow = true;
  sleeperInstanced.receiveShadow = true;

  // Red/Black Pandrol Elastic Rail Clips (ERC)
  const clipGeo = new THREE.BoxGeometry(0.06, 0.05, 0.1);
  const clipMat = createMaterial(0xc53030, { metalness: 0.7, roughness: 0.3 }); // Red Pandrol clip
  const clipCount = sleeperCount * 4;
  const clipsInstanced = new THREE.InstancedMesh(clipGeo, clipMat, clipCount);

  const dummy = new THREE.Object3D();
  let clipIdx = 0;

  for (let i = 0; i < sleeperCount; i++) {
    const z = startZ + i * sleeperSpacing;

    // Sleeper
    dummy.position.set(0, 0.37, z);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    sleeperInstanced.setMatrixAt(i, dummy.matrix);

    // 4 Pandrol ERC clips per sleeper (inner & outer of each rail)
    const clipPositions = [
      -halfGauge - 0.07,
      -halfGauge + 0.07,
      halfGauge - 0.07,
      halfGauge + 0.07
    ];
    clipPositions.forEach(x => {
      dummy.position.set(x, 0.44, z);
      dummy.updateMatrix();
      clipsInstanced.setMatrixAt(clipIdx++, dummy.matrix);
    });
  }

  sleeperInstanced.instanceMatrix.needsUpdate = true;
  clipsInstanced.instanceMatrix.needsUpdate = true;
  trackGroup.add(sleeperInstanced, clipsInstanced);

  // ==========================================
  // 5. AUTHENTIC INDIAN RAILWAYS 25 kV AC OHE MASTS
  // (RDSO Standard BFB / RSJ Mast + Triangulated Cantilever Assembly)
  // ==========================================
  const mastCount = Math.floor(trackLength / mastSpacing);

  // Materials
  const galvSteelMat = createMaterial(0x767e87, { metalness: 0.82, roughness: 0.3 });
  const concreteFoundationMat = createMaterial(0xa69f94, { roughness: 0.95 });
  const oheInsulatorMat = createMaterial(0x8a452a, { roughness: 0.35, metalness: 0.1 });

  // Mast Danger Warning Plate Texture (SAVDHAN / 25,000 VOLTS)
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

  // Instanced Meshes for Performance (steady 60fps)
  const mastColumns = new THREE.InstancedMesh(new THREE.BoxGeometry(0.24, 7.6, 0.24), galvSteelMat, mastCount);
  const mastFoundations = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.36, 0.4, 0.75, 12), concreteFoundationMat, mastCount);
  const dangerPlates = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.42, 0.22), dangerPlateMat, mastCount);

  // Cantilever assembly tubes (Stay Arm, Bracket Tube, Register Arm)
  const stayArms = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.024, 0.024, 3.1, 8), galvSteelMat, mastCount);
  const bracketTubes = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.034, 0.034, 3.0, 8), galvSteelMat, mastCount);
  const registerArms = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.022, 0.022, 1.1, 8), galvSteelMat, mastCount);
  const insulatorsMesh = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.075, 0.075, 0.48, 10), oheInsulatorMat, mastCount * 2);

  mastColumns.castShadow = true;
  mastColumns.receiveShadow = true;
  mastFoundations.receiveShadow = true;

  let insIdx = 0;

  for (let i = 0; i < mastCount; i++) {
    const z = startZ + i * mastSpacing;
    const mastX = -3.1; // Standard IR implantation distance ~3.0m from track center

    // 1. Concrete Foundation Pedestal (rising 0.45m above ballast)
    dummy.position.set(mastX, 0.35, z);
    dummy.scale.set(1, 1, 1);
    dummy.rotation.set(0, 0, 0);
    dummy.updateMatrix();
    mastFoundations.setMatrixAt(i, dummy.matrix);

    // 2. Steel BFB Mast Column (7.6m height)
    dummy.position.set(mastX, 4.15, z);
    dummy.updateMatrix();
    mastColumns.setMatrixAt(i, dummy.matrix);

    // 3. Danger / 25,000 Volts Warning Plate
    dummy.position.set(mastX + 0.13, 2.4, z);
    dummy.rotation.set(0, Math.PI / 2, 0);
    dummy.updateMatrix();
    dangerPlates.setMatrixAt(i, dummy.matrix);

    // 4. Top & Bottom Porcelain Bracket Insulators
    // Top Stay Arm Insulator (at Y = 7.15m)
    dummy.position.set(mastX + 0.28, 7.15, z);
    dummy.rotation.set(0, 0, Math.PI / 2);
    dummy.updateMatrix();
    insulatorsMesh.setMatrixAt(insIdx++, dummy.matrix);

    // Bottom Bracket Tube Insulator (at Y = 5.95m)
    dummy.position.set(mastX + 0.28, 5.95, z);
    dummy.updateMatrix();
    insulatorsMesh.setMatrixAt(insIdx++, dummy.matrix);

    // 5. Top Diagonal Stay Arm (extends downward-outward to catenary suspension point)
    // From (mastX + 0.5, 7.15) to (0, 6.70)
    dummy.position.set(-1.3, 6.92, z);
    dummy.rotation.set(0, 0, -1.42); // Angled down-outward
    dummy.updateMatrix();
    stayArms.setMatrixAt(i, dummy.matrix);

    // 6. Main Bracket Tube (extends upward-outward from bottom insulator to catenary)
    // From (mastX + 0.5, 5.95) to (0, 6.70)
    dummy.position.set(-1.3, 6.32, z);
    dummy.rotation.set(0, 0, -1.32); // Angled up-outward
    dummy.updateMatrix();
    bracketTubes.setMatrixAt(i, dummy.matrix);

    // 7. Register Arm (extends downward from bracket tube to contact wire at Y = 6.0m)
    dummy.position.set(-0.25, 6.25, z);
    dummy.rotation.set(0, 0, -0.65);
    dummy.updateMatrix();
    registerArms.setMatrixAt(i, dummy.matrix);
  }

  mastColumns.instanceMatrix.needsUpdate = true;
  mastFoundations.instanceMatrix.needsUpdate = true;
  dangerPlates.instanceMatrix.needsUpdate = true;
  stayArms.instanceMatrix.needsUpdate = true;
  bracketTubes.instanceMatrix.needsUpdate = true;
  registerArms.instanceMatrix.needsUpdate = true;
  insulatorsMesh.instanceMatrix.needsUpdate = true;

  trackGroup.add(
    mastColumns,
    mastFoundations,
    dangerPlates,
    stayArms,
    bracketTubes,
    registerArms,
    insulatorsMesh
  );

  // ==========================================
  // 6. CATENARY, CONTACT & VERTICAL DROPPER WIRES
  // ==========================================
  // Continuous Catenary / Messenger Wire (6.7m)
  const catenaryGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, catenaryWireY, startZ),
    new THREE.Vector3(0, catenaryWireY, endZ)
  ]);
  const catenaryLine = new THREE.Line(catenaryGeo, new THREE.LineBasicMaterial({ color: 0x5a554e, linewidth: 2 }));
  trackGroup.add(catenaryLine);

  // Continuous Contact Wire (6.0m)
  const contactGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, contactWireY, startZ),
    new THREE.Vector3(0, contactWireY, endZ)
  ]);
  const contactLine = new THREE.Line(contactGeo, new THREE.LineBasicMaterial({ color: 0x2e2925, linewidth: 2 }));
  trackGroup.add(contactLine);

  // Aerial Earth / Feeder Wire (Top of masts at 7.7m)
  const feederGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-3.1, 7.8, startZ),
    new THREE.Vector3(-3.1, 7.8, endZ)
  ]);
  const feederLine = new THREE.Line(feederGeo, new THREE.LineBasicMaterial({ color: 0x6e757c }));
  trackGroup.add(feederLine);

  // Vertical Droppers every 8.0 meters (Lattice between catenary and contact wires)
  const dropperSpacing = 8.0;
  const dropperCount = Math.floor(trackLength / dropperSpacing);
  const dropperPoints: THREE.Vector3[] = [];

  for (let i = 0; i < dropperCount; i++) {
    const z = startZ + i * dropperSpacing;
    dropperPoints.push(new THREE.Vector3(0, catenaryWireY, z));
    dropperPoints.push(new THREE.Vector3(0, contactWireY, z));
  }

  const dropperGeo = new THREE.BufferGeometry().setFromPoints(dropperPoints);
  const dropperLines = new THREE.LineSegments(dropperGeo, new THREE.LineBasicMaterial({ color: 0x48423c }));
  trackGroup.add(dropperLines);

  // ==========================================
  // 7. AUTO-TENSIONING DEVICE (ATD PULLEY COUNTERWEIGHTS)
  // (3-pulley counterweight tensioner on tension anchor masts)
  // ==========================================
  const atdLocations = [480, 1500, 2520]; // Anchor masts along route
  atdLocations.forEach(z => {
    const atdGroup = new THREE.Group();
    atdGroup.position.set(-3.45, 0, z);

    // Guide rod cage
    const guideRods = new THREE.Mesh(new THREE.BoxGeometry(0.45, 5.2, 0.45), galvSteelMat);
    guideRods.position.set(0, 3.2, 0);

    // Stack of Circular Cast-Iron Counterbalance Weights (400 kg)
    const weightStack = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.22, 1.8, 14),
      createMaterial(0x1f1f1f, { roughness: 0.8 })
    );
    weightStack.position.set(0, 2.1, 0);

    // Tensioner Pulleys (3-wheel pulley assembly at top)
    const pulleyWheel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.18, 0.08, 16),
      createMaterial(0x3a3f45, { metalness: 0.9 })
    );
    pulleyWheel.rotation.x = Math.PI / 2;
    pulleyWheel.position.set(0, 5.4, 0);

    atdGroup.add(guideRods, weightStack, pulleyWheel);
    trackGroup.add(atdGroup);
  });

  scene.add(trackGroup);
  return trackGroup;
}
