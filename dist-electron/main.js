// electron/main.ts
import { app as app5, BrowserWindow as BrowserWindow2 } from "electron";
import path4 from "node:path";
import { fileURLToPath } from "node:url";

// electron/ipc/app.ts
import { app, ipcMain } from "electron";
function registerAppIpc() {
  ipcMain.handle("app:getVersion", () => {
    return app.getVersion();
  });
}

// electron/ipc/dialog.ts
import { dialog, ipcMain as ipcMain2 } from "electron";
function registerDialogIpc() {
  ipcMain2.handle("dialog:selectFolder", async () => {
    const result = await dialog.showOpenDialog({
      properties: ["openDirectory"]
    });
    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }
    return result.filePaths[0];
  });
}

// electron/ipc/ytdlp.ts
import { BrowserWindow, ipcMain as ipcMain3 } from "electron";

// electron/services/BinaryService.ts
import { app as app2 } from "electron";
import path from "node:path";
var BinaryService = class {
  getYtDlpPath() {
    return app2.isPackaged ? path.join(process.resourcesPath, "binaries", "yt-dlp.exe") : path.join(process.cwd(), "resources", "binaries", "yt-dlp.exe");
  }
  getFfmpegPath() {
    return app2.isPackaged ? path.join(process.resourcesPath, "binaries", "ffmpeg.exe") : path.join(process.cwd(), "resources", "binaries", "ffmpeg.exe");
  }
  getFfprobePath() {
    return app2.isPackaged ? path.join(process.resourcesPath, "binaries", "ffprobe.exe") : path.join(process.cwd(), "resources", "binaries", "ffprobe.exe");
  }
};
var binaryService = new BinaryService();

// electron/services/ProcessService.ts
import { execFile, spawn } from "node:child_process";
var ProcessService = class {
  async run(executable, args, options) {
    return new Promise((res, rej) => {
      const child = spawn(executable, args, {
        cwd: options?.cwd,
        env: options?.env ?? process.env
      });
      let stdout = "";
      let stderr = "";
      child.stdout.on("data", (data) => {
        const text = data.toString();
        stdout += text;
        options?.onStdout?.(text);
      });
      child.stderr.on("data", (data) => {
        const text = data.toString();
        stderr += text;
        options?.onStderr?.(text);
      });
      child.on("error", rej);
      child.on("close", (code) => {
        res({
          stdout,
          stderr,
          exitCode: code ?? -1
        });
      });
    });
  }
  start(executable, args, options) {
    const child = spawn(executable, args, {
      cwd: options?.cwd,
      env: options?.env ?? process.env
    });
    child.stdout.on("data", (data) => {
      options?.onStdout?.(data.toString());
    });
    child.stderr.on("data", (data) => {
      options?.onStderr?.(data.toString());
    });
    const completed = new Promise((res, rej) => {
      child.on("error", rej);
      child.on("close", (code) => {
        res(code ?? -1);
      });
    });
    return {
      process: child,
      completed
    };
  }
  async kill(process2) {
    const pid = process2.pid;
    if (pid === void 0) {
      return;
    }
    await new Promise((res) => {
      execFile("taskkill", ["/PID", pid.toString(), "/T", "/F"], () => {
        res();
      });
    });
  }
};
var processService = new ProcessService();

// electron/mappers/VideoMapper.ts
var VideoMapper = class {
  map(data) {
    const formats = data.formats.map((format) => ({
      id: format.format_id,
      extension: format.ext,
      resolution: format.resolution ?? `${format.width ?? 0}x${format.height ?? 0}`,
      fps: format.fps,
      videoCodec: format.vcodec,
      audioCodec: format.acodec,
      filesize: format.filesize
    }));
    return {
      id: data.id,
      title: data.title,
      uploader: data.uploader,
      duration: data.duration,
      thumbnail: data.thumbnail,
      webpageUrl: data.webpage_url,
      formats
    };
  }
};
var videoMapper = new VideoMapper();

