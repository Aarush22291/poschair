const { app, BrowserWindow, ipcMain, shell, Tray, Menu, session } = require('electron')
const path = require('path')

let mainWindow = null;
let tray = null;
let isQuitting = false;

app.commandLine.appendSwitch('enable-features', 'WebBluetooth')

function isTrustedAppOrigin(origin) {
  if (typeof origin !== 'string') return false
  if (origin === 'null' || origin.startsWith('file://')) return true

  try {
    const url = new URL(origin)
    return url.protocol === 'http:' && url.hostname === 'localhost' && url.port === '5173'
  } catch {
    return false
  }
}

function configurePermissions() {
  const allowed = new Set(['media', 'bluetooth', 'bluetooth-scanning'])

  session.defaultSession.setPermissionCheckHandler((_webContents, permission, origin) => (
    isTrustedAppOrigin(origin) && allowed.has(permission)
  ))
  session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback, details) => {
    callback(isTrustedAppOrigin(details.requestingUrl) && allowed.has(permission))
  })
  session.defaultSession.setDevicePermissionHandler((details) => (
    details.deviceType === 'bluetooth' && isTrustedAppOrigin(details.origin)
  ))
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width:           1280,
    height:          800,
    minWidth:        900,
    minHeight:       600,
    backgroundColor: '#0a0a0c',
    titleBarStyle:   'hiddenInset',
    webPreferences: {
      preload:        path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
    },
    icon: path.join(__dirname, '..', 'resources', 'icon.ico'),
  })

  // In production load the built Vite output
  if (app.isPackaged) {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  } else {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  }

  // Open external links in the default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://') || url.startsWith('http://')) shell.openExternal(url)
    return { action: 'deny' }
  })

  mainWindow.webContents.on('will-navigate', (event, url) => {
    const currentUrl = mainWindow.webContents.getURL()
    if (url !== currentUrl) event.preventDefault()
  })

  let bluetoothTimeout = null
  mainWindow.webContents.on('select-bluetooth-device', (event, devices, callback) => {
    event.preventDefault()
    const chair = devices.find((device) => device.deviceName === 'POSCHAIR_001')
    if (chair) {
      if (bluetoothTimeout) clearTimeout(bluetoothTimeout)
      bluetoothTimeout = null
      callback(chair.deviceId)
      return
    }

    if (!bluetoothTimeout) {
      bluetoothTimeout = setTimeout(() => {
        bluetoothTimeout = null
        callback('')
      }, 10000)
    }
  })
}

function createTray() {
  const iconPath = path.join(__dirname, '..', 'resources', 'icon.ico');
  tray = new Tray(iconPath);
  
  const contextMenu = Menu.buildFromTemplate([
    { 
      label: 'Open Dashboard', 
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    },
    { type: 'separator' },
    { 
      label: 'Exit App', 
      click: () => {
        isQuitting = true;
        app.quit();
      }
    }
  ]);
  
  tray.setToolTip('PosChair Posture Corrector');
  tray.setContextMenu(contextMenu);
  
  tray.on('double-click', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

app.whenReady().then(() => {
  configurePermissions()
  createWindow()
  createTray()
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    } else if (mainWindow) {
      mainWindow.show()
    }
  })
})

ipcMain.handle('open-external', async (_event, url) => {
  if (typeof url !== 'string' || (!url.startsWith('https://') && !url.startsWith('http://'))) {
    throw new Error('Only HTTP(S) links may be opened externally.')
  }
  await shell.openExternal(url)
})

app.on('before-quit', () => {
  isQuitting = true;
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
