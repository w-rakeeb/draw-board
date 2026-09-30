export const DRAW_BOARD_NAME = "Draw Board";
export const DRAW_BOARD_AUTHOR = "Wrakeeb";
export const DRAW_BOARD_REPOSITORY = "https://github.com/w-rakeeb/draw-board";

export const DrawBoardMark = () => (
  <svg
    width="40"
    height="40"
    viewBox="0 0 40 40"
    fill="none"
    aria-hidden="true"
  >
    <rect
      x="4"
      y="5"
      width="30"
      height="30"
      rx="7"
      stroke="currentColor"
      strokeWidth="2.5"
      transform="rotate(-4 19 20)"
    />
    <path
      d="m13 26 2-7L27 7l6 6-12 12-8 1Z"
      fill="var(--color-primary)"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path d="m15 19 6 6M24 10l6 6" stroke="currentColor" strokeWidth="2" />
  </svg>
);
