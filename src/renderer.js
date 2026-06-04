// State Variables
let gamesList = [];
let settings = {
  backgroundImage: '',
  themeColor: 'theme-indigo',
  soundEnabled: true,
  volume: 0.5,
  customScanPaths: []
};
let discoveredGames = [];
let currentHeroGame = null;
let activeFilter = 'all';
let currentDOMIndex = -1;

// DOM Elements
const wallpaperBg = document.getElementById('wallpaper-bg');
const digitalClock = document.getElementById('digital-clock');
const statsGameCount = document.getElementById('stats-game-count');
const searchInput = document.getElementById('search-input');
const gamesGrid = document.getElementById('games-grid'); // Reused for sidebar scrollable games container
const libraryEmpty = document.getElementById('library-empty');
const soundToggleBtn = document.getElementById('sound-toggle-btn');

// Window Controls
document.getElementById('win-min').addEventListener('click', () => window.electronAPI.window.minimize());
document.getElementById('win-max').addEventListener('click', () => window.electronAPI.window.maximize());
document.getElementById('win-close').addEventListener('click', () => window.electronAPI.window.close());

// Console Audio SFX Engine (Web Audio API)
class ConsoleSynth {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playHover() {
    if (!settings.soundEnabled) return;
    this.init();
    
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.015);

    gain.gain.setValueAtTime(0.01 * settings.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.015);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.015);
  }

  playClick() {
    if (!settings.soundEnabled) return;
    this.init();
    
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.04);

    gain.gain.setValueAtTime(0.02 * settings.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.04);
  }

  playLaunch() {
    if (!settings.soundEnabled) return;
    this.init();
    
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.3);

    gain.gain.setValueAtTime(0.01 * settings.volume, now);
    gain.gain.linearRampToValueAtTime(0.04 * settings.volume, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.3);
  }

  playAlert() {
    if (!settings.soundEnabled) return;
    this.init();
    
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.setValueAtTime(554, now + 0.08);

    gain.gain.setValueAtTime(0.03 * settings.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  playScanPulse() {
    if (!settings.soundEnabled) return;
    this.init();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.2);

    gain.gain.setValueAtTime(0.02 * settings.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.2);
  }
}

const synth = new ConsoleSynth();

// Sound Toggle Handler
soundToggleBtn.addEventListener('click', () => {
  settings.soundEnabled = !settings.soundEnabled;
  if (settings.soundEnabled) {
    soundToggleBtn.classList.add('active');
    soundToggleBtn.querySelector('.icon').innerHTML = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5z"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>';
    synth.init();
    synth.playClick();
  } else {
    soundToggleBtn.classList.remove('active');
    soundToggleBtn.querySelector('.icon').innerHTML = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5z"></path><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>';
  }
  saveSettings();
});

// App Startup Initialization
window.addEventListener('DOMContentLoaded', async () => {
  // 1. Load Settings
  settings = await window.electronAPI.settings.get();
  applySettingsUI();

  // 2. Load Games Library
  gamesList = await window.electronAPI.games.get();
  renderGamesSidebar();

  // 3. Setup Navigation tabs
  setupNavigation();

  // 4. Start Clock
  setInterval(updateClock, 1000);
  updateClock();

  // 5. Add Sound Hover listeners to general buttons
  addSoundListenersToButtons();

  // 6. Listen for background icon updates
  window.electronAPI.games.onUpdated((updatedList) => {
    gamesList = updatedList;
    renderGamesSidebar();
  });

  // 7. Setup Bottom Carousel Arrows
  setupCarouselArrows();

  // 8. Setup Game Manage Dropdown Menu
  setupManageDropdown();
});

// Sidebar Collapse Toggle Logic
// Bottom Carousel Scroll Navigation (Infinite Loop Selection)
function setupCarouselArrows() {
  const prevBtn = document.getElementById('carousel-prev-btn');
  const nextBtn = document.getElementById('carousel-next-btn');
  
  if (prevBtn && nextBtn) {
    prevBtn.addEventListener('click', () => {
      const query = searchInput.value.toLowerCase().trim();
      const filtered = gamesList.filter(game => game.title.toLowerCase().includes(query));
      const N = filtered.length;
      if (N === 0) return;
      
      synth.playClick();
      
      let currentIdx = currentDOMIndex;
      if (currentIdx === -1) {
        let origIdx = filtered.findIndex(g => currentHeroGame && g.id === currentHeroGame.id);
        if (origIdx === -1) origIdx = 0;
        currentIdx = N + origIdx;
      }
      
      const targetDOMIdx = currentIdx - 1;
      const originalIdx = ((targetDOMIdx % N) + N) % N;
      const targetProject = filtered[originalIdx];
      
      updateHeroBanner(targetProject);
      centerAndScaleSelectedGame(targetDOMIdx);
    });
    
    nextBtn.addEventListener('click', () => {
      const query = searchInput.value.toLowerCase().trim();
      const filtered = gamesList.filter(game => game.title.toLowerCase().includes(query));
      const N = filtered.length;
      if (N === 0) return;
      
      synth.playClick();
      
      let currentIdx = currentDOMIndex;
      if (currentIdx === -1) {
        let origIdx = filtered.findIndex(g => currentHeroGame && g.id === currentHeroGame.id);
        if (origIdx === -1) origIdx = 0;
        currentIdx = N + origIdx;
      }
      
      const targetDOMIdx = currentIdx + 1;
      const originalIdx = ((targetDOMIdx % N) + N) % N;
      const targetProject = filtered[originalIdx];
      
      updateHeroBanner(targetProject);
      centerAndScaleSelectedGame(targetDOMIdx);
    });
  }
}

