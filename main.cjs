const { app, BrowserWindow } = require('electron');
const path = require('path');
const isDev = !app.isPackaged;

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    title: "ACTAGEN - Sistema de Generación de Actas",
    icon: path.join(__dirname, 'public/favicon.ico'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
  });

  // Listener para archivos exportados por Talleyrand
  const chokidar = require('chokidar');
  const inboundPath = path.join(__dirname, 'inbound');
  
  chokidar.watch(inboundPath).on('add', (filePath) => {
    if (filePath.endsWith('.md')) {
      win.webContents.send('new-file-exported', path.basename(filePath));
    }
  });

  if (isDev) {
    win.loadURL('http://localhost:5173');
  } else {
    win.loadFile(path.join(__dirname, 'dist/index.html'));
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
