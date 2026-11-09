/** Simple stroke icons. Decorative: buttons carry their own accessible labels. */

const paths: Record<string, string> = {
  back: 'M9 6l6 6-6 6',
  forward: 'M15 6l-6 6 6 6',
  restart: 'M4 12a8 8 0 1 0 2.4-5.7M4 4v4.5h4.5',
  close: 'M6 6l12 12M18 6L6 18',
  play: 'M8 5l11 7-11 7z',
  plus: 'M12 5v14M5 12h14',
  copy: 'M9 9h10v10H9zM5 15V5h10',
  trash: 'M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12',
  edit: 'M4 20h4L19 9l-4-4L4 16zM14 6l4 4',
  up: 'M6 15l6-6 6 6',
  down: 'M6 9l6 6 6-6',
  undo: 'M9 14L4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3',
  redo: 'M15 14l5-5-5-5M20 9H10a6 6 0 0 0 0 12h3',
  sound: 'M4 10v4h4l5 4V6l-5 4zM16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11',
  mute: 'M4 10v4h4l5 4V6l-5 4zM17 9l5 6M22 9l-5 6',
  map: 'M4 6l5-2 6 2 5-2v14l-5 2-6-2-5 2zM9 4v14M15 6v14',
  flag: 'M5 21V4M5 4h11l-2 4 2 4H5',
  home: 'M4 11l8-7 8 7M6 10v10h12V10',
  flip: 'M12 3v18M8 7L4 12l4 5M16 7l4 5-4 5',
  front: 'M8 8h12v12H8zM4 4h12v2M4 4v12h2',
  backLayer: 'M4 4h12v12H4zM8 18v2h12V8h-2',
  star: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z',
  download: 'M12 4v11M7 10l5 5 5-5M5 20h14',
  upload: 'M12 20V9M7 14l5-5 5 5M5 4h14',
  book: 'M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2zM4 19V5',
  sparkle: 'M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z',
  lock: 'M7 11V8a5 5 0 0 1 10 0v3M5 11h14v10H5z',
  check: 'M5 12l5 5 9-10',
  warning: 'M12 4l9 16H3zM12 10v4M12 17v.5',
  info: 'M12 8v.5M12 11v6M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18',
  text: 'M5 6h14M12 6v13',
  people: 'M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3 20a6 6 0 0 1 12 0M16 11a3 3 0 1 0 0-6M17 14a5 5 0 0 1 4 6',
  image: 'M4 5h16v14H4zM4 16l5-5 4 4 3-3 4 4',
  branch: 'M6 4v8a4 4 0 0 0 4 4h8M14 12l4 4-4 4M6 12V4',
  settings: 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1',
  dice: 'M5 5h14v14H5zM9 9h.01M15 15h.01M15 9h.01M9 15h.01',
  heart: 'M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z',
  pin: 'M9 4h6l-1 6 3 3H7l3-3zM12 13v7',
  typing: 'M4 7h16M4 12h10M4 17h6',
};

export function Icon({ name, size = 22 }: { name: keyof typeof paths | string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className="hs-icon"
    >
      <path d={paths[name] ?? paths.info} />
    </svg>
  );
}
