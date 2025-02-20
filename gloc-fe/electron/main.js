import { app, BrowserWindow, session } from 'electron';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process'; // ✅ To start `server.js`

import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
let serverProcess; // ✅ Declare `serverProcess` globally

function killPort(port) {
  try {
      if (process.platform === "win32") {
          // Windows: Kill process using the port
          exec(`netstat -ano | findstr :${port}`, (error, stdout) => {
              const pid = stdout
                  .split("\n")
                  .find(line => line.includes("LISTENING"))
                  ?.trim()
                  ?.split(/\s+/)
                  ?.pop();

              if (pid) {
                  exec(`taskkill /F /PID ${pid}`, () => {
                      console.log(`🔴 Killed process ${pid} on port ${port}`);
                  });
              }
          });
      } else {
          // macOS/Linux: Kill the process
          exec(`kill -9 $(lsof -t -i:${port}) 2>/dev/null || true`, () => {
              console.log(`🔴 Killed process using port ${port}`);
          });
      }
  } catch (error) {
      console.warn(`⚠️ No process found on port ${port}, skipping.`);
  }
}


function startBackendServer() {
  const serverPath = path.join(__dirname, '../../gloc-be/server.js');
  console.log("🚀 Starting Backend Server:", serverPath);
  killPort()
  serverProcess = spawn('node', [serverPath], {
      cwd: path.dirname(serverPath),
      detached: true,
      stdio: ['ignore', 'pipe', 'pipe']  // ✅ Capture logs
  });

  // ✅ Print logs to Electron console
  serverProcess.stdout.on('data', data => {
      console.log(`📡 Backend: ${data.toString().trim()}`);
  });

  serverProcess.stderr.on('data', data => {
      console.error(`❌ Backend Error: ${data.toString().trim()}`);
  });

  serverProcess.unref();
}

function createWindow() {
  const win = new BrowserWindow({
    fullscreen: true, // ✅ Full-screen mode
    // frame: false, // ✅ Removes the top bar (title bar & window frame)
    webPreferences: {
      nodeIntegration: false,  // ✅ Security: Prevents direct access to Node.js APIs
      contextIsolation: true,   // ✅ Keeps Electron API isolated from preload scripts
      enableRemoteModule: false, // ✅ Disables remote module for security
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    const indexPath = path.join(__dirname, '../dist/index.html');
    win.loadURL(`file://${indexPath}`);
  }
}

app.whenReady().then(() => {
  startBackendServer(); // ✅ Start `server.js` before opening the window
  createWindow();


  // ✅ Handle camera & microphone permission requests
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    if (permission === 'media') {
      callback(true);
    } else {
      callback(false);
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// ✅ Handle window close events
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});