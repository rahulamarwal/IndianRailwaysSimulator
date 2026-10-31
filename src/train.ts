import * as THREE from 'three';
import { RendererContext } from './renderer';
import { TrainConfig, TrainState, CameraMode } from './types';

export interface TrainAssembly {
  root: THREE.Group;
  loco: THREE.Group;
  coaches: THREE.Group[];
  cabInterior: THREE.Group;
  setPositionZ: (z: number) => void;
  setCameraMode: (mode: CameraMode) => void;
  updateCabInstruments: (state: TrainState, speedKmh: number) => void;
}

export function buildTrain(ctx: RendererContext, config: TrainConfig): TrainAssembly {
  const root = new THREE.Group();
  const { scene, createMaterial, createCanvasTexture } = ctx;

  // Helper for passenger coaches
  const createCoach = (len: number, h: number, zOffset: number): THREE.Group => {
    const coachGroup = new THREE.Group();

    const sideTexture = createCanvasTexture(512, 128, (c, w, hh) => {
      // Classic Indian Railways ICF dark blue livery
      c.fillStyle = '#2255a4';
      c.fillRect(0, 0, w, hh);

      // White livery racing stripe
      c.fillStyle = '#ffffff';
      c.fillRect(0, hh * 0.72, w, 10);

      // Passenger coach windows
      c.fillStyle = '#14202e';
      for (let x = 14; x < w - 30; x += 62) {
        c.fillRect(x, 30, 40, 36);
      }
    });

    const sideMat = new THREE.MeshStandardMaterial({
      roughness: 0.6,
      metalness: 0.2,
      map: sideTexture
    });

    const bodyMat = createMaterial(0x2255a4, { roughness: 0.6, metalness: 0.2 });
    const roofMat = createMaterial(0x9a9a9a, { roughness: 0.7 });
    const underbodyMat = createMaterial(0x222222);

    const materials = [sideMat, sideMat, roofMat, underbodyMat, bodyMat, bodyMat];

    const coachMesh = new THREE.Mesh(new THREE.BoxGeometry(3.2, h, len), materials);
    coachMesh.position.set(0, 1.1 + h / 2, 0);
    coachMesh.castShadow = true;
    coachMesh.receiveShadow = true;
    coachGroup.add(coachMesh);

    // Bogies / Wheelsets
    const bogieMat = createMaterial(0x1c1c1c);
    [-1, 1].forEach(k => {
      const bogie = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.9, 3.6), bogieMat);
      bogie.position.set(0, 0.75, k * len * 0.32);
      bogie.castShadow = true;
      bogie.receiveShadow = true;
      coachGroup.add(bogie);
    });

    coachGroup.position.z = zOffset;
    root.add(coachGroup);
    return coachGroup;
  };

  // ==========================================
  // WAP-7 ELECTRIC LOCOMOTIVE
  // ==========================================
  const loco = new THREE.Group();
  loco.position.z = -10; // Nose is at z = 0 relative to root
  root.add(loco);

  const locoBodyMat = createMaterial(0x1e4a96, { roughness: 0.5, metalness: 0.25 });
  const creamMat = createMaterial(0xf3e6c4, { roughness: 0.5, metalness: 0.1 });
  const roofMat = createMaterial(0x9a9a9a, { roughness: 0.7 });
  const underbodyMat = createMaterial(0x222222);
  const darkSteelMat = createMaterial(0x2a2d32, { metalness: 0.7, roughness: 0.4 });
  const chromeMat = createMaterial(0xd8dde4, { metalness: 0.95, roughness: 0.15 });
  const brassMat = createMaterial(0xc99b38, { metalness: 0.9, roughness: 0.2 });
  const carbonMat = createMaterial(0x151515, { roughness: 0.9, metalness: 0.05 });

  // 1. Locomotive Machine Room Shell (from Z: -10 to +7)
  const machineRoomLength = 17.0;
  const machineRoomCenterZ = -1.5;

  const locoSideTex = createCanvasTexture(512, 128, (c, w, hh) => {
    c.fillStyle = '#1e4a96';
    c.fillRect(0, 0, w, hh);
    c.fillStyle = '#f3e6c4';
    c.fillRect(0, hh * 0.68, w, 14);
    c.fillStyle = '#111e30';
    for (let x = 60; x < w - 60; x += 55) {
      c.fillRect(x, 25, 36, 42);
    }
  });

  const locoSideMat = new THREE.MeshStandardMaterial({
    roughness: 0.5,
    metalness: 0.25,
    map: locoSideTex
  });

  const machineRoomMesh = new THREE.Mesh(
    new THREE.BoxGeometry(3.2, 3.6, machineRoomLength),
    [locoSideMat, locoSideMat, roofMat, underbodyMat, locoBodyMat, locoBodyMat]
  );
  machineRoomMesh.position.set(0, 1.1 + 3.6 / 2, machineRoomCenterZ);
  machineRoomMesh.castShadow = true;
  machineRoomMesh.receiveShadow = true;
  loco.add(machineRoomMesh);

  // 2. Cab 1 Structure (Z: 7.0 to 10.0)
  const cabRoof = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.2, 3.0), roofMat);
  cabRoof.position.set(0, 4.6, 8.5);
  cabRoof.castShadow = true;
  cabRoof.receiveShadow = true;
  loco.add(cabRoof);

  const cabSideL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.8, 3.0), locoBodyMat);
  cabSideL.position.set(-1.54, 3.7, 8.5);
  const cabSideR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.8, 3.0), locoBodyMat);
  cabSideR.position.set(1.54, 3.7, 8.5);
  loco.add(cabSideL, cabSideR);

  // Lower Front Nose (y = 1.1 to 3.3)
  const frontLowerNose = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.2, 0.2), locoBodyMat);
  frontLowerNose.position.set(0, 2.2, 10.0);
  frontLowerNose.castShadow = true;
  frontLowerNose.receiveShadow = true;
  const frontCreamStripe = new THREE.Mesh(new THREE.BoxGeometry(3.22, 0.25, 0.22), creamMat);
  frontCreamStripe.position.set(0, 2.65, 10.0);
  loco.add(frontLowerNose, frontCreamStripe);

  // Upper Front Brow (above windshield: y = 4.45 to 4.7)
  const frontUpperBrow = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.25, 0.2), locoBodyMat);
  frontUpperBrow.position.set(0, 4.58, 10.0);
  loco.add(frontUpperBrow);

  // Left & Right Front Corner Posts
  [-1.48, 1.48].forEach(x => {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.24, 1.15, 0.2), locoBodyMat);
    post.position.set(x, 3.9, 10.0);
    loco.add(post);
  });

  // Center Windshield Mullion
  const centerPillar = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.15, 0.22), locoBodyMat);
  centerPillar.position.set(0, 3.9, 10.01);
  loco.add(centerPillar);

  // Transparent Windshield Glass
  const windshieldGlass = new THREE.Mesh(
    new THREE.BoxGeometry(2.8, 1.15, 0.04),
    new THREE.MeshStandardMaterial({
      color: 0x9dcbe8,
      roughness: 0.1,
      metalness: 0.8,
      transparent: true,
      opacity: 0.2,
      depthWrite: false
    })
  );
  windshieldGlass.position.set(0, 3.9, 10.02);
  loco.add(windshieldGlass);

  // Headlights & Markers
  const headlightHousing = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.38, 0.12), createMaterial(0x222222));
  headlightHousing.position.set(0, 2.2, 10.12);
  const headlightBeam = new THREE.Mesh(
    new THREE.BoxGeometry(0.58, 0.28, 0.05),
    new THREE.MeshBasicMaterial({ color: 0xfff7d0 })
  );
  headlightBeam.position.set(0, 2.2, 10.18);
  loco.add(headlightHousing, headlightBeam);

  [-1.1, 1.1].forEach(x => {
    const marker = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 0.06, 12),
      new THREE.MeshBasicMaterial({ color: 0xff3333 })
    );
    marker.rotation.x = Math.PI / 2;
    marker.position.set(x, 2.2, 10.12);
    loco.add(marker);
  });

  // Cowcatcher & Buffers
  const cowcatcher = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.45, 0.25), createMaterial(0x111111));
  cowcatcher.position.set(0, 0.55, 10.15);
  loco.add(cowcatcher);

  const bufferMat = createMaterial(0x1f1f1f, { metalness: 0.8, roughness: 0.3 });
  [-0.95, 0.95].forEach(x => {
    const shank = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.5, 8), bufferMat);
    shank.rotation.x = Math.PI / 2;
    shank.position.set(x, 1.05, 10.25);
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.05, 14), bufferMat);
    plate.rotation.x = Math.PI / 2;
    plate.position.set(x, 1.05, 10.5);
    loco.add(shank, plate);
  });
  const cbc = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.6), bufferMat);
  cbc.position.set(0, 1.05, 10.35);
  loco.add(cbc);

  // Bogies
  [-6.2, 6.2].forEach(z => {
    const bogie = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.9, 4.6), createMaterial(0x1c1c1c));
    bogie.position.set(0, 0.75, z);
    loco.add(bogie);
  });

  // ==========================================
  // AUTHENTIC INDIAN RAILWAYS AM-12 PANTOGRAPH SYSTEM & ROOF EQUIPMENT
  // (RDSO / Stone India / Faiveley AM-12 Standard Specification)
  // ==========================================
  const roofGroup = new THREE.Group();
  roofGroup.position.set(0, 4.7, 0); // Locomotive roof height

  const copperMat = createMaterial(0xb87333, { metalness: 0.9, roughness: 0.2 }); // 25kV copper busbar
  const pantoInsulatorMat = createMaterial(0x8a452a, { roughness: 0.35, metalness: 0.1 }); // Terracotta ceramic
  const pantoSteelMat = createMaterial(0x525860, { metalness: 0.85, roughness: 0.25 });
  const pantoDarkMat = createMaterial(0x22262c, { metalness: 0.7, roughness: 0.4 });
  const hornWarningMat = createMaterial(0xd93829, { roughness: 0.4, metalness: 0.1 }); // Indian caution red horn tips

  // Helper to build an authentic RDSO AM-12 Pantograph assembly
  const buildAM12Panto = (zCenter: number, isRaised: boolean): THREE.Group => {
    const panto = new THREE.Group();
    panto.position.set(0, 0, zCenter);

    // 1. Four High-Voltage Porcelain Foot Insulators (RDSO footprint: 1160mm width x 807mm length)
    const insGeo = new THREE.CylinderGeometry(0.085, 0.085, 0.36, 12);
    [
      [-0.58, -0.42],
      [0.58, -0.42],
      [-0.58, 0.42],
      [0.58, 0.42]
    ].forEach(([x, z]) => {
      const ins = new THREE.Mesh(insGeo, pantoInsulatorMat);
      ins.position.set(x, 0.18, z);
      // Ribbed insulator discs
      [-0.08, 0, 0.08].forEach(dy => {
        const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.025, 12), pantoInsulatorMat);
        disc.position.set(x, 0.18 + dy, z);
        panto.add(disc);
      });
      panto.add(ins);
    });

    // 2. Base Frame & Mounting Channels
    const baseFrame = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.05, 1.1), pantoDarkMat);
    baseFrame.position.set(0, 0.37, 0);
    panto.add(baseFrame);

    // Horizontal Pneumatic Operating Servomotor Cylinder (center of base frame)
    const servomotor = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.82, 14), pantoDarkMat);
    servomotor.rotation.x = Math.PI / 2;
    servomotor.position.set(0, 0.48, 0);
    panto.add(servomotor);

    // Twin Main Balancing Tension Springs (along both sides of base)
    [-0.42, 0.42].forEach(x => {
      const spring = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.75, 8), pantoSteelMat);
      spring.rotation.x = Math.PI / 2;
      spring.position.set(x, 0.45, 0);
      panto.add(spring);
    });

    // Transverse Lower Pivot Torque Shaft
    const pivotShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.18, 10), pantoSteelMat);
    pivotShaft.rotation.z = Math.PI / 2;
    pivotShaft.position.set(0, 0.52, -0.38);
    panto.add(pivotShaft);

    if (isRaised) {
      // ----------------------------------------------------
      // RAISED PANTOGRAPH (AM-12 SINGLE-ARM GEOMETRY)
      // ----------------------------------------------------
      // Lower Articulation: Two diagonal tubular arms rising forward-upward to the elbow
      const lowerArmGroup = new THREE.Group();
      lowerArmGroup.position.set(0, 0.52, -0.38);

      [-0.32, 0.32].forEach(x => {
        const lowerTube = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.032, 1.55, 8), pantoSteelMat);
        lowerTube.position.set(x, 0.68, 0.35);
        lowerTube.rotation.x = 0.54;
        lowerArmGroup.add(lowerTube);
      });

      // Transverse Cross-Brace Tube
      const crossBrace = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.64, 8), pantoSteelMat);
      crossBrace.rotation.z = Math.PI / 2;
      crossBrace.position.set(0, 0.72, 0.37);
      lowerArmGroup.add(crossBrace);

      // Lower Push Rod (Operating Rod) running parallel
      const pushRod = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.5, 8), pantoSteelMat);
      pushRod.position.set(0, 0.62, 0.38);
      pushRod.rotation.x = 0.54;
      lowerArmGroup.add(pushRod);
      panto.add(lowerArmGroup);

      // Elbow Articulation (Knuckle Hinge)
      const elbowGroup = new THREE.Group();
      elbowGroup.position.set(0, 1.88, 0.32); // Knuckle position

      const elbowShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.052, 0.85, 12), pantoSteelMat);
      elbowShaft.rotation.z = Math.PI / 2;
      elbowGroup.add(elbowShaft);

      // Braided Copper Shunts (Grounding & current transfer jumpers across elbow)
      [-0.34, 0.34].forEach(x => {
        const shunt = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.015, 6, 12, Math.PI), copperMat);
        shunt.position.set(x, 0, 0);
        shunt.rotation.y = Math.PI / 2;
        elbowGroup.add(shunt);
      });

      // Upper Articulation Arm (Longitudinal Tube branching into top Y-fork)
      const upperApexTube = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.035, 1.48, 8), pantoSteelMat);
      upperApexTube.position.set(0, 0.65, -0.38);
      upperApexTube.rotation.x = -0.58;
      elbowGroup.add(upperApexTube);

      // Parallel Steady Tube (maintains bow head level at all heights)
      const steadyTube = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 1.46, 8), pantoSteelMat);
      steadyTube.position.set(0, 0.75, -0.38);
      steadyTube.rotation.x = -0.58;
      elbowGroup.add(steadyTube);

      // Upper Apex Y-Fork Cradle
      [-0.24, 0.24].forEach(x => {
        const forkTube = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.45, 8), pantoSteelMat);
        forkTube.position.set(x * 0.5, 1.32, -0.74);
        forkTube.rotation.z = x > 0 ? -0.35 : 0.35;
        elbowGroup.add(forkTube);
      });

      panto.add(elbowGroup);

      // ----------------------------------------------------
      // CURRENT COLLECTOR BOW ASSEMBLY (PANTO PAN HEAD)
      // (Reaches Y = 6.0m contact wire level)
      // ----------------------------------------------------
      const bowHead = new THREE.Group();
      bowHead.position.set(0, 3.25, -0.45); // Sits at Y=5.95 to 6.0m

      // Twin Plunger Suspension Spring Boxes
      [-0.28, 0.28].forEach(x => {
        const plungerBox = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.14, 10), pantoDarkMat);
        plungerBox.position.set(x, -0.06, 0);
        bowHead.add(plungerBox);
      });

      // Lightweight Bow Carrier Cradle
      const bowCradle = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.035, 0.2), pantoSteelMat);
      bowHead.add(bowCradle);

      // Dual Metallized Carbon Collector Strips (RDSO spec: 1030mm active contact zone)
      [-0.055, 0.055].forEach(z => {
        const carbonStrip = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.025, 0.038), carbonMat);
        carbonStrip.position.set(0, 0.028, z);
        bowHead.add(carbonStrip);
      });

      // Signature Indian Railways Downward-Curved Bow Horns
      // Beautiful sweeping downward & inward tubular steel horns with red caution tips
      [-1, 1].forEach(side => {
        const hornGroup = new THREE.Group();
        hornGroup.position.set(side * 1.02, 0, 0);

        // Upper outward arc
        const hornUpper = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.02, 0.22, 8), pantoSteelMat);
        hornUpper.position.set(side * 0.1, -0.02, 0);
        hornUpper.rotation.z = side * 0.45;
        hornGroup.add(hornUpper);

        // Sweeping downward curved horn elbow
        const hornDrop = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.016, 0.28, 8), pantoSteelMat);
        hornDrop.position.set(side * 0.22, -0.15, 0);
        hornDrop.rotation.z = side * 1.25;
        hornGroup.add(hornDrop);

        // High-visibility Indian caution red tip cap
        const hornTip = new THREE.Mesh(new THREE.SphereGeometry(0.028, 10, 8), hornWarningMat);
        hornTip.position.set(side * 0.26, -0.28, 0);
        hornGroup.add(hornTip);

        bowHead.add(hornGroup);
      });

      panto.add(bowHead);
    } else {
      // ----------------------------------------------------
      // FOLDED PANTOGRAPH (FRONT / CAB 1 PANTO ON RESTING STOPS)
      // ----------------------------------------------------
      // Rubber Resting Blocks on roof
      [-0.35, 0.35].forEach(x => {
        const stopBlock = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 0.14), createMaterial(0x111111));
        stopBlock.position.set(x, 0.42, 0.4);
        panto.add(stopBlock);
      });

      // Folded lower arms lying flat
      [-0.32, 0.32].forEach(x => {
        const foldedLower = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.2, 8), pantoSteelMat);
        foldedLower.position.set(x, 0.52, 0.15);
        foldedLower.rotation.x = Math.PI / 2 - 0.08;
        panto.add(foldedLower);
      });

      // Folded upper arms lying flat above lower arm
      const foldedUpper = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 1.15, 8), pantoSteelMat);
      foldedUpper.position.set(0, 0.62, 0.1);
      foldedUpper.rotation.x = Math.PI / 2 + 0.06;
      panto.add(foldedUpper);

      // Folded bow head resting on stops
      const foldedBow = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.035, 0.18), pantoSteelMat);
      foldedBow.position.set(0, 0.68, 0.4);
      panto.add(foldedBow);

      [-1, 1].forEach(side => {
        const hornTip = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 8), hornWarningMat);
        hornTip.position.set(side * 1.18, 0.58, 0.4);
        panto.add(hornTip);
      });
    }

    return panto;
  };

  // Raised Rear Pantograph (Panto 2 at Z = -5.8, touching 25kV OHE wire)
  const rearPanto = buildAM12Panto(-5.8, true);
  roofGroup.add(rearPanto);

  // Folded Front Pantograph (Panto 1 at Z = +5.8, locked down on roof stops)
  const frontPanto = buildAM12Panto(5.8, false);
  roofGroup.add(frontPanto);

  // ==========================================
  // 25 kV AC HIGH VOLTAGE ROOF BUSBAR & VCB (DJ)
  // ==========================================
  // Standoff support insulators along roof centerline
  const standoffPositions = [-4.6, -2.8, -1.2, 0.8, 2.4, 4.6];
  standoffPositions.forEach(z => {
    const standIns = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.28, 8), pantoInsulatorMat);
    standIns.position.set(0.18, 0.14, z);
    roofGroup.add(standIns);
  });

  // Rigid 25kV Copper Busbar Conductor running longitudinally between pantographs
  const busbarGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0.18, 0.3, -5.2),
    new THREE.Vector3(0.18, 0.3, -0.6),
    new THREE.Vector3(0.18, 0.3, 0.6),
    new THREE.Vector3(0.18, 0.3, 5.2)
  ]);
  const busbarLine = new THREE.Line(busbarGeo, new THREE.LineBasicMaterial({ color: 0xb87333, linewidth: 3 }));
  roofGroup.add(busbarLine);

  // Central Vacuum Circuit Breaker (VCB / "DJ") at Z = 0
  const vcbBox = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.35, 0.85), pantoDarkMat);
  vcbBox.position.set(-0.25, 0.24, 0);
  // Vacuum interrupter bottle
  const vcbBottle = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.42, 12), pantoInsulatorMat);
  vcbBottle.position.set(0.18, 0.35, 0);
  // Surge / Lightning Arrester stack
  const surgeArrester = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.48, 10), pantoInsulatorMat);
  surgeArrester.position.set(-0.25, 0.58, 0.3);

  roofGroup.add(vcbBox, vcbBottle, surgeArrester);
  loco.add(roofGroup);

  // ==========================================
  // HIGH-QUALITY 3D WAP-7 CABIN INTERIOR
  // ==========================================
  const cabInterior = new THREE.Group();
  loco.add(cabInterior);

  // Dedicated Interior Warm Lighting for Cockpit Ambiance
  const cabPointLight = new THREE.PointLight(0xfff3db, 1.5, 4.5);
  cabPointLight.position.set(0, 4.3, 8.6);
  cabInterior.add(cabPointLight);

  // Cab Floor
  const cabFloor = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.1, 3.0), createMaterial(0x181c20, { roughness: 0.9 }));
  cabFloor.position.set(0, 2.65, 8.5);
  cabInterior.add(cabFloor);

  // Rear Bulkhead with access door
  const rearBulkhead = new THREE.Mesh(new THREE.BoxGeometry(3.0, 2.0, 0.1), createMaterial(0x2f373e, { roughness: 0.8 }));
  rearBulkhead.position.set(0, 3.7, 7.0);
  const cabDoor = new THREE.Mesh(new THREE.BoxGeometry(0.75, 1.8, 0.04), createMaterial(0x242a30));
  cabDoor.position.set(0, 3.6, 7.06);
  cabInterior.add(rearBulkhead, cabDoor);

  // Ergonomic Curved Driver Console Desk (Classic Indian Railways slate green-grey)
  const deskBodyMat = createMaterial(0x1c2429, { roughness: 0.5, metalness: 0.25 });
  const deskPanelMat = createMaterial(0x141a1e, { roughness: 0.4, metalness: 0.4 });

  const desk = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.65, 1.3), deskBodyMat);
  desk.position.set(0, 3.05, 9.15);
  desk.rotation.x = 0.06;
  cabInterior.add(desk);

  // Driver Instrument Binnacle (Left side, directly in front of Loco Pilot: X = -0.72)
  const binnacle = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.48, 0.55), deskPanelMat);
  binnacle.position.set(-0.72, 3.48, 9.38);
  binnacle.rotation.x = -0.26;
  cabInterior.add(binnacle);

  // Assistant Loco Pilot Binnacle (Right side: X = +0.72)
  const alpBinnacle = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.38, 0.45), deskPanelMat);
  alpBinnacle.position.set(0.72, 3.42, 9.38);
  alpBinnacle.rotation.x = -0.26;
  cabInterior.add(alpBinnacle);

  // Overhead Switch Panel (Above front windshield)
  const overheadPanel = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.18, 0.4), deskPanelMat);
  overheadPanel.position.set(0, 4.45, 9.6);
  overheadPanel.rotation.x = 0.2;
  cabInterior.add(overheadPanel);

  // 1. High-Precision Analog Speedometer Dial Face (0 to 160 km/h)
  const speedoDialTexture = createCanvasTexture(512, 512, (c, w, h) => {
    c.fillStyle = '#0a0f16';
    c.beginPath();
    c.arc(w / 2, h / 2, 240, 0, Math.PI * 2);
    c.fill();

    // Metallic Bezel Outer Accent
    c.strokeStyle = '#c5a059';
    c.lineWidth = 14;
    c.stroke();

    c.strokeStyle = '#283646';
    c.lineWidth = 6;
    c.beginPath();
    c.arc(w / 2, h / 2, 224, 0, Math.PI * 2);
    c.stroke();

    // Caution/Overspeed Arcs (100 km/h amber, 120+ km/h red)
    const degToRad = (deg: number) => (deg * Math.PI) / 180;
    // Amber arc (100 to 120 km/h)
    c.strokeStyle = '#f59e0b';
    c.lineWidth = 12;
    c.beginPath();
    c.arc(w / 2, h / 2, 195, degToRad(180 - (100 / 160) * 260 + 50), degToRad(180 - (120 / 160) * 260 + 50), true);
    c.stroke();

    // Red danger arc (120 to 160 km/h)
    c.strokeStyle = '#ef4444';
    c.beginPath();
    c.arc(w / 2, h / 2, 195, degToRad(180 - (120 / 160) * 260 + 50), degToRad(180 - (160 / 160) * 260 + 50), true);
    c.stroke();

    // Tick Marks & Numbers
    c.fillStyle = '#ffffff';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.font = 'bold 36px Arial, sans-serif';

    for (let speed = 0; speed <= 160; speed += 20) {
      const angle = (220 - (speed / 160) * 260) * (Math.PI / 180);
      const rNum = 155;
      const x = w / 2 + Math.cos(angle) * rNum;
      const y = h / 2 - Math.sin(angle) * rNum;
      c.fillText(speed.toString(), x, y);

      const rIn = 195;
      const rOut = 220;
      c.strokeStyle = speed >= 120 ? '#ef4444' : speed >= 100 ? '#f59e0b' : '#ffffff';
      c.lineWidth = 6;
      c.beginPath();
      c.moveTo(w / 2 + Math.cos(angle) * rIn, h / 2 - Math.sin(angle) * rIn);
      c.lineTo(w / 2 + Math.cos(angle) * rOut, h / 2 - Math.sin(angle) * rOut);
      c.stroke();
    }

    // Minor 10 km/h ticks
    for (let speed = 10; speed < 160; speed += 20) {
      const angle = (220 - (speed / 160) * 260) * (Math.PI / 180);
      c.strokeStyle = '#94a3b8';
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(w / 2 + Math.cos(angle) * 205, h / 2 - Math.sin(angle) * 205);
      c.lineTo(w / 2 + Math.cos(angle) * 220, h / 2 - Math.sin(angle) * 220);
      c.stroke();
    }

    c.fillStyle = '#f5c518';
    c.font = 'bold 28px Arial';
    c.fillText('SPEED', w / 2, h / 2 + 60);
    c.fillStyle = '#94a3b8';
    c.font = 'bold 20px Arial';
    c.fillText('km/h', w / 2, h / 2 + 92);
    c.font = '16px Arial';
    c.fillText('WAP-7 / RDSO', w / 2, h / 2 + 118);
  });

  const speedoBezel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.18, 0.04, 32),
    chromeMat
  );
  speedoBezel.rotation.x = Math.PI / 2 - 0.26;
  speedoBezel.position.set(-0.96, 3.53, 9.56);

  const speedoDial = new THREE.Mesh(
    new THREE.CircleGeometry(0.165, 32),
    new THREE.MeshBasicMaterial({ map: speedoDialTexture })
  );
  speedoDial.position.set(-0.96, 3.53, 9.58);
  speedoDial.rotation.x = -0.26;
  cabInterior.add(speedoBezel, speedoDial);

  // Active 3D Speedometer Needle
  const speedoNeedleGroup = new THREE.Group();
  speedoNeedleGroup.position.set(-0.96, 3.53, 9.59);
  speedoNeedleGroup.rotation.x = -0.26;

  const needleBlade = new THREE.Mesh(
    new THREE.BoxGeometry(0.012, 0.13, 0.006),
    new THREE.MeshBasicMaterial({ color: 0xff2222 })
  );
  needleBlade.position.set(0, 0.055, 0);
  const needleCap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.024, 0.024, 0.012, 16),
    chromeMat
  );
  needleCap.rotation.x = Math.PI / 2;
  speedoNeedleGroup.add(needleBlade, needleCap);
  cabInterior.add(speedoNeedleGroup);

  // 2. Duplex Air Brake Gauge (BP 5.0 kg/cm² & FP 6.0 kg/cm²)
  const brakeDialTexture = createCanvasTexture(256, 256, (c, w, h) => {
    c.fillStyle = '#0a0f16';
    c.beginPath();
    c.arc(w / 2, h / 2, 120, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = '#c5a059';
    c.lineWidth = 8;
    c.stroke();

    c.fillStyle = '#ffffff';
    c.textAlign = 'center';
    c.font = 'bold 22px Arial';
    c.fillText('BP / FP', w / 2, h / 2 - 30);
    c.font = 'bold 16px Arial';
    c.fillStyle = '#4ade80';
    c.fillText('BP: 5.0 kg/cm²', w / 2, h / 2 + 15);
    c.fillStyle = '#38bdf8';
    c.fillText('FP: 6.0 kg/cm²', w / 2, h / 2 + 38);
    c.fillStyle = '#94a3b8';
    c.font = '12px Arial';
    c.fillText('BRAKE PIPE', w / 2, h / 2 + 65);
  });

  const brakeBezel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.125, 0.125, 0.03, 24),
    chromeMat
  );
  brakeBezel.rotation.x = Math.PI / 2 - 0.26;
  brakeBezel.position.set(-0.62, 3.53, 9.56);

  const brakeDial = new THREE.Mesh(
    new THREE.CircleGeometry(0.115, 24),
    new THREE.MeshBasicMaterial({ map: brakeDialTexture })
  );
  brakeDial.position.set(-0.62, 3.53, 9.58);
  brakeDial.rotation.x = -0.26;
  cabInterior.add(brakeBezel, brakeDial);

  // 3. Dynamic DDU (Driver Display Unit) TFT Monitor
  const dduCanvas = document.createElement('canvas');
  dduCanvas.width = 512;
  dduCanvas.height = 320;
  const dduCtx = dduCanvas.getContext('2d')!;
  const dduTexture = new THREE.CanvasTexture(dduCanvas);
  dduTexture.colorSpace = THREE.SRGBColorSpace;

  const dduBezel = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.28, 0.03), createMaterial(0x111111));
  dduBezel.position.set(-0.25, 3.48, 9.54);
  dduBezel.rotation.x = -0.26;

  const dduScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.40, 0.25),
    new THREE.MeshBasicMaterial({ map: dduTexture })
  );
  dduScreen.position.set(-0.25, 3.48, 9.56);
  dduScreen.rotation.x = -0.26;
  cabInterior.add(dduBezel, dduScreen);

  // 4. Physical Master Controller (Notch Quadrant & Chrome Handle)
  const quadrantPlate = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, 0.04, 0.28),
    createMaterial(0x0e1217, { metalness: 0.8, roughness: 0.3 })
  );
  quadrantPlate.position.set(-0.46, 3.26, 9.15);
  cabInterior.add(quadrantPlate);

  const throttleLeverGroup = new THREE.Group();
  throttleLeverGroup.position.set(-0.46, 3.28, 9.15);
  const leverShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.24, 8), chromeMat);
  leverShaft.position.set(0, 0.12, 0);
  const leverGrip = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.02, 0.09, 12), createMaterial(0x111111));
  leverGrip.position.set(0, 0.23, 0);
  throttleLeverGroup.add(leverShaft, leverGrip);
  cabInterior.add(throttleLeverGroup);

  // MPJ Reverser Lever Handle (Forward / Reverse)
  const reverserPlate = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.04, 0.22),
    createMaterial(0x181c22, { metalness: 0.8, roughness: 0.3 })
  );
  reverserPlate.position.set(-0.66, 3.26, 9.15);
  cabInterior.add(reverserPlate);

  const reverserLeverGroup = new THREE.Group();
  reverserLeverGroup.position.set(-0.66, 3.28, 9.15);
  const revShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.18, 8), chromeMat);
  revShaft.position.set(0, 0.09, 0);
  const revKnob = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.04, 0.055), createMaterial(0xf59e0b, { roughness: 0.3 }));
  revKnob.position.set(0, 0.17, 0);
  reverserLeverGroup.add(revShaft, revKnob);
  cabInterior.add(reverserLeverGroup);

  // 5. A-9 Automatic Train Brake Controller Stand
  const brakeStand = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.06, 0.22), brassMat);
  brakeStand.position.set(-0.22, 3.26, 9.15);
  cabInterior.add(brakeStand);

  const brakeValveGroup = new THREE.Group();
  brakeValveGroup.position.set(-0.22, 3.28, 9.15);
  const brakeShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.2, 8), chromeMat);
  brakeShaft.position.set(0, 0.1, 0);
  const brakeKnob = new THREE.Mesh(new THREE.SphereGeometry(0.038, 14, 10), createMaterial(0xd32f2f, { roughness: 0.3 }));
  brakeKnob.position.set(0, 0.19, 0);
  brakeValveGroup.add(brakeShaft, brakeKnob);
  cabInterior.add(brakeValveGroup);

  // 6. Emergency Mushroom Stop Button (Prominent red dome on yellow ring)
  const emgRing = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.016, 16), createMaterial(0xfacc15));
  emgRing.position.set(-0.84, 3.32, 9.18);
  const emgButton = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.04, 16), createMaterial(0xdc2626));
  emgButton.position.set(-0.84, 3.34, 9.18);
  cabInterior.add(emgRing, emgButton);

  // 7. Windshield Wipers with linkage
  [-0.72, 0.72].forEach(x => {
    const wiperMotor = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.05, 8), createMaterial(0x111111));
    wiperMotor.position.set(x, 3.42, 9.94);
    const wiperArm = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.52, 0.02), createMaterial(0x151515));
    wiperArm.rotation.z = -0.32;
    wiperArm.position.set(x + 0.08, 3.68, 9.95);
    cabInterior.add(wiperMotor, wiperArm);
  });

  // 8. Loco Pilot Ergonomic Driver Seat
  const seatMat = createMaterial(0x1f2429);
  const seatGroup = new THREE.Group();
  seatGroup.position.set(-0.72, 2.7, 7.85);

  const seatPedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.48, 8), darkSteelMat);
  seatPedestal.position.set(0, 0.24, 0);
  const seatCushion = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.14, 0.54), seatMat);
  seatCushion.position.set(0, 0.52, 0);
  const seatBackrest = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.65, 0.1), seatMat);
  seatBackrest.position.set(0, 0.88, -0.22);
  const headrest = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.18, 0.08), seatMat);
  headrest.position.set(0, 1.25, -0.22);
  seatGroup.add(seatPedestal, seatCushion, seatBackrest, headrest);
  cabInterior.add(seatGroup);

  // ==========================================
  // 8 ICF PASSENGER COACHES
  // ==========================================
  const coaches: THREE.Group[] = [];
  for (let i = 0; i < config.coaches; i++) {
    const coachZ = -32.5 - 24 * i;
    const coach = createCoach(23, 3.1, coachZ);
    coaches.push(coach);
  }

  scene.add(root);

  let dduFrame = 0;

  return {
    root,
    loco,
    coaches,
    cabInterior,
    setPositionZ: (z: number) => {
      root.position.z = z;
    },
    setCameraMode: (mode: CameraMode) => {
      if (mode === CameraMode.TRACK) {
        // Mode 0: Clean track view (unobstructed windscreen POV, hide loco body to prevent any clipping)
        loco.visible = false;
        cabInterior.visible = false;
      } else if (mode === CameraMode.CHASE) {
        // Mode 1: Exterior chase view (show exterior train, hide cab interior to save draw calls)
        loco.visible = true;
        cabInterior.visible = false;
      } else {
        // Mode 2: Interactive 3D Cab Cockpit view (show cockpit, instruments, dials)
        loco.visible = true;
        cabInterior.visible = true;
      }
    },
    updateCabInstruments: (state: TrainState, speedKmh: number) => {
      // 1. Rotate active analog speedometer needle
      const needleAngle = 2.4 - Math.min(speedKmh / 160, 1.1) * 4.55;
      speedoNeedleGroup.rotation.z = needleAngle;

      // 2. Rotate throttle lever handle based on notch
      throttleLeverGroup.rotation.x = (state.n / 8) * -0.55;

      // 3. Rotate reverser lever handle based on direction (forward tilted vs reverse tilted)
      reverserLeverGroup.rotation.x = state.dir === 1 ? -0.32 : 0.32;

      // 4. Rotate brake valve handle based on commanded brake
      brakeValveGroup.rotation.x = state.b * 0.65;

      // 5. Update DDU screen canvas
      dduFrame++;
      if (dduFrame % 3 === 0) {
        dduCtx.fillStyle = '#080d14';
        dduCtx.fillRect(0, 0, 512, 320);

        // Header bar
        dduCtx.fillStyle = '#142236';
        dduCtx.fillRect(0, 0, 512, 44);
        dduCtx.fillStyle = '#f5c518';
        dduCtx.font = 'bold 20px Arial';
        dduCtx.fillText('INDIAN RAILWAYS - WAP-7 PROPULSION (DDU)', 18, 30);

        // Digital Speed Box
        dduCtx.fillStyle = '#0f1b2b';
        dduCtx.fillRect(18, 56, 225, 125);
        dduCtx.fillStyle = '#94a3b8';
        dduCtx.font = '15px Arial';
        dduCtx.fillText('ACTUAL SPEED', 32, 84);
        dduCtx.fillStyle = speedKmh > 102 ? '#ef4444' : '#4ade80';
        dduCtx.font = 'bold 56px Arial';
        dduCtx.fillText(Math.round(speedKmh).toString(), 32, 150);
        dduCtx.font = 'bold 20px Arial';
        dduCtx.fillText('km/h', 145, 150);

        // Right Telemetry Box
        dduCtx.fillStyle = '#0f1b2b';
        dduCtx.fillRect(255, 56, 238, 125);
        dduCtx.font = 'bold 16px Arial';
        dduCtx.fillStyle = state.dir === 1 ? '#4ade80' : '#f59e0b';
        dduCtx.fillText(`REV: ${state.dir === 1 ? 'FORWARD' : 'REVERSE'}`, 270, 82);
        dduCtx.fillStyle = '#ffffff';
        dduCtx.fillText(`NOTCH: ${state.n} / 8`, 270, 107);
        dduCtx.fillText(`LINE VOLTS: 25.2 kV AC`, 270, 132);
        dduCtx.fillStyle = '#38bdf8';
        dduCtx.fillText(`BP: ${(5.0 - state.b * 1.6).toFixed(1)} kg/cm²`, 270, 157);

        // Tractive Effort / Dynamic Brake Bar
        dduCtx.fillStyle = '#0f1b2b';
        dduCtx.fillRect(18, 195, 475, 42);
        const tePercent = (state.n / 8) * (state.b > 0.15 ? 0 : 1);
        if (tePercent > 0) {
          dduCtx.fillStyle = '#38bdf8';
          dduCtx.fillRect(18, 195, 475 * tePercent, 42);
        } else if (state.b > 0) {
          dduCtx.fillStyle = '#ef4444';
          dduCtx.fillRect(18, 195, 475 * state.b, 42);
        }
        dduCtx.fillStyle = '#ffffff';
        dduCtx.font = 'bold 16px Arial';
        dduCtx.fillText(`TE / BE EFFORT: ${Math.round(tePercent * 322)} kN`, 32, 222);

        // Status Diagnostics Bar
        dduCtx.fillStyle = state.em ? '#b91c1c' : '#1a3352';
        dduCtx.fillRect(0, 252, 512, 68);
        dduCtx.fillStyle = '#ffffff';
        dduCtx.font = 'bold 18px Arial';
        const statusMsg = state.em
          ? 'EMERGENCY BRAKE ENGAGED - TRACTION INTERLOCK'
          : state.b > 0.05
          ? 'PNEUMATIC BRAKE APPLIED (GRADUATED RELEASE)'
          : 'TRACTION HEALTHY - ALL SYSTEMS NORMAL';
        dduCtx.fillText(statusMsg, 18, 292);

        dduTexture.needsUpdate = true;
      }
    }
  };
}