// electron/services/YtDlpService.ts
var YtDlpService = class {
  async getVersion() {
    const executable = binaryService.getYtDlpPath();
    const result = await processService.run(executable, ["--version"]);
    if (result.exitCode !== 0) {
      throw new Error(result.stderr);
    }
    return result.stdout.trim();
  }
  async getVideoInfo(url2) {
    const executable = binaryService.getYtDlpPath();
    const result = await processService.run(executable, ["-J", url2]);
    if (result.exitCode !== 0) {
      throw new Error(result.stderr);
    }
    const json = JSON.parse(result.stdout);
    return videoMapper.map(json);
  }
};
var ytDlpService = new YtDlpService();

// shared/services/FormatService.ts
var FormatService = class {
  getVideoFormats(formats) {
    return formats.filter(
      (format) => this.hasVideo(format) && !this.hasAudio(format)
    );
  }
  getAudioFormats(formats) {
    return formats.filter(
      (format) => !this.hasVideo(format) && this.hasAudio(format)
    );
  }
  getCombinedFormats(formats) {
    return formats.filter(
      (format) => this.hasVideo(format) && this.hasAudio(format)
    );
  }
  findById(formats, id) {
    return formats.find((format) => format.id === id);
  }
  sortByFileSize(formats) {
    return [...formats].sort((a, b) => (b.filesize ?? 0) - (a.filesize ?? 0));
  }
  hasVideo(format) {
    return format.videoCodec !== "none";
  }
  hasAudio(format) {
    return format.audioCodec !== "none";
  }
  getBestCombined(formats) {
    return this.sortByResolution(this.getCombinedFormats(formats))[0];
  }
  getBestVideo(formats) {
    return this.sortByResolution(this.getVideoFormats(formats))[0];
  }
  getBestAudio(formats) {
    return this.sortByFileSize(this.getAudioFormats(formats))[0];
  }
  sortByResolution(formats) {
    return [...formats].sort((a, b) => this.getPixels(b) - this.getPixels(a));
  }
  getPixels(format) {
    const parts = format.resolution.split("x");
    if (parts.length !== 2) {
      return 0;
    }
    return Number(parts[0]) * Number(parts[1]);
  }
};
var formatService = new FormatService();

// electron/services/HistoryService.ts
import { app as app3 } from "electron";
import path2 from "node:path";
import { promises as fs } from "node:fs";
var HistoryService = class {
  constructor() {
    this.filePath = path2.join(
      app3.getPath("userData"),
      "history.json"
    );
  }
  async getAll() {
    try {
      const json = await fs.readFile(this.filePath, "utf8");
      return JSON.parse(json);
    } catch {
      return [];
    }
  }
  async add(item) {
    const history = await this.getAll();
    history.unshift(item);
    await this.save(history);
  }
  async clear() {
    await this.save([]);
  }
  async save(history) {
    await fs.writeFile(this.filePath, JSON.stringify(history, null, 2), "utf8");
  }
};
var historyService = new HistoryService();

