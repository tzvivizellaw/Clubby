// The standalone player, prebuilt by `npm run build:player` (vite.player.config.ts).
import bundle from '../generated/player-bundle.js?raw';

export const playerBundle: string = bundle;
