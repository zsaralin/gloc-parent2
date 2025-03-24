import { app, BrowserWindow, session } from 'electron';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process'; // ✅ To start `server.js`
import { exec } from "child_process";
import { net } from "electron"; // ✅ Add this import
import fs from "fs";
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
let serverProcess; // ✅ Declare `serverProcess` globally
function killPort(port) {
  if (process.platform === "win32") {
    console.log(`🔍 Checking port ${port}...`);
    exec(`netstat -ano | findstr :${port}`, (error, stdout, stderr) => {
      if (error || stderr) {
        console.error(`❌ Error executing netstat: ${error || stderr}`);
        return;
      }
      
      console.log(`📡 netstat output: \n${stdout}`);

      const pid = stdout
        .split("\n")
        .find(line => line.includes("LISTENING"))
        ?.trim()
        ?.split(/\s+/)
        ?.pop();

      if (pid) {
        console.log(`🔍 Found PID: ${pid}, killing process...`);
        exec(`taskkill /F /PID ${pid}`, (killError, killStdout, killStderr) => {
          if (killError || killStderr) {
            console.error(`❌ Error killing process: ${killError || killStderr}`);
          } else {
            console.log(`✅ Killed process ${pid} on port ${port}`);
          }
        });
      } else {
        console.log(`⚠️ No LISTENING process found on port ${port}`);
      }
    });
  } else {
    // macOS/Linux: Use `lsof`
    console.log(`🔍 Checking port ${port} on macOS/Linux...`);
    exec(`lsof -t -i:${port}`, (error, stdout, stderr) => {
      if (error || stderr) {
        console.error(`❌ Error executing lsof: ${error || stderr}`);
        return;
      }

      const pid = stdout.trim();
      if (pid) {
        console.log(`🔍 Found PID: ${pid}, killing process...`);
        exec(`kill -9 ${pid}`, (killError, killStdout, killStderr) => {
          if (killError || killStderr) {
            console.error(`❌ Error killing process: ${killError || killStderr}`);
          } else {
            console.log(`✅ Killed process ${pid} on port ${port}`);
          }
        });
      } else {
        console.log(`⚠️ No process found using port ${port}`);
      }
    });
  }
}

function startBackendServer() {
  const serverPath = path.join(__dirname, '../../gloc-be/server.js');
  console.log("🚀 Starting Backend Server:", serverPath);
  killPort(5000)
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
async function isViteRunning(url) {
  return new Promise((resolve) => {
    const request = net.request(url);
    request.on("response", () => resolve(true)); // Vite is running
    request.on("error", () => resolve(false)); // Vite is NOT running
    request.end();
  });
}
async function createWindow() {
  const win = new BrowserWindow({
    fullscreen: true, // ✅ Full-screen mode
    rame: false, // ✅ Removes the Window Frame (Title Bar & Borders)
    titleBarStyle: "hidden", // ✅ Hides the macOS title bar (optional)
    // frame: false, // ✅ Removes the top bar (title bar & window frame)
    webPreferences: {
      nodeIntegration: false,  // ✅ Security: Prevents direct access to Node.js APIs
      contextIsolation: true,   // ✅ Keeps Electron API isolated from preload scripts
      enableRemoteModule: false, // ✅ Disables remote module for security
    },
  });
  const viteURL = "http://localhost:5173"; // Default dev server URL

  if (await isViteRunning(viteURL)) {
    console.log(`✅ Vite dev server is running at ${viteURL}`);
    win.loadURL(viteURL);
  } else {
    console.log("⚠️ Vite dev server not detected, loading dist/index.html...");
    const indexPath = path.join(__dirname, "../dist/index.html");

    if (!fs.existsSync(indexPath)) {
      console.error(`🚨 dist/index.html NOT FOUND at: ${indexPath}`);
    } else {
      console.log(`✅ Loading file://${indexPath}`);
      win.loadURL(`file://${indexPath.replace(/\\/g, "/")}`);
    }
  }


  // ✅ Exit Fullscreen and Close App on Escape Key
  win.webContents.on("before-input-event", (event, input) => {
    if (input.type === "keyDown" && input.key === "Escape") {
      console.log("🔴 Closing window...");
      win.close(); // ✅ Closes the window
      app.quit();  // ✅ Exits the Electron app completely
    }})
  
}

app.whenReady().then(() => {
  // startBackendServer(); // ✅ Start `server.js` before opening the window
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