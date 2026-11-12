import Phaser from 'phaser';
import { Audio } from '../../audio/AudioManager';
import { confetti, dust, popText, shake, tween, wait } from '../../animations/effects';
import { Living } from '../../animations/living';
import { BaseMiniGame, W } from '../../engine/BaseMiniGame';
import { TXT } from '../../engine/ui';

const KNIFE_X = 640;
const BOARD_Y = 430;
const LEN = 620;

/** F6 — timing cuts on a giant runaway borekas so everyone gets an equal piece. */
export default class F6_Borekas extends BaseMiniGame {
  bor!: Living;
  knife!: Phaser.GameObjects.Container;
  marks: { off: number; cut: boolean; g: Phaser.GameObjects.Graphics }[] = [];
  phase = 0;
  rolling = false;
  rollT = 7;
  chopping = false;
  tol = 24;

  makeTexture() {
    if (this.textures.exists('bigborekas')) return;
    const g = this.add.graphics();
    g.fillStyle(0xe9a74b).fillRoundedRect(4, 20, LEN, 110, 50);
    g.fillStyle(0xf4c06a).fillRoundedRect(30, 30, LEN - 50, 40, 20);
    g.lineStyle(5, 0x2b1d3a).strokeRoundedRect(4, 20, LEN, 110, 50);
    g.fillStyle(0xfff8e1);
    for (let i = 0; i < 40; i++) g.fillEllipse(20 + ((i * 53) % (LEN - 30)), 34 + ((i * 29) % 60), 6, 3);
    g.generateTexture('bigborekas', LEN + 8, 140);
    g.destroy();
  }

  setup() {
    this.makeTexture();
    this.marks = [];
    this.phase = 0;
    this.rolling = false;
    this.chopping = false;
    this.rollT = 7;
    this.tol = 26 * this.diff.size * (this.isToddler ? 2 : 1);
    const board = this.add.graphics().setDepth(2);
    board.fillStyle(0xc68b59).fillRoundedRect(200, BOARD_Y - 60, 880, 150, 24);
    board.lineStyle(6, 0x2b1d3a).strokeRoundedRect(200, BOARD_Y - 60, 880, 150, 24);
    this.bor = new Living(this, KNIFE_X, BOARD_Y, 'bigborekas', { eyeX: 0.36, eyeY: -0.05, eyeSpread: 22, eyeSize: 12 }).setDepth(10);
    const pieces = Math.max(2, this.n(6, 3));
    for (let i = 1; i < pieces; i++) {
      const off = -LEN / 2 + (LEN * i) / pieces;
      const g = this.add.graphics().setDepth(11);
      this.marks.push({ off, cut: false, g });
    }
    const blade = this.add.graphics();
    blade.fillStyle(0xdee2e6).fillRect(-14, 0, 28, 130);
    blade.lineStyle(4, 0x2b1d3a).strokeRect(-14, 0, 28, 130);
    blade.fillStyle(0x8d5524).fillRoundedRect(-22, -70, 44, 74, 10);
    blade.strokeRoundedRect(-22, -70, 44, 74, 10);
    this.knife = this.add.container(KNIFE_X, 170, [blade]).setDepth(20);
    this.add.text(KNIFE_X, 110, '▼ לחצו כשהקו מתחת לסכין ▼', TXT(24)).setOrigin(0.5).setDepth(20);
    this.setGoal(this.marks.length, 'borekas');
    this.useMistakes();
    this.setTimer(this.t(35));
    this.addHero(1160, 700, 0.6);
    this.input.on('pointerdown', () => this.chop());
    this.input.keyboard?.on('keydown-SPACE', () => this.chop());
  }

  markX(m: { off: number }) {
    return this.bor.x + m.off * this.bor.scaleX;
  }

