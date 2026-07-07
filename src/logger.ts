import * as fs from 'fs';
import * as path from 'path';

let logFilePath: string | undefined;

export function initLogger(storagePath: string): void {
    // storagePath is context.globalStorageUri.fsPath — guaranteed writable
    fs.mkdirSync(storagePath, { recursive: true });
    logFilePath = path.join(storagePath, 'adoc-preview.log');
    // Truncate log on each activation so it doesn't grow unbounded
    fs.writeFileSync(logFilePath, `=== AsciiDoc Preview log started ${new Date().toISOString()} ===\n`);
    appendLog('[logger] initialized, log file: ' + logFilePath);
}

export function appendLog(msg: string): void {
    const line = `${new Date().toISOString()} ${msg}\n`;
    if (logFilePath) {
        try { fs.appendFileSync(logFilePath, line); } catch (_) { /* ignore */ }
    }
    // Also write to stderr so it shows in Extension Host developer console
    process.stderr.write(line);
}

export function getLogPath(): string | undefined {
    return logFilePath;
}
