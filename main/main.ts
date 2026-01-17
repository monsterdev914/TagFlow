import { app, BrowserWindow, globalShortcut } from 'electron';
import path from 'path';
import { setupIpcHandlers } from './ipcHandlers';

function createWindow(): BrowserWindow {
    const win = new BrowserWindow({
        width: 1024,
        height: 768,
        frame: false,
        fullscreen: true, // Start in fullscreen mode
        fullscreenable: true, // Allow toggling fullscreen
        // kiosk: false, // Set to true for true kiosk mode (no way to exit)
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    const startUrl = process.env.ELECTRON_START_URL;

    if (startUrl) {
        // DEV: load Vite dev server
        win.loadURL(startUrl);
    } else {
        // PROD: load built React app
        win.loadFile(
            path.join(__dirname, '../../renderer/dist/index.html')
        );
    }

    return win;
}

app.whenReady().then(() => {
    // Setup IPC handlers after app is ready
    setupIpcHandlers();
    const win = createWindow();

    // Register global shortcuts for fullscreen toggle
    globalShortcut.register('F11', () => {
        if (win.isFullScreen()) {
            win.setFullScreen(false);
        } else {
            win.setFullScreen(true);
        }
    });

    // ESC to exit fullscreen (optional - comment out if you want kiosk mode)
    globalShortcut.register('Escape', () => {
        if (win.isFullScreen()) {
            win.setFullScreen(false);
        }
    });
});

// Unregister shortcuts when app quits
app.on('will-quit', () => {
    globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });