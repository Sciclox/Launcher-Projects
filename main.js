const { app, BrowserWindow, ipcMain, dialog, protocol, shell, net } = require('electron');
const path = require('path');
const fs = require('fs');
const child_process = require('child_process');

let mainWindow;

// Define storage file paths
const projectsFilePath = path.join(app.getPath('userData'), 'projects.json');
const settingsFilePath = path.join(app.getPath('userData'), 'settings.json');

// Register custom protocol for serving local media files securely (bypassing file:// restrictions)
protocol.registerSchemesAsPrivileged([
  { scheme: 'media', privileges: { bypassCSP: true, secure: true, supportFetchAPI: true, corsEnabled: true } }
]);

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1080,
    height: 720,
    minWidth: 900,
    minHeight: 600,
    frame: false, // frameless window for cyberpunk custom border feel
    backgroundColor: '#0c0c14',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));

  // Open dev tools if needed
  // mainWindow.webContents.openDevTools();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Set up custom media:// protocol handler
function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.webp':
      return 'image/webp';
    case '.gif':
      return 'image/gif';
    case '.svg':
      return 'image/svg+xml';
    default:
      return 'application/octet-stream';
  }
}

app.whenReady().then(() => {
  protocol.handle('media', (request) => {
    console.log('[Media Protocol] Requested URL:', request.url);
    let filePath = decodeURIComponent(request.url.slice('media://'.length));
    
    // Clean up leading slash on Windows drive letters (e.g. /C:/path -> C:/path)
    if (filePath.startsWith('/') && filePath.match(/^\/[a-zA-Z]:/)) {
      filePath = filePath.slice(1);
    }
    console.log('[Media Protocol] Resolved FilePath:', filePath);
    const exists = fs.existsSync(filePath);
    console.log('[Media Protocol] File Exists:', exists);
    
    try {
      if (exists) {
        const fileBuffer = fs.readFileSync(filePath);
        return new Response(fileBuffer, {
          headers: { 
            'content-type': getMimeType(filePath),
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
    } catch (e) {
      console.error('[Media Protocol] Error:', e);
    }
    return new Response('Not Found', { status: 404 });
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Helper: Load Data
function loadData(filePath, defaultData) {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error(`Error loading data from ${filePath}:`, e);
  }
  return defaultData;
}

// Helper: Save Data
function saveData(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error(`Error saving data to ${filePath}:`, e);
    return false;
  }
}

// Window control handlers
ipcMain.on('window:minimize', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) win.minimize();
});

ipcMain.on('window:maximize', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) {
    if (win.isMaximized()) {
      win.unmaximize();
    } else {
      win.maximize();
    }
  }
});

ipcMain.on('window:close', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) win.close();
});

const iconDir = path.join(app.getPath('userData'), 'icons');
if (!fs.existsSync(iconDir)) {
  fs.mkdirSync(iconDir, { recursive: true });
}

function extractIcon(exePath, gameId) {
  return new Promise((resolve) => {
    if (!exePath || exePath.startsWith('steam://')) {
      resolve(null);
      return;
    }

    const outputFile = path.join(iconDir, `${gameId}.png`);
    if (fs.existsSync(outputFile)) {
      resolve(outputFile);
      return;
    }

    // Windows PowerShell script to extract icon
    const safeExePath = exePath.replace(/'/g, "''");
    const safeOutputPath = outputFile.replace(/'/g, "''");

    const psCommand = `
      Add-Type -AssemblyName System.Drawing;
      if (Test-Path '${safeExePath}') {
        $icon = [System.Drawing.Icon]::ExtractAssociatedIcon('${safeExePath}');
        $bitmap = $icon.ToBitmap();
        $bitmap.Save('${safeOutputPath}', [System.Drawing.Imaging.ImageFormat]::Png);
        $icon.Dispose();
        $bitmap.Dispose();
      }
    `;

    child_process.exec(`powershell -Command "${psCommand.replace(/\n/g, ' ')}"`, (err) => {
      if (err) {
        console.error(`Failed to extract icon for ${gameId}:`, err);
        resolve(null);
      } else {
        resolve(outputFile);
      }
    });
  });
}

// Projects DB Operations
ipcMain.handle('projects:get', async () => {
  const projects = loadData(projectsFilePath, []);
  return projects;
});

ipcMain.handle('projects:save', async (event, projectsList) => {
  const saved = saveData(projectsFilePath, projectsList);
  return saved;
});

// Settings Operations
ipcMain.handle('settings:get', () => {
  return loadData(settingsFilePath, {
    backgroundImage: '',
    themeColor: 'theme-indigo',
    soundEnabled: true,
    volume: 0.5,
    customScanPaths: ['C:\\Users\\Lenovo\\OneDrive\\Documentos\\Proyectos']
  });
});

ipcMain.handle('settings:save', (event, settings) => {
  return saveData(settingsFilePath, settings);
});

// File and Folder dialog triggers
ipcMain.handle('dialog:select-bg', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Seleccionar Imagen de Fondo',
    properties: ['openFile'],
    filters: [
      { name: 'Imágenes', extensions: ['jpg', 'jpeg', 'png', 'webp', 'gif'] }
    ]
  });
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0]; // Returns absolute system path
  }
  return null;
});

