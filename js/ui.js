/**
 * Gyāna Chopad — UI rendering and interactions
 */

import { buildPositionMap, getStageForSquare } from './data.js';

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
        desc.textContent = this.selectedMode === 'classic'
          ? 'સર્પ-નિસરણી અને પાસા સાથે સીધી રમત.'
          : 'ખાનાં પર શૈક્ષણિક કાર્ડ અને વિચારના પ્રશ્નો.';
      });
    });

    this.renderNameInputs();

    document.getElementById('btn-start').addEventListener('click', () => this.startGame());
    document.getElementById('btn-rules').addEventListener('click', () => this.showRules());
    document.getElementById('btn-game-rules').addEventListener('click', () => this.showRules());
    document.getElementById('btn-close-rules').addEventListener('click', () => this.hideRules());
    document.getElementById('modal-rules').addEventListener('click', (e) => {
      if (e.target.id === 'modal-rules') this.hideRules();
    });
  }

  renderNameInputs() {
    const container = document.getElementById('player-names');
    container.innerHTML = '';
    for (let i = 0; i < this.selectedPlayers; i++) {
      const div = document.createElement('div');
      div.innerHTML = `
        <label class="text-xs text-ink/70">ખેલાડી ${toGujaratiNum(i + 1)}</label>
        <input type="text" class="player-name-input w-full mt-0.5 px-3 py-1.5 rounded-lg border border-antiquegold/50 bg-white/80 text-sm"
               placeholder="નામ દાખલ કરો" maxlength="20" value="ખેલાડી ${toGujaratiNum(i + 1)}" />
      `;
      container.appendChild(div);
    }
  }

  startGame() {
    const inputs = document.querySelectorAll('.player-name-input');
    const names = Array.from(inputs).map(inp => inp.value.trim() || inp.placeholder);
    const exactWin = document.getElementById('exact-win').checked;
    this.engine.setup(names, this.selectedMode, exactWin);
    this.renderBoard();
    this.renderStageLegend();
    this.updateTurnPanel();
    this.updatePlayersList();
    this.placeTokens();
    document.getElementById('current-mode-label').textContent =
      this.selectedMode === 'classic' ? 'ક્લાસિક મોડ' : 'વિચારશીલ મોડ';
    this.showScreen('game');
  }

  showScreen(name) {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    document.getElementById(`screen-${name}`).classList.remove('hidden');
  }

  showRules() {
    const m = document.getElementById('modal-rules');
    m.classList.remove('hidden');
    m.classList.add('flex');
  }

  hideRules() {
    const m = document.getElementById('modal-rules');
    m.classList.add('hidden');
    m.classList.remove('flex');
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
          if (pos.row === r && pos.col === c) {
            square = parseInt(sq, 10);
            break;
          }
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
        cell.title = `ખાનું ${square}`;
        boardEl.appendChild(cell);
      }
    }
  }

  renderStageLegend() {
    const el = document.getElementById('stage-legend');
    el.innerHTML = this.board.stages.map(s =>
      `<span class="px-1.5 py-0.5 rounded" style="background:${s.color}22;color:${s.color}">${s.nameGu}</span>`
    ).join('');
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
      this.moveTokenElement(p);
    });
    this.highlightActiveToken();
  }

  moveTokenElement(player) {
    const token = document.getElementById(`token-${player.id}`);
    if (!token) return;
    const pos = player.position;
    if (pos === 0) {
      token.style.left = `${4 + player.id * 6}%`;
      token.style.top = '92%';
      return;
    }
    const { row, col } = this.posMap[pos];
    const cellW = 100 / this.board.cols;
    const cellH = 100 / this.board.rows;
    const sameSquare = this.engine.players.filter(pl => pl.position === pos);
    const offsetIdx = sameSquare.findIndex(pl => pl.id === player.id);
    const ox = (offsetIdx % 2) * 8 - 4;
    const oy = Math.floor(offsetIdx / 2) * 8 - 4;
    token.style.left = `${col * cellW + cellW / 2 - 4 + ox * 0.3}%`;
    token.style.top = `${row * cellH + cellH / 2 - 4 + oy * 0.3}%`;
  }

  highlightActiveToken() {
    document.querySelectorAll('.token').forEach(t => t.classList.remove('active'));
    const cur = this.engine.currentPlayer;
    if (cur) {
      const t = document.getElementById(`token-${cur.id}`);
      if (t) t.classList.add('active');
    }
  }

  updateTurnPanel() {
    const p = this.engine.currentPlayer;
    if (!p) return;
    document.getElementById('current-player-name').textContent = p.name;
    document.getElementById('current-player-pos').textContent =
      `સ્થાન: ${toGujaratiNum(p.position)}`;
    document.getElementById('btn-dice').disabled = !this.engine.canRoll() || this.rolling;
  }

  updatePlayersList() {
    const el = document.getElementById('players-list');
    el.innerHTML = '<p class="text-xs text-ink/60 mb-1">ખેલાડીઓ</p>' +
      this.engine.players.map(p => {
        const active = p.id === this.engine.currentPlayer?.id ? 'font-bold text-maroon' : '';
        return `<div class="flex justify-between text-sm ${active}">
          <span><span class="inline-block w-2.5 h-2.5 rounded-full mr-1" style="background:var(--token-${p.id+1})"></span>${p.name}</span>
          <span>${toGujaratiNum(p.position)}</span>
        </div>`;
      }).join('');
  }

  bindGameControls() {
    document.getElementById('btn-dice').addEventListener('click', () => this.onDiceClick());
    document.getElementById('btn-restart').addEventListener('click', () => {
      if (confirm('નવી રમત શરૂ કરવી છે?')) {
        this.showScreen('start');
      }
    });
    document.getElementById('btn-new-game').addEventListener('click', () => {
      this.hideWin();
      this.showScreen('start');
    });
    document.getElementById('btn-continue-card').addEventListener('click', () => this.closeCard());
    document.getElementById('btn-close-card').addEventListener('click', () => this.closeCard());
  }

  bindModals() {}

  async onDiceClick() {
    if (!this.engine.canRoll() || this.rolling) return;
    this.rolling = true;
    const diceEl = document.getElementById('dice-display');
    const btn = document.getElementById('btn-dice');
    btn.disabled = true;
    diceEl.classList.add('dice-rolling');

    for (let i = 0; i < 6; i++) {
      diceEl.textContent = toGujaratiNum(Math.floor(Math.random() * 6) + 1);
      await sleep(80);
    }

    const value = this.engine.rollDice();
    diceEl.classList.remove('dice-rolling');
    diceEl.textContent = toGujaratiNum(value);

    await sleep(300);
    const result = this.engine.applyMove(value);

    this.engine.players.forEach(p => this.moveTokenElement(p));
    this.highlightActiveToken();
    this.updatePlayersList();

    let msg = '';
    if (result?.blocked) {
      msg = 'ચોક્કસ પાસો જરૂરી હતો.';
    } else if (result?.connection) {
      const c = result.connection;
      if (c.type === 'ladder') {
        msg = `નિસરણી! ${c.virtueGu} — ${toGujaratiNum(c.from)} થી ${toGujaratiNum(c.to)}`;
      } else {
        msg = `સર્પ! ${c.viceGu} — ${toGujaratiNum(c.from)} થી ${toGujaratiNum(c.to)}`;
      }
    } else if (result?.won) {
      msg = 'વિજય!';
    } else {
      msg = `આગળ વધ્યા.`;
    }
    document.getElementById('move-message').textContent = msg;

    if (result?.won) {
      this.showWin(this.engine.winner);
    } else if (result?.needsCard) {
      this.showRandomCard(result.landedOn);
    } else {
      this.rolling = false;
      this.updateTurnPanel();
    }
  }

  showRandomCard(landedOn) {
    if (!this.cards.length) {
      this.engine.continueAfterCard();
      this.rolling = false;
      this.updateTurnPanel();
      return;
    }
    const stage = getStageForSquare(landedOn, this.board.stages);
    let pool = this.cards;
    if (stage) {
      const stageCats = {
        1: ['virtue', 'vice', 'philosophy'],
        2: ['reflection', 'virtue'],
        3: ['ethics', 'dharma', 'virtue'],
        4: ['philosophy', 'virtue'],
        5: ['virtue', 'philosophy', 'reflection'],
        6: ['reflection', 'philosophy']
      };
      const cats = stageCats[stage.id] || [];
      const filtered = this.cards.filter(c => cats.includes(c.category));
      if (filtered.length) pool = filtered;
    }
    const card = pool[Math.floor(Math.random() * pool.length)];
    document.getElementById('card-category').textContent = card.category;
    document.getElementById('card-title').textContent = card.titleGu;
    document.getElementById('card-explanation').textContent = card.explanationGu;
    document.getElementById('card-scenario').textContent = card.scenarioGu;
    document.getElementById('card-takeaway').textContent = card.takeawayGu;
    document.getElementById('card-source').textContent = card.source || '';
    const m = document.getElementById('modal-card');
    m.classList.remove('hidden');
    m.classList.add('flex');
  }

  closeCard() {
    const m = document.getElementById('modal-card');
    m.classList.add('hidden');
    m.classList.remove('flex');
    this.engine.continueAfterCard();
    this.rolling = false;
    this.updateTurnPanel();
    this.updatePlayersList();
    this.highlightActiveToken();
  }

  showWin(player) {
    document.getElementById('win-message').textContent = `${player.name} વિજેતા!`;
    const m = document.getElementById('modal-win');
    m.classList.remove('hidden');
    m.classList.add('flex');
    this.rolling = false;
  }

  hideWin() {
    const m = document.getElementById('modal-win');
    m.classList.add('hidden');
    m.classList.remove('flex');
  }
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}
