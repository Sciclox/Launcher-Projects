# ⚡ Launcher-Projects (Cyberpunk Developer Deck)

[![Electron](https://img.shields.io/badge/Electron-v30.0-blueviolet?style=flat-square&logo=electron)](https://www.electronjs.org/)
[![NodeJS](https://img.shields.io/badge/Node.js-v18+-green?style=flat-square&logo=node.js)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

A premium Windows-based developer launcher designed with a retro-futuristic **Cyberpunk / Matte Dark Deck** aesthetic. It provides a central command center for scanning, managing, and launching various software development projects directly into their respective IDEs or environments.

---

## 🛠️ Installation & Setup

1. **Prerequisites:** Make sure you have [Node.js](https://nodejs.org/) installed.
2. **Clone the Repository:**
   ```bash
   git clone https://github.com/Sciclox/Launcher-Projects.git
   cd Launcher-Projects
   ```
3. **Install Dependencies:**
   ```bash
   npm install
   ```
4. **Run Application:**
   ```bash
   npm start
   ```

---

## ⚙️ Architecture

* **`main.js`**: Core Electron backend handling IPC handlers, file operations, icon extraction, custom protocols (`media://` to securely stream local image paths to renderer), and shell process executions.
* **`preload.js`**: Safe bridge API connecting Electron processes to the frontend window via `contextBridge`.
* **`src/`**: Rich rendering layers containing standard HTML5 structure, Vanilla HSL styling, and native IPC events in `renderer.js`.
