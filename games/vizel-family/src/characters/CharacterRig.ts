import Phaser from 'phaser';
import type { CastId } from '../data/characters';
import { dust, stars, tween, wait, zzz } from '../animations/effects';
import { faceCmds, type Expr, type FaceCmd } from './face';
import { LOOKS, OUT, RIG } from './parts';

export const TEX_RES = 2; // part textures are rasterised at 2x for crisp zooms

const hex = (s: string) => parseInt(s.replace('#', ''), 16);

/**
 * Animated cartoon character built from separate SVG parts (legs, body, arms, head)
 * plus a procedurally drawn face (eyes, brows, mouth) so expressions can change live.
 * If a photo head exists (public/assets/characters/manifest.json) it replaces the drawn head.
 */
export class CharacterRig extends Phaser.GameObjects.Container {
  readonly cid: CastId;
  readonly baseScale: number;
  legL: Phaser.GameObjects.Image;
  legR: Phaser.GameObjects.Image;
  torso: Phaser.GameObjects.Image;
  armL: Phaser.GameObjects.Image;
  armR: Phaser.GameObjects.Image;
  head: Phaser.GameObjects.Container;
  headImg: Phaser.GameObjects.Image;
  face: Phaser.GameObjects.Graphics;
  cape?: Phaser.GameObjects.Image;
  held?: Phaser.GameObjects.Image;
  expr: Expr = 'smile';
  private lookX = 0;
  private lookY = 0;
  private blink = false;
  private loops: Phaser.Tweens.Tween[] = [];
  private exprTimer?: Phaser.Time.TimerEvent;
  private blinkEv?: Phaser.Time.TimerEvent;
  private hideFace = false;

  constructor(scene: Phaser.Scene, x: number, y: number, id: CastId, scale = 1) {
    super(scene, x, y);
    this.cid = id;
    const L = LOOKS[id];
    this.baseScale = L.scale * scale;
    const r = 1 / TEX_RES;
    if (L.cape) {
      this.cape = scene.add.image(0, -150, `ch_${id}_cape`).setOrigin(0.5, 0.03).setScale(r);
      this.add(this.cape);
    }
    this.legL = scene.add.image(-RIG.legX, RIG.legY, `ch_${id}_leg`).setOrigin(0.5, 0.05).setScale(r);
    this.legR = scene.add.image(RIG.legX, RIG.legY, `ch_${id}_leg`).setOrigin(0.5, 0.05).setScale(r);
    this.torso = scene.add.image(0, RIG.bodyTop, `ch_${id}_body`).setOrigin(0.5, 0.03).setScale(r);
    this.armL = scene.add.image(-RIG.armX, RIG.armY, `ch_${id}_arm`).setOrigin(0.5, 0.1).setScale(r).setAngle(8);
    this.armR = scene.add.image(RIG.armX, RIG.armY, `ch_${id}_arm`).setOrigin(0.5, 0.1).setScale(r).setAngle(-8);
    this.head = scene.add.container(0, RIG.neckY);
    const photo = scene.textures.exists(`photo_head_${id}`);
    this.headImg = scene.add
      .image(0, 0, photo ? `photo_head_${id}` : `ch_${id}_head`)
      .setOrigin((RIG.headAnchor.x + 4) / 148, (RIG.headAnchor.y + 4) / 158)
      .setScale(r);
    if (photo) {
      const tex = scene.textures.get(`photo_head_${id}`).getSourceImage() as HTMLImageElement;
      this.headImg.setOrigin(0.5, 0.95).setScale(150 / Math.max(1, tex.height));
      this.hideFace = (scene.registry.get('photoHideFace') ?? {})[id] ?? true;
    }
    this.face = scene.add.graphics();
    this.face.setPosition(-RIG.headAnchor.x, -RIG.headAnchor.y);
    this.head.add([this.headImg, this.face]);
    this.head.setScale(L.headScale);
    this.add([this.legL, this.legR, this.torso, this.armL, this.armR, this.head]);
    this.setScale(this.baseScale);
    this.setSize(140, 320);
    scene.add.existing(this);
    this.drawFace();
    this.startBlink();
    this.idle();
    this.once(Phaser.GameObjects.Events.DESTROY, () => {
      this.blinkEv?.remove();
      this.exprTimer?.remove();
      this.stopLoops();
    });
  }

