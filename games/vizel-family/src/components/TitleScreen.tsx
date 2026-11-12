import { useEffect, useState } from 'react';
import { useApp } from '../app/store';
import { Audio } from '../audio/AudioManager';
import { CharacterArt, ObjArt } from './Art';

/** Opening: family photo, then chaos after 2 seconds. */
export function TitleScreen() {
  const setScreen = useApp((s) => s.setScreen);
  const [chaos, setChaos] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => {
      setChaos(true);
      Audio.sfx('crash');
    }, 2000);
    return () => clearTimeout(t);
  }, []);
  const start = () => {
    Audio.unlock();
    Audio.sfx('confetti');
    Audio.music('menu');
    setScreen('select');
  };
  return (
    <div className={`screen title-screen ${chaos ? 'chaos' : ''}`}>
      <div className="title-sky" />
      <h1 className="logo">
        <span className="logo-top">משפחת ויזל</span>
        <span className="logo-bottom">הבלגן מתחיל!</span>
      </h1>
      <div className="family-photo">
        <div className="fp fp-mother"><CharacterArt id="mother" pose={{ expr: chaos ? 'smug' : 'smile', relative: true }} /></div>
        <div className="fp fp-father">
          <CharacterArt id="father" pose={{ expr: chaos ? 'dizzy' : 'happy', relative: true, armR: chaos ? 120 : 30 }} />
          {chaos && <div className="stars-ring">⭐ ⭐ ⭐</div>}
        </div>
        <div className="fp fp-avigail">
          <CharacterArt id="avigail" pose={{ expr: chaos ? 'shout' : 'happy', relative: true, armL: chaos ? 150 : 8, armR: chaos ? 150 : 8 }} />
          {chaos && <div className="shout-bubble">ילדים!!!</div>}
        </div>
        <div className="fp fp-daniel"><CharacterArt id="daniel" pose={{ expr: chaos ? 'shock' : 'happy', relative: true, armR: 160 }} /></div>
        <div className="fp fp-yedidya"><CharacterArt id="yedidya" pose={{ expr: 'laugh', relative: true, armR: chaos ? 170 : 8, armL: chaos ? 170 : 8 }} /></div>
        <div className="fp fp-esti"><CharacterArt id="esti" pose={{ expr: chaos ? 'shock' : 'laugh', relative: true }} /></div>
        {chaos && (
          <>
            <ObjArt k="basketball" className="flying-ball" />
            <ObjArt k="teddy" className="falling-teddy" />
            <div className="printer-wrap">
              <ObjArt k="printer" className="title-printer" />
              {[0, 1, 2, 3, 4].map((i) => (
                <ObjArt key={i} k="paper" className={`title-paper p${i}`} />
              ))}
            </div>
          </>
        )}
      </div>
      <button className="big-btn start-btn" onClick={start}>
        יאללה, מתחילים!
      </button>
    </div>
  );
}
