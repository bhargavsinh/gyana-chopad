/**
 * Gyāna Chopad V1.5.2 — Dice click fix (Android)
 */
import { buildPositionMap, getStageForSquare } from './data.js';
import { sanitizePlayerName } from './security.js';

const GU_DIGITS = ['૦','૧','૨','૩','૪','૫','૬','૭','૮','૯'];
export function toGujaratiNum(n) {
  return String(n).split('').map(d => GU_DIGITS[parseInt(d, 10)] ?? d).join('');
}
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

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
      });
    });
    this.renderNameInputs();
    document.getElementById('btn-start').addEventListener('click', () => this.startGame());
    document.getElementById('btn-rules')?.addEventListener('click', () => this.showRules());
    document.getElementById('btn-game-rules')?.addEventListener('click', () => this.showRules());
    document.getElementById('btn-close-rules')?.addEventListener('click', () => this.hideRules());
  }

  renderNameInputs() {
    const container = document.getElementById('player-names');
    container.innerHTML = '';
    for (let i = 0; i < this.selectedPlayers; i++) {
      const div = document.createElement('div');
      div.innerHTML = `<label class="text-xs">ખેલાડી ${toGujaratiNum(i + 1)}</label>
        <input type="text" class="player-name-input w-full mt-0.5 px-3 py-1.5 rounded-lg border text-sm" maxlength="20" value="ખેલાડી ${toGujaratiNum(i + 1)}" />`;
      container.appendChild(div);
    }
  }

  startGame() {
    const inputs = document.querySelectorAll('.player-name-input');
    const names = Array.from(inputs).map((inp, i) => sanitizePlayerName(inp.value.trim() || `ખેલાડી ${i + 1}`, `ખેલાડી ${i + 1}`));
    const exactWin = document.getElementById('exact-win')?.checked ?? true;
    this.rolling = false;
    this.engine.setup(names, this.selectedMode, exactWin);
    this.engine.phase = 'waiting';
    this.renderBoard();
    this.drawConnections();
    this.renderStageLegend();
    this.updatePlayersList();
    this.placeTokens();
    document.getElementById('current-mode-label').textContent =
      this.selectedMode === 'classic' ? 'ક્લાસિક મોડ' : 'વિચારશીલ મોડ';
    this.showScreen('game');
    this.wireDiceButton();
    this.updateTurnPanel();
    this.setMoveMessage('તૈયાર — નારંગી બટન દબાવો.');
  }

  wireDiceButton() {
    const btn = document.getElementById('btn-dice');
    if (!btn) return;
    btn.disabled = false;
    btn.removeAttribute('disabled');
    btn.style.pointerEvents = 'auto';
    btn.style.opacity = '1';
    btn.style.background = 'linear-gradient(180deg,#E06A2E,#B8431A)';
    btn.style.color = '#fff';
    if (!btn._bound) {
      const go = (e) => { e.preventDefault(); this.onDiceClick(); };
      btn.addEventListener('click', go);
      btn.addEventListener('touchend', go, { passive: false });
      btn._bound = true;
    }
  }

  showScreen(name) {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    document.getElementById('screen-' + name).classList.remove('hidden');
  }
  showRules() {
    const m = document.getElementById('modal-rules');
    m.classList.remove('hidden'); m.classList.add('flex');
  }
  hideRules() {
    const m = document.getElementById('modal-rules');
    m.classList.add('hidden'); m.classList.remove('flex');
  }

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
        if (stage) cell.classList.add('stage-' + stage.id);
        if (square === this.board.winSquare) cell.classList.add('win-cell');
        if (ladderFrom.has(square)) cell.classList.add('has-ladder');
        if (snakeFrom.has(square)) cell.classList.add('has-snake');
        cell.innerHTML = '<span class="cell-number">' + toGujaratiNum(square) + '</span>';
        boardEl.appendChild(cell);
      }
    }
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
      path.setAttribute('d', 'M ' + a.x + ' ' + a.y + ' Q ' + midX + ' ' + ((a.y + b.y) / 2) + ' ' + b.x + ' ' + b.y);
      svg.appendChild(path);
    });
    this.connections.snakes.forEach((s, i) => {
      const a = this.squareCenter(s.from), b = this.squareCenter(s.to);
      if (!a || !b) return;
      const dx = b.x - a.x, dy = b.y - a.y;
      const cx1 = a.x + dx * 0.3 + (i % 2 ? -5 : 5), cy1 = a.y + dy * 0.3;
      const cx2 = a.x + dx * 0.7 + (i % 2 ? 4 : -4), cy2 = a.y + dy * 0.7;
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('class', 'snake-path');
      path.setAttribute('d', 'M ' + a.x + ' ' + a.y + ' C ' + cx1 + ' ' + cy1 + ', ' + cx2 + ' ' + cy2 + ', ' + b.x + ' ' + b.y);
      svg.appendChild(path);
    });
    wrapper.appendChild(svg);
  }

  renderStageLegend() {
    const el = document.getElementById('stage-legend');
    if (!el) return;
    el.innerHTML = this.board.stages.map(s =>
      '<span class="px-1.5 py-0.5 rounded" style="background:' + s.color + '22;color:' + s.color + '">' + s.nameGu + '</span>'
    ).join('');
  }

  placeTokens() {
    const layer = document.getElementById('tokens-layer');
    layer.innerHTML = '';
    this.engine.players.forEach(p => {
      const token = document.createElement('div');
      token.className = 'token ' + p.tokenClass;
      token.id = 'token-' + p.id;
      token.textContent = toGujaratiNum(p.id + 1);
      layer.appendChild(token);
      this.moveTokenElement(p, false);
    });
    this.highlightActiveToken();
  }

  moveTokenElement(player, animate) {
    const token = document.getElementById('token-' + player.id);
    if (!token) return;
    if (player.position === 0) {
      token.style.left = (4 + player.id * 7) + '%';
      token.style.top = '91%';
      return;
    }
    const pos = this.posMap[player.position];
    if (!pos) return;
    const cellW = 100 / this.board.cols, cellH = 100 / this.board.rows;
    token.style.left = (pos.col * cellW + cellW / 2 - 5) + '%';
    token.style.top = (pos.row * cellH + cellH / 2 - 5) + '%';
    if (animate) {
      token.classList.remove('bounce');
      void token.offsetWidth;
      token.classList.add('bounce');
    }
  }

  highlightActiveToken() {
    document.querySelectorAll('.token').forEach(t => t.classList.remove('active'));
    const cur = this.engine.currentPlayer;
    if (cur) document.getElementById('token-' + cur.id)?.classList.add('active');
  }

  highlightSquare(square) {
    document.querySelectorAll('.cell').forEach(c => c.classList.remove('highlight-move'));
    if (square) document.querySelector('.cell[data-square="' + square + '"]')?.classList.add('highlight-move');
  }

  updateTurnPanel() {
    const p = this.engine.currentPlayer;
    if (!p) return;
    document.getElementById('current-player-name').textContent = p.name;
    document.getElementById('current-player-pos').textContent = 'સ્થાન: ' + toGujaratiNum(p.position);
    this.wireDiceButton();
    const tip = document.getElementById('help-tip');
    if (tip) tip.textContent = this.rolling ? 'પાસા ફરી રહ્યા છે…' : (p.name + ', પાસા નાખો');
  }

  updatePlayersList() {
    const el = document.getElementById('players-list');
    el.innerHTML = '<p class="text-xs mb-1">ખેલાડીઓ</p>' +
      this.engine.players.map(p =>
        '<div class="flex justify-between text-sm"><span>' + p.name + '</span><span>' + toGujaratiNum(p.position) + '</span></div>'
      ).join('');
  }

  setMoveMessage(text) {
    const el = document.getElementById('move-message');
    if (el) el.textContent = text;
  }

  bindGameControls() {
    this.wireDiceButton();
    document.getElementById('btn-restart')?.addEventListener('click', () => {
      if (confirm('નવી રમત?')) this.showScreen('start');
    });
    document.getElementById('btn-new-game')?.addEventListener('click', () => {
      this.hideWin(); this.showScreen('start');
    });
    document.getElementById('btn-continue-card')?.addEventListener('click', () => this.closeCard());
    document.getElementById('btn-close-card')?.addEventListener('click', () => this.closeCard());
  }

  async onDiceClick() {
    if (this.rolling) {
      this.setMoveMessage('રાહ જુઓ…');
      return;
    }
    if (this.engine.winner) {
      this.setMoveMessage('રમત પૂરી.');
      return;
    }
    // Heal stuck phase
    this.engine.phase = 'waiting';
    this.rolling = true;
    this.setMoveMessage('પાસા ફરી રહ્યા છે…');

    const d1El = document.getElementById('dice-d1');
    const d2El = document.getElementById('dice-d2');
    const totalEl = document.getElementById('dice-total');

    try {
      for (let i = 0; i < 7; i++) {
        if (d1El) d1El.textContent = toGujaratiNum(Math.floor(Math.random() * 6) + 1);
        if (d2El) d2El.textContent = toGujaratiNum(Math.floor(Math.random() * 6) + 1);
        await sleep(55);
      }

      this.engine.phase = 'waiting';
      let rolled = this.engine.rollDice();
      let d1, d2, value;
      if (!rolled) {
        d1 = Math.floor(Math.random() * 6) + 1;
        d2 = Math.floor(Math.random() * 6) + 1;
        value = d1 + d2;
        this.engine.phase = 'rolling';
        this.engine.lastDice = { d1, d2, total: value };
      } else {
        d1 = rolled.d1 ?? rolled;
        d2 = rolled.d2 ?? 0;
        value = rolled.total ?? rolled;
      }

      if (d1El) d1El.textContent = toGujaratiNum(d1);
      if (d2El) d2El.textContent = toGujaratiNum(d2);
      if (totalEl) totalEl.textContent = '=' + toGujaratiNum(value);

      await sleep(200);
      const fromPos = this.engine.currentPlayer.position;
      const result = this.engine.applyMove(Number(value));
      this.engine.players.forEach(p => this.moveTokenElement(p, true));
      this.highlightActiveToken();
      this.updatePlayersList();

      const label = d2 ? (toGujaratiNum(d1) + '+' + toGujaratiNum(d2) + '=' + toGujaratiNum(value)) : toGujaratiNum(value);

      if (result && result.blocked) {
        this.setMoveMessage('પાસા ' + label + ' — ચોક્કસ પાસો જરૂરી');
      } else if (result && result.connection) {
        const c = result.connection;
        this.setMoveMessage((c.type === 'ladder' ? 'સીડી! ' : 'સાપ! ') + (c.virtueGu || c.viceGu || '') +
          ' ' + toGujaratiNum(c.from) + '→' + toGujaratiNum(c.to));
        this.highlightSquare(c.to);
      } else if (result && result.won) {
        this.setMoveMessage('વિજય!');
      } else {
        const landed = (result && result.finalPos) != null ? result.finalPos : (fromPos + Number(value));
        this.setMoveMessage('પાસા ' + label + ' → ' + toGujaratiNum(landed));
        this.highlightSquare(landed);
      }

      if (result && result.won) {
        this.showWin(this.engine.winner);
      } else if (result && result.needsCard) {
        this.showRandomCard(result.landedOn);
      } else {
        this.rolling = false;
        this.engine.phase = 'waiting';
        this.updateTurnPanel();
        setTimeout(() => this.highlightSquare(null), 900);
      }
    } catch (err) {
      console.error(err);
      this.rolling = false;
      this.engine.phase = 'waiting';
      this.updateTurnPanel();
      this.setMoveMessage('ભૂલ — ફરી દબાવો: ' + (err.message || ''));
    }
  }

  showRandomCard() {
    if (!this.cards.length) {
      this.engine.continueAfterCard();
      this.rolling = false;
      this.updateTurnPanel();
      return;
    }
    const card = this.cards[Math.floor(Math.random() * this.cards.length)];
    document.getElementById('card-category').textContent = card.category;
    document.getElementById('card-title').textContent = card.titleGu;
    document.getElementById('card-explanation').textContent = card.explanationGu;
    document.getElementById('card-scenario').textContent = card.scenarioGu;
    document.getElementById('card-takeaway').textContent = card.takeawayGu;
    const m = document.getElementById('modal-card');
    m.classList.remove('hidden'); m.classList.add('flex');
  }

  closeCard() {
    const m = document.getElementById('modal-card');
    m.classList.add('hidden'); m.classList.remove('flex');
    this.engine.continueAfterCard();
    this.rolling = false;
    this.engine.phase = 'waiting';
    this.updateTurnPanel();
    this.updatePlayersList();
    this.highlightActiveToken();
  }

  showWin(player) {
    document.getElementById('win-message').textContent = player.name + ' વિજેતા!';
    const m = document.getElementById('modal-win');
    m.classList.remove('hidden'); m.classList.add('flex');
    this.rolling = false;
  }

  hideWin() {
    const m = document.getElementById('modal-win');
    m.classList.add('hidden'); m.classList.remove('flex');
  }
}
