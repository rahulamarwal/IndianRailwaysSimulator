import * as THREE from 'three';
import { SignalEntry, BoardEntry, SignalAspect } from './types';
import { RendererContext } from './renderer';
import { getTrackCurve } from './curve';

export const SIGNAL_NAMES: Record<SignalAspect, string> = {
  DY: 'Double yellow (Attention)',
  Y: 'Yellow (Caution)',
  G: 'Green (Clear)',
  R: 'Red (Danger)'
};

export class SignalSystem {
  public signals: SignalEntry[];
  public boards: BoardEntry[];
  public group: THREE.Group;
  private ctx: RendererContext;

  constructor(ctx: RendererContext, signals: SignalEntry[], boards: BoardEntry[]) {
    this.ctx = ctx;
    this.signals = signals;
    this.boards = boards;
    this.group = new THREE.Group();

    this.buildSignals();
    this.buildBoards();
    this.buildKilometreMilestones();

    this.ctx.scene.add(this.group);
  }

  /**
   * Builds authentic Indian Railways Multi-Aspect Colour Light Signals (MACLS)
   * with black/white banded tubular masts, relay location boxes, inspection ladders,
   * target boards (backplates), and sun visors.
   */
  private buildSignals(): void {
    const { createMaterial, createCanvasTexture } = this.ctx;
    const housingMat = createMaterial(0x111417, { roughness: 0.8, metalness: 0.2 });
    const concreteMat = createMaterial(0x8a9299, { roughness: 0.9 });
    const silverMat = createMaterial(0xb0b8c0, { metalness: 0.7, roughness: 0.3 });
    const lensGeo = new THREE.SphereGeometry(0.18, 14, 10);
    const visorGeo = new THREE.CylinderGeometry(0.21, 0.21, 0.22, 12, 1, true, 0, Math.PI);

    // Striped black and white mast texture (RDSO standard 300mm bands)
    const mastTex = createCanvasTexture(64, 256, (c, w, h) => {
      const bands = 8;
      const bandH = h / bands;
      for (let i = 0; i < bands; i++) {
        c.fillStyle = i % 2 === 0 ? '#ffffff' : '#1a1a1a';
        c.fillRect(0, i * bandH, w, bandH);
      }
    });
    const mastMat = new THREE.MeshStandardMaterial({
      map: mastTex,
      roughness: 0.7,
      metalness: 0.2
    });

    this.signals.forEach(sig => {
      const { z, aspect } = sig;
      const pt = getTrackCurve(z);
      const nx = Math.cos(pt.yaw);
      const nz = -Math.sin(pt.yaw);

      const sigX = pt.x + 3.4 * nx;
      const sigZ = z + 3.4 * nz;

      const sigGroup = new THREE.Group();
      sigGroup.position.set(sigX, 0, sigZ);
      sigGroup.rotation.y = pt.yaw;

      // 1. Concrete Base Foundation
      const foundation = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.5, 0.65), concreteMat);
      foundation.position.set(0, 0.25, 0);
      sigGroup.add(foundation);

      // 2. Relay / Location Box (अलमारी) adjacent to signal post
      const relayBox = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.95, 0.36), silverMat);
      relayBox.position.set(0.42, 0.72, 0);
      const relayRoof = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.06, 0.4), createMaterial(0x3a424a));
      relayRoof.position.set(0.42, 1.22, 0);
      sigGroup.add(relayBox, relayRoof);

      // 3. Signal Tubular Mast (Alternating Black & White bands)
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 5.0, 14), mastMat);
      post.position.set(0, 2.75, 0);
      sigGroup.add(post);

      // 4. Rear Access Inspection Ladder
      const ladderMat = createMaterial(0x2a2e33);
      [-0.14, 0.14].forEach(lx => {
        const ladderRail = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 4.8, 6), ladderMat);
        ladderRail.position.set(lx, 2.65, 0.18);
        sigGroup.add(ladderRail);
      });
      for (let rungY = 0.6; rungY <= 4.8; rungY += 0.35) {
        const rung = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.28, 6), ladderMat);
        rung.rotation.z = Math.PI / 2;
        rung.position.set(0, rungY, 0.18);
        sigGroup.add(rung);
      }

      // Safety Cage Ring
      const cageRing = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.014, 6, 12, Math.PI * 1.5), ladderMat);
      cageRing.rotation.x = Math.PI / 2;
      cageRing.rotation.z = Math.PI * 0.75;
      cageRing.position.set(0, 4.3, 0.22);
      sigGroup.add(cageRing);

      // Maintainer Platform at head level
      const platform = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.05, 0.5), createMaterial(0x333b42));
      platform.position.set(0, 4.15, 0.05);
      sigGroup.add(platform);

      // 5. Signal Head with Target Board (Backplate)
      // Indian Railways MACLS oval/circular black backplate with white border rim
      const targetBoardTex = createCanvasTexture(256, 512, (c, w, h) => {
        c.fillStyle = '#0f1318';
        c.beginPath();
        c.roundRect(10, 10, w - 20, h - 20, 60);
        c.fill();
        c.strokeStyle = '#ffffff';
        c.lineWidth = 10;
        c.stroke();
      });
      const targetBoard = new THREE.Mesh(
        new THREE.PlaneGeometry(1.0, 2.4),
        new THREE.MeshBasicMaterial({ map: targetBoardTex, transparent: true })
      );
      targetBoard.position.set(0, 5.35, -0.19);
      targetBoard.rotation.y = Math.PI;
      sigGroup.add(targetBoard);

      // Central Housing enclosure
      const housing = new THREE.Mesh(new THREE.BoxGeometry(0.55, 2.2, 0.38), housingMat);
      housing.position.set(0, 5.35, 0);
      sigGroup.add(housing);

      // Signal ID / 'A' Marker Plate
      const markerTex = createCanvasTexture(128, 128, (c, w, h) => {
        c.fillStyle = '#ffffff';
        c.beginPath();
        c.arc(w / 2, h / 2, 58, 0, Math.PI * 2);
        c.fill();
        c.strokeStyle = '#000000';
        c.lineWidth = 6;
        c.stroke();
        c.fillStyle = '#000000';
        c.font = 'bold 64px Arial';
        c.textAlign = 'center';
        c.fillText('A', w / 2, 85);
      });
      const markerPlate = new THREE.Mesh(
        new THREE.PlaneGeometry(0.35, 0.35),
        new THREE.MeshBasicMaterial({ map: markerTex, transparent: true })
      );
      markerPlate.position.set(0, 3.2, -0.12);
      markerPlate.rotation.y = Math.PI;
      sigGroup.add(markerPlate);

      // 6. Aspect Lenses & Sun Visors
      // Standard IR MACLS 4-aspect sequence:
      // Top Yellow (Caution/Attention) -> Lower Yellow (Attention) -> Green (Clear) -> Red (Danger)
      const isTopYellowOn = aspect === 'DY' || aspect === 'Y';
      const isMidYellowOn = aspect === 'DY';
      const isGreenOn = aspect === 'G';
      const isRedOn = aspect === 'R';

      const aspectsConfig: [number, number, boolean, string][] = [
        [6.05, 0xffb700, isTopYellowOn, 'Y1'],
        [5.45, 0xffb700, isMidYellowOn, 'Y2'],
        [4.85, 0x10b981, isGreenOn, 'G'],
        [4.25, 0xef4444, isRedOn, 'R']
      ];

      aspectsConfig.forEach(([y, activeColor, isOn]) => {
        // Sun Visor Hood
        const visor = new THREE.Mesh(visorGeo, housingMat);
        visor.rotation.x = Math.PI / 2;
        visor.rotation.z = Math.PI;
        visor.position.set(0, y + 0.08, -0.22);
        sigGroup.add(visor);

        // Aspect Lens
        const lensMat = new THREE.MeshBasicMaterial({
          color: isOn ? activeColor : 0x181818
        });
        const lens = new THREE.Mesh(lensGeo, lensMat);
        lens.position.set(0, y, -0.22);
        sigGroup.add(lens);

        // Subtle glow corona if active
        if (isOn) {
          const glowMesh = new THREE.Mesh(
            new THREE.CircleGeometry(0.38, 16),
            new THREE.MeshBasicMaterial({
              color: activeColor,
              transparent: true,
              opacity: 0.38,
              depthWrite: false,
              blending: THREE.AdditiveBlending
            })
          );
          glowMesh.rotation.y = Math.PI;
          glowMesh.position.set(0, y, -0.23);
          sigGroup.add(glowMesh);
        }
      });

      this.group.add(sigGroup);
    });
  }

  /**
   * Builds authentic Indian Railways Trackside Boards:
   * 1. Whistle Boards: 'W/L' (सी/फा) for level crossings, 'W' (सी) for bridges & cuttings.
   * 2. Speed Termination Boards: 'T/P' (Termination Passenger).
   * 3. Speed Restriction Boards: RDSO circular yellow boards with black bold numerals.
   * 4. Stop Boards: Red stop plates with bilingual text.
   */
  private buildBoards(): void {
    const { createMaterial, createCanvasTexture } = this.ctx;
    const postMat = createMaterial(0x2d3238);
    const postGeo = new THREE.BoxGeometry(0.12, 3.4, 0.12);
    const concreteFootGeo = new THREE.BoxGeometry(0.4, 0.35, 0.4);
    const concreteMat = createMaterial(0x8a9299, { roughness: 0.9 });

    this.boards.forEach(b => {
      const { z, text } = b;
      const pt = getTrackCurve(z);
      const nx = Math.cos(pt.yaw);
      const nz = -Math.sin(pt.yaw);

      const boardX = pt.x + 2.7 * nx;
      const boardZ = z + 2.7 * nz;

      const boardGroup = new THREE.Group();
      boardGroup.position.set(boardX, 0, boardZ);
      boardGroup.rotation.y = pt.yaw;

      // Concrete foundation & rail post
      const foundation = new THREE.Mesh(concreteFootGeo, concreteMat);
      foundation.position.set(0, 0.18, 0);
      boardGroup.add(foundation);

      const post = new THREE.Mesh(postGeo, postMat);
      post.position.set(0, 1.7, 0);
      boardGroup.add(post);

      const isWhistle = text === 'W' || text === 'W/L';
      const isTermination = text === 'T/P' || text === 'T/G';
      const isStop = text === 'STOP';

      let texture: THREE.CanvasTexture;
      let planeWidth = 1.6;
      let planeHeight = 1.6;

      if (isWhistle) {
        // Authentic RDSO Whistle Board: Rectangular Yellow with bold black text & Hindi Devanagari
        planeWidth = 1.4;
        planeHeight = 1.7;

        texture = createCanvasTexture(256, 320, (c, w, h) => {
          c.fillStyle = '#f5c518';
          c.fillRect(0, 0, w, h);

          // Black border
          c.strokeStyle = '#111111';
          c.lineWidth = 14;
          c.strokeRect(7, 7, w - 14, h - 14);

          c.fillStyle = '#111111';
          c.textAlign = 'center';

          if (text === 'W/L') {
            c.font = 'bold 84px -apple-system, Arial, sans-serif';
            c.fillText('W/L', w / 2, 115);

            // Divider line
            c.fillRect(24, 145, w - 48, 8);

            // Devanagari सी/फा (सीटी / फाटक - Whistle for Level Crossing)
            c.font = 'bold 74px "Noto Sans Devanagari", "Mangal", Arial';
            c.fillText('सी/फा', w / 2, 245);
          } else {
            c.font = 'bold 110px -apple-system, Arial, sans-serif';
            c.fillText('W', w / 2, 130);

            // Divider line
            c.fillRect(24, 155, w - 48, 8);

            // Devanagari सी (सीटी - Whistle)
            c.font = 'bold 95px "Noto Sans Devanagari", "Mangal", Arial';
            c.fillText('सी', w / 2, 255);
          }
        });
      } else if (isTermination) {
        // T/P Speed Termination Board (Circular Yellow with bold black 'T/P')
        texture = createCanvasTexture(256, 256, (c, w, h) => {
          c.fillStyle = '#f5c518';
          c.beginPath();
          c.arc(w / 2, h / 2, 122, 0, Math.PI * 2);
          c.fill();

          c.strokeStyle = '#111111';
          c.lineWidth = 12;
          c.stroke();

          c.fillStyle = '#111111';
          c.textAlign = 'center';
          c.font = 'bold 88px Arial, sans-serif';
          c.fillText('T/P', w / 2, 160);
        });
      } else if (isStop) {
        // Stop Board: Red with white STOP and रुकिए
        texture = createCanvasTexture(256, 256, (c, w, h) => {
          c.fillStyle = '#dc2626';
          c.beginPath();
          c.arc(w / 2, h / 2, 122, 0, Math.PI * 2);
          c.fill();

          c.strokeStyle = '#ffffff';
          c.lineWidth = 12;
          c.stroke();

          c.fillStyle = '#ffffff';
          c.textAlign = 'center';
          c.font = 'bold 64px Arial, sans-serif';
          c.fillText('STOP', w / 2, 125);
          c.font = 'bold 48px "Noto Sans Devanagari", "Mangal", Arial';
          c.fillText('रुकिए', w / 2, 185);
        });
      } else {
        // Standard RDSO Circular Speed Restriction Board (e.g. 30, 60, 100, 110, 130)
        texture = createCanvasTexture(256, 256, (c, w, h) => {
          c.fillStyle = '#f5c518';
          c.beginPath();
          c.arc(w / 2, h / 2, 122, 0, Math.PI * 2);
          c.fill();

          c.strokeStyle = '#111111';
          c.lineWidth = 14;
          c.stroke();

          c.fillStyle = '#111111';
          c.textAlign = 'center';
          const fontSize = text.length > 2 ? 82 : 105;
          const fontY = text.length > 2 ? 155 : 165;
          c.font = `bold ${fontSize}px Arial, Helvetica, sans-serif`;
          c.fillText(text, w / 2, fontY);
        });
      }

      const boardMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(planeWidth, planeHeight),
        new THREE.MeshBasicMaterial({ map: texture, transparent: true })
      );
      boardMesh.rotation.y = Math.PI;
      boardMesh.position.set(0, 3.4, 0);
      boardGroup.add(boardMesh);

      this.group.add(boardGroup);
    });
  }

  /**
   * Concrete Indian Railways Kilometre Milestone Posts along cess path
   * (Standard RDSO milestone shape with arched top, Central Railway CR chainage)
   */
  private buildKilometreMilestones(): void {
    const { createMaterial, createCanvasTexture } = this.ctx;
    const postMat = createMaterial(0xdedede, { roughness: 0.85 });

    // Placed every 1000m along the double track
    for (let km = 1; km <= 8; km++) {
      const z = km * 1000;
      const pt = getTrackCurve(z);
      const nx = Math.cos(pt.yaw);
      const nz = -Math.sin(pt.yaw);

      const msX = pt.x + 3.1 * nx;
      const msZ = z + 3.1 * nz;

      const msGroup = new THREE.Group();
      msGroup.position.set(msX, 0, msZ);
      msGroup.rotation.y = pt.yaw;

      // Base concrete milestone body
      const stoneMesh = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.72, 0.22), postMat);
      stoneMesh.position.set(0, 0.36, 0);

      // Semicircular arched top
      const archedTop = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.22, 16, 1, false, 0, Math.PI), postMat);
      archedTop.rotation.z = Math.PI / 2;
      archedTop.position.set(0, 0.72, 0);
      msGroup.add(stoneMesh, archedTop);

      // Milestone Front Inscription Face
      const kmNumber = 119 + km; // Mumbai CSMT chainage to Lonavala-Pune
      const msTex = createCanvasTexture(128, 256, (c, w, h) => {
        c.fillStyle = '#ffffff';
        c.fillRect(0, 0, w, h);

        // Yellow top semicircular dome band
        c.fillStyle = '#f5c518';
        c.fillRect(0, 0, w, 70);

        c.fillStyle = '#111111';
        c.textAlign = 'center';
        c.font = 'bold 36px Arial';
        c.fillText('CR', w / 2, 50);

        // Kilometre reading
        c.fillStyle = '#111111';
        c.font = 'bold 54px Arial';
        c.fillText(kmNumber.toString(), w / 2, 140);

        c.font = 'bold 28px Arial';
        c.fillText('KM', w / 2, 195);
      });

      const face = new THREE.Mesh(
        new THREE.PlaneGeometry(0.36, 0.8),
        new THREE.MeshBasicMaterial({ map: msTex })
      );
      face.rotation.y = Math.PI;
      face.position.set(0, 0.44, -0.115);
      msGroup.add(face);

      this.group.add(msGroup);
    }
  }

  /**
   * Retrieves next signal info ahead of the train
   */
  public getNextSignal(trainDistance: number): { signal: SignalEntry; distanceMeters: number } | null {
    const next = this.signals.find(s => s.z > trainDistance);
    if (!next) return null;
    return {
      signal: next,
      distanceMeters: Math.round(next.z - trainDistance)
    };
  }

  /**
   * Checks whether the train is currently approaching a Whistle Board ('W/L' or 'W')
   * within 160 meters, prompting the loco-pilot to sound the horn.
   */
  public getApproachingWhistleBoard(trainDistance: number): { text: string; distanceMeters: number } | null {
    for (const b of this.boards) {
      if ((b.text === 'W/L' || b.text === 'W') && b.z >= trainDistance && b.z - trainDistance <= 160) {
        return {
          text: b.text,
          distanceMeters: Math.round(b.z - trainDistance)
        };
      }
    }
    return null;
  }
}
