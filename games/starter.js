(() => {
  const page = document.querySelector('[data-game-name]');
  if (!page) return;
  const name = page.dataset.gameName;
  document.title = `${name} — VoidWare`;
  document.querySelector('#game-title').textContent = name;
  const scoreElement = document.querySelector('#score');
  const area = document.querySelector('#play-area');
  const target = document.querySelector('#target');
  let score = 0;
  function moveTarget() {
    const maxX = Math.max(0, area.clientWidth - target.offsetWidth);
    const maxY = Math.max(0, area.clientHeight - target.offsetHeight);
    target.style.left = `${Math.floor(Math.random() * (maxX + 1))}px`;
    target.style.top = `${Math.floor(Math.random() * (maxY + 1))}px`;
  }
  target.addEventListener('click', () => { score++; scoreElement.textContent = String(score); moveTarget(); });
  window.addEventListener('resize', moveTarget);
  moveTarget();
})();
