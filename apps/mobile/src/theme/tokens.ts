// Mirrors the :root tokens in apps/web/src/ui/styles.css.
export const color = {
  ink: "#3b3550",
  inkSoft: "#6b6480",
  paper: "#fff7ec",
  card: "#ffffff",
  cream: "#fdeedd",
  mint: "#8fd6b4",
  mintDeep: "#5fb98f",
  peach: "#ffb38a",
  sky: "#8cc8ef",
  butter: "#ffd970",
  lilac: "#c9b6f2",
  rose: "#ff9aa2",
  stage: "#cfe3f0",
} as const;

const CARD_TINTS = [color.peach, color.butter, color.mint, color.lilac, color.sky] as const;
/** Cycles pastel card colours down a list. */
export const tintAt = (index: number): string => CARD_TINTS[index % CARD_TINTS.length] ?? color.mint;

export const radius = { large: 18, small: 12 } as const;
export const outline = { width: 3, color: color.ink } as const;
/** The web's `--lift`: a hard 5px drop "shadow" under toy buttons. */
export const lift = 5;
