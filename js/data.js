/**
 * Gyāna Chopad — Data loader
 * Loads board, snakes/ladders, and educational cards.
 */

export async function loadJSON(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
  return res.json();
}

export async function loadAllData() {
  const [board, connections] = await Promise.all([
    loadJSON('data/board.json'),
    loadJSON('data/snakes-ladders.json')
  ]);
  let cards = [];
  try {
    const cardsData = await loadJSON('data/cards.json');
    cards = cardsData.cards || [];
  } catch (e) {
    console.warn('cards.json not found or failed; Reflection Mode will have no cards.', e.message);
  }
  return { board, connections, cards };
}

/** Build serpentine position map: square number -> {row, col} (0-indexed from top-left) */
export function buildPositionMap(rows = 9, cols = 8) {
  const map = {};
  let num = 1;
  for (let r = rows - 1; r >= 0; r--) {
    const leftToRight = (rows - 1 - r) % 2 === 0;
    if (leftToRight) {
      for (let c = 0; c < cols; c++) {
        map[num] = { row: r, col: c };
        num++;
      }
    } else {
      for (let c = cols - 1; c >= 0; c--) {
        map[num] = { row: r, col: c };
        num++;
      }
    }
  }
  return map;
}

/** Reverse: cell index (row*cols + col) -> square number */
export function buildCellToSquare(rows = 9, cols = 8) {
  const posMap = buildPositionMap(rows, cols);
  const cellMap = {};
  for (const [sq, { row, col }] of Object.entries(posMap)) {
    cellMap[`${row},${col}`] = parseInt(sq, 10);
  }
  return cellMap;
}

export function getStageForSquare(square, stages) {
  for (const s of stages) {
    if (square >= s.range[0] && square <= s.range[1]) return s;
  }
  return null;
}
