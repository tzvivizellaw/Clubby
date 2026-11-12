import Phaser from 'phaser';
import { Audio } from '../../audio/AudioManager';
import { confetti, dust, splash, tween, wait } from '../../animations/effects';
import { Living } from '../../animations/living';
import { CharacterRig } from '../../characters/CharacterRig';
import { BaseMiniGame, W } from '../../engine/BaseMiniGame';
import { TXT } from '../../engine/ui';

const SEA_Y = 600;

interface Pillow {
  o: Phaser.GameObjects.Image;
  x: number;
  phase: number;
  speed: number;
  ring: Phaser.GameObjects.Arc;
}

/** Y2 — timing hops across bobbing pillows over a "Lego sea" to rescue the teddy. */
export default class Y2_SaveTeddy extends BaseMiniGame {
  pillows: Pillow[] = [];
  at = -1; // -1 = start rock
  yed!: CharacterRig;
  teddy!: Living;
  jumping = false;

  /** pillow height offset: >0 means up (safe) */
  lift(p: Pillow, t = this.elapsed) {
    return Math.sin(t * p.speed + p.phase);
  }
  safe(p: Pillow, t = this.elapsed) {
    return this.lift(p, t) > -0.15;
  }

  setup() {
    this.pillows = [];
    this.at = -1;
    this.jumping = false;
    // Lego sea
    const g = this.add.graphics().setDepth(2);
    g.fillStyle(0x4cc9f0).fillRect(0, SEA_Y, W, 140);
    const cols = [0xff595e, 0xffca3a, 0x8ac926, 0x1982c4];
    for (let i = 0; i < 40; i++) g.fillStyle(cols[i % 4]).fillRoundedRect((i * 37) % W, SEA_Y + 20 + ((i * 53) % 90), 26, 16, 3);
    this.add.text(640, 690, 'ים הלגו — אאוץ\'!', TXT(22)).setOrigin(0.5).setDepth(3);
    const n = this.isToddler ? 3 : this.isEasy ? 5 : 6;
    const span = 760 / n;
    for (let i = 0; i < n; i++) {
      const x = 260 + span * (i + 0.5);
      const o = this.add.image(x, SEA_Y - 20, this.pick(['pillow_r', 'pillow_b', 'pillow_y', 'pillow_g'])).setDepth(5).setScale(0.9 * this.diff.size);
      const ring = this.add.circle(x, SEA_Y - 70, 12, 0x8ac926).setStrokeStyle(3, 0x2b1d3a).setDepth(6);
      this.pillows.push({ o, x, phase: i * 1.7, speed: (this.isEasy ? 1.3 : 1.7) * this.diff.speed + (i % 2) * 0.3, ring });
    }
    this.add.rectangle(120, SEA_Y - 10, 200, 40, 0x8d5524).setStrokeStyle(4, 0x2b1d3a).setDepth(4);
    this.add.rectangle(1170, SEA_Y - 10, 200, 40, 0x8d5524).setStrokeStyle(4, 0x2b1d3a).setDepth(4);
    this.teddy = new Living(this, 1170, SEA_Y - 80, 'teddy', { scale: 1.2 }).setDepth(6);
    this.yed = new CharacterRig(this, 120, SEA_Y - 30, 'yedidya', 0.55).setDepth(20);
    this.setGoal(n + 1, 'teddy', false);
    this.setTimer(this.t(26));
    this.useMistakes();
    this.input.on('pointerdown', () => this.hop());
    this.input.keyboard?.on('keydown-SPACE', () => this.hop());
    this.input.keyboard?.on('keydown-RIGHT', () => this.hop());
  }

  hop() {
    if (!this.playing || this.jumping) return;
    const nextIdx = this.at + 1;
    this.jumping = true;
    const toTeddy = nextIdx >= this.pillows.length;
    const tx = toTeddy ? 1130 : this.pillows[nextIdx].x;
    const fromY = this.yed.y;
    Audio.sfx('jump');
    this.yed.armsUp();
    this.tweens.add({ targets: this.yed, x: tx, duration: 380, ease: 'Linear' });
    this.tweens.add({
      targets: this.yed, y: fromY - 150, duration: 190, yoyo: true, ease: 'Quad.easeOut',
      onComplete: () => {
        if (!this.playing) return;
        if (toTeddy) {
          this.at = nextIdx;
          this.progress = this.goal;
          this.addProgress(0);
          return void this.win();
        }
        const p = this.pillows[nextIdx];
        if (this.safe(p)) {
          this.at = nextIdx;
          this.progress = nextIdx + 1;
          this.addProgress(0);
          dust(this, p.x, p.o.y, 4);
          Audio.sfx('boing');
          this.yed.idle();
          this.jumping = false;
        } else {
          // sank! fall into the Lego sea, then pop back to the previous spot
          splash(this, tx, SEA_Y, 10, 0xffca3a);
          this.yed.bumpLand();
          this.mistake(tx, SEA_Y - 140, 'אאוץ\'! לגו!');
          const back = this.at < 0 ? 120 : this.pillows[this.at].x;
          this.tweens.add({ targets: this.yed, y: SEA_Y + 20, duration: 200, onComplete: () => this.tweens.add({ targets: this.yed, x: back, y: SEA_Y - 60, duration: 500, ease: 'Back.easeOut', onComplete: () => (this.jumping = false) }) });
        }
      },
    });
  }

  tick() {
    for (const p of this.pillows) {
      const l = this.lift(p);
      p.o.y = SEA_Y - 20 - l * 30 + (l < -0.15 ? 40 : 0);
      p.o.setAlpha(l < -0.15 ? 0.45 : 1);
      p.ring.setFillStyle(l > -0.15 ? 0x8ac926 : 0xff595e).setY(p.o.y - 50);
    }
    if (!this.jumping) {
      const y = this.at < 0 ? SEA_Y - 30 : this.pillows[this.at].o.y - 10;
      this.yed.y = y;
      if (this.at >= 0 && !this.safe(this.pillows[this.at])) {
        // standing on a sinking pillow is fine — he just gets wet feet
        this.yed.setExpr('confused');
      }
    }
  }

  bot() {
    if (this.jumping) return;
    const next = this.pillows[this.at + 1];
    if (!next) return this.hop();
    // land ~0.38s from now: must be safe then (with a margin)
    if (this.safe(next, this.elapsed + 0.38) && this.lift(next, this.elapsed + 0.38) > 0.2) this.hop();
  }

  async winAnim() {
    Audio.sfx('zap');
    const cape = this.add.image(this.teddy.x, this.teddy.y + 10, 'cape_toy').setScale(0.5).setDepth(5);
    await tween(this, { targets: [this.teddy, cape], y: '-=500', duration: 900, ease: 'Quad.easeIn' });
    confetti(this, 1100, 250, 60);
    this.yed.celebrate();
    await wait(this, 700);
  }

  async loseAnim() {
    this.yed.setY(SEA_Y);
    await this.yed.bumpLand();
    this.teddy.tongue(1000);
    await wait(this, 800);
  }
}
