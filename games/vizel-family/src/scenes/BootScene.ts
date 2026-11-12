import Phaser from 'phaser';
import { makeLegTexture } from '../animations/living';
import { OBJ } from '../assets/objects';
import { TEX_RES } from '../characters/CharacterRig';
import { LOOKS, PART_SIZE, armMarkup, bodyMarkup, capeMarkup, headMarkup, legMarkup, svgDoc, svgUri } from '../characters/parts';
import type { CastId } from '../data/characters';

/** Rasterises all original SVG art into textures + loads optional photo heads. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    const cast = Object.keys(LOOKS) as CastId[];
    for (const id of cast) {
      const L = LOOKS[id];
      const body = L.skirt ? PART_SIZE.bodySkirt : PART_SIZE.bodyPants;
      this.load.svg(`ch_${id}_head`, svgUri(svgDoc(headMarkup(id), PART_SIZE.head.w, PART_SIZE.head.h)), { scale: TEX_RES });
      this.load.svg(`ch_${id}_body`, svgUri(svgDoc(bodyMarkup(id), body.w, body.h)), { scale: TEX_RES });
      this.load.svg(`ch_${id}_arm`, svgUri(svgDoc(armMarkup(id), PART_SIZE.arm.w, PART_SIZE.arm.h)), { scale: TEX_RES });
      this.load.svg(`ch_${id}_leg`, svgUri(svgDoc(legMarkup(id), PART_SIZE.leg.w, PART_SIZE.leg.h)), { scale: TEX_RES });
      if (L.cape) this.load.svg(`ch_${id}_cape`, svgUri(svgDoc(capeMarkup(id), PART_SIZE.cape.w, PART_SIZE.cape.h)), { scale: TEX_RES });
    }
    for (const [k, o] of Object.entries(OBJ)) this.load.svg(k, svgUri(svgDoc(o.svg, o.w, o.h)), { scale: 1 });
    // Optional personal art: public/assets/characters/manifest.json -> { "father": { "head": "father/head.png", "hideFace": true } }
    this.load.json('charManifest', './assets/characters/manifest.json');
    this.load.on('loaderror', () => {
      /* a missing optional file must never break boot */
    });
  }

  create() {
    // particle textures
    const g = this.add.graphics();
    g.fillStyle(0xffffff).fillRect(0, 0, 14, 8);
    g.generateTexture('px_confetti', 14, 8);
    g.clear();
    g.fillStyle(0xffffff);
    const pts: Phaser.Math.Vector2[] = [];
    for (let i = 0; i < 10; i++) {
      const r = i % 2 ? 9 : 22;
      const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
      pts.push(new Phaser.Math.Vector2(24 + Math.cos(a) * r, 24 + Math.sin(a) * r));
    }
    g.fillPoints(pts, true);
    g.lineStyle(3, 0x2b1d3a).strokePoints(pts, true);
    g.generateTexture('px_star', 48, 48);
    g.clear();
    g.fillStyle(0xe9e3d5).fillCircle(16, 16, 16);
    g.generateTexture('px_dust', 32, 32);
    g.clear();
    g.fillStyle(0xffffff).fillCircle(10, 16, 9).fillTriangle(1, 13, 19, 13, 10, 0);
    g.generateTexture('px_drop', 20, 26);
    g.destroy();
    makeLegTexture(this);

    const man = this.cache.json.get('charManifest') as Record<string, { head?: string; hideFace?: boolean }> | undefined;
    const hide: Record<string, boolean> = {};
    let pending = 0;
    if (man && typeof man === 'object') {
      for (const [id, v] of Object.entries(man)) {
        if (!v?.head || id.startsWith('_')) continue;
        hide[id] = v.hideFace ?? true;
        this.load.image(`photo_head_${id}`, `./assets/characters/${v.head}`);
        pending++;
      }
    }
    this.registry.set('photoHideFace', hide);
    const done = () => this.game.events.emit('vizel-ready');
    if (pending) {
      this.load.once('complete', done);
      this.load.start();
    } else done();
    this.scene.start('Idle');
  }
}

export class IdleScene extends Phaser.Scene {
  constructor() {
    super('Idle');
  }
  create() {
    this.cameras.main.setBackgroundColor('#2b1d3a');
  }
}
