const grid = document.querySelector('#games-grid');
const search = document.querySelector('#game-search');
const emptyState = document.querySelector('#empty-state');
const emptyTitle = document.querySelector('#empty-title');
const emptyMessage = document.querySelector('#empty-message');
const clearLink = document.querySelector('#clear-link');
const resultsCount = document.querySelector('#results-count');
const catalogTitle = document.querySelector('#catalog-title');
const catalogEyebrow = document.querySelector('#catalog-eyebrow');
const catalogNote = document.querySelector('#catalog-note');
const menu = document.querySelector('#category-menu');
let catalog = [];
let activeFilter = 'all';
let favorites = new Set();
try { favorites = new Set(JSON.parse(localStorage.getItem('voidware-favorites') || '[]')); } catch { /* Storage may be disabled. */ }

const covers = ['linear-gradient(145deg,#79d5fa,#0989d1)', 'linear-gradient(145deg,#a4e7a2,#39a65c)', 'linear-gradient(145deg,#ffcb81,#ef7049)', 'linear-gradient(145deg,#b3a5ff,#6249d7)', 'linear-gradient(145deg,#ff9db7,#eb4f83)', 'linear-gradient(145deg,#ffe880,#f39d37)', 'linear-gradient(145deg,#a3ebe4,#36aaa8)', 'linear-gradient(145deg,#a7c6ff,#4e6ed5)'];
function escapeText(value) { return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]); }
function getVisibleGames() {
  const query = search.value.trim().toLocaleLowerCase();
  return catalog.filter(game => {
    const textMatch = `${game.name} ${game.description || ''} ${game.category || ''}`.toLocaleLowerCase().includes(query);
    const category = String(game.category || '').toLocaleLowerCase();
    const filterMatch = activeFilter === 'all' || (activeFilter === 'new' ? game.isNew : activeFilter === 'math' ? category === 'math' : activeFilter === 'favorites' ? favorites.has(game.id) : true);
    return textMatch && filterMatch;
  });
}
function render() {
  const visible = getVisibleGames();
  grid.innerHTML = visible.map((game, index) => {
    const folder = String(game.folder || '').replace(/^\/+|\/+$/g, '');
    if (!/^[a-zA-Z0-9_-]+$/.test(folder)) return '';
    const cover = game.cover && /^#[\da-f]{3,8}$/i.test(game.cover) ? game.cover : covers[index % covers.length];
    const isFavorite = favorites.has(game.id);
    const icon = escapeText(game.icon || game.name.slice(0, 1).toUpperCase());
    return `<article class="game-card"><a class="game-link" href="games/${encodeURIComponent(folder)}/" aria-label="Play ${escapeText(game.name)}"><div class="game-cover" style="--cover:${cover}"><span class="cover-symbol" aria-hidden="true">${icon}</span><span class="cover-number">${String(index + 1).padStart(2, '0')}</span>${game.isNew ? '<span class="new-badge">NEW</span>' : ''}</div><span class="game-name">${escapeText(game.name)}</span><span class="game-category">${escapeText(game.category || 'Game')}</span></a><button class="favorite-button ${isFavorite ? 'is-favorite' : ''}" type="button" data-favorite="${escapeText(game.id)}" aria-label="${isFavorite ? 'Remove from' : 'Add to'} favorites" aria-pressed="${isFavorite}">♥</button></article>`;
  }).join('');
  // Only count valid entries in the catalog.
  const count = grid.querySelectorAll('.game-card').length;
  resultsCount.textContent = count ? `${count} ${count === 1 ? 'game' : 'games'}` : '';
  grid.hidden = count === 0;
  emptyState.hidden = count !== 0;
  const hasQuery = search.value.trim().length > 0;
  if (hasQuery) {
    emptyTitle.textContent = 'No games found';
    emptyMessage.textContent = 'Try a different search, or clear it to see all games.';
    clearLink.hidden = false;
  } else if (activeFilter === 'favorites') {
    emptyTitle.textContent = 'No favorites yet';
    emptyMessage.textContent = 'Tap the heart on a game to save it here.';
    clearLink.hidden = true;
  } else {
    emptyTitle.textContent = 'No games yet';
    emptyMessage.textContent = 'The game shelves are empty for now. Add a game folder to the catalog and it will appear here.';
    clearLink.hidden = true;
  }
  catalogNote.hidden = count > 0 || hasQuery;
}
function setFilter(filter) {
  activeFilter = filter;
  document.querySelectorAll('[data-filter]').forEach(button => button.classList.toggle('active', button.dataset.filter === filter));
  const titles = { all: ['Unblocked Games', 'TAKE A BREAK'], new: ['New Games', 'JUST ADDED'], math: ['Math Games', 'THINK A LITTLE'], favorites: ['Favorites', 'YOUR SAVED GAMES'] };
  [catalogTitle.textContent, catalogEyebrow.textContent] = titles[filter] || titles.all;
  menu.hidden = true;
  document.querySelector('#menu-button').setAttribute('aria-expanded', 'false');
  render();
}
document.querySelector('.main-nav').addEventListener('click', event => { const button = event.target.closest('[data-filter]'); if (button) setFilter(button.dataset.filter); });
menu.addEventListener('click', event => { const button = event.target.closest('[data-filter]'); if (button) setFilter(button.dataset.filter); });
document.querySelector('#menu-button').addEventListener('click', () => {
  const isOpen = menu.hidden;
  menu.hidden = !isOpen;
  document.querySelector('#menu-button').setAttribute('aria-expanded', String(isOpen));
});
document.querySelector('#favorites-link').addEventListener('click', event => { event.preventDefault(); setFilter('favorites'); });
search.addEventListener('input', () => {
  document.querySelector('#clear-search').hidden = search.value.length === 0;
  render();
});
document.querySelector('#clear-search').addEventListener('click', () => { search.value = ''; search.focus(); document.querySelector('#clear-search').hidden = true; render(); });
clearLink.addEventListener('click', event => { event.preventDefault(); search.value = ''; document.querySelector('#clear-search').hidden = true; render(); });
grid.addEventListener('click', event => {
  const button = event.target.closest('[data-favorite]');
  if (!button) return;
  const id = button.dataset.favorite;
  favorites.has(id) ? favorites.delete(id) : favorites.add(id);
  try { localStorage.setItem('voidware-favorites', JSON.stringify([...favorites])); } catch { /* Favorites remain usable for this page view. */ }
  render();
});
document.addEventListener('click', event => { if (!menu.hidden && !menu.contains(event.target) && !event.target.closest('#menu-button')) { menu.hidden = true; document.querySelector('#menu-button').setAttribute('aria-expanded', 'false'); } });
document.addEventListener('keydown', event => {
  if (event.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) { event.preventDefault(); search.focus(); }
  if (event.key === 'Escape') { menu.hidden = true; document.querySelector('#menu-button').setAttribute('aria-expanded', 'false'); }
});
document.querySelector('#year').textContent = new Date().getFullYear();
fetch('./games/catalog.json').then(response => { if (!response.ok) throw new Error('Catalog could not be loaded'); return response.json(); }).then(data => {
  if (!Array.isArray(data)) throw new Error('Catalog must be a JSON array');
  catalog = data.filter(game => game && typeof game.id === 'string' && typeof game.name === 'string' && typeof game.folder === 'string');
  render();
}).catch(() => {
  catalog = [];
  emptyMessage.textContent = 'The game list could not be loaded. Run this site from a web server and try again.';
  catalogNote.hidden = true;
  render();
});
