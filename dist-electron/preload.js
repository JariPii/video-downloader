"use strict";

// electron/preload.ts
var import_electron = require("electron");
function subscribe(channel, callback) {
  const listener = (_event, event) => {
    callback(event);
  };
  import_electron.ipcRenderer.on(channel, listener);
  return () => {
    import_electron.ipcRenderer.removeListener(channel, listener);
  };
}
import_electron.contextBridge.exposeInMainWorld("electron", {
  app: {
    getVersion: () => import_electron.ipcRenderer.invoke("app:getVersion")
  },
  dialog: {
    selectFolder: () => import_electron.ipcRenderer.invoke("dialog:selectFolder")
  },
  ytdlp: {
    getVersion: () => import_electron.ipcRenderer.invoke("ytdlp:getVersion"),
    getVideoInfo: (url) => import_electron.ipcRenderer.invoke("ytdlp:getVideoInfo", url),
    getPlaylistInfo: (url) => import_electron.ipcRenderer.invoke("ytdlp:getPlaylistInfo", url),
    download: (selection) => import_electron.ipcRenderer.invoke("ytdlp:download", selection),
    cancel: (downloadId) => import_electron.ipcRenderer.invoke("ytdlp:cancel", downloadId),
    onProgress: (callback) => subscribe("ytdlp:progress", callback),
    onCompleted: (callback) => subscribe("ytdlp:completed", callback),
    onCancelled: (callback) => subscribe("ytdlp:cancelled", callback),
    onFailed: (callback) => subscribe("ytdlp:failed", callback)
  },
  ffmpeg: {
    getVersion: () => import_electron.ipcRenderer.invoke("ffmpeg:getVersion"),
    getProbeVersion: () => import_electron.ipcRenderer.invoke("ffmpeg:getProbeVersion")
  },
  settings: {
    get: () => import_electron.ipcRenderer.invoke("settings:get"),
    setOutputFolder: (outputFolder) => import_electron.ipcRenderer.invoke("settings:setOutputFolder", outputFolder)
  },
  history: {
    get: () => import_electron.ipcRenderer.invoke("history:get"),
    add: (item) => import_electron.ipcRenderer.invoke("history:add", item),
    remove: (id) => import_electron.ipcRenderer.invoke("history:remove", id),
    clear: () => import_electron.ipcRenderer.invoke("history:clear")
  }
});
//# sourceMappingURL=preload.js.map