// electron/services/DownloadService.ts
var DownloadService = class {
  constructor() {
    this.downloads = /* @__PURE__ */ new Map();
    this.cancelled = /* @__PURE__ */ new Set();
  }
  async download(selection, onProgress) {
    const executable = binaryService.getYtDlpPath();
    const outputTemplate = selection.filename ? `${selection.outputFolder}\\${selection.filename}.%(ext)s` : `${selection.outputFolder}\\%(title)s.%(ext)s`;
    const selectedFormat = formatService.findById(
      selection.formats,
      selection.formatId
    );
    if (!selectedFormat) {
      throw new Error("Selected format was not found");
    }
    let formatArgument = selection.formatId;
    const isVideoOnly = formatService.hasVideo(selectedFormat) && !formatService.hasAudio(selectedFormat);
    const isAudioOnly = !formatService.hasVideo(selectedFormat) && formatService.hasAudio(selectedFormat);
    const isCombined = formatService.hasVideo(selectedFormat) && formatService.hasAudio(selectedFormat);
    if (isVideoOnly) {
      const bestAudio = formatService.getBestAudio(selection.formats);
      if (!bestAudio) {
        throw new Error("No compatible audio format found");
      }
      formatArgument = `${selectedFormat.id}+${bestAudio.id}`;
    }
    const args = [
      "--newline",
      "-f",
      formatArgument,
      "-o",
      outputTemplate,
      selection.url
    ];
    const running = processService.start(executable, args, {
      onStdout: onProgress,
      onStderr: onProgress
    });
    this.downloads.set(selection.downloadId, running);
    try {
      const exitCode = await running.completed;
      if (this.cancelled.has(selection.downloadId)) {
        this.cancelled.delete(selection.downloadId);
        return "cancelled";
      }
      if (exitCode !== 0) {
        throw new Error(`yt-dlp exited with code ${exitCode}`);
      }
      await this.saveHistory(selection, selectedFormat);
      return "completed";
    } finally {
      this.downloads.delete(selection.downloadId);
    }
  }
  async cancel(downloadId) {
    const running = this.downloads.get(downloadId);
    if (!running) {
      return;
    }
    this.cancelled.add(downloadId);
    await processService.kill(running.process);
  }
  async saveHistory(selection, selectedFormat) {
    await historyService.add({
      id: selection.downloadId,
      title: selection.title,
      uploader: selection.uploader,
      thumbnail: selection.thumbnail,
      duration: selection.duration,
      url: selection.url,
      formatId: selection.formatId,
      extension: selectedFormat.extension,
      resolution: selectedFormat.resolution,
      outputFolder: selection.outputFolder,
      downloadedAt: (/* @__PURE__ */ new Date()).toISOString()
    });
  }
};
var downloadService = new DownloadService();

// electron/services/ProgressService.ts
var ProgressService = class {
  constructor() {
    this.regex = /^\[download\]\s+([\d.]+)%\s+of\s+.+?\s+at\s+(.+?)\s+ETA\s+(\d+:\d+)$/;
  }
  parse(line) {
    const text = line.trim();
    const match = this.regex.exec(text);
    if (!match) {
      return null;
    }
    return {
      percent: parseFloat(match[1]),
      speed: match[2].trim(),
      eta: match[3].trim()
    };
  }
};
var progressService = new ProgressService();

// electron/ipc/ytdlp.ts
function registerYtDlpIpc() {
  ipcMain3.handle("ytdlp:getVersion", () => {
    return ytDlpService.getVersion();
  });
  ipcMain3.handle("ytdlp:getVideoInfo", (_event, url2) => {
    return ytDlpService.getVideoInfo(url2);
  });
  ipcMain3.handle(
    "ytdlp:download",
    async (_event, selection) => {
      const window = BrowserWindow.fromWebContents(_event.sender);
      try {
        const result = await downloadService.download(selection, (line) => {
          const progress = progressService.parse(line);
          if (!progress) {
            return;
          }
          const payload = {
            downloadId: selection.downloadId,
            ...progress
          };
          window?.webContents.send("ytdlp:progress", payload);
        });
        switch (result) {
          case "completed":
            window?.webContents.send("ytdlp:completed", {
              downloadId: selection.downloadId
            });
            break;
          case "cancelled":
            window?.webContents.send("ytdlp:cancelled", {
              downloadId: selection.downloadId
            });
            break;
        }
        return result;
      } catch (error) {
        const payload = {
          downloadId: selection.downloadId,
          message: error instanceof Error ? error.message : "Unknown download error"
        };
        window?.webContents.send("ytdlp:failed", payload);
      }
    }
  );
  ipcMain3.handle("ytdlp:cancel", (_event, downloadId) => {
    downloadService.cancel(downloadId);
  });
}

