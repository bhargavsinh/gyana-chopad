/**
 * Gyāna Chopad V1.0 — Entry point
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
    console.log('Gyāna Chopad V1.0 ready. Board squares:', data.board.totalSquares,
      'Ladders:', data.connections.ladders.length,
      'Snakes:', data.connections.snakes.length,
      'Cards:', data.cards.length);
  } catch (err) {
    console.error('Failed to initialize Gyāna Chopad:', err);
    document.body.innerHTML = `
      <div style="padding:2rem;font-family:sans-serif;text-align:center;">
        <h1>જ્ઞાન ચોપડ</h1>
        <p>લોડ કરવામાં ભૂલ. કૃપા કરીને પેજ રિફ્રેશ કરો.</p>
        <pre style="text-align:left;font-size:12px;color:#666;">${err.message}</pre>
      </div>`;
  }
}

init();
