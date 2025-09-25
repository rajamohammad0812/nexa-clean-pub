"use strict";
/**
 * Logger - Structured logging utility for the CLI
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
const chalk_1 = __importDefault(require("chalk"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
class Logger {
    constructor(context) {
        this.context = context;
        this.logLevel = this.getLogLevel();
        this.logToFile = process.env.NEXA_LOG_FILE === 'true';
        this.logFilePath = this.getLogFilePath();
    }
    getLogLevel() {
        const level = process.env.NEXA_LOG_LEVEL?.toLowerCase();
        return level && ['debug', 'info', 'warn', 'error'].includes(level) ? level : 'info';
    }
    getLogFilePath() {
        const logDir = process.env.NEXA_LOG_DIR || path_1.default.join(os_1.default.homedir(), '.nexa', 'logs');
        return path_1.default.join(logDir, 'cli.log');
    }
    shouldLog(level) {
        const levels = {
            debug: 0,
            info: 1,
            warn: 2,
            error: 3
        };
        return levels[level] >= levels[this.logLevel];
    }
    formatTimestamp() {
        return new Date().toISOString();
    }
    formatMessage(level, message, data) {
        const timestamp = new Date().toLocaleTimeString();
        const levelColors = {
            debug: chalk_1.default.gray,
            info: chalk_1.default.blue,
            warn: chalk_1.default.yellow,
            error: chalk_1.default.red
        };
        const coloredLevel = levelColors[level](level.toUpperCase().padEnd(5));
        const coloredContext = chalk_1.default.cyan(`[${this.context}]`);
        let formattedMessage = `${chalk_1.default.gray(timestamp)} ${coloredLevel} ${coloredContext} ${message}`;
        if (data && Object.keys(data).length > 0) {
            formattedMessage += '\n' + this.formatData(data);
        }
        return formattedMessage;
    }
    formatData(data) {
        const formatted = Object.entries(data)
            .map(([key, value]) => {
            let formattedValue;
            if (value instanceof Error) {
                formattedValue = `${value.message}\n${value.stack}`;
            }
            else if (typeof value === 'object') {
                try {
                    formattedValue = JSON.stringify(value, null, 2);
                }
                catch {
                    formattedValue = '[Circular or unserializable object]';
                }
            }
            else {
                formattedValue = String(value);
            }
            return `  ${chalk_1.default.gray(key)}: ${formattedValue}`;
        })
            .join('\n');
        return formatted;
    }
    async writeToFile(entry) {
        if (!this.logToFile)
            return;
        try {
            // Ensure log directory exists
            await fs_extra_1.default.ensureDir(path_1.default.dirname(this.logFilePath));
            // Format log entry for file
            const fileEntry = JSON.stringify(entry) + '\n';
            // Append to log file
            await fs_extra_1.default.appendFile(this.logFilePath, fileEntry);
        }
        catch (error) {
            // Don't throw errors from logging itself
            console.error('Failed to write to log file:', error);
        }
    }
    async log(level, message, data, error) {
        if (!this.shouldLog(level))
            return;
        const entry = {
            timestamp: this.formatTimestamp(),
            level,
            context: this.context,
            message,
            data,
            error
        };
        // Console output
        const formattedMessage = this.formatMessage(level, message, data);
        if (level === 'error') {
            console.error(formattedMessage);
            if (error?.stack) {
                console.error(chalk_1.default.gray(error.stack));
            }
        }
        else if (level === 'warn') {
            console.warn(formattedMessage);
        }
        else {
            console.log(formattedMessage);
        }
        // File output
        await this.writeToFile(entry);
    }
    debug(message, data) {
        this.log('debug', message, data);
    }
    info(message, data) {
        this.log('info', message, data);
    }
    warn(message, data) {
        this.log('warn', message, data);
    }
    error(message, data) {
        const error = data && 'error' in data ? data.error : undefined;
        const cleanData = data && 'error' in data ?
            Object.fromEntries(Object.entries(data).filter(([key]) => key !== 'error')) :
            data;
        this.log('error', message, cleanData, error);
    }
    /**
     * Create a child logger with additional context
     */
    child(subContext) {
        return new Logger(`${this.context}:${subContext}`);
    }
    /**
     * Start a performance timer
     */
    time(label) {
        const start = process.hrtime.bigint();
        return () => {
            const end = process.hrtime.bigint();
            const duration = Number(end - start) / 1000000; // Convert to milliseconds
            this.debug(`Timer [${label}]`, { duration: `${duration.toFixed(2)}ms` });
        };
    }
    /**
     * Log with performance timing
     */
    async withTiming(label, operation) {
        const timer = this.time(label);
        try {
            this.debug(`Starting ${label}`);
            const result = await operation();
            timer();
            this.debug(`Completed ${label}`);
            return result;
        }
        catch (error) {
            timer();
            this.error(`Failed ${label}`, { error: error });
            throw error;
        }
    }
    /**
     * Clear log file
     */
    async clearLogFile() {
        try {
            if (await fs_extra_1.default.pathExists(this.logFilePath)) {
                await fs_extra_1.default.remove(this.logFilePath);
                this.info('Log file cleared');
            }
        }
        catch (error) {
            this.error('Failed to clear log file', { error: error });
        }
    }
    /**
     * Get log file contents
     */
    async getLogFileContents() {
        try {
            if (!await fs_extra_1.default.pathExists(this.logFilePath)) {
                return [];
            }
            const content = await fs_extra_1.default.readFile(this.logFilePath, 'utf8');
            const lines = content.trim().split('\n').filter(Boolean);
            return lines.map(line => {
                try {
                    return JSON.parse(line);
                }
                catch {
                    // Handle malformed log entries
                    return {
                        timestamp: new Date().toISOString(),
                        level: 'error',
                        context: 'logger',
                        message: 'Malformed log entry',
                        data: { originalLine: line }
                    };
                }
            });
        }
        catch (error) {
            this.error('Failed to read log file', { error: error });
            return [];
        }
    }
    /**
     * Get statistics about logging
     */
    async getLogStats() {
        try {
            const entries = await this.getLogFileContents();
            const stats = {
                totalEntries: entries.length,
                byLevel: {
                    debug: 0,
                    info: 0,
                    warn: 0,
                    error: 0
                },
                fileSize: 0,
                oldestEntry: undefined,
                newestEntry: undefined
            };
            if (entries.length === 0)
                return stats;
            // Count by level
            entries.forEach(entry => {
                stats.byLevel[entry.level]++;
            });
            // Get file size
            if (await fs_extra_1.default.pathExists(this.logFilePath)) {
                const fileStat = await fs_extra_1.default.stat(this.logFilePath);
                stats.fileSize = fileStat.size;
            }
            // Get date range
            const timestamps = entries.map(entry => new Date(entry.timestamp)).sort((a, b) => a.getTime() - b.getTime());
            stats.oldestEntry = timestamps[0];
            stats.newestEntry = timestamps[timestamps.length - 1];
            return stats;
        }
        catch (error) {
            this.error('Failed to get log stats', { error: error });
            return {
                totalEntries: 0,
                byLevel: { debug: 0, info: 0, warn: 0, error: 0 },
                fileSize: 0
            };
        }
    }
}
exports.Logger = Logger;
//# sourceMappingURL=logger.js.map