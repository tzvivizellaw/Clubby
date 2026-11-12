import Phaser from 'phaser';

export const COLORS = [0xff595e, 0xffca3a, 0x8ac926, 0x1982c4, 0x6a4c93, 0xff7bd5, 0x3ee6d5];
export const FONT = 'Rubik, "Varela Round", Arial, sans-serif';

export function tween(scene: Phaser.Scene, cfg: Phaser.Types.Tweens.TweenBuilderConfig): Promise<void> {
  return new Promise((res) => {
    scene.tweens.add({ ...cfg, onComplete: (...a: any[]) => { (cfg.onComplete as any)?.(...a); res(); } });
  });
}

export function wait(scene: Phaser.Scene, ms: number): Promise<void> {
  return new Promise((res) => scene.time.delayedCall(ms, () => res()));
}

/** Confetti burst (uses generated 'px_confetti' texture). */
export function confetti(scene: Phaser.Scene, x: number, y: number, n = 40, spread = 1) {
  for (let i = 0; i < n; i++) {
    const p = scene.add.image(x, y, 'px_confetti').setTint(Phaser.Utils.Array.GetRandom(COLORS)).setDepth(900);
    p.setScale(0.6 + Math.random() * 0.8, 0.4 + Math.random() * 0.6);
    const ang = Math.random() * Math.PI * 2;
    const sp = (120 + Math.random() * 320) * spread;
    const dx = Math.cos(ang) * sp;
    const dy = Math.sin(ang) * sp - 200;
    scene.tweens.add({ targets: p, x: x + dx, duration: 1300 + Math.random() * 600, ease: 'Quad.easeOut' });
    scene.tweens.add({
      targets: p, y: y + dy + 500, angle: Phaser.Math.Between(-720, 720), alpha: 0,
      duration: 1400 + Math.random() * 600, ease: 'Quad.easeIn', onComplete: () => p.destroy(),
    });
  }
}

export function stars(scene: Phaser.Scene, x: number, y: number, ms = 1500) {
  const group: Phaser.GameObjects.Image[] = [];
  for (let i = 0; i < 3; i++) group.push(scene.add.image(x, y, 'px_star').setDepth(901).setScale(0.8).setTint(0xffe14d));
  const start = scene.time.now;
  const ev = scene.time.addEvent({
    loop: true, delay: 16,
    callback: () => {
      const t = (scene.time.now - start) / 300;
      group.forEach((s, i) => {
        const a = t + (i * Math.PI * 2) / 3;
        s.setPosition(x + Math.cos(a) * 46, y + Math.sin(a) * 14).setAngle(t * 90);
      });
    },
  });
  scene.time.delayedCall(ms, () => {
    ev.remove();
    group.forEach((s) => s.destroy());
  });
}

export function dust(scene: Phaser.Scene, x: number, y: number, n = 8) {
  for (let i = 0; i < n; i++) {
    const d = scene.add.image(x, y, 'px_dust').setDepth(890).setAlpha(0.8).setScale(0.4 + Math.random() * 0.5);
    scene.tweens.add({
      targets: d, x: x + Phaser.Math.Between(-90, 90), y: y - Phaser.Math.Between(5, 50),
      scale: d.scale * 2.2, alpha: 0, duration: 600 + Math.random() * 300, onComplete: () => d.destroy(),
    });
  }
}

export function splash(scene: Phaser.Scene, x: number, y: number, n = 10, tint = 0x5ec8ff) {
  for (let i = 0; i < n; i++) {
    const d = scene.add.image(x, y, 'px_drop').setDepth(890).setTint(tint).setScale(0.6);
    const vx = Phaser.Math.Between(-140, 140);
    scene.tweens.add({ targets: d, x: x + vx, duration: 500 });
    scene.tweens.add({ targets: d, y: y - Phaser.Math.Between(40, 120), duration: 250, ease: 'Quad.easeOut', yoyo: true, onComplete: () => d.destroy() });
  }
}

export function shake(scene: Phaser.Scene, intensity = 0.012, ms = 280) {
  scene.cameras.main.shake(ms, intensity);
}

export function zoomPunch(scene: Phaser.Scene, z = 1.12, ms = 160) {
  const cam = scene.cameras.main;
  scene.tweens.add({ targets: cam, zoom: z, duration: ms, yoyo: true, ease: 'Quad.easeOut' });
}

export function flash(scene: Phaser.Scene, color = 0xffffff, ms = 120) {
  const r = scene.add.rectangle(640, 360, 1400, 800, color).setDepth(999).setAlpha(0.7).setScrollFactor(0);
  scene.tweens.add({ targets: r, alpha: 0, duration: ms * 3, onComplete: () => r.destroy() });
}

export function popText(scene: Phaser.Scene, x: number, y: number, text: string, color = '#ffffff', size = 40) {
  const t = scene.add
    .text(x, y, text, { fontFamily: FONT, fontSize: `${size}px`, color, fontStyle: '900', stroke: '#2b1d3a', strokeThickness: 8, rtl: true } as any)
    .setOrigin(0.5).setDepth(950).setScale(0.2);
  scene.tweens.add({ targets: t, scale: 1, duration: 220, ease: 'Back.easeOut' });
  scene.tweens.add({ targets: t, y: y - 70, alpha: 0, delay: 650, duration: 450, onComplete: () => t.destroy() });
  return t;
}

export function zzz(scene: Phaser.Scene, x: number, y: number) {
  const t = scene.add.text(x, y, 'Z', { fontFamily: FONT, fontSize: '30px', color: '#cfe8ff', fontStyle: '900', stroke: '#2b1d3a', strokeThickness: 5 }).setDepth(905);
  scene.tweens.add({ targets: t, x: x + 30, y: y - 60, scale: 1.6, alpha: 0, duration: 1300, onComplete: () => t.destroy() });
}

export function sparkle(scene: Phaser.Scene, x: number, y: number, n = 6) {
  for (let i = 0; i < n; i++) {
    const s = scene.add.image(x, y, 'px_star').setDepth(905).setScale(0.3).setTint(0xfff3a0);
    scene.tweens.add({
      targets: s, x: x + Phaser.Math.Between(-60, 60), y: y + Phaser.Math.Between(-60, 60), scale: 0.7, alpha: 0, angle: 180,
      duration: 500 + Math.random() * 300, onComplete: () => s.destroy(),
    });
  }
}

/** Squash & stretch a game object around its current scale. */
export function squash(scene: Phaser.Scene, obj: any, amt = 0.25, ms = 120) {
  const sx = obj.scaleX, sy = obj.scaleY;
  scene.tweens.add({ targets: obj, scaleX: sx * (1 + amt), scaleY: sy * (1 - amt), duration: ms, yoyo: true, ease: 'Quad.easeOut', onComplete: () => obj.setScale?.(sx, sy) });
}

export function explodeIntoConfetti(scene: Phaser.Scene, obj: any, n = 50) {
  scene.tweens.add({
    targets: obj, scale: (obj.scale ?? 1) * 1.4, duration: 180, yoyo: false,
    onComplete: () => {
      confetti(scene, obj.x, obj.y, n);
      obj.setVisible(false);
    },
  });
}
