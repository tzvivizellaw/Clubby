import Phaser from 'phaser';
import { Audio } from '../../audio/AudioManager';
import { confetti, dust, explodeIntoConfetti, flash, popText, shake, tween, wait } from '../../animations/effects';
import { Living } from '../../animations/living';
import { CharacterRig } from '../../characters/CharacterRig';
import { BaseMiniGame, W } from '../../engine/BaseMiniGame';

interface Enemy {
  o: Living;
  kind: 'pillow' | 'vacuum' | 'boss' | 'dust';
  hp: number;
  vx: number;
  vy: number;
}

const ARENA = { x0: 60, x1: 1220, y0: 200, y1: 690 };

/** D2 — move & dodge; Daniel auto-fires foam balls; robot vacuum becomes a giant boss. */
export default class D2_HouseBrawl extends BaseMiniGame {
  dan!: CharacterRig;
  target = { x: 640, y: 560 };
  enemies: Enemy[] = [];
  balls: { o: Phaser.GameObjects.Image; vx: number; vy: number }[] = [];
  fireT = 0;
  spawnT = 1;
  kills = 0;
  killGoal = 8;
  boss?: Enemy;
  bossMax = 10;
  inv = 0;
  hpG!: Phaser.GameObjects.Graphics;

  setup() {
    this.enemies = [];
    this.balls = [];
    this.kills = 0;
    this.boss = undefined;
    this.inv = 0;
    this.fireT = 0;
    this.spawnT = 1;
    this.killGoal = this.n(8, 4);
    this.bossMax = this.n(10, 5);
    this.dan = new CharacterRig(this, 640, 600, 'daniel', 0.55).setDepth(30);
    this.target = { x: 640, y: 600 };
    this.hpG = this.add.graphics().setDepth(80);
    this.setGoal(this.killGoal, 'pillow_r', false);
    this.useMistakes();
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => (this.target = { x: p.x, y: p.y }));
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => p.isDown && (this.target = { x: p.x, y: p.y }));
  }

  spawnEnemy() {
    const pillow = Math.random() < 0.6;
    const side = Math.random() < 0.5 ? -1 : 1;
    const x = side < 0 ? 40 : W - 40;
    const y = pillow ? this.rnd(220, 420) : this.rnd(450, 680);
    const o = new Living(this, x, y, pillow ? this.pick(['pillow_r', 'pillow_b', 'pillow_y']) : 'vacuum', { scale: (pillow ? 0.75 : 0.9) * this.diff.size, mood: 'angry' }).setDepth(20);
    const sp = this.s(pillow ? 170 : 120);
    this.enemies.push({ o, kind: pillow ? 'pillow' : 'vacuum', hp: pillow ? 1 : 2, vx: -side * sp, vy: pillow ? this.rnd(-1, 1) * sp * 0.7 : 0 });
  }

  spawnBoss() {
    flash(this, 0xffffff);
    shake(this, 0.02, 500);
    Audio.sfx('roar');
    popText(this, 640, 300, 'השואב הענק!', '#ff595e', 60);
    const o = new Living(this, 640, -120, 'vacuum', { scale: 2.6, mood: 'angry', eyeSpread: 30 }).setDepth(22);
    this.tweens.add({ targets: o, y: 330, duration: 800, ease: 'Bounce.easeOut' });
    this.boss = { o, kind: 'boss', hp: this.bossMax, vx: this.s(110), vy: 0 };
    this.enemies.push(this.boss);
    this.drawBossHp();
  }

  drawBossHp() {
    const g = this.hpG.clear();
    if (!this.boss) return;
    g.fillStyle(0x2b1d3a).fillRoundedRect(440, 140, 400, 24, 10);
    g.fillStyle(0xff595e).fillRoundedRect(444, 144, 392 * (this.boss.hp / this.bossMax), 16, 8);
  }

  fire() {
    const live = this.enemies.filter((e) => e.kind !== 'dust' && e.o.active);
    if (!live.length) return;
    const t = live.sort((a, b) => Phaser.Math.Distance.Between(a.o.x, a.o.y, this.dan.x, this.dan.y) - Phaser.Math.Distance.Between(b.o.x, b.o.y, this.dan.x, this.dan.y))[0];
    const sx = this.dan.x, sy = this.dan.y - 120;
    const a = Math.atan2(t.o.y - sy, t.o.x - sx);
    const o = this.add.image(sx, sy, 'foam').setDepth(25);
    this.balls.push({ o, vx: Math.cos(a) * 700, vy: Math.sin(a) * 700 });
    this.dan.face2(t.o.x < sx ? -1 : 1);
    Audio.sfx('shoot');
  }

  hurt(e: Enemy) {
    e.hp--;
    e.o.setMood('shock', 300);
    Audio.sfx('hit');
    if (e.kind === 'boss') {
      this.drawBossHp();
      this.tweens.add({ targets: e.o, scaleX: 2.8, duration: 60, yoyo: true });
    }
    if (e.hp > 0) return;
    this.enemies.splice(this.enemies.indexOf(e), 1);
    if (e.kind === 'boss') {
      this.boss = undefined;
      return void this.win();
    }
    dust(this, e.o.x, e.o.y, 6);
    this.tweens.add({ targets: e.o, scale: 0, angle: 360, duration: 250, onComplete: () => e.o.destroy() });
    if (e.kind !== 'dust') {
      this.kills++;
      this.addProgress(1);
      if (this.kills >= this.killGoal && !this.boss) this.spawnBoss();
    }
  }

  tick(dt: number) {
    // movement
    if (this.cursors) {
      const k = this.cursors;
      const d = 520 * dt;
      if (k.left.isDown) this.target.x = this.dan.x - 60;
      if (k.right.isDown) this.target.x = this.dan.x + 60;
      if (k.up.isDown) this.target.y = this.dan.y - 60;
      if (k.down.isDown) this.target.y = this.dan.y + 60;
      void d;
    }
    const tx = Phaser.Math.Clamp(this.target.x, ARENA.x0, ARENA.x1), ty = Phaser.Math.Clamp(this.target.y, ARENA.y0 + 130, ARENA.y1);
    const dx = tx - this.dan.x, dy = ty - this.dan.y;
    const dist = Math.hypot(dx, dy);
    const sp = 460 * dt;
    if (dist > 4) {
      this.dan.x += (dx / dist) * Math.min(sp, dist);
      this.dan.y += (dy / dist) * Math.min(sp, dist);
    }
    this.dan.setDepth(30 + this.dan.y / 100);
    this.inv -= dt;
    this.dan.setAlpha(this.inv > 0 ? 0.5 + 0.5 * Math.sin(this.elapsed * 40) : 1);
    // spawning
    if (!this.boss && this.kills < this.killGoal) {
      this.spawnT -= dt;
      if (this.spawnT <= 0 && this.enemies.length < (this.isEasy ? 3 : 5)) {
        this.spawnEnemy();
        this.spawnT = (this.isEasy ? 1.6 : 1.1) / this.diff.speed;
      }
    }
    // firing
    this.fireT -= dt;
    if (this.fireT <= 0) {
      this.fire();
      this.fireT = this.isEasy ? 0.35 : 0.45;
    }
    // enemies
    for (const e of [...this.enemies]) {
      if (e.kind === 'vacuum') {
        const a = Math.atan2(this.dan.y - 40 - e.o.y, this.dan.x - e.o.x);
        const v = this.s(120);
        e.o.x += Math.cos(a) * v * dt;
        e.o.y += Math.sin(a) * v * dt;
        e.o.lookAt(this.dan.x, this.dan.y);
      } else if (e.kind === 'boss') {
        e.o.x += e.vx * dt;
        if (e.o.x < 260 || e.o.x > 1020) e.vx *= -1;
        if (Math.random() < dt * (this.isEasy ? 0.5 : 0.9)) {
          // boss spits a dust bunny at Daniel
          const o = new Living(this, e.o.x, e.o.y + 40, 'px_dust', { scale: 1.6, eyeSize: 4, eyeSpread: 6, mood: 'angry' }).setDepth(24);
          const a = Math.atan2(this.dan.y - 100 - o.y, this.dan.x - o.x);
          const v = this.s(260);
          this.enemies.push({ o, kind: 'dust', hp: 1, vx: Math.cos(a) * v, vy: Math.sin(a) * v });
        }
      } else {
        e.o.x += e.vx * dt;
        e.o.y += e.vy * dt;
        if (e.kind === 'pillow') {
          if (e.o.y < ARENA.y0 || e.o.y > ARENA.y1) e.vy *= -1;
          if (e.o.x < ARENA.x0 || e.o.x > ARENA.x1) e.vx *= -1;
          e.o.angle += 90 * dt;
        } else if (e.o.x < -80 || e.o.x > W + 80 || e.o.y < 0 || e.o.y > 760) {
          this.enemies.splice(this.enemies.indexOf(e), 1);
          e.o.destroy();
          continue;
        }
      }
      // collision with Daniel
      const r = e.kind === 'boss' ? 120 : 60;
      if (this.inv <= 0 && Phaser.Math.Distance.Between(e.o.x, e.o.y, this.dan.x, this.dan.y - 90) < r) {
        this.inv = 1.4;
        this.dan.hit();
        this.mistake(this.dan.x, this.dan.y - 200, 'אאוץ\'!');
        if (e.kind !== 'boss') this.hurt(e);
      }
    }
    // foam balls
    for (const b of [...this.balls]) {
      b.o.x += b.vx * dt;
      b.o.y += b.vy * dt;
      const hit = this.enemies.find((e) => Phaser.Math.Distance.Between(e.o.x, e.o.y, b.o.x, b.o.y) < (e.kind === 'boss' ? 110 : 55));
      if (hit || b.o.x < -20 || b.o.x > W + 20 || b.o.y < 0 || b.o.y > 740) {
        this.balls.splice(this.balls.indexOf(b), 1);
        b.o.destroy();
        if (hit) this.hurt(hit);
      }
    }
  }

  bot(dt: number) {
    this.botTimer -= dt;
    if (this.botTimer > 0) return;
    this.botTimer = 0.1;
    let fx = (640 - this.dan.x) * 0.3, fy = (560 - this.dan.y) * 0.3;
    for (const e of this.enemies) {
      const dx = this.dan.x - e.o.x, dy = this.dan.y - 90 - e.o.y;
      const d = Math.max(30, Math.hypot(dx, dy));
      const range = e.kind === 'boss' ? 380 : 260;
      if (d < range) {
        const w = ((range - d) / range) * 600;
        fx += (dx / d) * w;
        fy += (dy / d) * w;
      }
    }
    this.target = { x: this.dan.x + fx, y: this.dan.y + fy };
  }

  async winAnim() {
    this.hpG.clear();
    const b = this.enemies.find((e) => e.kind === 'boss')?.o ?? this.children.list.find((c) => c instanceof Living && (c as Living).img.texture.key === 'vacuum' && (c as Living).scale > 2);
    if (b) explodeIntoConfetti(this, b, 120);
    dust(this, 640, 330, 20);
    Audio.sfx('confetti');
    confetti(this, 640, 300, 60);
    this.dan.setAlpha(1).celebrate();
    await wait(this, 1600);
  }

  async loseAnim() {
    const v = new Living(this, this.dan.x + 200, this.dan.y - 60, 'vacuum', { scale: 1.8, mood: 'happy' }).setDepth(60);
    Audio.sfx('snore');
    const sock = this.add.image(this.dan.x, this.dan.y - 20, 'sock_r').setDepth(61).setScale(0.6);
    await tween(this, { targets: sock, x: v.x, y: v.y, scale: 0.1, angle: 720, duration: 700 });
    v.tongue(1000);
    this.dan.setExpr('shock');
    await wait(this, 1000);
  }
}