  // ---------- face ----------
  private drawFace() {
    const g = this.face;
    g.clear();
    if (this.hideFace) return;
    const cmds: FaceCmd[] = faceCmds(this.expr, { blink: this.blink, lookX: this.lookX, lookY: this.lookY, glasses: LOOKS[this.cid].glasses });
    for (const c of cmds) {
      if (c.k === 'circle' || c.k === 'ellipse') {
        const rx = c.k === 'circle' ? c.r : c.rx;
        const ry = c.k === 'circle' ? c.r : c.ry;
        if (c.fill) {
          g.fillStyle(hex(c.fill), 1);
          g.fillEllipse(c.x, c.y, rx * 2, ry * 2);
        }
        if (c.stroke) {
          g.lineStyle(c.stroke, hex(OUT), 1);
          g.strokeEllipse(c.x, c.y, rx * 2, ry * 2);
        }
      } else {
        const pts = c.pts.map((p) => new Phaser.Math.Vector2(p[0], p[1]));
        if (c.fill && c.close) {
          g.fillStyle(hex(c.fill), 1);
          g.fillPoints(pts, true);
        }
        g.lineStyle(c.stroke, hex(OUT), 1);
        g.strokePoints(pts, !!c.close);
      }
    }
  }

  setExpr(e: Expr, ms?: number, back: Expr = 'smile') {
    this.expr = e;
    this.drawFace();
    this.exprTimer?.remove();
    if (ms) this.exprTimer = this.scene.time.delayedCall(ms, () => this.setExpr(back));
    return this;
  }

  look(x: number, y = 0) {
    this.lookX = Phaser.Math.Clamp(x, -1, 1);
    this.lookY = Phaser.Math.Clamp(y, -1, 1);
    this.drawFace();
    return this;
  }

  private startBlink() {
    const next = () => {
      this.blinkEv = this.scene.time.delayedCall(Phaser.Math.Between(1800, 4200), () => {
        if (!this.active) return;
        this.blink = true;
        this.drawFace();
        this.scene.time.delayedCall(120, () => {
          if (!this.active) return;
          this.blink = false;
          this.drawFace();
          next();
        });
      });
    };
    next();
  }

  // ---------- loops ----------
  stopLoops() {
    this.loops.forEach((t) => t.remove());
    this.loops = [];
    if (!this.scene) return;
    this.legL.setAngle(0);
    this.legR.setAngle(0);
    this.armL.setAngle(8);
    this.armR.setAngle(-8);
    this.torso.setY(RIG.bodyTop);
    this.head.setY(RIG.neckY).setAngle(0);
    this.cape?.setAngle(0).setScale(1 / TEX_RES);
  }

  private loop(cfg: Phaser.Types.Tweens.TweenBuilderConfig) {
    const t = this.scene.tweens.add({ repeat: -1, yoyo: true, ...cfg });
    this.loops.push(t);
    return t;
  }

  idle() {
    this.stopLoops();
    this.loop({ targets: this.head, y: RIG.neckY + 3, duration: 900, ease: 'Sine.easeInOut' });
    this.loop({ targets: this.torso, y: RIG.bodyTop + 2, duration: 900, ease: 'Sine.easeInOut' });
    this.loop({ targets: this.armL, angle: 12, duration: 900, ease: 'Sine.easeInOut' });
    this.loop({ targets: this.armR, angle: -12, duration: 900, ease: 'Sine.easeInOut' });
    if (this.cape) this.loop({ targets: this.cape, angle: 4, duration: 700, ease: 'Sine.easeInOut' });
    return this;
  }

  walk(fast = false) {
    this.stopLoops();
    const d = fast ? 140 : 260;
    this.legL.setAngle(-25);
    this.legR.setAngle(25);
    this.armL.setAngle(-30);
    this.armR.setAngle(30);
    this.loop({ targets: this.legL, angle: 25, duration: d });
    this.loop({ targets: this.legR, angle: -25, duration: d });
    this.loop({ targets: this.armL, angle: 30, duration: d });
    this.loop({ targets: this.armR, angle: -30, duration: d });
    this.loop({ targets: this.head, y: RIG.neckY - 6, duration: d / 2 });
    if (this.cape) this.loop({ targets: this.cape, angle: 12, duration: d });
    return this;
  }

  run() {
    return this.walk(true);
  }

  /** Move to a point while walking/running, facing the direction. */
  async walkTo(x: number, y = this.y, ms = 800, fast = true) {
    this.face2(x < this.x ? -1 : 1);
    this.walk(fast);
    await tween(this.scene, { targets: this, x, y, duration: ms, ease: 'Sine.easeInOut' });
    this.idle();
  }

  face2(dir: 1 | -1) {
    this.scaleX = Math.abs(this.scaleX) * dir;
    return this;
  }

