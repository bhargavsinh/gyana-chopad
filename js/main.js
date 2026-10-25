/**
 * Gyāna Chopad V1.5 — Entry point
 */

import { loadAllData } from './data.js';
import { GameEngine } from './game.js';
import { UI } from './ui.js';

async function init() {
  try {
    const data = await loadAllData();
    const engine = new GameEngine({
      board: data.board,
      connections: data.connections,
      exactWin: true
    });
    const ui = new UI(engine, data);

    window.GyanaChopad = { engine, ui, data };
    console.log(
      'Gyāna Chopad V1.5 ready.',
      'Squares:', data.board.totalSquares,
      'Ladders:', data.connections.ladders.length,
      'Snakes:', data.connections.snakes.length,
      'Cards:', data.cards.length,
      'Dice: 2'
    );
  } catch (err) {
    console.error('Failed to initialize Gyāna Chopad:', err);
    document.body.innerHTML = `
      <div style="padding:2rem;font-family:sans-serif;text-align:center;background:#F8F1E3;min-height:100vh;">
        <h1 style="color:#6B2D3C;">જ્ઞાન ચોપડ</h1>
        <p>લોડ કરવામાં ભૂલ. કૃપા કરીને પેજ રિફ્રેશ કરો.</p>
        <pre style="text-align:left;font-size:12px;color:#666;max-width:28rem;margin:1rem auto;">${err && err.message ? err.message : err}</pre>
      </div>`;
  }
}

init();
