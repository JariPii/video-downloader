import { app } from 'electron';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

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
      return this.getDefaultSettings();
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
