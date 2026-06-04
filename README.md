# ⚡ Launcher-Projects (Cyberpunk Developer Deck)

[![Electron](https://img.shields.io/badge/Electron-v30.0-blueviolet?style=flat-square&logo=electron)](https://www.electronjs.org/)
[![NodeJS](https://img.shields.io/badge/Node.js-v18+-green?style=flat-square&logo=node.js)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

A premium Windows-based developer launcher designed with a retro-futuristic **Cyberpunk / Matte Dark Deck** aesthetic. It provides a central command center for scanning, managing, and launching various software development projects directly into their respective IDEs or environments.

---

## 🎨 Preview & Aesthetics

* Frameless design with neon-cyan accents and subtle micro-animations.
* Interactive sidebar for quick navigation (Dashboard, Projects, Settings).
* Fluid 3D-like hover effects on project cards and action buttons.
* Custom global `descripcion.md` parsing to fetch rich descriptions and technology tags automatically.

---

## 🚀 Key Features

* **Multi-IDE & Terminal Support:** Open projects with one click in:
  * **Antigravity IDE** & **Antigravity 2.0** (Built-in next-generation IDEs)
  * **VS Code**
  * **Sublime Text**
  * **Visual Studio** (Auto-detects `.sln` and starts the appropriate compiler)
  * **JetBrains WebStorm & PyCharm**
  * **System Terminal** (CMD)
  * **File Explorer**
* **Auto-Discovery:** Automatically scans paths (like `C:\Users\Lenovo\OneDrive\Documentos\Proyectos`) and detects project types (NodeJS, Python, Rust, C++, Git, etc.) and cover images (such as `cover.png` or `screenshot.png`).
* **Rich Descriptions Parser:** Parses the parent folder's `descripcion.md` file dynamically using custom regular expressions to extract clean tech badges and descriptive text.
* **Persisted Database:** Saves settings, favorites, window bounds, volume, and scanning targets using local JSON files.

---

## 📂 Featured Showcase Projects

The launcher is pre-configured to showcase and launch the following 7 core projects:

1. **`Web-Market-Coffee` (Three.js Web App)**
   * *Description:* An interactive 3D virtual coffee shop simulation with fluid camera orbits and GSAP transitions.
   * *Stack:* `Three.js`, `GSAP`, `Vite`, `HTML5/CSS3`
2. **`Launcher-Projects` (Electron Dashboard - This App)**
   * *Description:* The main retro-futurism control panel and launcher.
   * *Stack:* `Electron`, `JavaScript`, `NodeJS`, `PowerShell API`
3. **`Foresight` (Flutter Web)**
   * *Description:* Multi-platform analytics frontend for interactive charts and responsive business dashboards.
   * *Stack:* `Flutter`, `Dart`, `FlutterFlow`, `REST APIs`
4. **`Habit-Buddy` (React Mobile Web)**
   * *Description:* Productive habit tracking assistant with gamified rewards and Capacitor wrappers.
   * *Stack:* `Capacitor`, `React`, `SQLite`, `Android/iOS`
5. **`Novel-Writer` (Flutter Desktop)**
   * *Description:* Distraction-free Markdown editor designed for authors writing long-form books.
   * *Stack:* `Flutter`, `Dart`, `Flutter Quill`
6. **`Screen-Translator` (Android Native)**
   * *Description:* Instant translation client using OCR to read screen contents and present overlays.
   * *Stack:* `Android SDK`, `Kotlin`, `OCR API`
7. **`Youtube-Shield` (Android Native)**
   * *Description:* Privacy-focused alternative YouTube player with ad-blocking engine.
   * *Stack:* `Android SDK`, `Java`, `AdBlock Engine`

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
