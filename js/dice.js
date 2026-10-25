/**
 * Gyāna Chopad V1.5 — Two-dice helper
 * Rolls 2×(1–6); movement uses sum (2–12).
 */

export function rollOneDie() {
  return Math.floor(Math.random() * 6) + 1;
}

/** @returns {{ d1: number, d2: number, total: number }} */
export function rollTwoDice() {
  const d1 = rollOneDie();
  const d2 = rollOneDie();
  return { d1, d2, total: d1 + d2 };
}

export function formatDiceGu(n) {
  const GU = ['૦','૧','૨','૩','૪','૫','૬','૭','૮','૯'];
  return String(n).split('').map(c => GU[parseInt(c, 10)] ?? c).join('');
}

export function isValidDiceResult(r) {
  return (
    r &&
    Number.isInteger(r.d1) && r.d1 >= 1 && r.d1 <= 6 &&
    Number.isInteger(r.d2) && r.d2 >= 1 && r.d2 <= 6 &&
    r.total === r.d1 + r.d2
  );
}
