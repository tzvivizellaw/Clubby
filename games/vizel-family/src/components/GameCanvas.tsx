import { useEffect, useRef, useState } from 'react';
import { createGame } from '../engine/PhaserGame';

/** Hosts the single Phaser canvas (kept alive, hidden outside play). */
export function GameCanvas({ visible }: { visible: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    createGame(ref.current).then(() => setReady(true));
  }, []);
  return (
    <div className={`game-host ${visible ? 'visible' : 'hidden'}`} data-ready={ready ? '1' : '0'} data-testid="game-host">
      <div ref={ref} className="game-parent" />
      {visible && !ready && <div className="loading">טוען את הבלגן...</div>}
    </div>
  );
}
