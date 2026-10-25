/**
 * Gyāna Chopad V1.5 — Board rendering (traditional manuscript style)
 */

import { buildPositionMap, getStageForSquare } from './data.js';

const GU_DIGITS = ['૦','૧','૨','૩','૪','૫','૬','૭','૮','૯'];
export function toGujaratiNum(n) {
  return String(n).split('').map(d => GU_DIGITS[parseInt(d, 10)] ?? d).join('');
}

export class BoardRenderer {
  constructor(board, connections) {
    this.board = board;
    this.connections = connections;
    this.posMap = buildPositionMap(board.rows, board.cols);
  }

  squareCenter(square) {
    const pos = this.posMap[square];
    if (!pos) return null;
    const cellW = 100 / this.board.cols;
    const cellH = 100 / this.board.rows;
    return { x: pos.col * cellW + cellW / 2, y: pos.row * cellH + cellH / 2 };
  }

  cellTooltip(square) {
    const ladder = this.connections.ladders.find(l => l.from === square);
    if (ladder) return `સીડી: ${ladder.virtueGu} → ${ladder.to}`;
    const snake = this.connections.snakes.find(s => s.from === square);
    if (snake) return `સાપ: ${snake.viceGu} → ${snake.to}`;
    if (square === this.board.winSquare) return 'પરમ-લક્ષ્ય (જીત)';
    return `ખાનું ${square}`;
  }

  renderBoard(boardEl) {
    boardEl.innerHTML = '';
    const ladderFrom = new Set(this.connections.ladders.map(l => l.from));
    const snakeFrom = new Set(this.connections.snakes.map(s => s.from));
    for (let r = 0; r < this.board.rows; r++) {
      for (let c = 0; c < this.board.cols; c++) {
        let square = null;
        for (const [sq, pos] of Object.entries(this.posMap)) {
          if (pos.row === r && pos.col === c) { square = parseInt(sq, 10); break; }
        }
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.square = String(square);
        const stage = getStageForSquare(square, this.board.stages);
        if (stage) cell.classList.add(`stage-${stage.id}`);
        if (square === this.board.winSquare) cell.classList.add('win-cell');
        if (ladderFrom.has(square)) cell.classList.add('has-ladder');
        if (snakeFrom.has(square)) cell.classList.add('has-snake');
        cell.innerHTML = `<span class="cell-number">${toGujaratiNum(square)}</span>`;
        cell.title = this.cellTooltip(square);
        boardEl.appendChild(cell);
      }
    }
  }

  drawConnections(wrapper) {
    let svg = document.getElementById('connections-svg');
    if (svg) svg.remove();
    svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('id', 'connections-svg');
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.setAttribute('preserveAspectRatio', 'none');
    this.connections.ladders.forEach((l, i) => {
      const a = this.squareCenter(l.from);
      const b = this.squareCenter(l.to);
      if (!a || !b) return;
      const midX = (a.x + b.x) / 2 + (i % 2 === 0 ? 1.8 : -1.8);
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('class', 'ladder-path');
      path.setAttribute('d', `M ${a.x} ${a.y} Q ${midX} ${(a.y + b.y) / 2} ${b.x} ${b.y}`);
      svg.appendChild(path);
      for (let t = 0.22; t < 1; t += 0.22) {
        const x = a.x + (b.x - a.x) * t;
        const y = a.y + (b.y - a.y) * t;
        const rung = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        rung.setAttribute('class', 'ladder-rung');
        rung.setAttribute('x1', x - 1.3);
        rung.setAttribute('y1', y);
        rung.setAttribute('x2', x + 1.3);
        rung.setAttribute('y2', y);
        svg.appendChild(rung);
      }
    });
    this.connections.snakes.forEach((s, i) => {
      const a = this.squareCenter(s.from);
      const b = this.squareCenter(s.to);
      if (!a || !b) return;
      const dx = b.x - a.x, dy = b.y - a.y;
      const cx1 = a.x + dx * 0.28 + (i % 2 === 0 ? 5 : -5);
      const cy1 = a.y + dy * 0.28;
      const cx2 = a.x + dx * 0.72 + (i % 2 === 0 ? -4 : 4);
      const cy2 = a.y + dy * 0.72;
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('class', 'snake-path');
      path.setAttribute('d', `M ${a.x} ${a.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${b.x} ${b.y}`);
      svg.appendChild(path);
      const head = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      head.setAttribute('class', 'snake-head-dot');
      head.setAttribute('cx', a.x);
      head.setAttribute('cy', a.y);
      head.setAttribute('r', 1.5);
      svg.appendChild(head);
    });
    wrapper.appendChild(svg);
  }

  renderStageLegend(el) {
    if (!el) return;
    el.innerHTML =
      this.board.stages.map(s =>
        `<span class="px-1.5 py-0.5 rounded" style="background:${s.color}22;color:${s.color}">${s.nameGu}</span>`
      ).join('') +
      `<span class="conn-legend ladder">↑ સીડી</span><span class="conn-legend snake">↓ સાપ</span>`;
  }
}
