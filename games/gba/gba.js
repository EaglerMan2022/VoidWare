(() => {
  const form = document.querySelector('#rom-form');
  const fileInput = document.querySelector('#rom-file');
  const fileName = document.querySelector('#file-name');
  const launchButton = document.querySelector('#launch-button');
  const status = document.querySelector('#status');
  const playerShell = document.querySelector('#player-shell');
  const player = document.querySelector('#game');
  let romUrl = null;
  let loaderScript = null;

  function setStatus(message, kind = '') {
    status.textContent = message;
    status.className = `status ${kind}`.trim();
  }
  function disposeEmulator() {
    if (loaderScript) {
      loaderScript.remove();
      loaderScript = null;
    }
    for (const key of ['EJS_player', 'EJS_core', 'EJS_gameUrl', 'EJS_pathtodata', 'EJS_startOnLoaded', 'EJS_onGameStart', 'EJS_onLoad']) {
      try { delete window[key]; } catch { window[key] = undefined; }
    }
    player.replaceChildren();
    if (romUrl) URL.revokeObjectURL(romUrl);
    romUrl = null;
  }
  fileInput.addEventListener('change', () => {
    const file = fileInput.files && fileInput.files[0];
    const valid = file && (file.name.toLowerCase().endsWith('.gba') || file.type === 'application/octet-stream');
    launchButton.disabled = !valid;
    if (!file) { fileName.textContent = 'No game selected'; setStatus('Select a .gba file to get started.'); return; }
    if (!valid) { fileName.textContent = file.name; setStatus('Please choose a Game Boy Advance .gba ROM file.', 'error'); return; }
    if (file.size > 64 * 1024 * 1024) { launchButton.disabled = true; setStatus('This file is larger than the 64 MB limit.', 'error'); return; }
    fileName.textContent = `${file.name} · ${(file.size / (1024 * 1024)).toFixed(1)} MB`;
    setStatus('Ready. Your file stays in this browser session.', 'success');
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    const file = fileInput.files && fileInput.files[0];
    if (!file || launchButton.disabled) return;
    disposeEmulator();
    romUrl = URL.createObjectURL(file);
    playerShell.hidden = false;
    launchButton.disabled = true;
    setStatus('Loading the emulator…');
    player.replaceChildren();
    window.EJS_player = '#game';
    window.EJS_core = 'gba';
    window.EJS_gameUrl = romUrl;
    window.EJS_pathtodata = 'https://cdn.emulatorjs.org/stable/data/';
    window.EJS_startOnLoaded = true;
    window.EJS_onGameStart = () => setStatus('Game started. Have fun!', 'success');
    window.EJS_onLoad = () => setStatus('Emulator ready. Starting your game…');
    loaderScript = document.createElement('script');
    loaderScript.src = `${window.EJS_pathtodata}loader.js`;
    loaderScript.async = true;
    loaderScript.onerror = () => { disposeEmulator(); playerShell.hidden = true; launchButton.disabled = false; setStatus('Could not load EmulatorJS. Check your connection and try again.', 'error'); };
    document.head.append(loaderScript);
    // If the emulator CDN fails during initialization, offer a useful retry message.
    window.setTimeout(() => {
      if (loaderScript && !player.querySelector('canvas, iframe')) {
        setStatus('Still loading? EmulatorJS needs a connection. If it does not start, try again.', '');
      }
    }, 12000);
  });
  document.querySelector('#close-player').addEventListener('click', () => {
    disposeEmulator();
    playerShell.hidden = true;
    launchButton.disabled = false;
    setStatus('Game closed. Your selected file is still available to launch again.');
  });
  window.addEventListener('pagehide', disposeEmulator);
})();
