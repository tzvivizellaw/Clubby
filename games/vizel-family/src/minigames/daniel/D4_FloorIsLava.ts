import Phaser from 'phaser';
import { Audio } from '../../audio/AudioManager';
import { confetti, dust, popText, splash, tween, wait } from '../../animations/effects';
import { CharacterRig } from '../../characters/CharacterRig';
import { BaseMiniGame, W } from '../../engine/BaseMiniGame';

interface Plat {
  x: number; // world x (left)
  w: number;
  y: number; // top
  g: Phaser.GameObjects.Container;
}

const LAVA_Y = 640;
const PX = 300; // Daniel's screen x
const GRAV = 2100;
const JUMP = 960;

/** D4 — auto-runner platformer over cartoon lava, jumping between furniture to the fridge. */
export default class D4_FloorIsLava extends BaseMiniGame {
  dan!: CharacterRig;
  plats: Plat[] = [];
  camX = 0;
  y = 0;
  vy = 0;
  grounded = true;
  jumps = 0;
  holding = false;
  length = 4000;
  speed = 260;
  goalObj!: Phaser.GameObjects.Container;
  lava!: Phaser.GameObjects.Graphics;
  respawning = false;
  lastSafe = 0;

  setup() {
    this.plats = [];
    this.camX = 0;
    this.respawning = false;
    this.speed = this.s(260);
    this.length = Math.round(3600 * Math.max(0.6, this.diff.goal));
    // lava
    this.lava = this.add.graphics().setDepth(40);
    this.lava.fillStyle(0xff5400).fillRect(0, LAVA_Y, W, 100).fillStyle(0xffbd00);
    for (let x = 0; x < W; x += 80) this.lava.fillEllipse(x + 40, LAVA_Y + 6, 70, 24);
    this.lava.lineStyle(5, 0x2b1d3a).lineBetween(0, LAVA_Y - 4, W, LAVA_Y - 4);
    for (let i = 0; i < 8; i++) {
      const b = this.add.circle(this.rnd(0, W), LAVA_Y + 40, this.rnd(6, 14), 0xffd166).setDepth(41);
      this.tweens.add({ targets: b, y: LAVA_Y - 10, alpha: 0, duration: this.rnd(700, 1300), repeat: -1, delay: this.rnd(0, 1000) });
    }
    // level
    let x = 0;
    const furn = ['sofa', 'bed', 'toybox', 'cupboard', 'bigbed', 'pillow_b'];
    const maxGap = this.isEasy ? 130 : this.diff.tier === 'hard' ? 190 : 165;
    this.addPlat(0, 520, 470);
    x = 520;
    let y = 470;
    while (x < this.length) {
      const gap = this.rnd(80, maxGap);
      const w = this.rnd(this.isEasy ? 240 : 170, this.isEasy ? 380 : 300);
      y = Phaser.Math.Clamp(y + this.rnd(-80, 70), 330, 540);
      this.addPlat(x + gap, w, y, this.pick(furn));
      x += gap + w;
    }
    this.addPlat(x + 100, 500, 470);
    const fridge = this.add.graphics();
    fridge.fillStyle(0xf1f5f9).fillRoundedRect(-70, -260, 140, 260, 16).lineStyle(5, 0x2b1d3a).strokeRoundedRect(-70, -260, 140, 260, 16).lineBetween(-70, -170, 70, -170);
    const shoko = this.add.image(0, -290, 'shoko');
    this.goalObj = this.add.container(x + 350, 470, [fridge, shoko]).setDepth(9);
    this.length = x + 300;
    this.dan = new CharacterRig(this, PX, 470, 'daniel', 0.5).setDepth(30);
    this.y = 470;
    this.vy = 0;
    this.grounded = true;
    this.setGoal(100, 'shoko', false);
    this.useMistakes();
    const down = () => this.press();
    const up = () => (this.holding = false);
    this.input.on('pointerdown', down);
    this.input.on('pointerup', up);
    this.input.keyboard?.on('keydown-SPACE', down);
    this.input.keyboard?.on('keyup-SPACE', up);
    this.input.keyboard?.on('keydown-UP', down);
    this.input.keyboard?.on('keyup-UP', up);
  }

  addPlat(x: number, w: number, y: number, tex?: string) {
    const g = this.add.graphics();
    g.fillStyle(0xa0662b).fillRoundedRect(0, 0, w, 26, 10).lineStyle(4, 0x2b1d3a).strokeRoundedRect(0, 0, w, 26, 10);
    g.fillStyle(0x6b4a1e).fillRect(14, 26, 16, LAVA_Y - y).fillRect(w - 30, 26, 16, LAVA_Y - y);
    const parts: Phaser.GameObjects.GameObject[] = [g];
    if (tex) {
      const im = this.add.image(w / 2, -20, tex);
      im.setScale(Math.min((w * 0.8) / im.width, 70 / im.height));
      parts.push(im);
    }
    const c = this.add.container(x, y, parts).setDepth(10);
    this.plats.push({ x, w, y, g: c });
  }