  drawMarks() {
    for (const m of this.marks) {
      const g = m.g;
      g.clear();
      const x = this.markX(m);
      if (m.cut) {
        g.lineStyle(8, 0x2b1d3a).lineBetween(x, this.bor.y - 55, x, this.bor.y + 55);
      } else {
        g.lineStyle(4, 0xff595e);
        for (let y = -55; y < 55; y += 16) g.lineBetween(x, this.bor.y + y, x, this.bor.y + y + 9);
      }
    }
  }

  chop() {
    if (!this.playing || this.chopping || this.rolling) return;
    this.chopping = true;
    const target = this.marks
      .filter((m) => !m.cut)
      .map((m) => ({ m, d: Math.abs(this.markX(m) - KNIFE_X) }))
      .sort((a, b) => a.d - b.d)[0];
    this.tweens.add({
      targets: this.knife, y: BOARD_Y - 120, duration: 90, yoyo: true,
      onYoyo: () => {
        if (target && target.d <= this.tol) {
          target.m.cut = true;
          Audio.sfx('hit');
          dust(this, KNIFE_X, BOARD_Y, 5);
          this.good(KNIFE_X, BOARD_Y - 80, target.d < this.tol / 3 ? 'מושלם!' : 'יפה!');
          this.bor.setMood('shock', 400);
          this.addProgress(1);
        } else {
          Audio.sfx('boing');
          this.bor.setMood('tongue', 700);
          this.mistake(KNIFE_X, BOARD_Y - 80, 'עקום!');
        }
      },
      onComplete: () => (this.chopping = false),
    });
  }

  rollAway() {
    this.rolling = true;
    Audio.sfx('whoosh');
    this.bor.setMood('smug');
    popText(this, this.bor.x, BOARD_Y - 120, 'בורחחח!', '#ffbe0b');
    const x0 = this.bor.x;
    this.tweens.chain({
      targets: this.bor,
      tweens: [
        { y: 620, angle: 20, duration: 300, ease: 'Quad.easeIn' },
        { x: W + 400, duration: 700 },
        { x: -400, duration: 0 },
        { x: x0, angle: 0, duration: 700 },
        { y: BOARD_Y, duration: 300, ease: 'Back.easeOut' },
      ],
      onComplete: () => {
        this.rolling = false;
        this.bor.setMood('happy');
      },
    });
  }

  tick(dt: number) {
    if (!this.rolling) {
      this.phase += dt * 1.6 * this.diff.speed * (this.isToddler ? 0.6 : 1);
      this.bor.x = KNIFE_X + Math.sin(this.phase) * 260;
      this.bor.look(Math.cos(this.phase), 0);
      this.rollT -= dt;
      if (this.rollT <= 0 && !this.isEasy) {
        this.rollT = this.rnd(7, 10);
        this.rollAway();
      }
    }
    this.drawMarks();
  }

  bot() {
    const near = this.marks.some((m) => !m.cut && Math.abs(this.markX(m) - KNIFE_X) < this.tol * 0.4);
    if (near) this.chop();
  }

  async winAnim() {
    confetti(this, 640, 300, 60);
    const plates = [200, 400, 880, 1080];
    for (let i = 0; i < plates.length; i++) {
      const p = this.add.image(plates[i], 640, 'plate').setDepth(5);
      const piece = this.add.image(this.bor.x, BOARD_Y, 'borekas').setScale(0.5).setDepth(6);
      this.tweens.add({ targets: piece, x: plates[i], y: 620, duration: 400, delay: i * 100, ease: 'Quad.easeOut' });
      void p;
    }
    this.bor.setVisible(false);
    this.marks.forEach((m) => m.g.clear());
    this.hero?.celebrate();
    await wait(this, 1500);
  }

  async loseAnim() {
    shake(this, 0.02, 400);
    await tween(this, { targets: this.bor, scale: 4, x: 640, y: 420, duration: 700, ease: 'Back.easeIn' });
    this.bor.setMood('tongue');
    this.hero?.setVisible(false);
    popText(this, 640, 200, 'נלכדנו בבורקס!', '#ffbe0b', 44);
    await wait(this, 1200);
  }
}