ipcMain.handle('dialog:select-exe', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Seleccionar Carpeta del Proyecto',
    properties: ['openDirectory']
  });
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle('dialog:select-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Seleccionar Carpeta a Escanear',
    properties: ['openDirectory']
  });
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

// Launch Project inside IDE / Explorer / Terminal
ipcMain.handle('project:launch', async (event, project, ide) => {
  const { path: projectPath } = project;
  if (!projectPath) return { success: false, error: 'La ruta de la carpeta está vacía.' };
  if (!fs.existsSync(projectPath)) return { success: false, error: `No se encontró la carpeta del proyecto: ${projectPath}` };

  try {
    switch (ide) {
      case 'explorer':
        await shell.openPath(projectPath);
        return { success: true, ide: 'Explorer' };
      case 'terminal':
        child_process.spawn('cmd.exe', ['/c', 'start', 'cmd.exe'], {
          cwd: projectPath,
          detached: true,
          stdio: 'ignore'
        }).unref();
        return { success: true, ide: 'Terminal' };
      case 'vscode':
        child_process.exec(`code "${projectPath}"`, (err) => {
          if (err) {
            console.error('Failed to open with VS Code, falling back to explorer:', err);
            shell.openPath(projectPath);
          }
        });
        return { success: true, ide: 'VS Code' };
      case 'sublime':
        child_process.exec(`subl "${projectPath}"`, (err) => {
          if (err) {
            console.error('Failed to open with Sublime:', err);
          }
        });
        return { success: true, ide: 'Sublime' };
      case 'visualstudio':
        // Search for a .sln file in the directory
        const files = fs.readdirSync(projectPath);
        const slnFile = files.find(f => f.endsWith('.sln'));
        if (slnFile) {
          const slnPath = path.join(projectPath, slnFile);
          child_process.exec(`start "" "${slnPath}"`);
        } else {
          child_process.exec(`devenv "${projectPath}"`);
        }
        return { success: true, ide: 'Visual Studio' };
      case 'pycharm':
        child_process.exec(`pycharm "${projectPath}"`, (err) => {
          if (err) {
            child_process.exec(`charm "${projectPath}"`);
          }
        });
        return { success: true, ide: 'PyCharm' };
      case 'webstorm':
        child_process.exec(`webstorm "${projectPath}"`);
        return { success: true, ide: 'WebStorm' };
      case 'antigravity':
        {
          const idePath = path.join(app.getPath('home'), 'AppData', 'Local', 'Programs', 'Antigravity IDE', 'Antigravity IDE.exe');
          if (fs.existsSync(idePath)) {
            child_process.spawn(idePath, [projectPath], {
              detached: true,
              stdio: 'ignore'
            }).unref();
          } else {
            console.error('Antigravity IDE executable not found at path:', idePath);
            await shell.openPath(projectPath);
          }
        }
        return { success: true, ide: 'Antigravity IDE' };
      case 'antigravity2':
        {
          const idePath = path.join(app.getPath('home'), 'AppData', 'Local', 'Programs', 'Antigravity', 'Antigravity.exe');
          if (fs.existsSync(idePath)) {
            child_process.spawn(idePath, [projectPath], {
              detached: true,
              stdio: 'ignore'
            }).unref();
          } else {
            console.error('Antigravity 2.0 executable not found at path:', idePath);
            await shell.openPath(projectPath);
          }
        }
        return { success: true, ide: 'Antigravity 2.0' };
      default:
        await shell.openPath(projectPath);
        return { success: true, ide: 'Explorer' };
    }
  } catch (e) {
    return { success: false, error: `Error abriendo proyecto: ${e.message}` };
  }
});