  press() {
    if (!this.playing || this.respawning) return;
    const maxJ = this.isEasy ? 2 : 1;
    if (this.grounded || this.jumps < maxJ) {
      this.vy = -JUMP * (this.jumps > 0 ? 0.85 : 1);
      this.grounded = false;
      this.jumps++;
      this.holding = true;
      Audio.sfx('jump');
      this.dan.armsUp();
    }
  }

  platUnder(worldX: number) {
    return this.plats.find((p) => worldX >= p.x - 18 && worldX <= p.x + p.w + 18);
  }

  tick(dt: number) {
    if (this.respawning) return;
    this.camX += this.speed * dt;
    const wx = this.camX + PX;
    // variable jump height: release early = short hop
    if (!this.holding && this.vy < -380) this.vy = -380;
    const prevY = this.y;
    this.vy += GRAV * dt;
    this.y += this.vy * dt;
    const p = this.platUnder(wx);
    if (p && this.vy >= 0 && prevY <= p.y + 2 && this.y >= p.y) {
      this.y = p.y;
      this.vy = 0;
      if (!this.grounded) {
        dust(this, PX, p.y, 3);
        this.dan.idle();
        this.dan.walk(true);
      }
      this.grounded = true;
      this.jumps = 0;
      this.lastSafe = p.x + 10;
    } else if (this.grounded && !(p && Math.abs(this.y - p.y) < 2)) {
      this.grounded = false;
    }
    if (this.grounded && !this.dan.getData('running')) {
      this.dan.walk(true);
      this.dan.setData('running', true);
    }
    if (!this.grounded) this.dan.setData('running', false);
    this.dan.y = this.y;
    for (const pl of this.plats) pl.g.x = pl.x - this.camX;
    this.goalObj.x = this.length + 50 - this.camX;
    const prog = Math.min(100, Math.round((this.camX / (this.length - PX)) * 100));
    if (prog !== this.progress) {
      this.progress = prog;
      this.addProgress(0);
    }
    if (this.y > LAVA_Y + 10) this.burn();
    if (wx >= this.length) this.win();
  }

  async burn() {
    this.respawning = true;
    splash(this, PX, LAVA_Y, 10, 0xff8c00);
    Audio.sfx('sneeze');
    popText(this, PX, 380, 'חם! חם! חם!', '#ff5400', 40);
    this.dan.setExpr('shock');
    this.mistake();
    if (this.ended) return;
    await tween(this, { targets: this.dan, y: 250, duration: 350, ease: 'Quad.easeOut' });
    // respawn on the last safe platform
    this.camX = Math.max(0, this.lastSafe - PX + 40);
    const p = this.platUnder(this.camX + PX)!;
    this.y = p ? p.y : 470;
    this.vy = 0;
    this.grounded = true;
    this.jumps = 0;
    for (const pl of this.plats) pl.g.x = pl.x - this.camX;
    await tween(this, { targets: this.dan, y: this.y, duration: 250 });
    this.dan.setExpr('smile');
    this.respawning = false;
  }

  bot() {
    if (!this.grounded) {
      // release for short hops when the next platform is close and low
      return;
    }
    const wx = this.camX + PX;
    const p = this.platUnder(wx);
    if (!p) return;
    const edge = p.x + p.w - wx;
    if (edge < 22 + this.speed * 0.02) {
      this.press();
      this.holding = true;
    }
  }

  async winAnim() {
    this.dan.stopLoops();
    this.dan.holdItem('shoko', 0.8);
    Audio.sfx('ding');
    confetti(this, PX, 300, 60);
    await tween(this, { targets: this.lava, alpha: 0, duration: 600 });
    popText(this, 640, 300, 'הלבה חזרה להיות רצפה!', '#ffe14d', 40);
    this.dan.celebrate();
    await wait(this, 1000);
  }

  async loseAnim() {
    this.dan.setVisible(true);
    for (let i = 0; i < 6; i++) {
      const s = this.add.circle(PX + this.rnd(-20, 20), this.dan.y - 40, 14, 0x9aa5b1, 0.8).setDepth(50);
      this.tweens.add({ targets: s, y: s.y - 150, alpha: 0, scale: 2, duration: 900, delay: i * 120 });
    }
    await this.dan.jump(160, 500);
    await this.dan.jump(100, 400);
  }
}
