import Phaser from 'phaser';
import { Audio } from '../../audio/AudioManager';
import { confetti, sparkle, tween, wait } from '../../animations/effects';
import { Living } from '../../animations/living';
import { CharacterRig } from '../../characters/CharacterRig';
import { BaseMiniGame } from '../../engine/BaseMiniGame';

const BAND = [
  { tex: 'cow', note: 60 },
  { tex: 'dog', note: 64 },
  { tex: 'frog', note: 67 },
  { tex: 'bird', note: 72 },
  { tex: 'lion', note: 55 },
];
// an original little tune the glowing animal suggests (indexes into BAND)
const TUNE = [0, 1, 2, 1, 0, 2, 3, 2, 1, 0, 4, 0, 1, 2, 3, 3];

/** E8 — tap animals to make music (no time pressure); a glow suggests the next note; finale dance. */
export default class E8_AnimalParty extends BaseMiniGame {
  band: Living[] = [];
  glow!: Phaser.GameObjects.Arc;
  step = 0;
  esti!: CharacterRig;

  setup() {
    this.step = 0;
    this.band = BAND.map((b, i) => {
      const o = new Living(this, 180 + i * 230, 470, b.tex, { scale: 1.9, eyes: false, mouth: false }).setDepth(10);
      o.tap(() => this.play(i), 1.2);
      return o;
    });
    this.glow = this.add.circle(0, 0, 110, 0xffe14d, 0.35).setDepth(5);
    this.tweens.add({ targets: this.glow, scale: 1.15, duration: 400, yoyo: true, repeat: -1 });
    this.esti = new CharacterRig(this, 640, 710, 'esti', 0.6).setDepth(12);
    this.esti.holdItem('star', 0.5);
    this.setGoal(this.n(28, 14), 'speaker');
    this.moveGlow();
  }

  moveGlow() {
    const o = this.band[TUNE[this.step % TUNE.length]];
    this.glow.setPosition(o.x, o.y);
  }

  play(i: number) {
    if (!this.playing) return;
    const o = this.band[i];
    Audio.note(BAND[i].note);
    this.tweens.add({ targets: o, y: 430, angle: { from: -12, to: 12 }, duration: 120, yoyo: true, onComplete: () => o.setAngle(0) });
    sparkle(this, o.x, o.y - 100, 4);
    this.esti.armR.setAngle(-150 + this.rnd(-20, 20));
    if (i === TUNE[this.step % TUNE.length]) this.step++;
    this.moveGlow();
    this.addProgress(1);
  }

  bot(dt: number) {
    this.botTimer -= dt;
    if (this.botTimer > 0) return;
    this.botTimer = 0.25;
    this.play(TUNE[this.step % TUNE.length]);
  }

  async winAnim() {
    this.glow.setVisible(false);
    Audio.music('party');
    this.band.forEach((o, i) => this.tweens.add({ targets: o, y: 420, angle: { from: -20, to: 20 }, duration: 220, yoyo: true, repeat: 6, delay: i * 70 }));
    confetti(this, 640, 250, 80);
    await this.esti.celebrate();
    await tween(this, { targets: this.esti, angle: 0, duration: 400 });
    await wait(this, 400);
  }
}