// Floating Management Menu Dropdown Toggle Handler
function setupManageDropdown() {
  const triggerBtn = document.getElementById('manage-trigger-btn');
  const dropdown = document.getElementById('manage-dropdown');
  
  if (triggerBtn && dropdown) {
    triggerBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      synth.playClick();
      dropdown.classList.toggle('show');
      triggerBtn.classList.toggle('active');
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#game-manage-menu')) {
        dropdown.classList.remove('show');
        triggerBtn.classList.remove('active');
      }
    });
  }
}

// Navigation & Routing Logic
function setupNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  const sections = document.querySelectorAll('.view-section');

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      synth.playClick();
      
      const target = item.getAttribute('data-target');
      
      navItems.forEach(nav => nav.classList.remove('active'));
      sections.forEach(sec => sec.classList.remove('active'));

      item.classList.add('active');
      document.getElementById(target).classList.add('active');

      // Specific tab loads
      if (target === 'settings-view') {
        renderSettingsScanPaths();
      }
    });
  });
}

// Updates Clock widget
function updateClock() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  digitalClock.textContent = `${hours}:${minutes}:${seconds}`;
}

// Global hook for sound triggers on dynamic buttons
function addSoundListenersToButtons() {
  const interactives = 'button, .nav-item, .filter-tab, .theme-selector, .game-card, .game-fav-btn';
  document.body.addEventListener('mouseenter', (e) => {
    if (e.target.matches && e.target.matches(interactives)) {
      synth.playHover();
    }
  }, true);

  document.body.addEventListener('click', (e) => {
    if (e.target.matches && e.target.matches(interactives)) {
      if (e.target.id !== 'sound-toggle-btn' && !e.target.closest('.nav-item') && !e.target.closest('.filter-tab')) {
        synth.playClick();
      }
    }
  }, true);
}

// Toast Alert System
function showToast(message, type = 'SYS') {
  const toast = document.getElementById('cyber-toast');
  const toastTag = toast.querySelector('.toast-tag');
  const toastMsg = document.getElementById('toast-message');

  toastTag.textContent = type === 'SUCCESS' ? 'Éxito' : type === 'ERROR' ? 'Error' : 'Consola';
  toastMsg.textContent = message;

  // set border color based on type
  if (type === 'SUCCESS') {
    toast.style.borderColor = '#10b981';
  } else if (type === 'ERROR') {
    toast.style.borderColor = '#ef4444';
    synth.playAlert();
  } else {
    toast.style.borderColor = 'var(--primary-glow)';
  }

  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, 4000);
}

// --- COLOR EXTRACTION FROM IMAGE ---
function extractColorsFromImage(imageSrc, callback) {
  const primaryThemeColor = getComputedStyle(document.body).getPropertyValue('--primary-glow').trim() || '#6366f1';
  const accentThemeColor = getComputedStyle(document.body).getPropertyValue('--accent-color').trim() || '#38bdf8';
  const defaultGradient = [primaryThemeColor, accentThemeColor];

  if (!imageSrc) {
    callback(defaultGradient);
    return;
  }

  const img = new Image();
  img.crossOrigin = 'Anonymous';
  img.onload = function() {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 10;
      canvas.height = 10;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, 10, 10);
      const imgData = ctx.getImageData(0, 0, 10, 10).data;
      
      // Calculate average colors on left side and right side
      let r1 = 0, g1 = 0, b1 = 0, count1 = 0;
      let r2 = 0, g2 = 0, b2 = 0, count2 = 0;
      
      for (let y = 0; y < 10; y++) {
        for (let x = 0; x < 5; x++) {
          const idx = (y * 10 + x) * 4;
          r1 += imgData[idx];
          g1 += imgData[idx+1];
          b1 += imgData[idx+2];
          count1++;
        }
        for (let x = 5; x < 10; x++) {
          const idx = (y * 10 + x) * 4;
          r2 += imgData[idx];
          g2 += imgData[idx+1];
          b2 += imgData[idx+2];
          count2++;
        }
      }
      
      r1 = Math.round(r1 / count1);
      g1 = Math.round(g1 / count1);
      b1 = Math.round(b1 / count1);
      
      r2 = Math.round(r2 / count2);
      g2 = Math.round(g2 / count2);
      b2 = Math.round(b2 / count2);
      
      // Keep colors bright and vibrant (avoid dark buttons)
      const brighten = (r, g, b) => {
        const max = Math.max(r, g, b);
        if (max < 80) {
          const factor = 130 / (max || 1);
          return [
            Math.min(255, Math.round(r * factor)),
            Math.min(255, Math.round(g * factor)),
            Math.min(255, Math.round(b * factor))
          ];
        }
        return [r, g, b];
      };
      
      const [br1, bg1, bb1] = brighten(r1, g1, b1);
      const [br2, bg2, bb2] = brighten(r2, g2, b2);
      
      callback([`rgb(${br1}, ${bg1}, ${bb1})`, `rgb(${br2}, ${bg2}, ${bb2})`]);
    } catch (e) {
      console.error('Canvas processing failed, using theme defaults:', e);
      callback(defaultGradient);
    }
  };
  img.onerror = function() {
    callback(defaultGradient);
  };
  img.src = imageSrc;
}

