import Phaser from 'phaser';
import { Audio } from '../audio/AudioManager';
import { confetti, dust, shake, stars, tween, wait } from '../animations/effects';
import { Living } from '../animations/living';
import { drawBackground } from '../assets/backgrounds';
import { CharacterRig } from '../characters/CharacterRig';
import type { PlayerId } from '../data/characters';
import { bubble, button, text } from '../engine/ui';

export interface GameOverData {
  player: PlayerId;
  cleared: number;
  onRetry: () => void;
  onMap: () => void;
  fast?: boolean;
}

/** Funny Game Over: the house mess literally buries the player, dad just wanted 5 minutes of quiet. */
export class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOver');
  }

  async create(d: GameOverData) {
    this.cameras.main.setBackgroundColor('#2b1d3a').fadeIn(250);
    drawBackground(this, 'livingRoom');
    Audio.music(null);
    Audio.sfx('lose');
    const kid = new CharacterRig(this, 520, 650, d.player, 1).setDepth(10);
    const dad = new CharacterRig(this, 900, 650, 'father', 0.9).setDepth(10).face2(-1);
    kid.setExpr('shock');
    const hearts = [0, 1, 2].map((i) => this.add.image(560 + i * 80, 120, 'heart').setDepth(20));
    const ff = d.fast ? 0.1 : 1;
    await wait(this, 400 * ff);
    for (const h of hearts) {
      Audio.sfx('heartLost');
      await tween(this, { targets: h, scaleX: 0, angle: 30, y: 200, alpha: 0, duration: 260 * ff });
    }
    // the pile falls
    const pile = new Living(this, 520, -200, 'laundrypile', { scale: 1.6, eyeY: -0.15, mood: 'tongue' }).setDepth(15);
    await tween(this, { targets: pile, y: 590, duration: 500 * ff, ease: 'Bounce.easeOut' });
    shake(this, 0.03, 400);
    dust(this, 520, 640, 14);
    Audio.sfx('crash');
    kid.setVisible(false);
    stars(this, 520, 420, 2500);
    const t = text(this, 640, 260, 'הבלגן ניצח!', 96, '#ff595e', 14).setDepth(30).setScale(0.2);
    await tween(this, { targets: t, scale: 1, angle: -4, duration: 400 * ff, ease: 'Back.easeOut' });
    dad.shock();
    const b = bubble(this, 900, 330, 'אני רק רציתי חמש דקות שקט!', { size: 28 });
    Audio.say('father.five_minutes_quiet');
    await wait(this, 1800 * ff);
    b.destroy();
    // the kid pops out of the pile laughing
    kid.setVisible(true).setExpr('laugh');
    kid.y = 560;
    Audio.sfx('boing');
    await tween(this, { targets: kid, y: 650, duration: 400 * ff, ease: 'Bounce.easeOut' });
    confetti(this, 520, 400, 30);
    text(this, 640, 360, `עברת ${d.cleared} שלבים בריצה הזאת · ההתקדמות נשמרה ✔`, 30, '#ffffff', 6).setDepth(30);
    button(this, 470, 460, 'עוד ריצה!', () => d.onRetry(), { color: 0x8ac926, w: 280 });
    button(this, 810, 460, 'למפה', () => d.onMap(), { color: 0x4cc9f0, w: 240 });
    this.registry.set('gameOverReady', true);
  }
}
