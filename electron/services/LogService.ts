import { LogCategory } from '../enums/LogCategory';
import { LogLevel } from '../enums/LogLevel';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  metadata?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

export class Logservice {
  public debug(
    category: LogCategory,
    message: string,
    metadata?: Record<string, unknown>,
  ): void {
    this.log(LogLevel.Debug, category, message, metadata);
  }
  public info(
    category: LogCategory,
    message: string,
    metadata?: Record<string, unknown>,
  ): void {
    this.log(LogLevel.Info, category, message, metadata);
  }
  public warning(
    category: LogCategory,
    message: string,
    metadata?: Record<string, unknown>,
  ): void {
    this.log(LogLevel.Warning, category, message, metadata);
  }
  public error(
    category: LogCategory,
    message: string,
    error?: unknown,
    metadata?: Record<string, unknown>,
  ): void {
    this.log(LogLevel.Error, category, message, metadata, error);
  }

  public log(
    level: LogLevel,
    category: LogCategory,
    message: string,
    metadata?: Record<string, unknown>,
    error?: unknown,
  ): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
    };

    if (metadata) {
      entry.metadata = metadata;
    }

    if (error instanceof Error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    console.log(JSON.stringify(entry));
  }
}

export const logService = new Logservice();
