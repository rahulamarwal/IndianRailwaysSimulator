import * as THREE from 'three';
import { SignalEntry, BoardEntry, SignalAspect } from './types';
import { RendererContext } from './renderer';
import { getTrackCurve } from './curve';

export const SIGNAL_NAMES: Record<SignalAspect, string> = {
  DY: 'Double yellow',
  Y: 'Yellow',
  G: 'Green',
  R: 'Red'
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

    this.ctx.scene.add(this.group);
  }

  private buildSignals(): void {
    const { createMaterial } = this.ctx;
    const postMat = createMaterial(0x2a2a2a);
    const housingMat = createMaterial(0x111111);
    const lensGeo = new THREE.SphereGeometry(0.2, 12, 8);

    this.signals.forEach(sig => {
      const { z, aspect } = sig;
      const pt = getTrackCurve(z);
      const nx = Math.cos(pt.yaw);
      const nz = -Math.sin(pt.yaw);

      const sigX = pt.x + 3.3 * nx;
      const sigZ = z + 3.3 * nz;

      const sigGroup = new THREE.Group();
      sigGroup.position.set(sigX, 0, sigZ);
      sigGroup.rotation.y = pt.yaw;

      // Mast post
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.16, 5, 0.16), postMat);
      post.position.set(0, 2.5, 0);
      sigGroup.add(post);

      // Multi-aspect signal head hood/housing
      const housing = new THREE.Mesh(new THREE.BoxGeometry(0.7, 2.1, 0.4), housingMat);
      housing.position.set(0, 5.3, 0);
      sigGroup.add(housing);

      // Aspects lenses (Double Yellow / Yellow / Green / Red)
      const isTopYellowOn = aspect === 'DY' || aspect === 'Y';
      const isMidYellowOn = aspect === 'DY';
      const isGreenOn = aspect === 'G';
      const isRedOn = aspect === 'R';

      const aspectsConfig: [number, number, boolean][] = [
        [5.95, 0xffc400, isTopYellowOn],  // Attention / Caution yellow
        [5.30, 0xffc400, isMidYellowOn],  // Attention lower yellow
        [4.65, 0x2ee66b, isGreenOn],      // Proceed green
        [4.00, 0xff2222, isRedOn]         // Danger red (for future blocks)
      ];

      aspectsConfig.forEach(([y, activeColor, isOn]) => {
        const lensMat = new THREE.MeshBasicMaterial({
          color: isOn ? activeColor : 0x222222
        });
        const lens = new THREE.Mesh(lensGeo, lensMat);
        lens.position.set(0, y, -0.2);
        sigGroup.add(lens);
      });

      this.group.add(sigGroup);
    });
  }

  private buildBoards(): void {
    const { createMaterial, createCanvasTexture } = this.ctx;
    const postMat = createMaterial(0x333333);
    const postGeo = new THREE.BoxGeometry(0.12, 3.2, 0.12);
    const boardPlaneGeo = new THREE.PlaneGeometry(1.7, 1.7);

    this.boards.forEach(b => {
      const { z, text, bg } = b;
      const pt = getTrackCurve(z);
      const nx = Math.cos(pt.yaw);
      const nz = -Math.sin(pt.yaw);

      const boardX = pt.x + 2.6 * nx;
      const boardZ = z + 2.6 * nz;

      const boardGroup = new THREE.Group();
      boardGroup.position.set(boardX, 0, boardZ);
      boardGroup.rotation.y = pt.yaw;

      // Post
      const post = new THREE.Mesh(postGeo, postMat);
      post.position.set(0, 1.6, 0);
      boardGroup.add(post);

      // Sign plate texture (Indian Railways circular speed board / STOP board)
      const texture = createCanvasTexture(256, 256, (c, w, h) => {
        c.fillStyle = bg;
        c.beginPath();
        c.arc(w / 2, h / 2, 124, 0, Math.PI * 2);
        c.fill();

        c.fillStyle = '#ffffff';
        c.beginPath();
        c.arc(w / 2, h / 2, 100, 0, Math.PI * 2);
        c.fill();

        c.fillStyle = '#111111';
        c.textAlign = 'center';
        const fontSize = text.length > 3 ? 64 : 100;
        const fontY = text.length > 3 ? 148 : 162;
        c.font = `bold ${fontSize}px Arial, Helvetica, sans-serif`;
        c.fillText(text, w / 2, fontY);
      });

      const boardMesh = new THREE.Mesh(
        boardPlaneGeo,
        new THREE.MeshBasicMaterial({ map: texture, transparent: true })
      );
      boardMesh.rotation.y = Math.PI;
      boardMesh.position.set(0, 3.5, 0);
      boardGroup.add(boardMesh);

      this.group.add(boardGroup);
    });
  }

  public getNextSignal(trainDistance: number): { signal: SignalEntry; distanceMeters: number } | null {
    const next = this.signals.find(s => s.z > trainDistance);
    if (!next) return null;
    return {
      signal: next,
      distanceMeters: Math.round(next.z - trainDistance)
    };
  }
}
