import pino from 'pino'

export const serverLogger = pino({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  transport: process.env.NODE_ENV === 'production' ? undefined : { target: 'pino-pretty' },
})

export function clientLogger(ns: string) {
  return {
    debug: (...args: unknown[]) => console.debug(`[${ns}]`, ...args),
    info: (...args: unknown[]) => console.info(`[${ns}]`, ...args),
    warn: (...args: unknown[]) => console.warn(`[${ns}]`, ...args),
    error: (...args: unknown[]) => console.error(`[${ns}]`, ...args),
  }
}
