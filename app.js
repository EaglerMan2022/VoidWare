(() => {
  const search = document.querySelector('#game-search');
  const grid = document.querySelector('#games-grid');
  const cards = [...grid.querySelectorAll('[data-game-card]')];
  const emptyState = document.querySelector('#empty-state');
  const clearLink = document.querySelector('#clear-link');
  const clearButton = document.querySelector('#clear-search');
  const resultsCount = document.querySelector('#results-count');
  const title = document.querySelector('#catalog-title');
  const eyebrow = document.querySelector('#catalog-eyebrow');
  const menu = document.querySelector('#category-menu');
  const menuButton = document.querySelector('#menu-button');
  let activeFilter = 'all';

  function render() {
    const query = search.value.trim().toLocaleLowerCase();
    let visibleCount = 0;
    for (const card of cards) {
      const matchesSearch = card.dataset.name.includes(query);
      const matchesFilter = activeFilter === 'all' || card.dataset.new === 'true';
      const visible = matchesSearch && matchesFilter;
      card.hidden = !visible;
      if (visible) visibleCount++;
    }
    resultsCount.textContent = `${visibleCount} ${visibleCount === 1 ? 'game' : 'games'}`;
    emptyState.hidden = visibleCount > 0;
    clearLink.hidden = query.length === 0;
    clearButton.hidden = query.length === 0;
  }
  function setFilter(filter) {
    activeFilter = filter === 'new' ? 'new' : 'all';
    document.querySelectorAll('[data-filter]').forEach(button => button.classList.toggle('active', button.dataset.filter === activeFilter));
    title.textContent = activeFilter === 'new' ? 'New Games' : 'Unblocked Games';
    eyebrow.textContent = activeFilter === 'new' ? 'JUST ADDED' : 'TAKE A BREAK';
    menu.hidden = true;
    menuButton.setAttribute('aria-expanded', 'false');
    render();
  }

  document.querySelector('.main-nav').addEventListener('click', event => {
    const button = event.target.closest('[data-filter]');
    if (button) setFilter(button.dataset.filter);
  });
  menu.addEventListener('click', event => {
    const button = event.target.closest('[data-filter]');
    if (button) setFilter(button.dataset.filter);
  });
  menuButton.addEventListener('click', () => {
    const open = menu.hidden;
    menu.hidden = !open;
    menuButton.setAttribute('aria-expanded', String(open));
  });
  search.addEventListener('input', render);
  document.querySelector('.search-form').addEventListener('submit', event => event.preventDefault());
  clearButton.addEventListener('click', () => { search.value = ''; search.focus(); render(); });
  clearLink.addEventListener('click', event => { event.preventDefault(); search.value = ''; render(); });
  document.addEventListener('click', event => {
    if (!menu.hidden && !menu.contains(event.target) && !event.target.closest('#menu-button')) {
      menu.hidden = true;
      menuButton.setAttribute('aria-expanded', 'false');
    }
  });
  document.addEventListener('keydown', event => {
    if (event.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
      event.preventDefault(); search.focus();
    }
    if (event.key === 'Escape') { menu.hidden = true; menuButton.setAttribute('aria-expanded', 'false'); }
  });
  document.querySelector('#year').textContent = new Date().getFullYear();
  render();
})();
