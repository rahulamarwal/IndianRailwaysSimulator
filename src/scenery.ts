import * as THREE from 'three';
import { RendererContext } from './renderer';
import { TrackConfig } from './types';

export function buildScenery(ctx: RendererContext, config: TrackConfig): THREE.Group {
  const sceneryGroup = new THREE.Group();
  const { scene, createMaterial } = ctx;
  const { startZ, endZ } = config;
  const trackLength = endZ - startZ;

  // Deterministic PRNG
  let seed = 19;
  const rnd = (): number => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };

  // ==========================================
  // 1. WESTERN GHATS (SAHYADRI BASALT PLATEAUS & RIDGES)
  // ==========================================
  // Deccan Traps feature distinct stepped basalt mesas with flat table tops and rocky cliffs
  const rockMat = createMaterial(0x3e3831, { roughness: 0.95, metalness: 0.05 });
  const plateauCapMat = createMaterial(0x426829, { roughness: 0.85, metalness: 0.05 });
  const farMountainMat = createMaterial(0x4a6566, { roughness: 0.9 }); // Atmospheric blue-green haze

  // Function to create a stepped basalt plateau / mesa
  const createBasaltMesa = (
    radiusBase: number,
    radiusTop: number,
    height: number,
    sides: number,
    x: number,
    z: number,
    isDistant = false
  ): THREE.Group => {
    const mesaGroup = new THREE.Group();

    // Rocky escarpment base
    const cliffGeo = new THREE.CylinderGeometry(radiusTop, radiusBase, height, sides);
    const cliff = new THREE.Mesh(cliffGeo, isDistant ? farMountainMat : rockMat);
    cliff.position.y = height / 2;
    mesaGroup.add(cliff);

    // Green grassy plateau top
    if (!isDistant) {
      const capGeo = new THREE.CylinderGeometry(radiusTop * 1.02, radiusTop, height * 0.12, sides);
      const cap = new THREE.Mesh(capGeo, plateauCapMat);
      cap.position.y = height + (height * 0.06);
      mesaGroup.add(cap);
    }

    mesaGroup.position.set(x, 0, z);
    return mesaGroup;
  };

  // Near-range Ghats ridges (both sides of track)
  for (let i = 0; i < 32; i++) {
    const side = i % 2 === 0 ? 1 : -1;
    const x = side * (240 + rnd() * 220);
    const z = startZ + (i / 32) * trackLength + (rnd() - 0.5) * 80;
    const baseR = 100 + rnd() * 90;
    const topR = baseR * (0.45 + rnd() * 0.25);
    const h = 75 + rnd() * 70;
    const sides = 7 + Math.floor(rnd() * 3);

    const mesa = createBasaltMesa(baseR, topR, h, sides, x, z, false);
    sceneryGroup.add(mesa);
  }

  // Distant grand Sahyadri peaks (creating layered depth)
  for (let i = 0; i < 20; i++) {
    const side = i % 2 === 0 ? 1 : -1;
    const x = side * (580 + rnd() * 450);
    const z = startZ + (i / 20) * trackLength + (rnd() - 0.5) * 160;
    const baseR = 260 + rnd() * 180;
    const topR = baseR * (0.3 + rnd() * 0.2);
    const h = 180 + rnd() * 140;

    const farMesa = createBasaltMesa(baseR, topR, h, 8, x, z, true);
    sceneryGroup.add(farMesa);
  }

  // ==========================================
  // 2. AUTHENTIC INDIAN TREES (BANYAN / NEEM & PALMS)
  // ==========================================

  // A. Broadleaf Canopy Trees (Neem / Banyan / Peepal)
  // Sculpted trunk + multiple organic foliage spheres
  const trunkMat = createMaterial(0x463728, { roughness: 0.9 });
  const foliageMat1 = createMaterial(0x2d5921, { roughness: 0.8 }); // Dark emerald
  const foliageMat2 = createMaterial(0x3e732c, { roughness: 0.8 }); // Lush monsoon green
  const foliageMat3 = createMaterial(0x528236, { roughness: 0.8 }); // Olive sunlit green

  const broadleafCount = 380;
  const broadleafTrunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.3, 0.45, 4.2, 7), trunkMat, broadleafCount);
  const broadleafCrowns1 = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(3.2, 1), foliageMat1, broadleafCount);
  const broadleafCrowns2 = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(2.6, 1), foliageMat2, broadleafCount);
  const broadleafCrowns3 = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(2.1, 1), foliageMat3, broadleafCount);

  const dummy = new THREE.Object3D();

  for (let i = 0; i < broadleafCount; i++) {
    const side = rnd() < 0.5 ? -1 : 1;
    const x = side * (12 + rnd() * 160);
    const z = startZ + rnd() * trackLength;
    const s = 0.75 + rnd() * 0.8;

    // Trunk
    dummy.position.set(x, 2.1 * s, z);
    dummy.scale.set(s, s, s);
    dummy.rotation.y = rnd() * Math.PI * 2;
    dummy.updateMatrix();
    broadleafTrunks.setMatrixAt(i, dummy.matrix);

    // Primary canopy lobe
    dummy.position.set(x, (4.2 + 1.8) * s, z);
    dummy.scale.set(s * 1.1, s * 0.85, s * 1.1);
    dummy.updateMatrix();
    broadleafCrowns1.setMatrixAt(i, dummy.matrix);

    // Secondary offset canopy lobe (giving natural spreading shape)
    dummy.position.set(x + (rnd() - 0.5) * 2.2 * s, (4.2 + 2.5) * s, z + (rnd() - 0.5) * 2.2 * s);
    dummy.scale.set(s * 0.9, s * 0.75, s * 0.9);
    dummy.updateMatrix();
    broadleafCrowns2.setMatrixAt(i, dummy.matrix);

    // Tertiary top crown lobe
    dummy.position.set(x + (rnd() - 0.5) * 1.5 * s, (4.2 + 3.2) * s, z + (rnd() - 0.5) * 1.5 * s);
    dummy.scale.set(s * 0.75, s * 0.65, s * 0.75);
    dummy.updateMatrix();
    broadleafCrowns3.setMatrixAt(i, dummy.matrix);
  }

  broadleafTrunks.instanceMatrix.needsUpdate = true;
  broadleafCrowns1.instanceMatrix.needsUpdate = true;
  broadleafCrowns2.instanceMatrix.needsUpdate = true;
  broadleafCrowns3.instanceMatrix.needsUpdate = true;

  broadleafTrunks.castShadow = true;
  broadleafCrowns1.castShadow = true;
  broadleafCrowns2.castShadow = true;
  broadleafCrowns3.castShadow = true;

  sceneryGroup.add(broadleafTrunks, broadleafCrowns1, broadleafCrowns2, broadleafCrowns3);

  // B. Tropical Western Ghats Coconut & Date Palms
  const palmCount = 180;
  const palmTrunkMat = createMaterial(0x5c4d3c, { roughness: 0.9 });
  const palmFrondMat = createMaterial(0x367825, { roughness: 0.7 });

  const palmTrunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.18, 0.28, 8.5, 6), palmTrunkMat, palmCount);
  const palmCrowns = new THREE.InstancedMesh(new THREE.ConeGeometry(3.5, 1.8, 6), palmFrondMat, palmCount);

  for (let i = 0; i < palmCount; i++) {
    const side = rnd() < 0.5 ? -1 : 1;
    const x = side * (18 + rnd() * 120);
    const z = startZ + rnd() * trackLength;
    const s = 0.8 + rnd() * 0.6;

    // Curved/slanted trunk
    dummy.position.set(x, 4.25 * s, z);
    dummy.scale.set(s, s, s);
    dummy.rotation.set((rnd() - 0.5) * 0.2, rnd() * Math.PI * 2, (rnd() - 0.5) * 0.2);
    dummy.updateMatrix();
    palmTrunks.setMatrixAt(i, dummy.matrix);

    // Radiating palm crown top
    dummy.position.set(x, 8.4 * s, z);
    dummy.scale.set(s * 1.2, -s * 0.8, s * 1.2); // Inverted cone looks like drooping palm fronds
    dummy.updateMatrix();
    palmCrowns.setMatrixAt(i, dummy.matrix);
  }

  palmTrunks.instanceMatrix.needsUpdate = true;
  palmCrowns.instanceMatrix.needsUpdate = true;
  palmTrunks.castShadow = true;
  palmCrowns.castShadow = true;
  sceneryGroup.add(palmTrunks, palmCrowns);

  // ==========================================
  // 3. TRACKSIDE INDIAN RAILWAYS INFRASTRUCTURE
  // ==========================================

  // A. Kilometer Stones (Standard white concrete posts every 200m)
  const kmPostCount = Math.floor(trackLength / 200);
  const kmPostMat = createMaterial(0xefefef, { roughness: 0.7 });
  const kmPostGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.9, 12);
  const kmPostGroup = new THREE.InstancedMesh(kmPostGeo, kmPostMat, kmPostCount);

  for (let i = 0; i < kmPostCount; i++) {
    const z = startZ + i * 200;
    dummy.position.set(2.4, 0.75, z);
    dummy.scale.set(1, 1, 1);
    dummy.rotation.set(0, 0, 0);
    dummy.updateMatrix();
    kmPostGroup.setMatrixAt(i, dummy.matrix);
  }
  kmPostGroup.instanceMatrix.needsUpdate = true;
  sceneryGroup.add(kmPostGroup);

  // B. Signal Equipment Relay Huts (Whitewashed / Ochre masonry with red tiled roofs)
  const hutWallMat = createMaterial(0xdfd8c4);
  const hutRoofMat = createMaterial(0xa04232); // Indian red clay roof tile
  const hutLocations = [1680, 2280, 2880]; // Beside MACLS signals

  hutLocations.forEach(z => {
    const hut = new THREE.Group();
    const hutBase = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.6, 2.4), hutWallMat);
    hutBase.position.set(4.8, 1.4, z);

    const hutRoof = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.35, 2.8), hutRoofMat);
    hutRoof.position.set(4.8, 2.8, z);

    // Door and louvered vent
    const hutDoor = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.8, 0.8), createMaterial(0x2a2a2a));
    hutDoor.position.set(3.18, 1.0, z);

    hut.add(hutBase, hutRoof, hutDoor);
    sceneryGroup.add(hut);
  });

  // Trackside Cess (gravel walkway beside ballast)
  const cessGeo = new THREE.BoxGeometry(1.8, 0.05, trackLength);
  const cessMat = createMaterial(0x948876);
  const leftCess = new THREE.Mesh(cessGeo, cessMat);
  leftCess.position.set(-2.8, 0.18, (startZ + endZ) / 2);
  const rightCess = new THREE.Mesh(cessGeo, cessMat);
  rightCess.position.set(2.8, 0.18, (startZ + endZ) / 2);
  sceneryGroup.add(leftCess, rightCess);

  scene.add(sceneryGroup);
  return sceneryGroup;
}
