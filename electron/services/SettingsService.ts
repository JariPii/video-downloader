import { app } from 'electron';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { logService } from './LogService';
import { LogLevel } from '../enums/LogLevel';
import { LogCategory } from '../enums/LogCategory';

export interface AppSettings {
  outputFolder: string;
}

export class SettingsService {
  private readonly settingsPath = path.join(
    app.getPath('userData'),
    'settings.json',
  );

  public get(): AppSettings {
    if (!existsSync(this.settingsPath)) {
      const settings = this.getDefaultSettings();

      logService.log(
        LogLevel.Info,
        LogCategory.Settings,
        'Using default settings',
        {
          settingsPath: this.setOutputFolder,
        },
      );

      return settings;
    }

    const json = readFileSync(this.settingsPath, 'utf8');

    return JSON.parse(json) as AppSettings;
  }

  public set(settings: AppSettings): void {
    const directory = path.dirname(this.settingsPath);

    if (!existsSync(directory)) {
      mkdirSync(directory, { recursive: true });
    }

    writeFileSync(this.settingsPath, JSON.stringify(settings, null, 2), 'utf8');

    logService.log(LogLevel.Info, LogCategory.Settings, 'Settings saved', {
      outputFolder: settings.outputFolder,
    });
  }

  public setOutputFolder(outputFolder: string): void {
    const settings = this.get();

    settings.outputFolder = outputFolder;

    this.set(settings);
  }

  private getDefaultSettings(): AppSettings {
    return {
      outputFolder: app.getPath('downloads'),
    };
  }
}

export const settingsService = new SettingsService();
