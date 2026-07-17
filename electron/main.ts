import { app, BrowserWindow } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { registerIpc } from './ipc/register';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const url = app.isPackaged ? '...' : 'http://localhost:3000';

async function createWindow() {
  const window = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  await window.loadURL(url);

  if (!app.isPackaged) {
    window.webContents.openDevTools();
  }
}

app.whenReady().then(async () => {
  registerIpc();

  await createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
