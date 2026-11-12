import Phaser from 'phaser';
import { BootScene, IdleScene } from '../scenes/BootScene';
import { GameOverScene } from '../scenes/GameOverScene';
import { StoryScene } from '../scenes/StoryScene';
import { director } from './RunDirector';

let game: Phaser.Game | null = null;
let readyP: Promise<Phaser.Game> | null = null;

/** Create the single Phaser instance (kept alive for the whole session). */
export function createGame(parent: HTMLElement): Promise<Phaser.Game> {
  if (readyP) return readyP;
  readyP = new Promise((resolve) => {
    game = new Phaser.Game({
      type: Phaser.AUTO,
      parent,
      width: 1280,
      height: 720,
      backgroundColor: '#2b1d3a',
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
      physics: { default: 'arcade', arcade: { gravity: { x: 0, y: 0 }, debug: false } },
      input: { activePointers: 3 },
      render: { antialias: true, roundPixels: false },
      banner: false,
      scene: [BootScene, IdleScene, StoryScene, GameOverScene],
    });
    director.attach(game);
    game.events.once('vizel-ready', () => resolve(game!));
  });
  return readyP;
}

export function getGame() {
  return game;
}
