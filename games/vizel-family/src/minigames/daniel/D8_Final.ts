import Phaser from 'phaser';
import { Audio } from '../../audio/AudioManager';
import { confetti, dust, explodeIntoConfetti, popText, shake, tween, wait } from '../../animations/effects';
import { Living } from '../../animations/living';
import { CharacterRig } from '../../characters/CharacterRig';
import { BaseMiniGame } from '../../engine/BaseMiniGame';
import { TXT } from '../../engine/ui';

const B0 = { x: 230, y: 560 };
const G = 900;
const MAXV = 1300;
type Obst = 'none' | 'wind' | 'blocker';

/** D8 — championship final: flick shots at a giant moving hoop with a face; a new obstacle every shot. */
export default class D8_Final extends BaseMiniGame {
  boss!: Living;
  ball!: Phaser.GameObjects.Image;
  hp = 5;
  hpMax = 5;
  hpG!: Phaser.GameObjects.Graphics;
  flying = false;
  vx = 0;
  vy = 0;
  scored = false;
  flyT = 0;
  obst: Obst = 'none';
  wind = 0;
  windText!: Phaser.GameObjects.Text;
  yed!: CharacterRig;
  downAt: { x: number; y: number; t: number } | null = null;
  shotN = 0;

  bossPos(t = this.elapsed) {
    const sp = this.diff.speed;
    return { x: 960 + Math.sin(t * 0.7 * sp) * 150, y: 300 + Math.sin(t * 1.3 * sp) * 60 };
  }
  rim(t = this.elapsed) {
    const p = this.bossPos(t);
    return { x: p.x, y: p.y + 28 };
  }
  blockerY(t = this.elapsed) {
    return 470 - Math.abs(Math.sin(t * 2.4)) * 220;
  }

