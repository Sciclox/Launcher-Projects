const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Window actions
  window: {
    minimize: () => ipcRenderer.send('window:minimize'),
    maximize: () => ipcRenderer.send('window:maximize'),
    close: () => ipcRenderer.send('window:close')
  },
  
  // Project operations
  games: {
    get: () => ipcRenderer.invoke('projects:get'),
    save: (projectsList) => ipcRenderer.invoke('projects:save', projectsList),
    detect: (customPaths) => ipcRenderer.invoke('projects:detect', customPaths),
    launch: (project, ide) => ipcRenderer.invoke('project:launch', project, ide),
    getReadme: (projectPath) => ipcRenderer.invoke('project:get-readme', projectPath),
    onUpdated: (callback) => {
      const listener = (event, list) => callback(list);
      ipcRenderer.on('projects:updated', listener);
      return () => ipcRenderer.removeListener('projects:updated', listener);
    }
  },
  
  // Settings operations
  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    save: (settings) => ipcRenderer.invoke('settings:save', settings)
  },
  
  // Dialog operations
  dialog: {
    selectBackground: () => ipcRenderer.invoke('dialog:select-bg'),
    selectExe: () => ipcRenderer.invoke('dialog:select-exe'),
    selectFolder: () => ipcRenderer.invoke('dialog:select-folder')
  }
});
