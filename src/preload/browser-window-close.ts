import { installBrowserWindowCloseGuard } from './browser-window-close-installation'
import type { ContextBridge, IpcRenderer } from 'electron'
import { installBrowserHistoryWheel } from './browser-history-wheel'

// Sandboxed preloads cannot require the main build's shared chunks.
const BROWSER_HISTORY_GESTURE_CHANNEL = 'browser:history-gesture'
const BROWSER_HISTORY_WHEEL_CHANNEL = 'browser:history-wheel'

// Why: raw require keeps the sandboxed preload standalone in the main-process CJS build.
const {
  contextBridge,
  ipcRenderer
}: { contextBridge: ContextBridge; ipcRenderer: IpcRenderer } = require('electron')

contextBridge.executeInMainWorld({ func: installBrowserWindowCloseGuard })

if (process.platform === 'darwin') {
  installBrowserHistoryWheel(
    (callback) => {
      const listener = (_event: Electron.IpcRendererEvent, gestureId: unknown): void => {
        callback(
          typeof gestureId === 'number' && Number.isSafeInteger(gestureId) ? gestureId : null
        )
      }
      ipcRenderer.on(BROWSER_HISTORY_GESTURE_CHANNEL, listener)
      return () => ipcRenderer.removeListener(BROWSER_HISTORY_GESTURE_CHANNEL, listener)
    },
    (wheel) => ipcRenderer.send(BROWSER_HISTORY_WHEEL_CHANNEL, wheel)
  )
}
