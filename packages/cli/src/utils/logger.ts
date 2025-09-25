/**
 * Logger - Structured logging utility for the CLI
 */

import chalk from 'chalk'
import fs from 'fs-extra'
import path from 'path'
import os from 'os'

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogEntry {
  timestamp: string
  level: LogLevel
  context: string
  message: string
  data?: Record<string, any>
  error?: Error
}

export class Logger {
  private context: string
  private logLevel: LogLevel
  private logToFile: boolean
  private logFilePath: string

  constructor(context: string) {
    this.context = context
    this.logLevel = this.getLogLevel()
    this.logToFile = process.env.NEXA_LOG_FILE === 'true'
    this.logFilePath = this.getLogFilePath()
  }

  private getLogLevel(): LogLevel {
    const level = process.env.NEXA_LOG_LEVEL?.toLowerCase() as LogLevel
    return level && ['debug', 'info', 'warn', 'error'].includes(level) ? level : 'info'
  }

  private getLogFilePath(): string {
    const logDir = process.env.NEXA_LOG_DIR || path.join(os.homedir(), '.nexa', 'logs')
    return path.join(logDir, 'cli.log')
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    }
    
    return levels[level] >= levels[this.logLevel]
  }

  private formatTimestamp(): string {
    return new Date().toISOString()
  }

  private formatMessage(level: LogLevel, message: string, data?: Record<string, any>): string {
    const timestamp = new Date().toLocaleTimeString()
    const levelColors: Record<LogLevel, (str: string) => string> = {
      debug: chalk.gray,
      info: chalk.blue,
      warn: chalk.yellow,
      error: chalk.red
    }

    const coloredLevel = levelColors[level](level.toUpperCase().padEnd(5))
    const coloredContext = chalk.cyan(`[${this.context}]`)
    
    let formattedMessage = `${chalk.gray(timestamp)} ${coloredLevel} ${coloredContext} ${message}`

    if (data && Object.keys(data).length > 0) {
      formattedMessage += '\n' + this.formatData(data)
    }

    return formattedMessage
  }

  private formatData(data: Record<string, any>): string {
    const formatted = Object.entries(data)
      .map(([key, value]) => {
        let formattedValue: string
        
        if (value instanceof Error) {
          formattedValue = `${value.message}\n${value.stack}`
        } else if (typeof value === 'object') {
          try {
            formattedValue = JSON.stringify(value, null, 2)
          } catch {
            formattedValue = '[Circular or unserializable object]'
          }
        } else {
          formattedValue = String(value)
        }
        
        return `  ${chalk.gray(key)}: ${formattedValue}`
      })
      .join('\n')
    
    return formatted
  }

  private async writeToFile(entry: LogEntry): Promise<void> {
    if (!this.logToFile) return

    try {
      // Ensure log directory exists
      await fs.ensureDir(path.dirname(this.logFilePath))
      
      // Format log entry for file
      const fileEntry = JSON.stringify(entry) + '\n'
      
      // Append to log file
      await fs.appendFile(this.logFilePath, fileEntry)
    } catch (error) {
      // Don't throw errors from logging itself
      console.error('Failed to write to log file:', error)
    }
  }

  private async log(level: LogLevel, message: string, data?: Record<string, any>, error?: Error): Promise<void> {
    if (!this.shouldLog(level)) return

    const entry: LogEntry = {
      timestamp: this.formatTimestamp(),
      level,
      context: this.context,
      message,
      data,
      error
    }

    // Console output
    const formattedMessage = this.formatMessage(level, message, data)
    
    if (level === 'error') {
      console.error(formattedMessage)
      if (error?.stack) {
        console.error(chalk.gray(error.stack))
      }
    } else if (level === 'warn') {
      console.warn(formattedMessage)
    } else {
      console.log(formattedMessage)
    }

    // File output
    await this.writeToFile(entry)
  }

  debug(message: string, data?: Record<string, any>): void {
    this.log('debug', message, data)
  }

  info(message: string, data?: Record<string, any>): void {
    this.log('info', message, data)
  }

  warn(message: string, data?: Record<string, any>): void {
    this.log('warn', message, data)
  }

  error(message: string, data?: Record<string, any> | { error?: Error }): void {
    const error = data && 'error' in data ? data.error : undefined
    const cleanData = data && 'error' in data ? 
      Object.fromEntries(Object.entries(data).filter(([key]) => key !== 'error')) : 
      data
    
    this.log('error', message, cleanData, error)
  }

  /**
   * Create a child logger with additional context
   */
  child(subContext: string): Logger {
    return new Logger(`${this.context}:${subContext}`)
  }

  /**
   * Start a performance timer
   */
  time(label: string): () => void {
    const start = process.hrtime.bigint()
    
    return () => {
      const end = process.hrtime.bigint()
      const duration = Number(end - start) / 1_000_000 // Convert to milliseconds
      this.debug(`Timer [${label}]`, { duration: `${duration.toFixed(2)}ms` })
    }
  }

  /**
   * Log with performance timing
   */
  async withTiming<T>(label: string, operation: () => Promise<T>): Promise<T> {
    const timer = this.time(label)
    try {
      this.debug(`Starting ${label}`)
      const result = await operation()
      timer()
      this.debug(`Completed ${label}`)
      return result
    } catch (error) {
      timer()
      this.error(`Failed ${label}`, { error: error as Error })
      throw error
    }
  }

  /**
   * Clear log file
   */
  async clearLogFile(): Promise<void> {
    try {
      if (await fs.pathExists(this.logFilePath)) {
        await fs.remove(this.logFilePath)
        this.info('Log file cleared')
      }
    } catch (error) {
      this.error('Failed to clear log file', { error: error as Error })
    }
  }

  /**
   * Get log file contents
   */
  async getLogFileContents(): Promise<LogEntry[]> {
    try {
      if (!await fs.pathExists(this.logFilePath)) {
        return []
      }

      const content = await fs.readFile(this.logFilePath, 'utf8')
      const lines = content.trim().split('\n').filter(Boolean)
      
      return lines.map(line => {
        try {
          return JSON.parse(line) as LogEntry
        } catch {
          // Handle malformed log entries
          return {
            timestamp: new Date().toISOString(),
            level: 'error' as LogLevel,
            context: 'logger',
            message: 'Malformed log entry',
            data: { originalLine: line }
          }
        }
      })
    } catch (error) {
      this.error('Failed to read log file', { error: error as Error })
      return []
    }
  }

  /**
   * Get statistics about logging
   */
  async getLogStats(): Promise<{
    totalEntries: number
    byLevel: Record<LogLevel, number>
    fileSize: number
    oldestEntry?: Date
    newestEntry?: Date
  }> {
    try {
      const entries = await this.getLogFileContents()
      
      const stats = {
        totalEntries: entries.length,
        byLevel: {
          debug: 0,
          info: 0,
          warn: 0,
          error: 0
        } as Record<LogLevel, number>,
        fileSize: 0,
        oldestEntry: undefined as Date | undefined,
        newestEntry: undefined as Date | undefined
      }

      if (entries.length === 0) return stats

      // Count by level
      entries.forEach(entry => {
        stats.byLevel[entry.level]++
      })

      // Get file size
      if (await fs.pathExists(this.logFilePath)) {
        const fileStat = await fs.stat(this.logFilePath)
        stats.fileSize = fileStat.size
      }

      // Get date range
      const timestamps = entries.map(entry => new Date(entry.timestamp)).sort((a, b) => a.getTime() - b.getTime())
      stats.oldestEntry = timestamps[0]
      stats.newestEntry = timestamps[timestamps.length - 1]

      return stats
    } catch (error) {
      this.error('Failed to get log stats', { error: error as Error })
      return {
        totalEntries: 0,
        byLevel: { debug: 0, info: 0, warn: 0, error: 0 },
        fileSize: 0
      }
    }
  }
}