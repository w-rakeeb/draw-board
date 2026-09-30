import { DRAW_BOARD_NAME, DRAW_BOARD_REPOSITORY } from "../branding";

export const ExcalidrawPlusPromoBanner = (_props: { isSignedIn: boolean }) => (
  <a
    href={DRAW_BOARD_REPOSITORY}
    target="_blank"
    rel="noopener noreferrer"
    className="plus-banner"
    aria-label="Draw Board by Wrakeeb on GitHub"
  >
    {DRAW_BOARD_NAME}
  </a>
);