// --- RENDER GAMES SIDEBAR LIBRARY ---
searchInput.addEventListener('input', () => {
  renderGamesSidebar();
});

function getCoverSrc(cover) {
  if (!cover) return '';
  if (cover.startsWith('http://') || cover.startsWith('https://')) {
    return cover;
  }
  const encodedPath = encodeURIComponent(cover).replace(/%2F/g, '/').replace(/%3A/g, ':').replace(/%5C/g, '/');
  return `media:///${encodedPath}`;
}

function getTechBadgeClass(tech) {
  const t = tech.toLowerCase().trim();
  if (t === 'gsap') return 'platform-GSAP';
  if (['nodejs', 'js', 'javascript', 'vite', 'three.js', 'threejs', 'html5', 'html', 'css3', 'css', 'react', 'next.js', 'web', 'rest api', 'api'].includes(t)) {
    return 'platform-NodeJS';
  }
  if (['python', 'py', 'django', 'flask', 'pandas', 'numpy'].includes(t)) {
    return 'platform-Python';
  }
  if (['rust', 'cargo', 'wasm'].includes(t)) {
    return 'platform-Rust';
  }
  if (['c++', 'cpp', '.net', 'c#', 'csharp', 'electron', 'ocr', 'android sdk', 'android api', 'java', 'kotlin'].includes(t)) {
    return 'platform-CPP';
  }
  if (['git', 'github', 'flutter', 'dart', 'flutterflow', 'google translate api', 'google translate', 'adblock', 'adblocker', 'ad block', 'ad engine', 'ad blocker'].includes(t)) {
    return 'platform-Git';
  }
  return 'platform-General';
}

