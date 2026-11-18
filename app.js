const games = [
  { id: 'snake', title: 'Neon Snake', category: 'arcade', label: 'ARCADE', description: 'Eat, grow, and try not to run into yourself.', icon: '⌁', badge: 'CLASSIC', cover: 'snake', instructions: 'Arrow keys or WASD to move. Eat the glowing dots and avoid the walls.' },
  { id: 'pong', title: 'Pocket Pong', category: 'arcade', label: 'ARCADE', description: 'A tiny paddle. A very determined ball.', icon: '◫', badge: '1 OR 2 PLAYERS', cover: 'pong', instructions: 'Move with W/S or ↑/↓. Player two can use I/K. First to 7 wins.' },
  { id: '2048', title: '2048', category: 'puzzle', label: 'PUZZLE', description: 'Slide matching tiles together. How high can you get?', icon: '▦', badge: 'BRAIN BREAK', cover: '2048', instructions: 'Use the arrow keys to slide tiles. Combine matching numbers to reach 2048.' }
];
const grid = document.querySelector('#games-grid');
const searchInput = document.querySelector('#game-search');
const emptyState = document.querySelector('#empty-state');
const countLabel = document.querySelector('#game-count');
const dialog = document.querySelector('#game-dialog');
const stage = document.querySelector('#game-stage');
const statusLabel = document.querySelector('#game-status');
let activeFilter = 'all';
let activeGame = null;
let stopCurrentGame = null;
let favorites = new Set(JSON.parse(localStorage.getItem('voidware-favorites') || '[]'));

function renderGames() {
  const query = searchInput.value.trim().toLowerCase();
  const visible = games.filter(game => {
    const matchesText = `${game.title} ${game.description} ${game.category}`.toLowerCase().includes(query);
    const matchesFilter = activeFilter === 'all' || game.category === activeFilter || (activeFilter === 'favorites' && favorites.has(game.id));
    return matchesText && matchesFilter;
  });
  grid.innerHTML = visible.map(game => `
    <article class="game-card">
      <div class="game-cover cover-${game.cover}">
        <span class="cover-label">VOID / 00${games.indexOf(game) + 1}</span><span class="cover-badge">${game.badge}</span>
        ${coverArt(game)}
        <button class="favorite-button ${favorites.has(game.id) ? 'is-favorite' : ''}" data-favorite="${game.id}" type="button" aria-label="${favorites.has(game.id) ? 'Remove' : 'Add'} ${game.title} ${favorites.has(game.id) ? 'from' : 'to'} favorites" aria-pressed="${favorites.has(game.id)}">${favorites.has(game.id) ? '♥' : '♡'}</button>
      </div>
      <div class="game-info"><div class="game-info-top"><h3>${game.title}</h3><span class="game-type">${game.label}</span></div><p>${game.description}</p><button class="play-button" data-play="${game.id}" type="button">Play game <span aria-hidden="true">↗</span></button></div>
    </article>`).join('');
  countLabel.textContent = String(visible.length).padStart(2, '0');
  emptyState.hidden = visible.length > 0;
  grid.hidden = visible.length === 0;
}
function coverArt(game) {
  if (game.id === 'snake') return '<div class="cover-snake-art" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div><span class="cover-food"></span>';
  if (game.id === 'pong') return '<div class="pong-art" aria-hidden="true"><i class="pong-paddle"></i><i class="pong-paddle right"></i><i class="pong-ball"></i></div>';
  return '<div class="tiles-art" aria-hidden="true"><i></i><i></i><i></i><i></i><i>8</i><i></i><i></i><i></i><i></i></div>';
}
grid.addEventListener('click', event => {
  const playButton = event.target.closest('[data-play]');
  const favoriteButton = event.target.closest('[data-favorite]');
  if (playButton) launchGame(playButton.dataset.play);
  if (favoriteButton) {
    const id = favoriteButton.dataset.favorite;
    favorites.has(id) ? favorites.delete(id) : favorites.add(id);
    localStorage.setItem('voidware-favorites', JSON.stringify([...favorites]));
    renderGames();
  }
});
document.querySelector('.filters').addEventListener('click', event => {
  const button = event.target.closest('[data-filter]');
  if (!button) return;
  activeFilter = button.dataset.filter;
  document.querySelectorAll('.filter-chip').forEach(chip => chip.classList.toggle('selected', chip === button));
  renderGames();
});
searchInput.addEventListener('input', renderGames);
document.querySelector('#reset-filters').addEventListener('click', () => {
  searchInput.value = '';
  activeFilter = 'all';
  document.querySelectorAll('.filter-chip').forEach(chip => chip.classList.toggle('selected', chip.dataset.filter === 'all'));
  renderGames();
});
document.addEventListener('keydown', event => {
  if (event.key === '/' && !dialog.open && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
    event.preventDefault(); searchInput.focus();
  }
  if (event.key === 'Escape' && dialog.open) closeGame();
});
document.querySelector('#close-game').addEventListener('click', closeGame);
document.querySelector('#restart-game').addEventListener('click', () => activeGame && launchGame(activeGame));
document.querySelector('#fullscreen-game').addEventListener('click', async () => {
  try { if (!document.fullscreenElement) await dialog.requestFullscreen(); else await document.exitFullscreen(); } catch { statusLabel.textContent = 'FULLSCREEN IS NOT AVAILABLE'; }
});
dialog.addEventListener('click', event => { if (event.target === dialog) closeGame(); });
dialog.addEventListener('close', cleanupGame);
document.querySelector('#year').textContent = new Date().getFullYear();

