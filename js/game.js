/**
 * Gyāna Chopad — Core game engine
 * State, turns, movement, snakes/ladders, win detection.
 */

const TOKEN_COLORS = ['p1', 'p2', 'p3', 'p4'];

export class GameEngine {
  constructor({ board, connections, exactWin = true }) {
    this.board = board;
    this.ladders = new Map(connections.ladders.map(l => [l.from, l]));
    this.snakes = new Map(connections.snakes.map(s => [s.from, s]));
    this.exactWin = exactWin;
    this.totalSquares = board.totalSquares || 72;
    this.winSquare = board.winSquare || 72;
    this.players = [];
    this.currentIndex = 0;
    this.phase = 'waiting'; // waiting | rolling | moving | card | finished
    this.lastDice = null;
    this.mode = 'classic';
    this.winner = null;
    this.listeners = [];
  }

  on(event, fn) {
    this.listeners.push({ event, fn });
  }

  emit(event, data) {
    this.listeners.filter(l => l.event === event).forEach(l => l.fn(data));
  }

  setup(playerNames, mode = 'classic', exactWin = true) {
    this.mode = mode;
    this.exactWin = exactWin;
    this.players = playerNames.map((name, i) => ({
      id: i,
      name: name.trim() || `ખેલાડી ${i + 1}`,
      position: 0,
      finished: false,
      tokenClass: TOKEN_COLORS[i]
    }));
    this.currentIndex = 0;
    this.phase = 'waiting';
    this.lastDice = null;
    this.winner = null;
    this.emit('setup', { players: this.players });
  }

  get currentPlayer() {
    return this.players[this.currentIndex];
  }

  canRoll() {
    return this.phase === 'waiting' && !this.winner;
  }

  rollDice() {
    if (!this.canRoll()) return null;
    this.phase = 'rolling';
    const value = Math.floor(Math.random() * 6) + 1;
    this.lastDice = value;
    this.emit('dice', { value, player: this.currentPlayer });
    return value;
  }

  /**
   * Apply movement after dice. Returns result object.
   */
  applyMove(diceValue) {
    if (this.phase !== 'rolling' && this.phase !== 'waiting') return null;
    this.phase = 'moving';
    const player = this.currentPlayer;
    const from = player.position;
    let to = from + diceValue;

    // Exact win rule
    if (to > this.winSquare) {
      if (this.exactWin) {
        this.emit('move', {
          player,
          from,
          to: from,
          dice: diceValue,
          blocked: true,
          message: 'ચોક્કસ પાસો જરૂરી — આગળ નહીં વધ્યા'
        });
        this.phase = 'waiting';
        this.nextTurn();
        return { blocked: true };
      }
      to = this.winSquare;
    }

    player.position = to;

    let connection = null;
    let finalPos = to;

    if (this.ladders.has(to)) {
      connection = { type: 'ladder', ...this.ladders.get(to) };
      finalPos = connection.to;
      player.position = finalPos;
    } else if (this.snakes.has(to)) {
      connection = { type: 'snake', ...this.snakes.get(to) };
      finalPos = connection.to;
      player.position = finalPos;
    }

    const won = finalPos >= this.winSquare;
    if (won) {
      player.finished = true;
      player.position = this.winSquare;
      this.winner = player;
      this.phase = 'finished';
      this.emit('move', {
        player,
        from,
        to: finalPos,
        dice: diceValue,
        connection,
        won: true
      });
      this.emit('win', { player });
      return { won: true, connection };
    }

    this.emit('move', {
      player,
      from,
      to: finalPos,
      dice: diceValue,
      connection,
      landedOn: to
    });

    // Reflection mode may pause for card
    if (this.mode === 'reflection') {
      this.phase = 'card';
      return { needsCard: true, landedOn: to, connection, finalPos };
    }

    this.phase = 'waiting';
    this.nextTurn();
    return { connection, finalPos };
  }

  continueAfterCard() {
    if (this.phase !== 'card') return;
    this.phase = 'waiting';
    this.nextTurn();
  }

  nextTurn() {
    if (this.winner) return;
    const n = this.players.length;
    let next = (this.currentIndex + 1) % n;
    let guard = 0;
    while (this.players[next].finished && guard < n) {
      next = (next + 1) % n;
      guard++;
    }
    this.currentIndex = next;
    this.emit('turn', { player: this.currentPlayer, index: this.currentIndex });
  }

  getConnectionAt(square) {
    if (this.ladders.has(square)) return { type: 'ladder', ...this.ladders.get(square) };
    if (this.snakes.has(square)) return { type: 'snake', ...this.snakes.get(square) };
    return null;
  }

  restart() {
    this.players.forEach(p => {
      p.position = 0;
      p.finished = false;
    });
    this.currentIndex = 0;
    this.phase = 'waiting';
    this.lastDice = null;
    this.winner = null;
    this.emit('restart', { players: this.players });
  }
}
