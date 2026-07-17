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
import { existsSync } from "node:fs";
import path from "node:path";
var BinaryService = class {
  getYtDlpPath() {
    return this.resolveBinary("yt-dlp.exe");
  }
  getFfmpegPath() {
    return this.resolveBinary("ffmpeg.exe");
  }
  getFfprobePath() {
    return this.resolveBinary("ffprobe.exe");
  }
  resolveBinary(fileName) {
    const binaryPath = app2.isPackaged ? path.join(process.resourcesPath, "binaries", fileName) : path.join(process.cwd(), "resources", "binaries", fileName);
    if (!existsSync(binaryPath)) {
      throw new Error(`Binary not found: ${binaryPath}`);
    }
    return binaryPath;
  }
  // public getYtDlpPath(): string {
  //   return app.isPackaged
  //     ? path.join(process.resourcesPath, 'binaries', 'yt-dlp.exe')
  //     : path.join(process.cwd(), 'resources', 'binaries', 'yt-dlp.exe');
  // }
  // public getFfmpegPath(): string {
  //   return app.isPackaged
  //     ? path.join(process.resourcesPath, 'binaries', 'ffmpeg.exe')
  //     : path.join(process.cwd(), 'resources', 'binaries', 'ffmpeg.exe');
  // }
  // public getFfprobePath(): string {
  //   return app.isPackaged
  //     ? path.join(process.resourcesPath, 'binaries', 'ffprobe.exe')
  //     : path.join(process.cwd(), 'resources', 'binaries', 'ffprobe.exe');
  // }
};
var binaryService = new BinaryService();

// electron/services/ProcessService.ts
import { execFile, spawn } from "node:child_process";

// electron/services/LogService.ts
var Logservice = class {
  debug(category, message, metadata) {
    this.log("DEBUG" /* Debug */, category, message, metadata);
  }
  info(category, message, metadata) {
    this.log("INFO" /* Info */, category, message, metadata);
  }
  warning(category, message, metadata) {
    this.log("WARNING" /* Warning */, category, message, metadata);
  }
  error(category, message, error, metadata) {
    this.log("ERROR" /* Error */, category, message, metadata, error);
  }
  log(level, category, message, metadata, error) {
    const entry = {
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      level,
      category,
      message
    };
    if (metadata) {
      entry.metadata = metadata;
    }
    if (error instanceof Error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack
      };
    }
    console.log(JSON.stringify(entry));
  }
};
var logService = new Logservice();

