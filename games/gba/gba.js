(() => {
  const form = document.querySelector('#rom-form');
  const fileInput = document.querySelector('#rom-file');
  const fileName = document.querySelector('#file-name');
  const launchButton = document.querySelector('#launch-button');
  const status = document.querySelector('#status');
  const playerShell = document.querySelector('#player-shell');
  const player = document.querySelector('#game');
  const romList = document.querySelector('#rom-list');
  const romLibraryStatus = document.querySelector('#rom-library-status');
  const refreshRomsButton = document.querySelector('#refresh-roms');

  let romUrl = null;
  let loaderScript = null;
  let romListRequest = 0;

  function setStatus(message, kind = '') {
    status.textContent = message;
    status.className = `status ${kind}`.trim();
  }

  function disposeEmulator() {
    if (loaderScript) {
      loaderScript.remove();
      loaderScript = null;
    }

    for (const key of [
      'EJS_player',
      'EJS_core',
      'EJS_gameUrl',
      'EJS_pathtodata',
      'EJS_startOnLoaded',
      'EJS_onGameStart',
      'EJS_onLoad'
    ]) {
      try {
        delete window[key];
      } catch {
        window[key] = undefined;
      }
    }

    player.replaceChildren();

    if (romUrl) {
      URL.revokeObjectURL(romUrl);
      romUrl = null;
    }
  }

  function formatSize(bytes) {
    if (!Number.isFinite(bytes) || bytes < 0) {
      return 'Size unavailable';
    }

    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  async function loadRomList() {
    const requestId = ++romListRequest;

    romLibraryStatus.textContent = 'Loading GBA files…';
    romLibraryStatus.className = 'library-status';
    romList.replaceChildren();
    refreshRomsButton.disabled = true;

    try {
      // GitHub Pages cannot list a folder directly, so use the public GitHub
      // Contents API to discover .gba files in the repository folder.
      const apiUrl =
        'https://api.github.com/repos/EaglerMan2022/VoidWare/contents/games/gba/gbafiles?ref=main';

      const response = await fetch(apiUrl, {
        headers: {
          Accept: 'application/vnd.github+json'
        },
        cache: 'no-store'
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('GitHub API rate limit reached. Try Refresh later.');
        }

        throw new Error(`GitHub returned ${response.status}.`);
      }

      const entries = await response.json();

      // Ignore an older response if Refresh was clicked again while loading.
      if (requestId !== romListRequest) {
        return;
      }

      if (!Array.isArray(entries)) {
        throw new Error('The GBA files folder could not be read.');
      }

      const roms = entries
        .filter(entry =>
          entry.type === 'file' &&
          typeof entry.name === 'string' &&
          entry.name.toLowerCase().endsWith('.gba') &&
          typeof entry.download_url === 'string'
        )
        .sort((a, b) =>
          a.name.localeCompare(b.name, undefined, {
            sensitivity: 'base',
            numeric: true
          })
        );

      if (roms.length === 0) {
        romLibraryStatus.textContent =
          'No .gba files found. Add files to games/gba/gbafiles/ and refresh.';
        return;
      }

      romLibraryStatus.textContent =
        `${roms.length} ${roms.length === 1 ? 'file' : 'files'} available`;

      const fragment = document.createDocumentFragment();

      for (const rom of roms) {
        const row = document.createElement('li');
        row.className = 'rom-row';

        const details = document.createElement('div');
        details.className = 'rom-details';

        const name = document.createElement('span');
        name.className = 'rom-name';
        name.textContent = rom.name;

        const size = document.createElement('span');
        size.className = 'rom-size';
        size.textContent = formatSize(rom.size);

        details.append(name, size);

        const download = document.createElement('a');
        download.className = 'download-link';
        download.href = rom.download_url;
        download.download = rom.name;
        download.rel = 'noopener';
        download.textContent = 'Download ↓';
        download.setAttribute(
          'aria-label',
          `Download ${rom.name}, ${formatSize(rom.size)}`
        );

        row.append(details, download);
        fragment.append(row);
      }

      romList.append(fragment);
    } catch (error) {
      if (requestId !== romListRequest) {
        return;
      }

      romLibraryStatus.textContent =
        `Could not load the GBA file list: ${error.message}`;
      romLibraryStatus.className = 'library-status error';
    } finally {
      if (requestId === romListRequest) {
        refreshRomsButton.disabled = false;
      }
    }
  }

  refreshRomsButton.addEventListener('click', loadRomList);

  fileInput.addEventListener('change', () => {
    const file = fileInput.files && fileInput.files[0];
    const valid =
      file &&
      (
        file.name.toLowerCase().endsWith('.gba') ||
        file.type === 'application/octet-stream'
      );

    launchButton.disabled = !valid;

    if (!file) {
      fileName.textContent = 'No game selected';
      setStatus('Select a .gba file to get started.');
      return;
    }

    if (!valid) {
      fileName.textContent = file.name;
      setStatus('Please choose a Game Boy Advance .gba ROM file.', 'error');
      return;
    }

    if (file.size > 64 * 1024 * 1024) {
      launchButton.disabled = true;
      setStatus('This file is larger than the 64 MB limit.', 'error');
      return;
    }

    fileName.textContent =
      `${file.name} · ${(file.size / (1024 * 1024)).toFixed(1)} MB`;
    setStatus('Ready. Your file stays in this browser session.', 'success');
  });

  form.addEventListener('submit', event => {
    event.preventDefault();

    const file = fileInput.files && fileInput.files[0];

    if (!file || launchButton.disabled) {
      return;
    }

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
    window.EJS_onGameStart = () =>
      setStatus('Game started. Have fun!', 'success');
    window.EJS_onLoad = () =>
      setStatus('Emulator ready. Starting your game…');

    loaderScript = document.createElement('script');
    loaderScript.src = `${window.EJS_pathtodata}loader.js`;
    loaderScript.async = true;
    loaderScript.onerror = () => {
      disposeEmulator();
      playerShell.hidden = true;
      launchButton.disabled = false;
      setStatus(
        'Could not load EmulatorJS. Check your connection and try again.',
        'error'
      );
    };

    document.head.append(loaderScript);

    window.setTimeout(() => {
      if (loaderScript && !player.querySelector('canvas, iframe')) {
        setStatus(
          'Still loading? EmulatorJS needs a connection. If it does not start, try again.'
        );
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

  // Load the ROM list automatically when the page opens.
  loadRomList();
})();
