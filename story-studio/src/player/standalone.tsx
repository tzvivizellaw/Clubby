import { createRoot } from 'react-dom/client';
import css from './player.css?inline';
import { StoryPlayer } from './StoryPlayer';
import { parseStory } from '../io/schema';

/** Entry point of the exported HTML file: reads the embedded story and opens it in play mode. */
function boot() {
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  const root = document.getElementById('root');
  const dataEl = document.getElementById('hasipur-story');
  if (!root) return;
  let error = 'לא מצאנו את הסיפור בקובץ.';
  if (dataEl?.textContent) {
    try {
      const parsed = parseStory(JSON.parse(dataEl.textContent));
      if (parsed.ok) {
        document.title = parsed.story.title;
        createRoot(root).render(<StoryPlayer story={parsed.story} />);
        return;
      }
      error = parsed.error;
    } catch {
      error = 'הקובץ פגום ולא ניתן לפתוח את הסיפור.';
    }
  }
  const p = document.createElement('p');
  p.style.padding = '24px';
  p.textContent = error;
  root.appendChild(p);
}

boot();
