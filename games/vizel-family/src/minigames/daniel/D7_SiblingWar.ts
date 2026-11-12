import Phaser from 'phaser';
import { Audio } from '../../audio/AudioManager';
import { confetti, dust, popText, stars, tween, wait } from '../../animations/effects';
import { Living } from '../../animations/living';
import { CharacterRig } from '../../characters/CharacterRig';
import { BaseMiniGame, W } from '../../engine/BaseMiniGame';
import { TXT } from '../../engine/ui';

const LANES = [400, 530, 660];
const TOWER_X = 640;

interface Sib {
  rig: CharacterRig;
  side: -1 | 1;
  lane: number;
  speed: number;
  stunned: number;
}
interface Pillow {
  o: Phaser.GameObjects.Image;
  side: -1 | 1;
  lane: number;
}

/** D7 — defend the block tower: tap a lane on either side to throw a pillow at the approaching siblings. */
export default class D7_SiblingWar extends BaseMiniGame {
  sibs: Sib[] = [];
  pillows: Pillow[] = [];
  blocks: Phaser.GameObjects.Image[] = [];
  spawnT = 1.5;
  tower!: Phaser.GameObjects.Container;

  setup() {
    this.sibs = [];
    this.pillows = [];
    this.spawnT = 1.2;
    const lanes = this.add.graphics().setDepth(2);
    for (const y of LANES) lanes.fillStyle(0xffffff, 0.15).fillRoundedRect(20, y - 50, W - 40, 100, 30);
    this.blocks = [];
    const tex = ['block_r', 'block_b', 'block_g', 'block_y', 'block_r', 'block_b', 'block_g'];
    const parts = tex.map((t, i) => {
      const b = this.add.image(((i % 2) - 0.5) * 8, -30 - i * 56, t).setScale(0.95);
      this.blocks.push(b);
      return b;
    });
    this.tower = this.add.container(TOWER_X, 690, parts).setDepth(10);
    this.add.text(320, 330, '◀ לחצו על הנתיב', TXT(22)).setOrigin(0.5).setDepth(3);
    this.add.text(960, 330, 'לחצו על הנתיב ▶', TXT(22)).setOrigin(0.5).setDepth(3);
    new CharacterRig(this, TOWER_X + 110, 700, 'daniel', 0.5).setDepth(11);
    this.setTimer(this.t(32), 'win');
    this.useMistakes();
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (p.y < 340) return;
      const lane = LANES.map((y, i) => ({ i, d: Math.abs(y - p.y) })).sort((a, b) => a.d - b.d)[0].i;
      this.throwAt(p.x < TOWER_X ? -1 : 1, lane);
    });
  }

  spawn() {
    const side: -1 | 1 = Math.random() < 0.5 ? -1 : 1;
    const lane = this.rnd(0, 2);
    const who = Math.random() < 0.5 ? 'yedidya' : 'esti';
    const rig = new CharacterRig(this, side < 0 ? -60 : W + 60, LANES[lane] + 40, who, 0.38).setDepth(20 + lane);
    rig.face2(side < 0 ? 1 : -1).walk(who === 'yedidya');
    rig.setExpr('laugh');
    this.sibs.push({ rig, side, lane, speed: this.s(who === 'yedidya' ? 95 : 70) + this.rnd(0, 20), stunned: 0 });
  }

  throwAt(side: -1 | 1, lane: number) {
    if (!this.playing) return;
    if (this.pillows.filter((p) => p.side === side).length >= 2) return;
    const o = this.add.image(TOWER_X + side * 60, LANES[lane], this.pick(['pillow_r', 'pillow_b', 'pillow_y'])).setDepth(30).setScale(0.55);
    this.pillows.push({ o, side, lane });
    Audio.sfx('whoosh');
  }

  tick(dt: number) {
    this.spawnT -= dt;
    if (this.spawnT <= 0) {
      this.spawn();
      const ramp = 1 + this.elapsed / 25;
      this.spawnT = ((this.isEasy ? 2.6 : 1.8) / this.diff.speed) / ramp;
    }
    for (const s of [...this.sibs]) {
      if (s.stunned > 0) {
        s.stunned -= dt;
        if (s.stunned <= 0) {
          s.rig.destroy();
          this.sibs.splice(this.sibs.indexOf(s), 1);
        }
        continue;
      }
      s.rig.x += -s.side * s.speed * dt;
      if (Math.abs(s.rig.x - TOWER_X) < 70) {
        // reached the tower
        this.sibs.splice(this.sibs.indexOf(s), 1);
        s.rig.destroy();
        const top = this.blocks.pop();
        if (top) {
          this.tweens.add({ targets: top, x: top.x + this.rnd(-200, 200), y: 0, angle: 300, alpha: 0, duration: 600 });
        }
        this.tweens.add({ targets: this.tower, angle: { from: -6, to: 6 }, duration: 80, yoyo: true, repeat: 3, onComplete: () => this.tower.setAngle(0) });
        Audio.say(s.rig.cid === 'esti' ? 'esti.again' : 'yedidya.i_won', undefined, { subtitle: false });
        this.mistake(TOWER_X, 300, 'המגדל מתנדנד!');
      }
    }
    for (const p of [...this.pillows]) {
      p.o.x += p.side * 900 * dt;
      p.o.angle += p.side * 600 * dt;
      const hit = this.sibs
        .filter((s) => s.lane === p.lane && s.side === p.side && s.stunned <= 0)
        .find((s) => Math.abs(s.rig.x - p.o.x) < 50);
      if (hit) {
        hit.stunned = 0.7;
        hit.rig.stopLoops();
        hit.rig.setExpr('dizzy');
        stars(this, hit.rig.x, hit.rig.y - 120, 700);
        this.tweens.add({ targets: hit.rig, x: hit.rig.x + hit.side * 260, y: hit.rig.y - 40, angle: hit.side * 40, duration: 600, ease: 'Quad.easeOut' });
        dust(this, hit.rig.x, hit.rig.y, 4);
        Audio.sfx('boing');
        this.good();
      }
      if (hit || p.o.x < -60 || p.o.x > W + 60) {
        this.pillows.splice(this.pillows.indexOf(p), 1);
        p.o.destroy();
      }
    }
  }

  hint() {
    const s = this.sibs.filter((x) => x.stunned <= 0).sort((a, b) => Math.abs(a.rig.x - TOWER_X) - Math.abs(b.rig.x - TOWER_X))[0];
    if (s) popText(this, s.rig.x, s.rig.y - 150, '⬇', '#ffe14d', 40);
  }

  bot(dt: number) {
    this.botTimer -= dt;
    if (this.botTimer > 0) return;
    const threats = this.sibs.filter((s) => s.stunned <= 0 && !this.pillows.some((p) => p.lane === s.lane && p.side === s.side));
    const s = threats.sort((a, b) => Math.abs(a.rig.x - TOWER_X) - Math.abs(b.rig.x - TOWER_X))[0];
    if (s && Math.abs(s.rig.x - TOWER_X) < 520) {
      this.throwAt(s.side, s.lane);
      this.botTimer = 0.15;
    }
  }

  async winAnim() {
    this.sibs.forEach((s) => s.rig.destroy());
    Audio.sfx('zap');
    await tween(this, { targets: this.tower, scale: 0, duration: 300 });
    const r = new Living(this, TOWER_X, 470, 'robot', { scale: 1.3, eyes: false, mouth: false }).setDepth(40);
    r.setScale(0);
    await tween(this, { targets: r, scale: 1.3, duration: 400, ease: 'Back.easeOut' });
    this.tweens.add({ targets: r, angle: { from: -12, to: 12 }, duration: 200, yoyo: true, repeat: 4 });
    confetti(this, TOWER_X, 300, 60);
    popText(this, TOWER_X, 220, 'רובוט קוביות!', '#ffe14d', 44);
    await wait(this, 1300);
  }

  async loseAnim() {
    for (const b of this.blocks) this.tweens.add({ targets: b, y: 0, x: b.x + this.rnd(-300, 300), angle: this.rnd(-360, 360), duration: 700 });
    Audio.sfx('crash');
    dust(this, TOWER_X, 680, 14);
    await wait(this, 1300);
  }
}
