/**
 * Logger - Structured logging utility for the CLI
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export interface LogEntry {
    timestamp: string;
    level: LogLevel;
    context: string;
    message: string;
    data?: Record<string, any>;
    error?: Error;
}
export declare class Logger {
    private context;
    private logLevel;
    private logToFile;
    private logFilePath;
    constructor(context: string);
    private getLogLevel;
    private getLogFilePath;
    private shouldLog;
    private formatTimestamp;
    private formatMessage;
    private formatData;
    private writeToFile;
    private log;
    debug(message: string, data?: Record<string, any>): void;
    info(message: string, data?: Record<string, any>): void;
    warn(message: string, data?: Record<string, any>): void;
    error(message: string, data?: Record<string, any> | {
        error?: Error;
    }): void;
    /**
     * Create a child logger with additional context
     */
    child(subContext: string): Logger;
    /**
     * Start a performance timer
     */
    time(label: string): () => void;
    /**
     * Log with performance timing
     */
    withTiming<T>(label: string, operation: () => Promise<T>): Promise<T>;
    /**
     * Clear log file
     */
    clearLogFile(): Promise<void>;
    /**
     * Get log file contents
     */
    getLogFileContents(): Promise<LogEntry[]>;
    /**
     * Get statistics about logging
     */
    getLogStats(): Promise<{
        totalEntries: number;
        byLevel: Record<LogLevel, number>;
        fileSize: number;
        oldestEntry?: Date;
        newestEntry?: Date;
    }>;
}
//# sourceMappingURL=logger.d.ts.map