// electron/ipc/ffmpeg.ts
import { ipcMain as ipcMain4 } from "electron";

// electron/services/FfmpegService.ts
var FfmpegService = class {
  async getVersion() {
    const executable = binaryService.getFfmpegPath();
    const result = await processService.run(executable, ["-version"]);
    if (result.exitCode !== 0) {
      throw new Error(result.stderr);
    }
    return result.stdout.split("\n")[0];
  }
  async getProbeVersion() {
    const executable = binaryService.getFfprobePath();
    const result = await processService.run(executable, ["-version"]);
    if (result.exitCode !== 0) {
      throw new Error(result.stderr);
    }
    return result.stdout.split("\n")[0];
  }
};
var ffmpegService = new FfmpegService();

// electron/ipc/ffmpeg.ts
function registerFfmpegIpc() {
  ipcMain4.handle("ffmpeg:getVersion", () => {
    return ffmpegService.getVersion();
  });
  ipcMain4.handle("ffmpeg:getProbeVersion", () => {
    return ffmpegService.getProbeVersion();
  });
}

// electron/ipc/settings.ts
import { ipcMain as ipcMain5 } from "electron";

// electron/services/SettingsService.ts
import { app as app4 } from "electron";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path3 from "node:path";
var SettingsService = class {
  constructor() {
    this.settingsPath = path3.join(
      app4.getPath("userData"),
      "settings.json"
    );
  }
  get() {
    if (!existsSync(this.settingsPath)) {
      return this.getDefaultSettings();
    }
    const json = readFileSync(this.settingsPath, "utf8");
    return JSON.parse(json);
  }
  set(settings) {
    const directory = path3.dirname(this.settingsPath);
    if (!existsSync(directory)) {
      mkdirSync(directory, { recursive: true });
    }
    writeFileSync(this.settingsPath, JSON.stringify(settings, null, 2), "utf8");
  }
  setOutputFolder(outputFolder) {
    const settings = this.get();
    settings.outputFolder = outputFolder;
    this.set(settings);
  }
  getDefaultSettings() {
    return {
      outputFolder: app4.getPath("downloads")
    };
  }
};
var settingsService = new SettingsService();

// electron/ipc/settings.ts
function registerSettingsIpc() {
  ipcMain5.handle("settings:get", () => {
    return settingsService.get();
  });
  ipcMain5.handle("settings:setOutputFolder", (_event, outputFolder) => {
    settingsService.setOutputFolder(outputFolder);
  });
}

// electron/ipc/history.ts
import { ipcMain as ipcMain6 } from "electron";
function registerHistoryIpc() {
  ipcMain6.handle("history:get", async () => {
    return historyService.getAll();
  });
  ipcMain6.handle("history:add", async (_event, item) => {
    await historyService.add(item);
  });
  ipcMain6.handle("history:clear", async () => {
    await historyService.clear();
  });
}

// electron/ipc/register.ts
function registerIpc() {
  registerAppIpc();
  registerDialogIpc();
  registerYtDlpIpc();
  registerFfmpegIpc();
  registerSettingsIpc();
  registerHistoryIpc();
}

// electron/main.ts
var __filename = fileURLToPath(import.meta.url);
var __dirname = path4.dirname(__filename);
var url = app5.isPackaged ? "..." : "http://localhost:3000";
async function createWindow() {
  const window = new BrowserWindow2({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path4.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });
  await window.loadURL(url);
  if (!app5.isPackaged) {
    window.webContents.openDevTools();
  }
}
app5.whenReady().then(async () => {
  registerIpc();
  await createWindow();
});
app5.on("window-all-closed", () => {
  if (process.platform !== "darwin") app5.quit();
});
app5.on("activate", () => {
  if (BrowserWindow2.getAllWindows().length === 0) {
    createWindow();
  }
});
//# sourceMappingURL=main.js.map