// electron/services/ProcessService.ts
var ProcessService = class {
  async run(executable, args, options) {
    logService.info("PROCESS" /* Process */, "Starting process", { executable });
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
      child.on("error", (error) => {
        logService.error(
          "PROCESS" /* Process */,
          `Failed to start process`,
          error,
          {
            executable
          }
        );
        rej(error);
      });
      child.on("close", (code) => {
        const exitCode = code ?? -1;
        logService.info("PROCESS" /* Process */, `Process finished`, {
          executable,
          exitCode
        });
        res({
          stdout,
          stderr,
          exitCode
        });
      });
    });
  }
  start(executable, args, options) {
    logService.log("INFO" /* Info */, "PROCESS" /* Process */, `Starting process`, {
      executable
    });
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
    const completed = new Promise((res, rej) => {
      child.on("error", (error) => {
        logService.log(
          "ERROR" /* Error */,
          "PROCESS" /* Process */,
          `Failed to start process`,
          {
            executable
          },
          error
        );
        rej(error);
      });
      child.on("close", (code) => {
        const exitCode = code ?? -1;
        logService.log(
          exitCode === 0 ? "INFO" /* Info */ : "WARNING" /* Warning */,
          "PROCESS" /* Process */,
          `Process finished`,
          {
            executable,
            exitCode
          }
        );
        res({
          stdout,
          stderr,
          exitCode
        });
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
      logService.warning(
        "PROCESS" /* Process */,
        "Kill requested for process without PID"
      );
      return;
    }
    logService.info("PROCESS" /* Process */, "Killing process", {
      pid
    });
    await new Promise((res, rej) => {
      execFile("taskkill", ["/PID", pid.toString(), "/T", "/F"], (error) => {
        if (error) {
          logService.error(
            "PROCESS" /* Process */,
            "Failed to kill process",
            error,
            {
              pid
            }
          );
          rej(error);
          return;
        }
        logService.info("PROCESS" /* Process */, "Process killed", {
          pid
        });
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

// electron/services/YtDlpArgumentService.ts
var YtDlpArgumentService = class {
  buildInfoArguments(url2) {
    return [...this.buildCommonArguments(), "-J", url2];
  }
  buildDownloadArguments(selection, selectedFormat) {
    const outputTemplate = selection.filename ? `${selection.outputFolder}\\${selection.filename}.%(ext)s` : `${selection.outputFolder}\\%(title)s.%(ext)s`;
    let formatArgument = selectedFormat.id;
    const isVideoOnly = formatService.hasVideo(selectedFormat) && !formatService.hasAudio(selectedFormat);
    if (isVideoOnly) {
      const bestAudio = formatService.getBestAudio(selection.formats);
      if (!bestAudio) {
        throw new Error("No compatible audio format found");
      }
      formatArgument = `${selectedFormat.id}+${bestAudio.id}`;
    }
    return [
      ...this.buildCommonArguments(),
      "-f",
      formatArgument,
      "-o",
      outputTemplate,
      selection.url
    ];
  }
  buildInfoArgumentsWithCookies(url2, browser) {
    return [
      ...this.buildCommonArguments(),
      "--cookies-from-browser",
      browser,
      "-J",
      url2
    ];
  }
  buildCommonArguments() {
    return ["--newline"];
  }
};
var ytDlpArgumentService = new YtDlpArgumentService();

// electron/services/RetryService.ts
var RetryService = class {
  async execute(operation, retries = 1, delayMs = 2e3, shouldRetry) {
    let lastError;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        if (attempt === retries) {
          break;
        }
        if (shouldRetry && !shouldRetry(error)) {
          break;
        }
        await this.delay(delayMs);
      }
    }
    throw lastError;
  }
  async delay(ms) {
    await new Promise((res) => setTimeout(res, ms));
  }
};
var retryService = new RetryService();

// electron/errors/DownloadError.ts
var DownloadError = class extends Error {
  constructor(code, message, retryable = false) {
    super(message);
    this.code = code;
    this.retryable = retryable;
    this.name = "DownloadError";
  }
};

// electron/mappers/DownloadErrorMapper.ts
var DownloadErrorMapper = class {
  map(error) {
    const message = error.toLowerCase();
    if (message.includes("429") || message.includes("too many requests")) {
      return new DownloadError(
        0 /* RateLimited */,
        "Tj\xE4nsten begra\xE4nsar f\xF6r n\xE4rvarande anslutningen. F\xF6rs\xF6k igen senare",
        true
      );
    }
    if (message.includes("sign in to confirm") || message.includes("cookies") || message.includes("login required")) {
      return new DownloadError(
        1 /* AuthenticationRequired */,
        "Den h\xE4r tj\xE4nsten kr\xE4ver att du \xE4r inloggad i webl\xE4saren",
        true
      );
    }
    if (message.includes("video unavailable")) {
      return new DownloadError(
        2 /* VideoUnavailable */,
        "Videon \xE4r inte tillg\xE4nglig"
      );
    }
    if (message.includes("private video")) {
      return new DownloadError(
        3 /* PrivateVideo */,
        "Videon \xE4r privat"
      );
    }
    if (message.includes("unsupported url") || message.includes("unsupported site")) {
      return new DownloadError(
        4 /* UnsupportedUrl */,
        "Den angivna l\xE4nken st\xF6ds inte"
      );
    }
    if (message.includes("not available in your country") || message.includes("geo")) {
      return new DownloadError(
        5 /* GeoRestricted */,
        "Videon \xE4r inte tillg\xE4nglig i ditt land"
      );
    }
    if (message.includes("age-restricted") || message.includes("age restricted")) {
      return new DownloadError(
        6 /* AgeRestricted */,
        "Videon har \xE5ldersbegr\xE4nsning"
      );
    }
    if (message.includes("live stream is offline") || message.includes("this live event will begin")) {
      return new DownloadError(
        7 /* LiveStreamOffline */,
        "Lives\xE4ndningen \xE4r inte tillg\xE4nglig just nu."
      );
    }
    if (message.includes("copyright") || message.includes("copyright claim")) {
      return new DownloadError(
        8 /* CopyrightBlocked */,
        "Videon kan inte laddas ner p\xE5 grund av upphosr\xE4tt."
      );
    }
    if (message.includes("network") || message.includes("connection") || message.includes("timed out") || message.includes("timeout")) {
      return new DownloadError(
        9 /* NetworkError */,
        "Ett n\xE4tverksfel uppstod"
      );
    }
    return new DownloadError(
      10 /* Unknown */,
      error.trim() || "Ett ok\xE4nt fel uppstod"
    );
  }
};
var downloadErrorMapper = new DownloadErrorMapper();

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
    const browsers = ["chrome", "edge", "firefox", "brave"];
    try {
      return await this.runInfo(ytDlpArgumentService.buildInfoArguments(url2));
    } catch (error) {
      if (!(error instanceof DownloadError) || error.code !== 1 /* AuthenticationRequired */) {
        throw error;
      }
    }
    for (const browser of browsers) {
      try {
        return await this.runInfo(
          ytDlpArgumentService.buildInfoArgumentsWithCookies(url2, browser)
        );
      } catch (error) {
        if (error instanceof DownloadError && error.code === 1 /* AuthenticationRequired */) {
          continue;
        }
        throw error;
      }
    }
    throw new DownloadError(
      1 /* AuthenticationRequired */,
      "Ingen kompatibel webl\xE4sare med giltiga cookies kunde anv\xE4ndas.",
      false
    );
  }
  async runInfo(args) {
    const executable = binaryService.getYtDlpPath();
    try {
      return await retryService.execute(
        async () => {
          const result = await processService.run(executable, args);
          if (result.exitCode !== 0) {
            throw downloadErrorMapper.map(result.stderr);
          }
          const json = JSON.parse(result.stdout);
          return videoMapper.map(json);
        },
        1,
        2e3,
        (error) => error instanceof DownloadError && error.retryable
      );
    } catch (error) {
      if (error instanceof DownloadError) {
        throw error;
      }
      if (error instanceof Error) {
        throw downloadErrorMapper.map(error.message);
      }
      throw error;
    }
  }
};
var ytDlpService = new YtDlpService();

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
  async remove(id) {
    const history = await this.getAll();
    const updatedHistory = history.filter((item) => item.id !== id);
    await this.save(updatedHistory);
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
    const selectedFormat = formatService.findById(
      selection.formats,
      selection.formatId
    );
    if (!selectedFormat) {
      throw new Error("Selected format was not found");
    }
    logService.log("INFO" /* Info */, "DOWNLOAD" /* Download */, `Download started`, {
      downloadId: selection.downloadId,
      title: selection.title,
      url: selection.url
    });
    const args = ytDlpArgumentService.buildDownloadArguments(
      selection,
      selectedFormat
    );
    const running = processService.start(executable, args, {
      onStdout: onProgress,
      onStderr: onProgress
    });
    this.downloads.set(selection.downloadId, running);
    try {
      const result = await running.completed;
      const exitCode = result.exitCode;
      if (this.cancelled.has(selection.downloadId)) {
        this.cancelled.delete(selection.downloadId);
        logService.log(
          "INFO" /* Info */,
          "DOWNLOAD" /* Download */,
          `Download cancelled`,
          {
            downloadId: selection.downloadId,
            title: selection.title
          }
        );
        return "cancelled";
      }
      if (exitCode !== 0) {
        const downloadError = downloadErrorMapper.map(result.stderr);
        logService.log(
          "ERROR" /* Error */,
          "DOWNLOAD" /* Download */,
          `Download failed`,
          {
            downloadId: selection.downloadId,
            title: selection.title,
            exitCode,
            errorCode: downloadError.code
          },
          downloadError
        );
        throw downloadError;
      }
      await this.saveHistory(selection, selectedFormat);
      logService.log(
        "INFO" /* Info */,
        "DOWNLOAD" /* Download */,
        `Download completed`,
        {
          downloadId: selection.downloadId,
          title: selection.title
        }
      );
      return "completed";
    } catch (error) {
      const downloadError = error instanceof DownloadError ? error : downloadErrorMapper.map(
        error instanceof Error ? error.message : String(error)
      );
      logService.log(
        "ERROR" /* Error */,
        "DOWNLOAD" /* Download */,
        `Download failed`,
        {
          downloadId: selection.downloadId,
          title: selection.title,
          errorCode: downloadError.code
        },
        downloadError
      );
      throw downloadError;
    } finally {
      this.downloads.delete(selection.downloadId);
    }
  }
  async cancel(downloadId) {
    const running = this.downloads.get(downloadId);
    if (!running) {
      logService.warning(
        "DOWNLOAD" /* Download */,
        "Cancel requested for unknown download",
        {
          downloadId
        }
      );
      return;
    }
    logService.log("INFO" /* Info */, "DOWNLOAD" /* Download */, `Cancelling download`, {
      downloadId
    });
    this.cancelled.add(downloadId);
    try {
      await processService.kill(running.process);
      logService.info("DOWNLOAD" /* Download */, "Download process terminated", {
        downloadId
      });
    } catch (error) {
      this.cancelled.delete(downloadId);
      logService.error(
        "DOWNLOAD" /* Download */,
        "Failed to cancel download",
        error,
        {
          downloadId
        }
      );
      throw error;
    }
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
import { existsSync as existsSync2, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path3 from "node:path";
var SettingsService = class {
  constructor() {
    this.settingsPath = path3.join(
      app4.getPath("userData"),
      "settings.json"
    );
  }
  get() {
    if (!existsSync2(this.settingsPath)) {
      const settings = this.getDefaultSettings();
      logService.log(
        "INFO" /* Info */,
        "SETTINGS" /* Settings */,
        "Using default settings",
        {
          settingsPath: this.setOutputFolder
        }
      );
      return settings;
    }
    const json = readFileSync(this.settingsPath, "utf8");
    return JSON.parse(json);
  }
  set(settings) {
    const directory = path3.dirname(this.settingsPath);
    if (!existsSync2(directory)) {
      mkdirSync(directory, { recursive: true });
    }
    writeFileSync(this.settingsPath, JSON.stringify(settings, null, 2), "utf8");
    logService.log("INFO" /* Info */, "SETTINGS" /* Settings */, "Settings saved", {
      outputFolder: settings.outputFolder
    });
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
  ipcMain6.handle("history:remove", async (_event, id) => {
    await historyService.remove(id);
  });
}

// electron/ipc/register.ts
function registerIpc() {
  logService.info("APP" /* App */, "Registering IPC handlers");
  registerAppIpc();
  registerDialogIpc();
  registerYtDlpIpc();
  registerFfmpegIpc();
  registerSettingsIpc();
  registerHistoryIpc();
  logService.info("APP" /* App */, "IPC handlers registered");
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