// Auto-detect Projects
ipcMain.handle('projects:detect', async (event, customPaths = []) => {
  const detectedProjects = [];
  const searchPaths = customPaths.length > 0 ? customPaths : ['C:\\Users\\Lenovo\\OneDrive\\Documentos\\Proyectos'];

  for (const folder of searchPaths) {
    if (!fs.existsSync(folder)) continue;
    try {
      const subdirs = fs.readdirSync(folder);
      for (const subdir of subdirs) {
        const projectPath = path.join(folder, subdir);
        const stat = fs.statSync(projectPath);
        if (stat.isDirectory()) {
          // Detect technology type
          let platform = 'General';
          const projectFiles = fs.readdirSync(projectPath);
          
          if (projectFiles.includes('package.json') || projectFiles.includes('index.html')) {
            platform = 'NodeJS';
          } else if (projectFiles.includes('requirements.txt') || projectFiles.includes('main.py') || projectFiles.some(f => f.endsWith('.py'))) {
            platform = 'Python';
          } else if (projectFiles.includes('Cargo.toml')) {
            platform = 'Rust';
          } else if (projectFiles.includes('CMakeLists.txt') || projectFiles.some(f => f.endsWith('.sln') || f.endsWith('.csproj'))) {
            platform = 'CPP';
          } else if (projectFiles.includes('.git')) {
            platform = 'Git';
          }

          // Detect local cover/logo
          let cover = '';
          const coverCandidates = ['cover.png', 'cover.jpg', 'cover.jpeg', 'logo.png', 'logo.jpg', 'logo.jpeg', 'screenshot.png', 'screenshot.jpg', 'screenshot.jpeg', 'banner.jpg', 'banner.png'];
          for (const cand of coverCandidates) {
            const lowerFiles = projectFiles.map(f => f.toLowerCase());
            const index = lowerFiles.indexOf(cand);
            if (index !== -1) {
              cover = path.join(projectPath, projectFiles[index]);
              break;
            }
          }

          detectedProjects.push({
            id: `proj-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
            title: subdir.replace(/[_-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
            path: projectPath,
            platform: platform,
            cover: cover,
            favorite: false,
            lastPlayed: 'Nunca',
            ide: 'vscode'
          });
        }
      }
    } catch (e) {
      console.error(`Error scanning folder ${folder}:`, e);
    }
  }

  // Filter out duplicates (based on path)
  const uniqueProjects = [];
  const pathsSet = new Set();
  for (const p of detectedProjects) {
    if (!pathsSet.has(p.path)) {
      pathsSet.add(p.path);
      uniqueProjects.push(p);
    }
  }
  return uniqueProjects;
});

// Read and parse project descripcion.md for description
ipcMain.handle('project:get-readme', async (event, projectPath) => {
  if (!projectPath || !fs.existsSync(projectPath)) {
    return { description: '', technologies: 'General' };
  }
  
  const folderName = path.basename(projectPath);
  const globalDescPath = 'C:\\Users\\Lenovo\\OneDrive\\Documentos\\Proyectos\\descripcion.md';
  
  let description = '';
  let technologies = '';

  // 1. Try to read from the global projects description file
  if (fs.existsSync(globalDescPath)) {
    try {
      const globalContent = fs.readFileSync(globalDescPath, 'utf8');
      // Regex to match "## folderName" followed by description and technologies
      // It matches from "## folderName" until the next "## " header or end of file
      const regex = new RegExp(`##\\s+${folderName}\\r?\\n([\\s\\S]*?)(?=\\r?\\n##\\s+|$)`, 'i');
      const match = globalContent.match(regex);
      if (match) {
        const sectionContent = match[1].trim();
        const lines = sectionContent.split('\n');
        
        let descLines = [];
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          
          const techMatch = trimmed.match(/^\*\*Tecnologías:\*\*\s*(.*)$/i) || trimmed.match(/^Tecnologías:\s*(.*)$/i);
          if (techMatch) {
            technologies = techMatch[1].trim();
          } else {
            descLines.push(trimmed);
          }
        }
        description = descLines.join(' ');
      }
    } catch (e) {
      console.error('Error reading global descripcion.md for project:', folderName, e);
    }
  }

  // 2. Fallback: If not found in global file, read local project-level descripcion.md
  if (!description) {
    try {
      const files = fs.readdirSync(projectPath);
      const descFile = files.find(f => f.toLowerCase() === 'descripcion.md');
      if (descFile) {
        const descPath = path.join(projectPath, descFile);
        let content = fs.readFileSync(descPath, 'utf8');
        
        // Clean up basic markdown symbols to present clean plain text
        content = content
          .replace(/!\[.*?\]\(.*?\)/g, '')
          .replace(/\[(.*?)\]\(.*?\)/g, '$1')
          .replace(/#{1,6}\s+(.*?)\n/g, '$1\n')
          .replace(/(\*\*|__)(.*?)\1/g, '$2')
          .replace(/(\*|_)(.*?)\1/g, '$2')
          .replace(/`{3}[\s\S]*?`{3}/g, '[Código]')
          .replace(/`(.+?)`/g, '$1')
          .trim();

        description = content;
      }
    } catch (e) {
      console.error('Error reading local descripcion.md:', e);
    }
  }

  // Fallback description text
  if (!description) {
    description = `Proyecto de desarrollo local. Ruta del proyecto en el sistema: ${projectPath}`;
  }

  // Limit description length to 350 chars
  if (description.length > 350) {
    description = description.substring(0, 350) + '...';
  }

  return {
    description,
    technologies: technologies || 'General'
  };
});