  // ---------- one-shot animations (all return promises) ----------
  async jump(h = 90, ms = 480) {
    const y0 = this.y;
    const sy = this.scaleY, sx = this.scaleX;
    await tween(this.scene, { targets: this, scaleY: sy * 0.8, scaleX: sx * 1.15, duration: 90, ease: 'Quad.easeOut' });
    this.armL.setAngle(150);
    this.armR.setAngle(-150);
    await tween(this.scene, { targets: this, y: y0 - h, scaleY: sy * 1.12, scaleX: sx * 0.92, duration: ms / 2, ease: 'Quad.easeOut' });
    await tween(this.scene, { targets: this, y: y0, scaleY: sy, scaleX: sx, duration: ms / 2, ease: 'Quad.easeIn' });
    this.armL.setAngle(8);
    this.armR.setAngle(-8);
    await tween(this.scene, { targets: this, scaleY: sy * 0.85, scaleX: sx * 1.1, duration: 70, yoyo: true });
  }

  async celebrate() {
    this.stopLoops();
    this.setExpr('happy');
    this.armL.setAngle(160);
    this.armR.setAngle(-160);
    this.loop({ targets: this.armL, angle: 130, duration: 140 });
    this.loop({ targets: this.armR, angle: -130, duration: 140 });
    await this.jump(110, 520);
    await this.jump(70, 420);
    this.idle();
  }

  async shock() {
    this.setExpr('shock', 1400);
    const sy = this.scaleY;
    this.armL.setAngle(130);
    this.armR.setAngle(-130);
    await tween(this.scene, { targets: this, scaleY: sy * 1.18, duration: 110, yoyo: true, ease: 'Quad.easeOut' });
    await tween(this.scene, { targets: this.head, y: RIG.neckY - 26, duration: 120, yoyo: true });
    this.armL.setAngle(8);
    this.armR.setAngle(-8);
  }

  async fall() {
    this.stopLoops();
    this.setExpr('dizzy');
    const y0 = this.y;
    const dir = Math.sign(this.scaleX) || 1;
    await tween(this.scene, { targets: this, angle: 90 * dir, y: y0 + 10, duration: 260, ease: 'Quad.easeIn' });
    dust(this.scene, this.x + 60 * dir, y0);
    stars(this.scene, this.x + 120 * dir * this.baseScale, y0 - 40, 1400);
    await wait(this.scene, 1100);
    await tween(this.scene, { targets: this, angle: 0, y: y0, duration: 260, ease: 'Back.easeOut' });
    this.setExpr('smile');
    this.idle();
  }

  /** Land on the bottom (Yedidya's signature). */
  async bumpLand() {
    this.setExpr('shock');
    const sy = this.scaleY;
    await tween(this.scene, { targets: this, scaleY: sy * 0.6, duration: 90, yoyo: true });
    dust(this.scene, this.x, this.y);
    stars(this.scene, this.x, this.y - 300 * this.baseScale, 1000);
    this.setExpr('confused', 900);
  }

  async hit() {
    this.setExpr('dizzy', 700);
    await tween(this.scene, { targets: this, angle: -12 * Math.sign(this.scaleX), duration: 80, yoyo: true, repeat: 2 });
  }

  async cry(ms = 1400) {
    this.setExpr('cry', ms);
    this.stopLoops();
    this.loop({ targets: this.head, angle: 6, duration: 160 });
    for (let i = 0; i < 5; i++) {
      const s = this.baseScale * this.head.scale;
      const d = this.scene.add.image(this.x + (i % 2 ? 22 : -22) * s, this.y + (RIG.neckY - 60) * s, 'px_drop').setTint(0x6ec6ff).setDepth(this.depth + 1).setScale(0.5);
      this.scene.tweens.add({ targets: d, y: d.y + 80, x: d.x + (i % 2 ? 30 : -30), alpha: 0, duration: 600, delay: i * 200, onComplete: () => d.destroy() });
    }
    await wait(this.scene, ms);
    this.idle();
  }

  async laugh(ms = 1200) {
    this.setExpr('laugh', ms);
    await tween(this.scene, { targets: this.head, angle: 8, duration: 90, yoyo: true, repeat: Math.round(ms / 180) });
  }

  async spin(turns = 1, ms = 600) {
    await tween(this.scene, { targets: this, angle: this.angle + 360 * turns, duration: ms, ease: 'Cubic.easeInOut' });
    this.angle = 0;
  }

  async squash() {
    const sx = this.scaleX, sy = this.scaleY;
    await tween(this.scene, { targets: this, scaleX: sx * 1.3, scaleY: sy * 0.7, duration: 120, yoyo: true });
  }