function updateHeroBanner(game) {
  const heroBannerBg = document.getElementById('hero-banner-bg');
  const heroPlatformContainer = document.getElementById('hero-platform-container');
  const heroTitle = document.getElementById('hero-title');
  const heroLastPlayed = document.getElementById('hero-last-played');
  const heroDescription = document.getElementById('hero-description');
  const heroPlayBtn = document.getElementById('hero-play-btn');
  const heroFavBtn = document.getElementById('hero-fav-btn');
  const heroDeleteBtn = document.getElementById('hero-delete-btn');
  const heroChangeBgBtn = document.getElementById('hero-change-bg-btn');
  const heroChangeIconBtn = document.getElementById('hero-change-icon-btn');
  const gameManageMenu = document.getElementById('game-manage-menu');
  const gameFavoriteContainer = document.getElementById('game-favorite-container');

  if (!game) {
    currentHeroGame = null;
    heroTitle.textContent = 'SIN PROYECTOS';
    if (heroPlatformContainer) {
      heroPlatformContainer.innerHTML = '<span class="platform-badge platform-General">GENERAL</span>';
    }
    heroLastPlayed.textContent = 'N/A';
    heroDescription.textContent = 'No hay proyectos registrados en tu biblioteca. Escanea carpetas locales o añade uno de forma manual.';
    heroBannerBg.style.backgroundImage = 'none';
    
    // Hide toolbar row when no project is loaded
    const heroToolbarRow = document.getElementById('hero-toolbar-row');
    if (heroToolbarRow) {
      heroToolbarRow.style.display = 'none';
    }
    
    // Hide IDE selector when no project is loaded
    const ideSelectWrap = document.querySelector('.ide-selector-wrap');
    if (ideSelectWrap) {
      ideSelectWrap.style.display = 'none';
    }

    // Default gradient style for empty state play button
    const defaultPrimary = getComputedStyle(document.body).getPropertyValue('--primary-glow').trim() || '#6366f1';
    const defaultAccent = getComputedStyle(document.body).getPropertyValue('--accent-color').trim() || '#38bdf8';
    heroPlayBtn.style.background = `linear-gradient(135deg, ${defaultPrimary} 0%, ${defaultAccent} 100%)`;

    // Bind Play button to add project redirection
    const newPlayBtn = heroPlayBtn.cloneNode(true);
    newPlayBtn.textContent = 'AÑADIR PROYECTOS';
    heroPlayBtn.parentNode.replaceChild(newPlayBtn, heroPlayBtn);
    newPlayBtn.addEventListener('click', () => {
      document.querySelector('[data-target=add-view]').click();
    });
    
    // Bind Fav button to nothing
    const newFavBtn = heroFavBtn.cloneNode(true);
    newFavBtn.textContent = 'FAVORITO';
    newFavBtn.classList.remove('active');
    heroFavBtn.parentNode.replaceChild(newFavBtn, heroFavBtn);
    return;
  }

  currentHeroGame = game;
  heroTitle.textContent = game.title;
  heroLastPlayed.textContent = game.lastPlayed || 'NUNCA';
  
  // Set initial default platform badge in container
  if (heroPlatformContainer) {
    heroPlatformContainer.innerHTML = '';
    const defaultBadge = document.createElement('span');
    defaultBadge.className = `platform-badge platform-${game.platform}`;
    defaultBadge.textContent = game.platform === 'CPP' ? 'C++ / .NET' : game.platform.toUpperCase();
    heroPlatformContainer.appendChild(defaultBadge);
  }
  
  // Custom description and technology tags from global descripcion.md
  heroDescription.textContent = 'Cargando información del proyecto...';
  window.electronAPI.games.getReadme(game.path).then((data) => {
    if (currentHeroGame && currentHeroGame.id === game.id) {
      if (data && typeof data === 'object') {
        heroDescription.textContent = data.description || `Proyecto de desarrollo local. Ruta del proyecto en el sistema: ${game.path}`;
        
        // Render multiple technology tags dynamically
        if (data.technologies && heroPlatformContainer) {
          heroPlatformContainer.innerHTML = '';
          const techs = data.technologies.split(',').map(t => t.trim()).filter(Boolean);
          techs.forEach(tech => {
            const tBadge = document.createElement('span');
            const colorClass = getTechBadgeClass(tech);
            tBadge.className = `platform-badge ${colorClass}`;
            tBadge.textContent = tech.toUpperCase();
            heroPlatformContainer.appendChild(tBadge);
          });
        }
      } else {
        heroDescription.textContent = data || `Proyecto de desarrollo local. Ruta del proyecto en el sistema: ${game.path}`;
      }
    }
  }).catch((err) => {
    if (currentHeroGame && currentHeroGame.id === game.id) {
      heroDescription.textContent = `Proyecto de desarrollo local. Ruta del proyecto en el sistema: ${game.path}`;
    }
  });

  // Show toolbar row
  const heroToolbarRow = document.getElementById('hero-toolbar-row');
  if (heroToolbarRow) {
    heroToolbarRow.style.display = 'flex';
  }
  if (gameManageMenu) {
    // Collapse dropdown on select
    const manageDropdown = document.getElementById('manage-dropdown');
    const manageTriggerBtn = document.getElementById('manage-trigger-btn');
    if (manageDropdown) manageDropdown.classList.remove('show');
    if (manageTriggerBtn) manageTriggerBtn.classList.remove('active');
  }

  // Show and bind IDE select
  const ideSelect = document.getElementById('project-ide-select');
  const ideSelectWrap = document.querySelector('.ide-selector-wrap');
  if (ideSelectWrap) {
    ideSelectWrap.style.display = 'block';
  }
  if (ideSelect) {
    const newIdeSelect = ideSelect.cloneNode(true);
    ideSelect.parentNode.replaceChild(newIdeSelect, ideSelect);
    newIdeSelect.value = game.ide || 'vscode';
    newIdeSelect.addEventListener('change', async (e) => {
      if (currentHeroGame) {
        currentHeroGame.ide = e.target.value;
        await saveGamesList();
      }
    });
  }

  // Set Hero background cover: use game.background if set, or game.cover
  let bgUrl = '';
  if (game.background) {
    bgUrl = getCoverSrc(game.background);
  } else if (game.cover) {
    bgUrl = getCoverSrc(game.cover);
  }

  if (bgUrl) {
    heroBannerBg.style.backgroundImage = `url('${bgUrl}')`;
  } else {
    heroBannerBg.style.backgroundImage = 'none';
  }

  // Extract color gradient and apply it to the play button
  extractColorsFromImage(bgUrl, (gradientColors) => {
    heroPlayBtn.style.background = `linear-gradient(135deg, ${gradientColors[0]} 0%, ${gradientColors[1]} 100%)`;
    heroPlayBtn.style.boxShadow = `0 6px 20px rgba(0, 0, 0, 0.4), 0 0 15px ${gradientColors[0]}44`;
  });

  // Clone and bind Play button
  const newPlayBtn = heroPlayBtn.cloneNode(true);
  newPlayBtn.textContent = 'ABRIR PROYECTO';
  heroPlayBtn.parentNode.replaceChild(newPlayBtn, heroPlayBtn);
  newPlayBtn.addEventListener('click', async () => {
    const currentIde = document.getElementById('project-ide-select').value;
    synth.playLaunch();
    showToast(`Abriendo ${game.title} con ${currentIde.toUpperCase()}...`, 'SYS');
    const result = await window.electronAPI.games.launch(game, currentIde);
    if (result.success) {
      const now = new Date();
      game.lastPlayed = `${now.getDate()}/${now.getMonth() + 1} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      await saveGamesList();
      renderGamesSidebar();
      updateHeroBanner(game); // refresh statistics
    } else {
      showToast(`Error al abrir el proyecto: ${result.error}`, 'ERROR');
    }
  });

  // Clone and bind Fav button
  const newFavBtn = heroFavBtn.cloneNode(true);
  newFavBtn.textContent = game.favorite ? 'FAVORITO (ACTIVO)' : 'FAVORITO';
  if (game.favorite) {
    newFavBtn.classList.add('active');
  } else {
    newFavBtn.classList.remove('active');
  }
  heroFavBtn.parentNode.replaceChild(newFavBtn, heroFavBtn);
  newFavBtn.addEventListener('click', async () => {
    game.favorite = !game.favorite;
    await saveGamesList();
    renderGamesSidebar();
    updateHeroBanner(game);
    synth.playClick();
    showToast(`${game.title} ${game.favorite ? 'añadido a favoritos' : 'removido de favoritos'}`, 'SUCCESS');
  });

  // Clone and bind Background Image Selector button
  const newBgBtn = heroChangeBgBtn.cloneNode(true);
  heroChangeBgBtn.parentNode.replaceChild(newBgBtn, heroChangeBgBtn);
  newBgBtn.addEventListener('click', async () => {
    synth.playClick();
    const bgPath = await window.electronAPI.dialog.selectBackground();
    if (bgPath) {
      game.background = bgPath;
      await saveGamesList();
      renderGamesSidebar();
      updateHeroBanner(game);
      showToast(`Imagen de fondo personalizada cargada para ${game.title}.`, 'SUCCESS');
    }
  });

  // Clone and bind Icon Selector button
  const newIconBtn = heroChangeIconBtn.cloneNode(true);
  heroChangeIconBtn.parentNode.replaceChild(newIconBtn, heroChangeIconBtn);
  newIconBtn.addEventListener('click', async () => {
    synth.playClick();
    const iconPath = await window.electronAPI.dialog.selectBackground();
    if (iconPath) {
      game.cover = iconPath;
      game.customCover = true;
      await saveGamesList();
      renderGamesSidebar();
      updateHeroBanner(game);
      showToast(`Icono de biblioteca cargado para ${game.title}.`, 'SUCCESS');
    }
  });

  // Clone and bind Delete button
  const newDelBtn = heroDeleteBtn.cloneNode(true);
  heroDeleteBtn.parentNode.replaceChild(newDelBtn, heroDeleteBtn);
  newDelBtn.addEventListener('click', async () => {
    if (confirm(`¿Eliminar ${game.title} del organizador?`)) {
      gamesList = gamesList.filter(g => g.id !== game.id);
      await saveGamesList();
      renderGamesSidebar();
      showToast(`${game.title} eliminado del organizador`, 'SYS');
    }
  });
}

function renderGamesSidebar() {
  const query = searchInput.value.toLowerCase().trim();
  
  // Filter list
  const filtered = gamesList.filter(game => {
    return game.title.toLowerCase().includes(query);
  });

  // Clear sidebar list
  gamesGrid.innerHTML = '';

  // Update total counts
  statsGameCount.textContent = gamesList.length;

  if (filtered.length === 0) {
    libraryEmpty.style.display = 'flex';
    gamesGrid.style.display = 'none';
    updateHeroBanner(null);
    return;
  }

  libraryEmpty.style.display = 'none';
  gamesGrid.style.display = 'flex';

  // Render cards in triplicated list for visual infinite scrolling loop
  let domIndex = 0;
  for (let copy = 0; copy < 3; copy++) {
    filtered.forEach((game, originalIndex) => {
      const card = document.createElement('div');
      card.className = `game-card ${game.favorite ? 'is-favorite' : ''}`;
      card.setAttribute('data-id', game.id);
      card.setAttribute('data-dom-index', domIndex);
      card.setAttribute('data-original-index', originalIndex);
      
      const currentIdx = domIndex; // capture current block scope value
      
      // Thumbnail cover
      const isIcon = game.cover && !game.cover.startsWith('http') && !game.customCover;
      let coverHTML = '';
      if (game.cover) {
        const imgSrc = getCoverSrc(game.cover);
        coverHTML = `<img src="${imgSrc}" alt="${game.title}" class="${isIcon ? 'game-icon-img' : 'game-cover-img'}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">`;
      }

      const initials = game.title
        .split(' ')
        .slice(0, 2)
        .map(w => w[0])
        .join('')
        .toUpperCase();

      card.innerHTML = `
        <div class="game-cover-container ${isIcon ? 'has-icon' : ''}">
          ${coverHTML}
          <div class="game-cover-fallback" style="${game.cover ? 'display:none;' : 'display:flex;'}">
            <div class="fallback-initials">${initials}</div>
          </div>
        </div>
      `;

      // Click handler to select game and display details
      card.addEventListener('click', () => {
        synth.playClick();
        
        // Activate library-view tab if other tabs were active
        const libraryTabBtn = document.querySelector('.nav-item[data-target="library-view"]');
        if (!libraryTabBtn.classList.contains('active')) {
          libraryTabBtn.click();
        }
        
        // Center and scale selected game cover and update view details
        currentDOMIndex = currentIdx;
        centerAndScaleSelectedGame(currentIdx);
        updateHeroBanner(game);
      });

      gamesGrid.appendChild(card);
      domIndex++;
    });
  }

  // Set default selected game details and trigger center scale layout
  if (filtered.length > 0) {
    const stillExists = currentHeroGame && filtered.some(g => g.id === currentHeroGame.id);
    const selectedGame = stillExists ? filtered.find(g => g.id === currentHeroGame.id) : filtered[0];
    const originalIndex = filtered.indexOf(selectedGame);
    
    currentDOMIndex = filtered.length + originalIndex;
    updateHeroBanner(selectedGame);
    
    // Delay slightly to ensure elements are rendered and layout coordinates are readable
    setTimeout(() => {
      centerAndScaleSelectedGame(currentDOMIndex);
    }, 80);
  }
}

// Apply dynamic scaling and opacity fade based on distance from selected game (Focal Lens effect)
function applyLensEffects(cards, targetIndex) {
  cards.forEach((card, idx) => {
    const coverContainer = card.querySelector('.game-cover-container');
    const titleText = card.querySelector('.game-title-text');
    
    if (coverContainer) {
      const diff = Math.abs(idx - targetIndex);
      
      // Math formula for focal lens zoom and opacity fade
      const scale = Math.max(0.5, 1.5 - diff * 0.3);
      const opacity = Math.max(0.25, 1.0 - diff * 0.25);
      
      if (diff === 0) {
        coverContainer.style.borderColor = 'var(--primary-glow)';
        coverContainer.style.boxShadow = '0 0 20px rgba(var(--primary-glow-rgb), 0.6)';
        card.classList.add('active-selected');
        if (titleText) {
          titleText.style.opacity = '1.0';
          titleText.style.fontWeight = '800';
          titleText.style.color = '#fff';
          titleText.style.transform = 'translateY(18px)';
        }
      } else {
        card.classList.remove('active-selected');
        coverContainer.style.borderColor = 'transparent';
        coverContainer.style.boxShadow = 'none';
        if (titleText) {
          titleText.style.opacity = '0';
          titleText.style.transform = 'translateY(0)';
        }
      }
      
      coverContainer.style.transform = `scale(${scale})`;
      card.style.opacity = opacity;
    }
  });
}

// Center the selected game and scale adjacent items dynamically (Focal Lens effect)
function centerAndScaleSelectedGame(selectedDOMIndex) {
  const cards = document.querySelectorAll('.games-carousel-scroll .game-card');
  if (cards.length === 0) return;
  
  // Find selected index
  let targetIndex = parseInt(selectedDOMIndex);
  if (isNaN(targetIndex) || targetIndex < 0 || targetIndex >= cards.length) {
    if (typeof selectedDOMIndex === 'string') {
      const foundIdx = Array.from(cards).findIndex(card => card.getAttribute('data-id') === selectedDOMIndex);
      if (foundIdx !== -1) {
        targetIndex = foundIdx;
      } else {
        return;
      }
    } else {
      return;
    }
  }
  
  currentDOMIndex = targetIndex;
  
  // Center the selected card inside the viewport
  const selectedCard = cards[targetIndex];
  const grid = document.getElementById('games-grid');
  if (grid && selectedCard) {
    const scrollLeft = selectedCard.offsetLeft - (grid.clientWidth / 2) + (selectedCard.clientWidth / 2);
    grid.scrollTo({ left: scrollLeft, behavior: 'smooth' });
  }
  
  // Apply dynamic scaling and opacity fade
  applyLensEffects(cards, targetIndex);

  // Boundary snapping logic for infinite continuous loop
  const query = searchInput.value.toLowerCase().trim();
  const filtered = gamesList.filter(game => game.title.toLowerCase().includes(query));
  const N = filtered.length;
  if (N > 0) {
    if (targetIndex < N) {
      // In first copy (Copy 0). Smooth scroll first, then instantly snap to middle copy (Copy 1)
      const snapTargetIndex = targetIndex + N;
      setTimeout(() => {
        if (currentDOMIndex === targetIndex) {
          currentDOMIndex = snapTargetIndex;
          const snapCard = cards[snapTargetIndex];
          if (grid && snapCard) {
            const snapScrollLeft = snapCard.offsetLeft - (grid.clientWidth / 2) + (snapCard.clientWidth / 2);
            
            // Apply no-transition helper class to prevent visual shrinking/growing transitions during snapping
            grid.classList.add('no-transition');
            grid.style.scrollBehavior = 'auto';
            grid.scrollLeft = snapScrollLeft;
            applyLensEffects(cards, snapTargetIndex);
            
            grid.offsetHeight; // force layout engine reflow
            
            grid.classList.remove('no-transition');
            grid.style.scrollBehavior = 'smooth';
          }
        }
      }, 310);
    } else if (targetIndex >= 2 * N) {
      // In third copy (Copy 2). Smooth scroll first, then instantly snap to middle copy (Copy 1)
      const snapTargetIndex = targetIndex - N;
      setTimeout(() => {
        if (currentDOMIndex === targetIndex) {
          currentDOMIndex = snapTargetIndex;
          const snapCard = cards[snapTargetIndex];
          if (grid && snapCard) {
            const snapScrollLeft = snapCard.offsetLeft - (grid.clientWidth / 2) + (snapCard.clientWidth / 2);
            
            // Apply no-transition helper class to prevent visual shrinking/growing transitions during snapping
            grid.classList.add('no-transition');
            grid.style.scrollBehavior = 'auto';
            grid.scrollLeft = snapScrollLeft;
            applyLensEffects(cards, snapTargetIndex);
            
            grid.offsetHeight; // force layout engine reflow
            
            grid.classList.remove('no-transition');
            grid.style.scrollBehavior = 'smooth';
          }
        }
      }, 310);
    }
  }
}

async function saveGamesList() {
  await window.electronAPI.games.save(gamesList);
}

// --- AUTO-SCANNING MODULE ---
const startScanBtn = document.getElementById('start-scan-btn');
const scanProgress = document.getElementById('scan-progress');
const discoveredContainer = document.getElementById('discovered-container');
const discoveredList = document.getElementById('discovered-list');
const discoveredCount = document.getElementById('discovered-count');
const selectAllDiscovered = document.getElementById('select-all-discovered');
const importGamesBtn = document.getElementById('import-games-btn');

let scanAudioInterval = null;

startScanBtn.addEventListener('click', async () => {
  synth.playClick();
  startScanBtn.disabled = true;
  scanProgress.style.display = 'block';
  discoveredContainer.style.display = 'none';
  
  // Play recurring scan pulses
  synth.playScanPulse();
  scanAudioInterval = setInterval(() => {
    synth.playScanPulse();
  }, 1000);

  try {
    // Run async background scan IPC passing custom folders configured in settings
    discoveredGames = await window.electronAPI.games.detect(settings.customScanPaths);
    
    clearInterval(scanAudioInterval);
    startScanBtn.disabled = false;
    scanProgress.style.display = 'none';

    // Remove already added games from the detected list to avoid cluttering results
    const existingPaths = new Set(gamesList.map(g => g.path));
    discoveredGames = discoveredGames.filter(g => !existingPaths.has(g.path));

    renderDiscoveredGames();
  } catch (e) {
    clearInterval(scanAudioInterval);
    startScanBtn.disabled = false;
    scanProgress.style.display = 'none';
    showToast(`Error al escanear: ${e.message}`, 'ERROR');
  }
});

function renderDiscoveredGames() {
  discoveredList.innerHTML = '';
  discoveredCount.textContent = discoveredGames.length;

  if (discoveredGames.length === 0) {
    showToast('No se encontraron nuevas carpetas de proyectos.', 'SYS');
    discoveredContainer.style.display = 'none';
    return;
  }

  discoveredContainer.style.display = 'block';

  discoveredGames.forEach((game, index) => {
    const row = document.createElement('div');
    row.className = 'discovered-row';
    row.innerHTML = `
      <div class="discovered-row-left">
        <label class="custom-checkbox-container">
          <input type="checkbox" class="import-checkbox" data-index="${index}" checked>
          <span class="checkmark"></span>
        </label>
        <span class="disc-platform platform-${game.platform}">${game.platform}</span>
        <span class="disc-title">${game.title}</span>
        <span class="disc-path" title="${game.path}">${game.path}</span>
      </div>
    `;
    discoveredList.appendChild(row);
  });
}

// Check/Uncheck all
selectAllDiscovered.addEventListener('change', (e) => {
  const checkboxes = discoveredList.querySelectorAll('.import-checkbox');
  checkboxes.forEach(cb => cb.checked = e.target.checked);
});

importGamesBtn.addEventListener('click', async () => {
  const checkboxes = discoveredList.querySelectorAll('.import-checkbox:checked');
  if (checkboxes.length === 0) {
    showToast('Selecciona al menos un proyecto para importar.', 'ERROR');
    return;
  }

  let importedCount = 0;
  checkboxes.forEach(cb => {
    const index = parseInt(cb.getAttribute('data-index'));
    const game = discoveredGames[index];
    
    // Add to library list
    gamesList.push(game);
    importedCount++;
  });

  await saveGamesList();
  renderGamesSidebar();

  showToast(`Importación exitosa. ${importedCount} proyectos agregados.`, 'SUCCESS');
  
  // Clear lists and redirect to library tab
  discoveredContainer.style.display = 'none';
  discoveredGames = [];
  document.querySelector('[data-target=library-view]').click();
});

// --- MANUAL ADDITION MÓDULO ---
const addGameForm = document.getElementById('add-game-form');
const browseExeBtn = document.getElementById('browse-exe-btn');
const gameTitleInput = document.getElementById('game-title');
const gamePathInput = document.getElementById('game-path');
const gamePlatformInput = document.getElementById('game-platform');
const gameCoverInput = document.getElementById('game-cover');
const browseCoverBtn = document.getElementById('browse-cover-btn');

browseCoverBtn.addEventListener('click', async () => {
  synth.playClick();
  const filePath = await window.electronAPI.dialog.selectBackground();
  if (filePath) {
    gameCoverInput.value = filePath;
  }
});

browseExeBtn.addEventListener('click', async () => {
  synth.playClick();
  const filePath = await window.electronAPI.dialog.selectExe();
  if (filePath) {
    gamePathInput.value = filePath;
    
    // Extract base name from path to autofill title if blank
    if (!gameTitleInput.value) {
      const parts = filePath.split(/[\\/]/);
      const filename = parts[parts.length - 1];
      const nameWithoutExtension = filename.substring(0, filename.lastIndexOf('.')) || filename;
      
      // Clean name
      gameTitleInput.value = nameWithoutExtension
        .replace(/[_-]/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
    }
  }
});

addGameForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const title = gameTitleInput.value.trim();
  const path = gamePathInput.value.trim();
  const platform = gamePlatformInput.value;
  const cover = gameCoverInput.value.trim();

  // Validate duplicate executable
  if (gamesList.some(g => g.path === path)) {
    showToast('Este proyecto ya está registrado.', 'ERROR');
    return;
  }

  const newGame = {
    id: `custom-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    title,
    path,
    platform,
    cover,
    favorite: false,
    lastPlayed: 'Nunca',
    ide: 'vscode'
  };

  gamesList.push(newGame);
  await saveGamesList();
  renderGamesSidebar();

  showToast(`${title} registrado en el organizador.`, 'SUCCESS');

  // Reset form
  addGameForm.reset();
  
  // Redirect to Library tab
  document.querySelector('[data-target=library-view]').click();
});

// --- CONFIGURATION MÓDULO ---
const themeSelectors = document.querySelectorAll('.theme-selector');
const selectBgBtn = document.getElementById('select-bg-btn');
const clearBgBtn = document.getElementById('clear-bg-btn');
const bgPathDisplay = document.getElementById('bg-path-display');
const addScanPathBtn = document.getElementById('add-scan-path-btn');
const customPathsList = document.getElementById('custom-paths-list');

// Accent Colors
themeSelectors.forEach(selector => {
  selector.addEventListener('click', () => {
    const theme = selector.getAttribute('data-theme');
    
    themeSelectors.forEach(s => s.classList.remove('active'));
    selector.classList.add('active');

    // Update body theme class
    document.body.className = '';
    document.body.classList.add(theme);

    settings.themeColor = theme;
    saveSettings();
    
    synth.playClick();
    showToast(`Tema de color cambiado a ${theme.replace('theme-', '').toUpperCase()}`, 'SUCCESS');
    
    // Refresh colors if active
    if (currentHeroGame) {
      updateHeroBanner(currentHeroGame);
    }
  });
});

// Wallpaper File Trigger
selectBgBtn.addEventListener('click', async () => {
  synth.playClick();
  const bgPath = await window.electronAPI.dialog.selectBackground();
  if (bgPath) {
    settings.backgroundImage = bgPath;
    applyBackground(bgPath);
    saveSettings();
    showToast('Fondo de pantalla personalizado cargado.', 'SUCCESS');
  }
});

clearBgBtn.addEventListener('click', () => {
  settings.backgroundImage = '';
  applyBackground('');
  saveSettings();
  showToast('Fondo por defecto restaurado.', 'SYS');
});

// Custom Paths Scanner Add
addScanPathBtn.addEventListener('click', async () => {
  synth.playClick();
  const folderPath = await window.electronAPI.dialog.selectFolder();
  if (folderPath) {
    if (settings.customScanPaths.includes(folderPath)) {
      showToast('Esta ruta ya está registrada.', 'ERROR');
      return;
    }

    settings.customScanPaths.push(folderPath);
    saveSettings();
    renderSettingsScanPaths();
    showToast('Directorio de escaneo añadido.', 'SUCCESS');
  }
});

function renderSettingsScanPaths() {
  customPathsList.innerHTML = '';

  const indicatorLed = document.getElementById('custom-scan-path-led');
  if (settings.customScanPaths.length > 0) {
    indicatorLed.classList.add('checked');
  } else {
    indicatorLed.classList.remove('checked');
  }

  if (settings.customScanPaths.length === 0) {
    customPathsList.innerHTML = '<div class="path-empty-message">No se han configurado rutas de escaneo adicionales.</div>';
    return;
  }

  settings.customScanPaths.forEach((folderPath, index) => {
    const item = document.createElement('div');
    item.className = 'path-item';
    item.innerHTML = `
      <span class="path-text" title="${folderPath}">${folderPath}</span>
      <button class="path-remove-btn" data-index="${index}" title="Eliminar Carpeta">QUITAR</button>
    `;

    item.querySelector('.path-remove-btn').addEventListener('click', () => {
      settings.customScanPaths.splice(index, 1);
      saveSettings();
      renderSettingsScanPaths();
      showToast('Directorio de escaneo eliminado.', 'SYS');
    });

    customPathsList.appendChild(item);
  });
}

function applyBackground(pathStr) {
  if (pathStr) {
    const encodedPath = encodeURIComponent(pathStr).replace(/%2F/g, '/').replace(/%3A/g, ':').replace(/%5C/g, '/');
    wallpaperBg.style.backgroundImage = `url('media:///${encodedPath}')`;
    bgPathDisplay.textContent = `Fondo: ${pathStr}`;
    clearBgBtn.style.display = 'inline-block';
  } else {
    wallpaperBg.style.backgroundImage = 'none';
    bgPathDisplay.textContent = 'Fondo: Consola Minimalista (Por defecto)';
    clearBgBtn.style.display = 'none';
  }
}

function applySettingsUI() {
  // Theme Color
  document.body.className = '';
  document.body.classList.add(settings.themeColor);
  
  themeSelectors.forEach(s => {
    if (s.getAttribute('data-theme') === settings.themeColor) {
      s.classList.add('active');
    } else {
      s.classList.remove('active');
    }
  });

  // Sound Config
  if (settings.soundEnabled) {
    soundToggleBtn.classList.add('active');
    soundToggleBtn.querySelector('.icon').innerHTML = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5z"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>';
  } else {
    soundToggleBtn.classList.remove('active');
    soundToggleBtn.querySelector('.icon').innerHTML = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5z"></path><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>';
  }

  // Background Image
  applyBackground(settings.backgroundImage);
}

async function saveSettings() {
  await window.electronAPI.settings.save(settings);
}
