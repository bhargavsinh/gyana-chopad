/**
 * Gyāna Chopad V1.5 — UI (dual dice + visible button fix)
 */

import { buildPositionMap, getStageForSquare } from './data.js';
import { sanitizePlayerName } from './security.js';

const GU_DIGITS = ['૦','૧','૨','૩','૪','૫','૬','૭','૮','૯'];
export function toGujaratiNum(n) {
  return String(n).split('').map(d => GU_DIGITS[parseInt(d, 10)] ?? d).join('');
}

export class UI {
  constructor(engine, data) {
    this.engine = engine;
    this.board = data.board;
    this.connections = data.connections;
    this.cards = data.cards;
    this.posMap = buildPositionMap(this.board.rows, this.board.cols);
    this.selectedPlayers = 2;
    this.selectedMode = 'classic';
    this.rolling = false;
    this.bindStartScreen();
    this.bindGameControls();
    this.bindModals();
  }

  bindStartScreen() {
    document.querySelectorAll('.player-count-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.player-count-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.selectedPlayers = parseInt(btn.dataset.players, 10);
        this.renderNameInputs();
      });
    });
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.selectedMode = btn.dataset.mode;
        const desc = document.getElementById('mode-desc');
        if (desc) desc.textContent = this.selectedMode === 'classic'
          ? 'બે પાસા + સર્પ-નિસરણી. સાપ = પાછળ, સીડી = આગળ.'
          : 'ખાનાં પર શૈક્ષણિક કાર્ડ અને વિચારના પ્રશ્નો દેખાશે.';
      });
    });
    this.renderNameInputs();
    document.getElementById('btn-start').addEventListener('click', () => this.startGame());
    document.getElementById('btn-rules').addEventListener('click', () => this.showRules());
    document.getElementById('btn-game-rules')?.addEventListener('click', () => this.showRules());
    document.getElementById('btn-close-rules')?.addEventListener('click', () => this.hideRules());
    document.getElementById('modal-rules')?.addEventListener('click', (e) => {
      if (e.target.id === 'modal-rules') this.hideRules();
    });
  }

  renderNameInputs() {
    const container = document.getElementById('player-names');
    container.innerHTML = '';
    for (let i = 0; i < this.selectedPlayers; i++) {
      const div = document.createElement('div');
      div.innerHTML = `<label class="text-xs text-ink/70">ખેલાડી ${toGujaratiNum(i + 1)}</label>
        <input type="text" class="player-name-input w-full mt-0.5 px-3 py-1.5 rounded-lg border border-antiquegold/50 bg-white/80 text-sm" placeholder="નામ દાખલ કરો" maxlength="20" value="ખેલાડી ${toGujaratiNum(i + 1)}" />`;
      container.appendChild(div);
    }
  }

  startGame() {
    const inputs = document.querySelectorAll('.player-name-input');
    const names = Array.from(inputs).map((inp, i) => sanitizePlayerName(inp.value.trim() || inp.placeholder, `ખેલાડી ${i + 1}`));
    const exactWin = document.getElementById('exact-win')?.checked ?? true;
    this.rolling = false;
    this.engine.setup(names, this.selectedMode, exactWin);
    this.renderBoard();
    this.drawConnections();
    this.renderStageLegend();
    this.updateTurnPanel();
    this.updatePlayersList();
    this.placeTokens();
    const modeLabel = document.getElementById('current-mode-label');
    if (modeLabel) modeLabel.textContent = this.selectedMode === 'classic' ? 'ક્લાસિક મોડ' : 'વિચારશીલ મોડ';
    this.setMoveMessage('બે પાસા નાખો. સાપ ↓ પાછળ, સીડી ↑ આગળ.');
    this.showScreen('game');
    const diceBtn = document.getElementById('btn-dice');
    if (diceBtn) {
      diceBtn.disabled = false;
      diceBtn.style.opacity = '1';
      diceBtn.style.pointerEvents = 'auto';
    }
  }

  showScreen(name) {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    document.getElementById(`screen-${name}`).classList.remove('hidden');
  }
  showRules() { const m = document.getElementById('modal-rules'); m.classList.remove('hidden'); m.classList.add('flex'); }
  hideRules() { const m = document.getElementById('modal-rules'); m.classList.add('hidden'); m.classList.remove('flex'); }

  squareCenter(square) {
    const pos = this.posMap[square];
    if (!pos) return null;
    const cellW = 100 / this.board.cols, cellH = 100 / this.board.rows;
    return { x: pos.col * cellW + cellW / 2, y: pos.row * cellH + cellH / 2 };
  }

  renderBoard() {
    const boardEl = document.getElementById('board');
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
        cell.dataset.square = square;
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

  cellTooltip(square) {
    const ladder = this.connections.ladders.find(l => l.from === square);
    if (ladder) return `સીડી: ${ladder.virtueGu} → ${ladder.to}`;
    const snake = this.connections.snakes.find(s => s.from === square);
    if (snake) return `સાપ: ${snake.viceGu} → ${snake.to}`;
    if (square === this.board.winSquare) return 'પરમ-લક્ષ્ય (જીત)';
    return `ખાનું ${square}`;
  }

  drawConnections() {
    const wrapper = document.getElementById('board-wrapper');
    let svg = document.getElementById('connections-svg');
    if (svg) svg.remove();
    svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('id', 'connections-svg');
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.setAttribute('preserveAspectRatio', 'none');
    this.connections.ladders.forEach((l, i) => {
      const a = this.squareCenter(l.from), b = this.squareCenter(l.to);
      if (!a || !b) return;
      const midX = (a.x + b.x) / 2 + (i % 2 === 0 ? 1.8 : -1.8);
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('class', 'ladder-path');
      path.setAttribute('d', `M ${a.x} ${a.y} Q ${midX} ${(a.y + b.y) / 2} ${b.x} ${b.y}`);
      svg.appendChild(path);
      for (let t = 0.22; t < 1; t += 0.22) {
        const x = a.x + (b.x - a.x) * t, y = a.y + (b.y - a.y) * t;
        const rung = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        rung.setAttribute('class', 'ladder-rung');
        rung.setAttribute('x1', x - 1.3); rung.setAttribute('y1', y);
        rung.setAttribute('x2', x + 1.3); rung.setAttribute('y2', y);
        svg.appendChild(rung);
      }
    });
    this.connections.snakes.forEach((s, i) => {
      const a = this.squareCenter(s.from), b = this.squareCenter(s.to);
      if (!a || !b) return;
      const dx = b.x - a.x, dy = b.y - a.y;
      const cx1 = a.x + dx * 0.28 + (i % 2 === 0 ? 5 : -5), cy1 = a.y + dy * 0.28;
      const cx2 = a.x + dx * 0.72 + (i % 2 === 0 ? -4 : 4), cy2 = a.y + dy * 0.72;
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('class', 'snake-path');
      path.setAttribute('d', `M ${a.x} ${a.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${b.x} ${b.y}`);
      svg.appendChild(path);
      const head = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      head.setAttribute('class', 'snake-head-dot');
      head.setAttribute('cx', a.x); head.setAttribute('cy', a.y); head.setAttribute('r', 1.5);
      svg.appendChild(head);
    });
    wrapper.appendChild(svg);
  }

  renderStageLegend() {
    const el = document.getElementById('stage-legend');
    if (!el) return;
    el.innerHTML = this.board.stages.map(s =>
      `<span class="px-1.5 py-0.5 rounded" style="background:${s.color}22;color:${s.color}">${s.nameGu}</span>`
    ).join('') + `<span class="conn-legend ladder">↑ સીડી</span><span class="conn-legend snake">↓ સાપ</span>`;
  }

  placeTokens() {
    const layer = document.getElementById('tokens-layer');
    layer.innerHTML = '';
    this.engine.players.forEach((p) => {
      const token = document.createElement('div');
      token.className = `token ${p.tokenClass}`;
      token.id = `token-${p.id}`;
      token.textContent = toGujaratiNum(p.id + 1);
      layer.appendChild(token);
      this.moveTokenElement(p, false);
    });
    this.highlightActiveToken();
  }

  moveTokenElement(player, animate = true) {
    const token = document.getElementById(`token-${player.id}`);
    if (!token) return;
    if (player.position === 0) {
      token.style.left = `${4 + player.id * 7}%`; token.style.top = '91%'; return;
    }
    const { row, col } = this.posMap[player.position];
    const cellW = 100 / this.board.cols, cellH = 100 / this.board.rows;
    const same = this.engine.players.filter(pl => pl.position === player.position);
    const oi = same.findIndex(pl => pl.id === player.id);
    const ox = (oi % 2) * 10 - 5, oy = Math.floor(oi / 2) * 10 - 5;
    token.style.left = `${col * cellW + cellW / 2 - 5 + ox * 0.25}%`;
    token.style.top = `${row * cellH + cellH / 2 - 5 + oy * 0.25}%`;
    if (animate) { token.classList.remove('bounce'); void token.offsetWidth; token.classList.add('bounce'); }
  }

  highlightActiveToken() {
    document.querySelectorAll('.token').forEach(t => t.classList.remove('active'));
    const cur = this.engine.currentPlayer;
    if (cur) document.getElementById(`token-${cur.id}`)?.classList.add('active');
  }

  highlightSquare(square) {
    document.querySelectorAll('.cell').forEach(c => c.classList.remove('highlight-move'));
    if (square) document.querySelector(`.cell[data-square="${square}"]`)?.classList.add('highlight-move');
  }

  updateTurnPanel() {
    const p = this.engine.currentPlayer;
    if (!p) return;
    const nameEl = document.getElementById('current-player-name');
    const posEl = document.getElementById('current-player-pos');
    if (nameEl) nameEl.textContent = p.name;
    if (posEl) posEl.textContent = `સ્થાન: ${toGujaratiNum(p.position)}`;
    const btn = document.getElementById('btn-dice');
    const allow = this.engine.canRoll() && !this.rolling;
    if (btn) {
      btn.disabled = !allow;
      btn.style.opacity = allow ? '1' : '0.8';
      btn.style.pointerEvents = allow ? 'auto' : 'none';
    }
    const tip = document.getElementById('help-tip');
    if (tip) tip.textContent = allow ? `${p.name}, પાસા નાખો` : 'રાહ જુઓ…';
  }

  updatePlayersList() {
    const el = document.getElementById('players-list');
    el.innerHTML = '<p class="text-xs text-ink/60 mb-1">ખેલાડીઓ</p>' +
      this.engine.players.map(p => {
        const active = p.id === this.engine.currentPlayer?.id ? 'font-bold text-maroon' : '';
        return `<div class="flex justify-between text-sm ${active}"><span><span class="inline-block w-2.5 h-2.5 rounded-full mr-1" style="background:var(--token-${p.id + 1})"></span>${p.name}</span><span>${toGujaratiNum(p.position)}</span></div>`;
      }).join('');
  }

  setMoveMessage(text) {
    const el = document.getElementById('move-message');
    if (!el) return;
    el.textContent = text;
    el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash');
  }

  bindGameControls() {
    document.getElementById('btn-dice').addEventListener('click', () => this.onDiceClick());
    document.getElementById('btn-restart').addEventListener('click', () => {
      if (confirm('નવી રમત શરૂ કરવી છે?')) this.showScreen('start');
    });
    document.getElementById('btn-new-game').addEventListener('click', () => { this.hideWin(); this.showScreen('start'); });
    document.getElementById('btn-continue-card').addEventListener('click', () => this.closeCard());
    document.getElementById('btn-close-card').addEventListener('click', () => this.closeCard());
  }

  bindModals() {}

  async onDiceClick() {
    if (!this.engine.canRoll() || this.rolling) return;
    this.rolling = true;
    const d1El = document.getElementById('dice-d1');
    const d2El = document.getElementById('dice-d2');
    const totalEl = document.getElementById('dice-total');
    const faces = [d1El, d2El].filter(Boolean);
    const btn = document.getElementById('btn-dice');
    if (btn) btn.disabled = true;
    faces.forEach(el => el.classList.add('dice-rolling'));
    this.setMoveMessage('બે પાસા ફરી રહ્યા છે…');

    try {
      for (let i = 0; i < 8; i++) {
        faces.forEach(el => { el.textContent = toGujaratiNum(Math.floor(Math.random() * 6) + 1); });
        await sleep(65);
      }

      const rolled = this.engine.rollDice();
      if (!rolled) {
        this.rolling = false;
        this.updateTurnPanel();
        this.setMoveMessage('પાસા ફરી શકાયા નહીં — ફરી પ્રયાસ કરો.');
        return;
      }
      const d1 = (typeof rolled === 'object') ? rolled.d1 : rolled;
      const d2 = (typeof rolled === 'object') ? rolled.d2 : 0;
      const value = (typeof rolled === 'object') ? rolled.total : rolled;

      faces.forEach(el => el.classList.remove('dice-rolling'));
      if (d1El && d2El) {
        d1El.textContent = toGujaratiNum(d1);
        d2El.textContent = toGujaratiNum(d2);
        d1El.classList.add('pop');
        d2El.classList.add('pop');
        if (totalEl) totalEl.textContent = '=' + toGujaratiNum(value);
      }

      await sleep(280);
      const movedPlayer = this.engine.currentPlayer;
      const fromPos = movedPlayer.position;
      const result = this.engine.applyMove(Number(value));
      this.engine.players.forEach(p => this.moveTokenElement(p, p.id === movedPlayer.id));
      this.highlightActiveToken();
      this.updatePlayersList();

      const diceLabel = d2 ? `${toGujaratiNum(d1)}+${toGujaratiNum(d2)}=${toGujaratiNum(value)}` : toGujaratiNum(value);

      if (result?.blocked) {
        this.setMoveMessage(`પાસા ${diceLabel} — ચોક્કસ પાસો જરૂરી.`);
        this.highlightSquare(null);
      } else if (result?.connection) {
        const c = result.connection;
        if (c.type === 'ladder') {
          this.setMoveMessage(`સીડી! ${c.virtueGu} — ${toGujaratiNum(c.from)} થી ${toGujaratiNum(c.to)}`);
          this.highlightSquare(c.to);
        } else {
          this.setMoveMessage(`સાપ! ${c.viceGu} — ${toGujaratiNum(c.from)} થી ${toGujaratiNum(c.to)}`);
          this.highlightSquare(c.to);
        }
      } else if (result?.won) {
        this.setMoveMessage('વિજય!');
      } else {
        const landed = result?.finalPos ?? (fromPos + Number(value));
        this.setMoveMessage(`પાસા ${diceLabel} → ${toGujaratiNum(landed)}`);
        this.highlightSquare(landed);
      }

      if (result?.won) { await sleep(400); this.showWin(this.engine.winner); }
      else if (result?.needsCard) { await sleep(350); this.showRandomCard(result.landedOn); }
      else { this.rolling = false; this.updateTurnPanel(); setTimeout(() => this.highlightSquare(null), 1200); }
    } catch (err) {
      console.error(err);
      this.rolling = false;
      this.engine.phase = 'waiting';
      this.updateTurnPanel();
      this.setMoveMessage('ભૂલ — ફરી પાસા નાખો.');
    }
  }

  showRandomCard(landedOn) {
    if (!this.cards.length) {
      this.engine.continueAfterCard(); this.rolling = false; this.updateTurnPanel(); return;
    }
    const card = this.cards[Math.floor(Math.random() * this.cards.length)];
    document.getElementById('card-category').textContent = card.category;
    document.getElementById('card-title').textContent = card.titleGu;
    document.getElementById('card-explanation').textContent = card.explanationGu;
    document.getElementById('card-scenario').textContent = card.scenarioGu;
    document.getElementById('card-takeaway').textContent = card.takeawayGu;
    document.getElementById('card-source').textContent = card.source || '';
    const m = document.getElementById('modal-card');
    m.classList.remove('hidden'); m.classList.add('flex');
  }

  closeCard() {
    const m = document.getElementById('modal-card');
    m.classList.add('hidden'); m.classList.remove('flex');
    this.engine.continueAfterCard();
    this.rolling = false;
    this.updateTurnPanel();
    this.updatePlayersList();
    this.highlightActiveToken();
    this.highlightSquare(null);
  }

  showWin(player) {
    document.getElementById('win-message').textContent = `${player.name} વિજેતા!`;
    const m = document.getElementById('modal-win');
    m.classList.remove('hidden'); m.classList.add('flex');
    this.rolling = false;
  }

  hideWin() {
    const m = document.getElementById('modal-win');
    m.classList.add('hidden'); m.classList.remove('flex');
  }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