  setup() {
    this.hpMax = this.hp = this.n(5, 3);
    this.flying = false;
    this.shotN = 0;
    this.boss = new Living(this, 960, 300, 'bighoop', { scale: 0.75, eyes: false, mouth: false }).setDepth(8);
    this.ball = this.add.image(B0.x, B0.y, 'basketball').setDepth(15).setScale(0.8);
    this.hpG = this.add.graphics().setDepth(30);
    this.windText = this.add.text(640, 140, '', TXT(30, '#4cc9f0')).setOrigin(0.5).setDepth(30);
    this.yed = new CharacterRig(this, 640, 470, 'yedidya', 0.45).setDepth(12).setVisible(false);
    new CharacterRig(this, 120, 700, 'daniel', 0.6).setDepth(10);
    this.drawHp();
    this.setTimer(this.t(55));
    this.newObstacle();
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => this.playing && !this.flying && (this.downAt = { x: p.x, y: p.y, t: this.time.now }));
    this.input.on('pointerup', (p: Phaser.Input.Pointer) => {
      if (!this.downAt || this.flying || !this.playing) return;
      const dx = p.x - this.downAt.x, dy = p.y - this.downAt.y;
      this.downAt = null;
      if (Math.hypot(dx, dy) < 30) return;
      let vx = dx * 3.4, vy = dy * 3.4;
      const m = Math.hypot(vx, vy);
      if (m > MAXV) {
        vx *= MAXV / m;
        vy *= MAXV / m;
      }
      this.launch(vx, vy);
    });
  }

  drawHp() {
    const g = this.hpG.clear();
    g.fillStyle(0x2b1d3a).fillRoundedRect(840, 112, 260, 22, 10);
    g.fillStyle(0xff595e).fillRoundedRect(844, 116, 252 * (this.hp / this.hpMax), 14, 7);
  }

  newObstacle() {
    this.shotN++;
    const pool: Obst[] = this.isEasy ? ['none', 'wind'] : ['none', 'wind', 'blocker'];
    this.obst = this.shotN === 1 ? 'none' : this.pick(pool);
    this.wind = this.obst === 'wind' ? this.pick([-1, 1]) * this.rnd(150, 300) : 0;
    this.windText.setText(this.obst === 'wind' ? (this.wind > 0 ? 'רוח ⟵⟵' : 'רוח ⟶⟶') : this.obst === 'blocker' ? 'ידידיה קופץ!' : '');
    // RTL display: arrow text describes direction visually
    if (this.obst === 'wind') this.windText.setText(this.wind > 0 ? 'רוח ימינה ➜' : '⬅ רוח שמאלה');
    this.yed.setVisible(this.obst === 'blocker');
  }

  launch(vx: number, vy: number) {
    if (this.flying || !this.playing) return;
    this.flying = true;
    this.scored = false;
    this.flyT = 0;
    this.vx = vx;
    this.vy = vy;
    Audio.sfx('whoosh');
  }

  endShot(made: boolean) {
    this.flying = false;
    if (made) {
      this.hp--;
      this.drawHp();
      Audio.sfx('ding');
      shake(this, 0.012, 200);
      confetti(this, this.ball.x, this.ball.y, 30);
      popText(this, this.boss.x, this.boss.y - 140, this.pick(['שלשה!', 'סל!', 'אאוץ\'!']), '#ffe14d', 44);
      this.boss.setMood('shock', 600);
      if (this.hp <= 0) return void this.win();
    } else {
      this.boss.setMood('tongue', 700);
      Audio.sfx('laugh');
    }
    this.ball.setPosition(B0.x, B0.y).setAngle(0);
    this.newObstacle();
  }

  /** shared flight integrator (used by the real ball and the bot's prediction) */
  stepBall(s: { x: number; y: number; vx: number; vy: number; t: number }, dt: number) {
    s.vy += G * dt;
    s.vx += this.wind * dt;
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    s.t += dt;
    if (this.obst === 'blocker' && Math.abs(s.x - 640) < 40 && Math.abs(s.y - (this.blockerY(s.t) - 80)) < 90) {
      s.vx = -Math.abs(s.vx) * 0.5;
      return 'blocked';
    }
    return null;
  }

  /** fixed sub-steps keep the ball physics identical at any frame rate (and match the bot's prediction) */
  tick(dt: number) {
    const n = Math.max(1, Math.ceil(dt / (1 / 120)));
    const h = dt / n;
    const e0 = this.elapsed - dt;
    for (let i = 0; i < n && this.playing; i++) {
      this.elapsed = e0 + (i + 1) * h;
      this.tickStep(h);
    }
  }

  tickStep(dt: number) {
    const bp = this.bossPos();
    this.boss.setPosition(bp.x, bp.y);
    if (this.obst === 'blocker') this.yed.setPosition(640, this.blockerY());
    if (!this.flying) return;
    this.flyT += dt;
    const s = { x: this.ball.x, y: this.ball.y, vx: this.vx, vy: this.vy, t: this.elapsed };
    const py = s.y;
    if (this.stepBall(s, dt) === 'blocked') {
      this.yed.hit();
      dust(this, s.x, s.y, 4);
    }
    this.ball.setPosition(s.x, s.y);
    this.vx = s.vx;
    this.vy = s.vy;
    this.ball.angle += 400 * dt;
    const r = this.rim();
    if (!this.scored && py < r.y && s.y >= r.y && Math.abs(s.x - r.x) < 42) {
      this.scored = true;
      this.endShot(true);
    } else if (s.y > 720 || s.x > 1320 || s.x < -60 || this.flyT > 4) this.endShot(false);
  }

  bot() {
    if (this.flying) return;
    const dt = 1 / 120;
    for (let T = 0.6; T <= 1.6; T += 0.05) {
      const r = this.rim(this.elapsed + T);
      const vx = (r.x - B0.x - 0.5 * this.wind * T * T) / T;
      const vy = (r.y - B0.y - 0.5 * G * T * T) / T;
      if (Math.hypot(vx, vy) > MAXV * 0.98 || vy + G * T < 120) continue;
      // verify with the same integrator (blocker!)
      const s = { x: B0.x, y: B0.y, vx, vy, t: this.elapsed };
      let ok = false;
      for (let i = 0; i < 400; i++) {
        const py = s.y;
        if (this.stepBall(s, dt) === 'blocked') break;
        const rr = this.rim(s.t);
        if (py < rr.y && s.y >= rr.y && Math.abs(s.x - rr.x) < 30) {
          ok = true;
          break;
        }
        if (s.y > 720) break;
      }
      if (ok) return this.launch(vx, vy);
    }
  }

  async winAnim() {
    explodeIntoConfetti(this, this.boss, 140);
    Audio.sfx('confetti');
    confetti(this, 640, 300, 80);
    popText(this, 640, 330, 'אלופי המשפחה!', '#ffe14d', 60);
    await wait(this, 1700);
  }

  async loseAnim() {
    this.ball.setPosition(this.boss.x - 200, this.boss.y + 100);
    await tween(this, { targets: this.ball, x: this.boss.x, y: this.boss.y, scale: 0.2, duration: 400 });
    Audio.sfx('buzz');
    this.boss.setMood('happy');
    popText(this, this.boss.x, this.boss.y - 160, 'גראפּ!', '#8ac926', 48);
    await wait(this, 1200);
  }
}