function launchGame(id) {
  const game = games.find(item => item.id === id);
  if (!game) return;
  cleanupGame(); activeGame = id; stage.innerHTML = '';
  document.querySelector('#dialog-title').textContent = game.title;
  document.querySelector('#dialog-subtitle').textContent = game.instructions;
  document.querySelector('#dialog-icon').textContent = game.icon;
  statusLabel.textContent = 'READY TO PLAY';
  if (!dialog.open) dialog.showModal();
  if (id === 'snake') stopCurrentGame = startSnake();
  if (id === 'pong') stopCurrentGame = startPong();
  if (id === '2048') stopCurrentGame = start2048();
}
function cleanupGame() {
  if (stopCurrentGame) stopCurrentGame();
  stopCurrentGame = null;
  if (stage) stage.innerHTML = '';
}
function closeGame() { if (dialog.open) dialog.close(); activeGame = null; }
function makeCanvas(width, height) {
  const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
  canvas.setAttribute('aria-label', 'Playable game canvas'); stage.append(canvas); return canvas;
}
function startSnake() {
  const canvas = makeCanvas(480, 480), ctx = canvas.getContext('2d');
  const size = 20, cells = 24;
  let snake, direction, nextDirection, food, score, timer, over;
  function reset() {
    snake = [{ x: 11, y: 12 }, { x: 10, y: 12 }, { x: 9, y: 12 }]; direction = { x: 1, y: 0 }; nextDirection = direction;
    score = 0; over = false; food = randomFood(); statusLabel.textContent = 'SCORE 00'; draw(); clearInterval(timer); timer = setInterval(tick, 115);
  }
  function randomFood() { let spot; do { spot = { x: Math.floor(Math.random() * cells), y: Math.floor(Math.random() * cells) }; } while (snake && snake.some(part => part.x === spot.x && part.y === spot.y)); return spot; }
  function draw() {
    ctx.fillStyle = '#0c1016'; ctx.fillRect(0, 0, 480, 480);
    ctx.strokeStyle = '#ffffff08'; ctx.lineWidth = 1;
    for (let i = 0; i <= cells; i++) { ctx.beginPath(); ctx.moveTo(i * size, 0); ctx.lineTo(i * size, 480); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, i * size); ctx.lineTo(480, i * size); ctx.stroke(); }
    ctx.fillStyle = '#ae8bff'; ctx.shadowColor = '#ae8bff'; ctx.shadowBlur = 18; ctx.beginPath(); ctx.arc(food.x * size + 10, food.y * size + 10, 5, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
    snake.forEach((part, index) => { ctx.fillStyle = index === 0 ? '#e2ffa3' : `rgba(200,241,105,${Math.max(.24, .92 - index * .09)})`; ctx.shadowColor = '#c8f169'; ctx.shadowBlur = index === 0 ? 13 : 0; ctx.beginPath(); ctx.roundRect(part.x * size + 2, part.y * size + 2, size - 4, size - 4, 5); ctx.fill(); }); ctx.shadowBlur = 0;
    if (over) { ctx.fillStyle = '#080a0dcc'; ctx.fillRect(0, 0, 480, 480); ctx.textAlign = 'center'; ctx.fillStyle = '#f3f2ef'; ctx.font = '600 30px Space Grotesk, sans-serif'; ctx.fillText('GAME OVER', 240, 218); ctx.fillStyle = '#c8f169'; ctx.font = '14px DM Mono, monospace'; ctx.fillText(`SCORE ${score}  ·  PRESS ENTER TO RETRY`, 240, 250); }
  }
  function tick() {
    if (over) return;
    direction = nextDirection; const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };
    const ate = head.x === food.x && head.y === food.y;
    if (head.x < 0 || head.x >= cells || head.y < 0 || head.y >= cells || snake.slice(0, ate ? undefined : -1).some(part => part.x === head.x && part.y === head.y)) {
      over = true; clearInterval(timer); statusLabel.textContent = `GAME OVER · SCORE ${score}`; draw(); return;
    }
    snake.unshift(head); if (ate) { score++; food = randomFood(); statusLabel.textContent = `SCORE ${String(score).padStart(2, '0')}`; } else snake.pop(); draw();
  }
  function onKey(event) {
    const dirs = { ArrowUp: [0, -1], w: [0, -1], W: [0, -1], ArrowDown: [0, 1], s: [0, 1], S: [0, 1], ArrowLeft: [-1, 0], a: [-1, 0], A: [-1, 0], ArrowRight: [1, 0], d: [1, 0], D: [1, 0] };
    if (dirs[event.key]) { event.preventDefault(); const [x, y] = dirs[event.key]; if (x !== -direction.x || y !== -direction.y) nextDirection = { x, y }; }
    if (event.key === 'Enter' && over) reset();
  }
  window.addEventListener('keydown', onKey); reset();
  return () => { clearInterval(timer); window.removeEventListener('keydown', onKey); };
}
function startPong() {
  const canvas = makeCanvas(640, 400), ctx = canvas.getContext('2d');
  let leftY = 160, rightY = 160, ball = { x: 320, y: 200, vx: 4, vy: 2.5 }, leftScore = 0, rightScore = 0, keys = new Set(), animation, finished = false;
  const paddleH = 78;
  function resetBall(direction) { ball = { x: 320, y: 200, vx: 4 * direction, vy: (Math.random() * 3 - 1.5) || 1 }; }
  function draw() {
    ctx.fillStyle = '#0c1016'; ctx.fillRect(0, 0, 640, 400); ctx.strokeStyle = '#ffffff20'; ctx.setLineDash([6, 8]); ctx.beginPath(); ctx.moveTo(320, 15); ctx.lineTo(320, 385); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = '#c8f169'; ctx.shadowColor = '#c8f169'; ctx.shadowBlur = 12; ctx.fillRect(23, leftY, 8, paddleH); ctx.fillStyle = '#ae8bff'; ctx.shadowColor = '#ae8bff'; ctx.fillRect(609, rightY, 8, paddleH); ctx.shadowBlur = 14; ctx.fillStyle = '#f4f4ef'; ctx.beginPath(); ctx.arc(ball.x, ball.y, 7, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
    ctx.textAlign = 'center'; ctx.font = '500 29px DM Mono, monospace'; ctx.fillStyle = '#c8f169'; ctx.fillText(leftScore, 270, 48); ctx.fillStyle = '#ae8bff'; ctx.fillText(rightScore, 370, 48);
    if (finished) { ctx.fillStyle = '#080a0dcc'; ctx.fillRect(0, 0, 640, 400); ctx.fillStyle = '#f3f2ef'; ctx.font = '600 28px Space Grotesk, sans-serif'; ctx.fillText(leftScore > rightScore ? 'YOU WIN!' : 'NICE TRY!', 320, 190); ctx.fillStyle = '#c8f169'; ctx.font = '13px DM Mono, monospace'; ctx.fillText('PRESS ENTER TO PLAY AGAIN', 320, 222); }
  }
  function frame() {
    if (finished) { draw(); return; }
    if (keys.has('w') || keys.has('W') || keys.has('ArrowUp')) leftY -= 5; if (keys.has('s') || keys.has('S') || keys.has('ArrowDown')) leftY += 5;
    // The right paddle follows the ball with a little lag, keeping solo play friendly.
    if (ball.x > 320) rightY += Math.sign(ball.y - (rightY + paddleH / 2)) * Math.min(3.2, Math.abs(ball.y - (rightY + paddleH / 2)) * .055);
    leftY = Math.max(0, Math.min(400 - paddleH, leftY)); rightY = Math.max(0, Math.min(400 - paddleH, rightY));
    ball.x += ball.vx; ball.y += ball.vy;
    if (ball.y < 8 || ball.y > 392) ball.vy *= -1;
    if (ball.vx < 0 && ball.x < 38 && ball.y > leftY - 5 && ball.y < leftY + paddleH + 5) { ball.vx *= -1.04; ball.vy += (ball.y - leftY - paddleH / 2) * .045; }
    if (ball.vx > 0 && ball.x > 602 && ball.y > rightY - 5 && ball.y < rightY + paddleH + 5) { ball.vx *= -1.04; ball.vy += (ball.y - rightY - paddleH / 2) * .045; }
    if (ball.x < 0) { rightScore++; resetBall(1); } if (ball.x > 640) { leftScore++; resetBall(-1); }
    statusLabel.textContent = `YOU ${leftScore} — ${rightScore} CPU`;
    if (leftScore >= 7 || rightScore >= 7) finished = true;
    draw(); animation = requestAnimationFrame(frame);
  }
  function onKey(event) { if (['ArrowUp', 'ArrowDown', ' '].includes(event.key)) event.preventDefault(); keys.add(event.key); if (event.key === 'Enter' && finished) { leftScore = 0; rightScore = 0; finished = false; resetBall(1); } }
  function onUp(event) { keys.delete(event.key); }
  window.addEventListener('keydown', onKey); window.addEventListener('keyup', onUp); frame();
  return () => { cancelAnimationFrame(animation); window.removeEventListener('keydown', onKey); window.removeEventListener('keyup', onUp); };
}
function start2048() {
  let board, score = 0, over = false;
  const container = document.createElement('div'); container.className = 'game2048';
  container.innerHTML = '<div class="game2048-head"><span class="game2048-score">SCORE <strong id="score2048">0</strong></span><button class="text-button" id="new2048" type="button">New game ↻</button></div><div class="game2048-grid" id="grid2048" role="grid" aria-label="2048 game board"></div><p class="game2048-hint">Use your arrow keys to slide the tiles</p>';
  stage.append(container);
  const boardEl = container.querySelector('#grid2048');
  function addTile() { const open = []; board.forEach((value, i) => { if (!value) open.push(i); }); if (!open.length) return; board[open[Math.floor(Math.random() * open.length)]] = Math.random() < .9 ? 2 : 4; }
  function render() {
    boardEl.innerHTML = board.map(value => `<div class="tile2048" role="gridcell" data-value="${value || ''}">${value || ''}</div>`).join('');
    container.querySelector('#score2048').textContent = score;
    if (over) { statusLabel.textContent = 'NO MORE MOVES · START A NEW GAME'; }
    else if (board.includes(2048)) statusLabel.textContent = '2048! KEEP GOING IF YOU LIKE';
    else statusLabel.textContent = `SCORE ${score}`;
  }
  function reset() { board = Array(16).fill(0); score = 0; over = false; addTile(); addTile(); render(); }
  function move(direction) {
    if (over) return;
    const previous = board.join(',');
    for (let line = 0; line < 4; line++) {
      let indexes = Array.from({ length: 4 }, (_, n) => direction === 'left' ? line * 4 + n : direction === 'right' ? line * 4 + (3 - n) : direction === 'up' ? n * 4 + line : (3 - n) * 4 + line);
      let values = indexes.map(index => board[index]).filter(Boolean), merged = [];
      for (let i = 0; i < values.length; i++) {
        if (values[i] === values[i + 1]) { merged.push(values[i] * 2); score += values[i] * 2; i++; } else merged.push(values[i]);
      }
      while (merged.length < 4) merged.push(0);
      indexes.forEach((index, i) => board[index] = merged[i]);
    }
    if (previous !== board.join(',')) { addTile(); if (board.every(Boolean) && !hasMove()) over = true; render(); }
  }
  function hasMove() { for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { const i = y * 4 + x; if (!board[i] || (x < 3 && board[i] === board[i + 1]) || (y < 3 && board[i] === board[i + 4])) return true; } return false; }
  function onKey(event) { const moves = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' }; if (moves[event.key]) { event.preventDefault(); move(moves[event.key]); } }
  const newButton = container.querySelector('#new2048'); newButton.addEventListener('click', reset); window.addEventListener('keydown', onKey);
  // Basic swipe controls make the puzzle playable on touch screens too.
  let touchStart = null;
  function touchDown(event) { touchStart = { x: event.changedTouches[0].clientX, y: event.changedTouches[0].clientY }; }
  function touchUp(event) { if (!touchStart) return; const dx = event.changedTouches[0].clientX - touchStart.x, dy = event.changedTouches[0].clientY - touchStart.y; if (Math.max(Math.abs(dx), Math.abs(dy)) > 25) move(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up')); touchStart = null; }
  boardEl.addEventListener('touchstart', touchDown, { passive: true }); boardEl.addEventListener('touchend', touchUp, { passive: true });
  reset();
  return () => { window.removeEventListener('keydown', onKey); newButton.removeEventListener('click', reset); };
}
renderGames();