  async stretch() {
    const sx = this.scaleX, sy = this.scaleY;
    await tween(this.scene, { targets: this, scaleX: sx * 0.8, scaleY: sy * 1.3, duration: 160, yoyo: true });
  }

  async enter(from: 'left' | 'right' | 'top' | 'bottom' = 'left', ms = 600) {
    const tx = this.x, ty = this.y;
    if (from === 'left') this.x = -150;
    if (from === 'right') this.x = 1430;
    if (from === 'top') this.y = -100;
    if (from === 'bottom') this.y = 900;
    if (from === 'top') {
      await tween(this.scene, { targets: this, y: ty, duration: ms, ease: 'Bounce.easeOut' });
      dust(this.scene, this.x, ty);
      return;
    }
    if (from === 'bottom') {
      await tween(this.scene, { targets: this, y: ty, duration: ms, ease: 'Back.easeOut' });
      return;
    }
    await this.walkTo(tx, ty, ms);
  }

  async exit(to: 'left' | 'right' = 'right', ms = 600) {
    await this.walkTo(to === 'left' ? -200 : 1480, this.y, ms);
  }

  async wave() {
    this.armR.setAngle(-150);
    await tween(this.scene, { targets: this.armR, angle: -120, duration: 160, yoyo: true, repeat: 3 });
    this.armR.setAngle(-8);
  }

  handsOnHips() {
    this.stopLoops();
    this.armL.setAngle(-35);
    this.armR.setAngle(35);
    this.setExpr('smug', 1500);
    this.scene.time.delayedCall(1500, () => this.active && this.idle());
  }

  async rollEyes() {
    this.handsOnHips();
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      this.lookX = Math.cos(a);
      this.lookY = Math.sin(a);
      this.expr = 'smile';
      this.drawFace();
      await wait(this.scene, 70);
    }
    this.look(0, -1);
    await wait(this.scene, 300);
    this.look(0, 0);
  }

  armsUp() {
    this.stopLoops();
    this.armL.setAngle(160);
    this.armR.setAngle(-160);
  }

  point(dir: 1 | -1 = 1) {
    this.stopLoops();
    if (dir * Math.sign(this.scaleX) > 0) this.armR.setAngle(-95);
    else this.armL.setAngle(95);
  }

  async throwPose() {
    this.stopLoops();
    this.armR.setAngle(-170);
    await tween(this.scene, { targets: this.armR, angle: -60, duration: 160, ease: 'Back.easeIn' });
    this.idle();
  }

  fly(on = true) {
    this.stopLoops();
    if (!on) {
      this.angle = 0;
      this.idle();
      return;
    }
    this.angle = 70 * Math.sign(this.scaleX);
    this.armR.setAngle(-170);
    this.armL.setAngle(170);
    if (this.cape) this.loop({ targets: this.cape, scaleY: 0.4, angle: 18, duration: 140 });
    this.loop({ targets: this.legL, angle: 10, duration: 200 });
  }

  sleep(on = true) {
    this.stopLoops();
    if (on) {
      this.setExpr('sleep');
      this.loop({ targets: this.head, angle: 10, duration: 1200, ease: 'Sine.easeInOut' });
      const ev = this.scene.time.addEvent({ delay: 900, loop: true, callback: () => this.active && zzz(this.scene, this.x + 40, this.y - 300 * this.baseScale) });
      this.once(Phaser.GameObjects.Events.DESTROY, () => ev.remove());
      (this as any)._zz = ev;
    } else {
      (this as any)._zz?.remove();
      this.setExpr('shock', 600);
      this.idle();
    }
  }

  /** Signature move for each character (used on selection/entrances). */
  async signature() {
    switch (this.cid) {
      case 'avigail':
        await this.rollEyes();
        break;
      case 'daniel':
        await this.throwPose();
        await this.celebrate();
        break;
      case 'yedidya': {
        this.fly(true);
        const y0 = this.y;
        await tween(this.scene, { targets: this, y: y0 - 120, duration: 500, ease: 'Sine.easeOut' });
        await tween(this.scene, { targets: this, y: y0, duration: 300, ease: 'Quad.easeIn' });
        this.fly(false);
        await this.bumpLand();
        break;
      }
      case 'esti':
        this.setExpr('laugh', 1200);
        await this.jump(40, 300);
        await this.jump(40, 300);
        await this.spin(1, 500);
        break;
      default:
        await this.wave();
    }
  }

  holdItem(tex: string | null, scale = 0.7) {
    this.held?.destroy();
    this.held = undefined;
    if (!tex) return;
    this.held = this.scene.add.image(this.armR.x, this.armR.y + 70, tex).setScale(scale / this.baseScale);
    this.add(this.held);
  }
}
